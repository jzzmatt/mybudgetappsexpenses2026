alter table public.budgets
add column if not exists currency text not null default 'USD'
check (currency in ('USD', 'EUR', 'KZ'));
