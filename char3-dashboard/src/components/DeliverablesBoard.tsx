'use client';

import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useStore } from '@/store/useStore';
import { ClientColumn } from './ClientColumn';

export function DeliverablesBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const { clients, customFields } = useStore();

  // Get all unique clients from custom fields if available, otherwise use clients from store
  const allClients = customFields?.clients || [];
  
  // Create a map of client data
  const clientsMap = new Map();
  
  // Initialize all clients from custom fields
  allClients.forEach(clientName => {
    clientsMap.set(clientName, {
      name: clientName,
      deliverables: [],
      adminTasks: []
    });
  });
  
  // Populate with actual data from store
  clients.forEach(client => {
    if (clientsMap.has(client.name)) {
      clientsMap.set(client.name, client);
    } else {
      clientsMap.set(client.name, client);
    }
  });
  
  const displayClients = Array.from(clientsMap.values());

  // Expose scroll function globally
  useEffect(() => {
    (window as any).scrollToBottom = () => {
      if (boardRef.current) {
        boardRef.current.scrollTo({
          top: boardRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };
  }, []);

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#1a1a1a',
      borderRadius: 2,
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Scrollable Board Container */}
      <Box 
        ref={boardRef}
        sx={{ 
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#2a2a2a',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#555',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#666',
          },
        }}>
        {/* Board Content - Back to working flex structure */}
        <Box sx={{ 
          display: 'flex',
          bgcolor: '#1a1a1a',
          minHeight: 'calc(100vh - 200px)',
          minWidth: `${displayClients.length * 200}px`
        }}>
          {displayClients.map((client, index) => (
            <Box
              key={client.name}
              sx={{
                flex: 1,
                minWidth: 200,
                borderRight: index < displayClients.length - 1 ? '1px solid #444' : 'none',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Client Header */}
              <Box sx={{ 
                bgcolor: '#1a1a1a',
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
                    color: '#e0e0e0',
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}
                >
                  {client.name}
                </Typography>
              </Box>
              
              {/* DELIVERABLES Header */}
              <Box sx={{ 
                bgcolor: '#2a2a2a',
                borderBottom: '1px solid #444',
                py: 1,
                px: 2,
                textAlign: 'center',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                ...(index === 0 && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '100%',
                    width: `${(displayClients.length - 1) * 200}px`,
                    height: '100%',
                    bgcolor: '#2a2a2a',
                    borderBottom: '1px solid #444',
                    zIndex: 1
                  }
                })
              }}>
                {index === 0 && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: `${(displayClients.length * 200) / 2}px`,
                      transform: 'translate(-50%, -50%)',
                      color: '#e0e0e0',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: '#2a2a2a',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      zIndex: 10
                    }}
                  >
                    DELIVERABLES
                  </Typography>
                )}
              </Box>
              
              {/* Deliverables Content */}
              <Box sx={{ 
                flex: 1,
                p: 1,
                bgcolor: '#1a1a1a',
                position: 'relative',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#2a2a2a',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#555',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#666',
                }
              }}>
                <ClientColumn
                  client={client}
                  type="deliverable"
                />
              </Box>
              
              {/* ADMIN TASKS Header */}
              <Box sx={{ 
                bgcolor: '#2a2a2a',
                borderBottom: '1px solid #444',
                borderTop: '1px solid #444',
                py: 1,
                px: 2,
                textAlign: 'center',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                ...(index === 0 && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '100%',
                    width: `${(displayClients.length - 1) * 200}px`,
                    height: '100%',
                    bgcolor: '#2a2a2a',
                    borderBottom: '1px solid #444',
                    borderTop: '1px solid #444',
                    zIndex: 1
                  }
                })
              }}>
                {index === 0 && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: `${(displayClients.length * 200) / 2}px`,
                      transform: 'translate(-50%, -50%)',
                      color: '#e0e0e0',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      backgroundColor: '#2a2a2a',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      zIndex: 10
                    }}
                  >
                    ADMIN TASKS
                  </Typography>
                )}
              </Box>
              
              {/* Admin Tasks Content */}
              <Box sx={{ 
                flex: 1,
                p: 1,
                bgcolor: '#1a1a1a',
                position: 'relative',
                overflowY: 'auto',
                minHeight: '200px',
                maxHeight: '400px',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#2a2a2a',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#555',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#666',
                }
              }}>
                <ClientColumn
                  client={client}
                  type="admin-task"
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}