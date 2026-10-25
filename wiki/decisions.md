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

**D-006 — Seating model combines tables + slot capacity + floor plan** · 2026-10-24 · Accepted (slot-capacity part superseded by D-039)
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

---
*2026-10-24: the owner accepted all proposed answers in [open-questions](open-questions.md). Recorded below.*

**D-017 — Slot length and dining duration defaults** · 2026-10-24 · Accepted (slot length superseded by D-038)
Defaults: 30-min slots and a 90-min dining duration. Both can be changed in Settings. → [settings](modules/settings.md)

**D-018 — Cover limit per slot is configurable per service period** · 2026-10-24 · Superseded by D-039
The owner enters the actual number in Settings. Owner and Manager can override it on a booking; Staff cannot.

**D-019 — Large groups can combine tables** · 2026-10-24 · Accepted
Only tables marked `combinable` can be combined, and a booking may span several tables.

**D-020 — No-show grace period: 15 min** · 2026-10-24 · Accepted
A booking still BOOKED 15 min after its start time is flagged **Late**. Staff then confirm No-show with one click. Nothing is marked No-show automatically.

**D-021 — Phone required for bookings, optional for walk-ins and the waitlist** · 2026-10-24 · Accepted

**D-022 — Units: kg, g, L, ml, pcs, bottle; no conversions in v1** · 2026-10-24 · Accepted
Each item is tracked in one unit.

**D-023 — Stock valuation: weighted average cost** · 2026-10-24 · Accepted
Batches still record their own unit cost, for reference and expiry tracking.

**D-024 — Item categories** · 2026-10-24 · Accepted
Dairy, Meat, Produce, Dry goods, Coffee (ingredients) and Soft drinks, Alcohol (beverages). Categories can be edited in Settings.

**D-025 — Expiry warning window: 3 days** · 2026-10-24 · Accepted
Configurable in Settings.

**D-026 — Stock counts happen ad hoc** · 2026-10-24 · Accepted
The app supports a stock count at any time and does not enforce a schedule.

**D-027 — Permission matrix confirmed** · 2026-10-24 · Accepted
As drafted, including: Staff don't see costs or stock value. → [roles-permissions](architecture/roles-permissions.md)

**D-028 — Time zone: Asia/Jakarta (WIB)** · 2026-10-24 · Accepted

**D-029 — Single location; no multi-branch support planned** · 2026-10-24 · Accepted

**D-030 — CSV export for reports and main lists** · 2026-10-24 · Accepted
Covers Bookings, Items and Stock movements.

**D-031 — Report metrics as proposed** · 2026-10-24 · Accepted
→ [reports](modules/reports.md)

**D-032 — Floor plan layout provided** · 2026-10-24 · Accepted
40 tables in 5 sections (1, 2, 3, 4, L), transcribed from the owner's screenshot. The screenshot's UI (time strip, Live toggle, zoom, side panel with filter and time window) is the pattern for the floor-plan screen. Seat counts are still estimates. → [floor-plan](modules/floor-plan.md)

**D-033 — Sections can be closed** · 2026-10-24 · Accepted
A section can be closed for a date or service period, and tables in it can't be booked while it is closed. This comes from the "section 4 closed" notice in the reference.

**D-034 — Opening hours set by the admin, 06:00–20:00 max** · 2026-10-24 · Accepted
The default is 06:00–20:00 every day. The admin can change the hours in Settings, but only within that range.

