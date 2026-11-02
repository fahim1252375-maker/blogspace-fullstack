# BlogSpace — Professional Editorial Full-Stack Blogging Platform

> **Share Your Stories with the World.**  
> A high-craft, production-grade full-stack editorial blogging platform built with **HTML5, CSS3, Vanilla JavaScript (ES6+), Node.js, Express.js, MongoDB & Mongoose**, featuring **JWT authentication**, **bcrypt password hashing**, and responsive multi-page architecture.
>
> **Author:** MD. MINHAZUR RAHMAN FAHIM  
> **Contact:** fahim1252375@icloud.com  
> **Live Demo:** https://bejewelled-haupia-dd6200.netlify.app  

---

## 🌟 Architecture & Evolution

- **Module 01 (Frontend Complete):** Semantic HTML5, responsive CSS3 variables/Grid/Flexbox, Vanilla JavaScript ES6 modules, and comprehensive client interactions across 5 core views (`index.html`, `login.html`, `register.html`, `dashboard.html`, `create-blog.html`).
- **Module 02 (Backend Complete):** Full-stack Node.js + Express.js gateway, MongoDB/Mongoose database models, secure password hashing (`bcryptjs`), stateless JSON Web Token (`JWT`) authentication, author ownership validation, centralized error handling, and end-to-end frontend integration.

---

## 🛠️ Technology Stack

| Layer | Technologies | Key Highlights |
|---|---|---|
| **Frontend Presentation** | Semantic HTML5, CSS3 Variables, CSS Grid, Flexbox | Pure CSS, zero heavy UI frameworks, dark slate & indigo editorial palette |
| **Frontend Interactivity** | Vanilla JavaScript (ES6+ Modules), DOM API | Asynchronous `fetch` calls, client session management, toast alerts |
| **Backend Runtime** | Node.js (v22), Express.js (v4), TypeScript / TSX | Modular RESTful architecture, CORS, JSON body parsers, health monitoring |
| **Database & ODM** | MongoDB, Mongoose (v8/v9) | Schemas for `User` and `Blog`, indexed fields, timestamps, auto-slug generation |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` | Salted password hashing (10 rounds), Bearer token authorization middleware |
| **Tooling & Bundler** | Vite (v8), TypeScript (v7), Node.js Test Runner | Multi-page HTML bundling, `tsc --noEmit` linting, 9 automated unit tests |

---

## 📁 Project Structure

```
blogspace/
│
├── index.html              # Home Feed: Hero showcase, category filters, live search, reader modal
├── login.html              # Sign In: Form validation, demo account autofill, password toggle
├── register.html           # Sign Up: Live password strength meter, duplicate email validation
├── dashboard.html          # Author Dashboard: Metric cards, blog table, live status toggle, delete modal
├── create-blog.html        # Story Editor: Markdown toolbar, live preview tab, cover presets
├── README.md               # Complete platform documentation & API testing guide
├── postman_collection.json # Exportable Postman collection (12 ready-to-run API requests)
├── .env.example            # Environment variables template
├── package.json            # Node.js dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Multi-entry MPA bundler configuration
├── server.ts               # Express server entry point mounting REST API + Vite middlewares
│
├── backend/                # Professional Modular Backend
│   ├── config/
│   │   ├── db.ts           # MongoDB Mongoose connection with resilient fallback
│   │   └── inMemoryStore.ts# Resilient in-memory database store with seed data
│   ├── controllers/
│   │   ├── authController.ts# Registration, Login, and Profile handlers (JWT + bcrypt)
│   │   └── blogController.ts# Blog CRUD, filtering, search, view count, and ownership checks
│   ├── middleware/
│   │   ├── authMiddleware.ts# JWT Bearer token authentication & route protection
│   │   └── errorMiddleware.ts# 404 handler and centralized JSON error responses
│   ├── models/
│   │   ├── User.ts         # Mongoose User Model with password hashing hooks
│   │   └── Blog.ts         # Mongoose Blog Model with relations and auto-slugging
│   └── routes/
│       ├── authRoutes.ts   # /api/auth endpoints (register, login, me)
│       └── blogRoutes.ts   # /api/blogs endpoints (GET, POST, PUT, DELETE)
│
├── css/
│   ├── style.css           # Global design system, typography, header, grid, reader modal, footer
│   ├── auth.css            # Auth cards, inputs, strength meter, alerts
│   └── dashboard.css       # Sidebar, stats cards, data table, editor, preview tabs
│
├── js/
│   ├── blog.js             # Core data engine, API client wrapper, seed data, editor logic
│   ├── auth.js             # Authentication form controllers connected to backend APIs
│   ├── dashboard.js        # Metrics calculation, table rendering, delete modal with API sync
│   └── main.js             # Homepage controller, category filters, search, reader modal
│
└── src/
    └── utils/
        ├── blog-logic.ts   # Decoupled business logic functions
        └── blog-logic.test.ts # 9 automated unit tests (Node.js test runner)
