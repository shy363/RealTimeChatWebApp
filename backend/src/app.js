import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import contactRoutes from './routes/contacts.js';
import { authenticateToken } from './middleware/auth.js';
import { verifyToken } from './utils/jwt.js';
import pool from './utils/database.js';
import { saveMessage } from './controllers/messageController.js';
import { initDatabase } from './utils/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

/* 
// Serve static files from the React app if build exists
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
*/

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = new SocketIOServer(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set('io', io);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: 'Too many requests from this IP, please try again later.'
});

console.log('Initializing middleware...');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
console.log('Helmet initialized');

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
console.log('CORS initialized');

app.use(limiter);
console.log('Limiter initialized');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('JSON parsers initialized');

console.log('Mounting API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contacts', contactRoutes);
console.log('API routes mounted');

// SPA Catch-all: Send all non-API requests to index.html
console.log('Mounting SPA catch-all...');
app.use((req, res, next) => {
  // If it's an API request, let it go to the 404 handler or fail normally
  if (req.url.startsWith('/api')) {
    return next();
  }
  const indexPath = path.resolve(__dirname, '../../frontend/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If index.html doesn't exist yet (dev mode), just send a message
      res.status(404).send('Frontend not built yet. Run npm run build in /frontend');
    }
  });
});
console.log('SPA catch-all mounted');

const onlineUsers = new Map(); // userId -> socketId

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token);
    socket.data.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
});

io.on('connection', async (socket) => {
  const { userId, username } = socket.data.user;
  console.log(`User ${username} connected`);
  
  // 1. Join standard private room
  // socket.join('global'); // Removed global as per private request
  socket.join(`user_${userId}`); // Private room for this specific user

  // 2. Track online status
  onlineUsers.set(userId, socket.id);
  
  // 3. Notify others that this user is online
  io.emit('userStatusChanged', { userId, status: 'online' });

  // 4. Send the list of currently online users to the new connection
  socket.emit('onlineUsers', Array.from(onlineUsers.keys()));

  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`User ${username} joined room: ${roomName}`);
  });

  /* 
  try {
    const [messages] = await pool.execute('SELECT * FROM messages WHERE recipientId IS NULL ORDER BY createdAt ASC LIMIT 50');
    socket.emit('previousMessages', messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
  */

  socket.on('typing', async ({ recipientId }) => {
    if (recipientId) {
      const [friendship] = await pool.execute(
        'SELECT status FROM contacts WHERE userId = ? AND contactId = ? AND status = ?',
        [userId, recipientId, 'accepted']
      );
      if (friendship.length > 0) {
        io.to(`user_${recipientId}`).emit('userTyping', { userId });
      }
    }
  });

  socket.on('stopTyping', async ({ recipientId }) => {
    if (recipientId) {
      const [friendship] = await pool.execute(
        'SELECT status FROM contacts WHERE userId = ? AND contactId = ? AND status = ?',
        [userId, recipientId, 'accepted']
      );
      if (friendship.length > 0) {
        io.to(`user_${recipientId}`).emit('userStoppedTyping', { userId });
      }
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { content, recipientId } = data;
      const { userId, username } = socket.data.user;

      if (!content || !userId) return;

      if (recipientId) {
        // Verify friendship is accepted
        const [friendship] = await pool.execute(
          'SELECT status FROM contacts WHERE userId = ? AND contactId = ? AND status = ?',
          [userId, recipientId, 'accepted']
        );

        if (friendship.length === 0) {
          socket.emit('error', 'You must be accepted friends to chat.');
          return;
        }
      }

      const message = await saveMessage(content.trim(), userId, username, recipientId);
      
      if (!recipientId) {
        socket.emit('error', 'Private recipient is required');
        return;
      } else {
        // Direct Emit to both Sender and Recipient Rooms
        io.to(`user_${userId}`).emit('newMessage', message);
        io.to(`user_${recipientId}`).emit('newMessage', message);
      }
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${username} disconnected`);
    onlineUsers.delete(userId);
    io.emit('userStatusChanged', { userId, status: 'offline' });
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    console.log(`Attempting to start server on port ${PORT}...`);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
