import { Message } from '../types';
import api from './api';

export const messageService = {
  async getMessages(contactId: string): Promise<Message[]> {
    const response = await api.get(`/messages?contactId=${contactId}`);
    return response.data;
  }
};
