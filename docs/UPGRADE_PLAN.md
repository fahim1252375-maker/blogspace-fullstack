# BlogSpace Upgrade Plan

**Prepared:** 14 November 2026  
**Baseline:** `main` at `1882295c010b0def43d147b1e4b2318d90b98fb0`  
**Working branch:** `audit/engineering-audit-2026-11-14`

This plan is ordered to reduce authentication and data-integrity risk first, then improve scaling, maintainability, documentation, and presentation. It is a plan only; the application code and production configuration have not been changed.

## Phase 0 — Establish a reliable integration baseline

**Goal:** Keep the existing `main` branch stable and make the current PR work safe to integrate.

- Keep PR #3 open only while correcting its Bearer-token matcher and rerunning the failing tests.
- Do not merge PR #3 in its current state: its matcher requires a literal backslash before `s`, and its current CI run has six failing tests.
- Review PR #4 as the main Phase 1 hardening candidate. Preserve its 35-test, type-check, and build evidence, but complete the runtime checks listed in its PR description.
- Rebase or cherry-pick the required auth middleware change onto the Phase 1 branch only after its tests pass.
- Reconcile overlapping files and rerun CI on the combined branch.
- Keep Render environment values and production deployment untouched during code review.

**Exit criteria:** one clean feature branch with a single coherent security diff; full CI green; no unreviewed overlapping auth/server changes.

## Phase 1 — Authentication and server error boundaries (P0)

**Goal:** Return accurate, safe API responses for authentication and infrastructure failures.

1. Parse the Bearer header and verify the token in a focused error boundary.
2. Return 401 for missing, malformed, expired, or invalid tokens.
3. Return 401 when a valid token references a user that no longer exists.
4. Forward MongoDB lookup errors, in-memory store errors, and JWT configuration failures to centralized error handling rather than reporting them as invalid credentials.
5. Keep `Cache-Control: no-store, private` and `Vary: Authorization` on protected responses.
6. Pin JWT signing and verification to HS256, validate the decoded payload shape, and enforce a minimum secret length plus placeholder rejection at startup.
7. Preserve generic invalid-credential responses so login does not reveal whether an email address is registered.

**Required tests:** missing Bearer header; malformed token; expired token; invalid payload; valid token + found user; deleted user; MongoDB lookup failure; in-memory fallback success; in-memory store failure; unavailable storage; missing/invalid JWT configuration.

## Phase 2 — Request validation and error handling (P0/P1)

**Goal:** Make API inputs consistent across MongoDB and the development fallback.

- Add shared typed parsers for create and update requests.
- Validate JSON object shape and every supplied field's type.
- Align maximum lengths across parser and Mongoose schema: title, description, content, category, and cover URL.
- Accept only HTTPS cover-image URLs without credentials.
- Accept only `published` or `draft` for status.
- Reject empty title/content on create and reject explicitly empty replacements on update.
- Apply identical validated objects to MongoDB and in-memory paths.
- Add safe, generic 5xx responses in production; keep detailed server diagnostics in logs.
- Normalize invalid JSON to 400 and oversized request bodies to 413.
- Set explicit JSON and URL-encoded body limits.

**Required tests:** non-object body; wrong field types; over-limit fields; invalid cover-image schemes; invalid status; blank values; omitted update fields; validation parity between MongoDB and fallback paths; generic production 500 response; malformed JSON; oversized body.

## Phase 3 — HTTP security and CSP rollout (P1)

**Goal:** Harden response headers without breaking the existing multi-page frontend.

- Adopt Helmet and the baseline security headers from the Phase 1 branch after reviewing the policy.
- Retain a bounded `TRUST_PROXY_HOPS` configuration. Confirm it matches the actual Render proxy path before relying on IP-based limits.
- Keep CSP in report-only mode while the five HTML pages still contain inline module bootstrap scripts.
- Move page bootstraps to external ES modules.
- Remove inline event-handler attributes and use delegated event listeners or module-managed listeners.
- Review CSP reports from home, login, register, dashboard, and editor pages.
- Enforce CSP only in a separate release after all required sources and violations are understood.
- Keep CORS origins explicit and test same-origin plus approved and rejected cross-origin cases.

**Release rule:** Do not enable `CSP_ENFORCE=true` until the inline bootstraps are externalized and the report-only review is complete.

## Phase 4 — API and persistence reliability (P1/P2)

**Goal:** Keep API cost and behavior predictable as content volume grows.

- Add bounded pagination to public and author post-list endpoints.
- Add a stable sort and cursor strategy; ensure author filters remain scoped to the authenticated user's ID.
- Add indexes for the query patterns actually used by feed, owner, status, category, and date sorting.
- Replace read-modify-save view increments with an atomic MongoDB update.
- Review query input length limits and category/author filters.
- Keep draft stories inaccessible from the public feed and direct public story route.
- Retain owner checks on every write, including future bulk operations.

