'use client';

import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Check, Archive } from '@mui/icons-material';

interface AdminTaskCardProps {
  task: {
    id: string;
    title: string;
    dueDate: Date | null;
    assignee: string;
    project: string;
    labels: Array<{ name: string; color: string }>;
    completed?: boolean;
  };
  onUpdate?: (id: string, updates: { completed?: boolean }) => void;
  onArchive?: (id: string) => void;
}

export function AdminTaskCard({ task, onUpdate, onArchive }: AdminTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(task.completed || false);
  const [isArchived, setIsArchived] = useState(false);
  
  // Ensure labels is always an array
  const safeLabels = task.labels || [];
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLabelColor = (color: string, name?: string) => {
    // Check for "Need More Info" label first
    if (name && name.toLowerCase().includes('need more info')) {
      return '#8b6db8'; // Darker purple for better contrast
    }
    
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

  const getAssigneeColor = (name: string) => {
    if (!name || name === 'Unassigned') return '#ff6b35';
    
    // Create a simple hash from the name to get consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to select from a predefined color palette
    const colors = [
      '#4caf50', // Green
      '#ff9800', // Orange
      '#9c27b0', // Purple
      '#f44336', // Red
      '#2196f3', // Blue
      '#ffeb3b', // Yellow
      '#795548', // Brown
      '#607d8b', // Blue Grey
      '#00bfff', // Bright Sky Blue (Laura's color)
      '#e91e63', // Pink
      '#3f51b5', // Indigo
      '#009688', // Teal
    ];
    
    const colorIndex = Math.abs(hash) % colors.length;
    const selectedColor = colors[colorIndex];
    
    // Debug logging
    console.log(`Assignee: ${name}, Hash: ${hash}, Index: ${colorIndex}, Color: ${selectedColor}`);
    
    return selectedColor;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open Trello if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    window.open(`https://trello.com/c/${task.id}`, '_blank');
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !localCompleted;
    setLocalCompleted(newCompleted);
    onUpdate?.(task.id, { completed: newCompleted });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsArchived(true);
    onArchive?.(task.id);
  };

  // Don't render if archived
  if (isArchived) {
    return null;
  }

  return (
    <Box 
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        p: 1,
        bgcolor: localCompleted ? '#1a1a1a' : '#2a2a2a',
        borderRadius: 1,
        border: '1px solid #444',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: localCompleted ? 0.6 : 1,
        position: 'relative',
        minHeight: '60px',
        '&:hover': {
          bgcolor: localCompleted ? '#1a1a1a' : '#333',
          borderColor: '#555'
        }
      }}
    >
      {/* Completion Checkbox with Slideover Animation */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, position: 'relative', width: '100%' }}>
        {/* Animated Checkbox - Slides in on hover */}
        <IconButton
          size="small"
          onClick={handleComplete}
          sx={{
            position: 'absolute',
            left: -20,
            top: 0,
            p: 0.25,
            minWidth: 'auto',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '1px solid #666',
            bgcolor: localCompleted ? '#4caf50' : 'transparent',
            transform: isHovered ? 'translateX(20px)' : 'translateX(0)',
            opacity: isHovered ? 1 : 0,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: localCompleted ? '#45a049' : '#333',
              transform: 'translateX(20px) scale(1.1)',
            }
          }}
        >
          {localCompleted && (
            <Check sx={{ fontSize: '10px', color: 'white' }} />
          )}
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Title Container - Slides on hover */}
          <Box sx={{ 
            transform: isHovered ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 0.2s ease-in-out',
            width: '100%',
            maxWidth: isHovered ? 'calc(100% - 20px)' : 'calc(100% - 20px)'
          }}>
      {/* Labels */}
      {safeLabels.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
          {safeLabels.map((label, index) => (
            <Box
              key={index}
              sx={{
                px: 0.5,
                py: 0.25,
                bgcolor: getLabelColor(label.color, label.name),
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
                color: localCompleted ? '#666' : '#b0b0b0',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                mb: 0.5,
                textDecoration: localCompleted ? 'line-through' : 'none',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
                lineHeight: 1.2
              }}
            >
              {task.title}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Assignee */}
      {task.assignee && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: getAssigneeColor(task.assignee),
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
              color: getAssigneeColor(task.assignee),
              fontSize: '0.625rem',
              fontWeight: 'bold'
            }}
          >
            {task.assignee}
          </Typography>
        </Box>
      )}

      {/* Archive Button - Top Right */}
      <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={handleArchive}
          sx={{
            p: 0.25,
            minWidth: 'auto',
            width: '20px',
            height: '20px',
            bgcolor: '#444',
            '&:hover': {
              bgcolor: '#ff6b35'
            }
          }}
        >
          <Archive sx={{ fontSize: '12px', color: 'white' }} />
        </IconButton>
      </Box>

      {/* Due Date - Bottom Right Corner */}
      {task.dueDate && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 4, 
          right: 4,
          zIndex: 1
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#888',
              fontSize: '0.625rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(42, 42, 42, 0.9)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            {formatDate(task.dueDate)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}