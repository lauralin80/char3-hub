'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { trelloService } from '@/services/trelloService';
import { supabase } from '@/lib/supabase';
import { colors, typography, transitions } from '@/styles/theme';

interface ProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
  userToken: string;
  clientName: string;
  allBoardsData: any;
}

const steps = ['Project Details', 'Deliverables', 'Milestones'];

interface Deliverable {
  name: string;
  description: string;
  dueDate: string;
}

interface Milestone {
  name: string;
  description: string;
  dueDate: string;
}

const inputStyles = {
  '& .MuiInputLabel-root': {
    color: colors.text.secondary,
    fontSize: '0.875rem',
    '&.Mui-focused': { color: colors.accent.orange }
  },
  '& .MuiOutlinedInput-root': {
    color: colors.text.primary,
    fontSize: '0.875rem',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.08)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.16)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent.orange }
  },
  '& .MuiInputBase-input::placeholder': {
    color: colors.text.tertiary,
    opacity: 1
  }
};

export default function ProjectWizard({ open, onClose, onProjectCreated, userToken, clientName, allBoardsData }: ProjectWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

  // Step 1: Project Details
  const [projectType, setProjectType] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');

  // Step 2: Deliverables
  const [deliverables, setDeliverables] = useState<Deliverable[]>([{ name: '', description: '', dueDate: '' }]);

  // Step 3: Milestones
  const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', description: '', dueDate: '' }]);
  const [skipMilestones, setSkipMilestones] = useState(false);

  useEffect(() => {
    if (open && allBoardsData) {
      loadProjectOptionsFromCache();
    }
  }, [open, allBoardsData]);

  const loadProjectOptionsFromCache = () => {
    try {
      const accountMgmtBoard = allBoardsData.accountManagement;
      const projectField = accountMgmtBoard?.customFields?.find((cf: any) => cf.name === 'Project');
      
      if (projectField?.options) {
        const options = projectField.options
          .map((opt: any) => opt.value?.text)
          .filter((text: string) => text)
          .sort();
        setProjectOptions(options);
      } else {
        setProjectOptions([]);
      }
    } catch (error) {
      console.error('Error loading project options from cache:', error);
      setProjectOptions([]);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddDeliverable = () => {
    setDeliverables([...deliverables, { name: '', description: '', dueDate: '' }]);
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleDeliverableChange = (index: number, field: 'name' | 'description' | 'dueDate', value: string) => {
    const updated = [...deliverables];
    updated[index][field] = value;
    setDeliverables(updated);
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { name: '', description: '', dueDate: '' }]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: 'name' | 'description' | 'dueDate', value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleCreateProject = async () => {
    try {
      setLoading(true);

      // Create project in Supabase
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectType, // Use project type as the name
          client_name: clientName,
          project_type: projectType,
          description: projectDescription,
          status: 'not_started',
          start_date: projectStartDate || null,
          end_date: projectEndDate || null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create deliverables as Trello cards
      // Get the Account Management board ID from cached data
      const accountMgmtBoard = allBoardsData?.accountManagement;
      if (!accountMgmtBoard) {
        throw new Error('Account Management board not found');
      }
      
      const accountMgmtBoardId = accountMgmtBoard.boardId;
      const deliverablesListId = accountMgmtBoard.lists.find((l: any) => l.name === '📦 Deliverables')?.id;
      
      if (!deliverablesListId) {
        throw new Error('Deliverables list not found on Account Management board');
      }

      for (const deliverable of deliverables.filter(d => d.name.trim())) {
        await trelloService.createCard(
          {
            title: deliverable.name,
            description: deliverable.description,
            boardId: accountMgmtBoardId,
            listId: deliverablesListId,
            client: clientName,
            project: projectType,
            dueDate: deliverable.dueDate || undefined,
          },
          userToken
        );
      }

      // Create milestones
      if (!skipMilestones) {
        for (const milestone of milestones.filter(m => m.name.trim())) {
          await supabase.from('schedule_items').insert({
            project_id: project.id,
            name: milestone.name,
            item_type: 'milestone',
            end_date: milestone.dueDate || null,
            percent_complete: 0,
          });
        }
      }

      onProjectCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating project:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Failed to create project: ${errorMessage}\n\nPlease check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setProjectType('');
    setProjectDescription('');
    setProjectStartDate('');
    setProjectEndDate('');
    setDeliverables([{ name: '', description: '', dueDate: '' }]);
    setMilestones([{ name: '', description: '', dueDate: '' }]);
    setSkipMilestones(false);
    onClose();
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return projectType.trim().length > 0;
      case 1:
        return deliverables.some(d => d.name.trim());
      case 2:
        return skipMilestones || milestones.some(m => m.name.trim());
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography sx={{ 
              color: colors.text.primary, 
              fontSize: '0.9375rem',
              fontWeight: typography.fontWeights.medium,
              mb: 3
            }}>
              What type of project is this for {clientName}?
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ 
                color: colors.text.secondary,
                fontSize: '0.875rem',
                '&.Mui-focused': { color: colors.accent.orange }
              }}>
                Project Type
              </InputLabel>
              <Select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                label="Project Type"
                sx={{
                  color: colors.text.primary,
                  fontSize: '0.875rem',
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
                        fontSize: '0.875rem',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' },
                        '&.Mui-selected': { bgcolor: 'rgba(255, 107, 53, 0.16)' }
                      }
                    }
                  }
                }}
              >
                {projectOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography sx={{ 
              color: colors.text.primary, 
              fontSize: '0.9375rem',
              fontWeight: typography.fontWeights.medium,
              mb: 2,
              mt: 2
            }}>
              If you know the start and end dates for the project, you can enter them now.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <DatePicker
                label="Start Date (optional)"
                value={projectStartDate ? dayjs(projectStartDate) : null}
                onChange={(newValue) => setProjectStartDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputLabelProps: {
                      sx: {
                        color: colors.text.secondary,
                        fontSize: '0.875rem',
                        '&.Mui-focused': { color: colors.accent.orange }
                      }
                    },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        color: colors.text.primary,
                        fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'rgba(255, 255, 255, 0.2) !important'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'rgba(255, 255, 255, 0.3) !important'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          borderColor: `${colors.accent.orange} !important`
                        }
                      },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                  },
                  popper: {
                    sx: {
                      '& .MuiPaper-root': {
                        bgcolor: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        '& .MuiPickersDay-root': {
                          color: colors.text.primary,
                          '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.08)' },
                          '&.Mui-selected': { 
                            bgcolor: colors.accent.orange,
                            '&:hover': { bgcolor: colors.accent.orange }
                          }
                        },
                        '& .MuiPickersCalendarHeader-root': { color: colors.text.primary },
                        '& .MuiDayCalendar-weekDayLabel': { color: colors.text.secondary }
                      }
                    }
                  }
                }}
              />
              <DatePicker
                label="End Date (optional)"
                value={projectEndDate ? dayjs(projectEndDate) : null}
                onChange={(newValue) => setProjectEndDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputLabelProps: {
                      sx: {
                        color: colors.text.secondary,
                        fontSize: '0.875rem',
                        '&.Mui-focused': { color: colors.accent.orange }
                      }
                    },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        color: colors.text.primary,
                        fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'rgba(255, 255, 255, 0.2) !important'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': { 
                          borderColor: 'rgba(255, 255, 255, 0.3) !important'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                          borderColor: `${colors.accent.orange} !important`
                        }
                      },
                      '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }
                  },
                  popper: {
                    sx: {
                      '& .MuiPaper-root': {
                        bgcolor: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        '& .MuiPickersDay-root': {
                          color: colors.text.primary,
                          '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.08)' },
                          '&.Mui-selected': { 
                            bgcolor: colors.accent.orange,
                            '&:hover': { bgcolor: colors.accent.orange }
                          }
                        },
                        '& .MuiPickersCalendarHeader-root': { color: colors.text.primary },
                        '& .MuiDayCalendar-weekDayLabel': { color: colors.text.secondary }
                      }
                    }
                  }
                }}
              />
            </Box>
            <Typography sx={{ 
              color: colors.text.primary, 
              fontSize: '0.9375rem',
              fontWeight: typography.fontWeights.medium,
              mb: 2,
              mt: 2
            }}>
              Add any additional details about the project.
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Description (optional)"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              multiline
              rows={2}
              sx={inputStyles}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography sx={{ 
              color: colors.text.primary, 
              fontSize: '0.9375rem',
              fontWeight: typography.fontWeights.medium,
              mb: 3
            }}>
              What deliverables are part of this project?
            </Typography>
            {deliverables.map((deliverable, index) => (
              <Box key={index} sx={{ 
                mb: 2, 
                p: 2, 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '6px',
                bgcolor: 'rgba(255, 255, 255, 0.02)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Deliverable Name"
                    value={deliverable.name}
                    onChange={(e) => handleDeliverableChange(index, 'name', e.target.value)}
                    required
                    sx={inputStyles}
                  />
                  {deliverables.length > 1 && (
                    <IconButton 
                      onClick={() => handleRemoveDeliverable(index)} 
                      sx={{ 
                        color: colors.text.secondary,
                        '&:hover': { color: colors.accent.orange }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Description (optional)"
                  value={deliverable.description}
                  onChange={(e) => handleDeliverableChange(index, 'description', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ ...inputStyles, mb: 1.5 }}
                />
                <DatePicker
                  label="Due Date (optional)"
                  value={deliverable.dueDate ? dayjs(deliverable.dueDate) : null}
                  onChange={(newValue) => handleDeliverableChange(index, 'dueDate', newValue ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      InputLabelProps: {
                        sx: {
                          color: colors.text.secondary,
                          fontSize: '0.875rem',
                          '&.Mui-focused': { color: colors.accent.orange }
                        }
                      },
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          color: colors.text.primary,
                          fontSize: '0.875rem',
                          '& .MuiOutlinedInput-notchedOutline': { 
                            borderColor: 'rgba(255, 255, 255, 0.2) !important'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': { 
                            borderColor: 'rgba(255, 255, 255, 0.3) !important'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                            borderColor: `${colors.accent.orange} !important`
                          }
                        },
                        '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          bgcolor: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          '& .MuiPickersDay-root': {
                            color: colors.text.primary,
                            '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.08)' },
                            '&.Mui-selected': { 
                              bgcolor: colors.accent.orange,
                              '&:hover': { bgcolor: colors.accent.orange }
                            }
                          },
                          '& .MuiPickersCalendarHeader-root': { color: colors.text.primary },
                          '& .MuiDayCalendar-weekDayLabel': { color: colors.text.secondary }
                        }
                      }
                    }
                  }}
                />
              </Box>
            ))}
            <Button 
              startIcon={<AddIcon />} 
              onClick={handleAddDeliverable}
              sx={{
                color: colors.accent.orange,
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.08)' }
              }}
            >
              Add Another Deliverable
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography sx={{ 
              color: colors.text.primary, 
              fontSize: '0.9375rem',
              fontWeight: typography.fontWeights.medium,
              mb: 3
            }}>
              Would you like to add project milestones?
            </Typography>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={skipMilestones} 
                  onChange={(e) => setSkipMilestones(e.target.checked)}
                  sx={{
                    color: colors.text.secondary,
                    '&.Mui-checked': { color: colors.accent.orange }
                  }}
                />
              }
              label={
                <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
                  Skip milestones for now
                </Typography>
              }
              sx={{ mb: 2 }}
            />
            {!skipMilestones && (
              <>
                {milestones.map((milestone, index) => (
                  <Box key={index} sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '6px',
                    bgcolor: 'rgba(255, 255, 255, 0.02)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Milestone Name"
                        value={milestone.name}
                        onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                        required
                        sx={inputStyles}
                      />
                      {milestones.length > 1 && (
                        <IconButton 
                          onClick={() => handleRemoveMilestone(index)}
                          sx={{ 
                            color: colors.text.secondary,
                            '&:hover': { color: colors.accent.orange }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description (optional)"
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      multiline
                      rows={2}
                      sx={{ ...inputStyles, mb: 1.5 }}
                    />
                    <DatePicker
                      label="Due Date (optional)"
                      value={milestone.dueDate ? dayjs(milestone.dueDate) : null}
                      onChange={(newValue) => handleMilestoneChange(index, 'dueDate', newValue ? newValue.format('YYYY-MM-DD') : '')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          InputLabelProps: {
                            sx: {
                              color: colors.text.secondary,
                              fontSize: '0.875rem',
                              '&.Mui-focused': { color: colors.accent.orange }
                            }
                          },
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              color: colors.text.primary,
                              fontSize: '0.875rem',
                              '& .MuiOutlinedInput-notchedOutline': { 
                                borderColor: 'rgba(255, 255, 255, 0.2) !important'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': { 
                                borderColor: 'rgba(255, 255, 255, 0.3) !important'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                                borderColor: `${colors.accent.orange} !important`
                              }
                            },
                            '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
                          }
                        },
                        popper: {
                          sx: {
                            '& .MuiPaper-root': {
                              bgcolor: '#1a1a1a',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              '& .MuiPickersDay-root': {
                                color: colors.text.primary,
                                '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.08)' },
                                '&.Mui-selected': { 
                                  bgcolor: colors.accent.orange,
                                  '&:hover': { bgcolor: colors.accent.orange }
                                }
                              },
                              '& .MuiPickersCalendarHeader-root': { color: colors.text.primary },
                              '& .MuiDayCalendar-weekDayLabel': { color: colors.text.secondary }
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                ))}
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleAddMilestone}
                  sx={{
                    color: colors.accent.orange,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.08)' }
                  }}
                >
                  Add Another Milestone
                </Button>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(0, 0, 0, 0.7)' }
        }
      }}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography sx={{ 
          color: colors.text.title, 
          fontSize: '1.125rem',
          fontWeight: typography.fontWeights.semibold 
        }}>
          Create New Project
        </Typography>
        <IconButton 
          onClick={handleClose}
          disabled={loading}
          sx={{ 
            color: colors.text.secondary,
            '&:hover': { color: colors.text.primary }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Stepper 
          activeStep={activeStep}
          sx={{
            '& .MuiStepLabel-label': {
              color: colors.text.tertiary,
              fontSize: '0.8125rem',
              '&.Mui-active': { color: colors.accent.orange },
              '&.Mui-completed': { color: colors.text.secondary }
            },
            '& .MuiStepIcon-root': {
              color: 'rgba(255, 255, 255, 0.08)',
              '&.Mui-active': { color: colors.accent.orange },
              '&.Mui-completed': { color: colors.accent.orange }
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, minHeight: 300 }}>
        {renderStepContent()}
      </Box>

      {/* Actions */}
      <Box sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{
            color: colors.text.secondary,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' }
          }}
        >
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && (
            <Button 
              onClick={handleBack} 
              disabled={loading}
              sx={{
                color: colors.text.primary,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.04)' }
              }}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || loading}
              variant="contained"
              sx={{
                bgcolor: colors.accent.orange,
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: '#e8591d' },
                '&:disabled': { bgcolor: 'rgba(255, 107, 53, 0.3)', color: 'rgba(255, 255, 255, 0.5)' }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleCreateProject}
              disabled={!canProceed() || loading}
              variant="contained"
              sx={{
                bgcolor: colors.accent.orange,
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: '#e8591d' },
                '&:disabled': { bgcolor: 'rgba(255, 107, 53, 0.3)', color: 'rgba(255, 255, 255, 0.5)' }
              }}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
    </LocalizationProvider>
  );
}
