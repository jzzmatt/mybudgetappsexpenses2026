# Target Database Model

## projects
id, user_id, name, budget_amount, currency, created_at, updated_at

## expenses
id, user_id, project_id NOT NULL, date, description, category_id, vendor_id, budget_amount, paid_amount, priority, status, notes, created_at, updated_at

## categories
id, user_id, name, description, created_at, updated_at

## vendors
id, user_id, name, contact_info, created_at, updated_at

Migration requirements:
- Assess existing data before destructive changes.
- Backfill existing expenses to valid Projects using an explicit deterministic strategy.
- Reconcile existing currencies with Project currency.
- Remove expense-level currency only after verification.
- Preserve RLS and ownership.
- Never silently delete production/user data.
