import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import { isDbConnected, isInMemoryFallbackActive } from '../config/db.ts';
import { inMemoryStore } from '../config/inMemoryStore.ts';
import { generateToken } from '../config/jwt.ts';
import { AuthRequest } from '../middleware/authMiddleware.ts';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) {
      res.status(400).json({
        success: false,
        message: 'Name is required and must be 60 characters or fewer',
      });
      return;
    }

    if (typeof email !== 'string' || !email.trim() || email.trim().length > 254) {
      res.status(400).json({
        success: false,
        message: 'A valid email address of 254 characters or fewer is required',
      });
      return;
    }

    if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters and no more than 72 UTF-8 bytes',
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check database state
    if (isDbConnected()) {
      // Direct MongoDB Mongoose execution
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        res.status(400).json({
          success: false,
          message: 'An account with this email address already exists',
        });
        return;
      }

      // Pre-save hook in User model hashes password with bcrypt
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

      const token = generateToken((user._id as any).toString());

      res.status(201).json({
        success: true,
        message: 'User registered successfully in MongoDB',
        token,
        user: {
          id: (user._id as any).toString(),
          _id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      const existing = await inMemoryStore.findUserByEmail(normalizedEmail);
      if (existing) {
        res.status(400).json({
          success: false,
          message: 'An account with this email address already exists',
        });
        return;
      }

      const user = await inMemoryStore.createUser({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully (In-memory storage active - opt-in dev only)',
        token,
        user: {
          id: user.id,
          _id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error: any) {
    // A unique-index collision can still occur when two registrations race.
    if (error?.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
      return;
    }
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address and password',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      // Direct MongoDB Mongoose execution (explicitly select password)
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const token = generateToken((user._id as any).toString());

      res.status(200).json({
        success: true,
        message: 'Login successful via MongoDB',
        token,
        user: {
          id: (user._id as any).toString(),
          _id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      const user = await inMemoryStore.findUserByEmail(normalizedEmail);
      if (!user || !user.password) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const token = generateToken(user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful (In-memory storage active - opt-in dev only)',
        token,
        user: {
          id: user.id,
          _id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
