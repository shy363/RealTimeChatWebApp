import { Response } from 'express';
import pool from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.query;
    const currentUserId = req.user?.userId;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'Username query is required' });
    }

    const [users] = await pool.execute(
      'SELECT id, username FROM users WHERE username LIKE ? AND id != ? LIMIT 10',
      [`%${username}%`, currentUserId] as any[]
    ) as any[];

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addContact = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contactUsername } = req.body;
    const currentUserId = req.user?.userId;

    if (!contactUsername) {
      return res.status(400).json({ message: 'Contact username is required' });
    }

    // Find the user to add
    const [targetUser] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [contactUsername] as any[]
    ) as any[];

    if (targetUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const contactId = targetUser[0].id;

    if (contactId === currentUserId) {
      return res.status(400).json({ message: 'You cannot add yourself as a contact' });
    }

    // Check if contact already exists
    const [existing] = await pool.execute(
      'SELECT id FROM contacts WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)',
      [currentUserId, contactId, contactId, currentUserId] as any[]
    ) as any[];

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Contact already added' });
    }

    // Add contact: User A (sent) -> User B (pending)
    await pool.execute(
      'INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)',
      [currentUserId, contactId, 'sent'] as any[]
    );
    
    await pool.execute(
      'INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)',
      [contactId, currentUserId, 'pending'] as any[]
    );

    // Notify recipient in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${contactId}`).emit('newFriendRequest', { 
        from: { id: currentUserId, username: req.user?.username } 
      });
    }

    res.json({ message: 'Contact added successfully' });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContacts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;

    const [contacts] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.inviteCode, c.status 
       FROM contacts c 
       JOIN users u ON c.contactId = u.id 
       WHERE c.userId = ?`,
      [currentUserId] as any[]
    ) as any[];

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const inviteByCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const currentUserId = req.user?.userId;

    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    // Find the inviter
    const [inviter] = await pool.execute(
      'SELECT id, username FROM users WHERE inviteCode = ?',
      [inviteCode] as any[]
    ) as any[];

    if (inviter.length === 0) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    const inviterId = inviter[0].id;

    if (inviterId === currentUserId) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    // Check if contact already exists
    const [existing] = await pool.execute(
      'SELECT id FROM contacts WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)',
      [currentUserId, inviterId, inviterId, currentUserId] as any[]
    ) as any[];

    if (existing.length > 0) {
      return res.status(200).json({ message: 'Friendship already established', user: inviter[0] });
    }

    // Create a bidirectional pending connection
    // requester: currentUserId, recipient: inviterId
    await pool.execute(
      'INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)',
      [currentUserId, inviterId, 'sent'] as any[]
    );
    await pool.execute(
      'INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)',
      [inviterId, currentUserId, 'pending'] as any[]
    );

    // Notify inviter in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${inviterId}`).emit('newFriendRequest', { 
        from: { id: currentUserId, username: req.user?.username } 
      });
    }

    res.status(201).json({ message: 'Request sent successfully', user: inviter[0] });
  } catch (error) {
    console.error('Invite by code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const acceptContact = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contactId } = req.body;
    const currentUserId = req.user?.userId;

    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID is required' });
    }

    // Update both sides to 'accepted'
    await pool.execute(
      'UPDATE contacts SET status = ? WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)',
      ['accepted', currentUserId, contactId, contactId, currentUserId] as any[]
    );

    // Notify both users in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${currentUserId}`).emit('friendRequestAccepted', { contactId });
      io.to(`user_${contactId}`).emit('friendRequestAccepted', { contactId: currentUserId });
    }

    res.json({ message: 'Request accepted' });
  } catch (error) {
    console.error('Accept contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
