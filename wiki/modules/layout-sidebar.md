---
title: Layout & Sidebar
status: confirmed
updated: 2026-10-24
---

# Layout & Sidebar

Everything is reached from **one left sidebar** (D-001, D-014). It is built with the shadcn `sidebar` component (see [ui-components](../architecture/ui-components.md)).

## Sidebar items

```
La Lucciola                       (logo/name, header)
─────────────
◻ Dashboard                       /
▾ Bookings                        
   Calendar                       /bookings/calendar
   Timeline                       /bookings/timeline
   Tables                         /bookings/tables
   Floor plan                     /bookings/floor-plan
   Waitlist            [3]        /bookings/waitlist
▾ Inventory
   Items                          /inventory/items
   Stock movements                /inventory/movements
   Batches & expiry    [!]        /inventory/batches
   Low stock           [5]        /inventory/low-stock
◻ Reports                         /reports
◻ Settings                        /settings
─────────────
(user menu: name, role, sign out) (footer)
```

## Behaviour
- **Collapsible** to an icon rail on desktop. On mobile and tablet it opens as an off-canvas sheet.
- The active route is highlighted, and groups expand automatically when one of their pages is active.
- **Count badges:** waitlist count, low-stock count, and an expiring-soon indicator.
- **Role-based visibility:** items a role can't use are hidden (see [roles-permissions](../architecture/roles-permissions.md)). Staff don't see Reports or Settings.
- Header bar: sidebar toggle, breadcrumb, quick "+ New booking" button, and today's date.
- Tablet friendly: front-of-house staff may use a tablet at the host stand.

Related: [dashboard](dashboard.md), [booking](booking.md), [inventory](inventory.md), [reports](reports.md), [settings](settings.md).
