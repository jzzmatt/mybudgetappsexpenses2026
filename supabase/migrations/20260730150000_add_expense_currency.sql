alter table public.expenses
add column if not exists currency text not null default 'USD'
check (currency in ('USD', 'EUR', 'KZ'));

create index if not exists expenses_user_currency_idx on public.expenses (user_id, currency);
