import { Router } from 'express';
import { getMessages, sendMessageAPI } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getMessages);
router.post('/send', authenticateToken, sendMessageAPI);

export default router;
