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
  CircularProgress,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
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
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'activeProjects' | 'totalTasks'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [projects, setProjects] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
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

  // Extract client list with stats from cached board data
  useEffect(() => {
    if (!allBoardsData) return;
    
    const accountMgmtBoard = allBoardsData.accountManagement;
    if (!accountMgmtBoard?.customFields) return;
    
    const clientField = accountMgmtBoard.customFields.find((cf: any) => cf.name === 'Client');
    if (!clientField?.options) return;
    
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
    
    // Build client data with stats
    const clientData = clientField.options
      .map((opt: any) => {
        const clientName = opt.value?.text;
        if (!clientName) return null;
        
        // Count tasks for this client
        const clientCards = (accountMgmtBoard.cards || []).filter((card: any) => {
          return extractCustomFieldValue(card, 'Client') === clientName;
        });
        
        // Get unique projects
        const projects = new Set(
          clientCards
            .map((card: any) => extractCustomFieldValue(card, 'Project'))
            .filter((p: string) => p)
        );
        
        // Count deliverables and account tasks
        const deliverablesList = accountMgmtBoard.lists?.find((l: any) => l.name === '📦 Deliverables');
        const accountTasksList = accountMgmtBoard.lists?.find((l: any) => l.name === '👥 Account Tasks');
        
        const deliverables = clientCards.filter((card: any) => card.idList === deliverablesList?.id);
        const accountTasks = clientCards.filter((card: any) => card.idList === accountTasksList?.id);
        
        return {
          name: clientName,
          activeProjects: projects.size,
          totalTasks: clientCards.length,
          deliverables: deliverables.length,
          accountTasks: accountTasks.length
        };
      })
      .filter((client: any) => client !== null)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    setClients(clientData);
    setFilteredClients(clientData);
    setClientsLoading(false);
  }, [allBoardsData]);

  // Filter and sort clients
  useEffect(() => {
    let filtered = [...clients];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((client: any) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    
    setFilteredClients(filtered);
  }, [clients, searchQuery, sortField, sortDirection]);

  // Extract projects, deliverables, milestones, and tasks when client is selected
  useEffect(() => {
    if (!selectedClient || !allBoardsData?.accountManagement) {
      setProjects([]);
      setDeliverables([]);
      setMilestones([]);
      setAccountTasks([]);
      return;
    }

    const accountMgmtBoard = allBoardsData.accountManagement;
      
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
    
    // Get all cards for this client
    const clientCards = (accountMgmtBoard.cards || []).filter((card: any) => {
      return extractCustomFieldValue(card, 'Client') === selectedClient;
    });
    
    // Get deliverables list
    const deliverablesList = accountMgmtBoard.lists?.find((l: any) => l.name === '📦 Deliverables');
    const accountTasksList = accountMgmtBoard.lists?.find((l: any) => l.name === '👥 Account Tasks');
    
    // Extract unique projects with their data from Supabase
    const projectsFromSupabase: any[] = []; // This will be populated later when we fetch from Supabase
    
    // For now, extract projects from cards
    const projectNames = new Set<string>();
    clientCards.forEach((card: any) => {
      const projectName = extractCustomFieldValue(card, 'Project');
      if (projectName) projectNames.add(projectName);
    });
    
    const projectsData = Array.from(projectNames).map((projectName) => {
      // Get deliverables for this project
      const projectDeliverables = clientCards.filter((card: any) => 
        card.idList === deliverablesList?.id &&
        extractCustomFieldValue(card, 'Project') === projectName
      );
      
        // Get unique milestones for this project and calculate completion
      const milestonesMap = new Map<string, { name: string; totalTasks: number; completedTasks: number; percentComplete: number }>();
      
      // Check all boards for tasks with this project and milestone
      ['designUX', 'development'].forEach((boardKey) => {
        const board = allBoardsData[boardKey];
        if (!board?.cards) return;
        
        board.cards.forEach((card: any) => {
          const cardClient = board.customFields?.find((cf: any) => cf.name === 'Client')?.id;
          const cardProject = board.customFields?.find((cf: any) => cf.name === 'Project')?.id;
          const cardMilestone = board.customFields?.find((cf: any) => cf.name === 'Milestone')?.id;
          
          if (!cardClient || !cardProject || !cardMilestone) return;
          
          const clientValue = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === cardClient);
          const projectValue = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === cardProject);
          const milestoneValue = card.customFieldItems?.find((cfi: any) => cfi.idCustomField === cardMilestone);
          
          // Extract text values
          const clientText = clientValue?.idValue ? 
            board.customFields.find((cf: any) => cf.id === cardClient)?.options?.find((o: any) => o.id === clientValue.idValue)?.value?.text : '';
          const projectText = projectValue?.idValue ?
            board.customFields.find((cf: any) => cf.id === cardProject)?.options?.find((o: any) => o.id === projectValue.idValue)?.value?.text : '';
          const milestoneText = milestoneValue?.value?.text || '';
          
          if (clientText === selectedClient && projectText === projectName && milestoneText) {
            if (!milestonesMap.has(milestoneText)) {
              milestonesMap.set(milestoneText, { name: milestoneText, totalTasks: 0, completedTasks: 0, percentComplete: 0 });
            }
            const milestone = milestonesMap.get(milestoneText)!;
            milestone.totalTasks++;
            if (card.dueComplete || card.closed) {
              milestone.completedTasks++;
            }
            milestone.percentComplete = milestone.totalTasks > 0 ? Math.round((milestone.completedTasks / milestone.totalTasks) * 100) : 0;
          }
        });
      });
      
      return {
        name: projectName,
        startDate: null, // Will be populated from Supabase
        endDate: null, // Will be populated from Supabase
        deliverables: projectDeliverables,
        milestones: Array.from(milestonesMap.values())
      };
    });
    
    // Get deliverables for this client
    const deliverablesCards = clientCards.filter((card: any) => 
      card.idList === deliverablesList?.id
    );

    // Get account tasks for this client
    const accountTasksCards = clientCards.filter((card: any) => 
      card.idList === accountTasksList?.id
    );

    // Enhance cards with additional info
    const enhanceCard = (card: any) => ({
      ...card,
      client: extractCustomFieldValue(card, 'Client'),
      project: extractCustomFieldValue(card, 'Project'),
      milestone: extractCustomFieldValue(card, 'Milestone'),
      effort: extractCustomFieldValue(card, 'Effort'),
      assignee: card.members?.[0]?.fullName || 'Unassigned',
      dueDate: card.due ? new Date(card.due) : null,
      labels: card.labels || [],
      isComplete: card.dueComplete || card.closed
    });

    setProjects(projectsData);
    setDeliverables(deliverablesCards.map(enhanceCard));
    setAccountTasks(accountTasksCards.map(enhanceCard));
    
    // Auto-select first project if available
    if (projectsData.length > 0 && !selectedProject) {
      setSelectedProject(projectsData[0].name);
    }
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
            <>
              {/* Page Header */}
              <Box sx={{ 
                p: 3, 
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box>
                  <Typography sx={{ 
                    color: colors.text.title, 
                    fontSize: '1.125rem',
                    fontWeight: typography.fontWeights.semibold,
                    letterSpacing: typography.letterSpacing.tight
                  }}>
                    Client Management
                  </Typography>
                  <Typography sx={{ 
                    color: colors.text.tertiary, 
                    fontSize: '0.8125rem',
                    mt: 0.5
                  }}>
                    {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
                  </Typography>
                </Box>
              </Box>

              {/* Filters */}
              <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{
                      width: 250,
                      '& .MuiInputBase-root': {
                        color: colors.text.primary,
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                        fontSize: '0.875rem',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                        '&.Mui-focused fieldset': { borderColor: colors.accent.orange }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                    }}
                    sx={{
                      color: '#fff',
                      bgcolor: colors.status.success,
                      textTransform: 'none',
                      fontSize: '0.8125rem',
                      px: 2,
                      '&:hover': { bgcolor: colors.status.successHover }
                    }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Box>

              {/* Client Table */}
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 3 }}>
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: 1
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          onClick={() => {
                            if (sortField === 'name') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('name');
                              setSortDirection('asc');
                            }
                          }}
                          sx={{ 
                            bgcolor: colors.background.elevated,
                            color: colors.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: typography.fontWeights.semibold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${colors.border.default}`,
                            cursor: 'pointer',
                            '&:hover': { color: colors.text.primary }
                          }}
                        >
                          Client {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell 
                          onClick={() => {
                            if (sortField === 'activeProjects') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('activeProjects');
                              setSortDirection('desc');
                            }
                          }}
                          sx={{ 
                            bgcolor: colors.background.elevated,
                            color: colors.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: typography.fontWeights.semibold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${colors.border.default}`,
                            cursor: 'pointer',
                            '&:hover': { color: colors.text.primary }
                          }}
                        >
                          Active Projects {sortField === 'activeProjects' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            bgcolor: colors.background.elevated,
                            color: colors.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: typography.fontWeights.semibold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${colors.border.default}`
                          }}
                        >
                          Deliverables
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            bgcolor: colors.background.elevated,
                            color: colors.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: typography.fontWeights.semibold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${colors.border.default}`
                          }}
                        >
                          Account Tasks
                        </TableCell>
                        <TableCell 
                          onClick={() => {
                            if (sortField === 'totalTasks') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('totalTasks');
                              setSortDirection('desc');
                            }
                          }}
                          sx={{ 
                            bgcolor: colors.background.elevated,
                            color: colors.text.secondary,
                            fontSize: '0.75rem',
                            fontWeight: typography.fontWeights.semibold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${colors.border.default}`,
                            cursor: 'pointer',
                            '&:hover': { color: colors.text.primary }
                          }}
                        >
                          Total Tasks {sortField === 'totalTasks' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredClients.map((client: any) => (
                        <TableRow 
                          key={client.name}
                          onClick={() => setSelectedClient(client.name)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              bgcolor: 'rgba(255, 255, 255, 0.04)',
                              '& td': { color: colors.text.primary }
                            }
                          }}
                        >
                          <TableCell sx={{ 
                            color: colors.text.primary,
                            fontSize: '0.875rem',
                            fontWeight: typography.fontWeights.medium,
                            borderBottom: `1px solid ${colors.border.subtle}`
                          }}>
                            {client.name}
                          </TableCell>
                          <TableCell sx={{ 
                            color: colors.text.secondary,
                            fontSize: '0.875rem',
                            borderBottom: `1px solid ${colors.border.subtle}`
                          }}>
                            {client.activeProjects}
                          </TableCell>
                          <TableCell sx={{ 
                            color: colors.text.secondary,
                            fontSize: '0.875rem',
                            borderBottom: `1px solid ${colors.border.subtle}`
                          }}>
                            {client.deliverables}
                          </TableCell>
                          <TableCell sx={{ 
                            color: colors.text.secondary,
                            fontSize: '0.875rem',
                            borderBottom: `1px solid ${colors.border.subtle}`
                          }}>
                            {client.accountTasks}
                          </TableCell>
                          <TableCell sx={{ 
                            color: colors.text.secondary,
                            fontSize: '0.875rem',
                            borderBottom: `1px solid ${colors.border.subtle}`
                          }}>
                            {client.totalTasks}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Projects Section */}
                <Box>
                  <Typography variant="h6" sx={{ 
                    color: colors.text.title, 
                    fontWeight: typography.fontWeights.semibold,
                    mb: 2
                  }}>
                    Projects ({projects.length})
                  </Typography>
                  
                  {projects.length === 0 ? (
                    <Box sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.02)'
                    }}>
                      <Typography sx={{ color: colors.text.secondary }}>
                        No projects found for this client
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                      {projects.map((project) => (
                        <Card 
                          key={project.name}
                          onClick={() => setSelectedProject(project.name)}
                          sx={{ 
                            minWidth: 200,
                            bgcolor: selectedProject === project.name ? 'rgba(255, 107, 53, 0.1)' : colors.background.card,
                            border: `1px solid ${selectedProject === project.name ? colors.accent.orange : colors.border.default}`,
                            cursor: 'pointer',
                            transition: transitions.default,
                            '&:hover': { 
                              bgcolor: selectedProject === project.name ? 'rgba(255, 107, 53, 0.15)' : colors.background.cardHover,
                              borderColor: colors.accent.orange
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography sx={{ 
                              color: colors.text.primary, 
                              fontWeight: typography.fontWeights.semibold,
                              fontSize: '0.9375rem',
                              mb: 1
                            }}>
                              {project.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={`${project.deliverables.length} Deliverables`}
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                                  color: colors.text.tertiary,
                                  fontSize: '0.75rem'
                                }}
                              />
                              <Chip 
                                label={`${project.milestones.length} Milestones`}
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                                  color: colors.text.tertiary,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Selected Project Details */}
                {selectedProject && projects.find(p => p.name === selectedProject) && (
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: colors.text.title, 
                      fontWeight: typography.fontWeights.semibold,
                      mb: 2
                    }}>
                      {selectedProject}
                    </Typography>

                    {/* Project Dates */}
                    {(projects.find(p => p.name === selectedProject)?.startDate || projects.find(p => p.name === selectedProject)?.endDate) && (
                      <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
                        {projects.find(p => p.name === selectedProject)?.startDate && (
                          <Box>
                            <Typography sx={{ color: colors.text.tertiary, fontSize: '0.75rem', mb: 0.5 }}>
                              Start Date
                            </Typography>
                            <Typography sx={{ color: colors.text.primary, fontSize: '0.875rem' }}>
                              {new Date(projects.find(p => p.name === selectedProject)!.startDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                        {projects.find(p => p.name === selectedProject)?.endDate && (
                          <Box>
                            <Typography sx={{ color: colors.text.tertiary, fontSize: '0.75rem', mb: 0.5 }}>
                              End Date
                            </Typography>
                            <Typography sx={{ color: colors.text.primary, fontSize: '0.875rem' }}>
                              {new Date(projects.find(p => p.name === selectedProject)!.endDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Deliverables for Selected Project */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ 
                        color: colors.text.secondary, 
                        fontSize: '0.875rem',
                        fontWeight: typography.fontWeights.semibold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        mb: 1.5
                      }}>
                        Deliverables ({projects.find(p => p.name === selectedProject)?.deliverables.length || 0})
                      </Typography>
                      {projects.find(p => p.name === selectedProject)?.deliverables.length === 0 ? (
                        <Typography sx={{ color: colors.text.tertiary, fontSize: '0.875rem', fontStyle: 'italic' }}>
                          No deliverables
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {deliverables.filter(d => d.project === selectedProject).map((deliverable) => (
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
                                  color: deliverable.dueDate < new Date() && !deliverable.isComplete 
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

                    {/* Milestones for Selected Project */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ 
                        color: colors.text.secondary, 
                        fontSize: '0.875rem',
                        fontWeight: typography.fontWeights.semibold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        mb: 1.5
                      }}>
                        Milestones ({projects.find(p => p.name === selectedProject)?.milestones.length || 0})
                      </Typography>
                      {projects.find(p => p.name === selectedProject)?.milestones.length === 0 ? (
                        <Typography sx={{ color: colors.text.tertiary, fontSize: '0.875rem', fontStyle: 'italic' }}>
                          No milestones
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {projects.find(p => p.name === selectedProject)?.milestones.map((milestone: any) => (
                            <Box 
                              key={milestone.name}
                              sx={{ 
                                p: 2,
                                bgcolor: colors.background.card,
                                border: `1px solid ${colors.border.default}`,
                                borderRadius: 1
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ 
                                  color: colors.text.primary, 
                                  fontWeight: typography.fontWeights.medium,
                                  fontSize: '0.875rem'
                                }}>
                                  {milestone.name}
                                </Typography>
                                <Typography sx={{ 
                                  color: milestone.percentComplete === 100 ? colors.status.success : colors.text.secondary,
                                  fontWeight: typography.fontWeights.semibold,
                                  fontSize: '0.875rem'
                                }}>
                                  {milestone.percentComplete}%
                                </Typography>
                              </Box>
                              {/* Progress Bar */}
                              <Box sx={{ 
                                width: '100%', 
                                height: 8, 
                                bgcolor: 'rgba(255, 255, 255, 0.06)',
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}>
                                <Box sx={{ 
                                  width: `${milestone.percentComplete}%`, 
                                  height: '100%', 
                                  bgcolor: milestone.percentComplete === 100 ? colors.status.success : colors.accent.orange,
                                  transition: transitions.default
                                }} />
                              </Box>
                              <Typography sx={{ 
                                color: colors.text.tertiary, 
                                fontSize: '0.75rem',
                                mt: 0.5
                              }}>
                                {milestone.completedTasks} of {milestone.totalTasks} tasks complete
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Account Tasks Section */}
                <Box>
                  <Typography variant="h6" sx={{ 
                    color: colors.text.title, 
                    fontWeight: typography.fontWeights.semibold,
                    mb: 2
                  }}>
                    Account Tasks ({accountTasks.length})
                  </Typography>
                  
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
                                  color: task.dueDate < new Date() && !task.isComplete 
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

