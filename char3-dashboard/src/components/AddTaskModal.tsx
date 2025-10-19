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
  CircularProgress
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
  label: string;
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

  // Get unique values from boards
  const boards = [
    { id: allBoardsData?.accountManagement?.id, name: 'Account Management' },
    { id: allBoardsData?.designUx?.id, name: 'Design/UX' },
    { id: allBoardsData?.development?.id, name: 'Development' }
  ].filter(b => b.id);

  const clients = Array.from(new Set([
    ...(allBoardsData?.accountManagement?.cards || []),
    ...(allBoardsData?.designUx?.cards || []),
    ...(allBoardsData?.development?.cards || [])
  ].map((card: any) => {
    const customFields = 
      allBoardsData?.accountManagement?.cards?.includes(card) ? allBoardsData?.accountManagement?.customFields :
      allBoardsData?.designUx?.cards?.includes(card) ? allBoardsData?.designUx?.customFields :
      allBoardsData?.development?.customFields || [];
    
    const clientField = customFields?.find((cf: any) => cf.name === 'Client');
    const clientItem = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === clientField?.id);
    return clientItem?.value?.text || clientItem?.value || '';
  }).filter(Boolean))).sort();

  const projects = Array.from(new Set([
    ...(allBoardsData?.accountManagement?.cards || []),
    ...(allBoardsData?.designUx?.cards || []),
    ...(allBoardsData?.development?.cards || [])
  ].map((card: any) => {
    const customFields = 
      allBoardsData?.accountManagement?.cards?.includes(card) ? allBoardsData?.accountManagement?.customFields :
      allBoardsData?.designUx?.cards?.includes(card) ? allBoardsData?.designUx?.customFields :
      allBoardsData?.development?.customFields || [];
    
    const projectField = customFields?.find((cf: any) => cf.name === 'Project');
    const projectItem = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === projectField?.id);
    return projectItem?.value?.text || projectItem?.value || '';
  }).filter(Boolean))).sort();

  const assignees = Array.from(new Set([
    ...(allBoardsData?.accountManagement?.cards || []),
    ...(allBoardsData?.designUx?.cards || []),
    ...(allBoardsData?.development?.cards || [])
  ].flatMap((card: any) => card.members?.map((m: any) => m.fullName) || []))).sort();

  const labels = Array.from(new Set([
    ...(allBoardsData?.accountManagement?.labels || []),
    ...(allBoardsData?.designUx?.labels || []),
    ...(allBoardsData?.development?.labels || [])
  ].map((label: any) => label.name).filter(Boolean))).sort();

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
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Title */}
          <TextField
            label="Title"
            required
            fullWidth
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
            multiline
            rows={3}
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
          <FormControl fullWidth required error={!!errors.board}>
            <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.accent.orange } }}>
              Board
            </InputLabel>
            <Select
              value={formData.board}
              onChange={(e) => handleChange('board', e.target.value)}
              label="Board"
              sx={{
                color: colors.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent.orange }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiMenuItem-root': {
                      color: colors.text.primary,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                    }
                  }
                }
              }}
            >
              {boards.map(board => (
                <MenuItem key={board.id} value={board.id}>{board.name}</MenuItem>
              ))}
            </Select>
            {errors.board && (
              <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, ml: 1.75 }}>
                {errors.board}
              </Typography>
            )}
          </FormControl>

          {/* Client */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.accent.orange } }}>
              Client
            </InputLabel>
            <Select
              value={formData.client}
              onChange={(e) => handleChange('client', e.target.value)}
              label="Client"
              sx={{
                color: colors.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent.orange }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiMenuItem-root': {
                      color: colors.text.primary,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">None</MenuItem>
              {clients.map(client => (
                <MenuItem key={client} value={client}>{client}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Project */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.accent.orange } }}>
              Project
            </InputLabel>
            <Select
              value={formData.project}
              onChange={(e) => handleChange('project', e.target.value)}
              label="Project"
              sx={{
                color: colors.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent.orange }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiMenuItem-root': {
                      color: colors.text.primary,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">None</MenuItem>
              {projects.map(project => (
                <MenuItem key={project} value={project}>{project}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Milestone */}
          <TextField
            label="Milestone"
            fullWidth
            value={formData.milestone}
            onChange={(e) => handleChange('milestone', e.target.value)}
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

          {/* Effort */}
          <TextField
            label="Effort"
            fullWidth
            value={formData.effort}
            onChange={(e) => handleChange('effort', e.target.value)}
            placeholder="e.g., 2h, 1d, etc."
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

          {/* Assignee */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.accent.orange } }}>
              Assignee
            </InputLabel>
            <Select
              value={formData.assignee}
              onChange={(e) => handleChange('assignee', e.target.value)}
              label="Assignee"
              sx={{
                color: colors.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent.orange }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiMenuItem-root': {
                      color: colors.text.primary,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">None</MenuItem>
              {assignees.map(assignee => (
                <MenuItem key={assignee} value={assignee}>{assignee}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Label */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.accent.orange } }}>
              Label
            </InputLabel>
            <Select
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              label="Label"
              sx={{
                color: colors.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent.orange }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiMenuItem-root': {
                      color: colors.text.primary,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">None</MenuItem>
              {labels.map(label => (
                <MenuItem key={label} value={label}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ 
            color: colors.text.secondary,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: '#4caf50',
            color: 'white',
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

