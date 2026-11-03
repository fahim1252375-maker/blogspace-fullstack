# BlogSpace

**BlogSpace** is a full-stack editorial blogging platform. Readers can explore published stories, while registered authors can create, edit, and manage their own posts through a protected dashboard.

> **Deployment status:** BlogSpace is deployed as a full-stack Node.js service on Render. The production frontend and REST API are served from the same origin, with MongoDB Atlas configured for persistent storage. Check the live health endpoint before testing or sharing the application.

## Features

- Responsive public homepage with story feed, search, and category filters.
- Account registration and login.
- JWT-protected author dashboard and story editor.
- Create, read, update, and delete blog posts.
- Author ownership checks for post updates and deletion.
- MongoDB Atlas persistence through Mongoose.
- Password hashing with bcrypt.
- API health endpoint with database connectivity status.
- Single-origin deployment: Express serves the frontend build and API.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES modules) |
| Backend | Node.js, Express.js, TypeScript, TSX |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Build tool | Vite |
| Tests | Node.js test runner, TypeScript compiler |

## Pages

| Page | Route | Access |
|---|---|---|
| Explore stories | `/` or `/index.html` | Public |
| Login | `/login.html` | Public |
| Register | `/register.html` | Public |
| Author dashboard | `/dashboard.html` | Login required |
| Story editor | `/create-blog.html` | Login required |

## Project Structure

```text
.
├── backend/
│   ├── config/       # MongoDB connection and data-store configuration
│   ├── controllers/  # Authentication and blog business logic
│   ├── middleware/  # Authentication and error handling
│   ├── models/       # User and Blog Mongoose models
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
├── render.yaml       # Render Blueprint
└── .env.example      # Environment variable template
```

## Run Locally

### Requirements

- Node.js 22 or newer
- npm
- A MongoDB Atlas database or compatible MongoDB instance

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create your local environment file:

```bash
cp .env.example .env
```

Set these values in `.env`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Local server port; defaults to `3000`. Render provides this automatically. |
| `NODE_ENV` | Recommended | Set to `development` locally and `production` on Render. |
| `MONGODB_URI` | Yes | MongoDB connection string for the BlogSpace database. |
| `JWT_SECRET` | Yes | Long, random secret used to sign authentication tokens. |
| `FRONTEND_URL` | No | Comma-separated allowed frontend origins when using a separate frontend domain. |

**Security:** Never commit `.env`, publish database credentials, or put secrets in frontend JavaScript. Use a dedicated MongoDB database user with only the permissions required by this application.

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Reference

All API routes are served from the same origin.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Server and database health |
| POST | `/api/auth/register` | Public | Register an account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/auth/me` | JWT required | Get the current user's profile |
| GET | `/api/blogs` | Public | List published posts |
| GET | `/api/blogs/mine` | JWT required | List the current author's posts |
| GET | `/api/blogs/:id` | Public | Read a published post |
| POST | `/api/blogs` | JWT required | Create a post |
| PUT | `/api/blogs/:id` | JWT + ownership required | Update an owned post |
| DELETE | `/api/blogs/:id` | JWT + ownership required | Delete an owned post |

Send authenticated requests with:

```http
Authorization: Bearer <token>
```

## Tests and Production Build

Run the available checks before release:

```bash
npm run lint
npm test
npm run build
```

Start the production server locally:

```bash
NODE_ENV=production npm start
```

The Express server serves the optimized Vite output from `dist/` and the REST API from the same origin.

## Deploy to Render

This repository includes a `render.yaml` Blueprint for a single-service full-stack deployment.

1. Push the repository to GitHub.
2. In Render, select **New + → Blueprint** and connect this repository.
3. Render reads `render.yaml` and configures the web service.
4. Open the service's **Environment** page and add:
   - `MONGODB_URI`: your MongoDB Atlas connection string.
   - `JWT_SECRET`: a long random secret. Render can generate one when using the Blueprint.
   - `NODE_ENV`: `production` (set by the Blueprint).
5. In MongoDB Atlas **Network Access**, allow the Render service to connect. Use the narrowest practical IP rule. If your Render plan does not provide stable outbound IPs, a broad rule may be required for a student/demo deployment; understand the security trade-off and use a least-privilege database user.
6. Save the environment variables and wait for Render to redeploy.
7. Open the health endpoint: [https://blogspace-fullstack.onrender.com/api/health](https://blogspace-fullstack.onrender.com/api/health).
8. Confirm that the response reports a healthy server and `database.connected: true`.
9. Test registration, login, profile, dashboard, post creation, editing, deletion, and logout before sharing the app.

### Current Render service

- Service: `blogspace-fullstack`
- Region: Singapore
- Plan: Free web service
- Deployment branch: `main` (automatic deploys enabled)
- Service URL: [https://blogspace-fullstack.onrender.com](https://blogspace-fullstack.onrender.com)
- Health endpoint: [https://blogspace-fullstack.onrender.com/api/health](https://blogspace-fullstack.onrender.com/api/health)

The service configuration is managed in the [Render dashboard](https://dashboard.render.com/web/srv-dbkmv2rbc2fs739qgheg). Do not put database credentials or JWT secrets in this README or in frontend code.

Render injects `RENDER_EXTERNAL_URL`; the server accepts that origin automatically. If you later attach a separate frontend domain, add its exact origin to `FRONTEND_URL`.

## Responsive UI Verification

The stylesheets define desktop, tablet, and mobile breakpoints. Before release, verify these pages at narrow mobile widths (around 360–390 px), tablet width, and desktop width:

- Home: navigation, hero, filters, search, article cards, and footer.
- Login and Register: form width, labels, validation messages, and button sizing.
- Dashboard: navigation, post list, action buttons, and empty state.
- Story Editor: title/content fields, category controls, and publish actions.
- Reader: long titles, images, article content, and modal scrolling.

Check that there is no horizontal page overflow, clipped text, overlapping controls, or inaccessible navigation.

## Security Notes and Known Limitations

- Passwords are hashed with bcryptjs; plaintext passwords are not stored.
- Protected API routes require a valid JWT.
- Blog update and delete operations enforce author ownership on the server.
- JWTs are stored in browser storage (session storage by default, local storage when Remember Me is selected). This is convenient for a learning project but remains exposed to JavaScript running on the page. A hardened production design should consider Secure, HttpOnly, SameSite cookies and appropriate CSRF protection.
- Password reset is not implemented.
- Keep secrets in environment variables and rotate any credential that may have been exposed.
- The hosted service and database connection have been configured; re-run the health check and end-to-end flows after each deployment or environment change.

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm start` | Start the Express server |
| `npm run build` | Create the production frontend build |
| `npm run preview` | Preview the Vite build |
| `npm run lint` | Run the TypeScript type-check |
| `npm test` | Run the unit test suite |
| `npm run clean` | Remove generated build output |

---

Built by **MD. MINHAZUR RAHMAN FAHIM**.
