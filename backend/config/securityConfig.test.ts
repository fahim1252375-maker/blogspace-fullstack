import test from "node:test";
import assert from "node:assert/strict";
import {
  checkJwtSecret,
  parseTrustProxy,
  MIN_JWT_SECRET_LENGTH,
} from "./securityConfig.ts";

const goodSecret = "x".repeat(MIN_JWT_SECRET_LENGTH);

test("accepts a long secret in production and development", () => {
  assert.deepEqual(checkJwtSecret(goodSecret, true), { ok: true });
  assert.deepEqual(checkJwtSecret(goodSecret, false), { ok: true });
});

test("missing and blank secrets are fatal in every environment", () => {
  for (const secret of [undefined, "", "   "]) {
    for (const production of [true, false]) {
      const result = checkJwtSecret(secret, production);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.fatal, true);
    }
  }
});

test("known placeholder secrets are fatal", () => {
  for (const secret of ["secret", "ChangeMe", "your_jwt_secret", "password"]) {
    const result = checkJwtSecret(secret, false);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.fatal, true);
  }
});

test("short secrets fail in production and warn in development", () => {
  const shortSecret = "a".repeat(MIN_JWT_SECRET_LENGTH - 1);
  const production = checkJwtSecret(shortSecret, true);
  const development = checkJwtSecret(shortSecret, false);
  assert.equal(production.ok, false);
  assert.equal(development.ok, false);
  if (!production.ok) assert.equal(production.fatal, true);
  if (!development.ok) assert.equal(development.fatal, false);
});

test("error messages never include the provided secret", () => {
  const secret = "this-secret-is-too-short";
  const result = checkJwtSecret(secret, true);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.message.includes(secret), false);
});

test("proxy defaults trust one Render hop and none elsewhere", () => {
  assert.equal(parseTrustProxy(undefined, true), 1);
  assert.equal(parseTrustProxy("", true), 1);
  assert.equal(parseTrustProxy(undefined, false), false);
  assert.equal(parseTrustProxy("  ", false), false);
});

test("explicit proxy hop count overrides environment defaults", () => {
  assert.equal(parseTrustProxy("2", false), 2);
  assert.equal(parseTrustProxy("1", true), 1);
  assert.equal(parseTrustProxy("0", true), false);
});

test("proxy parser rejects non-integers and unsafe hop counts", () => {
  for (const value of ["true", "yes", "-1", "1.5", "127.0.0.1", "loopback", "6"]) {
    assert.throws(() => parseTrustProxy(value, true), /TRUST_PROXY_HOPS/);
  }
});
