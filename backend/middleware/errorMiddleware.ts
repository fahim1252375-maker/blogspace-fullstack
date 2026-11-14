import { Request, Response, NextFunction } from "express";

type AppError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message?: string }>;
};

export const notFound = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404);
  next(new Error("Resource not found"));
};

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = Number(err.statusCode ?? err.status ?? res.statusCode ?? 500);
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  let message = err.message || "Internal Server Error";

  if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON";
  } else if (err.name === "CastError" && (err as any).kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = "A record with this " + field + " already exists";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((value) => value.message || "Invalid value")
      .join(", ");
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired; please log in again";
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (statusCode >= 500 && isProduction) {
    message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
