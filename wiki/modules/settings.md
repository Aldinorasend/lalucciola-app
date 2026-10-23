---
title: Settings
status: draft
updated: 2026-10-24
---

# Settings

**Owner/Admin only** (see [roles-permissions](../architecture/roles-permissions.md)). It is organized in tabs.

| Tab | Contents |
|---|---|
| General | Restaurant name, time zone (`Asia/Jakarta`, D-028), currency (IDR, fixed). Single location only (D-029). |
| Opening hours & slots | Booking hours per day and service period, set by the admin. The default is **06:00 first booking to 20:00 last booking, every day**, and hours can't be set outside that range (D-034, D-037). Other settings: **slot length** (default 15 min, D-038), **default dining duration** (default 90 min), "reserved soon" threshold, late/no-show grace (15 min). There is no cover limit (D-039). |
| Areas & tables | Sections (rename, e.g. "Section L"); tables (label, min/max seats, section, combinable, active). Seeded from the transcribed plan; the owner corrects seats here (D-036). Also: | **floor plan editor**; **open/close a section** for a date or service period (see [floor-plan](floor-plan.md)) |
| Inventory | Categories (seeded per D-024), units, **expiry warning window** (default 3 days), default min level |
| Users & roles | Invite or create users, set role (Owner / Manager / Staff), deactivate, reset password. User management lives here because there is no separate sidebar item (D-014). |

Anything still undecided is tracked in [open questions](../open-questions.md).
