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
