'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { DeliverableCard } from './DeliverableCard';
import { AdminTaskCard } from './AdminTaskCard';
import { InlineForm } from './InlineForm';
import { useStore } from '@/store/useStore';
import { trelloService } from '@/services/trelloService';
import { colors, typography, transitions } from '@/styles/theme';

interface ClientColumnProps {
  client: {
    name: string;
    deliverables: Array<{
      id: string;
      title: string;
      dueDate: Date | null;
      client: string;
      project: string;
      labels: Array<{ name: string; color: string }>;
    }>;
    adminTasks: Array<{
      id: string;
      title: string;
      dueDate: Date | null;
      client: string;
      project: string;
      assignee: string;
      labels: Array<{ name: string; color: string }>;
    }>;
  };
  type: 'deliverable' | 'admin-task';
}

export function ClientColumn({ client, type }: ClientColumnProps) {
  const [expandedItems, setExpandedItems] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { customFields, members, listIds } = useStore();
  const formRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInlineForm && formRef.current && !formRef.current.contains(event.target as Node)) {
        handleHideInlineForm();
      }
    };

    if (showInlineForm) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInlineForm]);
  
  const items = type === 'deliverable' ? client.deliverables : client.adminTasks;
  
  // For deliverables, filter for overdue/upcoming and group by project
  const processedItems = type === 'deliverable' ? (() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    // Filter for overdue or upcoming deliverables (this week and next week)
    const relevantDeliverables = items.filter(item => {
      if (!item.dueDate) return false;
      const dueDate = new Date(item.dueDate);
      return dueDate <= twoWeeksFromNow; // Include overdue and next 2 weeks
    });
    
    // Group by project
    const groupedByProject = relevantDeliverables.reduce((acc, item) => {
      const project = item.project || 'Unassigned';
      if (!acc[project]) {
        acc[project] = [];
      }
      acc[project].push(item);
      return acc;
    }, {} as Record<string, Array<{
      id: string;
      title: string;
      dueDate: Date | null;
      client: string;
      project: string;
      labels: Array<{ name: string; color: string }>;
    }>>);
    
    // Flatten grouped items with project headers
    const flattenedItems: Array<{
      id: string;
      type?: string;
      name?: string;
      title?: string;
      dueDate?: Date | null;
      client?: string;
      project?: string;
      labels?: Array<{ name: string; color: string }>;
    }> = [];
    Object.entries(groupedByProject).forEach(([project, projectItems]) => {
      // Add project header
      flattenedItems.push({ 
        id: `project-${project}`, 
        type: 'project-header', 
        name: project 
      });
      // Add deliverables for this project
      flattenedItems.push(...projectItems);
    });
    
    return flattenedItems;
  })() : (() => {
    // For admin tasks, sort by due date (chronological order)
    return [...items].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  })();
  
  const maxInitialItems = 3;
  
  // For deliverables, count only actual deliverable cards (not project headers)
  const actualDeliverableCount = type === 'deliverable' 
    ? processedItems.filter(item => item.type !== 'project-header').length
    : processedItems.length;
  
  const hasMoreItems = actualDeliverableCount > maxInitialItems;
  
  // Show items up to the limit, but always include project headers
  const visibleItems = expandedItems ? processedItems : (() => {
    if (type !== 'deliverable') {
      return processedItems.slice(0, maxInitialItems);
    }
    
    // For deliverables, show project headers and deliverables up to the limit
    const result: any[] = [];
    let deliverableCount = 0;
    
    for (const item of processedItems) {
      if (item.type === 'project-header') {
        result.push(item);
      } else {
        if (deliverableCount < maxInitialItems) {
          result.push(item);
          deliverableCount++;
        } else {
          break;
        }
      }
    }
    
    return result;
  })();

  const handleToggleExpanded = () => {
    setExpandedItems(!expandedItems);
  };

  const handleShowInlineForm = () => {
    setShowInlineForm(true);
  };

  const handleHideInlineForm = () => {
    setShowInlineForm(false);
  };

  const handleSaveDeliverable = async (formData: {
    title: string;
    dueDate: string;
    project: string;
    assignee?: string;
    label?: string;
  }) => {
    try {
      // Create the deliverable in Trello
      const newCard = await trelloService.createCard(listIds.deliverables, {
        name: formData.title,
        due: formData.dueDate
      });

      // Set custom fields
      if (formData.project) {
        console.log('Setting Project field:', formData.project);
        await trelloService.setCustomField(newCard.id, 'Project', formData.project);
      }
      
      console.log('Setting Client field:', client.name);
      await trelloService.setCustomField(newCard.id, 'Client', client.name);

      // Refresh data and hide form
      handleHideInlineForm();
      
      // Refresh dashboard data to show the new deliverable
      if ((window as any).refreshDashboardData) {
        (window as any).refreshDashboardData();
      }
      
      // Scroll the entire page to show the new deliverable
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
    } catch (error) {
      console.error('Error creating deliverable:', error);
    }
  };

  const handleSaveAdminTask = async (formData: {
    title: string;
    dueDate: string;
    project: string;
    assignee?: string;
  }) => {
    try {
      // Find member ID by name
      const memberId = formData.assignee 
        ? members.find(member => member.fullName === formData.assignee)?.id
        : undefined;

      // Create the admin task in Trello
      const newCard = await trelloService.createCard(listIds.adminTasks, {
        name: formData.title,
        due: formData.dueDate,
        idMembers: memberId ? [memberId] : undefined
      });

      // Set custom fields
      if (formData.project) {
        console.log('Setting Project field:', formData.project);
        await trelloService.setCustomField(newCard.id, 'Project', formData.project);
      }
      
      console.log('Setting Client field:', client.name);
      await trelloService.setCustomField(newCard.id, 'Client', client.name);

      // Refresh data and hide form
      handleHideInlineForm();
      
      // Refresh dashboard data to show the new admin task
      if ((window as any).refreshDashboardData) {
        (window as any).refreshDashboardData();
      }
      
      // Scroll the entire page to show the new admin task
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
    } catch (error) {
      console.error('Error creating admin task:', error);
    }
  };

  const handleUpdateDeliverable = async (id: string, updates: { completed?: boolean }) => {
    try {
      // Update the card in Trello in the background
      if (updates.completed !== undefined) {
        if (updates.completed) {
          await trelloService.addLabelByName(id, 'Completed', 'green');
        } else {
          await trelloService.removeLabelByName(id, 'Completed');
        }
      }
      // No refresh needed - the UI updates immediately
    } catch (error) {
      console.error('Error updating deliverable:', error);
    }
  };

  const handleArchiveDeliverable = async (id: string) => {
    try {
      // Archive the card in Trello in the background
      await trelloService.updateCard(id, { closed: true });
      // No refresh needed - the UI updates immediately
    } catch (error) {
      console.error('Error archiving deliverable:', error);
    }
  };

  return (
    <Box 
      ref={columnRef}
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '100%'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* All Content in One Container */}
      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {visibleItems.map((item) => (
          <Box key={item.id} sx={{ mb: 1 }}>
            {type === 'deliverable' && item.type === 'project-header' ? (
              // Project header
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#ccc',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  mb: 0.5,
                  textAlign: 'left'
                }}
              >
                {item.name}
              </Typography>
            ) : type === 'deliverable' ? (
              <DeliverableCard 
                deliverable={item} 
                onUpdate={handleUpdateDeliverable}
                onArchive={handleArchiveDeliverable}
              />
            ) : (
              <AdminTaskCard 
                task={item} 
                onUpdate={handleUpdateDeliverable}
                onArchive={handleArchiveDeliverable}
              />
            )}
          </Box>
        ))}
        
        {/* Add Item Button - Only on hover, right below cards */}
        {isHovering && !showInlineForm && (
          <Box sx={{ mb: 1 }}>
            <Box 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={handleShowInlineForm}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#888',
                  fontSize: '0.75rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  py: 1,
                  border: '1px dashed #444',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#ff6b35',
                    borderColor: '#ff6b35'
                  }
                }}
              >
                + Add {type === 'deliverable' ? 'Deliverable' : 'Admin Task'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Inline Form - Right after cards */}
        {showInlineForm && (
          <Box ref={formRef} sx={{ mb: 1 }}>
                <InlineForm
                  type={type}
                  clientName={client.name}
                  projects={customFields?.projects || []}
                  members={members || []}
                  onSave={type === 'deliverable' ? handleSaveDeliverable : handleSaveAdminTask}
                  onCancel={handleHideInlineForm}
                />
          </Box>
        )}

        {/* Load More Button - Inside the same container */}
        {hasMoreItems && (
          <Box sx={{ mb: 1 }}>
            <Button
              size="small"
              onClick={handleToggleExpanded}
              sx={{ 
                color: '#ff6b35',
                textTransform: 'none',
                fontSize: '0.75rem',
                p: 0,
                minWidth: 'auto',
                alignSelf: 'flex-start',
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              {expandedItems ? 'Show Less' : `Load ${actualDeliverableCount - maxInitialItems} more`}
            </Button>
          </Box>
        )}
      </Box> {/* End of All Content Container */}
    </Box>
  );
}