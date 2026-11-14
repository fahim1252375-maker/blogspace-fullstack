import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, isDbConnected, isInMemoryFallbackActive } from "./backend/config/db.ts";
import { assertJwtConfig } from "./backend/config/jwt.ts";
import { parseTrustProxy } from "./backend/config/securityConfig.ts";
import authRoutes from "./backend/routes/authRoutes.ts";
import blogRoutes from "./backend/routes/blogRoutes.ts";
import { notFound, errorHandler } from "./backend/middleware/errorMiddleware.ts";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

try {
  assertJwtConfig();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

if (isProduction && !process.env.MONGODB_URI?.trim()) {
  console.error("[BlogSpace] FATAL: MONGODB_URI is required in production.");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

try {
  const proxySetting = process.env.TRUST_PROXY_HOPS ?? process.env.TRUST_PROXY;
  app.set("trust proxy", parseTrustProxy(proxySetting, process.env.RENDER === 'true'));
} catch (error) {
  console.error("[BlogSpace] FATAL: " + (error as Error).message);
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error("[BlogSpace] FATAL: PORT must be an integer between 1 and 65535.");
  process.exit(1);
}
const HOST = "0.0.0.0";

const rawFrontendUrls = process.env.FRONTEND_URL || "http://localhost:3000";
const configuredOrigins = [
  ...rawFrontendUrls.split(","),
  ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
];
const allowedOrigins = configuredOrigins
  .map((value) => {
    try {
      return new URL(value.trim()).origin;
    } catch {
      console.warn("[BlogSpace CORS] Ignoring an invalid FRONTEND_URL origin.");
      return "";
    }
  })
  .filter(Boolean);

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  scriptSrcAttr: ["'none'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
};

app.disable("x-powered-by");
app.use(
  helmet({
    strictTransportSecurity: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: false,
          reportOnly: process.env.CSP_ENFORCE !== "true",
          directives: cspDirectives,
        }
      : false,
  })
);

// Reject unapproved browser origins without reflecting the supplied Origin header.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const requestOrigin = req.get("host") ? req.protocol + "://" + req.get("host") : "";

  if (!origin || allowedOrigins.includes(origin) || origin === requestOrigin) {
    return next();
  }

  console.warn("[BlogSpace CORS] Rejected origin:", JSON.stringify(origin));
  res.status(403).json({
    success: false,
    message: "Access denied: this origin is not authorized.",
  });
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.set("query parser", "simple");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

if (!isProduction) {
  app.use((req, _res, next) => {
    if (req.path.startsWith("/api")) {
      console.log("[API " + req.method + "] " + req.path);
    }
    next();
  });
}

// Public health endpoint: return only operational status and timestamp.
app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const timestamp = new Date().toISOString();

  if (isDbConnected()) {
    res.status(200).json({ success: true, status: "healthy", timestamp });
    return;
  }

  if (isInMemoryFallbackActive()) {
    res.status(200).json({
      success: true,
      status: "degraded_in_memory_fallback",
      timestamp,
    });
    return;
  }

  res.status(503).json({ success: false, status: "unhealthy", timestamp });
});

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

async function startServer(): Promise<void> {
  console.log("[BlogSpace] Initializing server and connecting to database...");
  const isConnected = await connectDB();

  if (!isConnected && isProduction) {
    console.error("[BlogSpace] FATAL: MongoDB connection failed in production.");
    process.exit(1);
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "mpa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, HOST, () => {
    console.log("[BlogSpace] Server listening on port " + PORT);
    console.log("[BlogSpace] Database: " +
      (isDbConnected() ? "MongoDB Connected" :
        isInMemoryFallbackActive() ? "In-Memory (Opt-in)" : "Disconnected"));
    console.log("[BlogSpace] Health endpoint: /api/health");
  });
}

startServer().catch((error) => {
  console.error("[BlogSpace] Startup fatal error:", error);
  process.exit(1);
});
