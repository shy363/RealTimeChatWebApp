"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.validateToken = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../utils/database"));
const jwt_1 = require("../utils/jwt");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await database_1.default.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = users[0];
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            username: user.username,
            email: user.email
        });
        // CUSTOM SECURITY LAYER: Session Fingerprint
        const fingerprint = crypto_1.default.randomBytes(32).toString('hex');
        await database_1.default.execute('INSERT INTO user_sessions (userId, fingerprint, token) VALUES (?, ?, ?)', [user.id, fingerprint, token]);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;
        const [existingUsers] = await database_1.default.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        const userId = crypto_1.default.randomUUID();
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        await database_1.default.execute('INSERT INTO users (id, username, email, password, phoneNumber, inviteCode) VALUES (?, ?, ?, ?, ?, ?)', [userId, username, email, hashedPassword, phoneNumber || null, inviteCode]);
        const token = (0, jwt_1.generateToken)({
            userId: userId,
            username,
            email
        });
        // CUSTOM SECURITY LAYER: Session Fingerprint
        const fingerprint = crypto_1.default.randomBytes(32).toString('hex');
        await database_1.default.execute('INSERT INTO user_sessions (userId, fingerprint, token) VALUES (?, ?, ?)', [userId, fingerprint, token]);
        const newUser = {
            id: userId,
            username,
            email,
            phoneNumber: phoneNumber || null,
            inviteCode,
            createdAt: new Date().toISOString()
        };
        // Emit live update to all online users
        const io = req.app.get('io');
        if (io)
            io.emit('newUser', newUser);
        res.status(201).json({
            user: newUser,
            token,
            fingerprint
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.register = register;
const validateToken = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const [users] = await database_1.default.execute('SELECT id, username, email, phoneNumber, inviteCode, createdAt FROM users WHERE id = ?', [req.user.userId]);
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
    }
    catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.validateToken = validateToken;
const getUsers = async (req, res) => {
    try {
        const [users] = await database_1.default.execute('SELECT id, username, email, phoneNumber, createdAt FROM users');
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
//# sourceMappingURL=authController.js.map