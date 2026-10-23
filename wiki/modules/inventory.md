---
title: Inventory
status: confirmed
updated: 2026-10-24
---

# Inventory

Tracks **raw ingredients** and **beverages/bottled goods** (D-010). It is separate from booking (D-013). The data model is in [data-model](../architecture/data-model.md#inventory-module).

## Items
- Fields: name, category, type (Ingredient / Beverage), unit (kg, g, L, ml, pcs, bottle), **min level**, tracks expiry (yes/no), active.
- **One unit per item, no unit conversions** in v1 (D-022).
- Default categories (D-024): Dairy, Meat, Produce, Dry goods, Coffee (ingredients) and Soft drinks, Alcohol (beverages). They can be edited in Settings.
- Shown values: quantity on hand, average unit cost, stock value (IDR), and status (OK / Low / Out).
- List page: search, filter by category/type/status, sort by name or quantity.

## Stock movements (the ledger)
Every change to stock is a **StockMovement**. Quantity on hand is the sum of movements. Movements are never edited; mistakes are fixed with a reversal.

| Type | When | Who (draft) |
|---|---|---|
| **IN** (receive) | A delivery arrives. Creates a **batch** with qty, unit cost and expiry. | Owner, Manager |
| **USAGE** | Manual usage during prep or service | All roles |
| **WASTE** | Spoiled, expired or broken. A reason is required. | All roles |
| **COUNT_ADJUST** | A stock-take: enter the counted qty, and the system books the difference. Done ad hoc, with no schedule enforced (D-026). | Owner, Manager |
| *SALE_DEDUCT (future)* | Automatic deduction from recipes (D-011) | system |

Stock-out is **manual for now** (D-011). The design keeps all stock changes in this ledger so that recipe-based deduction can be added later without a rewrite.

## Batches & expiry (D-012)
- Items with `tracksExpiry` get a batch per delivery, with an expiry date.
- Usage and waste take from the **earliest-expiring batch first** (FEFO) by default. The user can pick another batch.
- The **Batches & expiry** page lists batches that are expired or expiring within the warning window (**3 days** by default and configurable; D-025). Waste-out of an expired batch takes one click.

## Low-stock alerts (D-012)
- An item is **Low** when qty on hand ≤ min level, and **Out** when it is ≤ 0.
- The **Low stock** page and a sidebar badge show the count. The [dashboard](dashboard.md) widget shows the same.
- In-app only for now. Email or WhatsApp alerts are not planned.

## Cost & value (D-012)
- Each IN movement records the unit cost in IDR.
- Valuation is **weighted average cost** (D-023). When stock comes in, the new average = (old qty × old avg + in qty × in cost) ÷ new qty. Outgoing movements are costed at the current average.
- Stock value = qty on hand × avg unit cost. A total is shown on the inventory page and in [reports](reports.md).
- Cost figures are hidden from Staff (D-027; see [roles-permissions](../architecture/roles-permissions.md)).
- Items and stock movements can be exported to CSV (D-030).

## Out of scope for now
Suppliers, purchase orders, packaging/supplies, equipment, and links to bookings.
