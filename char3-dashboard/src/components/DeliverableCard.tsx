'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface DeliverableCardProps {
  deliverable: {
    id: string;
    title: string;
    dueDate: Date | null;
    project: string;
    labels: any[];
  };
}

export function DeliverableCard({ deliverable }: DeliverableCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (date: Date | null) => {
    if (!date) return false;
    return date < new Date();
  };

  return (
    <Box sx={{ 
      p: 1,
      bgcolor: '#2a2a2a',
      borderRadius: 1,
      border: '1px solid #444',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: '#333',
        borderColor: '#555'
      }
    }}>
      {/* Deliverable Title */}
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#b0b0b0',
          fontSize: '0.75rem',
          mb: 0.5,
          ml: 1,
          fontWeight: 'normal'
        }}
      >
        {deliverable.title}
      </Typography>
      
      {/* Due Date */}
      {deliverable.dueDate && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: isOverdue(deliverable.dueDate) ? '#ff6b35' : '#888',
              fontSize: '0.625rem',
              fontWeight: 'bold'
            }}
          >
            {formatDate(deliverable.dueDate)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}