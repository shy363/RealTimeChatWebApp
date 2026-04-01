"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const messages_1 = __importDefault(require("./routes/messages"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const jwt_1 = require("./utils/jwt");
const database_1 = __importDefault(require("./utils/database"));
const messageController_1 = require("./controllers/messageController");
const database_2 = require("./utils/database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.set('io', io);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/contacts', contacts_1.default);
const onlineUsers = new Map(); // userId -> socketId
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        socket.data.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };
        next();
    }
    catch (error) {
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
            const [friendship] = await database_1.default.execute('SELECT status FROM contacts WHERE userId = ? AND contactId = ? AND status = ?', [userId, recipientId, 'accepted']);
            if (friendship.length > 0) {
                io.to(`user_${recipientId}`).emit('userTyping', { userId });
            }
        }
    });
    socket.on('stopTyping', async ({ recipientId }) => {
        if (recipientId) {
            const [friendship] = await database_1.default.execute('SELECT status FROM contacts WHERE userId = ? AND contactId = ? AND status = ?', [userId, recipientId, 'accepted']);
            if (friendship.length > 0) {
                io.to(`user_${recipientId}`).emit('userStoppedTyping', { userId });
            }
        }
    });
    socket.on('sendMessage', async (data) => {
        try {
            const { content, recipientId } = data;
            const { userId, username } = socket.data.user;
            if (!content || !userId)
                return;
            if (recipientId) {
                // Verify friendship is accepted
                const [friendship] = await database_1.default.execute('SELECT status FROM contacts WHERE userId = ? AND contactId = ? AND status = ?', [userId, recipientId, 'accepted']);
                if (friendship.length === 0) {
                    socket.emit('error', 'You must be accepted friends to chat.');
                    return;
                }
            }
            const message = await (0, messageController_1.saveMessage)(content.trim(), userId, username, recipientId);
            if (!recipientId) {
                socket.emit('error', 'Private recipient is required');
                return;
            }
            else {
                // Direct Emit to both Sender and Recipient Rooms
                io.to(`user_${userId}`).emit('newMessage', message);
                io.to(`user_${recipientId}`).emit('newMessage', message);
            }
        }
        catch (error) {
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
        await (0, database_2.initDatabase)();
        console.log(`Attempting to start server on port ${PORT}...`);
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map