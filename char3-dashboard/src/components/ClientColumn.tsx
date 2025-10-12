'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { DeliverableCard } from './DeliverableCard';
import { AdminTaskCard } from './AdminTaskCard';

interface ClientColumnProps {
  client: {
    name: string;
    deliverables: any[];
    adminTasks: any[];
  };
  type: 'deliverable' | 'admin-task';
}

export function ClientColumn({ client, type }: ClientColumnProps) {
  const [expandedItems, setExpandedItems] = useState(false);
  
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
    }, {} as Record<string, any[]>);
    
    // Flatten grouped items with project headers
    const flattenedItems: any[] = [];
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
  })() : items;
  
  const maxInitialItems = 3;
  const hasMoreItems = processedItems.length > maxInitialItems;
  const visibleItems = expandedItems ? processedItems : processedItems.slice(0, maxInitialItems);

  const handleToggleExpanded = () => {
    setExpandedItems(!expandedItems);
  };

  return (
    <Box 
      sx={{ 
        flex: 1,
        minWidth: 200,
        bgcolor: '#1a1a1a',
        borderRight: '1px solid #444',
        display: 'flex',
        flexDirection: 'column',
        '&:last-child': {
          borderRight: 'none'
        }
      }}
    >
      {/* Items */}
      <Box sx={{ flex: 1, p: 1 }}>
        {visibleItems.map((item, index) => (
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
              <DeliverableCard deliverable={item} />
            ) : (
              <AdminTaskCard task={item} />
            )}
          </Box>
        ))}
      </Box>

      {/* Load More Button */}
      {hasMoreItems && (
        <Box sx={{ px: 1, pb: 1 }}>
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
            {expandedItems ? 'Show Less' : `Load ${processedItems.length - maxInitialItems} more`}
          </Button>
        </Box>
      )}
    </Box>
  );
}