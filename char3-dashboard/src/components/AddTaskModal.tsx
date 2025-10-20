'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { colors, typography } from '@/styles/theme';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskData) => Promise<void>;
  allBoardsData: any;
}

export interface TaskData {
  title: string;
  description: string;
  client: string;
  project: string;
  milestone: string;
  effort: string;
  assignee: string;
  label: string; // This will be the label ID
  board: string;
}

export function AddTaskModal({ open, onClose, onSubmit, allBoardsData }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskData>({
    title: '',
    description: '',
    client: '',
    project: '',
    milestone: '',
    effort: '',
    assignee: '',
    label: '',
    board: ''
  });

  const [errors, setErrors] = useState<{ title?: string; board?: string }>({});


  // Helper function to extract custom field value
  const extractCustomFieldValue = (card: any, boardData: any, fieldName: string) => {
    const customField = boardData?.customFields?.find((cf: any) => cf.name === fieldName);
    if (!customField) return '';
    const fieldItem = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === customField.id);
    if (!fieldItem) return '';
    
    // Check for text value first
    if (fieldItem.value?.text) return fieldItem.value.text;
    if (fieldItem.value) return fieldItem.value;
    
    // Check for dropdown/select field (idValue)
    if (fieldItem.idValue && customField.options) {
      const option = customField.options.find((opt: any) => opt.id === fieldItem.idValue);
      return option?.value?.text || '';
    }
    
    return '';
  };

  // Get unique values from boards
  const boards = [
    { id: allBoardsData?.accountManagement?.boardId, name: 'Account Management' },
    { id: allBoardsData?.designUx?.boardId, name: 'Design/UX' },
    { id: allBoardsData?.development?.boardId, name: 'Development' }
  ].filter(b => b.id);

  // Get the selected board data
  const selectedBoardData = 
    formData.board === allBoardsData?.accountManagement?.boardId ? allBoardsData.accountManagement :
    formData.board === allBoardsData?.designUx?.boardId ? allBoardsData.designUx :
    formData.board === allBoardsData?.development?.boardId ? allBoardsData.development :
    null;

  // Extract clients from the selected board only
  const clientOptionsMap = new Map<string, string>(); // text -> id
  if (selectedBoardData) {
    const clientField = selectedBoardData.customFields?.find((cf: any) => cf.name === 'Client');
    if (clientField?.options) {
      clientField.options.forEach((opt: any) => {
        if (opt.value?.text) {
          clientOptionsMap.set(opt.value.text, opt.id);
        }
      });
    }
  }
  const clients = Array.from(clientOptionsMap.keys()).sort();

  // Extract projects from the selected board only
  const projectOptionsMap = new Map<string, string>(); // text -> id
  if (selectedBoardData) {
    const projectField = selectedBoardData.customFields?.find((cf: any) => cf.name === 'Project');
    if (projectField?.options) {
      projectField.options.forEach((opt: any) => {
        if (opt.value?.text) {
          projectOptionsMap.set(opt.value.text, opt.id);
        }
      });
    }
  }
  const projects = Array.from(projectOptionsMap.keys()).sort();

  // Extract milestones from all boards
  const milestonesSet = new Set<string>();
  [allBoardsData?.accountManagement, allBoardsData?.designUx, allBoardsData?.development].forEach(boardData => {
    boardData?.cards?.forEach((card: any) => {
      const milestone = extractCustomFieldValue(card, boardData, 'Milestone');
      if (milestone) milestonesSet.add(milestone);
    });
  });
  const milestones = Array.from(milestonesSet).sort();

  // Get all unique workspace members from all boards
  const membersMap = new Map<string, any>();
  [allBoardsData?.accountManagement, allBoardsData?.designUx, allBoardsData?.development].forEach(boardData => {
    boardData?.members?.forEach((member: any) => {
      if (member.fullName && !membersMap.has(member.id)) {
        membersMap.set(member.id, member);
      }
    });
  });
  const assignees = Array.from(membersMap.values())
    .map((m: any) => m.fullName)
    .sort();

  // Extract effort values from the selected board only
  const effortOptionsMap = new Map<string, string>(); // text -> id
  if (selectedBoardData) {
    const effortField = selectedBoardData.customFields?.find((cf: any) => cf.name === 'Effort');
    if (effortField?.options) {
      effortField.options.forEach((opt: any) => {
        if (opt.value?.text) {
          // Store the text as key and the id as value
          effortOptionsMap.set(opt.value.text, opt.id);
        }
      });
    }
  }
  
  // Custom sort order for effort: XS, S, M, L, XL
  const effortOrder = ['XS', 'S', 'M', 'L', 'XL'];
  const effortOptions = Array.from(effortOptionsMap.keys()).sort((a, b) => {
    const indexA = effortOrder.indexOf(a);
    const indexB = effortOrder.indexOf(b);
    
    // If both are in the custom order, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in the custom order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in the custom order, sort alphabetically
    return a.localeCompare(b);
  });

  // Extract labels from all boards (store full label objects)
  const labelsMap = new Map<string, any>();
  [allBoardsData?.accountManagement, allBoardsData?.designUx, allBoardsData?.development].forEach(boardData => {
    boardData?.labels?.forEach((label: any) => {
      if (label.name && !labelsMap.has(label.name)) {
        labelsMap.set(label.name, label);
      }
    });
  });
  const labels = Array.from(labelsMap.values()).sort((a, b) => a.name.localeCompare(b.name));


  const handleChange = (field: keyof TaskData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as 'title' | 'board']) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const newErrors: { title?: string; board?: string } = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.board) {
      newErrors.board = 'Board is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        client: '',
        project: '',
        milestone: '',
        effort: '',
        assignee: '',
        label: '',
        board: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        client: '',
        project: '',
        milestone: '',
        effort: '',
        assignee: '',
        label: '',
        board: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.7)'
          }
        }
      }}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colors.text.title, 
        fontSize: '1.125rem',
        fontWeight: typography.fontWeights.semibold,
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        pb: 2
      }}>
        Add New Task
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
          {/* Title */}
          <TextField
            label="Title"
            required
            fullWidth
            size="small"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            sx={{
              '& .MuiInputLabel-root': { color: colors.text.secondary },
              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
              '& .MuiOutlinedInput-root': {
                color: colors.text.primary,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
              }
            }}
          />

          {/* Description */}
          <TextField
            label="Description"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: colors.text.secondary },
              '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
              '& .MuiOutlinedInput-root': {
                color: colors.text.primary,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
              }
            }}
          />

          {/* Board */}
          <Box>
            <Autocomplete
              options={boards}
              getOptionLabel={(option) => option.name}
              value={boards.find(b => b.id === formData.board) || null}
              onChange={(_, newValue) => handleChange('board', newValue?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Board"
                  required
                  error={!!errors.board}
                  helperText={errors.board}
                  sx={{
                    '& .MuiInputLabel-root': { color: colors.text.secondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                    '& .MuiOutlinedInput-root': {
                      color: colors.text.primary,
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                      '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                    }
                  }}
                />
              )}
              sx={{
                '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
                '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
              }}
              ListboxProps={{
                sx: {
                  bgcolor: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '& .MuiAutocomplete-option': {
                    color: colors.text.primary,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                    '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                  }
                }
              }}
            />
          </Box>

          {/* Client */}
          <Autocomplete
            options={clients}
            value={clients.find(c => clientOptionsMap.get(c) === formData.client) || null}
            onChange={(_, newValue) => handleChange('client', newValue ? clientOptionsMap.get(newValue) || '' : '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                  }
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
              '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
            }}
            ListboxProps={{
              sx: {
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiAutocomplete-option': {
                  color: colors.text.primary,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                }
              }
            }}
          />

          {/* Project */}
          <Autocomplete
            options={projects}
            value={projects.find(p => projectOptionsMap.get(p) === formData.project) || null}
            onChange={(_, newValue) => handleChange('project', newValue ? projectOptionsMap.get(newValue) || '' : '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Project"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                  }
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
              '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
            }}
            ListboxProps={{
              sx: {
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiAutocomplete-option': {
                  color: colors.text.primary,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                }
              }
            }}
          />

          {/* Milestone */}
          <Autocomplete
            freeSolo
            options={milestones}
            value={formData.milestone || null}
            onChange={(_, newValue) => handleChange('milestone', newValue || '')}
            onInputChange={(_, newInputValue) => handleChange('milestone', newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Milestone"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                  }
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
              '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
            }}
            ListboxProps={{
              sx: {
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiAutocomplete-option': {
                  color: colors.text.primary,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                }
              }
            }}
          />

          {/* Effort */}
          <Autocomplete
            options={effortOptions}
            value={effortOptions.find(e => effortOptionsMap.get(e) === formData.effort) || null}
            onChange={(_, newValue) => handleChange('effort', newValue ? effortOptionsMap.get(newValue) || '' : '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Effort"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                  }
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
              '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
            }}
            ListboxProps={{
              sx: {
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiAutocomplete-option': {
                  color: colors.text.primary,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                }
              }
            }}
          />

          {/* Assignee */}
          <Autocomplete
            options={assignees}
            value={formData.assignee || null}
            onChange={(_, newValue) => handleChange('assignee', newValue || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assignee"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                  }
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
              '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
            }}
            ListboxProps={{
              sx: {
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiAutocomplete-option': {
                  color: colors.text.primary,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                }
              }
            }}
          />

          {/* Label */}
          <Autocomplete
            options={labels}
            getOptionLabel={(option) => option.name}
            value={labels.find(l => l.id === formData.label) || null}
            onChange={(_, newValue) => handleChange('label', newValue?.id || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Label"
                sx={{
                  '& .MuiInputLabel-root': { color: colors.text.secondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent.orange },
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.primary,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                  }
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colors.text.secondary },
              '& .MuiAutocomplete-clearIndicator': { color: colors.text.secondary }
            }}
            ListboxProps={{
              sx: {
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiAutocomplete-option': {
                  color: colors.text.primary,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                }
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          size="small"
          sx={{ 
            color: colors.text.secondary,
            textTransform: 'none',
            fontSize: '0.875rem',
            px: 2,
            py: 0.75,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          size="small"
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
            textTransform: 'none',
            fontSize: '0.875rem',
            px: 2,
            py: 0.75,
            '&:hover': { bgcolor: '#45a049' },
            '&:disabled': { bgcolor: 'rgba(76, 175, 80, 0.3)', color: 'rgba(255, 255, 255, 0.3)' }
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

