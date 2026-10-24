---
title: Data Model (draft)
status: draft
updated: 2026-10-24
---

# Data Model (draft)

A draft of the Prisma entities. Field names are indicative. Money is stored as **integer Rupiah** (`Int`/`BigInt`; IDR has no decimals in practice). Quantities are `Decimal`.

## Auth & users
- **User**: id, name, email (unique), passwordHash, role (`OWNER | MANAGER | STAFF`), active, createdAt
- Auth.js tables (Account, Session, VerificationToken) as required by the adapter

## Booking module
- **Area** ✅ (shown as "Section" in the UI): id, name (unique: Section 1–4, Section L), sortOrder
- **AreaClosure**: id, areaId, date, servicePeriodId? (null = whole day), reason?, createdById (D-033)
- **Table** ✅: id, label (unique string: "101", "1A", "L3"), areaId, minSeats, maxSeats, active, combinable (bool), **posX, posY, shape (`ROUND | SQUARE | RECT`), rotation**. Width and height are not stored; the floor plan derives the size from shape and seats. Seed data comes from [floor-plan](../modules/floor-plan.md#table-list-transcribed-from-the-screenshot).
- **Booking**
  - id, guestName, guestPhone, partySize
  - startAt (datetime), endAt (datetime; default = start + dining duration)
  - status: `BOOKED | SEATED | COMPLETED | CANCELLED | NO_SHOW`
  - source: `PHONE | WHATSAPP | WALK_IN | OTHER`
  - seatedAt?, completedAt?, cancelledAt?, cancelReason?
  - notes? (short internal note; *not* a special-requests feature)
  - createdById → User, timestamps
- **BookingTable**: bookingId, tableId (many-to-many, so large groups can combine tables)
- **WaitlistEntry**: id, guestName, guestPhone?, partySize, addedAt, quotedWaitMin?, status `WAITING | SEATED | LEFT`, bookingId? (set when converted to a seated walk-in)
- **OpeningHours** ✅: dayOfWeek (0 = Sunday, primary key), firstBookingAt (default 360 = 06:00), lastBookingAt (default 1200 = 20:00). Times are **minutes after midnight, restaurant time**; both within 06:00–20:00 and on slot boundaries (D-037). One row per weekday; separate lunch/dinner periods are not modelled.
- **BookingSettings** ✅ (single row, id = 1): slotMinutes (default 15, must divide an hour, D-038), diningMinutes (default 90, multiple of the slot), reservedSoonMinutes (default 30), lateGraceMinutes (default 15)

### Rules enforced on the server
- No overlapping active bookings (BOOKED/SEATED) on the same table in the same time range.
- Party size ≤ the combined maxSeats of the assigned tables.
- No cover limit: availability depends only on free tables (D-039).
- Only tables with `combinable = true` can share a booking (D-019).
- No booking on a table whose section is closed at that time (D-033).
- `startAt` must be on a slot boundary, between firstBookingAt and lastBookingAt. `endAt` may run past lastBookingAt (D-037).
- `guestPhone` is required unless source = `WALK_IN` (D-021).
- "Late" is derived (status BOOKED and now > startAt + 15 min), not stored (D-020).

## Inventory module
- **Category**: id, name, type `INGREDIENT | BEVERAGE`
- **Item**: id, name, sku?, categoryId, unit (`KG | G | L | ML | PCS | BOTTLE`; one unit per item, no conversions, D-022), minLevel, tracksExpiry (bool), active, *(cached)* qtyOnHand, avgUnitCost (weighted average, D-023)
- **Batch**: id, itemId, receivedAt, expiresAt?, qtyReceived, qtyRemaining, unitCost (IDR), note
- **StockMovement** (append-only ledger)
  - id, itemId, batchId?, type `IN | USAGE | WASTE | COUNT_ADJUST | (future) SALE_DEDUCT`
  - qty (signed: + in, − out), unitCost, totalCost, reason/note, occurredAt, createdById
  - Movements are never edited. Mistakes are fixed with a reversing movement.

### Future (recipes, D-011): do not build yet, but don't block it
- **MenuItem**: id, name, price, active
- **RecipeLine**: menuItemId, itemId, qty
- A sale of a menu item creates `SALE_DEDUCT` movements per RecipeLine. Because stock already flows only through `StockMovement`, recipes plug in without schema rewrites.

## Relations sketch
```
User 1─* Booking (createdBy)        User 1─* StockMovement (createdBy)
Area 1─* Table *─* Booking (via BookingTable)
WaitlistEntry 0..1─1 Booking
Category 1─* Item 1─* Batch
Item 1─* StockMovement *─0..1 Batch
(future) MenuItem 1─* RecipeLine *─1 Item
```
