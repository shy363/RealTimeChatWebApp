import { Request, Response } from 'express';
import pool from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const sendMessageAPI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, recipientId } = req.body;
    const userId = req.user?.userId;
    const username = req.user?.username;

    if (!content || !userId || !username) {
      return res.status(400).json({ message: 'Content and authentication required' });
    }

    const message = await saveMessage(content, userId, username, recipientId);

    // Emit via socket.io if available
    const io = req.app.get('io');
    if (io) {
      if (!recipientId) {
        io.to('global').emit('newMessage', message);
      } else {
        io.to(`user_${userId}`).emit('newMessage', message);
        io.to(`user_${recipientId}`).emit('newMessage', message);
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contactId } = req.query; // 'global' or a specific userId
    const userId = req.user?.userId;

    let query = '';
    let params: any[] = [];

    if (!contactId || contactId === 'global') {
      // Fetch messages for the global room
      query = 'SELECT * FROM messages WHERE recipientId IS NULL ORDER BY createdAt ASC LIMIT 100';
    } else {
      // Fetch messages for a specific 1-on-1 conversion
      query = `
        SELECT * FROM messages 
        WHERE (userId = ? AND recipientId = ?) 
        OR (userId = ? AND recipientId = ?) 
        ORDER BY createdAt ASC 
        LIMIT 100
      `;
      params = [userId, contactId, contactId, userId];
    }

    const [messages] = await pool.execute(query, params as any[]) as any[];

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const saveMessage = async (content: string, userId: string, username: string, recipientId?: string) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO messages (content, userId, username, recipientId) VALUES (?, ?, ?, ?)',
      [content, userId, username, recipientId || null] as any[]
    ) as any[];

    const [rows] = await pool.execute(
      'SELECT * FROM messages WHERE id = ?',
      [result.insertId] as any[]
    ) as any[];

    return rows[0];
  } catch (error) {
    console.error('Save message error:', error);
    throw error;
  }
};
