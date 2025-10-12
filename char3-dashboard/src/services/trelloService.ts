import axios from 'axios';

const TRELLO_API_BASE = 'https://api.trello.com/1';

class TrelloService {
  private apiKey: string;
  private token: string;
  private boardId: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || '';
    this.token = process.env.NEXT_PUBLIC_TRELLO_TOKEN || '';
    this.boardId = process.env.NEXT_PUBLIC_TRELLO_BOARD_ID || '';
  }

  private getAuthParams() {
    return {
      key: this.apiKey,
      token: this.token,
    };
  }

  async getBoardData() {
    try {
      // Get board lists
      const listsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${this.boardId}/lists`, {
        params: this.getAuthParams(),
      });

      // Get board cards with members and custom fields
      const cardsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${this.boardId}/cards`, {
        params: {
          ...this.getAuthParams(),
          members: 'true',
          customFieldItems: 'true',
        },
      });

      // Get custom fields
      const customFieldsResponse = await axios.get(`${TRELLO_API_BASE}/boards/${this.boardId}/customFields`, {
        params: this.getAuthParams(),
      });

      return {
        lists: listsResponse.data,
        cards: cardsResponse.data,
        customFields: customFieldsResponse.data,
      };
    } catch (error) {
      console.error('Error fetching Trello data:', error);
      throw error;
    }
  }

  async createCard(listId: string, cardData: {
    name: string;
    desc?: string;
    due?: string;
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
    due?: string;
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

  async setCustomField(cardId: string, customFieldId: string, value: string) {
    try {
      const response = await axios.put(`${TRELLO_API_BASE}/cards/${cardId}/customField/${customFieldId}/item`, {
        idValue: value,
        ...this.getAuthParams(),
      });
      return response.data;
    } catch (error) {
      console.error('Error setting custom field:', error);
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
}

export const trelloService = new TrelloService();
