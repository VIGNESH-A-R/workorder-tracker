# Ticketing System

An AI-assisted ticketing demo app: pull tickets from Jira or GitHub, browse and
search them, classify a batch with AI (Ticket Triage), summarize a single
ticket with AI, and — for GitHub issues — see the branch/commits/PR already
linked to it, all behind a login. It exists as a scaffold for a live client
demo: feature tickets are implemented on top of this baseline via GitHub Issues
(see "Development Loop" below), so keep changes scoped and consistent with the
patterns already here.

## Stack

- **Backend:** Node.js + Fastify (ESM, plain JavaScript, no TypeScript)
- **ORM/DB:** Prisma 6 + SQLite (`prisma db push`, no migration files)
- **Auth:** `@fastify/jwt` + `bcryptjs` (pure JS, no native build step)
- **API docs:** `@fastify/swagger` + `@fastify/swagger-ui` at `/docs`
- **Backend tests:** Vitest, using Fastify's `app.inject()` (no real HTTP server)
- **Frontend:** React + Vite (plain JavaScript/JSX), React Router, Tailwind CSS,
  lucide-react icons, react-hot-toast
- **AI:** `openai` SDK pointed at an AI gateway (`AI_GATEWAY_API_KEY`,
  `AI_GATEWAY_BASE_URL`, `AI_GATEWAY_MODEL` env vars) — used by AI Analysis and
  Ticket Triage
- Backend runs on http://localhost:8000, frontend dev server on http://localhost:5173
- Both apps are organized **feature-first**: code is grouped by domain
  (`auth`, `jira`, `github`, `integrations`, `ai-analysis`, `ticket-optimization`,
  `issues`, `settings`, ...), not by technical layer. See "Structure" below.

## Structure

