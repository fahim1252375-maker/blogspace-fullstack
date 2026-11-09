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

    git clone https://github.com/fahim1252375-maker/blogspace-fullstack.git
    cd blogspace-fullstack
    npm ci
    cp .env.example .env

Configure the values in .env:

- MONGODB_URI — MongoDB connection string
- JWT_SECRET — a long, random secret; never commit it
- NODE_ENV — use development locally
- FRONTEND_URL — allowed frontend origin(s), if the frontend is hosted separately

Start the application:

    npm run dev

Open the local URL printed by the server.

## Available Checks

    npm run lint
    npm test
    npm run build

The project checks have passed in the development workflow previously, but rerun them on the exact commit you intend to deploy.

## Security and Deployment Scope

This is a learning/portfolio application and should not be described as production-hardened. Before handling real users or sensitive data, review and test at least the following:

- Use a strong, unique JWT_SECRET stored only in the hosting provider's secret manager.
- Keep .env and all credentials out of Git.
- Review CORS origins and allow only the actual frontend origins.
- Apply per-IP rate limits to registration and login endpoints (5 registrations / 10 login attempts per 15 minutes per process); use a shared store such as Redis before scaling to multiple app instances.
- Configure `TRUST_PROXY_HOPS` to match the number of trusted reverse proxies so IP-based limits use the actual client IP.
- Continue testing request validation and authorization boundaries.
- Review token storage and consider Secure, HttpOnly, SameSite cookies with CSRF protection.
- Keep health endpoints limited to operational status; the API health response does not expose database host or connection configuration.
- Configure secure HTTP headers and production logging without leaking secrets.
- Add integration tests for authentication, authorization, and data ownership.
- Restrict MongoDB network access to trusted sources rather than leaving broad access enabled.

Password reset, email verification, and other production-grade account recovery features are not currently documented as implemented.

---

Built as a full-stack learning and portfolio project.