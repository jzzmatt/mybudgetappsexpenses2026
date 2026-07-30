# Supabase database

## Apply migrations

Run the SQL in `supabase/migrations/` against your Supabase project.

### Option A — Supabase Dashboard

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/vjhpucxitgqcuticfmgc/sql/new).
2. Paste the contents of `supabase/migrations/20260730141800_initial_schema.sql`.
3. Run the query.

### Option B — Supabase CLI

```bash
npx supabase link --project-ref vjhpucxitgqcuticfmgc
npx supabase db push
```

## Seed data

After migrations, run `supabase/seed.sql` in the SQL Editor.

1. Sign in to the app once with Clerk and copy your user id (format: `user_...`).
2. In `supabase/seed.sql`, replace `user_seed_demo` with your Clerk user id, **or** run this before the seed block:

```sql
select set_config('app.seed_clerk_user_id', 'user_YOUR_CLERK_ID', false);
```

3. Execute `supabase/seed.sql`.

## Clerk + RLS

Row-level security uses the Clerk user id from the JWT `sub` claim via `auth.jwt() ->> 'sub'`.

Ensure the [Clerk ↔ Supabase third-party auth integration](https://clerk.com/docs/guides/development/integrations/databases/supabase) is enabled in both dashboards.

## Tables

- `users`
- `categories`
- `projects`
- `vendors`
- `budgets`
- `expenses`
