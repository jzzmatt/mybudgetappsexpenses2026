-- Migration: 20260826000000_project_financial_workspace_migration.sql
-- Description: Phase 03 - Project Data Migration
-- Safely add budget_amount and currency to projects, backfill orphaned expenses, and enforce constraints non-destructively.

-- Step 1: Add budget_amount and currency to projects if not already present
alter table public.projects
add column if not exists budget_amount numeric(14, 2) not null default 0 check (budget_amount >= 0);

alter table public.projects
add column if not exists currency text not null default 'KZ'
check (currency in ('KZ', 'AOA', 'USD', 'EUR'));

-- Step 2: Ensure an index on projects currency for fast filtering
create index if not exists projects_user_currency_idx on public.projects (user_id, currency);

-- Step 3: Deterministic Safe Backfill for any expenses with null project_id
-- For any user who has expenses with null project_id, ensure a default "General Workspace" project exists and assign them.
do $$
declare
  r record;
  default_proj_id uuid;
begin
  for r in (select distinct user_id from public.expenses where project_id is null) loop
    -- Check if user already has a project named 'General Workspace' or create one
    select id into default_proj_id from public.projects
    where user_id = r.user_id and name = 'General Workspace' limit 1;

    if default_proj_id is null then
      insert into public.projects (user_id, name, description, budget_amount, currency, status)
      values (r.user_id, 'General Workspace', 'Default workspace created during project migration', 0, 'KZ', 'active')
      returning id into default_proj_id;
    end if;

    -- Backfill orphaned expenses for this user
    update public.expenses
    set project_id = default_proj_id
    where user_id = r.user_id and project_id is null;
  end loop;
end $$;

-- Step 4: Reconcile project budgets from standalone budgets table where available
-- If a project has 0 budget_amount and there was an associated entry in the budgets table, populate the project budget_amount.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'budgets') then
    update public.projects p
    set budget_amount = sub.total_budget,
        currency = coalesce(sub.currency, p.currency)
    from (
      select project_id, sum(amount) as total_budget, max(currency) as currency
      from public.budgets
      where project_id is not null
      group by project_id
    ) sub
    where p.id = sub.project_id
      and p.budget_amount = 0
      and sub.total_budget > 0;
  end if;
end $$;

-- Step 5: Tighten constraint on expenses.project_id (now guaranteed no nulls)
alter table public.expenses
alter column project_id set not null;

-- Step 6: Ensure foreign key constraint on expenses.project_id cascade or restrict appropriately
-- First drop existing nullable FK if it was ON DELETE SET NULL, and replace with ON DELETE CASCADE or RESTRICT
alter table public.expenses
drop constraint if exists expenses_project_id_fkey;

alter table public.expenses
add constraint expenses_project_id_fkey
foreign key (project_id) references public.projects (id) on delete cascade;
