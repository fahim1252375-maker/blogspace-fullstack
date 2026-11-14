import jwt from "jsonwebtoken";
import { checkJwtSecret } from "./securityConfig.ts";

const JWT_ALGORITHM = "HS256" as const;

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  const result = checkJwtSecret(secret, process.env.NODE_ENV === "production");

  if (!result.ok && result.fatal) {
    throw new Error("[BlogSpace Security] FATAL: " + result.message);
  }
  if (!secret || !secret.trim()) {
    throw new Error("[BlogSpace Security] FATAL: JWT_SECRET is missing.");
  }

  return secret.trim();
};

/** Called once by server.ts during startup. */
export const assertJwtConfig = (): void => {
  const result = checkJwtSecret(
    process.env.JWT_SECRET,
    process.env.NODE_ENV === "production"
  );

  if (result.ok) return;
  if (result.fatal) {
    throw new Error("[BlogSpace Security] FATAL: " + result.message);
  }
  console.warn("[BlogSpace Security] WARNING: " + result.message);
};

export const generateToken = (id: string): string => {
  if (typeof id !== "string" || !id.trim()) {
    throw new TypeError("A non-empty user id is required to generate a token.");
  }

  return jwt.sign({ id }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): { id: string } => {
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: [JWT_ALGORITHM],
  });

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    Array.isArray(decoded) ||
    typeof decoded.id !== "string" ||
    !decoded.id.trim()
  ) {
    throw new Error("Invalid token payload");
  }

  return { id: decoded.id };
};
