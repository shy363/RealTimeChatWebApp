import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import pool from '../utils/database';
import { verifySecuritySignature } from '../utils/security';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
  };
  fingerprint?: string;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  const signature = req.headers['x-sf-unique-signature'] as string;
  const timestamp = req.headers['x-sf-timestamp'] as string;
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    
    // CUSTOM SECURITY: Verify session fingerprint binding
    const [sessions] = await pool.execute(
        'SELECT fingerprint FROM user_sessions WHERE userId = ? AND token = ? LIMIT 1',
        [decoded.userId, token] as any[]
    ) as any[];

    if (sessions.length === 0) {
        return res.status(403).json({ message: 'Session expired or invalid fingerprint' });
    }

    const { fingerprint } = sessions[0];

    // UNIQUE SEC LAYER: Enhanced Cryptographic Handshake (Not a regular one)
    if (!signature || !timestamp || !verifySecuritySignature(signature, timestamp, token, fingerprint)) {
        return res.status(401).json({ 
            message: 'SECURITY VIOLATION: Handshake failed. Request signature mismatch.' 
        });
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };
    req.fingerprint = fingerprint;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
