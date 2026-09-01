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
  lucide-react icons, react-hot-toast, recharts (dashboard charts)
- Backend runs on http://localhost:8000, frontend dev server on http://localhost:5173
- Both apps are organized **feature-first**: code is grouped by domain
  (`work-orders`, `technicians`, `customers`, `auth`, ...), not by technical
  layer. See "Structure" below.

## Structure

```
workorder-tracker/
  backend/
    prisma/
      schema.prisma            User, Customer, Technician, WorkOrder models
    src/
      server.js                 Fastify app factory (buildApp) + entrypoint
      plugins/                  cross-cutting infra, used by every feature
        prisma.js                decorates fastify.prisma (PrismaClient)
        auth.js                  registers @fastify/jwt, decorates fastify.authenticate
      features/
        auth/auth.routes.js       POST /auth/login, GET+PATCH /auth/me
        work-orders/workOrders.routes.js   /work-orders (customer+technician joined in)
        technicians/technicians.routes.js  /technicians (+ computed workload)
        customers/customers.routes.js      /customers (+ work order count)
        users/users.routes.js              GET /users — scaffold only, no UI screen yet
        jira/
          jira.routes.js           /jira/credentials (GET/PUT), /jira/projects,
                                    /jira/issues — real live calls to Jira Cloud
          jiraClient.js             fetch wrapper around Jira's REST v3 API
                                    (Basic auth, error mapping to JiraApiError)
      seed.js                    seeds 2 users, 5 customers, 3 technicians, ~10 work orders
    tests/
      globalSetup.js              pushes schema to a throwaway prisma/test.db
      workOrders.test.js          Vitest tests via app.inject(), auth-first
    package.json
  frontend/
    src/
      App.jsx                     route definitions + inline ProtectedRoute
      main.jsx                    providers (router, auth, toaster)
      index.css                   Tailwind entry + thin-scrollbar styles
      shared/                     cross-feature building blocks
        api/client.js              fetch wrapper (http://localhost:8000), attaches
                                    the JWT, throws ApiError with .status
        hooks/useTableControls.js  search + sort + pagination + optional dropdown
                                    filter, shared by every data table
        components/
          AppShell.jsx              Sidebar + Topbar + main wrapper, used by every page
          Sidebar.jsx                nav: Dashboard, Work Orders, Technicians,
                                     Customers, Settings — active-link highlighting
          Topbar.jsx                 page title + user menu (initials avatar) + logout
          SearchInput.jsx, SortableHeader.jsx, Pagination.jsx
                                     generic table-toolbar pieces reused across
                                     Work Orders / Technicians / Customers
      features/
        auth/
          auth.jsx                  AuthProvider + useAuth (current user, login/
                                     logout, updateProfile, token in localStorage)
          api.js                    login, getCurrentUser, updateCurrentUser
          pages/Login.jsx            two-panel branded login screen
          components/LoginIllustration.jsx
        dashboard/
          pages/Dashboard.jsx        "/" — KPI cards + charts + Recent Work Orders,
                                     no table, no create button
          components/
            StatCards.jsx            Open / Completed / Total KPI cards
            StatusChart.jsx          recharts donut: work orders by status
            TechnicianChart.jsx      recharts bar: work orders by technician
            RecentWorkOrders.jsx     latest 5, "View all" -> /work-orders
        work-orders/
          api.js                    getWorkOrders, getWorkOrder, getStats,
                                     createWorkOrder, updateWorkOrder
          pages/
            WorkOrders.jsx           "/work-orders" — full table, customer filter
                                     (left) + search (right), "New Work Order"
            WorkOrderDetail.jsx      full detail, customer/technician panels,
                                     status changer, static Activity empty state
          components/
            WorkOrderTable.jsx       search/sort/pagination/customer-filter table;
                                     row click -> detail, status select stopPropagation
            WorkOrderModal.jsx       slide-over create form; customer/technician
                                     dropdowns sourced from those features' api.js
        technicians/
          api.js                    getTechnicians, getTechnician, createTechnician
          pages/Technicians.jsx      searchable/sortable table + workload column
        customers/
          api.js                    getCustomers, getCustomer, createCustomer
          pages/Customers.jsx        searchable/sortable table, expandable rows
        settings/
          pages/Settings.jsx         current user's profile + change name/password
                                     + renders JiraIntegrationCard
        jira/
          api.js                    getJiraCredentials, saveJiraCredentials,
                                     getJiraProjects, getJiraIssues
          components/JiraIntegrationCard.jsx
                                     site URL / email / API token form, rendered
                                     on the Settings page, never re-displays the
                                     saved token
          pages/Issues.jsx           "/admin/issues" — Administrator-only; project +
                                     status filters (left) and search (right), all
                                     server-side against live Jira data; friendly
                                     empty state linking to Settings when not
                                     connected yet
  .github/
    workflows/test.yml           CI: backend tests + frontend build
    ISSUE_TEMPLATE/demo-ticket.md
  .gitignore
  README.md
```

A feature folder holds whatever it needs (`pages/`, `components/`, `api.js`) —
don't force a subfolder that would only ever hold one file. Cross-feature
imports are fine and expected (e.g. `work-orders` components importing
`customers/api.js` for a dropdown) — feature-based here means "grouped by
domain," not "fully isolated." `shared/` is for things at least three features
use; a component used by only one page belongs inside that feature.

## Data model

- `Customer`: id, name, contactEmail?, phone?, address?
- `Technician`: id, name, phone?, specialty?
- `WorkOrder`: id, title, description?, customerId (FK), location?,
  technicianId? (FK, nullable), status (`New` / `Assigned` / `In Progress` /
  `Done`, default `New`), scheduledDate?, createdAt.
