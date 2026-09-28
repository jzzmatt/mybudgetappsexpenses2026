-- Payment batches reuse public.payments. A notification does not mark a batch paid.
-- Apply after 20260928120000_bulk_payments.sql.

alter table public.payments
  add column if not exists reference text,
  add column if not exists batch_status text not null default 'paid',
  add column if not exists expense_count integer not null default 0,
  add column if not exists idempotency_key uuid,
  add column if not exists confirmed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.payments drop constraint if exists payments_batch_status_check;

alter table public.payments
  add constraint payments_batch_status_check
  check (batch_status in ('draft', 'pending', 'paid', 'cancelled', 'failed'));

create table if not exists public.payment_reference_counters (
  user_id text not null references public.users (id) on delete cascade,
  year integer not null,
  last_value integer not null check (last_value >= 0),
  primary key (user_id, year)
);

alter table public.payment_reference_counters enable row level security;

drop policy if exists "payment_reference_counters_select_own" on public.payment_reference_counters;
create policy "payment_reference_counters_select_own"
on public.payment_reference_counters
for select
to authenticated
using (user_id = public.current_clerk_user_id());

drop policy if exists "payment_reference_counters_insert_own" on public.payment_reference_counters;
create policy "payment_reference_counters_insert_own"
on public.payment_reference_counters
for insert
to authenticated
with check (user_id = public.current_clerk_user_id());

