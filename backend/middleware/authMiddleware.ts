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

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Not authorized, token missing in Authorization header',
        });
        return;
      }

      // Verify token with centralized JWT utility
      const decoded = verifyToken(token);

      if (isDbConnected()) {
        const foundUser = await User.findById(decoded.id).select('-password');
        if (!foundUser) {
          res.status(401).json({
            success: false,
            message: 'User belonging to this token no longer exists in database',
          });
          return;
        }
        req.user = {
          id: (foundUser._id as any).toString(),
          _id: (foundUser._id as any).toString(),
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar,
          bio: foundUser.bio,
        };
      } else if (isInMemoryFallbackActive()) {
        const memoryUser = await inMemoryStore.findUserById(decoded.id);
        if (!memoryUser) {
          res.status(401).json({
            success: false,
            message: 'User belonging to this token no longer exists in store',
          });
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
    } catch (error: any) {
      console.error('[BlogSpace Auth] Token verification error:', error?.message);
      res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired authentication token',
        error: error?.message,
      });
      return;
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no Bearer token provided in Authorization header',
    });
    return;
  }
};
