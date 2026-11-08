# BlogSpace — Full-Stack Blogging Platform

A full-stack blogging application built to practice and demonstrate backend API development, authentication, database integration, and responsive frontend workflows.

**Author:** MD. MINHAZUR RAHMAN FAHIM  
**Repository:** https://github.com/fahim1252375-maker/blogspace-fullstack

## Overview

BlogSpace lets readers browse published posts and registered authors manage their own content through a protected dashboard. The project combines a browser-based interface with a Node.js/Express API and MongoDB persistence.

## Features

- Responsive public blog feed with search and category filtering
- User registration and login
- JWT-protected author dashboard and editor
- Create, read, update, and delete blog posts
- Server-side author-ownership checks for post updates and deletion
- Password hashing with bcryptjs
- MongoDB Atlas integration through Mongoose
- API health endpoint
- Environment-based configuration

## Technology

| Area | Tools |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES modules) |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Build | Vite |
| Testing | Node.js test runner, TypeScript tooling |

## Main Pages

- Home / published posts
- Login and registration
- Author dashboard
- Create and edit blog posts

## Run Locally

**Requirements:** Node.js, npm, and a MongoDB database.

```bash
git clone https://github.com/fahim1252375-maker/blogspace-fullstack.git
cd blogspace-fullstack
npm install
cp .env.example .env
```

Add the required values to `.env`:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — a long, random signing secret
- `NODE_ENV` — use `development` locally

Then start the development server:

```bash
npm run dev
```

Open the local URL printed by the development server.

## Available Checks

```bash
npm run lint
npm test
npm run build
```

Run these checks in your local environment before treating a release as verified. Test-script configuration and deployment status should be confirmed against the current branch and hosting environment.

## Security Notes

- Passwords are hashed; plaintext passwords should never be stored.
- Protected API routes use JWT authentication.
- Update and delete operations check post ownership on the server.
- The current browser-token approach is suitable for a learning/demo project but needs further hardening before production use. Consider Secure, HttpOnly, SameSite cookies with appropriate CSRF protection.
- Never commit `.env`, database credentials, or JWT secrets.

## Project Status

This is a portfolio and learning project. Features and deployment should be tested on the current commit before being described as production-ready. Password reset and other production-grade account-recovery controls are not implemented.

---

Built by **MD. MINHAZUR RAHMAN FAHIM**.
