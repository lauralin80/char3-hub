'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface AdminTaskCardProps {
  task: {
    id: string;
    title: string;
    dueDate: Date | null;
    assignee: string;
    project: string;
    labels: Array<{ name: string; color: string }>;
  };
}

export function AdminTaskCard({ task }: AdminTaskCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLabelColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'orange': '#ff6b35',
      'red': '#eb5a46',
      'green': '#61bd4f',
      'blue': '#0079bf',
      'yellow': '#f2d600',
      'purple': '#c377e0',
      'pink': '#ff78cb',
      'sky': '#00c2e0',
      'lime': '#51e898',
      'black': '#344563',
      'red_dark': '#eb5a46'
    };
    return colorMap[color] || '#888';
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      {/* Labels */}
      {task.labels.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
          {task.labels.map((label, index) => (
            <Box
              key={index}
              sx={{
                px: 0.5,
                py: 0.25,
                bgcolor: getLabelColor(label.color),
                borderRadius: 0.25,
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
      
      {/* Task Title */}
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#b0b0b0',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          mb: 0.5
        }}
      >
        {task.title}
      </Typography>
      
      {/* Meta Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        {/* Due Date */}
        {task.dueDate && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888',
              fontSize: '0.625rem',
              fontWeight: 'bold'
            }}
          >
            {formatDate(task.dueDate)}
          </Typography>
        )}
        
        {/* Assignee */}
        {task.assignee && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.5rem',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {getInitials(task.assignee)}
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#888',
                fontSize: '0.625rem',
                fontWeight: 'bold'
              }}
            >
              {task.assignee}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}