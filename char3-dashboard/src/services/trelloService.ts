import axios from 'axios';

const TRELLO_API_BASE = 'https://api.trello.com/1';

class TrelloService {
  private apiKey: string;
  private token: string;
  private accountManagementBoardId: string;
  private designUxBoardId: string;
  private developmentBoardId: string;
  private weeklyPlanningBoardId: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || '';
    this.token = process.env.NEXT_PUBLIC_TRELLO_TOKEN || '';
    this.accountManagementBoardId = process.env.NEXT_PUBLIC_TRELLO_BOARD_ID || '';
    this.designUxBoardId = process.env.NEXT_PUBLIC_TRELLO_DESIGN_UX_BOARD_ID || '';
    this.developmentBoardId = process.env.NEXT_PUBLIC_TRELLO_DEVELOPMENT_BOARD_ID || '';
    this.weeklyPlanningBoardId = process.env.NEXT_PUBLIC_TRELLO_WEEKLY_PLANNING_BOARD_ID || '68ecf7dcff537f9c63519a4d';
    console.log('[TrelloService] Constructor - API Key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'MISSING');
  }

  private getAuthParams(userToken?: string) {
    const token = userToken || this.token;
    console.log('[TrelloService] Using token:', token ? token.substring(0, 10) + '...' + token.substring(token.length - 10) : 'NO TOKEN');
    return {
      key: this.apiKey,
      token,
    };
  }

  // Create a user-specific instance
  static createUserInstance(userToken: string): TrelloService {
    const instance = new TrelloService();
    instance.token = userToken;
    return instance;
  }