```
workorder-tracker/
  backend/
    prisma/
      schema.prisma            User, JiraCredential, GitHubCredential,
                                IntegrationSettings models
    src/
      server.js                 Fastify app factory (buildApp) + entrypoint
      plugins/                  cross-cutting infra, used by every feature
        prisma.js                decorates fastify.prisma (PrismaClient)
        auth.js                  registers @fastify/jwt, decorates fastify.authenticate
      features/
        auth/auth.routes.js       POST /auth/login, GET+PATCH /auth/me
        users/users.routes.js     GET /users — scaffold only, no UI screen yet
        jira/
          jira.routes.js           /jira/credentials (GET/PUT), /jira/projects,
                                    /jira/boards, /jira/sprints, /jira/issues,
                                    /jira/issues/:key, /jira/issues/:key/comments
                                    (POST), /jira/ticket-optimization — real
                                    live calls to Jira Cloud
          jiraClient.js             fetch wrapper around Jira's REST v3 API
                                    (Basic auth, error mapping to JiraApiError)
        github/
          github.routes.js         /github/credentials (GET/PUT), /github/issues,
                                    /github/issues/:number,
                                    /github/issues/:number/comments (POST),
                                    /github/dev-activity/:number — real live
                                    calls to the GitHub REST API
          githubClient.js           fetch wrapper around GitHub's REST API
                                    (Bearer token auth, Link-header pagination,
                                    error mapping to GitHubApiError)
        integrations/
          integrations.routes.js   GET/PUT /integrations/active — which
                                    connected provider ("jira" or "github")
                                    Issues, Ticket Triage, and AI Analysis
                                    currently read from
        ai-analysis/
          aiAnalysis.routes.js     POST /ai-analysis/issue — provider-agnostic;
                                    accepts one already-fetched issue (Jira or
                                    GitHub, same normalized shape) and returns
                                    an AI-generated HTML summary
        ticket-optimization/
          ticketOptimization.routes.js   POST /ticket-optimization/classify —
                                    provider-agnostic; classifies already-
                                    fetched, normalized tickets into L1/L2/L3
          ticketOptimizationService.js   shared classification prompt +
                                    OpenAI call, used by both this route and
                                    Jira's own /jira/ticket-optimization
      seed.js                    seeds the 2 demo users only
    tests/
      globalSetup.js              pushes schema to a throwaway prisma/test.db
      auth.test.js                 Vitest tests via app.inject(): login + /auth/me
    package.json
  frontend/
    src/
      App.jsx                     route definitions + inline ProtectedRoute
      main.jsx                    providers (router, auth, toaster)
      index.css                   Tailwind entry + thin-scrollbar styles
      shared/                     cross-feature building blocks
        api/client.js              fetch wrapper (http://localhost:8000), attaches
                                    the JWT, throws ApiError with .status
        components/
          AppShell.jsx              Sidebar + Topbar + main wrapper, used by
                                     every page. Takes `titleIcon` + `title`
                                     and forwards them to Topbar — no page
                                     renders its own big in-page `<h1>` heading
                                     anymore, the compact icon+bold-text title
                                     lives in the top bar instead (uniformly:
                                     Issues, Ticket Triage, Settings all do
                                     this the same way). `fullBleed` (used
                                     only by the Issue Workspace) skips the
                                     padded/scrolling `<main>` wrapper so its
                                     own panels can fill the remaining space
                                     edge to edge — the top-bar title still
                                     shows either way
          Sidebar.jsx                nav: Issues, Ticket Triage, Settings.
                                     Collapsible (~248px <-> ~64px, icon-only +
                                     hover tooltips when collapsed), persisted to
                                     localStorage, smooth width transition. The
                                     collapse toggle is a hamburger (lucide Menu)
                                     in the header row, to the left of the logo
                                     mark/wordmark — not a separate footer button;
                                     collapsed state hides the logo mark and
                                     wordmark, leaving just the hamburger — see
                                     "Design system" below
          Topbar.jsx                 renders the page's `icon` + `title` (left,
                                     bold) passed down from AppShell, + user
                                     menu (initials avatar) + logout (right)
          SearchInput.jsx, SearchableSelect.jsx
                                     generic toolbar pieces reused across
                                     Issues / Ticket Triage
          DevActivityCard.jsx        read-only branch/commits/PR summary for a
                                     GitHub issue, reused unchanged inside the
                                     Issue Workspace's activity section
      features/
        auth/
          auth.jsx                  AuthProvider + useAuth (current user, login/
                                     logout, updateProfile, token in localStorage)
          api.js                    login, getCurrentUser, updateCurrentUser
          pages/Login.jsx            two-panel branded login screen
          components/LoginIllustration.jsx
        settings/
          pages/Settings.jsx         two-column layout: a short section nav
                                     (Profile, Jira Integration, GitHub
                                     Integration, Active Ticket Source) on the
                                     left, the selected section's content in one
                                     hairline-bordered panel on the right,
                                     switched via client-side state (no reload).
                                     JiraIntegrationCard/GitHubIntegrationCard/
                                     ActiveSourceCard all take a `bare` prop that
                                     skips their own card wrapper when used here
        jira/
          api.js                    getJiraCredentials, saveJiraCredentials,
                                     getJiraProjects, getBoards, getSprints,
                                     getJiraIssues, getIssueDetail, postJiraComment
          components/JiraIntegrationCard.jsx
                                     site URL / email / API token form, rendered
                                     on the Settings page, never re-displays the
                                     saved token
        github/
          api.js                    getGitHubCredentials, saveGitHubCredentials,
                                     getGitHubIssues, getGitHubIssue, getDevActivity,
                                     postGitHubComment
          components/GitHubIntegrationCard.jsx
                                     owner / repo / personal access token form,
                                     rendered on the Settings page
        integrations/
          api.js                    getActiveProvider, setActiveProvider
          components/ActiveSourceCard.jsx
                                     "Active Ticket Source" toggle, rendered on
                                     the Settings page
        ai-analysis/
          api.js                    runAiAnalysis(issue) -> POST /ai-analysis/issue
        issues/                     promoted out of the old jira-only feature so
                                     both providers can share it; both `/issues`
                                     and `/issues/:key` render the SAME page
                                     component (pages/IssueWorkspace.jsx) — see
                                     "Screens" below for why
          dateFormat.js, issueRoute.js
                                     issueRoute.js encodes both providers' keys
                                     under one `/issues/:key` route (a leading
                                     "gh-" marks a GitHub issue number)
          components/IssuePills.jsx  status/priority pills; priority pill (and
                                     anything that keys off it) naturally no-ops
                                     when priority is null (always true for GitHub)
          components/IssueListRow.jsx     one card in the left list panel
          components/IssueListPanel.jsx   search (shared SearchInput) +
                                     FiltersPopover + the fetch/filter logic per
                                     provider (ported from the old Issues.jsx) +
                                     pagination (Jira only) + reports its visible
                                     results up to IssueWorkspace for auto-selection
          components/FiltersPopover.jsx   generic "Filters" button + overlay
                                     panel, groups the provider-specific filter
                                     controls behind one control
          components/TicketPanel.jsx      the right panel's one scrollable
                                     column — composes TicketDetailPanel on top
                                     and ActivitySection below it, stacked, NOT
                                     a separate side-by-side rail
          components/TicketDetailPanel.jsx  header (key/title + a StatusPill +
                                     PriorityPill — no stepper/pipeline visual),
                                     a plain read-only meta row (Assignee/
                                     Reporter/Created/Updated, all styled
                                     identically, no dropdown affordance on
                                     Assignee), collapsible Details/Description
                                     sections (pure content — no scroll wrapper
                                     of its own)
          components/ActivitySection.jsx   AI Analysis trigger + result
                                     (endpoint reused unchanged), DevActivityCard
                                     for GitHub issues, and a READ-ONLY comments
                                     feed in its own bordered card (matching
                                     DevActivityCard's border/radius/padding
                                     exactly) — no composer, posting isn't supported
          pages/IssueWorkspace.jsx   the two-panel Issue Workspace, rendered
                                     inside the same AppShell (`fullBleed`) as
                                     every other page — see "Screens" below
        ticket-optimization/        displayed in the UI as "Ticket Triage" (nav
                                     label, top-bar title, button text) — the
                                     folder, file, component, route, and API
                                     function names all deliberately still say
                                     "optimization"/"ticket-optimization"; only
                                     the user-visible text was renamed, to
                                     avoid unnecessary churn
          api.js                    runTicketOptimization (Jira flow),
                                     classifyTickets (provider-agnostic, used
                                     for the GitHub flow)
          components/OptimizationTicketCard.jsx
          pages/TicketOptimization.jsx   "/ticket-optimization" — visible to
                                     any logged-in user; Jira flow unchanged
                                     (project + sprint dropdowns), GitHub flow
                                     fetches every matching issue in the
                                     connected repo and classifies it directly.
                                     Summary cards: the first three carry an
                                     L1/L2/L3 tag in the same color/pill style
                                     as each ticket's level badge; the filter
                                     toolbar (project/sprint or state, plus the
                                     "Run Ticket Triage" button) is right-aligned
  .github/
    workflows/test.yml           CI: backend tests + frontend build
    ISSUE_TEMPLATE/demo-ticket.md
  .gitignore
  README.md
```

