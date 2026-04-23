# Progress-Hub

A lightweight project management tool inspired by [OpenProject](https://www.openproject.org/). Manage projects, track work packages, drag tasks across a Kanban board, and invite teammates.

## Stack

- **Backend**: Node.js + Express + Prisma + PostgreSQL + JWT auth
- **Frontend**: React (Vite) + React Router + TanStack Query + @dnd-kit

## Features

- User registration / login (JWT)
- Create, edit, delete projects
- Invite members by email, assign tasks to them
- Work packages with title, description, status, priority, assignee, due date
- Kanban board with drag-and-drop (New / In Progress / Done)
- List view with filters

## Quick Start

Prerequisites: Node.js 20+, Docker (for PostgreSQL).

```bash
# 1. Install dependencies (root, server, client)
npm run install:all

# 2. Start PostgreSQL
npm run db:up

# 3. Configure server env
cp server/.env.example server/.env

# 4. Run migrations + seed demo data
npm run migrate
npm run seed

# 5. Start backend (:4000) and frontend (:5173) together
npm run dev
```

Open http://localhost:5173.

Demo account (after seeding):

- Email: `demo@example.com`
- Password: `demo1234`

## Project Layout

```
Progress-Hub/
├── docker-compose.yml
├── package.json              # root scripts (concurrently)
├── server/                   # Express API + Prisma
└── client/                   # React (Vite) SPA
```

## Notes

- Token is stored in `localStorage` on the client; sent as `Authorization: Bearer <jwt>`.
- Vite dev server proxies `/api` to `http://localhost:4000`.
- To reset the database, run `docker compose down -v` and re-run migrate + seed.
