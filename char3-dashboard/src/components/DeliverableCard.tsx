'use client';

import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Check, Archive } from '@mui/icons-material';

interface DeliverableCardProps {
  deliverable: {
    id: string;
    title: string;
    dueDate: Date | null;
    project: string;
    labels: any[];
    completed?: boolean;
  };
  onUpdate?: (id: string, updates: { completed?: boolean }) => void;
  onArchive?: (id: string) => void;
}

export function DeliverableCard({ deliverable, onUpdate, onArchive }: DeliverableCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(deliverable.completed || false);
  const [isArchived, setIsArchived] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (date: Date | null) => {
    if (!date) return false;
    return date < new Date();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open Trello if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    window.open(`https://trello.com/c/${deliverable.id}`, '_blank');
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !localCompleted;
    setLocalCompleted(newCompleted);
    onUpdate?.(deliverable.id, { completed: newCompleted });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsArchived(true);
    onArchive?.(deliverable.id);
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
        p: 0.75,
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
            {/* Deliverable Title */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: localCompleted ? '#666' : '#b0b0b0',
                fontSize: '0.75rem',
                mb: 0.25,
                textDecoration: localCompleted ? 'line-through' : 'none',
                fontWeight: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
                lineHeight: 1.2
              }}
            >
              {deliverable.title}
            </Typography>
          </Box>
          
        </Box>
      </Box>

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
      {deliverable.dueDate && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 4, 
          right: 4,
          zIndex: 1
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: isOverdue(deliverable.dueDate) ? '#ff6b35' : '#888',
              fontSize: '0.625rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(42, 42, 42, 0.9)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            {formatDate(deliverable.dueDate)}
          </Typography>
        </Box>
      )}

    </Box>
  );
}