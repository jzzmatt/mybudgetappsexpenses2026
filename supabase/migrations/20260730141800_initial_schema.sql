-- Budget App initial schema (Phase 03)
-- Auth identity comes from Clerk via Supabase third-party auth (JWT sub claim).

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id text primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_name_unique unique (user_id, name)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_user_name_unique unique (user_id, name)
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  name text not null,
  contact_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_user_name_unique unique (user_id, name)
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  name text not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  month smallint check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  date date not null,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2100),
  category_id uuid references public.categories (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  description text not null,
  budget_amount numeric(14, 2) not null default 0 check (budget_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  balance numeric(14, 2) generated always as (budget_amount - paid_amount) stored,
  payment_method text,
  priority text,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists categories_user_id_name_idx on public.categories (user_id, name);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_user_id_name_idx on public.projects (user_id, name);
create index if not exists projects_user_id_status_idx on public.projects (user_id, status);

create index if not exists vendors_user_id_idx on public.vendors (user_id);
create index if not exists vendors_user_id_name_idx on public.vendors (user_id, name);

create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists budgets_user_year_month_idx on public.budgets (user_id, year, month);
create index if not exists budgets_category_id_idx on public.budgets (category_id);
create index if not exists budgets_project_id_idx on public.budgets (project_id);

create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
create index if not exists expenses_user_year_month_idx on public.expenses (user_id, year, month);
create index if not exists expenses_category_id_idx on public.expenses (category_id);
create index if not exists expenses_project_id_idx on public.expenses (project_id);
create index if not exists expenses_vendor_id_idx on public.expenses (vendor_id);
create index if not exists expenses_status_idx on public.expenses (user_id, status);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.vendors enable row level security;
alter table public.budgets enable row level security;
alter table public.expenses enable row level security;

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'sub';
$$;

create policy "users_select_own"
on public.users
for select
using (id = public.current_clerk_user_id());

create policy "users_insert_own"
on public.users
for insert
with check (id = public.current_clerk_user_id());

create policy "users_update_own"
on public.users
for update
using (id = public.current_clerk_user_id())
with check (id = public.current_clerk_user_id());

create policy "categories_select_own"
on public.categories
for select
using (user_id = public.current_clerk_user_id());

create policy "categories_insert_own"
on public.categories
for insert
with check (user_id = public.current_clerk_user_id());

create policy "categories_update_own"
on public.categories
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "categories_delete_own"
on public.categories
for delete
using (user_id = public.current_clerk_user_id());

create policy "projects_select_own"
on public.projects
for select
using (user_id = public.current_clerk_user_id());

create policy "projects_insert_own"
on public.projects
for insert
with check (user_id = public.current_clerk_user_id());

create policy "projects_update_own"
on public.projects
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "projects_delete_own"
on public.projects
for delete
using (user_id = public.current_clerk_user_id());

create policy "vendors_select_own"
on public.vendors
for select
using (user_id = public.current_clerk_user_id());

create policy "vendors_insert_own"
on public.vendors
for insert
with check (user_id = public.current_clerk_user_id());

create policy "vendors_update_own"
on public.vendors
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "vendors_delete_own"
on public.vendors
for delete
using (user_id = public.current_clerk_user_id());

create policy "budgets_select_own"
on public.budgets
for select
using (user_id = public.current_clerk_user_id());

create policy "budgets_insert_own"
on public.budgets
for insert
with check (user_id = public.current_clerk_user_id());

create policy "budgets_update_own"
on public.budgets
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "budgets_delete_own"
on public.budgets
for delete
using (user_id = public.current_clerk_user_id());

create policy "expenses_select_own"
on public.expenses
for select
using (user_id = public.current_clerk_user_id());

create policy "expenses_insert_own"
on public.expenses
for insert
with check (user_id = public.current_clerk_user_id());

create policy "expenses_update_own"
on public.expenses
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "expenses_delete_own"
on public.expenses
for delete
using (user_id = public.current_clerk_user_id());
