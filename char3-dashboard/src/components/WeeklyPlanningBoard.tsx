'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

export function WeeklyPlanningBoard() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Sample task for Monday
  const mondayTask = {
    title: 'Dashboard Components',
    labels: ['DESIGN', 'M'],
    project: 'iLitigate',
    assignee: 'D',
    role: 'Designer'
  };

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#1a1a1a',
      overflow: 'hidden'
    }}>
      {/* Calendar Grid */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        bgcolor: '#1a1a1a',
        minHeight: 'calc(100vh - 200px)'
      }}>
        {days.map((day, index) => (
          <Box
            key={day}
            sx={{
              flex: 1,
              minWidth: 0,
              borderRight: index < days.length - 1 ? '1px solid #444' : 'none',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Day Header */}
            <Box sx={{ 
              bgcolor: '#2a2a2a',
              borderBottom: '1px solid #444',
              py: 1,
              px: 2,
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}
              >
                {day}
              </Typography>
            </Box>
            
            {/* Day Content */}
            <Box sx={{ 
              flex: 1,
              p: 1,
              bgcolor: '#1a1a1a',
              position: 'relative'
            }}>
              {day === 'Monday' ? (
                // Sample task card for Monday
                <Box sx={{ 
                  p: 1.5,
                  bgcolor: '#3a3a3a',
                  borderRadius: 1,
                  border: '1px solid #555',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#444' },
                  transition: 'all 0.2s ease'
                }}>
                  <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem', mb: 1, fontWeight: 'bold' }}>
                    {mondayTask.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    {mondayTask.labels.map((label, labelIndex) => (
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
                  
                  <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5 }}>
                    {mondayTask.project}
                  </Typography>
                  
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
                      {mondayTask.assignee}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem' }}>
                      {mondayTask.role}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                // Placeholder for other days
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    mt: 2
                  }}
                >
                  Drop tasks here
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}