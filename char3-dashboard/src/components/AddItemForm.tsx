'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { trelloService } from '@/services/trelloService';

interface AddItemFormProps {
  type: 'deliverable' | 'admin-task';
  client: string;
  onClose: () => void;
}

export function AddItemForm({ type, client, onClose }: AddItemFormProps) {
  const { customFields, addDeliverable, addAdminTask } = useStore();
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    project: '',
    assignee: '',
    label: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the item in Trello
      const cardData = {
        name: formData.title,
        due: formData.dueDate || undefined,
      };

      // Find the appropriate list
      const boardData = await trelloService.getBoardData();
      const listName = type === 'deliverable' ? 'deliverable' : 'account';
      const targetList = boardData.lists.find((list: { name: string; id: string }) => 
        list.name.toLowerCase().includes(listName)
      );

      if (!targetList) {
        throw new Error(`${type} list not found`);
      }

      const newCard = await trelloService.createCard(targetList.id, cardData);

      // Set custom fields
      if (formData.project) {
        const projectField = boardData.customFields.find((cf: { name: string; options: Array<{ id: string; value: { text: string } }> }) => cf.name === 'Project');
        if (projectField) {
          const projectOption = projectField.options.find((opt: { value: { text: string }; id: string }) => 
            opt.value.text === formData.project
          );
          if (projectOption) {
            await trelloService.setCustomField(newCard.id, projectField.id, projectOption.id);
          }
        }
      }

      // Set client field
      const clientField = boardData.customFields.find((cf: { name: string; options: Array<{ id: string; value: { text: string } }> }) => cf.name === 'Client');
      if (clientField) {
        const clientOption = clientField.options.find((opt: { value: { text: string }; id: string }) => 
          opt.value.text === client
        );
        if (clientOption) {
          await trelloService.setCustomField(newCard.id, clientField.id, clientOption.id);
        }
      }

      // Add to local store
      const itemData = {
        name: formData.title,
        due: formData.dueDate,
        client,
        project: formData.project,
        assignee: formData.assignee,
        labels: formData.label ? [{ name: formData.label, color: 'blue' }] : [],
      };

      if (type === 'deliverable') {
        addDeliverable(client, itemData);
      } else {
        addAdminTask(client, itemData);
      }

      onClose();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Error creating item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 2,
        mt: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Add {type === 'deliverable' ? 'Deliverable' : 'Admin Task'}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#888' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title */}
          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#666' },
                '&.Mui-focused fieldset': { borderColor: '#ff6b35' },
              },
              '& .MuiInputLabel-root': { color: '#888' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#ff6b35' },
            }}
          />

          {/* Due Date */}
          <TextField
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#666' },
                '&.Mui-focused fieldset': { borderColor: '#ff6b35' },
              },
              '& .MuiInputLabel-root': { color: '#888' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#ff6b35' },
            }}
          />

          {/* Project */}
          <FormControl size="small" required>
            <InputLabel sx={{ color: '#888' }}>Project</InputLabel>
            <Select
              value={formData.project}
              onChange={(e) => handleInputChange('project', e.target.value)}
              label="Project"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff6b35' },
                '& .MuiSvgIcon-root': { color: '#888' },
              }}
            >
              {customFields.projects.map((project) => (
                <MenuItem key={project} value={project} sx={{ color: 'white' }}>
                  {project}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Assignee (for admin tasks) */}
          {type === 'admin-task' && (
            <FormControl size="small" required>
              <InputLabel sx={{ color: '#888' }}>Assignee</InputLabel>
              <Select
                value={formData.assignee}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                label="Assignee"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff6b35' },
                  '& .MuiSvgIcon-root': { color: '#888' },
                }}
              >
                <MenuItem value="Project Lead" sx={{ color: 'white' }}>Project Lead</MenuItem>
                <MenuItem value="Designer" sx={{ color: 'white' }}>Designer</MenuItem>
                <MenuItem value="UX Designer" sx={{ color: 'white' }}>UX Designer</MenuItem>
                <MenuItem value="Developer" sx={{ color: 'white' }}>Developer</MenuItem>
                <MenuItem value="Laura Lin" sx={{ color: 'white' }}>Laura Lin</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Label (optional) */}
          <FormControl size="small">
            <InputLabel sx={{ color: '#888' }}>Label (Optional)</InputLabel>
            <Select
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              label="Label (Optional)"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ff6b35' },
                '& .MuiSvgIcon-root': { color: '#888' },
              }}
            >
              <MenuItem value="" sx={{ color: 'white' }}>None</MenuItem>
              <MenuItem value="Waiting on Decision" sx={{ color: 'white' }}>Waiting on Decision</MenuItem>
              <MenuItem value="Blocked" sx={{ color: 'white' }}>Blocked</MenuItem>
              <MenuItem value="In Progress" sx={{ color: 'white' }}>In Progress</MenuItem>
              <MenuItem value="Review" sx={{ color: 'white' }}>Review</MenuItem>
              <MenuItem value="Done" sx={{ color: 'white' }}>Done</MenuItem>
            </Select>
          </FormControl>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              onClick={onClose}
              size="small"
              sx={{ color: '#888' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={isSubmitting}
              sx={{
                bgcolor: '#ff6b35',
                '&:hover': { bgcolor: '#e55a2b' },
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
}
