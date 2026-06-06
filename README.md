# DayLog

> A daily tracker built for honest reflection. Plan your day, track what
> actually happened, and watch the patterns over time.

DayLog is a full-stack Next.js 16 application built as a class project to
demonstrate file-based routing, layouts, multiple rendering strategies,
API routes, server actions, database integration with Prisma, and
authentication with sessions.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| UI | React 19 + Tailwind CSS v4 |
| Auth | Custom — `jose` (JWT) + `bcryptjs` (password hashing) + httpOnly cookies |
| Database | Neon (serverless PostgreSQL) |
| ORM | Prisma 7 with `@prisma/adapter-neon` (HTTP driver) |
| Font | `next/font` — Plus Jakarta Sans |
| Icons | Font Awesome |
| Deployment target | Vercel |

---

## Features Implemented

### Auth
- Sign up (with password hashing + default tag seeding)
- Sign in / sign out
- JWT sessions in httpOnly cookies
- Proxy (formerly middleware) protecting all dashboard routes

### Time Blocks (the core feature)
- Create / edit / delete time blocks for any date
- Add / edit / delete todos inside a block
- Toggle todos between PENDING and DONE
- Block status auto-computed from its todos (PLANNED / PARTIAL / DONE)
- Date navigation (`/today?date=YYYY-MM-DD`)

### Tags
- 9 default tags seeded on sign up (Sleep, Study, Work, etc.)
- Add custom tag with emoji + name
- Toggle tag active/inactive
- Delete tag
- Attach tags to blocks for color and grouping

### Templates
- Save today's blocks (and their todos) as a reusable template
- Apply a template to any target date — duplicates blocks and todos
- Delete a template

### Analytics
- Week view: last 7 days completion %, best/worst day, top tags
- Month view: 30-day heatmap + monthly summary
- Year view: 12-month average completion bars

### Dashboard
- "Welcome back" greeting with streak hint
- Live stats: blocks completed today, productivity score, current streak
- Today's blocks preview (first 4)
- 7-day mini chart

### Public Pages
- Landing page (`/`)
- About page (`/about`) — public stats via ISR

---

## Rendering Strategies

The project explicitly demonstrates all three strategies in the App Router.

| Route | Strategy | Why |
|---|---|---|
| `/` | **SSG** | Marketing page, no per-request data — generated at build time. |
| `/sign-in`, `/sign-up`, `/onboarding` | **SSG** | Static forms, no DB at render time. |
| `/about` | **ISR** | Public DB-backed stats (total users, total blocks). Cached HTML, regenerated every hour via `export const revalidate = 3600`. |
| `/dashboard`, `/today`, `/templates`, `/recurring-blocks`, `/settings`, `/analytics` | **SSR** | Per-user data + auth cookie. Cannot be cached, runs on every request. |
| `/api/*` | Dynamic (always server) | Route handlers — never cached. |

Each page file starts with a comment explaining the chosen strategy.

You can verify by running `npm run build` and looking at the route table
output (`○` static, `●` ISR, `ƒ` dynamic).

---

## API Routes

