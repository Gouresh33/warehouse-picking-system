# Warehouse Order Picking Management System

A full-stack web application for an e-commerce warehouse. Supervisors create picking tasks and assign each one to a single staff member. Staff update the status of their own tasks, and supervisors monitor progress across the floor.

**Live demo**

- Frontend (Vercel): https://warehouse-picking-system.vercel.app
- Backend API (Render): https://warehouse-picking-system-dh84.onrender.com

> The backend runs on Render's free plan, which goes to sleep after 15 minutes without traffic. The first request after a quiet period can take about a minute.

**Demo accounts**

| Role | Email | Password |
|---|---|---|
| Supervisor | supervisor@test.com | 123456 |
| Staff | staff@test.com | 123456 |

## Features

- Staff and supervisor accounts with registration and login (JWT).
- Supervisors create orders and picking tasks, and assign each task to one staff member.
- A picking task can never be assigned to more than one staff member.
- Staff see only their own tasks and move them forward: assigned, in progress, completed.
- Supervisors see every task, filter by status, and view overall progress on a dashboard.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (jsonwebtoken), password hashing with bcryptjs |
| Frontend | React (Vite), React Router, Axios |
| Deployment | Render (backend), Vercel (frontend) |
| API testing | Postman collection (`warehouse-api-collection.json`) |

## Project structure

```
warehouse-picking-system
├── backend
│   ├── config/db.js               MongoDB connection
│   ├── controllers/               auth, order, task and staff logic
│   ├── middleware/
│   │   ├── authMiddleware.js      JWT check (protect) and supervisor-only check
│   │   └── ownership.js           only the assigned staff member may update a task
│   ├── models/                    Staff, Order, PickingTask (Mongoose schemas)
│   ├── routes/                    auth, orders, tasks, staff
│   └── server.js
├── frontend
│   └── src
│       ├── api.js                 Axios instance, reads VITE_API_URL
│       ├── AuthContext.jsx        login state
│       ├── ProtectedRoute.jsx     role-based page access
│       ├── components/            Navbar, StatusBadge, Avatar, PageHeader, Brand
│       └── pages/                 Login, TaskBoard, AssignTask, Dashboard, MyTasks
└── warehouse-api-collection.json  Postman collection
```

## Data model

**Staff**: `name`, `email` (unique), `password` (hashed), `role` (`supervisor` or `staff`).

**Order**: `orderNumber` (unique), `customerName`, `items[]` (`sku`, `name`, `quantity`), `status` (`pending`, `picking`, `completed`).

**PickingTask**: `order` (reference to Order, unique), `assignedTo` (reference to Staff, one value or null), `createdBy` (reference to Staff), `status` (`pending`, `assigned`, `in_progress`, `completed`), `notes`.

## Business rules

- **Single assignment.** `assignedTo` holds one staff member, and the `order` field has a unique index, so an order has exactly one picking task.
- **Assignment-conflict check.** Assigning runs one atomic update that only succeeds while `assignedTo` is still `null`. If the task already has an owner, the API returns `409 Conflict`.
- **Status flow.** `pending`, then `assigned`, then `in_progress`, then `completed`. Staff can only move a task one step forward.
- **Authorization.**
  - JWT middleware: every protected route needs `Authorization: Bearer <token>`.
  - Role-based middleware: supervisor-only routes return `403` for staff.
  - Ownership middleware: only the staff member a task is assigned to can change its status.

## API endpoints

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an account |
| POST | `/auth/login` | Public | Log in and receive a token |
| POST | `/orders` | Supervisor | Create an order |
| GET | `/orders` | Logged in | List orders |
| GET | `/orders/:id` | Logged in | Get one order |
| POST | `/tasks` | Supervisor | Create a picking task (optionally assigned) |
| GET | `/tasks?status=` | Logged in | List tasks. Supervisors see all, staff see their own |
| GET | `/tasks/:id` | Supervisor or assigned staff | Get one task |
| PATCH | `/tasks/:id/assign` | Supervisor | Assign a task (409 if already assigned) |
| PATCH | `/tasks/:id/status` | Assigned staff only | Move a task to the next status |
| DELETE | `/tasks/:id` | Supervisor | Delete a task |
| GET | `/tasks/summary/progress` | Supervisor | Counts per status and completion percentage |
| GET | `/staff` | Supervisor | List staff members (for the assign form) |

## Run locally

Requirements: Node.js 20 or newer, and a MongoDB Atlas cluster.

**Backend**

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=5001
MONGO_URI=<your MongoDB Atlas connection string, ending in /warehouse>
JWT_SECRET=<any long random text>
```

```bash
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5001
```

```bash
npm run dev
```

Open http://localhost:5173.

## Testing

Import `warehouse-api-collection.json` into Postman. Set the `baseUrl` collection variable to the local or live backend, then run the collection with the Runner. The login requests save the tokens automatically, and every request checks its expected status code (200, 201, 401, 403, 409).

## Deployment

- **Database:** MongoDB Atlas, with Network Access set to allow connections from Render.
- **Backend (Render web service):** root directory `backend`, build command `npm install`, start command `npm start`. Environment variables: `MONGO_URI` and `JWT_SECRET`. Render provides `PORT`.
- **Frontend (Vercel):** root directory `frontend`, Vite preset. Environment variable: `VITE_API_URL` set to the Render backend URL. `frontend/vercel.json` rewrites all routes to `index.html` so page refreshes work.

## Notes and possible improvements

- Registration lets the caller choose a role. This keeps the demo simple. A real system would let only supervisors create supervisor accounts.
- Tokens are stored in the browser's local storage and expire after one day.
- Ideas for later: pagination on lists, rate limiting on login, refresh tokens, and orders with several items per picking task view.
