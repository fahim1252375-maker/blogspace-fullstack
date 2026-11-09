import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isDbConnected, isInMemoryFallbackActive } from './backend/config/db.ts';
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

// Trust only the explicitly configured number of reverse-proxy hops.
// Set TRUST_PROXY_HOPS=1 when deployed behind one trusted proxy; keep 0 locally.
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) {
  throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
}
app.set('trust proxy', trustProxyHops);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

// Basic Security Headers (Equivalent to lightweight Helmet)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Strict CORS Allow-List Configuration
const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  ...rawFrontendUrls.split(',').map((url) => url.trim()).filter(Boolean),
  // Render provides this URL automatically for deployed web services.
  ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
];

// CORS Origin Interceptor: allow configured frontends and same-origin requests.
// Same-origin support is important when the frontend and API are served by this
// single Express service (the recommended production deployment for BlogSpace).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const requestProtocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)
    ?.split(',')[0]
    ?.trim() || req.protocol;
  const requestOrigin = req.headers.host ? `${requestProtocol}://${req.headers.host}` : '';

  if (!origin || allowedOrigins.includes(origin) || origin === requestOrigin) {
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

// Health Check Endpoint — expose operational status only, never database host or URI details.
app.get('/api/health', (_req, res) => {
  const dbConnected = isDbConnected();
  const fallbackActive = isInMemoryFallbackActive();

  if (dbConnected) {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: { connected: true },
    });
    return;
  }

  if (fallbackActive) {
    res.status(200).json({
      success: true,
      status: 'degraded_in_memory_fallback',
      timestamp: new Date().toISOString(),
      database: { connected: false },
      storage: 'in-memory-development-only',
    });
    return;
  }

  res.status(503).json({
    success: false,
    status: 'unhealthy',
    timestamp: new Date().toISOString(),
    database: { connected: false },
  });
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
