---
title: Tech Stack
status: confirmed
updated: 2026-10-24
---

# Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.4** (App Router) + React 19.3 | Already installed. See the warning below. |
| Language | TypeScript 5 | `strict` mode |
| Styling | **Tailwind CSS 4** | Already installed (`@tailwindcss/turbopack`) |
| UI kit | **shadcn/ui** (Radix + lucide-react) | See [ui-components](ui-components.md) |
| Database | **PostgreSQL** | Self-hosted on the VPS (D-035) |
| Hosting | **VPS** (D-035) | See [Deployment](#deployment-vps) |
| ORM | **Prisma** | Schema in `prisma/schema.prisma`; migrations committed |
| Auth | **Auth.js** (NextAuth v5) | Credentials provider (email + password, hashed). Role stored on `User`. |
| Forms / validation | react-hook-form + zod | Use the same zod schemas in server actions |
| Tables | TanStack Table (via shadcn data-table) | |
| Dates | date-fns (+ `@date-fns/tz` if needed) | Time zone per [conventions](conventions.md) |

## ⚠️ Next.js 16 is newer than most training data
Before writing any Next.js code, read the bundled docs in `node_modules/next/dist/docs/` (see the project's `AGENTS.md`). Docs relevant to this app:
- `01-app/01-getting-started/02-project-structure.md`: route groups, layouts
- `01-app/01-getting-started/16-proxy.md`: request interception (the old `middleware` concept). Use it for redirecting unauthenticated users.
- `01-app/02-guides/authentication.md`: sessions, authorization in server components and actions
- `01-app/02-guides/forms.md` and the server actions docs: mutations

Check every API against those docs. Don't rely on memory of Next 13–15.

## Data access pattern
- Server Components read data with Prisma directly, through a small `lib/data/*` layer.
- Mutations are **Server Actions** that (1) check the session and role, (2) validate with zod, (3) write with Prisma, (4) revalidate.
- Authorization is checked **on the server for every action**. Hiding a sidebar item is not security.

## Deployment (VPS)
Decision D-035: the app and Postgres run on the owner's VPS. Proposed setup (details to confirm when deploying):
- Next.js built with `output: "standalone"` and run as a Node process (systemd or Docker), behind **Nginx or Caddy** for HTTPS.
- PostgreSQL on the same VPS, bound to localhost only.
- `prisma migrate deploy` runs on every release.
- **Daily `pg_dump` backups** copied off the server.
- Check the Next 16 self-hosting guide in `node_modules/next/dist/docs/` before setting this up.

## Environment
- `DATABASE_URL`, `AUTH_SECRET` in `.env.local` (never committed).
- A seed script creates the first Owner account and sample tables and items for development.
