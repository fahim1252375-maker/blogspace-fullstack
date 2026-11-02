import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { connectDB, isDbConnected, isInMemoryFallbackActive, maskMongoUri } from './backend/config/db.ts';
import authRoutes from './backend/routes/authRoutes.ts';
import blogRoutes from './backend/routes/blogRoutes.ts';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.ts';

// 1. Load environment variables before doing anything else
dotenv.config();

// 2. Strict Security & Environment Guard
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
  console.error('[BlogSpace Security] FATAL: JWT_SECRET environment variable is missing. Set a secure secret in environment panel.');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
  console.error('[BlogSpace] FATAL: MONGODB_URI environment variable is required in production.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

// Basic Security Headers (Equivalent to lightweight Helmet)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Strict CORS Allow-List Configuration
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawFrontendUrls
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

// CORS Origin Interceptor: Returns clean 403 JSON response for blocked origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    return next();
  }
  res.status(403).json({
    success: false,
    message: `[BlogSpace CORS] Access denied: origin '${origin}' is not authorized in FRONTEND_URL allow-list.`,
  });
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });
}

// Health Check Endpoint — Reports truthful database connection state
app.get('/api/health', (_req, res) => {
  const dbConnected = isDbConnected();
  const fallbackActive = isInMemoryFallbackActive();

  if (dbConnected) {
    res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'BlogSpace API Gateway is healthy & connected to MongoDB Atlas',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        provider: 'MongoDB Atlas',
        host: mongoose.connection.host || 'connected',
        readyState: mongoose.connection.readyState,
      },
    });
  } else if (fallbackActive) {
    res.status(200).json({
      success: true,
      status: 'degraded_in_memory_fallback',
      message: 'BlogSpace API is running with explicit OPT-IN in-memory fallback (development mode only)',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: false,
        provider: 'In-Memory Store (ALLOW_IN_MEMORY_FALLBACK=true)',
        readyState: mongoose.connection.readyState,
      },
    });
  } else {
    // Unhealthy when MongoDB is required and not connected
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'BlogSpace API is unhealthy: MongoDB is disconnected and required.',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: false,
        provider: 'none',
        readyState: mongoose.connection.readyState,
        config: maskMongoUri(process.env.MONGODB_URI),
      },
    });
  }
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

// Server bootstrap function
async function startServer() {
  console.log('[BlogSpace] Initializing server and connecting to database...');

  // Await MongoDB connection before accepting requests
  const isConnected = await connectDB();

  if (!isConnected && process.env.NODE_ENV === 'production') {
    console.error('[BlogSpace] FATAL: MongoDB connection could not be established in production. Halting startup.');
    process.exit(1);
  }

  // Integration with Vite for MPA (Multi-Page HTML Application)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    // Mount Vite dev server middlewares
    app.use(vite.middlewares);
  } else {
    // In production, serve bundled static files
    app.use(express.static(path.resolve(__dirname, 'dist')));

    // Multi-page fallback routing
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Error Handlers for API endpoints
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, HOST, () => {
    console.log('\x1b[36m%s\x1b[0m', `--------------------------------------------------`);
    console.log('\x1b[32m%s\x1b[0m', `🚀 BlogSpace Full-Stack Server running at: http://${HOST}:${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `   Database:   ${isDbConnected() ? 'MongoDB Connected' : (isInMemoryFallbackActive() ? 'In-Memory (Opt-in)' : 'Disconnected')}`);
    console.log('\x1b[36m%s\x1b[0m', `   REST API:   http://${HOST}:${PORT}/api/blogs`);
    console.log('\x1b[36m%s\x1b[0m', `   Health:     http://${HOST}:${PORT}/api/health`);
    console.log('\x1b[36m%s\x1b[0m', `--------------------------------------------------`);
  });
}

startServer().catch((err) => {
  console.error('[BlogSpace] Startup fatal error:', err);
  process.exit(1);
});