The project demonstrates the four HTTP methods required by the syllabus.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/blocks?date=YYYY-MM-DD` | List the current user's blocks for a date |
| `POST` | `/api/blocks` | Create a block (with optional todos) |
| `PATCH` | `/api/blocks/[id]` | Update a block (partial — only supplied fields) |
| `DELETE` | `/api/blocks/[id]` | Delete a block (cascades to its todos) |

### Response shape

All API routes return a consistent JSON envelope:

- **Success**: `{ data: ... }` with status 200 (or 201 for create)
- **Error**: `{ error: "human-readable message" }` with status 4xx / 5xx

### Status codes used

- `200` — successful GET/PATCH/DELETE
- `201` — successful POST
- `400` — bad/missing input
- `401` — not signed in
- `404` — resource not found OR doesn't belong to current user
- `500` — uncaught server error

### Ownership checks

Every PATCH/DELETE first verifies the resource belongs to the current user
(by filtering `userId` in the lookup query). If the resource doesn't exist
or belongs to someone else, a `404` is returned — without leaking whether
the id exists for another user.

---

## Server Actions

Server Actions are used for in-app form submissions where Server Actions
fit more naturally than HTTP endpoints.

| Action | File | Use |
|---|---|---|
| `signUpAction` | `src/actions/auth.ts` | Form-driven sign up + default tag seeding |
| `signInAction` | `src/actions/auth.ts` | Form-driven sign in, sets session cookie |
| `signOutAction` | `src/actions/auth.ts` | Button-driven sign out, clears cookie |
| `addTagAction` | `src/actions/tags.ts` | Add a custom activity tag |
| `toggleTagAction` | `src/actions/tags.ts` | Flip a tag's `active` flag |
| `deleteTagAction` | `src/actions/tags.ts` | Delete a tag |
| `toggleTodoAction` | `src/actions/todos.ts` | Toggle a todo's status (also recomputes parent block status) |
| `addTodoAction` | `src/actions/todos.ts` | Add a todo to an existing block |
| `deleteTodoAction` | `src/actions/todos.ts` | Delete a todo |
| `saveTodayAsTemplateAction` | `src/actions/templates.ts` | Save today's blocks as a template (nested write) |
| `applyTemplateAction` | `src/actions/templates.ts` | Duplicate template blocks onto a target date (`prisma.$transaction`) |
| `deleteTemplateAction` | `src/actions/templates.ts` | Delete a template (cascades to its blocks and todos) |

### Why Server Actions and not API Routes?

API Routes are an HTTP boundary — useful when external clients (mobile apps,
integrations) might want to call them. Server Actions are tightly coupled
to React forms and use the bind + form-action pattern. For in-app form
submissions where we never need an external client, Server Actions are
simpler.

### Why API Routes and not Server Actions?

The block CRUD endpoints (`/api/blocks` and `/api/blocks/[id]`) are
intentionally exposed as REST so the data could be consumed programmatically
later — and to clearly demonstrate GET/POST/PATCH/DELETE for the assignment.

---

## Database Schema

Models defined in `prisma/schema.prisma`:

- **User** — id, email (unique), name, password (hashed), timestamps
- **Tag** — id, userId, name, emoji, active, timestamps
- **Block** — id, userId, tagId (nullable), date, startTime, endTime, title, status, recurrence, recurrenceEndDate, timestamps
- **Todo** — id, blockId, text, status, comment, completedLaterAt, timestamps
- **Template** — id, userId, name, icon, iconColor, timestamps
- **TemplateBlock** — id, templateId, tagId, startTime, endTime, title, timestamps
- **TemplateTodo** — id, templateBlockId, text, timestamps

Enums:
- `BlockStatus` (PLANNED, DONE, PARTIAL, SKIPPED)
- `TodoStatus` (PENDING, DONE, INCOMPLETE)
- `Recurrence` (NONE, DAILY, WEEKDAYS, WEEKLY, CUSTOM)

Deletes cascade where appropriate — e.g. deleting a User removes all their
blocks, tags, and templates.

---

## Project Structure

```
daylog/
├── prisma/
│   ├── schema.prisma          # All models, enums, relations
│   └── migrations/            # Migration history
├── prisma.config.ts           # Datasource config (reads .env)
├── src/
│   ├── actions/               # Server Actions (auth, tags, todos, templates)
│   ├── app/
│   │   ├── (auth)/            # Route group: sign-in, sign-up, onboarding
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/       # Route group: protected app pages
│   │   │   ├── layout.tsx     # Sidebar + topbar (Server Component → DashboardShell)
│   │   │   ├── dashboard/
│   │   │   ├── today/
│   │   │   ├── analytics/
│   │   │   ├── templates/
│   │   │   ├── recurring-blocks/
│   │   │   └── settings/
│   │   ├── about/             # Public ISR page
│   │   ├── api/
│   │   │   └── blocks/
│   │   │       ├── route.ts       # GET, POST
│   │   │       └── [id]/route.ts  # PATCH, DELETE
│   │   ├── layout.tsx         # Root layout (font, globals)
│   │   ├── page.tsx           # Landing
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   └── loading.tsx
│   ├── components/
│   │   ├── layout/DashboardShell.tsx    # Client component for sidebar interactivity
│   │   └── today/BlockModal.tsx         # Add/edit block modal
│   ├── lib/
│   │   ├── auth.ts            # hashPassword, verify, sessions, getCurrentUser
│   │   ├── constants.ts       # DAY_START_TIMES, DEFAULT_TAGS
│   │   ├── db.ts              # Prisma client singleton (Neon adapter)
│   │   ├── dates.ts           # Date helpers
│   │   └── analytics-stats.ts # Pure aggregation helpers
│   ├── generated/prisma/      # Auto-generated Prisma client (don't edit)
│   └── proxy.ts               # Next.js 16 "Proxy" (formerly middleware)
├── .env                       # Local secrets — NOT committed
├── .env.example               # Template for required env vars — committed
└── package.json
```

---

## Running Locally

### 1. Clone and install

```bash
git clone <your-repo-url>
cd daylog
npm install
```

### 2. Set up a Neon database

1. Create a free account at [neon.com](https://neon.com)
2. Create a new project (any name)
3. Copy the **connection string** from the project dashboard
   (it looks like `postgresql://user:password@ep-…neon.tech/dbname?sslmode=require`)

