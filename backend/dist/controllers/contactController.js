"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptContact = exports.inviteByCode = exports.getContacts = exports.addContact = exports.searchUsers = void 0;
const database_1 = __importDefault(require("../utils/database"));
const searchUsers = async (req, res) => {
    try {
        const { username } = req.query;
        const currentUserId = req.user?.userId;
        if (!username || typeof username !== 'string') {
            return res.status(400).json({ message: 'Username query is required' });
        }
        const [users] = await database_1.default.execute('SELECT id, username FROM users WHERE username LIKE ? AND id != ? LIMIT 10', [`%${username}%`, currentUserId]);
        res.json(users);
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.searchUsers = searchUsers;
const addContact = async (req, res) => {
    try {
        const { contactUsername } = req.body;
        const currentUserId = req.user?.userId;
        if (!contactUsername) {
            return res.status(400).json({ message: 'Contact username is required' });
        }
        // Find the user to add
        const [targetUser] = await database_1.default.execute('SELECT id FROM users WHERE username = ?', [contactUsername]);
        if (targetUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const contactId = targetUser[0].id;
        if (contactId === currentUserId) {
            return res.status(400).json({ message: 'You cannot add yourself as a contact' });
        }
        // Check if contact already exists
        const [existing] = await database_1.default.execute('SELECT id FROM contacts WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)', [currentUserId, contactId, contactId, currentUserId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Contact already added' });
        }
        // Add contact (bi-directional for simplicity)
        await database_1.default.execute('INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)', [currentUserId, contactId, 'accepted']);
        await database_1.default.execute('INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)', [contactId, currentUserId, 'accepted']);
        res.json({ message: 'Contact added successfully' });
    }
    catch (error) {
        console.error('Add contact error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.addContact = addContact;
const getContacts = async (req, res) => {
    try {
        const currentUserId = req.user?.userId;
        const [contacts] = await database_1.default.execute(`SELECT u.id, u.username, u.email, c.status 
       FROM contacts c 
       JOIN users u ON c.contactId = u.id 
       WHERE c.userId = ?`, [currentUserId]);
        res.json(contacts);
    }
    catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getContacts = getContacts;
const inviteByCode = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const currentUserId = req.user?.userId;
        if (!inviteCode) {
            return res.status(400).json({ message: 'Invite code is required' });
        }
        // Find the inviter
        const [inviter] = await database_1.default.execute('SELECT id, username FROM users WHERE inviteCode = ?', [inviteCode]);
        if (inviter.length === 0) {
            return res.status(404).json({ message: 'Invalid invite code' });
        }
        const inviterId = inviter[0].id;
        if (inviterId === currentUserId) {
            return res.status(400).json({ message: 'You cannot invite yourself' });
        }
        // Check if contact already exists
        const [existing] = await database_1.default.execute('SELECT id FROM contacts WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)', [currentUserId, inviterId, inviterId, currentUserId]);
        if (existing.length > 0) {
            return res.status(200).json({ message: 'Friendship already established', user: inviter[0] });
        }
        // Create a bidirectional pending connection
        // requester: currentUserId, recipient: inviterId
        await database_1.default.execute('INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)', [currentUserId, inviterId, 'sent']);
        await database_1.default.execute('INSERT INTO contacts (userId, contactId, status) VALUES (?, ?, ?)', [inviterId, currentUserId, 'pending']);
        res.status(201).json({ message: 'Request sent successfully', user: inviter[0] });
    }
    catch (error) {
        console.error('Invite by code error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.inviteByCode = inviteByCode;
const acceptContact = async (req, res) => {
    try {
        const { contactId } = req.body;
        const currentUserId = req.user?.userId;
        if (!contactId) {
            return res.status(400).json({ message: 'Contact ID is required' });
        }
        // Update both sides to 'accepted'
        await database_1.default.execute('UPDATE contacts SET status = ? WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)', ['accepted', currentUserId, contactId, contactId, currentUserId]);
        // Notify both users in real-time
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${currentUserId}`).emit('friendRequestAccepted', { contactId });
            io.to(`user_${contactId}`).emit('friendRequestAccepted', { contactId: currentUserId });
        }
        res.json({ message: 'Request accepted' });
    }
    catch (error) {
        console.error('Accept contact error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.acceptContact = acceptContact;
//# sourceMappingURL=contactController.js.map