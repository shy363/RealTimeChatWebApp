import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import contactRoutes from './routes/contacts.js';
import { verifyToken } from './utils/jwt.js';
import pool from './utils/database.js';
import { saveMessage } from './controllers/messageController.js';
import { initDatabase } from './utils/database.js';
import { serveStatic } from './utils/serveStatic.js';

dotenv.config();

const app = express();
const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// ✅ Simple test route (VERY IMPORTANT)
app.get('/', (req, res) => {
  res.send("🚀 Backend is running successfully on Railway!");
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contacts', contactRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(serveStatic);
  app.get('*', (req, res) => {
    res.sendFile(join(dirname(fileURLToPath(import.meta.url)), 'frontend/dist/index.html'));
  });
}

// Socket.io
const onlineUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = verifyToken(token);
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const { userId } = socket.data.user;

  onlineUsers.set(userId, socket.id);

  // ✅ Join personal room for direct messaging
  socket.join(`user_${userId}`);
  console.log(`User ${userId} joined room user_${userId}`);

  socket.on('sendMessage', async (data) => {
    try {
      const { content, recipientId } = data;

      const message = await saveMessage(
        content,
        userId,
        socket.data.user.username,
        recipientId
      );

      // ✅ Send to both sender and recipient rooms
      io.to(`user_${recipientId}`).emit('newMessage', message);
      io.to(`user_${userId}`).emit('newMessage', message);
    } catch (err) {
      console.error('Message send error:', err);
      socket.emit('error', 'Message failed');
    }
  });

  // ✅ Typing indicators
  socket.on('typing', (data) => {
    const { recipientId } = data;
    socket.to(`user_${recipientId}`).emit('userTyping', { userId });
  });

  socket.on('stopTyping', (data) => {
    const { recipientId } = data;
    socket.to(`user_${recipientId}`).emit('userStopTyping', { userId });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  });
});

// Server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();

export default app;