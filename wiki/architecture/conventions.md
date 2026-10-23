---
title: Conventions
status: draft
updated: 2026-10-24
---

# Conventions

## Folder layout (proposed)
```
app/
  login/page.tsx
  (dashboard)/                 route group with the sidebar layout
    layout.tsx                 SidebarProvider + AppSidebar + header
    page.tsx                   Dashboard (today overview)
    bookings/
      calendar/  timeline/  tables/  floor-plan/  waitlist/
    inventory/
      items/  movements/  batches/  low-stock/
    reports/
    settings/
      general/  tables/  users/  units/
components/
  ui/                          shadcn generated
  app-sidebar.tsx
  bookings/  inventory/  dashboard/
lib/
  auth.ts  db.ts  permissions.ts  money.ts  dates.ts
  data/                        read queries per module
  actions/                     server actions per module
  validation/                  zod schemas
prisma/
  schema.prisma  seed.ts
proxy.ts                       redirects signed-out users to /login
docker-compose.yml             local Postgres for development
wiki/                          this knowledge base
```
Verify route-group and layout behaviour against the Next 16 docs before building (see [tech-stack](tech-stack.md)).

## Money (IDR)
- Store as **integer Rupiah**. Never use floats.
- Display with `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })` → `Rp 125.000`.
- One helper `formatIDR()` in `lib/money.ts`.

## Dates & time
- Store in UTC (Postgres `timestamptz`). Display in the restaurant time zone, **`Asia/Jakarta`** (WIB; D-028).
- Display formats: `Sat, 24 Oct 2026`, `19:30` (24-hour).
- Booking times snap to the configured slot length.

## Quantities
- Use `Decimal` in the database and show up to 2–3 decimals with the unit: `2.5 kg`, `12 bottle`.

## Naming
- Code in English. Components in PascalCase, files in kebab-case.
- Enum values are UPPER_SNAKE (`NO_SHOW`). UI labels are Title Case ("No-show").

## Language
- English UI copy, short and plain. Status names exactly as in the [glossary](../glossary.md).

## Git branching
Decision D-040.

```
main  ──●───────────────────────●──────────   production (deployed to the VPS)
         \                     ↗ release PR
dev   ────●───●───────●───────●──────────────   integration / staging
               \     ↗ \     ↗
feature/…       ●──●     ●──●                  one branch per task
```

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Production | Only receives merges from `dev` (release PRs) or `hotfix/*`. Never commit directly. Tag releases `vX.Y.Z`. |
| `dev` | Integration | Default target for every PR. Must always build. |
| `feature/phase-<n>-<name>` | One branch per [roadmap](../roadmap.md) phase, e.g. `feature/phase-0-foundation`, `feature/phase-1-booking-core` | Branch from the latest `dev` once the previous phase is merged, and PR back into `dev`. A large phase may be split into several smaller feature PRs. |
| `feature/<short-name>` | Smaller work outside a phase, e.g. `feature/csv-export` | Branch from `dev` and PR back into `dev`. |
| `fix/<short-name>` | Bug fixes on `dev` | Same as feature. |
| `hotfix/<short-name>` | Urgent production fix | Branch from `main`, PR into `main`, then merge `main` back into `dev`. |
| `docs/<short-name>` | Wiki-only changes | PR into `dev`. |

### Rules
- **Changes reach `dev` and `main` only through pull requests.** Never push directly to either branch.
- One concern per branch and PR. Keep PRs reviewable; split a large phase into several PRs.
- Keep a branch current by merging `dev` into it (or rebasing before review). Resolve conflicts on the branch, never on `dev`.
- Delete the branch after its PR is merged.
- **Commits:** short imperative subject, e.g. "Add booking status badge". Explain *why* in the body when it isn't obvious.

### Pull request checklist
- [ ] Targets `dev` (or `main` only for a release PR or `hotfix/*`)
- [ ] Description covers what changed, why, and how it was tested
- [ ] `npm run lint` and `npm run build` pass
- [ ] Wiki updated in the same PR when a requirement or decision changes (page + [decisions](../decisions.md) + [log](../log.md))
- [ ] Database changes come with a Prisma migration

### Release flow
1. Open a PR from `dev` into `main` titled `Release vX.Y.Z` that lists the merged PRs.
2. After merging, tag `main` with `vX.Y.Z` and deploy to the VPS.
3. Versioning: each finished roadmap phase is a minor release (`v0.1.0` = Phase 0, `v0.2.0` = Phase 1…). Hotfixes bump the patch number.

### Recommended GitHub settings (owner)
- Protect `main` and `dev`: require a pull request before merging and block force-pushes and deletion.
- Set `dev` as the repository's default branch, so new PRs target it automatically.