### 3. Create your `.env` file

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` and set:

```
DATABASE_URL="<your Neon connection string>"
JWT_SECRET="<any long random string, 32+ chars recommended>"
```

You can generate a random JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Apply migrations

```bash
npx prisma migrate deploy   # runs the migration SQL against your Neon DB
npx prisma generate         # builds the TypeScript client
```

(In active development, use `npx prisma migrate dev --name <change>` instead.)

### 5. Run the dev server

```bash
npm run dev
```

App is now live at [http://localhost:3000](http://localhost:3000).

### 6. (Optional) Browse your DB

```bash
npx prisma studio
```

Opens a UI at [http://localhost:5555](http://localhost:5555) where you can
view and edit DB rows directly.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string. Required at build and runtime. |
| `JWT_SECRET` | Secret used to sign session JWTs. Any long random string — keep it private. Changing it invalidates all existing sessions. |

`.env.example` is committed to the repo as a template. `.env` is gitignored.

---

## Concepts from Class Covered

This project demonstrates the following concepts as required by the
assignment:

- **File-based routing** — every URL maps to a folder under `src/app/`.
- **Route groups** — `(auth)` and `(dashboard)` organize layouts without
  affecting URLs.
- **Layouts** — root, auth, and dashboard layouts compose nicely.
- **Dynamic routes** — `/api/blocks/[id]` uses a dynamic segment with `await context.params`.
- **`next/font`** — Plus Jakarta Sans loaded via `next/font/google`.
- **`next/link`** — used for client-side navigation everywhere.
- **`next/navigation`** — `useRouter`, `usePathname`, `redirect`, `useActionState`.
- **`loading.tsx`** — root-level loading skeleton.
- **`not-found.tsx`** — custom 404 page.
- **Server Components** — default for all pages; pull DB data with `await`.
- **Client Components** — `"use client"` directive used only where needed
  (interactivity, state, browser APIs).
- **SSR** — most dashboard pages, see Rendering Strategies table.
- **SSG** — landing + auth pages.
- **ISR** — `/about` with `export const revalidate = 3600`.
- **API Routes** — GET / POST / PATCH / DELETE under `/api/blocks`.
- **Structured API responses** — consistent `{ data }` / `{ error }` envelope.
- **HTTP status codes** — 200, 201, 400, 401, 404, 500.
- **Server Actions** — `"use server"`, `useActionState`, `.bind()` pattern.
- **Database** — Prisma + Neon, migrations, nested writes, `$transaction`.
- **Environment variables** — `.env` + `.env.example`, no secrets committed.
- **Proxy (middleware)** — `src/proxy.ts` enforces auth on protected routes
  and redirects authenticated users away from auth pages.

---

## Assumptions and Limitations

- **Single timezone (UTC).** All dates are stored and compared in UTC. The
  app does not adjust for the user's local timezone. A user in IST setting
  up at midnight may see "today" slip by a few hours either side. Fixing
  this requires a `timezone` column on the User and consistent conversion
  throughout — out of scope for the assignment.
- **No password reset.** The Sign In page shows "Forgot password?" but the
  link is not wired up.
- **No `Recurrence` engine.** The `Block.recurrence` field exists in the
  schema, but the Today's Log page only shows blocks explicitly stored on
  the requested date. There is no background job materializing future
  recurring instances.
- **No carry-forward implementation.** UI placeholder exists; underlying
  logic not built.
- **No `Mark as INCOMPLETE` flow with comment.** Schema supports it; UI
  uses only PENDING ↔ DONE.
- **No charts library.** Analytics renders bars and a heatmap with raw
  CSS — clean enough for the assignment, no dependency added.
- **No image uploads.** Profile avatars are gradient initials only.
- **No deletion confirmation modals.** Tag/template/todo deletes are
  immediate. (Block deletion uses a native `confirm()` dialog.)
- **Single Prisma generator output.** The generated client is written to
  `src/generated/prisma` and imported via the `@/` alias — different from
  the older `@prisma/client` convention.

---

## Deployment

The project is configured to deploy on **Vercel** with zero config.

1. Push the repo to GitHub.
2. In Vercel, "New Project" → import the repo.
3. Add `DATABASE_URL` and `JWT_SECRET` under **Project Settings → Environment Variables**
   (set them for Production, Preview, and Development).
4. Deploy.
5. After the first deploy, Vercel will run `prisma migrate deploy` only if
   you wire it up — easiest is to set the build command to:

   ```
   npx prisma migrate deploy && npx prisma generate && next build
   ```

   in **Project Settings → Build & Development Settings → Build Command**.
   This applies any pending migrations to your Neon DB during each deploy.

---

## Scripts

- `npm run dev` — start the Next.js dev server with Turbopack
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — ESLint
- `npx prisma migrate dev --name <name>` — create + apply a new migration
- `npx prisma generate` — regenerate the Prisma client
- `npx prisma studio` — open a UI to browse the DB

---

## License

This is a learning project. No license claim — please don't ship it as-is
for production use without addressing the limitations above.
