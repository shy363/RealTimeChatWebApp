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
import { verifyToken } from './utils/jwt.js';
import pool from './utils/database.js';
import { saveMessage } from './controllers/messageController.js';
import { initDatabase } from './utils/database.js';

dotenv.config();

const app = express();
const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
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

  socket.on('sendMessage', async (data) => {
    try {
      const { content, recipientId } = data;

      const message = await saveMessage(
        content,
        userId,
        socket.data.user.username,
        recipientId
      );

      io.to(`user_${recipientId}`).emit('newMessage', message);
    } catch (err) {
      socket.emit('error', 'Message failed');
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
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