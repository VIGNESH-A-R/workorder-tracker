# WorkFlow — Work Order Tracker

A full-stack demo app for tracking field service work orders, behind a login.

- **Backend:** Node.js + Fastify + Prisma (SQLite) + JWT auth
- **Frontend:** React + Vite + React Router + Tailwind CSS

See `CLAUDE.md` for a fuller project brief, coding conventions, and the
GitHub-issue-driven development loop this project follows.

## Backend setup

```
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```

The API runs at http://localhost:8000. Swagger docs are at
http://localhost:8000/docs. `npx prisma db push` creates the SQLite file
(`prisma/dev.db`) from `prisma/schema.prisma` — no migration files needed for
this scaffold. `npm run seed` is idempotent: it only inserts demo data into
empty tables.

## Frontend setup

```
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173 and expects the backend to be running at
http://localhost:8000.

## Demo login credentials

| Role          | Username     | Password       |
|---------------|--------------|----------------|
| Administrator | `admin`      | `Admin@123`    |
| Dispatcher    | `dispatcher` | `Dispatch@123` |

These are also shown in a hint box on the login page itself.

## Running tests

```
cd backend
npm test
```

Vitest runs against a throwaway `prisma/test.db` (created and torn down
automatically) — it never touches your seeded `prisma/dev.db`.

## Quick start (both, from the project root)

```
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## Development loop

Every change starts from a GitHub Issue and lands via a Pull Request that
passes CI (`.github/workflows/test.yml`) — never commit directly to `main`.
See the "Development Loop" section in `CLAUDE.md` for the full workflow.
