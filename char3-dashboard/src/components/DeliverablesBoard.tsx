'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useStore } from '@/store/useStore';
import { ClientColumn } from './ClientColumn';

export function DeliverablesBoard() {
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

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#1a1a1a',
      overflow: 'hidden'
    }}>
      {/* Scrollable Board Container */}
      <Box sx={{ 
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        {/* Board Content */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: `${displayClients.length * 200}px`
        }}>
          {/* Client Headers Row */}
          <Box sx={{ 
            display: 'flex',
            bgcolor: '#2a2a2a',
            borderBottom: '1px solid #444',
            minHeight: 40
          }}>
            {displayClients.map((client, index) => (
              <Box
                key={client.name}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: index < displayClients.length - 1 ? '1px solid #444' : 'none',
                  py: 1
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}
                >
                  {client.name}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* DELIVERABLES Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* DELIVERABLES Header */}
            <Box sx={{ 
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              bgcolor: '#2a2a2a',
              borderBottom: '1px solid #444',
              py: 1,
              px: 2,
              zIndex: 10
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            {/* Deliverables Content */}
            <Box sx={{ 
              display: 'flex',
              bgcolor: '#1a1a1a',
              minHeight: 250
            }}>
              {displayClients.map((client, index) => (
                <ClientColumn
                  key={`deliverable-${client.name}`}
                  client={client}
                  type="deliverable"
                />
              ))}
            </Box>
          </Box>

          {/* ADMIN TASKS Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* ADMIN TASKS Header */}
            <Box sx={{ 
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              bgcolor: '#2a2a2a',
              borderBottom: '1px solid #444',
              borderTop: '1px solid #444',
              py: 1,
              px: 2,
              zIndex: 10
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                ADMIN TASKS
              </Typography>
            </Box>

            {/* Admin Tasks Content */}
            <Box sx={{ 
              display: 'flex',
              bgcolor: '#1a1a1a',
              minHeight: 400
            }}>
              {displayClients.map((client, index) => (
                <ClientColumn
                  key={`admin-${client.name}`}
                  client={client}
                  type="admin-task"
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}