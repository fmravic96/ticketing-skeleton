# Ticketing skeleton

Next.js UI with Supabase Auth, Postgres, and row-level security. This slice covers organizer sign-up, a profile, and owned events. Holds, payments, and check-in are not here.

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
