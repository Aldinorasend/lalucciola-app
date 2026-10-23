---
title: Roadmap
status: draft
updated: 2026-10-24
---

# Roadmap

Phases run in order. Each phase should end with something usable.

| Phase | Goal | Contents |
|---|---|---|
| 0. Foundation | App shell runs, login works | Install shadcn/ui, Prisma + Postgres, Auth.js credentials login, roles, [sidebar layout](modules/layout-sidebar.md), seed Owner user |
| 1. Booking core | Staff can take bookings | Tables/areas in [settings](modules/settings.md), create/edit booking, statuses, slot-capacity check, daily list/timeline, calendar day/week/month |
| 2. Tables & floor | Live view of the room | [Tables display](modules/floor-plan.md), floor plan (after the owner sends the mapping), walk-ins, waitlist |
| 3. Inventory core | Know what is in stock | Items, categories, units, stock movements (in / usage / waste / count), movement log with cost |
| 4. Freshness & alerts | Avoid stockouts and waste | Batches with expiry, expiry warnings, low-stock alerts |
| 5. Dashboard & reports | Overview for the owner | [Dashboard](modules/dashboard.md) today view, [reports](modules/reports.md) |
| Later | Automation | Menu items + recipes → automatic deduction (D-011); maybe suppliers/POs, multi-branch |

Blocked items: the floor-plan drawing in Phase 2 waits for the owner's table mapping (see [open questions](open-questions.md)).
