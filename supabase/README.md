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

The default Clerk user id in the seed file is:

`user_3HEC2u3iI0PzsKUUZyF3si8TOqn`

To seed a different account, run this before the seed block:

```sql
select set_config('app.seed_clerk_user_id', 'user_YOUR_CLERK_ID', false);
```

To move old demo data from `user_seed_demo` to your Clerk account, run `supabase/scripts/reassign-seed-user.sql`.

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
