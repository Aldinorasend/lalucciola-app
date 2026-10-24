---
title: UI Components (shadcn/ui)
status: confirmed
updated: 2026-10-24
---

# UI Components: shadcn/ui

Decision [D-016](../decisions.md): a clean, neutral admin UI built with **shadcn/ui** to save time.

## Rules
1. **Add components with the CLI** (`npx shadcn@latest add <name>`). They land in `components/ui/`. Don't hand-roll something shadcn already provides.
2. **Prefer shadcn blocks** (e.g. `sidebar-07`, `dashboard-01`) as starting points, then trim them.
3. Files in `components/ui/` are generated. Light tweaks are fine. Put app-specific composites in `components/<module>/`.
4. **Theme:** default *neutral* base color with CSS variables in `app/globals.css`. Support light and dark mode. No brand colors yet.
5. Icons come from **lucide-react** only.
6. Status colors are consistent across the app (see the table below).

## Component map

| Screen / need | shadcn component(s) |
|---|---|
| App shell, left nav | `sidebar` (collapsible to icons), `breadcrumb`, `separator`, `avatar`, `dropdown-menu` (user menu) |
| Lists (bookings, items, movements) | `data-table` (TanStack) + `table`, `input` (search), `select`/`dropdown-menu` (filters), `pagination` |
| Create/edit forms | `sheet` (side panel) or `dialog`, `form`, `input`, `select`, `textarea`, `button` |
| Date and time picking | `calendar`, `popover` (date-picker), `select` for time slots |
| Booking calendar (day/week/month) | Custom grid built from `card`/`table` styles (shadcn has no full calendar scheduler). Use `tabs` to switch views. |
| Timeline (per table) | Custom grid with Tailwind. Rows = tables, columns = slots, using `tooltip` and `hover-card`. |
| Tables display and floor plan | Custom positioned `card`s, `badge` for status, `context-menu` for quick actions |
| Status labels | `badge` |
| Alerts (low stock, expiry) | `alert`, `badge`, sidebar count badges |
| Confirmations (cancel, no-show) | `alert-dialog` |
| Notifications | `sonner` (toast) |
| Dashboard KPIs, reports | `card`, `chart` (Recharts) |
| Settings sections | `tabs`, `card`, `switch` |
| Loading | `skeleton` |

## Status colors (badges)

| Status | Color intent |
|---|---|
| Booked | blue / default |
| Seated | green |
| Walk-in (seated) | violet: calendar and timeline only, so walk-ins stand apart from bookings |
| Completed | gray / muted |
| Cancelled | outline / muted, strikethrough |
| No-show | red / destructive |
| Waitlist | amber |
| Low stock | amber |
| Expired / expiring | red |
