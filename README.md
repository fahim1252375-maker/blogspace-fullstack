# BlogSpace — Full-Stack Blogging Application

A full-stack blogging application built as a software-development learning and portfolio project. It combines a browser-based interface with a Node.js/Express API and MongoDB persistence.

**Author:** MD. Minhazur Rahman Fahim  
**Repository:** https://github.com/fahim1252375-maker/blogspace-fullstack

## Overview

Readers can browse published posts, while registered authors can manage their own content through protected workflows. The project demonstrates API development, authentication, database integration, and frontend/backend coordination.

## Features

- Responsive public blog feed with search and category filtering
- User registration and login
- JWT-protected author dashboard and editor
- Create, read, update, and delete blog posts
- Server-side author-ownership checks for post updates and deletion
- Password hashing with bcryptjs
- MongoDB integration through Mongoose
- API health endpoint
- Environment-based configuration

## Technology

| Area | Tools |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Build | Vite |
| Checks | TypeScript, Node.js test runner |

## Run Locally

**Requirements:** Node.js 22 or later, npm, and a MongoDB database.

~~~bash
git clone https://github.com/fahim1252375-maker/blogspace-fullstack.git
cd blogspace-fullstack
npm ci
cp .env.example .env
~~~

Configure the values in the .env file:

- MONGODB_URI — MongoDB connection string
- JWT_SECRET — a long, random secret; never commit it
- NODE_ENV — use development locally
- FRONTEND_URL — allowed frontend origin(s), if the frontend is hosted separately
- TRUST_PROXY_HOPS — number of trusted reverse proxies in front of the app; for example, 1 behind one trusted proxy and 0 for direct/local access

Start the application:

~~~bash
npm run dev
~~~

Open the local URL printed by the server.

## Available Checks

~~~bash
npm run lint
npm test
npm run build
~~~

The checks passed on the local main checkout during the November 9, 2026 development session: TypeScript validation, 13 automated tests, and the production build. Run them again on the exact checkout you intend to deploy.

## Recent Engineering Work

### Security hardening — November 9, 2026

The security update was merged into main through [Pull Request #2](https://github.com/fahim1252375-maker/blogspace-fullstack/pull/2).

- Added per-IP registration rate limiting: **5 attempts per 15 minutes**.
- Added per-IP login rate limiting: **10 attempts per 15 minutes**.
- Added tests for allowed requests, blocked requests, per-IP isolation, and invalid configuration.
- Reduced information exposed by the public health endpoint; database host and connection details are not returned.
- Added configurable trusted-proxy handling through TRUST_PROXY_HOPS.
- Added baseline Referrer-Policy and Permissions-Policy response headers.

**Implementation limitation:** The current rate limiter uses in-memory state and is scoped to one server process. A shared store such as Redis is needed before running multiple application instances if rate limits must be shared across them.

## Security and Deployment Scope

This is a learning/portfolio application. The security improvements are useful engineering practice, but they do not establish that the application is production-hardened. Before handling real users or sensitive data, review and test at least the following:

- Use a strong, unique JWT_SECRET stored only in the hosting provider's secret manager.
- Keep .env and all credentials out of Git.
- Review CORS origins and allow only the actual frontend origins.
- Use a shared rate-limit store such as Redis before scaling to multiple app instances.
- Configure TRUST_PROXY_HOPS to match the number of trusted reverse proxies so IP-based limits use the actual client IP.
- Continue testing request validation and authorization boundaries.
- Review token storage and consider Secure, HttpOnly, SameSite cookies with CSRF protection.
- Keep health endpoints limited to operational status.
- Configure secure HTTP headers and production logging without leaking secrets.
- Add integration tests for authentication, authorization, and data ownership.
- Restrict MongoDB network access to trusted sources rather than leaving broad access enabled.

Password reset, email verification, and other production-grade account recovery features are not documented as implemented.

## Render Configuration

A render.yaml Blueprint is included for a Render web service. It defines the Node.js build/start commands and /api/health health-check path. Set the MongoDB connection string in the service's secret environment variables before deployment. The presence of this configuration does not by itself mean that a production deployment is live or verified.

## AI Use Disclosure

AI tools may be used as supporting aids for brainstorming, explaining unfamiliar concepts, debugging, and drafting documentation. The project author is responsible for reviewing, adapting, understanding, and testing all published changes. AI suggestions are not considered verified until checked against the actual code and relevant tests.

---

Built as a full-stack learning and portfolio project by MD. Minhazur Rahman Fahim.
