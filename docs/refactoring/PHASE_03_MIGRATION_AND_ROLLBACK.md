# Phase 03 Migration Plan & Rollback Considerations

**Migration Script:** `supabase/migrations/20260826000000_project_financial_workspace_migration.sql`  
**Date:** Wednesday, Aug 26, 2026  
**Status:** Prepared & Validated  

---

## 1. Migration Overview

This migration safely transforms the database from an expense-centric model to the Project/Workspace-centric model defined in `refactor/PRODUCT_MODEL.md` and `refactor/DATABASE_TARGET.md`.

### Key Changes:
1. **`public.projects` Table Enhancement**:
   - Added `budget_amount numeric(14, 2) not null default 0 check (budget_amount >= 0)`.
   - Added `currency text not null default 'KZ' check (currency in ('KZ', 'AOA', 'USD', 'EUR'))`.
   - Added index `projects_user_currency_idx (user_id, currency)`.
2. **Deterministic Data Backfill (Zero Data Loss Guarantee)**:
   - Identifies any existing expense rows with `project_id IS NULL`.
   - For affected users, creates a fallback `"General Workspace"` project (`currency: 'KZ'`, `budget_amount: 0`, `status: 'active'`) if one does not already exist.
   - Reassigns orphaned expenses to this project. **No expenses or projects are deleted.**
3. **Budget Reconcilliation**:
   - For projects with `budget_amount = 0`, syncs initial project budget amounts from any legacy associated `budgets` table rows.
4. **Data Integrity Hardening**:
   - Enforces `ALTER TABLE public.expenses ALTER COLUMN project_id SET NOT NULL`.
   - Updates the foreign key constraint `expenses_project_id_fkey` to reference `projects(id)` with `ON DELETE CASCADE`.

---

## 2. Safety & Conflict Assessment

- **Data Deletion Risk:** **ZERO.** No user data, expenses, categories, or projects are deleted.
- **Backfill Safety:** Deterministic fallback ensures no orphaned records are orphaned or dropped when `NOT NULL` constraint is applied.
- **RLS Continuity:** All existing Row Level Security policies (`current_clerk_user_id()`) remain intact and unaltered.
- **Zero Downtime Compatibility:** `budget_amount` and `currency` have safe defaults (`0` and `'KZ'`), preventing insert errors during transition.

---

## 3. Rollback Procedure

In the unlikely event that a database rollback is required before completing subsequent application phases, execute the following SQL in the Supabase SQL editor:

```sql
-- Step 1: Re-allow nullable project_id on expenses
alter table public.expenses
alter column project_id drop not null;

-- Step 2: Restore ON DELETE SET NULL foreign key
alter table public.expenses
drop constraint if exists expenses_project_id_fkey;

alter table public.expenses
add constraint expenses_project_id_fkey
foreign key (project_id) references public.projects (id) on delete set null;

-- Step 3: Remove projects currency index
drop index if exists public.projects_user_currency_idx;

-- Step 4 (Optional): Drop added columns if complete reversal is required
-- alter table public.projects drop column if exists budget_amount;
-- alter table public.projects drop column if exists currency;
```

---

## 4. Supabase Application Guide

To apply this migration in your Supabase project:
1. Open [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/vjhpucxitgqcuticfmgc/sql/new).
2. Paste the contents of `supabase/migrations/20260826000000_project_financial_workspace_migration.sql`.
3. Click **Run**.
