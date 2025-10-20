'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { trelloService } from '@/services/trelloService';
import { colors, typography, transitions } from '@/styles/theme';
import { useAllBoardsData } from '@/hooks/useAllBoardsData';
import ProjectWizard from '@/components/ProjectWizard';

export default function AccountManagement() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [accountTasks, setAccountTasks] = useState<any[]>([]);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  
  // Use global cached data
  const { data: allBoardsData, loading: boardsLoading, error: boardsError } = useAllBoardsData();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/signin');
    }
  }, [isAuthLoading, user, router]);

  // Extract client list from cached board data
  useEffect(() => {
    if (!allBoardsData) return;
    
    const accountMgmtBoard = allBoardsData.accountManagement;
    if (!accountMgmtBoard?.customFields) return;
    
    const clientField = accountMgmtBoard.customFields.find((cf: any) => cf.name === 'Client');
    if (!clientField?.options) return;
    
    const clientList = clientField.options
      .map((opt: any) => opt.value?.text)
      .filter((text: string) => text)
      .sort();
    
    setClients(clientList);
    setClientsLoading(false);
  }, [allBoardsData]);

  // Filter deliverables and tasks when client is selected
  useEffect(() => {
    if (!selectedClient || !allBoardsData?.accountManagement) {
      setDeliverables([]);
      setAccountTasks([]);
      return;
    }

    const accountMgmtBoard = allBoardsData.accountManagement;
    
    // Debug: Show all list names
    console.log('Available lists:', accountMgmtBoard.lists?.map((l: any) => l.name));
      
      // Helper function to extract custom field value
      const extractCustomFieldValue = (card: any, fieldName: string) => {
        if (!card) return '';
        const customField = accountMgmtBoard?.customFields?.find((cf: any) => cf.name === fieldName);
        if (!customField) return '';
        const fieldItem = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === customField.id);
        if (!fieldItem) return '';
        
        if (fieldItem.value?.text) return fieldItem.value.text;
        if (typeof fieldItem.value === 'string') return fieldItem.value;
        
        if (fieldItem.idValue && customField.options) {
          const option = customField.options.find((opt: any) => opt.id === fieldItem.idValue);
          return option?.value?.text || '';
        }
        
        return '';
      };
      
      // Get deliverables for this client (from Account Management board, Deliverables list)
      const deliverablesCards = (accountMgmtBoard.cards || []).filter((card: any) => {
        const cardClient = extractCustomFieldValue(card, 'Client');
        const list = accountMgmtBoard.lists?.find((l: any) => l.id === card.idList);
        const listName = list?.name || '';
        
        // Debug logging
        if (cardClient === selectedClient) {
          console.log('Card for client:', card.name, 'List:', listName, 'Client:', cardClient);
        }
        
        return cardClient === selectedClient && listName === '📦 Deliverables';
      });

      // Get account tasks for this client (from Account Management board, Account Tasks list)
      const accountTasksCards = (accountMgmtBoard.cards || []).filter((card: any) => {
        const cardClient = extractCustomFieldValue(card, 'Client');
        const list = accountMgmtBoard.lists?.find((l: any) => l.id === card.idList);
        const listName = list?.name || '';
        return cardClient === selectedClient && listName === '👥 Account Tasks';
      });

      // Enhance cards with additional info
      const enhanceCard = (card: any) => ({
        ...card,
        client: extractCustomFieldValue(card, 'Client'),
        project: extractCustomFieldValue(card, 'Project'),
        milestone: extractCustomFieldValue(card, 'Milestone'),
        effort: extractCustomFieldValue(card, 'Effort'),
        assignee: card.members?.[0]?.fullName || 'Unassigned',
        dueDate: card.due ? new Date(card.due) : null,
        labels: card.labels || []
      });

    setDeliverables(deliverablesCards.map(enhanceCard));
    setAccountTasks(accountTasksCards.map(enhanceCard));
  }, [selectedClient, allBoardsData]);

  const loading = clientsLoading || boardsLoading;
  const error = clientsError || boardsError;

  if (isAuthLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#0d0d0d',
        gap: 2
      }}>
        <CircularProgress size={40} sx={{ color: colors.accent.orange }} />
        <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', fontWeight: typography.fontWeights.medium }}>
          Authenticating...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#0d0d0d',
        gap: 2
      }}>
        <CircularProgress size={40} sx={{ color: colors.accent.orange }} />
        <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', fontWeight: typography.fontWeights.medium }}>
          Loading account management...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#0d0d0d',
        gap: 2
      }}>
        <Typography sx={{ color: colors.accent.orange, fontSize: '1rem', fontWeight: typography.fontWeights.semibold, mb: 1 }}>
          Error Loading Data
        </Typography>
        <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', mb: 2, textAlign: 'center', maxWidth: 400 }}>
          {error}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            window.location.reload();
          }}
          sx={{
            color: colors.accent.orange,
            borderColor: colors.accent.orange,
            '&:hover': {
              borderColor: colors.accent.orange,
              bgcolor: 'rgba(255, 107, 53, 0.08)'
            }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      bgcolor: '#0d0d0d', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Header Bar */}
      <Box sx={{ 
        height: 60,
        bgcolor: '#141414',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2, p: 2 }}>
        {/* Main Container */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          bgcolor: '#141414', 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
        }}>
          {!selectedClient ? (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              gap: 3
            }}>
              <Typography variant="h4" sx={{ 
                color: colors.text.title, 
                fontWeight: typography.fontWeights.semibold,
                mb: 2
              }}>
                Client Management
              </Typography>
              
              <FormControl sx={{ minWidth: 400 }}>
                <InputLabel sx={{ color: colors.text.secondary, '&.Mui-focused': { color: colors.accent.orange } }}>
                  Select Client
                </InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Select Client"
                  sx={{
                    color: colors.text.primary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.24)' },
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
                  <MenuItem value="">
                    <em>Select a client...</em>
                  </MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client} value={client}>{client}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : (
          <>
            {/* Page Header with Client Name and Actions */}
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h5" sx={{ 
                color: colors.text.title, 
                fontWeight: typography.fontWeights.semibold
              }}>
                {selectedClient}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setWizardOpen(true)}
                sx={{
                  bgcolor: colors.accent.orange,
                  color: '#fff',
                  textTransform: 'none',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#e8591d'
                  }
                }}
              >
                Create New Project
              </Button>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
                {/* Deliverables Section */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ 
                      color: colors.text.title, 
                      fontWeight: typography.fontWeights.semibold 
                    }}>
                      Deliverables ({deliverables.length})
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: colors.accent.orange,
                        borderColor: colors.accent.orange,
                        '&:hover': {
                          borderColor: colors.accent.orange,
                          bgcolor: 'rgba(255, 107, 53, 0.08)'
                        }
                      }}
                    >
                      Add Deliverable
                    </Button>
                  </Box>

                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {deliverables.length === 0 ? (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        border: '1px dashed rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.02)'
                      }}>
                        <Typography sx={{ color: colors.text.secondary }}>
                          No deliverables found for this client
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {deliverables.map((deliverable) => (
                          <Card key={deliverable.id} sx={{ 
                            bgcolor: colors.background.card,
                            border: `1px solid ${colors.border.default}`,
                            '&:hover': { bgcolor: colors.background.cardHover }
                          }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography sx={{ 
                                  color: colors.text.cardTitle, 
                                  fontWeight: typography.fontWeights.medium,
                                  flex: 1
                                }}>
                                  {deliverable.name}
                                </Typography>
                                <IconButton size="small" sx={{ color: colors.text.secondary }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                {deliverable.project && (
                                  <Chip 
                                    label={deliverable.project} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                                      color: colors.text.secondary,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                                {deliverable.assignee && (
                                  <Chip 
                                    label={deliverable.assignee} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                                      color: colors.text.secondary,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                              </Box>

                              {deliverable.dueDate && (
                                <Typography sx={{ 
                                  color: deliverable.dueDate < new Date() && !deliverable.dueComplete 
                                    ? colors.accent.orange 
                                    : colors.text.tertiary,
                                  fontSize: '0.75rem'
                                }}>
                                  Due: {deliverable.dueDate.toLocaleDateString()}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Account Tasks Section */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ 
                      color: colors.text.title, 
                      fontWeight: typography.fontWeights.semibold 
                    }}>
                      Account Tasks ({accountTasks.length})
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      variant="outlined"
                      size="small"
                      sx={{
                        color: colors.accent.orange,
                        borderColor: colors.accent.orange,
                        '&:hover': {
                          borderColor: colors.accent.orange,
                          bgcolor: 'rgba(255, 107, 53, 0.08)'
                        }
                      }}
                    >
                      Add Task
                    </Button>
                  </Box>

                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {accountTasks.length === 0 ? (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        border: '1px dashed rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.02)'
                      }}>
                        <Typography sx={{ color: colors.text.secondary }}>
                          No account tasks found for this client
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {accountTasks.map((task) => (
                          <Card key={task.id} sx={{ 
                            bgcolor: colors.background.card,
                            border: `1px solid ${colors.border.default}`,
                            '&:hover': { bgcolor: colors.background.cardHover }
                          }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography sx={{ 
                                  color: colors.text.cardTitle, 
                                  fontWeight: typography.fontWeights.medium,
                                  flex: 1
                                }}>
                                  {task.name}
                                </Typography>
                                <IconButton size="small" sx={{ color: colors.text.secondary }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                {task.effort && (
                                  <Chip 
                                    label={task.effort} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                                      color: colors.text.secondary,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                                {task.assignee && (
                                  <Chip 
                                    label={task.assignee} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                                      color: colors.text.secondary,
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                )}
                              </Box>

                              {task.dueDate && (
                                <Typography sx={{ 
                                  color: task.dueDate < new Date() && !task.dueComplete 
                                    ? colors.accent.orange 
                                    : colors.text.tertiary,
                                  fontSize: '0.75rem'
                                }}>
                                  Due: {task.dueDate.toLocaleDateString()}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
          )}
        </Box>
      </Box>

      {/* Project Wizard */}
      {wizardOpen && allBoardsData && (
        <ProjectWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onProjectCreated={() => {
            // Refresh the page to reload data
            window.location.reload();
          }}
          userToken={user?.trelloToken || ''}
          clientName={selectedClient}
          allBoardsData={allBoardsData}
        />
      )}
    </Box>
  );
}