- `User`: id, username (unique), passwordHash, fullName, role. No self-service
  signup — users are seeded.
- `JiraCredential`: id, siteUrl, email, apiToken, createdAt, updatedAt. Single
  row, always upserted at `id: 1` — there's only ever one Jira Cloud connection
  for this demo, not one per user.

`GET /work-orders` and `GET /work-orders/:id` always join in `customer` and
`technician`. `GET /technicians` and `GET /customers` return a computed
aggregate (`workload` / `workOrderCount`) alongside the base fields.

## Auth

- `POST /auth/login` — `{username, password}` → `{token}`; 401 on bad credentials.
- `GET /auth/me` — current user, requires `Authorization: Bearer <token>`.
- `PATCH /auth/me` — update `fullName` and/or `password` (re-hashed on change).
- Every other route requires a valid JWT (enforced via a `preHandler` hook
  registered on each feature's route file).
- Demo users (seeded automatically): `admin` / `Admin@123` (Administrator),
  `dispatcher` / `Dispatch@123` (Dispatcher). Roles are stored and returned;
  the one place they currently gate anything is `role === "Administrator"` —
  used both to show/hide the sidebar's Admin section and, more importantly,
  by `AdminRoute` in `App.jsx` to actually redirect non-Administrators away
  from `/admin/issues` (not just hide the link).

## Screens

- **Login** (`/login`) — two-panel branded layout (orange gradient marketing
  panel + centered sign-in card), no scroll at any viewport height.
- **Dashboard** (`/`) — overview only: KPI cards, a status donut chart, a
  per-technician bar chart, and a "Recent Work Orders" panel (latest 5). No
  table and no "New Work Order" button live here — see Work Orders.
- **Work Orders** (`/work-orders`) — the full table: customer filter (left) +
  search (right) above it, sortable columns, pagination, row click → detail,
  and the "New Work Order" modal trigger.
- **Work Order Detail** (`/work-orders/:id`) — full fields, customer/technician
  panels, status changer, and a static "Activity" empty state.
- **Technicians** (`/technicians`) / **Customers** (`/customers`) — searchable,
  sortable tables (Customers rows expand to show that customer's work orders).
- **Settings** (`/settings`) — current user's profile + change name/password,
  plus the Jira Integration card (connect/reconnect Jira Cloud).
- **Issues** (`/admin/issues`, Administrator-only) — live Jira Cloud issues:
  project + status dropdowns (left), search (right), all filtering done
  server-side via `GET /jira/issues`. Shows a "connect Jira in Settings"
  empty state instead of an error when no credentials are saved yet.

## Design system

Warm orange theme (primary `#F97316`, hover `#EA580C`), light sidebar (not
dark), warm off-white surface (`#FFF8F3`), warm-toned card shadows. Status
pill colors are a **separate, reserved palette** (slate/blue/amber/green) and
must never be changed to match the orange re-theme — see "Known baseline gaps"
below; orange is a UI accent, never a status color. Tokens live in
`frontend/tailwind.config.js` — reuse them instead of introducing new ad-hoc
color values.

## Known baseline gaps — intentional, do not fix without being asked

These exist on purpose as starting points for feature-ticket demos. Do not
"fix" them as a side effect of unrelated work; only touch them if an issue
explicitly asks for it:

1. `GET /work-orders/stats` computes `open` as the count of **all** work
   orders, including `Done` ones — marking something Done never reduces Open.
2. No `priority` field anywhere in the model, API, or UI.
3. `GET /work-orders` returns everything — no filtering by technician or
   status. The Work Orders screen's customer filter and search are
   client-side only, on already-loaded data; they do not add a server-side
   filter, so this gap stays open. The Technicians and Customers screens
   compute their own (differently-scoped) views server-side — also not a
   filter on the main work order list.
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
- **Feature-first placement**: a new page, component, or endpoint belongs
  inside the feature it serves. Only promote something to `shared/` (frontend)
  once at least three features need it. Don't invent a new top-level feature
  for something that's really one screen's concern — check "Structure" above
  for where similar things already live.
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
- `features/users/users.routes.js` (`GET /users`) isn't wired to any screen
  yet — it's a small, scoped scaffold for a future "manage users" ticket.
  Never expose `passwordHash`.
- Frontend: fetch via `shared/api/client.js`'s `request()`, called from each
  feature's own `api.js` — don't call `request()` directly from a component.
  No state management library beyond React context for auth — local component
  state is enough for everything else. Styling is Tailwind utility classes;
  the palette/spacing/radius tokens live in `tailwind.config.js` — reuse them
  instead of introducing new ad-hoc values.
- The JWT secret in `plugins/auth.js` is a hardcoded demo value — fine for this
  scaffold, but flag it if an issue moves this toward anything resembling
  production.
- `JiraCredential.apiToken` is stored in plaintext, same tradeoff and same
  kind of comment as the JWT secret above — don't add encryption as a
  drive-by fix. `GET /jira/credentials` must never return the token in its
  response, only `{ siteUrl, email, connected }`.
- Jira-calling routes (`jira.routes.js`) never let an upstream Jira failure
  crash the server or bubble up as a raw 500 — missing credentials is a 400
  with a message pointing at Settings, and a Jira-side failure (auth, 404,
  network) is a 502/400 with Jira's own error message surfaced where
  possible. Follow this pattern for any future external-API integration.
- When implementing a feature ticket, make the smallest change that satisfies it
  and match the existing style rather than introducing a new pattern.
