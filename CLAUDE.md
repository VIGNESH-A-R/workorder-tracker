# Work Order Tracker ("WorkFlow")

A full-stack demo app for tracking field service work orders — customers,
technicians, and the work orders that connect them — behind a login. It exists
as a scaffold for a live client demo: feature tickets are implemented on top of
this baseline via GitHub Issues (see "Development Loop" below), so keep changes
scoped and consistent with the patterns already here.

## Stack

- **Backend:** Node.js + Fastify (ESM, plain JavaScript, no TypeScript)
- **ORM/DB:** Prisma 6 + SQLite (`prisma db push`, no migration files)
- **Auth:** `@fastify/jwt` + `bcryptjs` (pure JS, no native build step)
- **API docs:** `@fastify/swagger` + `@fastify/swagger-ui` at `/docs`
- **Backend tests:** Vitest, using Fastify's `app.inject()` (no real HTTP server)
- **Frontend:** React + Vite (plain JavaScript/JSX), React Router, Tailwind CSS,
  lucide-react icons, react-hot-toast
- Backend runs on http://localhost:8000, frontend dev server on http://localhost:5173

## Structure

```
workorder-tracker/
  backend/
    prisma/
      schema.prisma            User, Customer, Technician, WorkOrder models
    src/
      server.js                 Fastify app factory (buildApp) + entrypoint
      plugins/
        prisma.js                decorates fastify.prisma (PrismaClient)
        auth.js                   registers @fastify/jwt, decorates fastify.authenticate
      routes/
        auth.js                   POST /auth/login, GET+PATCH /auth/me
        workOrders.js              /work-orders routes (customer+technician joined in)
        technicians.js             /technicians routes (+ computed workload)
        customers.js                /customers routes (+ work order count)
        users.js                    GET /users — scaffold only, no UI screen yet
      seed.js                    seeds 2 users, 5 customers, 3 technicians, ~10 work orders
    tests/
      globalSetup.js              pushes schema to a throwaway prisma/test.db
      workOrders.test.js          Vitest tests via app.inject(), auth-first
    package.json
  frontend/
    src/
      api.js                      fetch wrapper (http://localhost:8000), attaches
                                    the JWT, throws ApiError with .status
      auth.jsx                    AuthProvider + useAuth (current user, login/logout,
                                    updateProfile, token persistence in localStorage)
      App.jsx                     route definitions + inline ProtectedRoute
      main.jsx                    providers (router, auth, toaster)
      pages/
        Login.jsx
        Dashboard.jsx              KPI cards + work order table; "/" route
        WorkOrderDetail.jsx        full detail, customer/technician panels, status
                                    changer, static Activity empty state
        Technicians.jsx            per-technician cards with open/done workload
        Customers.jsx              table with expandable rows showing work orders
        Settings.jsx               current user's profile + change name/password
      components/
        AppShell.jsx               Sidebar + Topbar + main wrapper shared by all pages
        Sidebar.jsx                dark nav sidebar, active-link highlighting
        Topbar.jsx                 page title + user menu + logout
        StatCards.jsx              Open / Completed / Total KPI cards
        WorkOrderTable.jsx         table; row click navigates to detail, status
                                    dropdown uses stopPropagation so it doesn't
        WorkOrderModal.jsx         slide-over create form; customer/technician
                                    dropdowns sourced from /customers, /technicians
  .github/
    workflows/test.yml           CI: backend tests + frontend build
    ISSUE_TEMPLATE/demo-ticket.md
  .gitignore
  README.md
```

## Data model

- `Customer`: id, name, contactEmail?, phone?, address?
- `Technician`: id, name, phone?, specialty?
- `WorkOrder`: id, title, description?, customerId (FK), location?,
  technicianId? (FK, nullable), status (`New` / `Assigned` / `In Progress` /
  `Done`, default `New`), scheduledDate?, createdAt.
- `User`: id, username (unique), passwordHash, fullName, role. No self-service
  signup — users are seeded.

`GET /work-orders` and `GET /work-orders/:id` always join in `customer` and
`technician`. `GET /technicians` and `GET /customers` return a computed
aggregate (`workload` / `workOrderCount`) alongside the base fields.

## Auth

- `POST /auth/login` — `{username, password}` → `{token}`; 401 on bad credentials.
- `GET /auth/me` — current user, requires `Authorization: Bearer <token>`.
- `PATCH /auth/me` — update `fullName` and/or `password` (re-hashed on change).
- Every other route requires a valid JWT (enforced via a `preHandler` hook
  registered on each route plugin).