A feature folder holds whatever it needs (`pages/`, `components/`, `api.js`) —
don't force a subfolder that would only ever hold one file. Cross-feature
imports are fine and expected (e.g. `ticket-optimization` importing
`jira/api.js` for its project/sprint dropdowns) — feature-based here means
"grouped by domain," not "fully isolated." `shared/` is for things at least
three features use; a component used by only one page belongs inside that
feature.

## Data model

- `User`: id, username (unique), passwordHash, fullName, role. No self-service
  signup — users are seeded. Roles are stored and shown in the Topbar user
  menu, but nothing in the app currently gates a route or UI element on them —
  every screen is available to any logged-in user.
- `JiraCredential`: id, siteUrl, email, apiToken, accountId?, createdAt,
  updatedAt. Single row, always upserted at `id: 1` — there's only ever one
  Jira Cloud connection for this demo, not one per user.
- `GitHubCredential`: id, owner, repo, token, createdAt, updatedAt. Same
  single-row upsert pattern as `JiraCredential`.
- `IntegrationSettings`: id, activeProvider (`"jira"` | `"github"`, default
  `"jira"`). Single row — which connected provider Issues, Ticket Triage,
  and AI Analysis currently read from.

## Auth

- `POST /auth/login` — `{username, password}` → `{token}`; 401 on bad credentials.
- `GET /auth/me` — current user, requires `Authorization: Bearer <token>`.
- `PATCH /auth/me` — update `fullName` and/or `password` (re-hashed on change).
- Every other route requires a valid JWT (enforced via a `preHandler` hook
  registered on each feature's route file).
- Demo users (seeded automatically): `admin` / `Admin@123` (Administrator),
  `dispatcher` / `Dispatch@123` (Dispatcher).

## Screens

- **Login** (`/login`) — two-panel branded layout (indigo gradient marketing
  panel + centered sign-in card), no scroll at any viewport height.
- **Issue Workspace** (`/issues` and `/issues/:key`) — a single TWO-panel
  page (`features/issues/pages/IssueWorkspace.jsx`), not a list page that
  navigates to a separate detail page and not a three-panel layout either.
  Both routes render the same component, so picking a ticket updates the URL
  via `navigate()` without unmounting the page or re-fetching the list — only
  the right panel changes.
  - **Left panel** (`IssueListPanel`, fixed ~320px, own scroll): search + a
    "Filters" popover (Jira: project/status/sprint/priority; GitHub: state)
    reusing the old per-provider fetch logic, then the ticket list rendered as
    separated, individually-bordered cards (`IssueListRow`) — not a flush
    divided list. A friendly "connect in Settings" empty state replaces an
    error when the active provider (see Settings' "Active Ticket Source") has
    no credentials saved.
  - **Right panel** (`TicketPanel`, fills the rest, own scroll) — ONE
    scrollable column, not a second side-by-side rail: ticket details
    (`TicketDetailPanel` — header with a `StatusPill` next to the title, a
    plain read-only meta row, collapsible Details/Description) on top, then
    activity content (`ActivitySection` — "Run AI Analysis" with the same
    endpoint unchanged, `DevActivityCard` for GitHub issues only, and a
    READ-ONLY comments feed in its own card matching DevActivityCard's
    border/radius/padding) stacked below it behind a divider. There is no
    status stepper/pipeline visual and no comment composer — posting isn't
    supported.
  - **Auto-selection**: `IssueListPanel` reports its visible (post-filter)
    results up to `IssueWorkspace` any time that set actually changes — on
    first load, and again on every subsequent search/filter/pagination change
    — which auto-selects the first ticket (or shows "No issues match your
    filters" if the new set is empty). The one exception: if the page mounts
    on an explicit `/issues/:key` deep link (e.g. a `Link` from Ticket
    Optimization, a bookmark, a refresh), that first report is ignored so the
    deep link isn't immediately overridden. A manual click always sticks
    until the next results-change, since clicking alone doesn't trigger one.
  - This page uses the SAME `AppShell` (`Sidebar` + `Topbar`) as every other
    screen, via `fullBleed` mode so its two panels fill the space below the
    Topbar edge to edge instead of a padded, page-scrolling column. There is
    no separate top-bar treatment for this screen anymore — one shell,
    one nav, everywhere.
- **Ticket Triage** (`/ticket-optimization` — route/folder name unchanged, see
  the `ticket-optimization/` note in "Structure" above) — classifies open
  tickets into L1/L2/L3 with AI. Jira flow: pick a project + sprint. GitHub
  flow: pick a state (open/all) and classify every matching issue in the
  connected repo. The filter toolbar (whichever controls apply, plus "Run
  Ticket Triage") is right-aligned in its bar, not spread/left-aligned.
- **Settings** (`/settings`) — a short section nav (Profile, Jira Integration,
  GitHub Integration, Active Ticket Source) on the left; the selected
  section's content (profile form, `JiraIntegrationCard`,
  `GitHubIntegrationCard`, or `ActiveSourceCard`, each in `bare` mode) in one
  hairline-bordered panel on the right. Switching sections is client-side
  state, no reload. All the underlying save/test-connection/toast behavior
  is unchanged — only the surrounding layout/chrome is new.

This is the whole app — there is no dashboard, work order list, technician
list, or customer list, and no admin-only gating anywhere in it.

## Design system

One accent color app-wide: indigo, via the `primary` token in
`frontend/tailwind.config.js` (`DEFAULT: #5B5FEF`, `hover: #4B4FE0`). This is
the single source of truth for the brand color — Sidebar active state,
primary buttons, links, focus rings, the Issue Workspace's selected-card
accent, Settings' active-section/toggle states, and the Login page's
button/headline highlight/logo/illustration all
reference `bg-primary` / `text-primary` / `border-primary` / `ring-primary`
(and their `/opacity` or `-hover` variants) — never a hardcoded hex or a
one-off Tailwind hue class like `orange-*`/`amber-*`. If you need a new
brand-colored element, reach for the `primary` token; if you think you need a
second accent color, you probably don't — that's exactly the "scattered
colors" problem this token consolidation fixed (a previous pass had briefly
introduced a second `accent` token scoped to just the Issue Workspace; it was
folded back into `primary` once the whole app moved to one accent color).

Status/severity pill colors are a **separate, reserved palette**
(slate/blue/amber/red/green/purple — status pills, priority pills, Ticket
Optimization's L1/L2/L3 badges, DevActivityCard's PR-state pills) and must
never be changed to match `primary` — they encode meaning, not brand.

Otherwise: light sidebar (not dark), warm off-white surface (`#FFF8F3`),
warm-toned card shadows for most of the app. The Issue Workspace
(`/issues`, `/issues/:key`) keeps its own "Current" visual direction for
everything else about it — white panel content and hairline `border-slate-*`
borders instead of `shadow-card` — scoped to that page's own components
only; don't retrofit shadow-card styling into it, and don't pull its
hairline-border look into the rest of the app. Two deliberate exceptions
inside the Issue Workspace itself: floating overlays (`FiltersPopover`,
`SearchableSelect`'s dropdown) keep a shadow, since an overlay needs an
elevation cue a hairline border alone can't give it; and the comments card
in `ActivitySection` intentionally matches `DevActivityCard`'s own
`shadow-card`/`border-border`/`rounded-card` treatment directly above it
(same card, same source), rather than the hairline style used elsewhere on
that page.

## Running locally

**Backend** (from `backend/`):
```
npm install
npx prisma db push
npm run seed
npm run dev
```
API on http://localhost:8000, Swagger docs at http://localhost:8000/docs.
`npm run seed` only inserts the 2 demo users (idempotent — skips any username
that already exists).

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
the run and deletes it afterward — it never touches your seeded `prisma/dev.db`.

## Development Loop

This project is driven by GitHub Issues, not ad-hoc changes:

- Every change starts from a GitHub Issue number.
- Create a branch named `issue-<number>-<short-slug>` before making changes.
- Commit messages reference the issue, e.g. `Fix open-count bug (#3)`.
- Never commit directly to `main` — open a Pull Request and wait for GitHub
  Actions (`.github/workflows/test.yml`) to pass before merging.
- Keep changes scoped to what the issue describes; don't fix unrelated things
  as a drive-by.

## Coding conventions

- Keep it simple and readable — this is a demo codebase, not a production system.
  Prefer straightforward code over abstractions, config layers, or generic frameworks.
- Minimal dependencies. Don't add a package unless it's clearly needed; remove
  one once nothing imports it (e.g. `recharts` was dropped from the frontend
  when the dashboard charts that used it were removed).
- **Feature-first placement**: a new page, component, or endpoint belongs
  inside the feature it serves. Only promote something to `shared/` (frontend)
  once at least three features need it. Don't invent a new top-level feature
  for something that's really one screen's concern — check "Structure" above
  for where similar things already live.
- Backend: route files stay thin — Prisma calls happen directly in the route
  handler via `fastify.prisma` (no separate repository/service layer at this
  size). Route JSON schemas exist for Swagger and for shaping responses.
  Nullable fields must use `type: ["string", "null"]` / `["integer", "null"]`
  in body/response schemas — Fastify's AJV otherwise coerces a JSON `null`
  into `""` / `0` for a plain-typed field, which breaks "this field is
  optional/absent" cases silently.
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
- `JiraCredential.apiToken` and `GitHubCredential.token` are stored in
  plaintext, same tradeoff and same kind of comment as the JWT secret above —
  don't add encryption as a drive-by fix. `GET /jira/credentials` and
  `GET /github/credentials` must never return the token/apiToken in their
  response.
- Jira- and GitHub-calling routes (`jira.routes.js`, `github.routes.js`) never
  let an upstream failure crash the server or bubble up as a raw 500 —
  missing credentials is a 400 with a message pointing at Settings, and an
  upstream failure (auth, 404, network) is a 502/400 with the provider's own
  error message surfaced where possible. Follow this pattern for any future
  external-API integration.
- When implementing a feature ticket, make the smallest change that satisfies it
  and match the existing style rather than introducing a new pattern.
