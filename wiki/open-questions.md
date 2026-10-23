---
title: Open Questions
status: draft
updated: 2026-10-24
---

# Open Questions

Items waiting on the owner. When one is answered, move it into [decisions](decisions.md) and update the related page.

## Booking
- [ ] **Table mapping / floor plan.** The owner will provide the list of tables (number, capacity, area) and their layout. → [floor-plan](modules/floor-plan.md)
- [ ] **Opening hours and service periods** (e.g. lunch/dinner, closed days).
- [ ] **Slot length** (15 or 30 min?) and **default dining duration** per party size (e.g. 90 min).
- [ ] **Cover limit per slot.** What number, and does it differ per service period or day?
- [ ] Can one booking span **combined tables** for large groups? (Assumed yes.)
- [ ] Should a **reminder / no-show grace period** be tracked (e.g. mark as no-show after 15 min)?
- [ ] Is **phone required**, or optional for walk-ins?

## Inventory
- [ ] **Final unit list** and whether conversions are needed (e.g. buy in crates, use in bottles).
- [ ] **Cost/valuation method.** Proposed: weighted average cost. Alternative: FIFO by batch.
- [ ] **Categories** for items (e.g. Dairy, Meat, Produce, Dry goods, Coffee, Soft drinks, Alcohol).
- [ ] **Expiry warning window** (e.g. alert 3 days before expiry).
- [ ] How often are **full stock counts** (stock-takes) done?

## Roles
- [ ] Confirm the draft [permission matrix](architecture/roles-permissions.md), especially whether Staff can see costs and stock value.

## Tech / ops
- [ ] **Hosting** for the app and Postgres (e.g. Vercel + Neon, Railway, VPS).
- [ ] **Time zone:** assumed `Asia/Jakarta` (WIB). Confirm, e.g. if the café is in Bali (WITA).
- [ ] Single location, or will **multiple branches** come later?
- [ ] Is a backup/export (CSV) requirement needed?

## Reports
- [ ] Which metrics matter most? Proposed list in [reports](modules/reports.md).
