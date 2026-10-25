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

## Built in Phase 2c: waitlist
- `/bookings/waitlist`: add a party (name, guests, optional phone and quoted wait); the queue shows longest wait first with "waiting N min", turning amber past the quoted time; refreshes every minute.
- **Seat** opens the shared table picker (free tables now); seating creates a SEATED walk-in booking under the same table locks as every booking and links it to the entry. The party is claimed first, so two staff can't seat it twice; a taken table or any other failure puts it back in the queue.
- **Left** closes the entry. "Earlier today" lists seated and left parties with their tables.
- The queue and the sidebar count show today only: a party left waiting from an earlier day is stale and drops off.

## Built in Phase 1b (D-047)
- **Day list** at `/bookings/timeline?date=YYYY-MM-DD`: bookings in time order with status badges, Late badge, covers count, and previous/next/today navigation. The table × time grid and the calendar come in 1c.
- **New / edit booking** in a side sheet. The table picker shows every active table by section and crosses out the ones taken at the chosen time (with the guest's name). Only BOOKED or SEATED bookings can be edited.
- **Status actions:** Seat, Complete, Mark no-show (also a one-click button on Late bookings), Cancel (asks for a reason).
- **Source** in this form is Phone, WhatsApp or Other. Walk-ins use their own quick flow.
- **Walk-ins (Phase 2a):** "Seat walk-in" on a free table card asks for guests, optional name (defaults to "Walk-in") and optional phone, then creates a SEATED booking with source WALK_IN starting now for one dining duration. Booking hours and slots don't apply; the party must fit and the table must be free for that time. Editing a walk-in keeps these rules: phone optional, any minute, no booking-window check.
- **Server checks:** start time on a slot within that weekday's hours; party fits the chosen tables; only combinable tables can be joined; no overlap with another BOOKED/SEATED booking on the same table.

## Built in Phase 1c
- **Timeline page** has a **Grid** (default) and a **List** view, kept in the URL (`?view=list`, `?date=`). It shows every booking that overlaps the day, so a walk-in seated before midnight is drawn from 00:00 the next day.
  - Grid: tables grouped by section down the side, the booking window plus one dining duration across, hour lines, a red "now" line today. Bookings are bars (Booked blue, Seated green, Completed grey, Late with an amber ring); a booking on several tables shows on each. Cancelled and no-show bookings are hidden because they free the table. Clicking a bar opens the same actions menu as the list. A colour key above the grid explains Booked, Seated, Completed, Late and the Now line.
  - The grid scrolls sideways inside its box; table names and section names stay pinned on the left.
- **Calendar month cells** show coloured counts: blue "N bookings", violet "N walk-ins" and green "N people" (the app says people, not covers).
- **Calendar page** has **Week** (default; one card per day with each booking's time, guest, party and tables) and **Month** (day cells with booking and cover counts). **Day** opens the Timeline for that date; every day links there too. Cancelled and no-show bookings are left out. Weeks run Monday to Sunday.
- **Not built yet:** clicking an empty grid cell to start a booking at that table and time.

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
