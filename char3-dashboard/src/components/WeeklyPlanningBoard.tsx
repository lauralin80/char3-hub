'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { AdminTaskCard } from './AdminTaskCard';
import { trelloService } from '../services/trelloService';

interface AdminTask {
  id: string;
  title: string;
  dueDate: Date | null;
  assignee: string;
  project: string;
  labels: Array<{ name: string; color: string }>;
  completed?: boolean;
}

interface WeeklyPlanningBoardProps {
  adminTasks: AdminTask[];
  allBoardsData: {
    accountManagement: any;
    designUx: any;
    development: any;
  } | null;
  onUpdateTask?: (id: string, updates: { completed?: boolean }) => void;
  onArchiveTask?: (id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, day: string) => void;
  onMoveTask?: (taskId: string, fromDay: string, toDay: string) => void;
  onMoveTaskStart?: (taskId: string, fromDay: string, toDay: string) => void;
  onMoveTaskEnd?: (taskId: string, fromDay: string, toDay: string) => void;
  onRefresh?: () => void;
}

export function WeeklyPlanningBoard({ adminTasks, allBoardsData, onUpdateTask, onArchiveTask, onDragOver, onDrop, onMoveTask, onMoveTaskStart, onMoveTaskEnd, onRefresh }: WeeklyPlanningBoardProps) {
  const [dragOverDay, setDragOverDay] = React.useState<string | null>(null);
  const days = ['Overdue', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
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
    console.log(`WeeklyPlanningBoard - Assignee: ${name}, Hash: ${hash}, Index: ${colorIndex}, Color: ${selectedColor}`);
    
    return selectedColor;
  };

  const handleCardClick = (taskId: string, e: React.MouseEvent) => {
    // Don't open Trello if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    window.open(`https://trello.com/c/${taskId}`, '_blank');
  };

  const isTaskCompleted = (task: any) => {
    return task.dueComplete === true;
  };
  
  // Get current week dates (Sunday to Saturday)
  const getCurrentWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Reset time
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      date.setHours(0, 0, 0, 0); // Reset time
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  

  // Get all planned tasks from all boards
  const getAllPlannedTasks = () => {
    const tasksByDay: {[day: string]: any[]} = {
      'Overdue': [],
      'Sunday': [],
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': []
    };

    if (!allBoardsData) return tasksByDay;

    // Helper function to extract custom field value
    const extractCustomFieldValue = (customFieldItems: any[], customFields: any[], fieldName: string) => {
      const customField = customFields.find((cf: any) => cf.name === fieldName);
      const fieldItem = customFieldItems?.find((cf: any) => cf.idCustomField === customField?.id);
      
      if (!fieldItem) return '';
      
      // Handle different field types
      if (fieldItem.value?.date) {
        // If it's a full ISO string, extract just the date part
        const dateValue = fieldItem.value.date;
        if (dateValue.includes('T')) {
          return dateValue.split('T')[0]; // Return YYYY-MM-DD part only
        }
        return dateValue;
      } else if (fieldItem.value?.text) {
        return fieldItem.value.text;
      } else if (fieldItem.idValue) {
        // For dropdown fields, find the option text
        const option = customField?.options?.find((opt: any) => opt.id === fieldItem.idValue);
        return option?.value?.text || '';
      }
      
      return '';
    };

    // Process admin tasks (Account Management board) - use Planned Start Date and Planned End Date
    if (allBoardsData && allBoardsData.accountManagement) {
      // Find the admin tasks list (not deliverables)
      const adminTasksList = allBoardsData.accountManagement.lists.find((list: any) => 
        list.name.toLowerCase().includes('account') || list.name.toLowerCase().includes('admin')
      );
      
      if (adminTasksList) {
        // Only process cards that are in the admin tasks list
        const adminTaskCards = allBoardsData.accountManagement.cards.filter((card: any) => 
          card.idList === adminTasksList.id
        );
        
        adminTaskCards.forEach((card: any) => {
          const plannedStartDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.accountManagement?.customFields || [], 'Planned Start Date');
          const plannedEndDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.accountManagement?.customFields || [], 'Planned End Date');
          
          // Create the base task object
          const task = {
            id: card.id,
            title: card.name,
            startDate: null as Date | null,
            endDate: null as Date | null,
            dueDate: card.due ? new Date(card.due) : null,
            assignee: card.members?.[0]?.fullName || 'Unassigned',
            project: extractCustomFieldValue(card.customFieldItems, allBoardsData?.accountManagement?.customFields || [], 'Project') || 'No Project',
            client: extractCustomFieldValue(card.customFieldItems, allBoardsData?.accountManagement?.customFields || [], 'Client') || 'Unassigned',
            boardTag: 'ACCT MGMT',
            boardName: 'Account Management',
            labels: card.labels || [],
            dueComplete: card.dueComplete
          };

          // Check if admin task is overdue (due before this week and not completed)
          const isOverdue = card.due && // Has a due date
                           new Date(card.due) < weekDates[0] && // Due before this week
                           !card.closed && // Not archived
                           !card.dueComplete; // Not completed
          
          if (isOverdue) {
            // Task is overdue - add to overdue column regardless of planned dates
            if (plannedStartDate) {
              // Parse the start date for display
              const [startYear, startMonth, startDay] = plannedStartDate.split('-').map(Number);
              const startDate = new Date(startYear, startMonth - 1, startDay);
              startDate.setHours(0, 0, 0, 0);
              task.startDate = startDate;
              task.endDate = startDate;
              tasksByDay['Overdue'].push({...task, displayDate: new Date(startDate)});
            } else {
              // No planned dates but task is overdue - add to overdue column
              tasksByDay['Overdue'].push({...task, displayDate: new Date(card.due)});
            }
          } else if (plannedStartDate) {
            // Parse the start date
            const [startYear, startMonth, startDay] = plannedStartDate.split('-').map(Number);
            const startDate = new Date(startYear, startMonth - 1, startDay);
            startDate.setHours(0, 0, 0, 0);
            
            // Only show cards planned for the current week
            if (startDate < weekDates[0] || startDate > weekDates[6]) {
              return; // Skip cards not planned for current week
            }
            
            // Parse the end date (default to start date if not set)
            let endDate = startDate;
            if (plannedEndDate) {
              const [endYear, endMonth, endDay] = plannedEndDate.split('-').map(Number);
              endDate = new Date(endYear, endMonth - 1, endDay);
              endDate.setHours(0, 0, 0, 0);
            }
            
            // Update task with planned dates
            task.startDate = startDate;
            task.endDate = endDate;
            
            // Add task to all days in the range
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
              const dayIndex = weekDates.findIndex(weekDate => {
                return weekDate.getTime() === currentDate.getTime();
              });
              
              if (dayIndex !== -1) {
                const dayName = days[dayIndex + 1]; // +1 because 'Overdue' is at index 0
                tasksByDay[dayName].push({...task, displayDate: new Date(currentDate)});
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        });
      }
    }

    // Process Design/UX tasks - use Planned Start Date and Planned End Date
    if (allBoardsData && allBoardsData.designUx) {
      allBoardsData.designUx.cards.forEach((card: any) => {
        const plannedStartDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Planned Start Date');
        const plannedEndDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Planned End Date');
        
        if (plannedStartDate) {
          // Parse the start date
          const [startYear, startMonth, startDay] = plannedStartDate.split('-').map(Number);
          const startDate = new Date(startYear, startMonth - 1, startDay);
          startDate.setHours(0, 0, 0, 0);
          
          // Only show cards planned for the current week
          if (startDate < weekDates[0] || startDate > weekDates[6]) {
            return; // Skip cards not planned for current week
          }
          
          // Parse the end date (default to start date if not set)
          let endDate = startDate;
          if (plannedEndDate) {
            const [endYear, endMonth, endDay] = plannedEndDate.split('-').map(Number);
            endDate = new Date(endYear, endMonth - 1, endDay);
            endDate.setHours(0, 0, 0, 0);
          }
          
          const task = {
            id: card.id,
            title: card.name,
            dueDate: card.due ? new Date(card.due) : null,
            startDate: startDate,
            endDate: endDate,
            assignee: card.members?.[0]?.fullName || 'Unassigned',
            project: extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Project') || 'No Project',
            client: extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Client') || 'Unassigned',
            boardTag: 'DESIGN/UX',
            boardName: 'Design/UX',
            effort: extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Effort'),
            milestone: extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Milestone'),
            labels: card.labels || [],
            dueComplete: card.dueComplete
          };

          // Add task to all days in the range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            // Check if task should go in Overdue column
            const isOverdue = currentDate < today && 
                             currentDate < weekDates[0] && // Before this week
                             !card.closed && // Not archived
                             card.due && // Has a due date
                             new Date(card.due) < weekDates[0]; // Due before this week
            
            if (isOverdue) {
              tasksByDay['Overdue'].push({...task, displayDate: new Date(currentDate)});
            } else if (currentDate >= today) {
              const dayIndex = weekDates.findIndex(weekDate => {
                return weekDate.getTime() === currentDate.getTime();
              });
              
              if (dayIndex !== -1) {
                const dayName = days[dayIndex + 1]; // +1 because 'Overdue' is at index 0
                tasksByDay[dayName].push({...task, displayDate: new Date(currentDate)});
              }
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });
    }

    // Process Development tasks - use Planned Start Date and Planned End Date
    if (allBoardsData && allBoardsData.development) {
      allBoardsData.development.cards.forEach((card: any) => {
        const plannedStartDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Planned Start Date');
        const plannedEndDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Planned End Date');
        
        if (plannedStartDate) {
          // Parse the start date
          const [startYear, startMonth, startDay] = plannedStartDate.split('-').map(Number);
          const startDate = new Date(startYear, startMonth - 1, startDay);
          startDate.setHours(0, 0, 0, 0);
          
          // Only show cards planned for the current week
          if (startDate < weekDates[0] || startDate > weekDates[6]) {
            return; // Skip cards not planned for current week
          }
          
          // Parse the end date (default to start date if not set)
          let endDate = startDate;
          if (plannedEndDate) {
            const [endYear, endMonth, endDay] = plannedEndDate.split('-').map(Number);
            endDate = new Date(endYear, endMonth - 1, endDay);
            endDate.setHours(0, 0, 0, 0);
          }
          
          const task = {
            id: card.id,
            title: card.name,
            dueDate: card.due ? new Date(card.due) : null,
            startDate: startDate,
            endDate: endDate,
            assignee: card.members?.[0]?.fullName || 'Unassigned',
            project: extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Project') || 'No Project',
            client: extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Client') || 'Unassigned',
            boardTag: 'DEV',
            boardName: 'Development',
            effort: extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Effort'),
            milestone: extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Milestone'),
            labels: card.labels || [],
            dueComplete: card.dueComplete
          };

          // Add task to all days in the range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            // Check if task should go in Overdue column
            const isOverdue = currentDate < today && 
                             currentDate < weekDates[0] && // Before this week
                             !card.closed && // Not archived
                             card.due && // Has a due date
                             new Date(card.due) < weekDates[0]; // Due before this week
            
            if (isOverdue) {
              tasksByDay['Overdue'].push({...task, displayDate: new Date(currentDate)});
            } else if (currentDate >= today) {
              const dayIndex = weekDates.findIndex(weekDate => {
                return weekDate.getTime() === currentDate.getTime();
              });
              
              if (dayIndex !== -1) {
                const dayName = days[dayIndex + 1]; // +1 because 'Overdue' is at index 0
                tasksByDay[dayName].push({...task, displayDate: new Date(currentDate)});
              }
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });
    }

    return tasksByDay;
  };

  const allPlannedTasksByDay = getAllPlannedTasks();
  

  // Simple drag handlers
  const handleDragOver = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDrop = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    setDragOverDay(null);
    
    const dragDataString = e.dataTransfer.getData('application/json');
    
    if (!dragDataString) {
      if (onDrop) onDrop(e, day);
      return;
    }
    
    const dragData = JSON.parse(dragDataString);
    
    if (dragData.sourceDay && dragData.sourceDay !== day) {
      if (dragData.dragEdge === 'start') {
        if (onMoveTaskStart) onMoveTaskStart(dragData.id, dragData.sourceDay, day);
      } else if (dragData.dragEdge === 'end') {
        if (onMoveTaskEnd) onMoveTaskEnd(dragData.id, dragData.sourceDay, day);
      } else {
        if (onMoveTask) onMoveTask(dragData.id, dragData.sourceDay, day);
      }
    } else {
      if (onDrop) onDrop(e, day);
    }
  };

  // Handle moving tasks between days
  const handleMoveTask = (taskId: string, fromDay: string, toDay: string) => {
    if (fromDay === toDay) return; // Don't move if it's the same day
    
    // This should be handled by the parent component via onMoveTask prop
    if (onMoveTask) {
      onMoveTask(taskId, fromDay, toDay);
    }
  };

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#1a1a1a',
      overflow: 'hidden',
      borderRadius: 2
    }}>
      {/* Scrollable Calendar Grid */}
      <Box sx={{ 
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
        <Box sx={{ 
          display: 'flex',
          bgcolor: '#1a1a1a',
          minHeight: 'calc(100vh - 200px)',
          minWidth: '100%'
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
            <Box 
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
              sx={{ 
                flex: 1,
                p: 1,
                bgcolor: dragOverDay === day ? '#2a2a2a' : '#1a1a1a',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minHeight: '100px',
                border: dragOverDay === day ? '2px dashed #ff6b35' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {/* All planned tasks */}
              {allPlannedTasksByDay[day]?.map((task, index) => (
                <Box
                  key={`task-${task.id}-${index}`}
                  draggable
                  onClick={(e) => handleCardClick(task.id, e)}
                  onDragStart={(e) => {
                    const taskWithSource = { ...task, sourceDay: day };
                    e.dataTransfer.setData('application/json', JSON.stringify(taskWithSource));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={(e) => {
                    // Drag ended
                  }}
                  sx={{
                    p: 1,
                    mb: 0.75,
                    bgcolor: isTaskCompleted(task) ? '#2a2a2a' : '#3a3a3a',
                    borderRadius: 1,
                    border: '1px solid #555',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    minHeight: '60px',
                    userSelect: 'none',
                    opacity: isTaskCompleted(task) ? 0.6 : 1,
                    '&:hover': {
                      bgcolor: isTaskCompleted(task) ? '#2a2a2a' : '#444',
                      borderColor: '#666'
                    },
                    '&:active': {
                      cursor: 'grabbing'
                    }
                  }}
                >
                  {/* Remove button */}
                  <Box
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        // Check if this is a multi-day task
                        const isMultiDay = task.startDate && task.endDate && task.startDate.getTime() !== task.endDate.getTime();
                        
                        if (isMultiDay) {
                          // Multi-day task: remove from this specific day by adjusting the date range
                          const currentDay = task.displayDate;
                          const startDate = task.startDate;
                          const endDate = task.endDate;
                          
                          // Format dates as YYYY-MM-DD
                          const formatDate = (date: Date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          };
                          
                          let newStartDate = startDate;
                          let newEndDate = endDate;
                          
                          // If removing the start day, move start date forward
                          if (currentDay.getTime() === startDate.getTime()) {
                            newStartDate = new Date(startDate);
                            newStartDate.setDate(startDate.getDate() + 1);
                          }
                          // If removing the end day, move end date backward
                          else if (currentDay.getTime() === endDate.getTime()) {
                            newEndDate = new Date(endDate);
                            newEndDate.setDate(endDate.getDate() - 1);
                          }
                          // If removing a middle day, we need to split the task or adjust range
                          // For now, let's just remove the entire task
                          else {
                            // Remove entire task from planning
                            if (task.boardTag === 'ACCT MGMT') {
                              await trelloService.setPlannedStartDate(task.id, '');
                              await trelloService.setPlannedEndDate(task.id, '');
                            } else if (task.boardTag === 'DESIGN/UX') {
                              const designBoardId = allBoardsData?.designUx?.board?.id;
                              await trelloService.setPlannedStartDate(task.id, '', designBoardId);
                              await trelloService.setPlannedEndDate(task.id, '', designBoardId);
                            } else if (task.boardTag === 'DEV') {
                              const devBoardId = allBoardsData?.development?.board?.id;
                              await trelloService.setPlannedStartDate(task.id, '', devBoardId);
                              await trelloService.setPlannedEndDate(task.id, '', devBoardId);
                            }
                          }
                          
                          // Update the date range if we're adjusting it
                          if (newStartDate.getTime() !== startDate.getTime() || newEndDate.getTime() !== endDate.getTime()) {
                            if (newStartDate <= newEndDate) {
                              if (task.boardTag === 'ACCT MGMT') {
                                await trelloService.setPlannedDateRange(task.id, formatDate(newStartDate), formatDate(newEndDate));
                              } else if (task.boardTag === 'DESIGN/UX') {
                                const designBoardId = allBoardsData?.designUx?.board?.id;
                                await trelloService.setPlannedDateRange(task.id, formatDate(newStartDate), formatDate(newEndDate), designBoardId);
                              } else if (task.boardTag === 'DEV') {
                                const devBoardId = allBoardsData?.development?.board?.id;
                                await trelloService.setPlannedDateRange(task.id, formatDate(newStartDate), formatDate(newEndDate), devBoardId);
                              }
                            }
                          }
                        } else {
                          // Single-day task: remove completely from planning
                          if (task.boardTag === 'ACCT MGMT') {
                            await trelloService.setPlannedStartDate(task.id, '');
                            await trelloService.setPlannedEndDate(task.id, '');
                          } else if (task.boardTag === 'DESIGN/UX') {
                            const designBoardId = allBoardsData?.designUx?.board?.id;
                            await trelloService.setPlannedStartDate(task.id, '', designBoardId);
                            await trelloService.setPlannedEndDate(task.id, '', designBoardId);
                          } else if (task.boardTag === 'DEV') {
                            const devBoardId = allBoardsData?.development?.board?.id;
                            await trelloService.setPlannedStartDate(task.id, '', devBoardId);
                            await trelloService.setPlannedEndDate(task.id, '', devBoardId);
                          }
                        }
                        
                        // Trigger a data refresh without page reload
                        if (onRefresh) {
                          onRefresh();
                        }
                      } catch (error) {
                        console.error('Error removing task from planning:', error);
                      }
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      bgcolor: '#666',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '10px',
                      color: '#fff',
                      '&:hover': {
                        bgcolor: '#ff4444'
                      }
                    }}
                  >
                    ×
                  </Box>
                  
                  {/* Left edge handle for moving start date */}
                  <Box
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      const taskWithEdge = { ...task, sourceDay: day, dragEdge: 'start' };
                      e.dataTransfer.setData('application/json', JSON.stringify(taskWithEdge));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 8,
                      cursor: 'ew-resize',
                      zIndex: 3,
                      '&:hover': {
                        bgcolor: 'rgba(255, 107, 53, 0.3)'
                      }
                    }}
                  />
                  
                  {/* Right edge handle for extending end date */}
                  <Box
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      const taskWithEdge = { ...task, sourceDay: day, dragEdge: 'end' };
                      e.dataTransfer.setData('application/json', JSON.stringify(taskWithEdge));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 8,
                      cursor: 'ew-resize',
                      zIndex: 3,
                      '&:hover': {
                        bgcolor: 'rgba(255, 107, 53, 0.3)'
                      }
                    }}
                  />
                  
                  {/* Labels */}
                  {task.labels && task.labels.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                      {(task.labels || []).map((label: any, labelIndex: number) => (
                        <Box
                          key={labelIndex}
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
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#fff', 
                      fontWeight: 'bold',
                      mb: 0.5,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      fontSize: '0.75rem',
                      textDecoration: isTaskCompleted(task) ? 'line-through' : 'none',
                      opacity: isTaskCompleted(task) ? 0.7 : 1
                    }}
                  >
                    {task.title}
                  </Typography>
                  
                  {/* Multi-day indicator */}
                  {task.isMultiDay && (
                    <Box
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        bgcolor: '#ff6b35',
                        borderRadius: 0.25,
                        fontSize: '0.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 0.5,
                        display: 'inline-block'
                      }}
                    >
                      {task.spanDays} days • {task.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {task.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Box>
                  )}
                  
                  {/* Board tag - only show for non-admin tasks */}
                  {task.boardTag !== 'WEEKLY' && (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: '#555',
                        borderRadius: 0.5,
                        fontSize: '0.625rem',
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 0.5,
                        display: 'inline-block'
                      }}
                    >
                      {task.boardTag || 'ACCT MGMT'}
                    </Box>
                  )}
                  
                  {/* Project and due date info */}
                  <Box sx={{ mb: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#ccc',
                        fontSize: '0.625rem',
                        display: 'block',
                        textDecoration: isTaskCompleted(task) ? 'line-through' : 'none',
                        opacity: isTaskCompleted(task) ? 0.7 : 1
                      }}
                    >
                      {task.client || 'Unassigned'} - {task.project || 'No Project'}
                    </Typography>
                    {task.dueDate && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#ccc',
                          fontSize: '0.625rem',
                          display: 'block',
                          textDecoration: isTaskCompleted(task) ? 'line-through' : 'none',
                          opacity: isTaskCompleted(task) ? 0.7 : 1
                        }}
                      >
                        Due: {(typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Assignee */}
                  {task.assignee && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                        {task.assignee.charAt(0).toUpperCase()}
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getAssigneeColor(task.assignee),
                          fontSize: '0.625rem',
                          fontWeight: 'bold',
                          textDecoration: isTaskCompleted(task) ? 'line-through' : 'none',
                          opacity: isTaskCompleted(task) ? 0.7 : 1
                        }}
                      >
                        {task.assignee}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
              

              
              {/* Drop skeleton when dragging over */}
              {dragOverDay === day && (
                <Box
                  sx={{
                    p: 1,
                    mb: 0.75,
                    bgcolor: 'rgba(255, 107, 53, 0.1)',
                    borderRadius: 1,
                    border: '2px dashed #ff6b35',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    opacity: 0.7
                  }}
                >
                  <Box
                    sx={{
                      height: '12px',
                      bgcolor: 'rgba(255, 107, 53, 0.3)',
                      borderRadius: '2px',
                      width: '80%'
                    }}
                  />
                  <Box
                    sx={{
                      height: '8px',
                      bgcolor: 'rgba(255, 107, 53, 0.2)',
                      borderRadius: '2px',
                      width: '60%'
                    }}
                  />
                  <Box
                    sx={{
                      height: '8px',
                      bgcolor: 'rgba(255, 107, 53, 0.2)',
                      borderRadius: '2px',
                      width: '40%'
                    }}
                  />
                </Box>
              )}

              {/* Show placeholder if no tasks */}
              {(!allPlannedTasksByDay[day] || allPlannedTasksByDay[day].length === 0) && dragOverDay !== day && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    mt: 2
                  }}
                >
                  {day === 'Overdue' ? 'No overdue tasks' : 'Drop tasks here'}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
        </Box>
      </Box>
    </Box>
  );
}