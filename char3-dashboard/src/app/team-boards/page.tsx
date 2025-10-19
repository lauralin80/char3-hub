'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { trelloService } from '@/services/trelloService';
import { useAuth } from '@/contexts/AuthContext';

// Board View Component
interface BoardViewProps {
  boardType: 'design' | 'development' | 'assigned';
  allBoardsData: any;
  onBack: () => void;
}

function BoardView({ boardType, allBoardsData, onBack }: BoardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('open');
  const [sortField, setSortField] = useState<string>('due');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const { user } = useAuth();

  // Helper function to extract custom field values
  const extractCustomFieldValue = (customFieldItems: any[], customFields: any[], fieldName: string) => {
    const customField = customFields.find((cf: any) => cf.name === fieldName);
    if (!customField) return '';
    
    const fieldItem = customFieldItems?.find((cf: any) => cf.idCustomField === customField.id);
    if (!fieldItem) return '';
    
    if (fieldItem.value && typeof fieldItem.value === 'string') {
      return fieldItem.value;
    } else if (fieldItem.value && fieldItem.value.text) {
      return fieldItem.value.text;
    } else if (fieldItem.idValue) {
      const option = customField.options?.find((opt: any) => opt.id === fieldItem.idValue);
      return option?.value?.text || '';
    }
    
    return '';
  };

  // Get unique values for filter options
  const getFilterOptions = () => {
    let cards: any[] = [];
    
    if (boardType === 'design' && allBoardsData?.designUx) {
      cards = allBoardsData.designUx.cards;
    } else if (boardType === 'development' && allBoardsData?.development) {
      cards = allBoardsData.development.cards;
    } else if (boardType === 'assigned') {
      // Get all cards assigned to current user from all boards
      const allCards = [
        ...(allBoardsData?.designUx?.cards || []),
        ...(allBoardsData?.development?.cards || []),
        ...(allBoardsData?.accountManagement?.cards || [])
      ];
      
      cards = allCards.filter(card => {
        if (!card.members || card.members.length === 0) return false;
        
        const isAssignedToUser = card.members.some((member: any) => 
          member.fullName === user?.fullName || 
          member.username === user?.username || 
          member.email === user?.email
        );
        
        if (!isAssignedToUser) return false;
        
        // For Account Management board, only show cards from "Admin Tasks" list
        const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
        if (isAccountManagementCard) {
          const list = allBoardsData?.accountManagement?.lists?.find((l: any) => l.id === card.idList);
          return list?.name === '👥 Account Tasks';
        }
        
        // For Design/UX and Development boards, exclude Deliverables
        const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
        const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
        
        if (isDesignUxCard || isDevelopmentCard) {
          const list = isDesignUxCard ? 
            allBoardsData?.designUx?.lists?.find((l: any) => l.id === card.idList) :
            allBoardsData?.development?.lists?.find((l: any) => l.id === card.idList);
          
          return list?.name !== 'Deliverables';
        }
        
        return true;
      });
    }

    const uniqueClients = [...new Set(cards.map(card => {
      const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
      const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
      const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
      
      const customFields = isAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                          isDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                          isDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
      
      return extractCustomFieldValue(card.customFieldItems, customFields, 'Client');
    }).filter(Boolean))];

    const uniqueProjects = [...new Set(cards.map(card => {
      const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
      const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
      const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
      
      const customFields = isAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                          isDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                          isDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
      
      return extractCustomFieldValue(card.customFieldItems, customFields, 'Project');
    }).filter(Boolean))];

    return { uniqueClients, uniqueProjects };
  };

  const { uniqueClients, uniqueProjects } = getFilterOptions();

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedClient('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedTaskStatus('open');
    setSortField('due');
    setSortDirection('asc');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortCards = (cards: any[]) => {
    return [...cards].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'cardNumber':
          aValue = parseInt(a.idShort) || 0;
          bValue = parseInt(b.idShort) || 0;
          break;
        case 'status':
          const aList = allBoardsData?.designUx?.lists?.find((l: any) => l.id === a.idList) ||
                       allBoardsData?.development?.lists?.find((l: any) => l.id === a.idList) ||
                       allBoardsData?.accountManagement?.lists?.find((l: any) => l.id === a.idList);
          const bList = allBoardsData?.designUx?.lists?.find((l: any) => l.id === b.idList) ||
                       allBoardsData?.development?.lists?.find((l: any) => l.id === b.idList) ||
                       allBoardsData?.accountManagement?.lists?.find((l: any) => l.id === b.idList);
          aValue = (a.dueComplete || a.closed) ? 'Completed' : 
                   aList?.name === '👥 Account Tasks' ? 'Open' : 
                   (aList?.name || 'Unknown');
          bValue = (b.dueComplete || b.closed) ? 'Completed' : 
                   bList?.name === '👥 Account Tasks' ? 'Open' : 
                   (bList?.name || 'Unknown');
          break;
        case 'due':
          aValue = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
          bValue = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        case 'client':
          const aIsAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(a);
          const aIsDesignUxCard = allBoardsData?.designUx?.cards?.includes(a);
          const aIsDevelopmentCard = allBoardsData?.development?.cards?.includes(a);
          const aCustomFields = aIsAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                               aIsDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                               aIsDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
          aValue = extractCustomFieldValue(a.customFieldItems, aCustomFields, 'Client') || 'Unassigned';
          
          const bIsAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(b);
          const bIsDesignUxCard = allBoardsData?.designUx?.cards?.includes(b);
          const bIsDevelopmentCard = allBoardsData?.development?.cards?.includes(b);
          const bCustomFields = bIsAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                               bIsDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                               bIsDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
          bValue = extractCustomFieldValue(b.customFieldItems, bCustomFields, 'Client') || 'Unassigned';
          break;
        case 'project':
          const aIsAccountManagementCard2 = allBoardsData?.accountManagement?.cards?.includes(a);
          const aIsDesignUxCard2 = allBoardsData?.designUx?.cards?.includes(a);
          const aIsDevelopmentCard2 = allBoardsData?.development?.cards?.includes(a);
          const aCustomFields2 = aIsAccountManagementCard2 ? allBoardsData?.accountManagement?.customFields || [] :
                                aIsDesignUxCard2 ? allBoardsData?.designUx?.customFields || [] :
                                aIsDevelopmentCard2 ? allBoardsData?.development?.customFields || [] : [];
          aValue = extractCustomFieldValue(a.customFieldItems, aCustomFields2, 'Project') || 'No Project';
          
          const bIsAccountManagementCard2 = allBoardsData?.accountManagement?.cards?.includes(b);
          const bIsDesignUxCard2 = allBoardsData?.designUx?.cards?.includes(b);
          const bIsDevelopmentCard2 = allBoardsData?.development?.cards?.includes(b);
          const bCustomFields2 = bIsAccountManagementCard2 ? allBoardsData?.accountManagement?.customFields || [] :
                                bIsDesignUxCard2 ? allBoardsData?.designUx?.customFields || [] :
                                bIsDevelopmentCard2 ? allBoardsData?.development?.customFields || [] : [];
          bValue = extractCustomFieldValue(b.customFieldItems, bCustomFields2, 'Project') || 'No Project';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getAssigneeColor = (name: string) => {
    if (!name || name === 'Unassigned') return '#ff6b35';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#2196f3', '#ffeb3b',
      '#795548', '#607d8b', '#00bfff', '#e91e63', '#3f51b5', '#009688'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getLabelColor = (color: string, name?: string) => {
    // Check for "Need More Info" label first
    if (name && name.toLowerCase().includes('need more info')) {
      return '#8b6db8'; // Darker purple for better contrast
    }
    
    const colorMap: { [key: string]: string } = {
      'orange': '#ff6b35', 'red': '#eb5a46', 'green': '#61bd4f', 'blue': '#0079bf',
      'yellow': '#f2d600', 'purple': '#c377e0', 'pink': '#ff78cb', 'sky': '#00c2e0',
      'lime': '#51e898', 'black': '#344563', 'red_dark': '#eb5a46'
    };
    return colorMap[color] || '#888';
  };

  // Handle assigned tasks view
  if (boardType === 'assigned') {
    console.log('=== ASSIGNED TO ME DEBUG ===');
    console.log('Current user:', user);
    console.log('Total cards before filtering:', 
      (allBoardsData?.designUx?.cards?.length || 0) + 
      (allBoardsData?.development?.cards?.length || 0) + 
      (allBoardsData?.accountManagement?.cards?.length || 0)
    );
    
    const assignedCards = [
      ...(allBoardsData?.designUx?.cards || []),
      ...(allBoardsData?.development?.cards || []),
      ...(allBoardsData?.accountManagement?.cards || [])
    ].filter(card => {
      // First filter: Only show cards assigned to the current user
      if (!card.members || card.members.length === 0) return false;
      
      const isAssignedToUser = card.members.some((member: any) => 
        member.fullName === user?.name || 
        member.username === user?.username || 
        member.email === user?.email ||
        member.id === user?.id
      );
      
      if (!isAssignedToUser) return false;
      
      // For Account Management board, only show cards from "Admin Tasks" list
      const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
      if (isAccountManagementCard) {
        const list = allBoardsData?.accountManagement?.lists?.find((l: any) => l.id === card.idList);
        return list?.name === '👥 Account Tasks';
      }
      
      // For Design/UX and Development boards, exclude Deliverables
      const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
      const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
      
      if (isDesignUxCard || isDevelopmentCard) {
        const list = isDesignUxCard ? 
          allBoardsData?.designUx?.lists?.find((l: any) => l.id === card.idList) :
          allBoardsData?.development?.lists?.find((l: any) => l.id === card.idList);
        
        if (list?.name === 'Deliverables') return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          card.name.toLowerCase().includes(searchLower) ||
          card.members?.[0]?.fullName?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Apply client filter
      if (selectedClient) {
        const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
        const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
        const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
        
        const customFields = isAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                            isDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                            isDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
        
        const clientName = extractCustomFieldValue(card.customFieldItems, customFields, 'Client');
        if (clientName !== selectedClient) return false;
      }

      // Apply project filter
      if (selectedProject) {
        const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
        const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
        const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
        
        const customFields = isAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                            isDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                            isDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
        
        const projectName = extractCustomFieldValue(card.customFieldItems, customFields, 'Project');
        if (projectName !== selectedProject) return false;
      }

      // Apply task status filter
      if (selectedTaskStatus === 'open') {
        if (card.dueComplete || card.closed) return false;
      } else if (selectedTaskStatus === 'completed') {
        if (!card.dueComplete && !card.closed) return false;
      }

      return true;
    });
    
    console.log('Cards after filtering:', assignedCards.length);
    console.log('Sample card members:', assignedCards[0]?.members);

    const sortedAssignedCards = sortCards(assignedCards);

    return (
      <Box sx={{ height: '100vh', bgcolor: '#0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          height: 60,
          bgcolor: '#141414',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          px: 2
        }}>
          <Button 
            onClick={onBack} 
            variant="outlined" 
            sx={{ 
              color: '#ff6b35', 
              borderColor: '#ff6b35',
              '&:hover': { 
                borderColor: '#ff8a65',
                bgcolor: 'rgba(255, 107, 53, 0.1)'
              }
            }}
          >
            ← Back to Boards
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#141414', m: 2, borderRadius: 2 }}>
          <Box sx={{ p: 3 }}>
            {/* Title and Task Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h5" sx={{ color: '#e0e0e0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Assigned to Me
              </Typography>
              <Chip 
                label={`${sortedAssignedCards.length} tasks`} 
                size="small" 
                sx={{ 
                  bgcolor: '#ff6b35', 
                  color: '#fff', 
                  fontSize: '0.75rem',
                  height: '24px'
                }} 
              />
            </Box>

            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 3 }}>
              All your assigned tasks across all boards
            </Typography>

            {/* Filters */}
            <Box sx={{ mb: 3 }}>
              {/* Top Row: Search and Task Status */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    maxWidth: '300px',
                    padding: '8px 12px',
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.875rem',
                    outline: 'none',
                    height: '40px'
                  }}
                />
                
                <select
                  value={selectedTaskStatus}
                  onChange={(e) => setSelectedTaskStatus(e.target.value)}
                  style={{
                    minWidth: '140px',
                    padding: '8px 12px',
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.875rem',
                    outline: 'none',
                    height: '40px'
                  }}
                >
                  <option value="open">Open Tasks</option>
                  <option value="completed">Completed Tasks</option>
                  <option value="all">All Tasks</option>
                </select>
              </Box>

              {/* Bottom Row: Other Filters */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{
                    minWidth: '140px',
                    padding: '8px 12px',
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.875rem',
                    outline: 'none',
                    height: '40px'
                  }}
                >
                  <option value="">All Clients</option>
                  {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
                
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{
                    minWidth: '140px',
                    padding: '8px 12px',
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.875rem',
                    outline: 'none',
                    height: '40px'
                  }}
                >
                  <option value="">All Projects</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
                
                <Button
                  onClick={clearAllFilters}
                  size="small"
                  sx={{
                    bgcolor: '#4caf50',
                    color: 'white',
                    fontSize: '0.75rem',
                    px: 2,
                    py: 0.5,
                    minWidth: 'auto',
                    height: '40px',
                    '&:hover': { bgcolor: '#45a049' }
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {/* Table */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                bgcolor: '#141414', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                '& .MuiTable-root': {
                  borderSpacing: 0
                }
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="assigned tasks table">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('title')}
                    >
                      Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('cardNumber')}
                    >
                      Card # {sortField === 'cardNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('status')}
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('due')}
                    >
                      Due Date {sortField === 'due' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Effort</TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Labels</TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('client')}
                    >
                      Client {sortField === 'client' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('project')}
                    >
                      Project {sortField === 'project' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Milestone</TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Board</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAssignedCards.map((card) => {
                    const isAccountManagementCard = allBoardsData?.accountManagement?.cards?.includes(card);
                    const isDesignUxCard = allBoardsData?.designUx?.cards?.includes(card);
                    const isDevelopmentCard = allBoardsData?.development?.cards?.includes(card);
                    
                    const customFields = isAccountManagementCard ? allBoardsData?.accountManagement?.customFields || [] :
                                        isDesignUxCard ? allBoardsData?.designUx?.customFields || [] :
                                        isDevelopmentCard ? allBoardsData?.development?.customFields || [] : [];
                    
                    const clientName = extractCustomFieldValue(card.customFieldItems, customFields, 'Client');
                    const projectName = extractCustomFieldValue(card.customFieldItems, customFields, 'Project');
                    const milestone = extractCustomFieldValue(card.customFieldItems, customFields, 'Milestone');
                    const effort = extractCustomFieldValue(card.customFieldItems, customFields, 'Effort');
                    
                    const list = isAccountManagementCard ? 
                      allBoardsData?.accountManagement?.lists?.find((l: any) => l.id === card.idList) :
                      isDesignUxCard ? 
                      allBoardsData?.designUx?.lists?.find((l: any) => l.id === card.idList) :
                      allBoardsData?.development?.lists?.find((l: any) => l.id === card.idList);
                    
                    const boardName = isDesignUxCard ? 'Design/UX' :
                                     isDevelopmentCard ? 'Development' :
                                     isAccountManagementCard ? 'Account Management' : 'Unknown';

                    return (
                      <TableRow
                        key={card.id}
                        onClick={() => window.open(`https://trello.com/c/${card.id}`, '_blank')}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#3a3a3a' },
                          '&:last-child td': { borderBottom: 0 },
                          '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#e0e0e0' }
                        }}
                      >
                        {/* Title */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#e0e0e0',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {card.name}
                          </Typography>
                        </TableCell>
                        {/* Card Number */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#bbb',
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            #{card.idShort}
                          </Typography>
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#e0e0e0',
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {(card.dueComplete || card.closed) ? 'Completed' : 
                             list?.name === '👥 Account Tasks' ? 'Open' :
                             (list?.name || 'Unknown')}
                          </Typography>
                        </TableCell>
                        {/* Due Date */}
                        <TableCell>
                          {card.due && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: (!card.dueComplete && new Date(card.due) < new Date()) ? '#ff6b35' : '#e0e0e0',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {new Date(card.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Typography>
                          )}
                        </TableCell>
                        {/* Effort */}
                        <TableCell>
                          {effort && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#bbb',
                                fontSize: '0.875rem'
                              }}
                            >
                              {effort}
                            </Typography>
                          )}
                        </TableCell>
                        {/* Labels */}
                        <TableCell>
                          {card.labels && card.labels.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              {card.labels.slice(0, 2).map((label: any) => (
                                <Typography
                                  key={label.id}
                                  variant="body2"
                                  sx={{
                                    color: getLabelColor(label.color, label.name),
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {label.name}
                                </Typography>
                              ))}
                              {card.labels.length > 2 && (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                                  +{card.labels.length - 2}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        {/* Client */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.875rem' }}>
                            {clientName || 'Unassigned'}
                          </Typography>
                        </TableCell>
                        {/* Project */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.875rem' }}>
                            {projectName || 'Unassigned'}
                          </Typography>
                        </TableCell>
                        {/* Milestone */}
                        <TableCell>
                          {milestone && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#bbb',
                                fontSize: '0.875rem'
                              }}
                            >
                              {milestone}
                            </Typography>
                          )}
                        </TableCell>
                        {/* Board */}
                        <TableCell>
                          <Box
                            sx={{
                              px: 0.75,
                              py: 0.5,
                              bgcolor: '#555',
                              borderRadius: 0.25,
                              fontSize: '0.625rem',
                              color: 'white',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              display: 'inline-block'
                            }}
                          >
                            {boardName === 'Design/UX' ? 'DESIGN/UX' :
                             boardName === 'Development' ? 'DEV' : 'ACCT MGMT'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    );
  }

  // Handle Design/UX and Development boards
  const boardData = boardType === 'design' ? allBoardsData?.designUx : allBoardsData?.development;
  const boardName = boardType === 'design' ? 'Design/UX' : 'Development';

  if (!boardData) {
    return (
      <Box sx={{ p: 3, height: '100vh', bgcolor: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" sx={{ color: '#e0e0e0' }}>
          {boardName} board not found
        </Typography>
      </Box>
    );
  }

  // Filter cards
  const filteredCards = boardData.cards.filter((card: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        card.name.toLowerCase().includes(searchLower) ||
        card.members?.[0]?.fullName?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    if (selectedClient) {
      const clientName = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Client');
      if (clientName !== selectedClient) return false;
    }

    if (selectedProject) {
      const projectName = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Project');
      if (projectName !== selectedProject) return false;
    }

    if (selectedStatus) {
      const list = boardData.lists.find((l: any) => l.id === card.idList);
      if (list?.name !== selectedStatus) return false;
    }

    // Apply task status filter
    if (selectedTaskStatus === 'open') {
      if (card.dueComplete || card.closed) return false;
    } else if (selectedTaskStatus === 'completed') {
      if (!card.dueComplete && !card.closed) return false;
    }

    return true;
  });

  const sortedFilteredCards = sortCards(filteredCards);

  return (
    <Box sx={{ height: '100vh', bgcolor: '#0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        height: 60,
        bgcolor: '#141414',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        px: 2
      }}>
        <Button 
          onClick={onBack} 
          variant="outlined" 
          sx={{ 
            color: '#ff6b35', 
            borderColor: '#ff6b35',
            '&:hover': { 
              borderColor: '#ff8a65',
              bgcolor: 'rgba(255, 107, 53, 0.1)'
            }
          }}
        >
          ← Back to Boards
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#141414', m: 2, borderRadius: 2 }}>
        {/* Fixed Header Section */}
        <Box sx={{ p: 2, pb: 0 }}>
          {/* Title, View Toggle, and Task Count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h5" sx={{ color: '#e0e0e0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {boardName} Board
            </Typography>
            
            {/* View Toggle */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                onClick={() => setViewMode('kanban')}
                size="small"
                sx={{
                  bgcolor: viewMode === 'kanban' ? '#ff6b35' : 'transparent',
                  color: viewMode === 'kanban' ? '#fff' : '#888',
                  border: '1px solid #555',
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: viewMode === 'kanban' ? '#ff8a65' : '#333',
                    borderColor: '#ff6b35'
                  }
                }}
              >
                Board
              </Button>
              <Button
                onClick={() => setViewMode('table')}
                size="small"
                sx={{
                  bgcolor: viewMode === 'table' ? '#ff6b35' : 'transparent',
                  color: viewMode === 'table' ? '#fff' : '#888',
                  border: '1px solid #555',
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: viewMode === 'table' ? '#ff8a65' : '#333',
                    borderColor: '#ff6b35'
                  }
                }}
              >
                List
              </Button>
            </Box>
            
            <Chip 
              label={`${sortedFilteredCards.length} tasks`} 
              size="small" 
              sx={{ 
                bgcolor: '#ff6b35', 
                color: '#fff', 
                fontSize: '0.75rem',
                height: '24px'
              }} 
            />
          </Box>

          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', mb: 2 }}>
            All tasks from the {boardName} board
          </Typography>

          {/* Filters */}
          <Box sx={{ mb: 2 }}>
            {/* Top Row: Search and Task Status */}
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: '300px',
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  height: '40px'
                }}
              />
              
              <select
                value={selectedTaskStatus}
                onChange={(e) => setSelectedTaskStatus(e.target.value)}
                style={{
                  minWidth: '140px',
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  height: '40px'
                }}
              >
                <option value="open">Open Tasks</option>
                <option value="completed">Completed Tasks</option>
                <option value="all">All Tasks</option>
              </select>
            </Box>

            {/* Bottom Row: Other Filters */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                style={{
                  minWidth: '140px',
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  height: '40px'
                }}
              >
                <option value="">All Clients</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
              
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  minWidth: '140px',
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  height: '40px'
                }}
              >
                <option value="">All Projects</option>
                {uniqueProjects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  minWidth: '140px',
                  padding: '8px 12px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none',
                  height: '40px'
                }}
              >
                <option value="">All Status</option>
                {boardData.lists.map((list: any) => (
                  <option key={list.id} value={list.name}>{list.name}</option>
                ))}
              </select>
              
              <Button
                onClick={clearAllFilters}
                size="small"
                sx={{
                  bgcolor: '#4caf50',
                  color: 'white',
                  fontSize: '0.75rem',
                  px: 2,
                  py: 0.5,
                  minWidth: 'auto',
                  height: '40px',
                  '&:hover': { bgcolor: '#45a049' }
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflow: 'hidden', p: 2, pt: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Conditional Rendering based on View Mode */}
          {viewMode === 'kanban' ? (
            /* Kanban Board View - Trello List-based Swim Lanes */
            <Box sx={{ 
              display: 'flex',
              flex: 1,
              bgcolor: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
              overflow: 'auto'
            }}>
              {boardData.lists.map((list: any, index: number) => {
                const listCards = filteredCards.filter((card: any) => card.idList === list.id);
                
                return (
                  <Box
                    key={list.id}
                    sx={{
                      flex: '1 1 0',
                      minWidth: 180,
                      borderRight: index < boardData.lists.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}
                  >
                    {/* List Header */}
                    <Box sx={{ 
                      bgcolor: '#141414',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      py: 0.75,
                      px: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#e0e0e0',
                          fontWeight: 'bold',
                          fontSize: '0.8125rem'
                        }}
                      >
                        {list.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '0.6875rem',
                          fontWeight: 500
                        }}
                      >
                        ({listCards.length})
                      </Typography>
                    </Box>
                    
                    {/* Cards Container */}
                    <Box sx={{ 
                      flex: 1,
                      p: 0.75,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.75,
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}>
                      {listCards.map((card: any) => {
                        const clientName = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Client');
                        const projectName = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Project');
                        const milestone = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Milestone');
                        const effort = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Effort');

                        return (
                          <Box
                            key={card.id}
                            onClick={() => window.open(`https://trello.com/c/${card.id}`, '_blank')}
                            sx={{
                              p: 1,
                              bgcolor: 'rgba(255, 255, 255, 0.06)',
                              borderRadius: 1,
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.375,
                              '&:hover': { 
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'rgba(255, 107, 53, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 8px rgba(255, 107, 53, 0.2)'
                              }
                            }}
                          >
                            {/* Labels at top */}
                            {card.labels && card.labels.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.375, flexWrap: 'wrap', mb: 0.25 }}>
                                {card.labels.map((label: any) => (
                                  <Box
                                    key={label.id}
                                    sx={{
                                      px: 0.5,
                                      py: 0.25,
                                      bgcolor: getLabelColor(label.color, label.name),
                                      borderRadius: 0.375,
                                      fontSize: '0.5rem',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    {label.name}
                                  </Box>
                                ))}
                              </Box>
                            )}
                            
                            {/* Card Title */}
                            <Typography variant="body2" sx={{ 
                              color: '#e0e0e0', 
                              fontWeight: 'bold', 
                              fontSize: '0.8125rem',
                              lineHeight: 1.2,
                              mb: 0.25
                            }}>
                              {card.name}
                            </Typography>
                            
                            {/* Client - Project */}
                            {(clientName || projectName) && (
                              <Typography variant="caption" sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.6875rem',
                                display: 'block',
                                lineHeight: 1.2
                              }}>
                                {clientName && projectName ? `${clientName} - ${projectName}` : clientName || projectName}
                              </Typography>
                            )}

                            {/* Milestone */}
                            {milestone && (
                              <Typography variant="caption" sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.6875rem',
                                display: 'block',
                                lineHeight: 1.2
                              }}>
                                {milestone}
                              </Typography>
                            )}

                            {/* Bottom section with assignee and due date */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              mt: 0.5
                            }}>
                              {/* Assignee */}
                              {card.members && card.members.length > 0 ? (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5
                                }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: getAssigneeColor(card.members[0].fullName),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.625rem',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {card.members[0].fullName.charAt(0).toUpperCase()}
                                  </Box>
                                  <Typography variant="caption" sx={{ 
                                    color: '#e0e0e0', 
                                    fontSize: '0.6875rem'
                                  }}>
                                    {card.members[0].fullName}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5
                                }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: '#ff6b35',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.625rem',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    U
                                  </Box>
                                  <Typography variant="caption" sx={{ 
                                    color: '#e0e0e0', 
                                    fontSize: '0.6875rem'
                                  }}>
                                    Unassigned
                                  </Typography>
                                </Box>
                              )}

                              {/* Due Date */}
                              {card.due && (
                                <Typography variant="caption" sx={{ 
                                  color: (!card.dueComplete && new Date(card.due) < new Date()) ? '#ff6b35' : '#888',
                                  fontSize: '0.6875rem',
                                  fontWeight: 'bold',
                                  lineHeight: 1.2
                                }}>
                                  {new Date(card.due).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: new Date(card.due).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                  })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            /* Table View */
            <TableContainer 
              component={Paper} 
              sx={{ 
                bgcolor: '#141414', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                '& .MuiTable-root': {
                  borderSpacing: 0
                }
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="tasks table">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('title')}
                    >
                      Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('cardNumber')}
                    >
                      Card # {sortField === 'cardNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('status')}
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('due')}
                    >
                      Due Date {sortField === 'due' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Effort</TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Labels</TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('client')}
                    >
                      Client {sortField === 'client' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: '#e0e0e0', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#444' }
                      }}
                      onClick={() => handleSort('project')}
                    >
                      Project {sortField === 'project' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell sx={{ color: '#e0e0e0', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>Milestone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedFilteredCards.map((card) => {
                    const clientName = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Client');
                    const projectName = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Project');
                    const milestone = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Milestone');
                    const effort = extractCustomFieldValue(card.customFieldItems, boardData.customFields, 'Effort');
                    const list = boardData.lists.find((l: any) => l.id === card.idList);

                    return (
                      <TableRow
                        key={card.id}
                        onClick={() => window.open(`https://trello.com/c/${card.id}`, '_blank')}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#3a3a3a' },
                          '&:last-child td': { borderBottom: 0 },
                          '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#e0e0e0' }
                        }}
                      >
                        {/* Title */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#e0e0e0',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {card.name}
                          </Typography>
                        </TableCell>
                        {/* Card Number */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#bbb',
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            #{card.idShort}
                          </Typography>
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#e0e0e0',
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {(card.dueComplete || card.closed) ? 'Completed' : (list?.name || 'Unknown')}
                          </Typography>
                        </TableCell>
                        {/* Due Date */}
                        <TableCell>
                          {card.due && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: (!card.dueComplete && new Date(card.due) < new Date()) ? '#ff6b35' : '#e0e0e0',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {new Date(card.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Typography>
                          )}
                        </TableCell>
                        {/* Effort */}
                        <TableCell>
                          {effort && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#bbb',
                                fontSize: '0.875rem'
                              }}
                            >
                              {effort}
                            </Typography>
                          )}
                        </TableCell>
                        {/* Labels */}
                        <TableCell>
                          {card.labels && card.labels.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              {card.labels.slice(0, 2).map((label: any) => (
                                <Typography
                                  key={label.id}
                                  variant="body2"
                                  sx={{
                                    color: getLabelColor(label.color, label.name),
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {label.name}
                                </Typography>
                              ))}
                              {card.labels.length > 2 && (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                                  +{card.labels.length - 2}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        {/* Client */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.875rem' }}>
                            {clientName || 'Unassigned'}
                          </Typography>
                        </TableCell>
                        {/* Project */}
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.875rem' }}>
                            {projectName || 'Unassigned'}
                          </Typography>
                        </TableCell>
                        {/* Milestone */}
                        <TableCell>
                          {milestone && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#bbb',
                                fontSize: '0.875rem'
                              }}
                            >
                              {milestone}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Main Team Boards Component
export default function TeamBoards() {
  const [allBoardsData, setAllBoardsData] = useState<any>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await trelloService.getAllBoardsData();
      setAllBoardsData(data);
    } catch (error) {
      console.error('Error loading boards data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        bgcolor: '#0d0d0d', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2
      }}>
        <CircularProgress 
          size={32} 
          sx={{ 
            color: '#ff6b35',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography variant="h6" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '0.9375rem',
          fontWeight: 500,
          letterSpacing: '-0.01em'
        }}>
          Loading Team Boards...
        </Typography>
      </Box>
    );
  }

  if (selectedBoard) {
    return (
      <BoardView 
        boardType={selectedBoard as 'design' | 'development' | 'assigned'}
        allBoardsData={allBoardsData}
        onBack={() => setSelectedBoard(null)}
      />
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#0d0d0d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header - Empty */}
      <Box sx={{ 
        height: 60,
        bgcolor: '#141414',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }} />

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#141414', m: 2, borderRadius: 2 }}>
        <Box sx={{ p: 3 }}>
          {/* Title */}
          <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', mb: 1 }}>
            Team Boards
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', fontWeight: 400, mb: 4 }}>
            Choose a board to view and manage tasks
          </Typography>

          {/* Board Selection Cards */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Assigned to Me */}
            <Box
              onClick={() => setSelectedBoard('assigned')}
              sx={{
                width: 240,
                height: 140,
                bgcolor: '#141414',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.15)',
                  borderColor: 'rgba(255, 107, 53, 0.5)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
                  Assigned to Me
                </Typography>
              </Box>
            </Box>

            {/* Design/UX Board */}
            <Box
              onClick={() => setSelectedBoard('design')}
              sx={{
                width: 240,
                height: 140,
                bgcolor: '#141414',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.15)',
                  borderColor: 'rgba(255, 107, 53, 0.5)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
                  Design/UX
                </Typography>
              </Box>
            </Box>

            {/* Development Board */}
            <Box
              onClick={() => setSelectedBoard('development')}
              sx={{
                width: 240,
                height: 140,
                bgcolor: '#141414',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.15)',
                  borderColor: 'rgba(255, 107, 53, 0.5)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
                  Development
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}