```

---

## 📡 REST API Specification

All API endpoints return standard, predictable JSON responses.

### Base URL: `http://localhost:3000`

| Method | Endpoint | Access | Headers | Request Body | Description & Status |
|---|---|---|---|---|---|
| `GET` | `/api/health` | Public | None | None | **200 OK** — Server health and database connection status |
| `POST` | `/api/auth/register` | Public | `Content-Type: application/json` | `{ name, email, password }` | **201 Created** — Creates user, hashes password, returns JWT token |
| `POST` | `/api/auth/login` | Public | `Content-Type: application/json` | `{ email, password }` | **200 OK** — Authenticates user, verifies password, returns JWT token |
| `GET` | `/api/auth/me` | Private | `Authorization: Bearer <token>` | None | **200 OK** — Returns authenticated user's profile |
| `GET` | `/api/blogs` | Public | Optional query params | None | **200 OK** — Returns list of blogs (supports `?category=`, `?search=`, `?status=`) |
| `GET` | `/api/blogs/:id` | Public | None | None | **200 OK** — Returns single story by ID and increments view count |
| `POST` | `/api/blogs` | Private | `Authorization: Bearer <token>` | `{ title, description, content, category, coverImage, status }` | **201 Created** — Publishes new blog associated with author |
| `PUT` | `/api/blogs/:id` | Private | `Authorization: Bearer <token>` | `{ title, description, content, category, coverImage, status }` | **200 OK** — Updates story (author ownership verified) |
| `DELETE` | `/api/blogs/:id` | Private | `Authorization: Bearer <token>` | None | **200 OK** — Deletes story (author ownership verified) |

---

## 🔒 Security & Token Storage Strategy

### How Tokens Work in BlogSpace
1. When a user logs in or registers, the server signs a **JSON Web Token (JWT)** containing the user's MongoDB ID:
   ```ts
   jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
   ```
