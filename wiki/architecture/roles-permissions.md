---
title: Roles & Permissions
status: confirmed
updated: 2026-10-24
---

# Roles & Permissions

There are three roles (D-004). The owner confirmed the matrix below (D-027).

✅ allowed · 👁 view only · ❌ no access

| Area / action | Owner / Admin | Manager | Staff |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ (no cost figures) |
| Create / edit bookings | ✅ | ✅ | ✅ |
| Seat / complete / mark no-show | ✅ | ✅ | ✅ |
| Cancel booking | ✅ | ✅ | ✅ |
| Delete booking | ✅ | ❌ | ❌ |
| Walk-ins and waitlist | ✅ | ✅ | ✅ |
| View inventory items and stock | ✅ | ✅ | 👁 |
| Record usage / waste | ✅ | ✅ | ✅ |
| Receive stock (IN, new batch) | ✅ | ✅ | ❌ |
| Stock count adjustments | ✅ | ✅ | ❌ |
| Create / edit items, categories, min levels | ✅ | ✅ | ❌ |
| See costs and stock value | ✅ | ✅ | ❌ |
| Reports | ✅ | 👁 | ❌ |
| Settings (hours, slots, tables, floor plan, units) | ✅ | ❌ | ❌ |
| Users and roles | ✅ | ❌ | ❌ |

## Implementation notes
- Role is stored on `User.role` and exposed on the Auth.js session.
- One helper, e.g. `can(user, "inventory.adjust")`, is used by **server actions**, **pages** and the **sidebar** (to hide items). The server check is the real guard.
- Requests from unauthenticated users are redirected to `/login` (Next 16 `proxy`; see [tech-stack](tech-stack.md)).
