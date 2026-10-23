---
title: Decision Log
status: confirmed
updated: 2026-10-24
---

# Decision Log

Newest at the bottom. Never delete an entry. To change a decision, add a new entry and mark the old one `Superseded by D-xxx`.

Format: **D-NNN — Title** · date · status (`Accepted` / `Superseded`) · decision · reason / notes.

---

**D-001 — One website, two modules, left sidebar** · 2026-10-24 · Accepted
Booking/Reservations and Inventory live in one Next.js app. Staff navigate with a left sidebar. → [layout-sidebar](modules/layout-sidebar.md)

**D-002 — Business type: restaurant / café** · 2026-10-24 · Accepted
Bookings are tables. Inventory is ingredients and drinks.

**D-003 — Staff-only internal app** · 2026-10-24 · Accepted
No public booking page. Staff enter phone, WhatsApp and walk-in bookings.

**D-004 — Three roles: Owner/Admin, Manager, Staff** · 2026-10-24 · Accepted
The exact permission matrix is still a draft. → [roles-permissions](architecture/roles-permissions.md)

**D-005 — English UI, IDR currency** · 2026-10-24 · Accepted

**D-006 — Seating model combines tables + slot capacity + floor plan** · 2026-10-24 · Accepted
Bookings are assigned to specific tables with capacities. Each time slot also has a cover limit. A visual floor plan shows the tables. The owner will provide the table mapping later. → [booking](modules/booking.md), [floor-plan](modules/floor-plan.md)

**D-007 — Booking views: calendar, timeline, tables display, floor plan** · 2026-10-24 · Accepted
Calendar has day, week and month views. Timeline shows the day per table. Tables display shows live table status.

**D-008 — Booking data kept minimal** · 2026-10-24 · Accepted
Guest name, phone, party size, date/time and table(s). No deposit, pre-order, special-request or customer-history features for now.

**D-009 — Booking statuses** · 2026-10-24 · Accepted
Booked → Seated → Completed, plus Cancelled and No-show. Walk-ins and a waitlist are supported. There is no pending/confirmed step.

**D-010 — Inventory item types: raw ingredients + beverages** · 2026-10-24 · Accepted
No supplies, packaging or equipment for now.

**D-011 — Manual stock-out now, recipes later** · 2026-10-24 · Accepted
Staff record usage, waste and stock counts by hand. The schema must allow MenuItem → RecipeLine deduction later without a rewrite.

**D-012 — Inventory features: low-stock alerts, expiry/batches, movement log with cost** · 2026-10-24 · Accepted
No suppliers or purchase orders for now.

**D-013 — Booking and Inventory are not linked** · 2026-10-24 · Accepted
The modules share only auth, layout and settings.

**D-014 — Sidebar: Dashboard, Bookings, Inventory, Reports, Settings** · 2026-10-24 · Accepted
User/role management lives inside Settings.

**D-015 — Stack: Next.js 16 + Postgres + Prisma + Auth.js** · 2026-10-24 · Accepted
Hosting is still open. → [tech-stack](architecture/tech-stack.md)

**D-016 — UI: clean neutral admin look with shadcn/ui** · 2026-10-24 · Accepted
Chosen to save time: use shadcn/ui components and blocks instead of hand-built UI. → [ui-components](architecture/ui-components.md)
