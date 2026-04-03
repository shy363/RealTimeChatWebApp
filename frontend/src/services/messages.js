import api from './api.js';

export const messageService = {
  async getMessages(contactId) {
    const response = await api.get(`/api/messages?contactId=${contactId}`);
    return response.data;
  }
};
