-- Migration: 20260827000000_add_payment_proof_to_expenses.sql
-- Description: Phase 10 - Add payment proof and reference fields to expenses table and setup storage bucket

-- Step 1: Add payment proof fields to expenses table
alter table public.expenses
add column if not exists payment_reference text,
add column if not exists payment_proof_path text,
add column if not exists payment_proof_filename text;

-- Step 2: Index payment_reference for fast lookup
create index if not exists expenses_user_payment_ref_idx on public.expenses (user_id, payment_reference);

-- Step 3: Setup private Supabase storage bucket for payment-proofs if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10MB limit
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf']::text[];

-- Step 4: Storage RLS Policies
-- Users can only read/upload/delete payment proofs in their own user folder: payment-proofs/{user_id}/...

create policy "payment_proofs_user_select"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = public.current_clerk_user_id()
);

create policy "payment_proofs_user_insert"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = public.current_clerk_user_id()
);

create policy "payment_proofs_user_update"
on storage.objects for update
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = public.current_clerk_user_id()
);

create policy "payment_proofs_user_delete"
on storage.objects for delete
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = public.current_clerk_user_id()
);
