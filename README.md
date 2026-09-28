# Ticketing skeleton

Next.js organizer portal with Supabase Auth, Postgres, and row-level security. Signing up creates an organization, and that organization is the current tenant for `/events` and `/members`. An event has draft or published status and one or more ticket types (name, euro price in cents, quantity). Checkout, fees, and the customer storefront are not in this repo.

## Requirements

- Node 22+
- pnpm
- Docker (for the local Supabase stack)

## Run

```bash
pnpm install
pnpm exec supabase start
cp .env.example .env.local
pnpm dev
```

`supabase start` prints the local URLs. The values in `.env.example` match a default local stack:

| | |
| --- | --- |
| API | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| App | http://localhost:3000 |

The publishable key in `.env.example` is the public local demo anon key. If `supabase status` shows a different key, put that value in `.env.local` as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Email confirmation is off in `supabase/config.toml`, so a new account can sign in immediately.

Stop the stack with `pnpm exec supabase stop`.

`pnpm check` runs lint, typecheck, and unit tests. GitHub Actions runs it on every push and pull request.
