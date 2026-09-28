-- One payment can cover one or many expenses.
-- Existing expense payment columns and per-expense evidence stay in place.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null check (currency in ('USD', 'EUR', 'KZ')),
  payment_date date not null,
  payment_method text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_date_idx
  on public.payments (user_id, payment_date desc);

create index if not exists payments_project_idx
  on public.payments (project_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create table if not exists public.payment_expenses (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  constraint payment_expenses_payment_expense_unique unique (payment_id, expense_id),
  constraint payment_expenses_expense_unique unique (expense_id)
);

create index if not exists payment_expenses_user_idx
  on public.payment_expenses (user_id, payment_id);

alter table public.expense_payment_evidence
  alter column expense_id drop not null;

alter table public.expense_payment_evidence
  add column if not exists payment_id uuid references public.payments (id) on delete cascade;

alter table public.expense_payment_evidence
  drop constraint if exists expense_payment_evidence_target_chk;

alter table public.expense_payment_evidence
  add constraint expense_payment_evidence_target_chk
  check (expense_id is not null or payment_id is not null);

create index if not exists expense_payment_evidence_payment_idx
  on public.expense_payment_evidence (payment_id);

alter table public.expense_share_logs
  alter column expense_id drop not null;

alter table public.expense_share_logs
  add column if not exists payment_id uuid references public.payments (id) on delete cascade;

alter table public.expense_share_logs
  add column if not exists waapi_message_id text;

alter table public.expense_share_logs
  add column if not exists waapi_reference_id text;

alter table public.expense_share_logs
  drop constraint if exists expense_share_logs_target_chk;

alter table public.expense_share_logs
  add constraint expense_share_logs_target_chk
  check (expense_id is not null or payment_id is not null);

create index if not exists expense_share_logs_payment_idx
  on public.expense_share_logs (payment_id);

alter table public.payments enable row level security;
alter table public.payment_expenses enable row level security;

create policy "payments_select_own"
on public.payments
for select
using (user_id = public.current_clerk_user_id());

create policy "payments_insert_own"
on public.payments
for insert
with check (user_id = public.current_clerk_user_id());

create policy "payments_update_own"
on public.payments
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "payment_expenses_select_own"
on public.payment_expenses
for select
using (user_id = public.current_clerk_user_id());

create policy "payment_expenses_insert_own"
on public.payment_expenses
for insert
with check (user_id = public.current_clerk_user_id());

-- Backfill one payment for each expense that is already paid.
do $$
declare
  expense_row record;
  new_payment_id uuid;
begin
  for expense_row in
    select *
    from public.expenses
    where status = 'paid'
      and not exists (
        select 1 from public.payment_expenses pe where pe.expense_id = expenses.id
      )
  loop
    insert into public.payments (
      user_id,
      project_id,
      amount,
      currency,
      payment_date,
      payment_method,
      description
    )
    values (
      expense_row.user_id,
      expense_row.project_id,
      case when expense_row.paid_amount > 0 then expense_row.paid_amount else expense_row.budget_amount end,
      expense_row.currency,
      coalesce(expense_row.paid_at, expense_row.date),
      expense_row.payment_method,
      nullif(left(btrim(coalesce(expense_row.payment_note, '')), 500), '')
    )
    returning id into new_payment_id;

    insert into public.payment_expenses (payment_id, expense_id, user_id, amount)
    values (
      new_payment_id,
      expense_row.id,
      expense_row.user_id,
      case when expense_row.paid_amount > 0 then expense_row.paid_amount else expense_row.budget_amount end
    );
  end loop;
end $$;

create or replace function public.record_expense_payment(
  p_expense_ids uuid[],
  p_payment_date date,
  p_payment_method text,
  p_description text,
  p_evidence jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user text := public.current_clerk_user_id();
  v_requested int;
  v_count int;
  v_currency_count int;
  v_currency text;
  v_project_count int;
  v_project_id uuid;
  v_total numeric(14, 2);
  v_paid int;
  v_payment_id uuid;
  v_updated int;
  v_note text;
  v_locked jsonb;
begin
  if v_user is null or length(v_user) = 0 then
    raise exception 'unauthorized';
  end if;

  if p_payment_date is null then
    raise exception 'invalid_selection';
  end if;

  select count(distinct id)
  into v_requested
  from unnest(coalesce(p_expense_ids, array[]::uuid[])) as id;

  if v_requested < 1 or v_requested > 1000 then
    raise exception 'invalid_selection';
  end if;

  perform 1
  from public.expenses e
  where e.id in (select distinct unnest(p_expense_ids))
    and e.user_id = v_user
  for update;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'status', e.status,
    'currency', e.currency,
    'amount', case when e.paid_amount > 0 then e.paid_amount else e.budget_amount end,
    'project_id', e.project_id
  )), '[]'::jsonb)
  into v_locked
  from public.expenses e
  where e.id in (select distinct unnest(p_expense_ids))
    and e.user_id = v_user;

  select count(*) into v_count from jsonb_array_elements(v_locked);

  if v_count <> v_requested then
    raise exception 'not_found';
  end if;

  select count(*) into v_paid
  from jsonb_array_elements(v_locked) item
  where item->>'status' = 'paid';

  if v_paid > 0 then
    raise exception 'selection_changed';
  end if;

  select count(distinct item->>'currency'), min(item->>'currency')
  into v_currency_count, v_currency
  from jsonb_array_elements(v_locked) item;

  if v_currency_count <> 1 then
    raise exception 'mixed_currency';
  end if;

  select coalesce(sum((item->>'amount')::numeric), 0) into v_total
  from jsonb_array_elements(v_locked) item;

  select count(distinct coalesce(item->>'project_id', '')) into v_project_count
  from jsonb_array_elements(v_locked) item;

  if v_project_count = 1 then
    select nullif(min(item->>'project_id'), '')::uuid into v_project_id
    from jsonb_array_elements(v_locked) item;
  else
    v_project_id := null;
  end if;

  v_note := nullif(left(btrim(coalesce(p_description, '')), 500), '');

  insert into public.payments (
    user_id,
    project_id,
    amount,
    currency,
    payment_date,
    payment_method,
    description
  )
  values (
    v_user,
    v_project_id,
    v_total,
    v_currency,
    p_payment_date,
    nullif(btrim(coalesce(p_payment_method, '')), ''),
    v_note
  )
  returning id into v_payment_id;

  insert into public.payment_expenses (payment_id, expense_id, user_id, amount)
  select v_payment_id, (item->>'id')::uuid, v_user, (item->>'amount')::numeric
  from jsonb_array_elements(v_locked) item;

  update public.expenses e
  set status = 'paid',
      paid_at = p_payment_date,
      payment_method = nullif(btrim(coalesce(p_payment_method, '')), ''),
      payment_note = v_note
  where e.id in (select (item->>'id')::uuid from jsonb_array_elements(v_locked) item)
    and e.user_id = v_user
    and e.status <> 'paid';

  get diagnostics v_updated = row_count;

  if v_updated <> v_count then
    raise exception 'selection_changed';
  end if;

  if p_evidence is not null and jsonb_typeof(p_evidence) = 'array' and jsonb_array_length(p_evidence) > 0 then
    if jsonb_array_length(p_evidence) > 10 then
      raise exception 'invalid_evidence';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_evidence) item
      where coalesce(item->>'storage_path', '') not like v_user || '/%'
         or coalesce(item->>'evidence_type', '') not in ('receipt', 'image')
         or coalesce(item->>'mime_type', '') not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
    ) then
      raise exception 'invalid_evidence';
    end if;

    insert into public.expense_payment_evidence (
      expense_id,
      payment_id,
      user_id,
      evidence_type,
      storage_path,
      file_name,
      mime_type
    )
    select
      case when v_count = 1 then (select (locked_row->>'id')::uuid from jsonb_array_elements(v_locked) locked_row limit 1) else null end,
      v_payment_id,
      v_user,
      item->>'evidence_type',
      item->>'storage_path',
      left(coalesce(item->>'file_name', 'evidence'), 200),
      item->>'mime_type'
    from jsonb_array_elements(p_evidence) item;
  end if;

  return jsonb_build_object(
    'paymentId', v_payment_id,
    'count', v_count,
    'total', v_total,
    'currency', v_currency
  );
exception
  when unique_violation then
    raise exception 'selection_changed';
end;
$$;

revoke all on function public.record_expense_payment(uuid[], date, text, text, jsonb) from public;
grant execute on function public.record_expense_payment(uuid[], date, text, text, jsonb) to authenticated;