**D-035 — Hosting on a VPS** · 2026-10-24 · Accepted
The app and Postgres are self-hosted on a VPS. → [tech-stack](architecture/tech-stack.md#deployment-vps)

**D-036 — Seat mapping is configured later in Settings** · 2026-10-24 · Accepted
The transcribed table list (estimated seats, 402 + 1A + 401 combinable, the name "Section L") is used as seed data. The owner corrects seats, combinable tables and section names in Settings → Areas & tables. This does not block development.

**D-037 — 20:00 is the last booking time** · 2026-10-24 · Accepted (refines D-034)
Booking start times run from 06:00 to 20:00. A booking may start at 20:00 and run past it (dining duration). The admin can change the range in Settings, within 06:00–20:00.

**D-038 — 15-minute time slots** · 2026-10-24 · Accepted (supersedes the slot length in D-017)
Slots are 15 min, matching the reference screenshot. The dining duration default stays at 90 min.

**D-039 — No cover limit; book until the room is full** · 2026-10-24 · Accepted (supersedes D-018 and the slot-capacity part of D-006)
There is no per-slot cover cap. A booking is allowed whenever a free table (or combinable set of tables) fits the party at that time. Capacity comes from table availability alone.

**D-040 — Branching: main = production, dev = integration, feature branches** · 2026-10-24 · Accepted
`main` holds only released, production-ready code. `dev` is where finished work is integrated. Every roadmap phase, feature, fix and wiki change gets its own branch off `dev` and returns to it **only through a pull request**; nobody pushes directly to `dev` or `main`. A release is a PR from `dev` into `main`. → [conventions](architecture/conventions.md#git-branching)

**D-041 — Local dev database via Docker Compose** · 2026-10-24 · Accepted
Postgres 17 runs in Docker on port 5433, to avoid clashing with a locally installed Postgres on 5432. It mirrors the planned VPS setup (D-035). → [conventions](architecture/conventions.md#local-development)

**D-042 — Auth implementation** · 2026-10-24 · Accepted (implements D-015)
Auth.js v5 (beta.32) with the Credentials provider (email + bcrypt-hashed password) and JWT sessions that expire after 12 h; the role is stored in the token. `proxy.ts` only redirects signed-out visitors. Real checks run on the server through `lib/dal.ts` and the `RequirePermission` component. Inactive users can't sign in. → [tech-stack](architecture/tech-stack.md#auth--sessions)

**D-043 — Prisma pinned to 7.10 (stable)** · 2026-10-24 · Accepted
npm's `latest` tag points to a Prisma 8 release candidate. We stay on stable 7.10.1 with the `@prisma/adapter-pg` driver adapter, and upgrade deliberately in its own PR.

**D-044 — CI on every PR and push to dev/main** · 2026-10-24 · Accepted
GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests and build on Node 22 for pull requests and pushes to `dev` and `main`. A PR merges only when CI is green. Make the `Lint, typecheck, build` check required in branch protection. → [conventions](architecture/conventions.md#pull-request-checklist)

**D-045 — Sessions re-checked against the database** · 2026-10-24 · Accepted (refines D-042)
`getCurrentUser()` loads the user on every request and uses the database role. A deactivated user is sent to `/login` at once instead of keeping access until the 12 h cookie expires. Because that user still holds a cookie, `proxy.ts` no longer redirects signed-in visitors away from `/login`.

**D-046 — Phase 1 ships as three PRs; booking hours stored as minutes per weekday** · 2026-10-24 · Accepted
Phase 1 is split into 1a (settings: sections, tables, hours, slots), 1b (booking create/edit, statuses, availability) and 1c (timeline and calendar), so each PR stays reviewable. Booking hours are one row per weekday, stored as minutes after midnight in restaurant time; lunch/dinner periods aren't modelled until the owner asks for them. Re-running the seed only creates missing rows, so the owner's edits in Settings survive.

**D-047 — Double bookings prevented in the database transaction** · 2026-10-24 · Accepted
Saving a booking takes a Postgres advisory lock per chosen table (sorted, to avoid deadlocks), re-checks for overlapping BOOKED/SEATED bookings, then writes, all in one transaction. Two staff booking the same table at the same moment can't both succeed. Status changes only apply if the status hasn't changed in the meantime. Restaurant time is a fixed UTC+7 offset (Asia/Jakarta has no daylight saving), marked as a `shortcut:` in `lib/bookings.ts`.

**D-048 — Booking writes are tested against a real database** · 2026-10-24 · Accepted
`lib/booking-writes.ts` (lock, overlap check, write) has tests in `tests/db/` that run against Postgres: an overlapping booking is refused, an edit doesn't clash with itself, and of 10 simultaneous saves for one table exactly one wins. CI starts a Postgres service for them. Removing the lock makes the last test fail.

**D-049 — Section closures are whole days and refuse active bookings** · 2026-10-24 · Accepted (implements D-033)
The owner closes a section for a restaurant-local date in Settings. It can't be closed while it has BOOKED or SEATED bookings that day (move or cancel them first), so no guest is stranded. While closed, its tables can't be booked or take walk-ins, the booking picker crosses them out, the Tables page shows them as Closed, and the timeline marks the section. Closing per service period (lunch/dinner) isn't modelled. Closing and booking take the same per-table locks, and the closure check runs inside the locked booking write, so neither can slip past the other (`closeArea` and `writeBooking` in `lib/booking-writes.ts`, covered by `tests/db`).
