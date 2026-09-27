-- Payment date, note, private evidence files, and WhatsApp share logs.
-- Existing expenses.payment_method, status, and payment_proof_* stay in place.

alter table public.expenses
add column if not exists paid_at date,
add column if not exists payment_note text;

create table if not exists public.expense_payment_evidence (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  evidence_type text not null check (evidence_type in ('receipt', 'image')),
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists expense_payment_evidence_user_idx
  on public.expense_payment_evidence (user_id, created_at desc);

create index if not exists expense_payment_evidence_expense_idx
  on public.expense_payment_evidence (expense_id);

create table if not exists public.expense_share_logs (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  recipient_phone text not null,
  channel text not null default 'whatsapp',
  message text not null,
  status text not null check (status in ('pending', 'sent', 'delivered', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists expense_share_logs_user_idx
  on public.expense_share_logs (user_id, created_at desc);

create index if not exists expense_share_logs_expense_idx
  on public.expense_share_logs (expense_id);

alter table public.expense_payment_evidence enable row level security;
alter table public.expense_share_logs enable row level security;

create policy "expense_payment_evidence_select_own"
on public.expense_payment_evidence
for select
using (user_id = public.current_clerk_user_id());

create policy "expense_payment_evidence_insert_own"
on public.expense_payment_evidence
for insert
with check (user_id = public.current_clerk_user_id());

create policy "expense_payment_evidence_delete_own"
on public.expense_payment_evidence
for delete
using (user_id = public.current_clerk_user_id());

create policy "expense_share_logs_select_own"
on public.expense_share_logs
for select
using (user_id = public.current_clerk_user_id());

create policy "expense_share_logs_insert_own"
on public.expense_share_logs
for insert
with check (user_id = public.current_clerk_user_id());

create policy "expense_share_logs_update_own"
on public.expense_share_logs
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

update storage.buckets
set allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'payment-proofs';
