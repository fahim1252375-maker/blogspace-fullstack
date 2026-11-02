import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.ts';
import { protect } from '../middleware/authMiddleware.ts';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect as any, getMe as any);

export default router;
