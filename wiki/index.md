---
title: La Lucciola Wiki — Index
status: confirmed
updated: 2026-10-24
---

# La Lucciola Wiki

The source of truth for **what** we are building and **why**. Read this before writing code. The code shows *how*; this wiki holds intent, decisions and open questions.

**The app in one line:** an internal staff website for the La Lucciola restaurant/café. It combines **Booking / Reservations** and **Inventory**, and staff move between them with a left sidebar.

## Map

### Product
- [Overview](overview.md): vision, users, what is in and out of scope
- [Roadmap](roadmap.md): build phases in order
- [Decisions](decisions.md): dated log of every product and tech decision
- [Open questions](open-questions.md): things still waiting on the owner
- [Glossary](glossary.md): shared vocabulary (cover, slot, batch…)

### Architecture
- [Tech stack](architecture/tech-stack.md): Next.js 16, Postgres, Prisma, Auth.js, Tailwind 4, shadcn/ui
- [UI components](architecture/ui-components.md): which shadcn/ui component goes where
- [Data model](architecture/data-model.md): draft entities and relations
- [Roles & permissions](architecture/roles-permissions.md): Owner / Manager / Staff matrix
- [Conventions](architecture/conventions.md): folders, naming, money, dates, time zone

### Modules (sidebar order)
- [Layout & sidebar](modules/layout-sidebar.md)
- [Dashboard](modules/dashboard.md)
- [Booking](modules/booking.md)
- [Floor plan & tables display](modules/floor-plan.md)
- [Inventory](modules/inventory.md)
- [Reports](modules/reports.md)
- [Settings](modules/settings.md)

### Meta
- [Log](log.md): append-only changelog of wiki edits

## How to maintain this wiki (for humans and LLM agents)

1. **Read first.** Before working on a feature, read its module page plus [decisions](decisions.md) and [open questions](open-questions.md).
2. **Update when ideas change.** When the owner changes or adds an idea, update the affected page(s) in the same change as the code.
3. **Record decisions.** Every decision gets a dated entry in [decisions.md](decisions.md). Never silently rewrite an old decision. Mark it *Superseded by D-xxx* instead.
4. **Move answered questions.** When an open question is answered, remove it from [open-questions.md](open-questions.md), record the answer as a decision, and update the module page.
5. **Log every edit.** Add one line to [log.md](log.md) per wiki change.
6. **Frontmatter.** Every page has `title`, `status` (`draft` = proposed, not yet confirmed by the owner; `confirmed` = agreed) and `updated` (YYYY-MM-DD).
7. **Stay concise.** Prefer bullets and tables, and link to other pages instead of repeating them.
8. **Never invent requirements.** If something is unknown, add it to open questions; don't guess silently.