drop policy if exists "payment_reference_counters_update_own" on public.payment_reference_counters;
create policy "payment_reference_counters_update_own"
on public.payment_reference_counters
for update
to authenticated
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create or replace function public.next_payment_reference(p_user text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_year integer := extract(year from current_date)::integer;
  v_value integer;
begin
  if p_user is null or length(p_user) = 0 or p_user <> public.current_clerk_user_id() then
    raise exception 'unauthorized';
  end if;

  insert into public.payment_reference_counters (user_id, year, last_value)
  values (p_user, v_year, 1)
  on conflict (user_id, year)
  do update set last_value = public.payment_reference_counters.last_value + 1
  returning last_value into v_value;

  return 'PAY-' || v_year::text || '-' || lpad(v_value::text, 6, '0');
end;
$$;

revoke all on function public.next_payment_reference(text) from public;
grant execute on function public.next_payment_reference(text) to authenticated;

-- Backfill runs as the migration owner, which bypasses RLS. The reference
-- function above requires the caller id, so the backfill allocates directly.
do $$
declare
  rec record;
  v_year integer;
  v_value integer;
begin
  for rec in
    select id, user_id, created_at
    from public.payments
    where reference is null
    order by created_at, id
  loop
    v_year := extract(year from rec.created_at)::integer;

    insert into public.payment_reference_counters (user_id, year, last_value)
    values (rec.user_id, v_year, 1)
    on conflict (user_id, year)
    do update set last_value = public.payment_reference_counters.last_value + 1
    returning last_value into v_value;

    update public.payments
    set reference = 'PAY-' || v_year::text || '-' || lpad(v_value::text, 6, '0'),
        expense_count = (
          select count(*)::integer from public.payment_expenses pe where pe.payment_id = rec.id
        ),
        confirmed_at = coalesce(confirmed_at, created_at),
        batch_status = 'paid'
    where id = rec.id;
  end loop;
end $$;

alter table public.payments alter column reference set not null;

create unique index if not exists payments_user_reference_key
  on public.payments (user_id, reference);

create unique index if not exists payments_user_idempotency_key
  on public.payments (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists payments_user_status_idx
  on public.payments (user_id, batch_status, created_at desc);

drop policy if exists "payment_expenses_delete_own" on public.payment_expenses;
create policy "payment_expenses_delete_own"
on public.payment_expenses
for delete
to authenticated
using (user_id = public.current_clerk_user_id());

alter table public.expense_share_logs
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.expense_share_logs drop constraint if exists expense_share_logs_status_check;

alter table public.expense_share_logs
  add constraint expense_share_logs_status_check
  check (status in ('draft', 'pending', 'sent', 'delivered', 'failed', 'cancelled'));

create unique index if not exists expense_share_logs_idempotency_idx
  on public.expense_share_logs (user_id, payment_id, (metadata->>'idempotencyKey'))
  where payment_id is not null
    and metadata->>'idempotencyKey' is not null
    and status in ('pending', 'sent');

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
  v_reference text;
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
  v_reference := public.next_payment_reference(v_user);

  insert into public.payments (
    user_id,
    project_id,
    amount,
    currency,
    payment_date,
    payment_method,
    description,
    reference,
    batch_status,
    expense_count,
    confirmed_at
  )
  values (
    v_user,
    v_project_id,
    v_total,
    v_currency,
    p_payment_date,
    nullif(btrim(coalesce(p_payment_method, '')), ''),
    v_note,
    v_reference,
    'paid',
    v_count,
    now()
  )
  returning id into v_payment_id;

  insert into public.payment_expenses (payment_id, expense_id, user_id, amount)
  select v_payment_id, (item->>'id')::uuid, v_user, (item->>'amount')::numeric
  from jsonb_array_elements(v_locked) item;

  update public.expenses e
  set status = 'paid',
      paid_at = p_payment_date,
      paid_amount = pe.amount,
      payment_method = nullif(btrim(coalesce(p_payment_method, '')), ''),
      payment_note = v_note
  from public.payment_expenses pe
  where pe.payment_id = v_payment_id
    and pe.expense_id = e.id
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
    'currency', v_currency,
    'reference', v_reference,
    'batchStatus', 'paid'
  );
exception
  when unique_violation then
    raise exception 'selection_changed';
end;
$$;

create or replace function public.open_payment_batch(
  p_expense_ids uuid[],
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user text := public.current_clerk_user_id();
  v_existing uuid;
  v_existing_status text;
  v_requested int;
  v_count int;
  v_currency_count int;
  v_currency text;
  v_project_count int;
  v_project_id uuid;
  v_total numeric(14, 2);
  v_paid int;
  v_payment_id uuid;
  v_locked jsonb;
  v_reference text;
begin
  if v_user is null or length(v_user) = 0 then
    raise exception 'unauthorized';
  end if;

  if p_idempotency_key is null then
    raise exception 'invalid_selection';
  end if;

  select id, batch_status
  into v_existing, v_existing_status
  from public.payments
  where user_id = v_user
    and idempotency_key = p_idempotency_key;

  if v_existing is not null then
    return jsonb_build_object(
      'paymentId', v_existing,
      'batchStatus', v_existing_status,
      'reused', true
    );
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

  v_reference := public.next_payment_reference(v_user);

  insert into public.payments (
    user_id,
    project_id,
    amount,
    currency,
    payment_date,
    reference,
    batch_status,
    expense_count,
    idempotency_key
  )
  values (
    v_user,
    v_project_id,
    v_total,
    v_currency,
    current_date,
    v_reference,
    'draft',
    v_count,
    p_idempotency_key
  )
  returning id into v_payment_id;

  insert into public.payment_expenses (payment_id, expense_id, user_id, amount)
  select v_payment_id, (item->>'id')::uuid, v_user, (item->>'amount')::numeric
  from jsonb_array_elements(v_locked) item;

  return jsonb_build_object(
    'paymentId', v_payment_id,
    'batchStatus', 'draft',
    'count', v_count,
    'total', v_total,
    'currency', v_currency,
    'reference', v_reference,
    'reused', false
  );
exception
  when unique_violation then
    select id, batch_status
    into v_existing, v_existing_status
    from public.payments
    where user_id = v_user
      and idempotency_key = p_idempotency_key;

    if v_existing is not null then
      return jsonb_build_object(
        'paymentId', v_existing,
        'batchStatus', v_existing_status,
        'reused', true
      );
    end if;

    raise exception 'selection_changed';
end;
$$;

create or replace function public.remove_payment_batch_expense(
  p_payment_id uuid,
  p_expense_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user text := public.current_clerk_user_id();
  v_status text;
  v_deleted int;
  v_count int;
  v_total numeric(14, 2);
begin
  if v_user is null or length(v_user) = 0 then
    raise exception 'unauthorized';
  end if;

  select batch_status into v_status
  from public.payments
  where id = p_payment_id
    and user_id = v_user
  for update;

  if v_status is null then
    raise exception 'not_found';
  end if;

  if v_status not in ('draft', 'pending') then
    raise exception 'selection_changed';
  end if;

  delete from public.payment_expenses
  where payment_id = p_payment_id
    and expense_id = p_expense_id
    and user_id = v_user;

  get diagnostics v_deleted = row_count;

  if v_deleted <> 1 then
    raise exception 'not_found';
  end if;

  select count(*)::int, coalesce(sum(amount), 0)
  into v_count, v_total
  from public.payment_expenses
  where payment_id = p_payment_id
    and user_id = v_user;

  if v_count = 0 then
    update public.payments
    set batch_status = 'cancelled',
        amount = 0,
        expense_count = 0
    where id = p_payment_id
      and user_id = v_user;

    return jsonb_build_object(
      'paymentId', p_payment_id,
      'batchStatus', 'cancelled',
      'count', 0,
      'total', 0
    );
  end if;

  update public.payments
  set amount = v_total,
      expense_count = v_count
  where id = p_payment_id
    and user_id = v_user;

  return jsonb_build_object(
    'paymentId', p_payment_id,
    'batchStatus', v_status,
    'count', v_count,
    'total', v_total
  );
end;
$$;

create or replace function public.cancel_payment_batch(p_payment_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user text := public.current_clerk_user_id();
  v_status text;
begin
  if v_user is null or length(v_user) = 0 then
    raise exception 'unauthorized';
  end if;

  select batch_status into v_status
  from public.payments
  where id = p_payment_id
    and user_id = v_user
  for update;

  if v_status is null then
    raise exception 'not_found';
  end if;

  if v_status = 'cancelled' then
    return jsonb_build_object('paymentId', p_payment_id, 'batchStatus', 'cancelled');
  end if;

  if v_status not in ('draft', 'pending') then
    raise exception 'selection_changed';
  end if;

  delete from public.payment_expenses
  where payment_id = p_payment_id
    and user_id = v_user;

  update public.payments
  set batch_status = 'cancelled',
      amount = 0,
      expense_count = 0
  where id = p_payment_id
    and user_id = v_user;

  return jsonb_build_object('paymentId', p_payment_id, 'batchStatus', 'cancelled');
end;
$$;

create or replace function public.confirm_payment_batch(
  p_payment_id uuid,
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
  v_status text;
  v_reference text;
  v_currency text;
  v_amount numeric(14, 2);
  v_count int;
  v_updated int;
  v_note text;
  v_locked jsonb;
  v_paid int;
begin
  if v_user is null or length(v_user) = 0 then
    raise exception 'unauthorized';
  end if;

  if p_payment_date is null then
    raise exception 'invalid_selection';
  end if;

  select batch_status, reference, currency, amount, expense_count
  into v_status, v_reference, v_currency, v_amount, v_count
  from public.payments
  where id = p_payment_id
    and user_id = v_user
  for update;

  if v_status is null then
    raise exception 'not_found';
  end if;

  if v_status = 'paid' then
    return jsonb_build_object(
      'paymentId', p_payment_id,
      'batchStatus', 'paid',
      'alreadyPaid', true,
      'count', v_count,
      'total', v_amount,
      'currency', v_currency,
      'reference', v_reference
    );
  end if;

  if v_status not in ('draft', 'pending') then
    raise exception 'selection_changed';
  end if;

  perform 1
  from public.expenses e
  join public.payment_expenses pe on pe.expense_id = e.id
  where pe.payment_id = p_payment_id
    and pe.user_id = v_user
    and e.user_id = v_user
  for update;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'status', e.status,
    'amount', pe.amount
  )), '[]'::jsonb)
  into v_locked
  from public.expenses e
  join public.payment_expenses pe on pe.expense_id = e.id
  where pe.payment_id = p_payment_id
    and pe.user_id = v_user
    and e.user_id = v_user;

  select count(*) into v_count from jsonb_array_elements(v_locked);

  if v_count < 1 then
    raise exception 'selection_changed';
  end if;

  select count(*) into v_paid
  from jsonb_array_elements(v_locked) item
  where item->>'status' = 'paid';

  if v_paid > 0 then
    raise exception 'selection_changed';
  end if;

  select coalesce(sum((item->>'amount')::numeric), 0) into v_amount
  from jsonb_array_elements(v_locked) item;

  v_note := nullif(left(btrim(coalesce(p_description, '')), 500), '');

  update public.expenses e
  set status = 'paid',
      paid_at = p_payment_date,
      paid_amount = pe.amount,
      payment_method = nullif(btrim(coalesce(p_payment_method, '')), ''),
      payment_note = v_note
  from public.payment_expenses pe
  where pe.payment_id = p_payment_id
    and pe.expense_id = e.id
    and pe.user_id = v_user
    and e.user_id = v_user
    and e.status <> 'paid';

  get diagnostics v_updated = row_count;

  if v_updated <> v_count then
    raise exception 'selection_changed';
  end if;

  update public.payments
  set batch_status = 'paid',
      amount = v_amount,
      expense_count = v_count,
      payment_date = p_payment_date,
      payment_method = nullif(btrim(coalesce(p_payment_method, '')), ''),
      description = v_note,
      confirmed_at = now()
  where id = p_payment_id
    and user_id = v_user;

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
      p_payment_id,
      v_user,
      item->>'evidence_type',
      item->>'storage_path',
      left(coalesce(item->>'file_name', 'evidence'), 200),
      item->>'mime_type'
    from jsonb_array_elements(p_evidence) item;
  end if;

  return jsonb_build_object(
    'paymentId', p_payment_id,
    'batchStatus', 'paid',
    'alreadyPaid', false,
    'count', v_count,
    'total', v_amount,
    'currency', v_currency,
    'reference', v_reference
  );
exception
  when unique_violation then
    raise exception 'selection_changed';
end;
$$;

revoke all on function public.open_payment_batch(uuid[], uuid) from public;
revoke all on function public.remove_payment_batch_expense(uuid, uuid) from public;
revoke all on function public.cancel_payment_batch(uuid) from public;
revoke all on function public.confirm_payment_batch(uuid, date, text, text, jsonb) from public;

grant execute on function public.open_payment_batch(uuid[], uuid) to authenticated;
grant execute on function public.remove_payment_batch_expense(uuid, uuid) to authenticated;
grant execute on function public.cancel_payment_batch(uuid) to authenticated;
grant execute on function public.confirm_payment_batch(uuid, date, text, text, jsonb) to authenticated;
