import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Masks credentials in MongoDB URI to prevent credential leakage in logs
 */
export const maskMongoUri = (uri?: string): string => {
  if (!uri) return 'NOT_CONFIGURED';
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/, '$1***:***@');
  } catch {
    return 'mongodb://***:***@...';
  }
};

/**
 * Returns true only if MongoDB is actively connected (readyState === 1)
 */
export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Checks whether In-Memory fallback store is explicitly opted into via environment variable.
 * STRICT: Forbidden in production. Only active if ALLOW_IN_MEMORY_FALLBACK === 'true'.
 */
export const isInMemoryFallbackActive = (): boolean => {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ALLOW_IN_MEMORY_FALLBACK === 'true' && !isDbConnected();
};

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Returns true on successful connection, false otherwise.
 * In production, fails startup immediately if connection cannot be established.
 */
export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || !mongoUri.trim()) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '\x1b[31m%s\x1b[0m',
        '[BlogSpace DB] FATAL: MONGODB_URI is not configured in production environment. Application startup aborted.'
      );
      process.exit(1);
    }

    if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '[BlogSpace DB] NOTICE: Running with EXPLICIT OPT-IN in-memory fallback store (ALLOW_IN_MEMORY_FALLBACK=true). Real MongoDB Atlas is NOT connected.'
      );
      return false;
    }

    console.error(
      '\x1b[31m%s\x1b[0m',
      '[BlogSpace DB] ERROR: MONGODB_URI is missing from environment. Real MongoDB Atlas connection is required.'
    );
    return false;
  }

  try {
    mongoose.set('bufferCommands', false);

    console.log(`[BlogSpace DB] Attempting connection to: ${maskMongoUri(mongoUri)}`);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      dbName: 'blogspace',
    });

    console.log(
      '\x1b[32m%s\x1b[0m',
      `[BlogSpace DB] MongoDB Connected Successfully: ${maskMongoUri(mongoUri)} (Host: ${conn.connection.host})`
    );
    return true;
  } catch (error: any) {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect error
    }

    const masked = maskMongoUri(mongoUri);
    const errMsg = error?.message || String(error);
    let diagnosis = 'General connection failure';
    if (errMsg.includes('whitelist') || errMsg.includes('alert number 80') || errMsg.includes('ETIMEDOUT') || errMsg.includes('ServerSelectionError')) {
      diagnosis = 'Atlas Network Access (IP Access List: current IP not whitelisted, 0.0.0.0/0 pending, or cluster is paused)';
    } else if (errMsg.includes('Authentication failed') || errMsg.includes('auth failed')) {
      diagnosis = 'Atlas Database Access (Invalid credentials: username/password incorrect or characters not URL-encoded)';
    } else if (errMsg.includes('ENOTFOUND') || errMsg.includes('querySrv')) {
      diagnosis = 'DNS / SRV Resolution (Cluster host in MONGODB_URI cannot be resolved)';
    }

    console.error(
      '\x1b[31m%s\x1b[0m',
      `[BlogSpace DB] ERROR: Failed to connect to MongoDB (${masked}). Probable cause: ${diagnosis}. Error details: ${errMsg}`
    );

    if (process.env.NODE_ENV === 'production') {
      console.error(
        '\x1b[31m%s\x1b[0m',
        `[BlogSpace DB] FATAL: Production MongoDB connection failure. Aborting application startup.`
      );
      process.exit(1);
    }

    if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        `[BlogSpace DB] NOTICE: Running with explicit opt-in in-memory fallback (ALLOW_IN_MEMORY_FALLBACK=true).`
      );
    }

    return false;
  }
};

// Event listeners
mongoose.connection.on('connected', () => {
  console.log('\x1b[32m%s\x1b[0m', '[BlogSpace DB] MongoDB event: connected.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[BlogSpace DB] MongoDB event: disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('\x1b[32m%s\x1b[0m', '[BlogSpace DB] MongoDB event: reconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[BlogSpace DB] MongoDB runtime error event:', err.message);
});
