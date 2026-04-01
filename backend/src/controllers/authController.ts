import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../utils/database';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, emojiPattern } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username] as any[]
    ) as any[];

    if (users.length === 0) {
      return res.status(401).json({ message: 'Identity not recognized' });
    }

    const user = users[0];
    
    // Validate unique emoji pattern (Single source of truth now)
    const isPatternValid = user.emojiPattern === emojiPattern;

    if (!isPatternValid) {
      return res.status(401).json({ message: 'Quantum signature mismatch' });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    // CUSTOM SECURITY LAYER: Session Fingerprint
    const fingerprint = crypto.randomBytes(32).toString('hex');
    await pool.execute(
      'INSERT INTO user_sessions (userId, fingerprint, token) VALUES (?, ?, ?)',
      [user.id, fingerprint, token] as any[]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        inviteCode: user.inviteCode,
        createdAt: user.createdAt
      },
      token,
      fingerprint // Hand back to client for request signing
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, emojiPattern } = req.body;

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username] as any[]
    ) as any[];

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Alias already claimed' });
    }

    const userId = crypto.randomUUID();
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const dummyEmail = `${username}@quantum.local`;
    const dummyPassword = await bcrypt.hash(emojiPattern, 10); // Still use a hashed version for DB safety

    await pool.execute(
      'INSERT INTO users (id, username, email, password, inviteCode, emojiPattern) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, dummyEmail, dummyPassword, inviteCode, emojiPattern] as any[]
    );

    const token = generateToken({
      userId: userId,
      username,
      email: dummyEmail
    });

    // CUSTOM SECURITY LAYER: Session Fingerprint
    const fingerprint = crypto.randomBytes(32).toString('hex');
    await pool.execute(
      'INSERT INTO user_sessions (userId, fingerprint, token) VALUES (?, ?, ?)',
      [userId, fingerprint, token] as any[]
    );

    const newUser = {
      id: userId,
      username,
      email: dummyEmail,
      inviteCode,
      createdAt: new Date().toISOString()
    };

    // Emit live update to all online users
    const io = req.app.get('io');
    if (io) io.emit('newUser', newUser);

    res.status(201).json({
      user: newUser,
      token,
      fingerprint
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const [users] = await pool.execute(
      'SELECT id, username, email, phoneNumber, inviteCode, createdAt FROM users WHERE id = ?',
      [req.user.userId] as any[]
    ) as any[];

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        inviteCode: user.inviteCode,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getUsers = async (req: Request, res: Response) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, phoneNumber, createdAt FROM users'
    ) as any[];

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
