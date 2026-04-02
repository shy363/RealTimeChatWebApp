import api from './api.js';

export const messageService = {
  async getMessages(contactId) {
    const response = await api.get(`/messages?contactId=${contactId}`);
    return response.data;
  }
};
