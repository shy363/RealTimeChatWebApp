import { Router } from 'express';
import { login, register, validateToken, getUsers } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateLogin, validateRegister } from '../middleware/validation';

const router = Router();

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.get('/validate', authenticateToken, validateToken);
router.get('/users', authenticateToken, getUsers);

export default router;
