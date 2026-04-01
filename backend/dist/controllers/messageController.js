"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMessage = exports.getMessages = exports.sendMessageAPI = void 0;
const database_1 = __importDefault(require("../utils/database"));
const sendMessageAPI = async (req, res) => {
    try {
        const { content, recipientId } = req.body;
        const userId = req.user?.userId;
        const username = req.user?.username;
        if (!content || !userId || !username) {
            return res.status(400).json({ message: 'Content and authentication required' });
        }
        const message = await (0, exports.saveMessage)(content, userId, username, recipientId);
        // Emit via socket.io if available
        const io = req.app.get('io');
        if (io) {
            if (!recipientId) {
                io.to('global').emit('newMessage', message);
            }
            else {
                io.to(`user_${userId}`).emit('newMessage', message);
                io.to(`user_${recipientId}`).emit('newMessage', message);
            }
        }
        res.status(201).json(message);
    }
    catch (error) {
        console.error('Send message API error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sendMessageAPI = sendMessageAPI;
const getMessages = async (req, res) => {
    try {
        const { contactId } = req.query; // 'global' or a specific userId
        const userId = req.user?.userId;
        let query = '';
        let params = [];
        if (!contactId || contactId === 'global') {
            // Fetch messages for the global room
            query = 'SELECT * FROM messages WHERE recipientId IS NULL ORDER BY createdAt ASC LIMIT 100';
        }
        else {
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
        const [messages] = await database_1.default.execute(query, params);
        res.json(messages);
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMessages = getMessages;
const saveMessage = async (content, userId, username, recipientId) => {
    try {
        const [result] = await database_1.default.execute('INSERT INTO messages (content, userId, username, recipientId) VALUES (?, ?, ?, ?)', [content, userId, username, recipientId || null]);
        const [rows] = await database_1.default.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
        return rows[0];
    }
    catch (error) {
        console.error('Save message error:', error);
        throw error;
    }
};
exports.saveMessage = saveMessage;
//# sourceMappingURL=messageController.js.map