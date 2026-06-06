# Klok

**Live app:** [https://klok-daily-tracker.netlify.app](https://klok-daily-tracker.netlify.app)

## 1. Project Title

**Klok — Plan your day. Own your reality.**

## 2. Project Overview

Klok is a full-stack productivity tracker built with Next.js 16. It helps you
plan your day in hourly time blocks, nest todos inside each block, track what
actually happens, and reflect on patterns over weeks and months.

The app is designed around real workflows — every input persists to a real
database, every status updates automatically when you check off todos, and
every analytics number is computed from actual data.

This README is structured to map directly to the project's requirements
checklist so reviewers can verify each item quickly.

---

## 3. Tech Stack Used

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| Authentication | Custom — `jose` (JWT) + `bcryptjs` (password hashing) + httpOnly cookies |
| Database | Neon (serverless PostgreSQL) |
| ORM | Prisma 7 with `@prisma/adapter-neon` (HTTP driver) |
| Fonts | `next/font/google` — Plus Jakarta Sans |
| Images | `next/image` — automatic optimization |
| Icons | Font Awesome |
| Deployment | Vercel |

---

## 4. Features Implemented

### Authentication
- Sign up with email + password + name (with default tag seeding on creation)
- Sign in with secure bcrypt password verification
- Sign out (clears httpOnly session cookie)
- Sessions via signed JWT (7-day expiry)
- Proxy (Next.js 16's renamed middleware) protects all dashboard routes

### Onboarding
- 2-step flow after sign-up
- Pick which activity tags to keep active — selection actually saves to DB
- Skippable

### Today's Log
- Hourly time blocks for any date
- Date navigation: prev / next arrows + date picker + URL-driven (`?date=YYYY-MM-DD`)
- Create block with optional todos, optional tag, and **date picker** (plan future days)
- Edit block via inline modal
- Delete block (cascades to its todos)
- Add todos inline beneath any block
- Toggle individual todo done / pending (auto-recomputes block status)
- Delete a todo
- **Mark a whole block done in one click** — works for blocks with or without todos
- Apply Template inline modal

### Time-aware Status Badges
- Blocks display smart badges based on current time + status:
  - `Now`, `Upcoming`, `Missed`, `Partial`, `Done ✓`, `Skipped`

### Tags
- Click to toggle active / inactive
- Add custom tags via built-in **emoji picker** (35+ emojis)
- Delete tags

### Templates
- Save today's blocks (with todos) as a reusable named template
- Apply a template to any future date
- Delete a template

### Analytics
- Three views via URL: `?view=week`, `?view=month`, `?view=year`
- Period navigation: prev / current / next arrows
- "Next" disabled at the current period
- **Week**: 7-day bar chart + best day / worst day + top tags
- **Month**: heatmap (color intensity = completion %) + month summary
- **Year**: 12 monthly average bars + best month
- Future days never count in best / worst / avg

### Dashboard
- Personalised greeting + streak hint
- Real stats: blocks completed today, productivity score, current streak
- Today's blocks preview (first 4 with smart status badges)
- 7-day mini chart

### Settings
- Update display name
- Change password (verifies current with bcrypt)
- Manage activity tags (add / toggle / delete)
- Delete account with strong native confirmation (cascades all data)

### Public Pages
- Production-style landing page with hero, how-it-works, features, philosophy, CTA, footer
- About page with live platform stats

---

## 5. How to Run Locally

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd klok

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in real values (see Section 6)
cp .env.example .env

# 4. Apply Prisma migrations to your Neon DB and generate the client
npx prisma migrate deploy
npx prisma generate

# 5. Start the dev server
npm run dev
```

The app starts on the default Next.js dev port.

### Optional — browse the database

```bash
npx prisma studio
```

Opens a Prisma Studio UI in your browser.

---

## 6. Environment Variables Required

A template is committed at `.env.example`. Copy it to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string. Required at build + runtime. |
| `JWT_SECRET` | Secret used to sign session JWTs. Any long random string (32+ chars). |

### Generating `JWT_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Why two files?

- `.env` — real secrets, gitignored, lives only on your machine and on Vercel
- `.env.example` — committed template showing what variables are needed (no secrets)

---

## 7. Database Setup Instructions

### Step 1 — Create a Neon project (free)

1. Sign up at [neon.com](https://neon.com)
2. Create a new project (any name)
3. From the project dashboard, copy the **connection string** — it looks
   like:
   ```
   postgresql://user:password@ep-…neon.tech/dbname?sslmode=require
   ```

### Step 2 — Add it to your `.env`

```
DATABASE_URL="postgresql://user:password@ep-...neon.tech/dbname?sslmode=require"
```

### Step 3 — Apply migrations to your Neon DB

This creates all the tables defined in `prisma/schema.prisma`:

```bash
npx prisma migrate deploy
```

This is what `migrate deploy` does:
- Reads every migration in `prisma/migrations/`
- Runs them against your Neon DB in order
- Skips any that have already been applied

### Step 4 — Generate the Prisma Client

```bash
npx prisma generate
```

This generates `src/generated/prisma/` — the type-safe TypeScript client
the app imports as `@/lib/db`.

### Step 5 — Verify it worked

Open Prisma Studio:

```bash
npx prisma studio
```

You should see 7 tables in the sidebar: `User`, `Tag`, `Block`, `Todo`,
`Template`, `TemplateBlock`, `TemplateTodo` — all empty until you sign up.

### Optional — change the schema

In active development, when you change `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev --name describe_your_change
```

This creates a new migration file and applies it.

---

## 8. Routes / Pages Included

### Public Routes (no auth required)

| Path | Page | Strategy |
|---|---|---|
| `/` | Landing — hero, features, how it works, CTA, footer | SSG |
| `/about` | About — platform stats refreshed hourly | ISR (1h) |
| `/sign-in` | Sign in form | SSG |
| `/sign-up` | Sign up form | SSG |

### Authenticated Routes (proxy redirects to `/sign-in` if not logged in)

| Path | Page | Strategy |
|---|---|---|
| `/onboarding` | 2-step setup after sign-up | SSG |
| `/dashboard` | Greeting, stats cards, today's blocks preview, week chart | SSR |
| `/today` | Hourly timeline for any date, add / edit / delete blocks and todos | SSR |
| `/today?date=YYYY-MM-DD` | Same page, different date | SSR |
| `/analytics` | Default Week view | SSR |
| `/analytics?view=week` | 7-day chart, best / worst day, top tags | SSR |
| `/analytics?view=month` | Heatmap + month summary | SSR |
| `/analytics?view=year` | Monthly average bars + best month | SSR |
| `/analytics?view=*&period=*` | Navigate previous / next periods | SSR |
| `/templates` | List templates, save today, apply to future date | SSR |
| `/recurring-blocks` | Placeholder — see "Assumptions" below | SSR |
| `/settings` | Profile, password, tags, danger zone | SSR |

### Special Files

| File | Purpose |
|---|---|
| `src/app/loading.tsx` | Root-level loading skeleton (shown during navigation) |
| `src/app/not-found.tsx` | Custom 404 |
| `src/proxy.ts` | Next.js 16 "Proxy" (formerly `middleware.ts`) — auth gate |

---

## 9. API Routes Included

The project demonstrates all four required HTTP methods.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/blocks?date=YYYY-MM-DD` | List the current user's blocks for the given date |
| `POST` | `/api/blocks` | Create a new block (with optional nested todos) |
| `PATCH` | `/api/blocks/[id]` | Partial update of a block (title, time, tag, status) |
| `DELETE` | `/api/blocks/[id]` | Delete a block (cascades to todos) |

### Consistent response shape

- **Success**: `{ data: ... }` with status 200 (or 201 for create)
- **Error**: `{ error: "human-readable message" }` with 4xx / 5xx

### HTTP status codes used

| Code | Meaning |
|---|---|
| 200 | Successful GET / PATCH / DELETE |
| 201 | Successful POST |
| 400 | Bad / missing input (e.g. invalid time format) |
| 401 | Not signed in |
| 404 | Resource not found OR doesn't belong to current user |
| 500 | Uncaught server error |

### Security: Ownership Checks

Every PATCH / DELETE first verifies the resource belongs to the current
user by filtering `userId` in the lookup query. If the resource doesn't
exist or belongs to someone else, a `404` is returned — never leaking
whether the ID exists for another user.

---

## 10. Server Actions Used

Every action is in `src/actions/` and marked with `"use server"`.

| Action | File | Purpose |
|---|---|---|
| `signUpAction` | `actions/auth.ts` | Form-driven sign up + default tag seeding |
| `signInAction` | `actions/auth.ts` | Form-driven sign in, sets session cookie |
| `signOutAction` | `actions/auth.ts` | Button-driven sign out, clears cookie |
| `addTagAction` | `actions/tags.ts` | Add a custom activity tag |
| `toggleTagAction` | `actions/tags.ts` | Flip a tag's `active` flag |
| `deleteTagAction` | `actions/tags.ts` | Delete a tag |
| `toggleTodoAction` | `actions/todos.ts` | Toggle a todo done / pending (auto-recomputes block status) |
| `addTodoAction` | `actions/todos.ts` | Add a todo to an existing block |
| `deleteTodoAction` | `actions/todos.ts` | Delete a todo |
| `setBlockStatusAction` | `actions/blocks.ts` | Manually mark a block done / not-done |
| `markAllTodosAction` | `actions/blocks.ts` | Mark every todo in a block done in one action |
| `saveTodayAsTemplateAction` | `actions/templates.ts` | Save today's blocks as a template (nested writes) |
| `applyTemplateAction` | `actions/templates.ts` | Duplicate template blocks onto a target date (`prisma.$transaction`) |
| `deleteTemplateAction` | `actions/templates.ts` | Delete a template (cascades) |
| `updateProfileAction` | `actions/account.ts` | Change display name |
| `updatePasswordAction` | `actions/account.ts` | Verify current password and set new one |
| `deleteAccountAction` | `actions/account.ts` | Delete user + all related data |
| `saveOnboardingTagsAction` | `actions/onboarding.ts` | Persist tag toggles from onboarding |

### Difference: Server Actions vs API Routes

Both are used deliberately to demonstrate when each pattern fits.

- **Server Actions** are used for in-app form submissions where the
  function is tightly coupled to a React form. The form passes the
  action to its `action={...}` prop and React handles serialisation,
  loading state, and revalidation. No HTTP boundary, no `fetch()`,
  no JSON parsing. Most app mutations live here.

- **API Routes** are used for the block CRUD (`/api/blocks/*`) because
  they expose a clean REST surface that could be consumed
  programmatically — a mobile app, an integration, an automation
  script — without needing a React form. They demonstrate all four
  required HTTP methods cleanly.

---

## 11. Rendering Strategies Used

Each page's source file has a comment at the top stating its strategy.
You can verify by running `npm run build` — the route table prints
explicit symbols (`○` Static / `●` ISR / `ƒ` Dynamic).

### SSR (Server-Side Rendering)

Used where the page shows **per-user data** and must run on every request.
The auth cookie also forces dynamic rendering.

- `/dashboard` — today's blocks, streak, week chart
- `/today` — timeline for any date
- `/analytics` — week / month / year stats
- `/templates` — user's templates
- `/recurring-blocks` — placeholder page
- `/settings` — profile, tags

### SSG (Static Site Generation)

Used for pages with **no per-request data** — generated once at build
time and served as static HTML.

- `/` — landing page (marketing copy)
- `/sign-in`, `/sign-up` — static auth forms
- `/onboarding` — static onboarding shell
- `/_not-found` — custom 404

### ISR (Incremental Static Regeneration)

Used for **public data that's identical for every visitor** and changes
slowly.

- `/about` — total users, blocks, todos completed
- Configured with `export const revalidate = 3600` (1 hour)
- The first visitor triggers a fresh render
- Subsequent visitors within 1 hour see the cached HTML instantly
- After 1 hour, the next visit triggers a background re-render

This pattern gives fast page loads with data that's never more than ~1
hour stale, all without hitting the DB on every page view.

---

## 12. Concepts from Class Covered

This project deliberately demonstrates each item from the class checklist:

- **File-based routing** — every URL maps to a folder under `src/app/`
- **Route groups** — `(auth)` and `(dashboard)` organise layouts without affecting URLs
- **Layouts** — root, auth, and dashboard layouts compose cleanly
- **Dynamic routes** — `/api/blocks/[id]` uses a dynamic segment with `await context.params`
- **`next/font`** — Plus Jakarta Sans loaded via `next/font/google`
- **`next/link`** — used for client-side navigation throughout
- **`next/image`** — landing hero illustration uses `<Image>` with `priority`
- **`next/navigation`** — `useRouter`, `usePathname`, `redirect`, `useActionState`
- **`loading.tsx`** — root-level loading skeleton
- **`not-found.tsx`** — custom 404
- **Server Components** — default for pages; pull DB data with top-level `await`
- **Client Components** — `"use client"` used only where needed (state, browser APIs, event handlers)
- **SSR** — dashboard, today, analytics, templates, settings, recurring-blocks
- **SSG** — landing, sign-in, sign-up, onboarding
- **ISR** — `/about` with `export const revalidate = 3600`
- **API Routes** — GET / POST / PATCH / DELETE under `/api/blocks`
- **Structured API responses** — consistent `{ data }` / `{ error }` envelope
- **HTTP status codes** — 200, 201, 400, 401, 404, 500 with appropriate semantics
- **Server Actions** — `"use server"`, `useActionState`, `.bind()` for action arguments
- **Database** — Prisma + Neon, migrations, nested writes, `prisma.$transaction`
- **Environment variables** — `.env` + `.env.example`, no secrets committed
- **Proxy (middleware)** — `src/proxy.ts` enforces auth on protected routes

---

## 13. Assumptions and Limitations

- **Single timezone (UTC).** All dates are stored and compared in UTC.
  The app does not adjust for the user's local timezone. A user in IST
  may see edge cases around midnight UTC. Fixing this requires storing
  a timezone on each user — out of scope for this version.

- **Recurrence engine is v2.** The `Block.recurrence` and
  `recurrenceEndDate` fields exist in the schema, but the engine that
  materialises future occurrences is not built. The Recurring Blocks
  page communicates this clearly and points users to Templates as the
  alternative.

- **Carry Forward not implemented.** Todos cannot be auto-rolled into
  the next day. This was originally scoped but cut to keep the project
  focused.

- **Mark Incomplete + comment not implemented.** The `TodoStatus` enum
  includes `INCOMPLETE` and the schema has a `comment` field, but the
  UI does not expose a way to set them. Todos can only be PENDING or
  DONE.

- **No password reset flow.** Sign-in supports email + password only.

- **No image uploads.** Profile avatars are gradient initials based on
  the user's name.

- **No charting library.** Analytics charts are pure CSS bars and a
  CSS-grid heatmap. Keeps the dependency footprint small for the
  assignment scope.

- **Onboarding day-start preference not persisted.** The day-start time
  picker UI was removed because we don't yet have a `dayStartTime`
  column on the user. Tag toggles in onboarding DO persist.

---

## Project Structure

```
src/
├── actions/                   # Server Actions ("use server")
│   ├── auth.ts                # sign up / sign in / sign out
│   ├── tags.ts                # CRUD on tags
│   ├── todos.ts               # toggle / add / delete + auto-status
│   ├── blocks.ts              # mark block / mark all todos done
│   ├── templates.ts           # save today / apply / delete
│   ├── account.ts             # profile / password / delete account
│   └── onboarding.ts          # save onboarding selections
├── app/
│   ├── (auth)/                # Route group — auth pages
│   │   ├── layout.tsx
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── onboarding/
│   ├── (dashboard)/           # Route group — protected app
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── today/
│   │   ├── analytics/
│   │   ├── templates/
│   │   ├── recurring-blocks/
│   │   └── settings/
│   ├── about/                 # ISR
│   ├── api/
│   │   └── blocks/
│   │       ├── route.ts       # GET, POST
│   │       └── [id]/route.ts  # PATCH, DELETE
│   ├── layout.tsx
│   ├── page.tsx               # Landing (SSG)
│   ├── loading.tsx
│   └── not-found.tsx
├── components/
│   ├── layout/DashboardShell.tsx
│   └── today/BlockModal.tsx
├── lib/
│   ├── auth.ts                # hashPassword, verify, sessions, getCurrentUser
│   ├── constants.ts
│   ├── db.ts                  # Prisma client singleton (Neon adapter)
│   ├── dates.ts
│   └── analytics-stats.ts
├── generated/prisma/          # Auto-generated Prisma client
└── proxy.ts                   # Next.js 16 "Proxy" (formerly middleware)
prisma/
├── schema.prisma
└── migrations/
prisma.config.ts               # Datasource config
```

---

## Database Schema Reference

| Model | Key fields |
|---|---|
| **User** | id, email (unique), name, password (bcrypt hash), createdAt, updatedAt |
| **Tag** | id, userId, name, emoji, active, createdAt |
| **Block** | id, userId, tagId (nullable), date, startTime, endTime, title, status, recurrence, recurrenceEndDate, createdAt, updatedAt |
| **Todo** | id, blockId, text, status, comment, completedLaterAt, createdAt, updatedAt |
| **Template** | id, userId, name, icon, iconColor, createdAt, updatedAt |
| **TemplateBlock** | id, templateId, tagId, startTime, endTime, title, createdAt |
| **TemplateTodo** | id, templateBlockId, text, createdAt |

### Enums

- `BlockStatus` — PLANNED, DONE, PARTIAL, SKIPPED
- `TodoStatus` — PENDING, DONE, INCOMPLETE
- `Recurrence` — NONE, DAILY, WEEKDAYS, WEEKLY, CUSTOM

### Cascade behavior

- Deleting a User cascades to their Tags, Blocks, and Templates
- Deleting a Block cascades to its Todos
- Deleting a Tag sets `tagId` to NULL on dependent Blocks and TemplateBlocks
- Deleting a Template cascades to its TemplateBlocks and TemplateTodos

---

## Deployment

Deployed live on **Netlify**: [https://klok-daily-tracker.netlify.app](https://klok-daily-tracker.netlify.app)

Steps to reproduce the deployment:

1. Push the repo to GitHub.
2. In Netlify, **Add new site** → **Import an existing project** → connect
   GitHub → pick the repo. Netlify auto-detects Next.js and installs
   `@netlify/plugin-nextjs`.
3. Under **Site settings → Environment variables**, add:
   - `DATABASE_URL` — Neon pooled connection string
   - `JWT_SECRET` — long random string (32+ chars)
   - `NODE_VERSION` — `20`
4. Override the **Build command** under **Build & deploy → Build settings**:
   ```
   npx prisma migrate deploy && npx prisma generate && next build
   ```
   This applies any pending migrations to Neon and regenerates the Prisma
   client on every deploy (since `src/generated/` is gitignored).
5. Trigger a deploy.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server with Turbopack |
| `npm run build` | Production build (prints the route table) |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npx prisma migrate dev --name <name>` | Create + apply a new migration |
| `npx prisma generate` | Regenerate the Prisma client |
| `npx prisma studio` | Open a UI to browse the DB |
