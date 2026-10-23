<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project wiki (read first)

`wiki/` is the source of truth for this app's purpose, ideas and decisions: the La Lucciola staff app for **Booking/Reservations** and **Inventory**, with a left sidebar.

- Before working on anything, read [`wiki/index.md`](wiki/index.md) and the module page(s) involved.
- When an idea, requirement or decision changes: update the affected page(s), add a dated entry to `wiki/decisions.md`, and append one line to `wiki/log.md`, in the same change as the code.
- Don't invent requirements. Add unknowns to `wiki/open-questions.md` and ask.
- UI uses shadcn/ui (add components with the CLI; see `wiki/architecture/ui-components.md`).
