---
title: Booking / Reservations
status: confirmed
updated: 2026-10-24
---

# Booking / Reservations

A staff-only module for recording reservations made by phone, WhatsApp or walk-in (D-003). The data model is in [data-model](../architecture/data-model.md#booking-module).

## Seating model (D-006, D-039)
1. **Specific tables.** Every booking is assigned to one or more tables, each with min and max seats.
2. **Visual floor plan.** 40 tables in 5 sections, shown in their real positions. See [floor-plan](floor-plan.md).
3. **No cover limit (D-039).** Bookings are accepted until the room is full, meaning as long as a free table or combinable set fits the party at that time.

Tables in a **closed section** can't be booked (D-033). Booking **start times run from 06:00 to 20:00**; 20:00 is the last booking time, and a booking may run past it (D-034, D-037). The admin can change the range in [settings](settings.md).

When a booking is created, the form:
- suggests free tables that fit the party size at that time (no overlap with active bookings),
- allows combining tables marked `combinable` for large groups (D-019),
- says "Fully booked" when no table or combination fits, and offers the waitlist.

Defaults: **15-min slots** (D-038), **90-min dining duration** (D-017). Both are editable in [settings](settings.md).

## Booking data (D-008)
Required: **guest name, phone, party size, date, time, table(s)**. Phone is optional for walk-ins and the waitlist (D-021). Also: source (phone / WhatsApp / walk-in / other) and an optional short internal note.
*Not included:* deposits, pre-orders/packages, special-request fields, or a customer-history page.

## Statuses (D-009)

```
            ┌──────────► CANCELLED
            │
 BOOKED ────┼──────────► NO_SHOW
            │
            └──► SEATED ──► COMPLETED
 WALK-IN ──────► SEATED (created directly as seated)
```
- **Booked**: the default when created.
- **Seated**: the guest arrived. Records `seatedAt`, and the table shows as occupied.
- **Completed**: the guest left. Records `completedAt`, and the table becomes free.
- **Cancelled**: records the reason and time. Frees the table.
- **No-show**: the guest never arrived. Frees the table. Counted in reports.
- **Late flag (D-020):** a booking still BOOKED 15 min after its start time shows a "Late" badge with a one-click "Mark no-show". Nothing is marked No-show automatically.
- There is no pending/confirmed step.

## Walk-ins & waitlist
- **Walk-in:** a quick form (name, party size, optional phone) that seats the party at a free table immediately. Source = `WALK_IN`.
- **Waitlist:** when no table is free, add the party (name, size, phone, quoted wait). Staff can then **Seat** them (which converts the entry into a walk-in booking) or mark them **Left**. Wait time is shown live.

## Views (D-007)
| View | Route | Purpose |
|---|---|---|
| Calendar: day / week / month | `/bookings/calendar` | Planning ahead. Month shows covers per day; week and day show bookings by time. |
| Timeline (daily list) | `/bookings/timeline` | Today's service. Rows = tables, columns = time slots, bookings as bars. Also a plain list by time. |
| Tables display | `/bookings/tables` | Live grid of tables with status (free / reserved soon / seated). See [floor-plan](floor-plan.md). |
| Floor plan | `/bookings/floor-plan` | The same live status on the real room layout. See [floor-plan](floor-plan.md). |
| Waitlist | `/bookings/waitlist` | The queue. |

All views let staff open a booking (in a sheet) to edit it or change its status. Clicking an empty time or table opens "New booking" with the time or table filled in.

## Settings that drive booking
Booking hours, slot length, default dining duration, section closures, and table seats/combinations (D-036) are set in [settings](settings.md).

Bookings can be exported to CSV (D-030).
