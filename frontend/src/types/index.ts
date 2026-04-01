export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  inviteCode: string;
  status?: 'accepted' | 'pending' | 'sent';
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  recipientId?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  username: string;
  emojiPattern: string;
}

export interface RegisterCredentials {
  username: string;
  emojiPattern: string;
}
