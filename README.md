# La Lucciola

Internal staff web app for the La Lucciola restaurant/café: **Booking / Reservations** and **Inventory** in one site, behind a left sidebar.

Product requirements, decisions and conventions live in the [wiki](wiki/index.md). Read it before contributing.

## Stack
Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · PostgreSQL · Prisma 7 · Auth.js v5

## Getting started
Requires Node 22+ and Docker Desktop.

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET (npx auth secret)
npm run db:up               # Postgres 17 on localhost:5433
npm run db:migrate
npm run db:seed             # creates the Owner account from .env
npm run dev
```

Open http://localhost:3000 and sign in with the seed account from `.env`.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:migrate` | Create and apply migrations (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed the Owner (and optional demo users) |
| `npm run db:studio` | Browse the database |

## Contributing
`main` is production and `dev` is integration. Work on a branch off `dev` (`feature/…`, `fix/…`, `docs/…`) and open a pull request into `dev`. See [Git branching](wiki/architecture/conventions.md#git-branching).
