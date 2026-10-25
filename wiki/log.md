---
title: Wiki Log
status: confirmed
updated: 2026-10-24
---

# Wiki Log

Append-only, newest at the bottom. One line per change: `YYYY-MM-DD — what changed — why`.

- 2026-10-24 — Wiki created with all pages — captured the owner's initial answers about booking, inventory, roles, stack (Next.js 16 + Postgres + Prisma + Auth.js) and UI (shadcn/ui).
- 2026-10-24 — The owner accepted all proposed answers. Added D-017 to D-031; updated the booking, inventory, reports, settings, roles-permissions, data-model, conventions and overview pages; open questions trimmed to table mapping, opening hours, cover limit value and hosting.
- 2026-10-24 — The owner sent the floor plan, opening hours (06:00–20:00 max, admin-editable) and VPS hosting. Added D-032 to D-035; transcribed 40 tables into floor-plan.md and saved the screenshot to assets/; added AreaClosure to the data model and a deployment section to tech-stack; new open questions for seat counts, Section L name, slot length and closing time.
- 2026-10-24 — The owner answered the booking questions: seat mapping is set up later in Settings, 20:00 is the last booking time, slots are 15 min, and there is no cover limit (book until full). Added D-036 to D-039; marked D-018 superseded and D-006/D-017 partly superseded; updated booking, settings, data-model, roles-permissions, glossary, overview, dashboard, floor-plan and roadmap.
- 2026-10-24 — Added the Git branching strategy (D-040): main = production, dev = integration, one branch per phase, changes only through PRs; added the PR checklist and release flow to conventions.
- 2026-10-24 — Phase 0 built: added D-041 (Docker dev database), D-042 (auth implementation) and D-043 (Prisma 7.10 pin); added Cache Components and auth notes to tech-stack and local setup steps to conventions; marked Phase 0 done in the roadmap.
- 2026-10-24 — Added CI (D-044): GitHub Actions lint/typecheck/build on PRs and pushes to dev and main; added `chore/` branch prefix and CI to the PR checklist.
- 2026-10-24 — Fixed audit findings: no default passwords in `.env.example`, `npm install` works before `.env` exists, sessions re-checked against the database (D-045), dev database bound to localhost, seed emails lowercased, permission matrix test added to CI, and a login rate-limit note in the deployment section.
- 2026-10-24 — Phase 1a built: sections, tables (40 seeded from the floor plan), booking hours and slots in Settings; added D-046; updated data-model, settings, roadmap and the schema-change steps in conventions.
- 2026-10-24 — Phase 1b built: Booking and BookingTable models, booking rules with tests, create/edit booking with a live table picker, status actions, and a day list on the Timeline page; added D-047; updated booking, data-model and roadmap.
- 2026-10-24 — Phase 1c built: timeline grid (tables × time) with clickable bars, Grid/List switch, and the Calendar week and month views; Phase 1 (booking core) complete; updated booking and roadmap.
- 2026-10-24 — Phase 2a built: tables display with live states, filters and auto-refresh; walk-ins seated from a free table; Phase 2 split into 2a/2b/2c; updated floor-plan, booking and roadmap.
- 2026-10-24 — Audit fixes: walk-ins can be edited, timeline grid colours come from bookingStyle(), sign-in returns to the requested page, login timing no longer reveals existing emails, toasts stay light; added the database tests for booking writes and D-048.
- 2026-10-24 — Phase 2b-1 built: section closures (model, Settings close/reopen, booking and walk-in rules, Closed state on the Tables page and timeline); added D-049.
- 2026-10-24 — Phase 2b-2 built: floor plan screen (live colours, zoom, time strip, side panel, click actions); fixed "1 guests" wording.
