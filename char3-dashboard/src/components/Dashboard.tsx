'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon } from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { trelloService } from '@/services/trelloService';
import { DeliverablesBoard } from './DeliverablesBoard';
import { WeeklyPlanningBoard } from './WeeklyPlanningBoard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const { isLoading, error, setLoading, setError, setClients, setCustomFields, setMembers, setListIds } = useStore();

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await trelloService.getBoardData();
      
      console.log('Trello data received:', {
        lists: data.lists.map((l: any) => ({ name: l.name, id: l.id })),
        cardsCount: data.cards.length,
        customFields: data.customFields.map((cf: any) => ({ name: cf.name, id: cf.id }))
      });
      
      // Process the data to match our store structure
      const deliverablesList = data.lists.find((list: { name: string; id: string }) => 
        list.name.toLowerCase().includes('deliverable')
      );
      const adminTasksList = data.lists.find((list: { name: string; id: string }) => 
        list.name.toLowerCase().includes('account') || list.name.toLowerCase().includes('admin')
      );
      
      console.log('Found lists:', {
        deliverablesList: deliverablesList?.name,
        adminTasksList: adminTasksList?.name
      });

      // Group cards by client
      const clientsMap = new Map();
      
      data.cards.forEach((card: { 
        id: string; 
        name: string; 
        due: string; 
        idList: string;
        customFieldItems?: Array<{ idCustomField: string; value: { text: string } }>;
        members?: Array<{ fullName: string }>;
        labels?: Array<{ name: string; color: string }>;
      }) => {
        const clientCustomField = data.customFields.find((cf: { name: string; id: string }) => cf.name === 'Client');
        const clientFieldItem = card.customFieldItems?.find((cf: { idCustomField: string; value: any }) => 
          cf.idCustomField === clientCustomField?.id
        );
        
        // Handle different custom field value structures
        let clientName = 'Unassigned';
        if (clientFieldItem) {
          if (clientFieldItem.value && typeof clientFieldItem.value === 'string') {
            clientName = clientFieldItem.value;
          } else if (clientFieldItem.value && clientFieldItem.value.text) {
            clientName = clientFieldItem.value.text;
          } else if (clientFieldItem.idValue) {
            // For dropdown fields, we need to find the option text using idValue
            const option = clientCustomField?.options?.find((opt: any) => opt.id === clientFieldItem.idValue);
            clientName = option?.value?.text || 'Unassigned';
          }
        }
        
        console.log('Processing card:', {
          name: card.name,
          idList: card.idList,
          clientName,
          clientCustomField: clientCustomField,
          clientFieldItem: clientFieldItem,
          customFieldItems: card.customFieldItems,
          allCustomFields: data.customFields.map((cf: any) => ({ name: cf.name, id: cf.id }))
        });
        
        // Log each custom field item in detail
        card.customFieldItems?.forEach((item: any, index: number) => {
          console.log(`Custom field item ${index}:`, {
            idCustomField: item.idCustomField,
            value: item.value,
            valueType: typeof item.value
          });
        });
        
        if (!clientsMap.has(clientName)) {
          clientsMap.set(clientName, {
            name: clientName,
            deliverables: [],
            adminTasks: [],
          });
        }
        
        const client = clientsMap.get(clientName);
        // Get project field value
        const projectCustomField = data.customFields.find((cf: { name: string; id: string }) => cf.name === 'Project');
        const projectFieldItem = card.customFieldItems?.find((cf: { idCustomField: string; value: any }) => 
          cf.idCustomField === projectCustomField?.id
        );
        
        let projectName = '';
        if (projectFieldItem) {
          if (projectFieldItem.value && typeof projectFieldItem.value === 'string') {
            projectName = projectFieldItem.value;
          } else if (projectFieldItem.value && projectFieldItem.value.text) {
            projectName = projectFieldItem.value.text;
          } else if (projectFieldItem.idValue) {
            // For dropdown fields, we need to find the option text using idValue
            const option = projectCustomField?.options?.find((opt: any) => opt.id === projectFieldItem.idValue);
            projectName = option?.value?.text || '';
          }
        }

        const cardData = {
          id: card.id,
          title: card.name,
          dueDate: card.due ? new Date(card.due) : null,
          client: clientName,
          project: projectName,
          assignee: card.members?.[0]?.fullName || 'Unassigned',
          labels: card.labels || [],
        };

        if (card.idList === deliverablesList?.id) {
          client.deliverables.push(cardData);
        } else if (card.idList === adminTasksList?.id) {
          client.adminTasks.push(cardData);
        }
      });

      const clients = Array.from(clientsMap.values());
      setClients(clients);

      // Extract custom field options
      const projects = data.customFields
        .find((cf: { name: string; options?: Array<{ value: { text: string } }> }) => cf.name === 'Project')
        ?.options?.map((opt: { value: { text: string } }) => opt.value.text) || [];
      
      const clientsList = data.customFields
        .find((cf: { name: string; options?: Array<{ value: { text: string } }> }) => cf.name === 'Client')
        ?.options?.map((opt: { value: { text: string } }) => opt.value.text) || [];

      setCustomFields({ projects, clients: clientsList });

      // Process members data
      const members = data.members.map((member: any) => ({
        id: member.id,
        fullName: member.fullName,
        username: member.username
      }));
      setMembers(members);

      // Store list IDs
      setListIds({
        deliverables: deliverablesList?.id || '',
        adminTasks: adminTasksList?.id || ''
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setClients, setCustomFields, setMembers, setListIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expose refresh function globally for use by other components
  useEffect(() => {
    (window as any).refreshDashboardData = loadData;
  }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      bgcolor: '#000000', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      gap: 2,
      overflow: 'hidden'
    }}>
      {/* Top Header Bar */}
      <Box sx={{ 
        height: 60,
        bgcolor: '#2a2a2a',
        borderRadius: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2
      }}>
        <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
          char<span style={{ color: '#ff6b35' }}>3</span> Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            sx={{
              bgcolor: '#4caf50',
              color: 'white',
              fontSize: '0.75rem',
              px: 1,
              py: 0.5,
              minWidth: 'auto',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            Refresh
          </Button>
          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#444',
              color: 'white',
              fontSize: '0.75rem',
              px: 1,
              py: 0.5,
              minWidth: 'auto',
              '&:hover': { bgcolor: '#555' }
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 2 }}>
        {/* Left Navigation Menu */}
        <Box sx={{ 
          width: 200, 
          bgcolor: '#2a2a2a', 
          borderRadius: 2,
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Navigation Items */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box
              onClick={() => setTabValue(0)}
              sx={{
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: tabValue === 0 ? '#3a3a3a' : 'transparent',
                borderLeft: tabValue === 0 ? '3px solid #ff6b35' : '3px solid transparent',
                color: tabValue === 0 ? 'white' : '#888',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': {
                  bgcolor: tabValue === 0 ? '#3a3a3a' : '#333',
                },
                transition: 'all 0.2s ease'
              }}
            >
              👥 Team Collab
            </Box>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                color: '#888',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': { bgcolor: '#333' },
                transition: 'all 0.2s ease'
              }}
            >
              📋 Team Boards
            </Box>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                color: '#888',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': { bgcolor: '#333' },
                transition: 'all 0.2s ease'
              }}
            >
              👤 Account Management
            </Box>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                color: '#888',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': { bgcolor: '#333' },
                transition: 'all 0.2s ease'
              }}
            >
              📊 Project Management
            </Box>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                cursor: 'pointer',
                color: '#888',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': { bgcolor: '#333' },
                transition: 'all 0.2s ease'
              }}
            >
              🌐 Client Portals
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, bgcolor: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
          {/* Team Collaboration Header */}
          <Box sx={{ 
            bgcolor: '#2a2a2a',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h5" sx={{ color: '#e0e0e0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Team Collaboration
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', fontSize: '0.875rem' }}>
              Week of October 11, 2025
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ 
            bgcolor: '#2a2a2a',
            display: 'flex',
            p: 1
          }}>
            <Box
              onClick={() => setTabValue(0)}
              sx={{
                flex: 1,
                py: 1.5,
                px: 2,
                cursor: 'pointer',
                bgcolor: tabValue === 0 ? '#f5f5f5' : 'transparent',
                color: tabValue === 0 ? '#1a1a1a' : '#e0e0e0',
                fontSize: '0.875rem',
                fontWeight: tabValue === 0 ? 'bold' : 'normal',
                borderRadius: 1,
                textAlign: 'center',
                '&:hover': {
                  bgcolor: tabValue === 0 ? '#f5f5f5' : '#333',
                },
                transition: 'all 0.2s ease'
              }}
            >
              Weekly Planning
            </Box>
            <Box
              onClick={() => setTabValue(1)}
              sx={{
                flex: 1,
                py: 1.5,
                px: 2,
                cursor: 'pointer',
                bgcolor: tabValue === 1 ? '#f5f5f5' : 'transparent',
                color: tabValue === 1 ? '#1a1a1a' : '#e0e0e0',
                fontSize: '0.875rem',
                fontWeight: tabValue === 1 ? 'bold' : 'normal',
                borderRadius: 1,
                textAlign: 'center',
                '&:hover': {
                  bgcolor: tabValue === 1 ? '#f5f5f5' : '#333',
                },
                transition: 'all 0.2s ease'
              }}
            >
              Client Deliverables
            </Box>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <WeeklyPlanningBoard />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <DeliverablesBoard />
          </TabPanel>
        </Box>

        {/* Right Master Tasks Panel */}
        <Box sx={{ 
          width: 300, 
          bgcolor: '#2a2a2a', 
          borderRadius: 2,
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
              Master Tasks
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem' }}>
              4 tasks
            </Typography>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <input
              type="text"
              placeholder="Search tasks..."
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#3a3a3a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <select
              style={{
                flex: 1,
                minWidth: '80px',
                padding: '6px 8px',
                backgroundColor: '#3a3a3a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            >
              <option>All Projects</option>
            </select>
            <select
              style={{
                flex: 1,
                minWidth: '80px',
                padding: '6px 8px',
                backgroundColor: '#3a3a3a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            >
              <option>All People</option>
            </select>
            <select
              style={{
                flex: 1,
                minWidth: '80px',
                padding: '6px 8px',
                backgroundColor: '#3a3a3a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            >
              <option>All Task Types</option>
            </select>
            <Button
              size="small"
              sx={{
                bgcolor: '#ff6b35',
                color: 'white',
                fontSize: '0.75rem',
                px: 1,
                py: 0.5,
                minWidth: 'auto',
                '&:hover': { bgcolor: '#e55a2b' }
              }}
            >
              Clear
            </Button>
          </Box>

          {/* Task List */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {[
              { title: 'User Authentication System', labels: ['DEV', 'L'], project: 'iLitigate 2.0', assignee: 'D', role: 'Developer' },
              { title: 'Dashboard Components', labels: ['DESIGN', 'M'], project: 'iLitigate 2.0', assignee: 'D', role: 'Designer' },
              { title: 'Wellness App UX Flow', labels: ['UX', 'M'], project: 'Aurawell', assignee: 'U', role: 'UX' },
              { title: 'Phase 2 Planning', labels: ['ACCOUNT', 'S'], project: 'FFA Phase 2', assignee: 'P', role: 'Project Lead' },
              { title: 'Data Analytics Platform', labels: ['DEV', 'XL'], project: 'Roth River', assignee: 'D', role: 'Developer' },
              { title: 'Mobile App Wireframes', labels: ['DESIGN', 'M'], project: 'Parle', assignee: 'D', role: 'Designer' },
              { title: 'Network Security UX', labels: ['UX', 'L'], project: 'Quartz Network', assignee: 'U', role: 'UX' },
              { title: 'Health Compliance Review', labels: [], project: '', assignee: '', role: '' }
            ].map((task, index) => (
              <Box
                key={index}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: '#3a3a3a',
                  borderRadius: 1,
                  border: '1px solid #555',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#444' },
                  transition: 'all 0.2s ease'
                }}
              >
                <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem', mb: 1, fontWeight: 'bold' }}>
                  {task.title}
                </Typography>
                
                {task.labels.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    {task.labels.map((label, labelIndex) => (
                      <Box
                        key={labelIndex}
                        sx={{
                          px: 1,
                          py: 0.25,
                          bgcolor: '#555',
                          borderRadius: 0.5,
                          fontSize: '0.625rem',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        {label}
                      </Box>
                    ))}
                  </Box>
                )}
                
                {task.project && (
                  <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>
                    {task.project}
                  </Typography>
                )}
                
                {task.assignee && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: '#9c27b0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {task.assignee}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem' }}>
                      {task.role}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}