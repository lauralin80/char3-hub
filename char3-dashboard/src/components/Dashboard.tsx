'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon } from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { trelloService } from '@/services/trelloService';
import { DeliverablesBoard } from './DeliverablesBoard';
import { WeeklyPlanningBoard } from './WeeklyPlanningBoard';
import { colors, typography, transitions } from '@/styles/theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  
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
    
    return colors[Math.abs(hash) % colors.length];
  };
  const [allAdminTasks, setAllAdminTasks] = useState<any[]>([]);
  const [allBoardTasks, setAllBoardTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [weeklyPlanningTasks, setWeeklyPlanningTasks] = useState<{[day: string]: any[]}>({});
  const { clients, isLoading, error, setLoading, setError, setClients, setCustomFields, setMembers, setListIds, weeklyPlanningData, setWeeklyPlanningData } = useStore();
  const [allBoardsData, setAllBoardsData] = useState<{
    accountManagement: any;
    designUx: any;
    development: any;
  } | null>(null);

  // Get unique values for filter options
  const uniqueClients = [...new Set(allBoardTasks.map(task => task.client))].filter(Boolean);
  const uniqueProjects = [...new Set(allBoardTasks.map(task => task.project))].filter(Boolean);
  const uniqueBoards = [...new Set(allBoardTasks.map(task => task.boardName))].filter(Boolean);
  const uniqueAssignees = [...new Set(allBoardTasks.map(task => task.assignee))].filter(Boolean);

  // Filter tasks based on search term and all filters
  const filteredTasks = allBoardTasks.filter(task => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        task.title.toLowerCase().includes(searchLower) ||
        task.client.toLowerCase().includes(searchLower) ||
        task.project.toLowerCase().includes(searchLower) ||
        task.assignee.toLowerCase().includes(searchLower) ||
        (task.milestone && task.milestone.toLowerCase().includes(searchLower)) ||
        (task.effort && task.effort.toLowerCase().includes(searchLower)) ||
        (task.labels && task.labels.some((label: any) => label.name.toLowerCase().includes(searchLower)))
      );
      if (!matchesSearch) return false;
    }

    // Client filter
    if (selectedClient && task.client !== selectedClient) {
      return false;
    }

    // Project filter
    if (selectedProject && task.project !== selectedProject) {
      return false;
    }

    // Board filter
    if (selectedBoard && task.boardName !== selectedBoard) {
      return false;
    }

    // Assignee filter
    if (selectedAssignee && task.assignee !== selectedAssignee) {
      return false;
    }

    return true;
  });

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSelectedClient('');
    setSelectedProject('');
    setSelectedBoard('');
    setSelectedAssignee('');
    setSearchTerm('');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, day: string) => {
    e.preventDefault();
    
    try {
      const dataString = e.dataTransfer.getData('application/json');
      
      if (!dataString) {
        return;
      }
      
      const taskData = JSON.parse(dataString);
      
      // Convert day name to date string (YYYY-MM-DD format)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      startOfWeek.setHours(0, 0, 0, 0); // Reset time
      
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + dayIndex);
      targetDate.setHours(0, 0, 0, 0); // Reset time
      
      // Format date as YYYY-MM-DD without timezone issues
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(targetDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayOfMonth}`;
      
      
      // Handle different board types
      if (taskData.boardTag === 'ACCT MGMT') {
        // Admin tasks: set both start and end dates to the same date
        await trelloService.setPlannedDateRange(taskData.id, dateString, dateString);
      } else if (taskData.boardTag === 'DESIGN/UX') {
        // Design/UX tasks: set both start and end dates to the same date
        const designBoardId = allBoardsData?.designUx?.board?.id;
        await trelloService.setPlannedDateRange(taskData.id, dateString, dateString, designBoardId);
      } else if (taskData.boardTag === 'DEV') {
        // Development tasks: set both start and end dates to the same date
        const devBoardId = allBoardsData?.development?.board?.id;
        await trelloService.setPlannedDateRange(taskData.id, dateString, dateString, devBoardId);
      }
      
      // Refresh the data
      const updatedAllBoardsData = await trelloService.getAllBoardsData();
      setAllBoardsData(updatedAllBoardsData);
      
      if (clients && clients.length > 0) {
        const updatedAllBoardTasks = buildAllBoardTasks(updatedAllBoardsData, clients);
        setAllBoardTasks(updatedAllBoardTasks);
      }
      
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleMoveTask = async (taskId: string, fromDay: string, toDay: string) => {
    if (fromDay === toDay) return;
    
    try {
      // Convert day name to date string (YYYY-MM-DD format)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      startOfWeek.setHours(0, 0, 0, 0); // Reset time
      
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(toDay);
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + dayIndex);
      targetDate.setHours(0, 0, 0, 0); // Reset time
      
      // Format date as YYYY-MM-DD without timezone issues
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(targetDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayOfMonth}`;
      
      // Find the task to determine its board type
      let taskBoardTag = 'ACCT MGMT'; // Default to admin task
      
      if (allBoardsData && allBoardsData.accountManagement) {
        const adminTask = allBoardsData.accountManagement.cards.find((card: any) => card.id === taskId);
        if (adminTask) {
          taskBoardTag = 'ACCT MGMT';
        }
      }
      
      if (allBoardsData && allBoardsData.designUx) {
        const designTask = allBoardsData.designUx.cards.find((card: any) => card.id === taskId);
        if (designTask) {
          taskBoardTag = 'DESIGN/UX';
        }
      }
      
      if (allBoardsData && allBoardsData.development) {
        const devTask = allBoardsData.development.cards.find((card: any) => card.id === taskId);
        if (devTask) {
          taskBoardTag = 'DEV';
        }
      }
      
      // Handle different board types
      if (taskBoardTag === 'ACCT MGMT') {
        // Admin tasks: set both start and end dates to the same date
        await trelloService.setPlannedDateRange(taskId, dateString, dateString);
      } else if (taskBoardTag === 'DESIGN/UX') {
        // Design/UX tasks: set both start and end dates to the same date
        const designBoardId = allBoardsData?.designUx?.board?.id;
        await trelloService.setPlannedDateRange(taskId, dateString, dateString, designBoardId);
      } else if (taskBoardTag === 'DEV') {
        // Development tasks: set both start and end dates to the same date
        const devBoardId = allBoardsData?.development?.board?.id;
        await trelloService.setPlannedDateRange(taskId, dateString, dateString, devBoardId);
      }
      
      // Refresh the data
      const updatedAllBoardsData = await trelloService.getAllBoardsData();
      setAllBoardsData(updatedAllBoardsData);
      
      if (clients && clients.length > 0) {
        const updatedAllBoardTasks = buildAllBoardTasks(updatedAllBoardsData, clients);
        setAllBoardTasks(updatedAllBoardTasks);
      }
      
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  // Handle moving start date (left edge drag)
  const handleMoveTaskStart = async (taskId: string, fromDay: string, toDay: string) => {
    if (fromDay === toDay) return;
    
    try {
      // Convert day name to date string (YYYY-MM-DD format)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      startOfWeek.setHours(0, 0, 0, 0); // Reset time
      
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(toDay);
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + dayIndex);
      targetDate.setHours(0, 0, 0, 0); // Reset time
      
      // Format date as YYYY-MM-DD without timezone issues
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(targetDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayOfMonth}`;
      
      // Find the task to determine its board type and get current end date
      let taskBoardTag = 'ACCT MGMT';
      let currentEndDate = dateString; // Default to same date
      
      if (allBoardsData && allBoardsData.accountManagement) {
        const adminTask = allBoardsData.accountManagement.cards.find((card: any) => card.id === taskId);
        if (adminTask) {
          taskBoardTag = 'ACCT MGMT';
          // Get current end date from custom field
          const endDateField = adminTask.customFieldItems?.find((cf: any) => {
            const customField = allBoardsData.accountManagement.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned End Date' && cf.value?.date;
          });
          if (endDateField?.value?.date) {
            currentEndDate = endDateField.value.date.split('T')[0];
          }
        }
      }
      
      if (allBoardsData && allBoardsData.designUx) {
        const designTask = allBoardsData.designUx.cards.find((card: any) => card.id === taskId);
        if (designTask) {
          taskBoardTag = 'DESIGN/UX';
          // Get current end date from custom field
          const endDateField = designTask.customFieldItems?.find((cf: any) => {
            const customField = allBoardsData.designUx.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned End Date' && cf.value?.date;
          });
          if (endDateField?.value?.date) {
            currentEndDate = endDateField.value.date.split('T')[0];
          }
        }
      }
      
      if (allBoardsData && allBoardsData.development) {
        const devTask = allBoardsData.development.cards.find((card: any) => card.id === taskId);
        if (devTask) {
          taskBoardTag = 'DEV';
          // Get current end date from custom field
          const endDateField = devTask.customFieldItems?.find((cf: any) => {
            const customField = allBoardsData.development.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned End Date' && cf.value?.date;
          });
          if (endDateField?.value?.date) {
            currentEndDate = endDateField.value.date.split('T')[0];
          }
        }
      }
      
      // Ensure start date is not after end date
      if (new Date(dateString) > new Date(currentEndDate)) {
        currentEndDate = dateString;
      }
      
      // Handle different board types
      if (taskBoardTag === 'ACCT MGMT') {
        await trelloService.setPlannedDateRange(taskId, dateString, currentEndDate);
      } else if (taskBoardTag === 'DESIGN/UX') {
        const designBoardId = allBoardsData?.designUx?.board?.id;
        await trelloService.setPlannedDateRange(taskId, dateString, currentEndDate, designBoardId);
      } else if (taskBoardTag === 'DEV') {
        const devBoardId = allBoardsData?.development?.board?.id;
        await trelloService.setPlannedDateRange(taskId, dateString, currentEndDate, devBoardId);
      }
      
      // Refresh the data
      const updatedAllBoardsData = await trelloService.getAllBoardsData();
      setAllBoardsData(updatedAllBoardsData);
      
      if (clients && clients.length > 0) {
        const updatedAllBoardTasks = buildAllBoardTasks(updatedAllBoardsData, clients);
        setAllBoardTasks(updatedAllBoardTasks);
      }
      
    } catch (error) {
      console.error('Error moving task start date:', error);
    }
  };

  // Handle moving end date (right edge drag)
  const handleMoveTaskEnd = async (taskId: string, fromDay: string, toDay: string) => {
    if (fromDay === toDay) return;
    
    try {
      // Convert day name to date string (YYYY-MM-DD format)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
      startOfWeek.setHours(0, 0, 0, 0); // Reset time
      
      const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(toDay);
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + dayIndex);
      targetDate.setHours(0, 0, 0, 0); // Reset time
      
      // Format date as YYYY-MM-DD without timezone issues
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(targetDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayOfMonth}`;
      
      // Find the task to determine its board type and get current start date
      let taskBoardTag = 'ACCT MGMT';
      let currentStartDate = dateString; // Default to same date
      
      if (allBoardsData && allBoardsData.accountManagement) {
        const adminTask = allBoardsData.accountManagement.cards.find((card: any) => card.id === taskId);
        if (adminTask) {
          taskBoardTag = 'ACCT MGMT';
          // Get current start date from custom field
          const startDateField = adminTask.customFieldItems?.find((cf: any) => {
            const customField = allBoardsData.accountManagement.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned Start Date' && cf.value?.date;
          });
          if (startDateField?.value?.date) {
            currentStartDate = startDateField.value.date.split('T')[0];
          }
        }
      }
      
      if (allBoardsData && allBoardsData.designUx) {
        const designTask = allBoardsData.designUx.cards.find((card: any) => card.id === taskId);
        if (designTask) {
          taskBoardTag = 'DESIGN/UX';
          // Get current start date from custom field
          const startDateField = designTask.customFieldItems?.find((cf: any) => {
            const customField = allBoardsData.designUx.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned Start Date' && cf.value?.date;
          });
          if (startDateField?.value?.date) {
            currentStartDate = startDateField.value.date.split('T')[0];
          }
        }
      }
      
      if (allBoardsData && allBoardsData.development) {
        const devTask = allBoardsData.development.cards.find((card: any) => card.id === taskId);
        if (devTask) {
          taskBoardTag = 'DEV';
          // Get current start date from custom field
          const startDateField = devTask.customFieldItems?.find((cf: any) => {
            const customField = allBoardsData.development.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned Start Date' && cf.value?.date;
          });
          if (startDateField?.value?.date) {
            currentStartDate = startDateField.value.date.split('T')[0];
          }
        }
      }
      
      // Ensure end date is not before start date
      if (new Date(dateString) < new Date(currentStartDate)) {
        currentStartDate = dateString;
      }
      
      // Handle different board types
      if (taskBoardTag === 'ACCT MGMT') {
        await trelloService.setPlannedDateRange(taskId, currentStartDate, dateString);
      } else if (taskBoardTag === 'DESIGN/UX') {
        const designBoardId = allBoardsData?.designUx?.board?.id;
        await trelloService.setPlannedDateRange(taskId, currentStartDate, dateString, designBoardId);
      } else if (taskBoardTag === 'DEV') {
        const devBoardId = allBoardsData?.development?.board?.id;
        await trelloService.setPlannedDateRange(taskId, currentStartDate, dateString, devBoardId);
      }
      
      // Refresh the data
      const updatedAllBoardsData = await trelloService.getAllBoardsData();
      setAllBoardsData(updatedAllBoardsData);
      
      if (clients && clients.length > 0) {
        const updatedAllBoardTasks = buildAllBoardTasks(updatedAllBoardsData, clients);
        setAllBoardTasks(updatedAllBoardTasks);
      }
      
    } catch (error) {
      console.error('Error moving task end date:', error);
    }
  };

  // Helper function to auto-populate admin tasks with due dates
  const autoPopulateAdminTasks = async (allBoardsData: any) => {
    try {
      if (!allBoardsData?.accountManagement) return;
      
      // Find the admin tasks list (not deliverables)
      const adminTasksList = allBoardsData.accountManagement.lists.find((list: any) => 
        list.name.toLowerCase().includes('account') || list.name.toLowerCase().includes('admin')
      );
      
      if (!adminTasksList) return;
      
      // Get admin task cards
      const adminTaskCards = allBoardsData.accountManagement.cards.filter((card: any) => 
        card.idList === adminTasksList.id
      );
      
      for (const card of adminTaskCards) {
        if (card.due) {
          // Check if the card already has planned start/end dates
          const hasStartDate = card.customFieldItems?.some((cf: any) => {
            const customField = allBoardsData.accountManagement.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned Start Date' && cf.value?.date;
          });
          
          const hasEndDate = card.customFieldItems?.some((cf: any) => {
            const customField = allBoardsData.accountManagement.customFields?.find((f: any) => f.id === cf.idCustomField);
            return customField?.name === 'Planned End Date' && cf.value?.date;
          });
          
          // If neither start nor end date is set, auto-populate with due date
          if (!hasStartDate && !hasEndDate) {
            const dueDateStr = card.due.split('T')[0]; // Get YYYY-MM-DD part
            await trelloService.setPlannedDateRange(card.id, dueDateStr, dueDateStr);
          }
        }
      }
    } catch (error) {
      console.error('Error auto-populating admin tasks:', error);
    }
  };

  // Helper function to create weekly planning cards for admin tasks
  const createWeeklyPlanningCardsForAdminTasks = async (adminTasks: any[], weeklyPlanningData: any) => {
    try {
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        weekDates.push(date);
      }

      for (const task of adminTasks) {
        if (!task.dueDate) continue;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Check if due date is in current week
        const dayIndex = weekDates.findIndex(weekDate => {
          const weekDateStr = weekDate.toDateString();
          const dueDateStr = dueDate.toDateString();
          return weekDateStr === dueDateStr;
        });
        
        if (dayIndex !== -1) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
          const dayList = weeklyPlanningData.lists.find((list: any) => list.name === dayName);
          
          if (dayList) {
            // Check if card already exists
            const existingCard = weeklyPlanningData.cards.find((card: any) => 
              card.customFieldItems?.some((cf: any) => {
                const customField = weeklyPlanningData.customFields.find((f: any) => f.id === cf.idCustomField);
                return customField?.name === 'Original Card ID' && cf.value?.text === task.id;
              })
            );
            
            if (!existingCard) {
              // Create card in Weekly Planning board
              await trelloService.createWeeklyPlanningCard(dayList.id, task, 'Admin Task');
            }
          }
        }
      }
      
      // Refresh weekly planning data after creating cards
      const updatedWeeklyPlanningData = await trelloService.getWeeklyPlanningBoardData();
      setWeeklyPlanningData(updatedWeeklyPlanningData);
    } catch (error) {
      console.error('Error creating weekly planning cards for admin tasks:', error);
    }
  };

  // Helper function to build allBoardTasks array
  const buildAllBoardTasks = (allBoardsData: any, clients: any[]) => {
    const allBoardTasks: any[] = [];
    
    // Get all card IDs that are currently on the weekly planning board
    const weeklyPlanningCardIds = new Set<string>();
    
    // Check admin tasks for planned dates - use exact same logic as weekly planning board
    if (clients && clients.length > 0) {
      clients.forEach(client => {
        client.adminTasks.forEach(task => {
          const plannedStartDate = extractCustomFieldValue(task.customFieldItems, allBoardsData?.accountManagement?.customFields || [], 'Planned Start Date');
          
          if (plannedStartDate) {
            weeklyPlanningCardIds.add(task.id);
          }
        });
      });
    }
    
    // Get current week dates for filtering
    const today = new Date();
    const currentDay = today.getDay();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - currentDay);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    // Check Design/UX cards for planned dates - only exclude if planned for current week
    if (allBoardsData && allBoardsData.designUx) {
      allBoardsData.designUx.cards.forEach((card: any) => {
        const plannedStartDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Planned Start Date');
        
        if (plannedStartDate) {
          // Parse the planned start date
          const [startYear, startMonth, startDay] = plannedStartDate.split('-').map(Number);
          const plannedDate = new Date(startYear, startMonth - 1, startDay);
          plannedDate.setHours(0, 0, 0, 0);
          
          // Only exclude if planned for current week
          if (plannedDate >= currentWeekStart && plannedDate <= currentWeekEnd) {
            weeklyPlanningCardIds.add(card.id);
          }
        }
      });
    }
    
    // Check Development cards for planned dates - only exclude if planned for current week
    if (allBoardsData && allBoardsData.development) {
      allBoardsData.development.cards.forEach((card: any) => {
        const plannedStartDate = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Planned Start Date');
        
        if (plannedStartDate) {
          // Parse the planned start date
          const [startYear, startMonth, startDay] = plannedStartDate.split('-').map(Number);
          const plannedDate = new Date(startYear, startMonth - 1, startDay);
          plannedDate.setHours(0, 0, 0, 0);
          
          // Only exclude if planned for current week
          if (plannedDate >= currentWeekStart && plannedDate <= currentWeekEnd) {
            weeklyPlanningCardIds.add(card.id);
          }
        }
      });
    }
    
    // Add account management admin tasks only (not deliverables)
    if (clients && clients.length > 0) {
      clients.forEach(client => {
        client.adminTasks.forEach(task => {
          // Skip completed, archived, or deleted tasks
          const isCompleted = task.dueComplete === true;
          const isArchived = task.closed === true;
          const isDeleted = task.deleted === true;
          
          if (isCompleted || isArchived || isDeleted) {
            return; // Skip this task
          }
          
          // Skip tasks that are already on the weekly planning board
          if (weeklyPlanningCardIds.has(task.id)) {
            return; // Skip this task - it's already planned
          }
          
          allBoardTasks.push({
            ...task,
            labels: task.labels || [], // Ensure labels is always an array
            boardTag: 'ACCT MGMT',
            boardName: 'Account Management'
          });
        });
      });
    }

    // Add design/UX tasks if board exists
    if (allBoardsData && allBoardsData.designUx) {
      allBoardsData.designUx.cards.forEach((card: any) => {
        // Skip completed, archived, or deleted cards
        const isCompleted = card.dueComplete === true;
        const isArchived = card.closed === true;
        const isDeleted = card.deleted === true;
        
        if (isCompleted || isArchived || isDeleted) {
          return; // Skip this card
        }
        
        // Skip cards that are already on the weekly planning board
        if (weeklyPlanningCardIds.has(card.id)) {
          return; // Skip this card - it's already planned
        }
        
        const clientName = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Client') || 'Unassigned';
        const projectName = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Project') || 'No Project';
        const effort = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Effort') || '';
        const milestone = extractCustomFieldValue(card.customFieldItems, allBoardsData?.designUx?.customFields || [], 'Milestone') || '';
        
        allBoardTasks.push({
          id: card.id,
          title: card.name,
          dueDate: card.due ? new Date(card.due) : null,
          client: clientName,
          project: projectName,
          assignee: card.members?.[0]?.fullName || 'Unassigned',
          labels: card.labels || [],
          completed: card.labels?.some((label: any) => label.name === 'Completed') || false,
          boardTag: 'DESIGN/UX',
          boardName: 'Design/UX',
          listName: allBoardsData?.designUx?.lists?.find((l: any) => l.id === card.idList)?.name || 'Unknown',
          effort,
          milestone
        });
      });
    }

    // Add development tasks if board exists
    if (allBoardsData && allBoardsData.development) {
      allBoardsData.development.cards.forEach((card: any) => {
        // Skip completed, archived, or deleted cards
        const isCompleted = card.dueComplete === true;
        const isArchived = card.closed === true;
        const isDeleted = card.deleted === true;
        
        if (isCompleted || isArchived || isDeleted) {
          return; // Skip this card
        }
        
        // Skip cards that are already on the weekly planning board
        if (weeklyPlanningCardIds.has(card.id)) {
          return; // Skip this card - it's already planned
        }
        
        const clientName = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Client') || 'Unassigned';
        const projectName = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Project') || 'No Project';
        const effort = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Effort') || '';
        const milestone = extractCustomFieldValue(card.customFieldItems, allBoardsData?.development?.customFields || [], 'Milestone') || '';
        
        allBoardTasks.push({
          id: card.id,
          title: card.name,
          dueDate: card.due ? new Date(card.due) : null,
          client: clientName,
          project: projectName,
          assignee: card.members?.[0]?.fullName || 'Unassigned',
          labels: card.labels || [],
          completed: card.labels?.some((label: any) => label.name === 'Completed') || false,
          boardTag: 'DEV',
          boardName: 'Development',
          listName: allBoardsData?.development?.lists?.find((l: any) => l.id === card.idList)?.name || 'Unknown',
          effort,
          milestone
        });
      });
    }

    return allBoardTasks;
  };

  // Helper function to extract custom field values
  const extractCustomFieldValue = (customFieldItems: any[], customFields: any[], fieldName: string) => {
    const customField = customFields.find((cf: any) => cf.name === fieldName);
    const fieldItem = customFieldItems?.find((cf: any) => 
      cf.idCustomField === customField?.id
    );
    
    if (fieldItem) {
      if (fieldItem.value && typeof fieldItem.value === 'string') {
        return fieldItem.value;
      } else if (fieldItem.value && fieldItem.value.text) {
        return fieldItem.value.text;
      } else if (fieldItem.idValue) {
        // For dropdown fields, find the option text using idValue
        const option = customField?.options?.find((opt: any) => opt.id === fieldItem.idValue);
        return option?.value?.text || '';
      }
    }
    return '';
  };

  const refreshData = React.useCallback(async () => {
    try {
      const allBoardsDataFromService = await trelloService.getAllBoardsData();
      setAllBoardsData(allBoardsDataFromService);
      
      // Process clients and admin tasks (same logic as loadData but without loading screen)
      const data = allBoardsDataFromService.accountManagement;
      const clientsMap = new Map();
      
      if (data && data.cards) {
        data.cards.forEach((card: any) => {
          const clientName = extractCustomFieldValue(card.customFieldItems, data.customFields || [], 'Client') || 'Unassigned';
          const projectName = extractCustomFieldValue(card.customFieldItems, data.customFields || [], 'Project') || 'No Project';
          
          if (!clientsMap.has(clientName)) {
            clientsMap.set(clientName, {
              name: clientName,
              adminTasks: [],
              deliverables: []
            });
          }
          
          const client = clientsMap.get(clientName);
          client.adminTasks.push({
            id: card.id,
            title: card.name,
            dueDate: card.due ? new Date(card.due) : null,
            assignee: card.members?.[0]?.fullName || 'Unassigned',
            project: projectName,
            client: clientName,
            completed: card.closed || false,
            archived: card.closed || false
          });
        });
      }
      
      const clients = Array.from(clientsMap.values());
      setClients(clients);
      
      // Build allBoardTasks array
      const allBoardTasks = buildAllBoardTasks(allBoardsDataFromService, clients);
      setAllBoardTasks(allBoardTasks);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [buildAllBoardTasks]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allBoardsDataFromService = await trelloService.getAllBoardsData();
      setAllBoardsData(allBoardsDataFromService);
      
      // Auto-populate admin tasks with due dates
      await autoPopulateAdminTasks(allBoardsDataFromService);
      
      const data = allBoardsDataFromService.accountManagement; // Use account management as primary for now
      
      console.log('Trello data received:', {
        lists: data.lists.map((l: any) => ({ name: l.name, id: l.id })),
        cardsCount: data.cards.length,
        customFields: data.customFields.map((cf: any) => ({ name: cf.name, id: cf.id }))
      });
      
      // Process the data to match our store structure
      const deliverablesList = data.lists.find((list: { name: string; id: string }) => 
        list.name.toLowerCase().includes('deliverable')
      );
      const adminTasksList = data.lists.find((list: { name: string; id: string }) => 
        list.name.toLowerCase().includes('account') || list.name.toLowerCase().includes('admin')
      );
      
      console.log('Found lists:', {
        deliverablesList: deliverablesList?.name,
        adminTasksList: adminTasksList?.name
      });

      // Group cards by client
      const clientsMap = new Map();
      
      data.cards.forEach((card: { 
        id: string; 
        name: string; 
        due: string; 
        idList: string;
        customFieldItems?: Array<{ idCustomField: string; value: { text: string } }>;
        members?: Array<{ fullName: string }>;
        labels?: Array<{ name: string; color: string }>;
      }) => {
        const clientCustomField = data.customFields.find((cf: { name: string; id: string }) => cf.name === 'Client');
        const clientFieldItem = card.customFieldItems?.find((cf: { idCustomField: string; value: any }) => 
          cf.idCustomField === clientCustomField?.id
        );
        
        // Handle different custom field value structures
        let clientName = 'Unassigned';
        if (clientFieldItem) {
          if (clientFieldItem.value && typeof clientFieldItem.value === 'string') {
            clientName = clientFieldItem.value;
          } else if (clientFieldItem.value && clientFieldItem.value.text) {
            clientName = clientFieldItem.value.text;
          } else if (clientFieldItem.idValue) {
            // For dropdown fields, we need to find the option text using idValue
            const option = clientCustomField?.options?.find((opt: any) => opt.id === clientFieldItem.idValue);
            clientName = option?.value?.text || 'Unassigned';
          }
        }
        
        console.log('Processing card:', {
          name: card.name,
          idList: card.idList,
          clientName,
          clientCustomField: clientCustomField,
          clientFieldItem: clientFieldItem,
          customFieldItems: card.customFieldItems,
          allCustomFields: data.customFields.map((cf: any) => ({ name: cf.name, id: cf.id }))
        });
        
        // Log each custom field item in detail
        card.customFieldItems?.forEach((item: any, index: number) => {
          console.log(`Custom field item ${index}:`, {
            idCustomField: item.idCustomField,
            value: item.value,
            valueType: typeof item.value
          });
        });
        
        if (!clientsMap.has(clientName)) {
          clientsMap.set(clientName, {
            name: clientName,
            deliverables: [],
            adminTasks: [],
          });
        }
        
        const client = clientsMap.get(clientName);
        // Get project field value
        const projectCustomField = data.customFields.find((cf: { name: string; id: string }) => cf.name === 'Project');
        const projectFieldItem = card.customFieldItems?.find((cf: { idCustomField: string; value: any }) => 
          cf.idCustomField === projectCustomField?.id
        );
        
        let projectName = '';
        if (projectFieldItem) {
          if (projectFieldItem.value && typeof projectFieldItem.value === 'string') {
            projectName = projectFieldItem.value;
          } else if (projectFieldItem.value && projectFieldItem.value.text) {
            projectName = projectFieldItem.value.text;
          } else if (projectFieldItem.idValue) {
            // For dropdown fields, we need to find the option text using idValue
            const option = projectCustomField?.options?.find((opt: any) => opt.id === projectFieldItem.idValue);
            projectName = option?.value?.text || '';
          }
        }

        const cardData = {
          id: card.id,
          title: card.name,
          dueDate: card.due ? new Date(card.due) : null,
          client: clientName,
          project: projectName,
          assignee: card.members?.[0]?.fullName || 'Unassigned',
          labels: card.labels || [],
          completed: card.labels?.some((label: any) => label.name === 'Completed') || false,
        };


        if (card.idList === deliverablesList?.id) {
          client.deliverables.push(cardData);
        } else if (card.idList === adminTasksList?.id) {
          client.adminTasks.push(cardData);
        }
      });

      const clients = Array.from(clientsMap.values());
      setClients(clients);
      
      // Build allBoardTasks array now that we have both allBoardsData and clients
      const allBoardTasks = buildAllBoardTasks(allBoardsDataFromService, clients);
      console.log('Dashboard - all board tasks collected:', allBoardTasks);
      setAllBoardTasks(allBoardTasks);
      
      // Collect all admin tasks for weekly planning
      const allTasks: any[] = [];
      clients.forEach(client => {
        allTasks.push(...client.adminTasks);
      });
      console.log('Dashboard - all admin tasks collected:', allTasks);
      setAllAdminTasks(allTasks);

      // Load Weekly Planning board data
      console.log('Loading Weekly Planning board data...');
      const weeklyPlanningData = await trelloService.getWeeklyPlanningBoardData();
      setWeeklyPlanningData(weeklyPlanningData);
      console.log('Weekly Planning data loaded:', weeklyPlanningData);

      // Create weekly planning cards for admin tasks with due dates in current week
      await createWeeklyPlanningCardsForAdminTasks(allTasks, weeklyPlanningData);


      // Extract custom field options
      const projects = data.customFields
        .find((cf: { name: string; options?: Array<{ value: { text: string } }> }) => cf.name === 'Project')
        ?.options?.map((opt: { value: { text: string } }) => opt.value.text) || [];
      
      const clientsList = data.customFields
        .find((cf: { name: string; options?: Array<{ value: { text: string } }> }) => cf.name === 'Client')
        ?.options?.map((opt: { value: { text: string } }) => opt.value.text) || [];

      setCustomFields({ projects, clients: clientsList });

      // Process members data
      const members = data.members.map((member: any) => ({
        id: member.id,
        fullName: member.fullName,
        username: member.username
      }));
      setMembers(members);

      // Store list IDs
      setListIds({
        deliverables: deliverablesList?.id || '',
        adminTasks: adminTasksList?.id || ''
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setClients, setCustomFields, setMembers, setListIds]);

  const handleUpdateAdminTask = async (id: string, updates: { completed?: boolean }) => {
    try {
      // Update the card in Trello in the background
      if (updates.completed !== undefined) {
        if (updates.completed) {
          await trelloService.addLabelByName(id, 'Completed', 'green');
        } else {
          await trelloService.removeLabelByName(id, 'Completed');
        }
      }
      // No refresh needed - the UI updates immediately
    } catch (error) {
      console.error('Error updating admin task:', error);
    }
  };

  const handleArchiveAdminTask = async (id: string) => {
    try {
      // Archive the card in Trello in the background
      await trelloService.updateCard(id, { closed: true });
      // No refresh needed - the UI updates immediately
    } catch (error) {
      console.error('Error archiving admin task:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expose refresh function globally for use by other components
  useEffect(() => {
    (window as any).refreshDashboardData = loadData;
  }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#1a1a1a',
        color: 'white'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      bgcolor: '#0d0d0d', 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Header Bar */}
      <Box sx={{ 
        height: 60,
        bgcolor: '#141414',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        px: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{
              bgcolor: '#4caf50',
              color: 'white',
              fontSize: '0.75rem',
              px: 1,
              py: 0.5,
              minWidth: 'auto',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            Refresh
          </Button>
          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#444',
              color: 'white',
              fontSize: '0.75rem',
              px: 1,
              py: 0.5,
              minWidth: 'auto',
              '&:hover': { bgcolor: '#555' }
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 2, p: 2 }}>
        {/* Main Content */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          bgcolor: '#141414', 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
        }}>
          {/* Team Collaboration Header */}
          <Box sx={{ 
            bgcolor: 'transparent',
            px: 3,
            py: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <Typography variant="h5" sx={{ color: colors.text.title, fontSize: '1.125rem', fontWeight: typography.fontWeights.semibold, letterSpacing: typography.letterSpacing.tight }}>
              Team Collaboration
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.tertiary, fontSize: '0.875rem' }}>
              {(() => {
                const today = new Date();
                // Calculate the end of the week (Saturday)
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Go to Saturday
                return `Week of ${endOfWeek.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}`;
              })()}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ 
            bgcolor: 'transparent',
            display: 'flex',
            px: 2,
            pt: 1,
            gap: 0.5
          }}>
            <Box
              onClick={() => setTabValue(0)}
              sx={{
                flex: 1,
                py: 1.25,
                px: 2.5,
                cursor: 'pointer',
                bgcolor: tabValue === 0 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: tabValue === 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8125rem',
                fontWeight: tabValue === 0 ? 600 : 400,
                borderRadius: 1.5,
                textAlign: 'center',
                letterSpacing: '-0.01em',
                '&:hover': {
                  bgcolor: tabValue === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  color: tabValue === 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
                },
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Weekly Planning
            </Box>
            <Box
              onClick={() => setTabValue(1)}
              sx={{
                flex: 1,
                py: 1.25,
                px: 2.5,
                cursor: 'pointer',
                bgcolor: tabValue === 1 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: tabValue === 1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8125rem',
                fontWeight: tabValue === 1 ? 600 : 400,
                borderRadius: 1.5,
                textAlign: 'center',
                letterSpacing: '-0.01em',
                '&:hover': {
                  bgcolor: tabValue === 1 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  color: tabValue === 1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
                },
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Client Deliverables
            </Box>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <WeeklyPlanningBoard 
            adminTasks={allAdminTasks}
            allBoardsData={allBoardsData}
            onUpdateTask={handleUpdateAdminTask}
            onArchiveTask={handleArchiveAdminTask}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMoveTask={handleMoveTask}
            onMoveTaskStart={handleMoveTaskStart}
            onMoveTaskEnd={handleMoveTaskEnd}
            onRefresh={refreshData}
          />
        </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <DeliverablesBoard />
          </TabPanel>
        </Box>

        {/* Right Master Tasks Panel */}
        <Box sx={{ 
          width: 300, 
          bgcolor: '#141414', 
          borderRadius: 2,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="h6" sx={{ color: colors.text.title, fontSize: '0.9375rem', fontWeight: typography.fontWeights.semibold, letterSpacing: typography.letterSpacing.normal }}>
              All Tasks
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.tertiary, fontSize: '0.75rem', fontWeight: typography.fontWeights.medium }}>
              {filteredTasks.length}
            </Typography>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8125rem',
                outline: 'none',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.target.style.borderColor = 'rgba(255, 107, 53, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '9px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                outline: 'none',
                height: 'auto',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}
            >
              <option value="">All Clients</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
            
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '9px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                outline: 'none',
                height: 'auto',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}
            >
              <option value="">All Projects</option>
              {uniqueProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
            
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '9px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                outline: 'none',
                height: 'auto',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}
            >
              <option value="">All Boards</option>
              {uniqueBoards.map(board => (
                <option key={board} value={board}>{board}</option>
              ))}
            </select>
            
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '9px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                outline: 'none',
                height: 'auto',
                fontWeight: 400,
                letterSpacing: '-0.01em'
              }}
            >
              <option value="">All Assignees</option>
              {uniqueAssignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
            
            <Button
              onClick={clearAllFilters}
              size="small"
              sx={{
                bgcolor: '#ff6b35',
                color: 'white',
                fontSize: '0.75rem',
                px: 1,
                py: 0.5,
                minWidth: 'auto',
                height: '32px',
                '&:hover': { bgcolor: '#e55a2b' }
              }}
            >
              Clear
            </Button>
          </Box>

          {/* Task List */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {filteredTasks.map((task, index) => (
              <Box
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                sx={{
                  p: 1,
                  mb: 0.75,
                  bgcolor: colors.background.card,
                  borderRadius: 1,
                  border: `1px solid ${colors.border.default}`,
                  cursor: 'grab',
                  '&:hover': { bgcolor: colors.background.cardHover },
                  '&:active': { cursor: 'grabbing' }
                }}
              >
                <Typography variant="body2" sx={{ color: colors.text.cardTitle, fontSize: '0.75rem', mb: 0.5, fontWeight: typography.fontWeights.normal, pointerEvents: 'none' }}>
                  {task.title}
                </Typography>
                
                {/* Board Tag */}
                <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap', pointerEvents: 'none' }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.375,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      fontSize: '0.6875rem',
                      color: colors.text.secondary,
                      fontWeight: typography.fontWeights.normal,
                      letterSpacing: typography.letterSpacing.normal
                    }}
                  >
                    {task.boardName}
                  </Box>
                  
                  {/* Effort tag if available */}
                  {task.effort && (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.375,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        fontSize: '0.6875rem',
                        color: colors.text.secondary,
                        fontWeight: typography.fontWeights.normal,
                        letterSpacing: typography.letterSpacing.normal,
                        pointerEvents: 'none'
                      }}
                    >
                      {task.effort}
                    </Box>
                  )}
                  
                  {/* Milestone tag if available */}
                  {task.milestone && (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.375,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                        fontSize: '0.6875rem',
                        color: colors.text.secondary,
                        fontWeight: typography.fontWeights.normal,
                        letterSpacing: typography.letterSpacing.normal,
                        pointerEvents: 'none'
                      }}
                    >
                      {task.milestone}
                    </Box>
                  )}
                  
                  
                  {/* Labels */}
                  {task.labels && task.labels.length > 0 && (task.labels || []).map((label: any, labelIndex: number) => {
                    const labelColor = getLabelColor(label.color, label.name);
                    return (
                      <Box
                        key={labelIndex}
                        sx={{
                          px: 1,
                          py: 0.375,
                          borderRadius: 1.5,
                          bgcolor: `${labelColor}1a`,  // 10% opacity
                          fontSize: '0.6875rem',
                          color: labelColor,
                          fontWeight: typography.fontWeights.normal,
                          letterSpacing: typography.letterSpacing.normal,
                          pointerEvents: 'none'
                        }}
                      >
                        {label.name}
                      </Box>
                    );
                  })}
                </Box>
                
                {/* Client - Project Name */}
                <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem', mb: 0.5, pointerEvents: 'none' }}>
                  {task.client} - {task.project}
                </Typography>
                
                {/* Due Date */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: task.dueDate && task.dueDate < new Date() ? '#ff6b35' : '#888', 
                    fontSize: '0.75rem',
                    mb: 0.5,
                    pointerEvents: 'none'
                  }}
                >
                  {task.dueDate ? task.dueDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'No due date'}
                </Typography>
                
                {/* Assignee (bottom with icon) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pointerEvents: 'none' }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: getAssigneeColor(task.assignee),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.625rem',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#e0e0e0', fontSize: '0.75rem' }}>
                    {task.assignee || 'Unassigned'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}