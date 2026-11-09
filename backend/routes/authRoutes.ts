import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.ts';
import { protect } from '../middleware/authMiddleware.ts';
import { createRateLimiter } from '../middleware/rateLimit.ts';

const router = Router();

const registrationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts from this IP. Please try again later.',
});

const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP. Please try again later.',
});

router.post('/register', registrationRateLimit, registerUser);
router.post('/login', loginRateLimit, loginUser);
router.get('/me', protect as any, getMe as any);

export default router;
