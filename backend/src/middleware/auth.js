import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import pool from '../utils/database.js';
import { verifySecuritySignature } from '../utils/security.js';

export const authenticateToken = async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  const signature = req.headers['x-sf-unique-signature'];
  const timestamp = req.headers['x-sf-timestamp'];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    
    // CUSTOM SECURITY: Verify session fingerprint binding
    const [sessions] = await pool.execute(
        'SELECT fingerprint FROM user_sessions WHERE userId = ? AND token = ? LIMIT 1',
        [decoded.userId, token]
    );

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
