'use client';

import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

interface InlineFormProps {
  type: 'deliverable' | 'admin-task';
  clientName: string;
  projects: string[];
  members: Array<{
    id: string;
    fullName: string;
    username: string;
  }>;
  onSave: (data: {
    title: string;
    dueDate: string;
    project: string;
    assignee?: string;
  }) => void;
  onCancel: () => void;
}

export function InlineForm({ type, projects, members, onSave, onCancel }: InlineFormProps) {
  console.log('InlineForm received projects:', projects);
  
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    project: '',
    assignee: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box 
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 1.5,
        bgcolor: '#2a2a2a',
        borderRadius: 1,
        border: '1px solid #444',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      {/* Title */}
      <TextField
        placeholder="Enter title..."
        value={formData.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        size="small"
        required
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#3a3a3a',
            color: 'white',
            fontSize: '0.75rem',
            height: '32px',
            '& fieldset': {
              borderColor: '#555',
            },
            '&:hover fieldset': {
              borderColor: '#666',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ff6b35',
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#888',
            opacity: 1,
          },
        }}
      />

      {/* Due Date */}
      <TextField
        type="date"
        value={formData.dueDate}
        onChange={(e) => handleInputChange('dueDate', e.target.value)}
        size="small"
        InputLabelProps={{
          shrink: true,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#3a3a3a',
            color: 'white',
            fontSize: '0.75rem',
            height: '32px',
            '& fieldset': {
              borderColor: '#555',
            },
            '&:hover fieldset': {
              borderColor: '#666',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ff6b35',
            },
          },
        }}
      />

      {/* Project */}
      <select
        value={formData.project}
        onChange={(e) => handleInputChange('project', e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: '#3a3a3a',
          border: '1px solid #555',
          borderRadius: '4px',
          color: 'white',
          fontSize: '0.75rem',
          outline: 'none',
          height: '32px'
        }}
      >
        <option value="" style={{ color: '#888' }}>Select Project</option>
        {projects.map((project) => (
          <option key={project} value={project} style={{ color: 'white' }}>
            {project}
          </option>
        ))}
      </select>

      {/* Admin Task specific fields */}
      {type === 'admin-task' && (
        <>
          {/* Assignee */}
          <select
            value={formData.assignee}
            onChange={(e) => handleInputChange('assignee', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#3a3a3a',
              border: '1px solid #555',
              borderRadius: '4px',
              color: 'white',
              fontSize: '0.75rem',
              outline: 'none',
              height: '32px'
            }}
          >
            <option value="" style={{ color: '#888' }}>Select Assignee</option>
            {members.map((member) => (
              <option key={member.id} value={member.fullName} style={{ color: 'white' }}>
                {member.fullName}
              </option>
            ))}
          </select>

        </>
      )}

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          size="small"
          sx={{
            bgcolor: '#ff6b35',
            color: 'white',
            fontSize: '0.625rem',
            py: 0.25,
            px: 1,
            minWidth: 'auto',
            height: '24px',
            '&:hover': {
              bgcolor: '#e55a2b',
            },
          }}
        >
          Save
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          size="small"
          sx={{
            bgcolor: '#555',
            color: 'white',
            fontSize: '0.625rem',
            py: 0.25,
            px: 1,
            minWidth: 'auto',
            height: '24px',
            '&:hover': {
              bgcolor: '#666',
            },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
