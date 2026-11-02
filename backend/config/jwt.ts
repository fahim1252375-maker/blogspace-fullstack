import jwt from 'jsonwebtoken';

/**
 * Retrieves the JWT Secret from environment variables.
 * In production, it strictly throws an error if JWT_SECRET is not set.
 * In development, it warns and provides a development-only secret.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error(
      '[BlogSpace Security] FATAL: JWT_SECRET environment variable is missing! Configure a secure JWT_SECRET in environment variables.'
    );
  }
  return secret;
};

/**
 * Signs a JWT token with user id payload and 7-day expiration.
 */
export const generateToken = (id: string): string => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '7d',
  });
};

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export const verifyToken = (token: string): { id: string } => {
  return jwt.verify(token, getJwtSecret()) as { id: string };
};
