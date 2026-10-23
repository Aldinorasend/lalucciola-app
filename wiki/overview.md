---
title: Product Overview
status: confirmed
updated: 2026-10-24
---

# Product Overview

## Vision
One internal web app where La Lucciola staff manage **reservations and tables** and **ingredient/beverage stock**. It replaces paper books, chat threads and spreadsheets. Both modules sit in **one website**, and a **left sidebar** switches between them.

## Business
- **Type:** restaurant / café
- **Language:** English UI
- **Currency:** Indonesian Rupiah (IDR), shown as `Rp 125.000` (see [conventions](architecture/conventions.md))
- **Locations:** a single location, with no multi-branch support planned (D-029)
- **Time zone:** Asia/Jakarta (WIB)

## Users
Staff only. **There is no public-facing page and no online customer booking.** Customers book by phone, WhatsApp or walk-in, and staff enter those bookings into the app.

| Role | Summary |
|---|---|
| Owner / Admin | Full access, including Settings, users and reports |
| Manager | Runs bookings and inventory day to day; no Settings |
| Staff | Creates and views bookings, seats guests, records stock usage |

Details: [roles & permissions](architecture/roles-permissions.md).

## In scope (v1)
- **Booking:** tables with capacities (bookable until the room is full), visual floor plan, calendar (day/week/month), daily timeline, tables display, walk-ins, waitlist, statuses (Booked, Seated, Completed, Cancelled, No-show). See [booking](modules/booking.md) and [floor plan](modules/floor-plan.md).
- **Inventory:** raw ingredients and beverages/bottled goods, manual stock adjustments, low-stock alerts, expiry/batch tracking, stock movement log with cost and stock value. See [inventory](modules/inventory.md).
- [Dashboard](modules/dashboard.md) (today overview), [Reports](modules/reports.md), [Settings](modules/settings.md).

## Out of scope (for now)
- A public booking page or online booking widget
- Deposits / down payments
- Pre-ordered menus and event packages
- Special-request or occasion fields on bookings
- Customer history / CRM profiles
- A pending → confirmed approval step
- Suppliers and purchase orders
- Supplies/packaging and equipment/asset tracking
- Recipe-based automatic stock deduction (**planned later**; the data model leaves room for it)
- Any link between bookings and inventory (the modules stay separate)

## Look & feel
A clean, neutral admin UI built with shadcn/ui. No brand assets for now. See [UI components](architecture/ui-components.md).
