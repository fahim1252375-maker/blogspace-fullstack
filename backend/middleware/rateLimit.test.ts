import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { createRateLimiter } from './rateLimit.ts';

const runRequest = (middleware: ReturnType<typeof createRateLimiter>, ip: string) => {
  let nextCalled = false;
  let statusCode = 200;
  let responseBody: unknown;
  const headers: Record<string, string> = {};

  const req = { ip } as Request;
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = String(value);
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  } as unknown as Response;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { nextCalled, statusCode, responseBody, headers };
};

test('rate limiter allows requests up to the configured maximum', () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 2,
    message: 'Too many requests',
  });

  const first = runRequest(limiter, '198.51.100.10');
  const second = runRequest(limiter, '198.51.100.10');

  assert.equal(first.nextCalled, true);
  assert.equal(second.nextCalled, true);
  assert.equal(second.headers['RateLimit-Remaining'], '0');
});

test('rate limiter rejects requests over the maximum and sets Retry-After', () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 1,
    message: 'Slow down',
  });

  runRequest(limiter, '198.51.100.11');
  const blocked = runRequest(limiter, '198.51.100.11');

  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers['Retry-After'] !== undefined, true);
  assert.deepEqual(blocked.responseBody, {
    success: false,
    message: 'Slow down',
    retryAfterSeconds: Number(blocked.headers['Retry-After']),
  });
});

test('rate limits are isolated per client IP', () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 1,
    message: 'Too many requests',
  });

  runRequest(limiter, '198.51.100.12');
  const otherClient = runRequest(limiter, '198.51.100.13');

  assert.equal(otherClient.nextCalled, true);
  assert.equal(otherClient.statusCode, 200);
});

test('rate limiter rejects invalid configuration', () => {
  assert.throws(
    () => createRateLimiter({ windowMs: 0, max: 1, message: 'invalid' }),
    /positive windowMs/
  );
  assert.throws(
    () => createRateLimiter({ windowMs: 1000, max: 0, message: 'invalid' }),
    /positive windowMs/
  );
});