  // Lightweight function to ONLY get custom field options (like client list)
  async getCustomFieldOptions(boardId: string, fieldName: string, userToken?: string): Promise<string[]> {
    try {
      const customFieldsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${boardId}/customFields`, {
        params: this.getAuthParams(userToken),
      });

      const field = customFieldsResponse.data.find((cf: any) => cf.name === fieldName);
      if (!field?.options) return [];

      return field.options
        .map((opt: any) => opt.value?.text)
        .filter((text: string) => text);
    } catch (error) {
      console.error(`Error fetching custom field options for ${fieldName}:`, error);
      return [];
    }
  }

  // Add a new option to a custom field
  async addCustomFieldOption(boardId: string, fieldName: string, optionValue: string, userToken?: string): Promise<void> {
    try {
      // Get the custom field
      const customFieldsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${boardId}/customFields`, {
        params: this.getAuthParams(userToken),
      });

      const field = customFieldsResponse.data.find((cf: any) => cf.name === fieldName);
      if (!field) {
        throw new Error(`Custom field "${fieldName}" not found on board`);
      }

      // Check if the option already exists
      const existingOptions = field.options || [];
      const optionExists = existingOptions.some((opt: any) => opt.value?.text === optionValue);
      
      if (optionExists) {
        console.log(`Option "${optionValue}" already exists for field "${fieldName}"`);
        return;
      }

      // Add the new option
      await axios.post(`${TRELLO_API_BASE}/customFields/${field.id}/options`, null, {
        params: {
          ...this.getAuthParams(userToken),
          value: JSON.stringify({ text: optionValue }),
        },
      });

      console.log(`Added option "${optionValue}" to field "${fieldName}" on board ${boardId}`);
    } catch (error) {
      console.error(`Error adding custom field option for ${fieldName}:`, error);
      throw error;
    }
  }

  async getBoardData(boardId?: string, userToken?: string) {
    const targetBoardId = boardId || this.accountManagementBoardId;
    try {
      // Get board lists
      const listsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${targetBoardId}/lists`, {
        params: this.getAuthParams(userToken),
      });

      // Get board cards with members and custom fields
      const cardsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${targetBoardId}/cards`, {
        params: {
          ...this.getAuthParams(userToken),
          members: 'true',
          customFieldItems: 'true',
        },
      });

      // Get custom fields
      const customFieldsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${targetBoardId}/customFields`, {
        params: this.getAuthParams(userToken),
      });

      // Get board members
      const membersResponse = await axios.get(`${TRELLO_API_BASE}/boards/${targetBoardId}/members`, {
        params: this.getAuthParams(userToken),
      });

      // Get board labels
      const labelsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${targetBoardId}/labels`, {
        params: this.getAuthParams(userToken),
      });

      return {
        lists: listsResponse.data,
        cards: cardsResponse.data,
        customFields: customFieldsResponse.data,
        members: membersResponse.data,
        labels: labelsResponse.data,
      };
    } catch (error) {
      console.error('Error fetching Trello data:', error);
      throw error;
    }
  }

  async getAllBoardsData() {
    try {
      const [accountManagementData, designUxData, developmentData] = await Promise.all([
        this.getBoardData(this.accountManagementBoardId),
        this.designUxBoardId ? this.getBoardData(this.designUxBoardId) : null,
        this.developmentBoardId ? this.getBoardData(this.developmentBoardId) : null,
      ]);

      return {
        accountManagement: {
          ...accountManagementData,
          boardId: this.accountManagementBoardId,
          boardName: 'Account Management',
          boardTag: 'ACCT MGMT'
        },
        designUx: designUxData ? {
          ...designUxData,
          boardId: this.designUxBoardId,
          boardName: 'Design/UX',
          boardTag: 'DESIGN/UX'
        } : null,
        development: developmentData ? {
          ...developmentData,
          boardId: this.developmentBoardId,
          boardName: 'Development',
          boardTag: 'DEV'
        } : null,
      };
    } catch (error) {
      console.error('Error fetching all boards data:', error);
      throw error;
    }
  }

  async createBoard(name: string, desc?: string) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/boards`, {
        name,
        desc: desc || '',
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  }

  async updateBoard(boardId: string, updates: { name?: string; desc?: string }) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/boards/${boardId}`, {
        ...updates,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating board:', error);
      throw error;
    }
  }

  async createList(boardId: string, name: string) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/lists`, {
        name,
        idBoard: boardId,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }

  async createCustomField(boardId: string, fieldData: {
    name: string;
    type: string;
    options?: Array<{ value: { text: string } }>;
  }) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/customFields`, {
        ...fieldData,
        idModel: boardId,
        modelType: 'board',
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating custom field:', error);
      throw error;
    }
  }

  async deleteCustomField(customFieldId: string) {
    try {
      const response = await axios.delete(`${TRELLO_API_BASE}/customFields/${customFieldId}`, {
        params: this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting custom field:', error);
      throw error;
    }
  }

  async getCustomFields(boardId: string) {
    try {
      const response = await axios.get(`${TRELLO_API_BASE}/boards/${boardId}/customFields`, {
        params: this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      throw error;
    }
  }

  async createCard(listId: string, cardData: {
    name: string;
    desc?: string;
    due?: string;
    idMembers?: string[];
  }) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/cards`, {
        ...cardData,
        idList: listId,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  async updateCard(cardId: string, updates: {
    name?: string;
    desc?: string;
    due?: string | null;
    closed?: boolean;
  }) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}`, {
        ...updates,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }

  async setCustomField(cardId: string, customFieldName: string, value: string, boardId?: string) {
    try {
      // Get the board ID from the card if not provided
      let targetBoardId = boardId;
      if (!targetBoardId) {
        const cardResponse = await axios.get(`${TRELLO_API_BASE}/cards/${cardId}`, {
          params: this.getAuthParams(),
        });
        targetBoardId = cardResponse.data.idBoard;
      }
      
      // First, get the custom field ID by name
      const customFieldsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${targetBoardId}/customFields`, {
        params: this.getAuthParams(),
      });
      
      const customField = customFieldsResponse.data.find((cf: any) => cf.name === customFieldName);
      if (!customField) {
        console.error(`Custom field "${customFieldName}" not found. Available fields:`, customFieldsResponse.data.map((cf: any) => cf.name));
        throw new Error(`Custom field "${customFieldName}" not found`);
      }
      
      console.log(`Setting custom field "${customFieldName}" (${customField.type}) with value:`, value);
      
      // For different field types, we need different value formats
      let fieldValue;
      if (customField.type === 'list') {
        console.log(`Looking for option "${value}" in field "${customFieldName}". Available options:`, customField.options.map((opt: any) => opt.value.text));
        const option = customField.options.find((opt: any) => opt.value.text === value);
        if (!option) {
          console.error(`Option "${value}" not found for custom field "${customFieldName}"`);
          throw new Error(`Option "${value}" not found for custom field "${customFieldName}"`);
        }
        fieldValue = { idValue: option.id };
        console.log(`Using option ID: ${option.id} for value: ${value}`);
      } else if (customField.type === 'date') {
        // For date fields, set to empty string if value is empty
        fieldValue = { value: value ? { date: value } : "" };
        console.log(`Using date format for value: ${value}`);
      } else {
        // For text fields, set to empty string if value is empty
        fieldValue = { value: value ? { text: value } : "" };
        console.log(`Using text format for value: ${value}`);
      }
      
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}/customField/${customField.id}/item`, {
        ...fieldValue,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error setting custom field:', error);
      throw error;
    }
  }

  // Set Planned Date custom field (for Design/UX and Development boards) - DEPRECATED
  async setPlannedDate(cardId: string, plannedDate: string, boardId?: string) {
    try {
      return await this.setCustomField(cardId, 'Planned Date', plannedDate, boardId);
    } catch (error) {
      console.error('Error setting planned date:', error);
      throw error;
    }
  }

  // Set Planned Start Date custom field
  async setPlannedStartDate(cardId: string, startDate: string, boardId?: string) {
    try {
      return await this.setCustomField(cardId, 'Planned Start Date', startDate, boardId);
    } catch (error) {
      console.error('Error setting planned start date:', error);
      throw error;
    }
  }

  // Set Planned End Date custom field
  async setPlannedEndDate(cardId: string, endDate: string, boardId?: string) {
    try {
      return await this.setCustomField(cardId, 'Planned End Date', endDate, boardId);
    } catch (error) {
      console.error('Error setting planned end date:', error);
      throw error;
    }
  }

  // Set both start and end dates at once
  async setPlannedDateRange(cardId: string, startDate: string, endDate: string, boardId?: string) {
    try {
      await Promise.all([
        this.setPlannedStartDate(cardId, startDate, boardId),
        this.setPlannedEndDate(cardId, endDate, boardId)
      ]);
    } catch (error) {
      console.error('Error setting planned date range:', error);
      throw error;
    }
  }


  // Update card due date (for Admin tasks)
  async updateCardDueDate(cardId: string, dueDate: string) {
    try {
      return await axios.put(`${TRELLO_API_BASE}/cards/${cardId}`, {
        ...this.getAuthParams(),
        due: dueDate || null // Set to null if empty string
      });
    } catch (error) {
      console.error('Error updating card due date:', error);
      throw error;
    }
  }

  async addLabel(cardId: string, labelId: string) {
    try {
      const response = await axios.post(`${TRELLO_API_BASE}/cards/${cardId}/idLabels`, {
        value: labelId,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error adding label:', error);
      throw error;
    }
  }

  async removeLabel(cardId: string, labelId: string) {
    try {
      const response = await axios.delete(`${TRELLO_API_BASE}/cards/${cardId}/idLabels/${labelId}`, {
        params: this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error removing label:', error);
      throw error;
    }
  }

  async addLabelByName(cardId: string, labelName: string, color: string = 'green') {
    try {
      // First, get board labels
      const labelsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${this.boardId}/labels`, {
        params: this.getAuthParams(),
      });
      
      // Find existing label by name
      let label = labelsResponse.data.find((l: any) => l.name === labelName);
      
      // If label doesn't exist, create it
      if (!label) {
        const createResponse = await axios.post(`${TRELLO_API_BASE}/labels`, {
          name: labelName,
          color: color,
          idBoard: this.boardId,
          ...this.getAuthParams(),
        });
        label = createResponse.data;
      }
      
      // Add the label to the card
      return await this.addLabel(cardId, label.id);
    } catch (error) {
      console.error('Error adding label by name:', error);
      throw error;
    }
  }

  async removeLabelByName(cardId: string, labelName: string) {
    try {
      // First, get board labels
      const labelsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${this.boardId}/labels`, {
        params: this.getAuthParams(),
      });
      
      // Find label by name
      const label = labelsResponse.data.find((l: any) => l.name === labelName);
      if (!label) {
        console.warn(`Label "${labelName}" not found`);
        return;
      }
      
      // Remove the label from the card
      return await this.removeLabel(cardId, label.id);
    } catch (error) {
      console.error('Error removing label by name:', error);
      throw error;
    }
  }

  // Weekly Planning Board Methods
  async getWeeklyPlanningBoardData(retryCount = 0) {
    try {
      const [boardResponse, listsResponse, cardsResponse, customFieldsResponse] = await Promise.all([
        axios.get(`${TRELLO_API_BASE}/boards/${this.weeklyPlanningBoardId}`, {
          params: this.getAuthParams(),
          timeout: 10000
        }),
        axios.get(`${TRELLO_API_BASE}/boards/${this.weeklyPlanningBoardId}/lists`, {
          params: this.getAuthParams(),
          timeout: 10000
        }),
        axios.get(`${TRELLO_API_BASE}/boards/${this.weeklyPlanningBoardId}/cards`, {
          params: { ...this.getAuthParams(), customFieldItems: true },
          timeout: 10000
        }),
        axios.get(`${TRELLO_API_BASE}/boards/${this.weeklyPlanningBoardId}/customFields`, {
          params: this.getAuthParams(),
          timeout: 10000
        })
      ]);

      return {
        board: boardResponse.data,
        lists: listsResponse.data,
        cards: cardsResponse.data,
        customFields: customFieldsResponse.data
      };
    } catch (error: any) {
      console.error('Error fetching weekly planning board data:', error);
      
      // Retry on 503 or network errors (up to 2 retries)
      if (retryCount < 2 && (error.response?.status === 503 || error.code === 'ECONNABORTED')) {
        console.log(`Retrying weekly planning board data fetch (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.getWeeklyPlanningBoardData(retryCount + 1);
      }
      
      // Return empty data instead of throwing to prevent app crash
      console.warn('Returning empty weekly planning data due to API error');
      return {
        board: { id: this.weeklyPlanningBoardId, name: 'Weekly Planning' },
        lists: [],
        cards: [],
        customFields: []
      };
    }
  }

  async createWeeklyPlanningCard(dayListId: string, originalTask: any, taskType: string) {
    try {
      // Create the card in the weekly planning board
      const cardResponse = await axios.post(`${TRELLO_API_BASE}/cards`, {
        name: originalTask.title,
        idList: dayListId,
        due: originalTask.dueDate,
        desc: `Original task from ${taskType} board`,
        ...this.getAuthParams()
      });

      const newCard = cardResponse.data;

      // Set custom fields
      await this.setCustomField(newCard.id, 'Original Board', originalTask.boardName || taskType, this.weeklyPlanningBoardId);
      await this.setCustomField(newCard.id, 'Original Card ID', originalTask.id, this.weeklyPlanningBoardId);
      await this.setCustomField(newCard.id, 'Task Type', taskType, this.weeklyPlanningBoardId);

      return newCard;
    } catch (error) {
      console.error('Error creating weekly planning card:', error);
      throw error;
    }
  }

  async moveWeeklyPlanningCard(cardId: string, newDayListId: string) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}`, {
        idList: newDayListId,
        ...this.getAuthParams()
      });

      return response.data;
    } catch (error) {
      console.error('Error moving weekly planning card:', error);
      throw error;
    }
  }

  async deleteWeeklyPlanningCard(cardId: string) {
    try {
      await axios.delete(`${TRELLO_API_BASE}/cards/${cardId}`, {
        params: this.getAuthParams()
      });
    } catch (error) {
      console.error('Error deleting weekly planning card:', error);
      throw error;
    }
  }

  // Mark a card as complete (sets dueComplete to true)
  async markCardComplete(cardId: string, userToken?: string) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}`, null, {
        params: {
          ...this.getAuthParams(userToken),
          dueComplete: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error marking card as complete:', error);
      throw error;
    }
  }

  // Archive a card (sets closed to true)
  async archiveCard(cardId: string, userToken?: string) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}`, null, {
        params: {
          ...this.getAuthParams(userToken),
          closed: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error archiving card:', error);
      throw error;
    }
  }

  // Auto-archive cards that have been complete for 7+ days
  async autoArchiveOldCompletedCards(boardId: string, userToken?: string) {
    try {
      // Get all cards from the board
      const cardsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${boardId}/cards`, {
        params: {
          ...this.getAuthParams(userToken),
          filter: 'open' // Only get non-archived cards
        }
      });

      const cards = cardsResponse.data;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Filter cards that are complete and were marked complete 7+ days ago
      const cardsToArchive = cards.filter((card: any) => {
        if (!card.dueComplete || !card.due) return false;
        
        // Check if the card has been in "Complete" status for 7 days
        // We'll use the due date as a proxy for when it was completed
        const dueDate = new Date(card.due);
        return dueDate < sevenDaysAgo;
      });

      // Archive each card
      const archivePromises = cardsToArchive.map((card: any) => 
        this.archiveCard(card.id, userToken)
      );

      await Promise.all(archivePromises);
      
      console.log(`Auto-archived ${cardsToArchive.length} cards older than 7 days`);
      return cardsToArchive.length;
    } catch (error) {
      console.error('Error auto-archiving old completed cards:', error);
      throw error;
    }
  }

  async createCard(cardData: {
    title: string;
    description?: string;
    boardId: string;
    listId?: string;
    client?: string;
    project?: string;
    milestone?: string;
    effort?: string;
    assignee?: string;
    labelId?: string;
    dueDate?: string;
  }, userToken?: string) {
    try {
      // Get the board's lists to find the appropriate default list
      const listsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${cardData.boardId}/lists`, {
        params: this.getAuthParams(userToken),
      });
      
      const lists = listsResponse.data;
      
      // Determine target list based on board
      let targetListId = cardData.listId;
      
      if (!targetListId) {
        // For Account Management board, default to "👥 Account Tasks" list
        if (cardData.boardId === this.accountManagementBoardId) {
          const accountTasksList = lists.find((list: any) => list.name === '👥 Account Tasks');
          targetListId = accountTasksList?.id || lists[0]?.id;
        } else {
          // For other boards, use the first list
          targetListId = lists[0]?.id;
        }
      }
      
      if (!targetListId) {
        throw new Error('No list found on the board');
      }

      // Create the card
      const cardParams = {
        ...this.getAuthParams(userToken),
        name: cardData.title,
        desc: cardData.description || '',
        idList: targetListId,
        ...(cardData.dueDate && { due: cardData.dueDate }),
      };
      
      console.log('Creating card with params:', {
        url: `${TRELLO_API_BASE}/cards`,
        listId: targetListId,
        cardName: cardData.title,
        hasToken: !!userToken,
        hasApiKey: !!this.apiKey,
      });

      const cardResponse = await axios.post(`${TRELLO_API_BASE}/cards`, null, {
        params: cardParams,
      });

      const newCard = cardResponse.data;
      console.log('Card created successfully:', newCard.id);

      // Add label if provided (skip if empty)
      if (cardData.labelId && cardData.labelId !== '') {
        await axios.post(`${TRELLO_API_BASE}/cards/${newCard.id}/idLabels`, null, {
          params: {
            ...this.getAuthParams(userToken),
            value: cardData.labelId,
          },
        });
      }

      // Add assignee if provided (skip if empty)
      if (cardData.assignee && cardData.assignee !== '') {
        // First, get all board members
        const membersResponse = await axios.get(`${TRELLO_API_BASE}/boards/${cardData.boardId}/members`, {
          params: this.getAuthParams(userToken),
        });
        
        const member = membersResponse.data.find((m: any) => m.fullName === cardData.assignee);
        if (member) {
          await axios.post(`${TRELLO_API_BASE}/cards/${newCard.id}/idMembers`, null, {
            params: {
              ...this.getAuthParams(userToken),
              value: member.id,
            },
          });
        }
      }

      // Add custom fields if provided
      const customFieldsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${cardData.boardId}/customFields`, {
        params: this.getAuthParams(userToken),
      });

      const customFields = customFieldsResponse.data;

      // Only set custom fields if they have values
      if (cardData.client && cardData.client !== '') {
        const clientField = customFields.find((cf: any) => cf.name === 'Client');
        if (clientField) {
          // For dropdown fields, find the option ID by text value
          const clientOption = clientField.options?.find((opt: any) => opt.value?.text === cardData.client);
          if (clientOption) {
            await axios.put(`${TRELLO_API_BASE}/cards/${newCard.id}/customField/${clientField.id}/item`, {
              idValue: clientOption.id,
            }, {
              params: this.getAuthParams(userToken),
            });
          }
        }
      }

      if (cardData.project && cardData.project !== '') {
        const projectField = customFields.find((cf: any) => cf.name === 'Project');
        if (projectField) {
          // For dropdown fields, find the option ID by text value
          const projectOption = projectField.options?.find((opt: any) => opt.value?.text === cardData.project);
          if (projectOption) {
            await axios.put(`${TRELLO_API_BASE}/cards/${newCard.id}/customField/${projectField.id}/item`, {
              idValue: projectOption.id,
            }, {
              params: this.getAuthParams(userToken),
            });
          }
        }
      }

      if (cardData.milestone && cardData.milestone !== '') {
        const milestoneField = customFields.find((cf: any) => cf.name === 'Milestone');
        if (milestoneField) {
          // For text fields, send value
          await axios.put(`${TRELLO_API_BASE}/cards/${newCard.id}/customField/${milestoneField.id}/item`, {
            value: { text: cardData.milestone },
          }, {
            params: this.getAuthParams(userToken),
          });
        }
      }

      if (cardData.effort && cardData.effort !== '') {
        const effortField = customFields.find((cf: any) => cf.name === 'Effort');
        if (effortField) {
          // For dropdown fields, send idValue
          await axios.put(`${TRELLO_API_BASE}/cards/${newCard.id}/customField/${effortField.id}/item`, {
            idValue: cardData.effort,
          }, {
            params: this.getAuthParams(userToken),
          });
        }
      }

      return newCard;
    } catch (error: any) {
      console.error('Error creating card:', error);
      console.error('Error response:', error.response?.data);
      console.error('Card data:', cardData);
      throw error;
    }
  }
}

export const trelloService = new TrelloService();
export { TrelloService };
