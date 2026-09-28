<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Organizer portal

Small Next.js UI on Supabase Auth and Postgres. One organization is current, stored in a cookie. Routes stay `/events` and `/members`. The public storefront is a later app on the same database, not a route in this one.

Use the small rules below. Skip patterns that need a second service, a generic CRUD framework, or a class hierarchy.

- **KISS and YAGNI.** Add a column, a check, or one Postgres function. Do not add repositories, mappers, an API layer, or a pricing engine for a screen that only saves a form.
- **One write path.** A change that touches more than one row (an event and its ticket types) goes through one SQL function so it commits together. Pages and actions stay thin: load, parse, call, redirect.
- **Validate at the edge, constrain in the database.** Parse the form in a pure function beside that feature. Repeat the row rules as `CHECK` constraints. Cross-row rules live in the function that writes them.
- **DRY only where a rule would drift.** Share parsing and the save function. Do not build a shared abstraction for a single screen.
- **Tenant on every query.** Read the organization from the session. Never take `organization_id` from the form. RLS still has to reject a forged request.
- **Money is integer cents.** No floats. Currency is EUR until a second currency is an actual decision. Fees, tax, promo codes, and checkout are out of scope until a purchase flow exists.
- **Name the product words.** Tables and fields say event, ticket type, organization, and member. Status is explicit (`draft` or `published`), not inferred from empty fields.
- **Do not split the deploy early.** Cache, queues, and a separate checkout process wait until a measured hot path needs them. Inventory correctness later is a transaction, not a new framework.

## Where code goes

- `src/app` — routes and server actions. Actions parse input, call one database function, and redirect.
- `src/components` — screens and forms. `src/components/ui` is shadcn. Shared form pieces live in `src/components/form.tsx` (`Field`, `FormNote`, `Select`, `Textarea`). Use those instead of copying label, error, and select markup.
- `src/lib` — pure rules and the server clients (`events`, `org`, `auth`, `supabase`). No React in this folder.

Do not add a generic CRUD layer. A new feature gets a parser in `src/lib`, an action, and a form.

## Checks

`pnpm check` is lint, typecheck, and unit tests. Run it before every commit. GitHub Actions runs the same command on push and pull request. Do not commit if it fails.

Test pure business rules next to the module (`src/lib/*.test.ts`). Event parsing and money conversion belong there. Do not add browser tests or a database in CI until a rule cannot be proven without them. Do not add a deploy workflow until a host is chosen.
