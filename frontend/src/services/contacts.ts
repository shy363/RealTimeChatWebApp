import api from './api';

export const contactService = {
  async getContacts(): Promise<any[]> {
    const response = await api.get('/contacts');
    return response.data;
  },

  async searchUsers(username: string): Promise<any[]> {
    const response = await api.get(`/contacts/search?username=${username}`);
    return response.data;
  },

  async addContact(contactUsername: string): Promise<any> {
    const response = await api.post('/contacts/add', { contactUsername });
    return response.data;
  },

  async acceptInvite(inviteCode: string): Promise<any> {
    const response = await api.post('/contacts/invite', { inviteCode });
    return response.data;
  },

  async acceptRequest(contactId: string): Promise<any> {
    const response = await api.post('/contacts/accept', { contactId });
    return response.data;
  }
};