**Required tests:** page boundaries; stable ordering; maximum page size; owner-only listing; drafts excluded from public feed; direct draft access denied; atomic view increment behavior.

## Phase 5 — Rate limiting and operational readiness (P1)

**Goal:** Make abuse controls match the service's deployment topology.

- Keep the current process-local limiter only while running one instance.
- Before adding instances, provision a Redis-compatible shared store and move login/registration counters to it.
- Count failed login attempts rather than successful logins.
- Keep registration limits separate from login limits.
- Test limit reset, client isolation, proxy IP interpretation, and shared behavior across two app instances.
- Confirm Render's actual service type, instance count, auto-deploy setting, health-check path, current deployment, and recent startup/runtime logs.
- Verify `NODE_ENV`, trusted proxy configuration, and the presence (not the values) of required secret variables.

**Required tests:** per-IP behavior; successful-login skip; retry headers; reset windows; proxy-aware client IP; coordinated limits when horizontally scaled.

## Phase 6 — TypeScript and dependency quality (P2)

**Goal:** Reduce unsafe casts and keep build/runtime dependencies intentional.

- Introduce `strict`, `noImplicitAny`, and `strictNullChecks` incrementally, beginning with backend modules.
- Replace `protect as any` and controller casts with typed Express handlers and typed request contracts.
- Replace `any` in error middleware with a narrow application error type.
- Decide whether `tsx` is a production dependency or whether the server should compile to JavaScript and run with Node.
- Keep lockfile and CI installation deterministic with `npm ci`.
- Audit imports before removing dependencies; remove only packages with no remaining production/build use.
- Update GitHub Actions to currently supported Node runtimes and action versions after a compatibility run.

**Required checks:** clean install, type-check, tests, production build, and server startup through the exact production start command.

## Phase 7 — API documentation and product presentation (P2)

**Goal:** Make the repository easy to understand, evaluate, and run.

- Replace the high-level README with a project landing page: concise overview, feature list, architecture diagram, real screenshots, API reference, local setup, environment variable names, CI, and deploy instructions.
- Add an API route table with method, path, auth requirement, request fields, and success/error response examples.
- Add an OpenAPI specification for auth and blog routes.
- Capture genuine screenshots of the public feed, login/register, author dashboard, editor, and mobile navigation.
- Add a short demo GIF only after the critical workflows are tested.
- Keep project status, deployment links, and feature claims aligned with the actual code.
- Document that password reset/email verification are not implemented until those workflows exist.

## Phase 8 — UI and accessibility QA (P2)

**Goal:** Demonstrate that the whole multi-page experience works across devices and input methods.

- Test responsive layouts at narrow mobile, tablet, and desktop widths.
- Complete a keyboard-only pass for navigation, login/register, editor, dashboard tabs, delete confirmation, and article modal.
- Check visible focus, dialog focus management, labels, accessible names, color contrast, and reduced-motion behavior.
- Verify image fallback behavior under the planned CSP.
- Check browser console errors, failed network requests, and broken local/external links.

## Suggested implementation order

| Order | Deliverable | Merge gate |
|---|---|---|
| 1 | Correct authentication middleware and tests | Auth tests green; no 401 for datastore outages |
| 2 | Request validation + safe error handling | All validation/error tests green |
| 3 | JWT, Helmet, proxy, rate-limit improvements | CI green; runtime smoke tests complete |
| 4 | CSP externalization and enforcement | No unresolved report-only violations |
| 5 | Pagination, indexes, atomic views | API regression tests green |
| 6 | Strict TypeScript and dependency cleanup | Clean install, type-check, test, build, startup |
| 7 | README, OpenAPI, screenshots | Claims and screenshots match the app |
| 8 | UI/accessibility pass | Desktop/mobile/keyboard QA checklist complete |

## Release checklist

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Start in production mode with a dedicated test MongoDB database.
- [ ] Smoke-test health, register, login, `/api/auth/me`, public list, author list, create/update/delete, draft isolation, and ownership denial.
- [ ] Exercise invalid JSON, oversized body, malformed token, expired token, missing user, database outage, and rate-limit responses.
- [ ] Inspect CSP reports on every page before enforcement.
- [ ] Check Render deploy status, health check, runtime logs, and required environment variable presence.
- [ ] Confirm the deployed commit SHA matches the reviewed merge commit.
- [ ] Complete mobile, keyboard, accessibility, and browser-console checks.

## Scope boundary

This branch contains audit and planning documentation only. Application source code, `main`, Render environment values, and production deployments are unchanged.
