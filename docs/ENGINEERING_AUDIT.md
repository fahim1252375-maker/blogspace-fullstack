# BlogSpace Engineering Audit

**Audit date:** 14 November 2026  
**Repository:** [fahim1252375-maker/blogspace-fullstack](https://github.com/fahim1252375-maker/blogspace-fullstack)  
**Baseline:** `main` at `1882295c010b0def43d147b1e4b2318d90b98fb0`  
**Scope:** Source structure, API and data paths, authentication, authorization, validation, error handling, tests, GitHub Actions, open pull requests, and the checked-in Render Blueprint.

## Executive summary

BlogSpace is a multi-page publishing application with a Node.js/Express API, TypeScript backend modules, a Vite-built HTML/CSS/JavaScript frontend, and MongoDB persistence through Mongoose. The project already demonstrates useful engineering practices: bcrypt password hashing, JWT-protected author routes, server-side ownership checks, explicit production database startup requirements, a health endpoint, a focused CI workflow, and automated tests.

The next improvement should be a controlled security and reliability pass—not a framework rewrite. The most important immediate issue is in the current authentication middleware: failures during user lookup are caught in the same block as token verification and returned as HTTP 401. A database or in-memory store failure is not an invalid credential and should reach the central error handler.

Two pull requests are open against `main`. PR #3 aims to correct that middleware behavior but currently has a broken Bearer-token regular expression and a failing test run. PR #4 contains a much broader Phase 1 security and validation pass; its recorded CI run passes, but its own checklist still calls for runtime smoke tests and CSP review. These changes should be reviewed and integrated deliberately rather than merged together without reconciliation.

## Architecture inspected

| Area | Current implementation |
|---|---|
| Runtime | Node.js, Express 4, TypeScript |
| Frontend | Five-page HTML/CSS/vanilla JavaScript application, built with Vite |
| API | `/api/auth` and `/api/blogs` REST routes |
| Persistence | MongoDB through Mongoose |
| Authentication | JWT bearer tokens; bcryptjs password hashing |
| Authorization | Protected author routes and server-side ownership checks |
| Local fallback | Explicit opt-in in-memory store for development |
| Hosting configuration | Render Web Service Blueprint in `render.yaml` |
| CI | GitHub Actions: install, TypeScript check, tests, Vite build |

The Vite configuration declares five page entry points: home, login, register, dashboard, and create/edit story. The Express server uses Vite middleware in development and serves the built `dist` directory in production.

## Strengths to preserve

- Passwords are hashed in the Mongoose user model with bcryptjs; password fields are excluded from ordinary queries.
- Blog create, update, and delete routes require authentication.
- Update and delete operations check that the authenticated user owns the requested story on both MongoDB and the explicit in-memory development path.
- The public feed queries published posts, while the author dashboard uses a separate authenticated `/api/blogs/mine` route.
- MongoDB is required for production startup; the in-memory fallback is explicitly opt-in and disabled in production.
- The health endpoint distinguishes healthy, degraded development fallback, and unavailable storage states.
- CI uses `npm ci` and runs type checking, tests, and the production frontend build.
- The repository includes a security policy, contribution guide, and pull-request checklist.

## Findings and priorities

### P0 — Authentication middleware misclassifies infrastructure failures

**File:** `backend/middleware/authMiddleware.ts`

The current `protect` middleware verifies the JWT and loads the user inside one `try` block. Its `catch` returns 401 for every error in that block. This means a MongoDB query failure or in-memory store failure can be reported as an invalid or expired token. Clients may then clear a valid session and ask the user to sign in again when the actual problem is server-side availability.

**Recommended change:** Separate token parsing/verification from user lookup. Map malformed and expired JWT errors to 401; return 401 when the token subject has no user; forward datastore and configuration failures to the central error handler. Keep authenticated responses non-cacheable.

### P0 — Open PR #3 must be corrected before it can be considered

[PR #3 — fix(auth): preserve server errors during token authentication](https://github.com/fahim1252375-maker/blogspace-fullstack/pull/3) is open and mergeable, but its current branch contains:

```ts
authorization.match(/^Bearer\s+(.+)$/i)
```

That pattern matches a literal backslash followed by `s`, not the whitespace separator in an ordinary `Authorization: Bearer <token>` header. The intended pattern is:

```ts
authorization.match(/^Bearer\s+(.+)$/i)
```

The recorded GitHub Actions run for PR #3 completed installation and TypeScript checking, then failed during tests: **17 passed, 6 failed**. The six failures are in the new authentication middleware tests that exercise valid tokens, datastore failures, in-memory fallback, and unavailable storage. The frontend build was skipped after the test step failed.

**Recommendation:** Do not merge PR #3 in its current state. Correct the matcher, rerun the complete workflow, and retain the separation between token errors and datastore errors.

### P1 — Request validation is incomplete on `main`

**Files:** `backend/controllers/blogController.ts`, `backend/models/Blog.ts`

The current create controller checks only that title and content are present before accessing string methods. The update controller conditionally assigns fields but does not consistently validate field types, lengths, URL schemes, or status values before writing. Mongoose covers some fields, but the explicit in-memory path does not apply the same schema validation.

This leaves API behavior inconsistent between MongoDB and the development fallback, and malformed or oversized values can reach controller/model code.

**Recommended change:** Use a shared, typed request parser for both create and update. Validate object shape, text types, title/description/content/category limits, cover-image URL policy, and the `published | draft` status enum before either persistence path. Keep the Mongoose schema constraints aligned with the parser.

### P1 — Production error responses can expose internal messages

**File:** `backend/middleware/errorMiddleware.ts`

The current error handler omits stack traces outside development, but still returns `err.message` for unrecognized 500-level errors. Internal exception messages can contain infrastructure details that are not appropriate for public responses.

**Recommended change:** Return a generic message for 5xx responses in production; retain detailed logs server-side. Normalize malformed JSON and oversized-body errors into safe 400/413 responses.

### P1 — JWT configuration should enforce an explicit algorithm and key policy

**File:** `backend/config/jwt.ts`

Signing and verification currently use the library defaults without explicitly pinning the accepted algorithm. Startup checks that `JWT_SECRET` is present in production but do not enforce a minimum length or reject common placeholder values.

**Recommended change:** Pin signing and verification to HS256, require a sufficiently strong secret (the Phase 1 proposal uses 32 characters minimum), validate the decoded payload shape, and fail startup when the secret is missing or a known placeholder. Do not rotate a production secret casually: doing so invalidates current sessions.

### P1 — Content Security Policy needs a staged rollout

**Files:** `server.ts`, `index.html`, `login.html`, `register.html`, `dashboard.html`, `create-blog.html`, frontend image-rendering modules

The current frontend uses inline image `onerror` attributes. A strict CSP that blocks inline script attributes would affect those handlers. The Phase 1 draft replaces the handlers with a delegated fallback listener and adds Helmet headers. It deliberately keeps CSP report-only because the five page templates still contain inline module bootstrap scripts.

**Recommended change:** Keep report-only mode while migrating every inline bootstrap to an external module. Inspect browser CSP reports, correct the remaining violations, then enable enforcement in a separate release. Do not enable `CSP_ENFORCE=true` before that work is complete.

### P1 — Rate limiting is process-local

**File:** `backend/middleware/rateLimit.ts`

The custom limiter stores client buckets in a process-local `Map`. This is appropriate for the current single-instance learning deployment, but counters are not shared between multiple instances and reset when the process restarts.

**Recommended change:** Keep the single-process constraint explicit for a single-instance service. Before scaling horizontally, move the limiter to a shared Redis-compatible store and test behavior across instances.

### P2 — List endpoints need bounded pagination

**File:** `backend/controllers/blogController.ts`

The public and author feed queries return the matching collection without pagination. As the collection grows, every request can return an increasingly large payload and require larger database reads.

**Recommended change:** Add bounded `limit` and cursor/page parameters, stable sorting, and appropriate indexes. Keep public and author queries isolated by publication status and owner.

### P2 — View counting should use an atomic update

**File:** `backend/controllers/blogController.ts`

Reading a published story currently loads the document, increments `views`, then saves the whole document. Concurrent reads can overwrite increments.

**Recommended change:** Use an atomic MongoDB increment (for example, `$inc`) and avoid rewriting unrelated story fields on a read.

### P2 — TypeScript strictness and API contracts can improve

**Files:** `tsconfig.json`, controllers, middleware, route modules

The project runs TypeScript checking, but `strict` is not enabled and route modules use `as any` casts around middleware/controller functions.

**Recommended change:** Introduce strict compiler options incrementally, define typed request/response contracts, remove middleware casts, and document API request/response shapes in an OpenAPI document.

### P2 — Runtime dependency intent should be clarified

**File:** `package.json`

The production start script executes `tsx server.ts`, while `tsx` is listed under `devDependencies`. The checked-in Render build command explicitly installs development dependencies, so the current Blueprint accounts for this. The runtime contract is nevertheless coupled to that install behavior.

**Recommended change:** Either declare `tsx` as a runtime dependency or compile the server to JavaScript and start it with Node. Keep the Render install/build/start commands aligned with the chosen approach.

## Open pull requests and CI

| PR | Status | Scope | Recorded CI |
|---|---|---|---|
| [#3 — auth error handling](https://github.com/fahim1252375-maker/blogspace-fullstack/pull/3) | Open; mergeable | Authentication middleware refactor, new middleware tests, Dependabot config | Failed: type-check passed; tests 17 passed / 6 failed; build skipped |
| [#4 — Phase 1 hardening](https://github.com/fahim1252375-maker/blogspace-fullstack/pull/4) | Open; draft; mergeable | Helmet/CSP, JWT config, proxy config, rate limits, request validation, error handling, health endpoint, UI image fallback, tests | Passed: type-check, 35 tests passed, Vite build passed |

PR #4's successful workflow is useful evidence for its source branch, but its PR description still lists the following runtime checks as required: start the actual server, exercise health/login-rate-limit/invalid-payload/missing-secret behavior, and inspect production CSP report-only messages. Its description also notes that CSP should not be enforced while inline page bootstraps remain.

PR #4 does not include the authentication middleware correction attempted by PR #3. The two branches therefore need a deliberate integration/rebase plan; neither should be merged blindly.

## Render configuration reviewed

The checked-in `render.yaml` describes a free Render Web Service named `blogspace-fullstack`, with:

- Build: `npm install --include=dev && npm run build`
- Start: `npm start`
- Health check: `/api/health`
- `NODE_ENV=production`
- `TRUST_PROXY_HOPS=1`
- `MONGODB_URI` supplied as a secret environment value
- `JWT_SECRET` generated by the Blueprint

This is the repository's declared service configuration. The connected Render service, latest deploy result, live health response, and runtime logs still need a direct service-level review before changing hosting settings or describing deployment health.

## Verification performed for this audit

- Read the repository README, package manifest, TypeScript/Vite configuration, Render Blueprint, CI workflow, Express entry point, database configuration, API routes, controllers, auth middleware, rate limiter, error middleware, models, frontend auth/storage/rendering modules, and key tests.
- Read the repository's contribution guide, security policy, and pull-request template.
- Inspected both open pull requests, their changed-file lists, commit diffs, CI job steps, and available workflow logs.
- Confirmed PR #3's test failures and the literal-backslash Bearer matcher.
- Confirmed PR #4's workflow passed TypeScript checking, all 35 tests, and the Vite build.
- No application source code, deployment configuration, secrets, or `main` branch files were changed as part of this audit.
- Render service-level status and live runtime smoke tests remain the next verification step.

## Recommended release gates

Before a security-hardening release is merged or deployed:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. Start the production-mode server with a dedicated test database and run API smoke tests.
6. Verify registration/login, missing/malformed/expired tokens, database failure behavior, ownership denial, create/update/delete, draft visibility, body validation, rate-limit behavior, and health status.
7. Review CSP reports for all five pages before enforcement.
8. Check the Render service's actual deploy status, health check, environment configuration names, and recent logs without exposing secret values.
9. Complete desktop/mobile keyboard and responsive UI checks.
