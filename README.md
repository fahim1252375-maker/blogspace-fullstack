# BlogSpace

A full-stack editorial blogging application where readers can explore published stories and registered authors can create, manage, and publish their own articles.

## Features

- Responsive multi-page frontend for Home, Login, Register, Dashboard, and Story Editor.
- Public feed that displays published articles.
- Search and category filtering.
- JWT-based registration and login with bcrypt password hashing.
- Protected author dashboard and profile.
- Author-specific post management with ownership checks for update and delete operations.
- MongoDB Atlas persistence through Mongoose.
- API health endpoint at `/api/health`.

## Technology

| Area | Stack |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES modules) |
| Backend | Node.js, Express.js, TypeScript, TSX |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| Build | Vite |
| Tests | Node.js test runner, TypeScript type-check |

## Application Pages

| Page | Path | Access |
|---|---|---|
| Home / Explore | `/` or `/index.html` | Public |
| Login | `/login.html` | Public |
| Register | `/register.html` | Public |
| Author Dashboard | `/dashboard.html` | Authenticated |
| Story Editor | `/create-blog.html` | Authenticated |

## Project Structure

```text
.
├── backend/
│   ├── config/       # MongoDB connection and data-store configuration
│   ├── controllers/  # Authentication and blog business logic
│   ├── middleware/   # JWT protection and error handling
│   ├── models/       # Mongoose User and Blog models
│   └── routes/       # Authentication and blog API routes
├── css/              # Global, authentication, and dashboard styles
├── js/               # Frontend modules and API integration
├── src/utils/        # Shared business logic and unit tests
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── create-blog.html
├── server.ts         # Express API and production static-file server
├── vite.config.ts
└── render.yaml       # Render deployment blueprint
```

## Run Locally

### 1. Requirements

- Node.js 22 or newer
- npm
- A MongoDB Atlas database (or another compatible MongoDB deployment)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Set the values in your local `.env` file:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Local server port; defaults to `3000`. Render supplies this automatically. |
| `NODE_ENV` | No | Use `development` locally and `production` when deployed. |
| `MONGODB_URI` | Yes | MongoDB connection string for the BlogSpace database. |
| `JWT_SECRET` | Yes | Long, random secret used to sign authentication tokens. |
| `FRONTEND_URL` | No | Comma-separated allowed frontend origins when using a separate frontend domain. |

Never commit your real `.env` file or share database credentials or JWT secrets.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Reference

All API routes are served by the same application origin.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Server and database health |
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Authenticate and receive a JWT |
| GET | `/api/auth/me` | JWT required | Get the authenticated user's profile |
| GET | `/api/blogs` | Public | List published posts |
| GET | `/api/blogs/mine` | JWT required | List the authenticated author's posts |
| GET | `/api/blogs/:id` | Public | Read a published post |
| POST | `/api/blogs` | JWT required | Create a post |
| PUT | `/api/blogs/:id` | JWT + ownership required | Update an owned post |
| DELETE | `/api/blogs/:id` | JWT + ownership required | Delete an owned post |

Authenticated API requests use the `Authorization: Bearer <token>` header.

## Production Build

Create the optimized frontend bundle:

```bash
npm run build
```

Start the production server:

```bash
NODE_ENV=production npm start
```

The Express server serves the Vite output from `dist/` and the REST API from the same origin.

## Deploy to Render

This repository includes a `render.yaml` Blueprint for a single-service full-stack deployment.

1. Push the repository to GitHub.
2. In Render, choose **New + → Blueprint** and connect this repository.
3. Render reads `render.yaml` and creates the web service.
4. Add the required environment variables when prompted:
   - `MONGODB_URI`: your MongoDB Atlas connection string.
   - `JWT_SECRET`: use a long, random value; Render can generate one for the Blueprint.
5. In MongoDB Atlas Network Access, allow connections from Render. Render's outbound IPs can change; for a simple student deployment, Atlas may require an IP access rule that permits `0.0.0.0/0`. Use a dedicated database user with only the permissions this app needs, and never expose its password.
6. Wait for the first deployment to finish.
7. Open the Render service URL and append `/api/health`. The response should report `status: "healthy"` and `database.connected: true`.
8. Verify registration, login, profile, dashboard, post creation, and logout on the deployed URL.

Render injects the public service URL into `RENDER_EXTERNAL_URL`; the server accepts that origin automatically. If you later attach a separate frontend domain, add its exact origin to `FRONTEND_URL`.

**Deployment URL:** Add the live Render URL here after the first successful deployment.

## Responsive Layout

The stylesheet includes desktop, tablet, and mobile breakpoints. Check the Home, Login, Register, Dashboard, and Story Editor pages at narrow mobile widths before considering the release finished.

## Security Notes

- Passwords are hashed with bcryptjs; plaintext passwords are not stored.
- Private API routes require a valid JWT.
- Blog update and delete operations enforce author ownership on the server.
- JWTs are currently stored in browser storage (session storage by default, local storage when Remember Me is selected). This is convenient for this project but remains exposed to JavaScript running on the page. A production-hardened authentication design should consider Secure, HttpOnly, SameSite cookies and appropriate CSRF protection.
- Password reset is not implemented yet.
- Keep all secrets in environment variables and rotate any credential that has been exposed.

## Project Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the Express server |
| `npm run lint` | Run the TypeScript type-check |
| `npm test` | Run the unit test suite |

---

Built by **MD. MINHAZUR RAHMAN FAHIM**.
