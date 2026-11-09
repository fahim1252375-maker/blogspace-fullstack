/**
 * Pure security configuration helpers. No Express or process.env dependency.
 */
export const MIN_JWT_SECRET_LENGTH = 32;
export const MAX_TRUSTED_PROXY_HOPS = 5;

const PLACEHOLDER_SECRETS = new Set([
  "secret", "changeme", "change-me", "your-secret",
  "your_jwt_secret", "jwt_secret", "password",
]);
const HOW_TO_GENERATE = "Generate one with: openssl rand -base64 48";

export type SecretCheck =
  | { ok: true }
  | { ok: false; fatal: boolean; message: string };

export function checkJwtSecret(
  secret: string | undefined,
  isProduction: boolean
): SecretCheck {
  const value = (secret ?? "").trim();

  if (!value) {
    return {
      ok: false,
      fatal: true,
      message: "JWT_SECRET is missing. Configure it in the environment. " + HOW_TO_GENERATE,
    };
  }

  if (PLACEHOLDER_SECRETS.has(value.toLowerCase())) {
    return {
      ok: false,
      fatal: true,
      message: "JWT_SECRET is a known placeholder. " + HOW_TO_GENERATE,
    };
  }

  if (value.length < MIN_JWT_SECRET_LENGTH) {
    return {
      ok: false,
      fatal: isProduction,
      message: "JWT_SECRET is too short (" + value.length + " characters; minimum " +
        MIN_JWT_SECRET_LENGTH + "). " + HOW_TO_GENERATE,
    };
  }

  return { ok: true };
}

/**
 * Supports the existing TRUST_PROXY_HOPS variable and the TRUST_PROXY alias.
 * Proxy trust is deliberately bounded to avoid unsafe "trust all" configuration.
 */
export function parseTrustProxy(
  raw: string | undefined,
  runningOnRender: boolean
): number | false {
  const value = (raw ?? "").trim();

  if (value === "") return runningOnRender ? 1 : false;
  if (!/^\d+$/.test(value)) {
    throw new Error("TRUST_PROXY_HOPS must be a whole number from 0 to " +
      MAX_TRUSTED_PROXY_HOPS + ".");
  }

  const hops = Number(value);
  if (!Number.isSafeInteger(hops) || hops > MAX_TRUSTED_PROXY_HOPS) {
    throw new Error("TRUST_PROXY_HOPS must be between 0 and " +
      MAX_TRUSTED_PROXY_HOPS + ".");
  }

  return hops === 0 ? false : hops;
}
