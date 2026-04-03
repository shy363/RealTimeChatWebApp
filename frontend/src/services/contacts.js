import api from './api.js';

export const contactService = {
  async getContacts() {
    const response = await api.get('/api/contacts');
    return response.data;
  },

  async searchUsers(username) {
    const response = await api.get(`/api/contacts/search?username=${username}`);
    return response.data;
  },

  async addContact(contactUsername) {
    const response = await api.post('/api/contacts/add', { contactUsername });
    return response.data;
  },

  async acceptInvite(inviteCode) {
    const response = await api.post('/api/contacts/invite', { inviteCode });
    return response.data;
  },

  async acceptRequest(contactId) {
    const response = await api.post('/api/contacts/accept', { contactId });
    return response.data;
  }
};
