import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, NextFunction } from 'express';
import { createProtectMiddleware, type AuthMiddlewareDependencies } from './authMiddleware.ts';

const user = {
  _id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'avatar.png',
  bio: 'Writer',
  password: 'must-not-be-exposed',
};

const dependencies = (overrides: Partial<AuthMiddlewareDependencies> = {}): AuthMiddlewareDependencies => ({
  verifyToken: () => ({ id: 'user-123' }),
  isDbConnected: () => true,
  isInMemoryFallbackActive: () => false,
  findUserById: async () => user,
  findMemoryUserById: async () => null,
  ...overrides,
});

const invoke = async (
  deps: AuthMiddlewareDependencies,
  authorization?: string
) => {
  let statusCode = 200;
  let body: unknown;
  let forwardedError: unknown;
  let nextCalled = false;
  const headers: Record<string, string> = {};
  const req = {
    headers: authorization ? { authorization } : {},
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request & { user?: unknown };
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value;
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;
  const next: NextFunction = (error?: unknown) => {
    if (error) forwardedError = error;
    else nextCalled = true;
  };

  await createProtectMiddleware(deps)(req as any, res, next);
  return { req, statusCode, body, forwardedError, nextCalled, headers };
};

test('rejects a missing Bearer token and prevents caching', async () => {
  const result = await invoke(dependencies());
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
  assert.equal(result.headers['Cache-Control'], 'no-store, private');
  assert.equal(result.headers.Vary, 'Authorization');
});

test('rejects malformed and expired JWTs as unauthorized', async () => {
  for (const name of ['JsonWebTokenError', 'TokenExpiredError']) {
    const error = Object.assign(new Error('token failure'), { name });
    const result = await invoke(dependencies({ verifyToken: () => { throw error; } }), 'Bearer bad-token');
    assert.equal(result.statusCode, 401);
    assert.equal(result.forwardedError, undefined);
  }
});

test('forwards JWT configuration failures instead of misreporting invalid credentials', async () => {
  const error = new Error('JWT_SECRET is not configured');
  const result = await invoke(dependencies({ verifyToken: () => { throw error; } }), 'Bearer valid-shaped-token');
  assert.equal(result.statusCode, 200);
  assert.equal(result.forwardedError, error);
});

test('rejects a decoded token without a non-empty user id', async () => {
  const result = await invoke(dependencies({ verifyToken: () => ({ id: '' }) }), 'Bearer token');
  assert.equal(result.statusCode, 401);
});

test('loads the database user, calls next, and never attaches the password', async () => {
  const result = await invoke(dependencies(), 'Bearer valid-token');
  assert.equal(result.nextCalled, true);
  assert.equal((result.req as any).user.id, 'user-123');
  assert.equal('password' in (result.req as any).user, false);
});

test('returns 401 when the token user no longer exists', async () => {
  const result = await invoke(dependencies({ findUserById: async () => null }), 'Bearer valid-token');
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test('forwards database lookup failures to the centralized error handler', async () => {
  const error = new Error('database unavailable');
  const result = await invoke(dependencies({ findUserById: async () => { throw error; } }), 'Bearer valid-token');
  assert.equal(result.forwardedError, error);
  assert.equal(result.statusCode, 200);
});

test('uses the explicit in-memory fallback when MongoDB is disconnected', async () => {
  const memoryUser = { id: 'memory-1', name: 'Memory User', email: 'memory@example.com' };
  const result = await invoke(dependencies({
    isDbConnected: () => false,
    isInMemoryFallbackActive: () => true,
    findMemoryUserById: async () => memoryUser,
  }), 'Bearer valid-token');
  assert.equal(result.nextCalled, true);
  assert.equal((result.req as any).user.id, 'memory-1');
});

test('returns 503 when neither MongoDB nor the in-memory fallback is available', async () => {
  const result = await invoke(dependencies({
    isDbConnected: () => false,
    isInMemoryFallbackActive: () => false,
  }), 'Bearer valid-token');
  assert.equal(result.statusCode, 503);
  assert.equal(result.nextCalled, false);
});

test('forwards in-memory store failures to the centralized error handler', async () => {
  const error = new Error('memory store failure');
  const result = await invoke(dependencies({
    isDbConnected: () => false,
    isInMemoryFallbackActive: () => true,
    findMemoryUserById: async () => { throw error; },
  }), 'Bearer valid-token');
  assert.equal(result.forwardedError, error);
});