2. The client receives the token and attaches it to all authenticated mutation requests via HTTP headers:
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```
3. The server's `protect` middleware intercepts the header, validates the signature and expiration, retrieves the user, and attaches `req.user` to the request pipeline.

### Storage Strategy & Trade-offs
- **Current Client Strategy:** The token is kept in browser `localStorage` under `blogspace_token`.
- **Trade-off Analysis:**
  - *Pros:* Works seamlessly in single-page and multi-page static environments without requiring server-side session stores, domain cookie alignment, or third-party cookie exemptions in sandboxed containers.
  - *Security Consideration:* While vulnerable to arbitrary script injection (XSS) if untrusted third-party scripts were included, BlogSpace enforces strict HTML sanitization (`escapeHtml`), CSP headers, and inline script avoidance. In production enterprise environments, setting HTTP-only `SameSite=Strict` cookies with CSRF tokens provides additional protection.

---

## 🧪 Postman API Testing Guide

A ready-to-use Postman collection is provided in `/postman_collection.json`.

### How to Import & Test:
1. Open **Postman**.
2. Click **Import** (top left) and select `postman_collection.json`.
3. The collection creates an environment variable `baseUrl` set to `http://localhost:3000`.
4. Run requests in sequence:
   - **Request 1:** `1. Health Check` (GET) → Expect `200 OK`.
   - **Request 2:** `2. User Registration` (POST) → Auto-stores `authToken`. Expect `201 Created`.
   - **Request 3:** `3. Duplicate Email Registration` (POST) → Expect `400 Bad Request`.
   - **Request 4:** `4. User Login` (POST) → Logs in as demo user `alex@blogspace.io` / `password123`. Expect `200 OK`.
   - **Request 5:** `5. Invalid Login` (POST) → Negative test. Expect `401 Unauthorized`.
   - **Request 6:** `6. Create Blog` (POST with `Bearer {{authToken}}`) → Auto-stores `blogId`. Expect `201 Created`.
   - **Request 7:** `7. Create Blog Without Token` (POST) → Negative test. Expect `401 Unauthorized`.
   - **Request 8:** `8. Get All Blogs` (GET) → Expect `200 OK` with array of stories.
   - **Request 9:** `9. Get Single Blog By ID` (GET) → Expect `200 OK` with full story details.
   - **Request 10:** `10. Update Blog` (PUT) → Expect `200 OK`.
   - **Request 11:** `11. Unauthorized Blog Modification` (PUT with invalid token) → Expect `401 Unauthorized`.
   - **Request 12:** `12. Delete Blog` (DELETE with author token) → Expect `200 OK`.

---

## ⚙️ Environment Variables & MongoDB Setup

### 1. Configure `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Contents of `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/blogspace?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
FRONTEND_URL=http://localhost:3000
ALLOW_IN_MEMORY_FALLBACK=false
```

### 2. Connect MongoDB Atlas (Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 Cluster.
2. Under **Security > Database Access**, create a database user with read/write privileges (e.g. `bloguser` / `securepassword123`).
3. Under **Security > Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) or your specific IP.
4. Under **Database > Deployment**, click **Connect > Drivers > Node.js**.
5. Copy your connection string into your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://bloguser:securepassword123@cluster0.abcde.mongodb.net/blogspace?retryWrites=true&w=majority
   ```
6. Start the server (`npm run dev`). Mongoose will await connection and log:
   `[BlogSpace DB] MongoDB Connected Successfully: cluster0.abcde.mongodb.net`
7. Once connected to Atlas, all registered users and blogs persist permanently across server restarts.

> **Database Architecture & Zero Silent Fallback Policy:**
> - **Production Hard Stop:** In `NODE_ENV=production`, if `MONGODB_URI` is missing or fails to connect, the application halts startup (`process.exit(1)`).
> - **No Silent Fallbacks:** The server will never silently fall back to In-Memory storage. If MongoDB is disconnected, `GET /api/health` returns `503 Service Unavailable`, and write operations return explicit `503` database service errors.
> - **Development Opt-in Only:** To prototype offline without MongoDB during local frontend development, set `ALLOW_IN_MEMORY_FALLBACK=true` in `.env`. This flag is strictly ignored in production.

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Run Automated Unit Tests
```bash
npm test
```
All 9 automated unit tests will execute and verify core business logic:
- Reading time calculations.
- Email RFC formatting.
- Password strength score & label computation.
- URL slug generation.
- Text truncation.
- Search, category, and status filters.
- Author metrics aggregation.
- Safe session sanitization.
- Password hashing & verification.

### 4. Run TypeScript Lint Verification
```bash
npm run lint
```
Performs strict type-checking across all `.ts` files with zero emit.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 👤 Demo Accounts (Out-of-the-Box)

| Name | Email | Password | Role |
|---|---|---|---|
| **Alex Mercer** | `alex@blogspace.io` | `password123` | Lead Author & Architect |
| **Elena Rostova** | `elena@blogspace.io` | `password123` | Editorial Contributor |

*(On `login.html`, click **"Auto-fill test credentials"** for 1-click testing!)*

---

*Crafted with passion, meticulous typography, and modern full-stack web standards by Minhaz Fahim.*
