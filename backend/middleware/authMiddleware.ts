import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.ts';
import { isDbConnected, isInMemoryFallbackActive } from '../config/db.ts';
import { inMemoryStore } from '../config/inMemoryStore.ts';
import { verifyToken } from '../config/jwt.ts';

// Extend Express Request interface to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    _id?: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
}

const unauthorized = (res: Response, message: string): void => {
  res.status(401).json({ success: false, message });
};

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Authenticated responses contain account-specific data and must never be cached.
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Authorization');

  const authorization = req.headers.authorization || '';
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const token = bearerMatch?.[1].trim();

  if (!token) {
    unauthorized(
      res,
      'Not authorized, no Bearer token provided in Authorization header'
    );
    return;
  }

  // Only JWT validation failures are authentication failures. Configuration
  // errors (for example a missing JWT_SECRET) must reach the server error handler.
  let decoded: { id: string };
  try {
    decoded = verifyToken(token);
    if (!decoded || typeof decoded.id !== 'string' || !decoded.id) {
      unauthorized(res, 'Not authorized, invalid or expired authentication token');
      return;
    }
  } catch (error: unknown) {
    const errorName =
      error && typeof error === 'object' && 'name' in error
        ? String(error.name)
        : '';

    if (errorName === 'JsonWebTokenError' || errorName === 'TokenExpiredError') {
      unauthorized(res, 'Not authorized, invalid or expired authentication token');
      return;
    }

    next(error);
    return;
  }

  // Database/store failures are operational errors, not invalid credentials.
  // Forward them to the centralized Express error handler (normally HTTP 500).
  try {
    if (isDbConnected()) {
      const foundUser = await User.findById(decoded.id).select('-password');
      if (!foundUser) {
        unauthorized(res, 'User belonging to this token no longer exists');
        return;
      }

      const userId = String(foundUser._id);
      req.user = {
        id: userId,
        _id: userId,
        name: foundUser.name,
        email: foundUser.email,
        avatar: foundUser.avatar,
        bio: foundUser.bio,
      };
    } else if (isInMemoryFallbackActive()) {
      const memoryUser = await inMemoryStore.findUserById(decoded.id);
      if (!memoryUser) {
        unauthorized(res, 'User belonging to this token no longer exists');
        return;
      }

      req.user = {
        id: memoryUser.id,
        _id: memoryUser.id,
        name: memoryUser.name,
        email: memoryUser.email,
        avatar: memoryUser.avatar,
        bio: memoryUser.bio,
      };
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas connection is required.',
      });
      return;
    }

    next();
  } catch (error: unknown) {
    next(error);
  }
};