- Demo users (seeded automatically): `admin` / `Admin@123` (Administrator),
  `dispatcher` / `Dispatch@123` (Dispatcher). Roles are stored and returned but
  not yet used to gate any behavior.

## Known baseline gaps — intentional, do not fix without being asked

These exist on purpose as starting points for feature-ticket demos. Do not
"fix" them as a side effect of unrelated work; only touch them if an issue
explicitly asks for it:

1. `GET /work-orders/stats` computes `open` as the count of **all** work
   orders, including `Done` ones — marking something Done never reduces Open.
2. No `priority` field anywhere in the model, API, or UI.
3. `GET /work-orders` returns everything — no filtering by technician or
   status. The Technicians and Customers screens compute their own
   (differently-scoped) views server-side — that is not a filter on the main
   work order list, so it does not close this gap.
4. No real audit/activity logging anywhere. The "Activity" section on the work
   order detail page is a static empty state ("No activity yet") only.
5. `POST /work-orders` does minimal validation — an empty `title` or a
   `scheduledDate` in the past is accepted without error (the route's JSON
   schema deliberately does not require `title` or constrain `scheduledDate`).

No test in `tests/workOrders.test.js` asserts the "correct" behavior for any
of the above — keep it that way unless an issue asks you to close the gap.

## Running locally

**Backend** (from `backend/`):
```
npm install
npx prisma db push
npm run seed
npm run dev
```
API on http://localhost:8000, Swagger docs at http://localhost:8000/docs.

**Frontend** (from `frontend/`):
```
npm install
npm run dev
```
App on http://localhost:5173, expects the backend running on port 8000.

**Tests** (from `backend/`):
```
npm test
```
Vitest's `globalSetup` pushes the schema to a throwaway `prisma/test.db` before
the run and deletes it afterward — it never touches `prisma/dev.db`.

## Development Loop

This project is driven by GitHub Issues, not ad-hoc changes:

- Every change starts from a GitHub Issue number.
- Create a branch named `issue-<number>-<short-slug>` before making changes.
- Commit messages reference the issue, e.g. `Fix open-count bug (#3)`.
- Never commit directly to `main` — open a Pull Request and wait for GitHub
  Actions (`.github/workflows/test.yml`) to pass before merging.
- Keep changes scoped to what the issue describes; do not fix unrelated gaps
  (see "Known baseline gaps" above) as a drive-by.

## Coding conventions

- Keep it simple and readable — this is a demo codebase, not a production system.
  Prefer straightforward code over abstractions, config layers, or generic frameworks.
- Minimal dependencies. Don't add a package unless it's clearly needed.
- Backend: route files stay thin; Prisma calls happen directly in the route
  handler via `fastify.prisma` (no separate repository/service layer at this
  size). Route JSON schemas exist for Swagger and for shaping responses — they
  are deliberately permissive on request bodies per the gaps above. Nullable
  fields (and nullable FK ids like `technicianId`) must use `type: ["string",
  "null"]` / `["integer", "null"]` in body schemas — Fastify's AJV otherwise
  coerces a JSON `null` into `""` / `0` for a plain-typed field, which breaks
  "clear this optional field" requests silently.
- Prisma is pinned to the 6.x line — v7 removed the `datasource { url = ... }`
  schema syntax in favor of a `prisma.config.ts` file, which is unnecessary
  complexity for this scaffold. Don't upgrade to Prisma 7+ without adjusting
  `prisma/schema.prisma` and both plugin/test database-url wiring accordingly.
- `PrismaClient` accepts an optional `databaseUrl` override (see
  `plugins/prisma.js` and `buildApp({ databaseUrl })` in `server.js`) so tests
  can point at `prisma/test.db` without touching environment variables or the
  dev database.
- `@fastify/cors`'s default `methods` list is narrow (`GET,HEAD,POST`) — the
  explicit `methods` array in `server.js`'s CORS registration is required for
  PATCH requests to work from the frontend; don't remove it.
- `routes/users.js` (`GET /users`) isn't wired to any screen yet — it's a small,
  scoped scaffold for a future "manage users" ticket. Never expose `passwordHash`.
- Frontend: plain fetch via `src/api.js`, no state management library beyond
  React context for auth — local component state is enough for everything else.
  Styling is Tailwind utility classes; the palette/spacing/radius tokens live in
  `tailwind.config.js` — reuse them instead of introducing new ad-hoc values.
- The JWT secret in `plugins/auth.js` is a hardcoded demo value — fine for this
  scaffold, but flag it if an issue moves this toward anything resembling
  production.
- When implementing a feature ticket, make the smallest change that satisfies it
  and match the existing style rather than introducing a new pattern.
