import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { searchUsers, addContact, getContacts, inviteByCode, acceptContact } from '../controllers/contactController.js';

const router = express.Router();

router.use(authenticateToken); // Protected routes

router.get('/', getContacts);
router.get('/search', searchUsers);
router.post('/add', addContact);
router.post('/invite', inviteByCode);
router.post('/accept', acceptContact);

export default router;
