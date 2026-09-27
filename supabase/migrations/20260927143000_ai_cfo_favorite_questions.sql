-- Saved AI CFO questions. Answers are not stored; each run queries current data.

create table if not exists public.ai_cfo_favorite_questions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  title text not null,
  question text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz,
  usage_count integer not null default 0 check (usage_count >= 0)
);

create index if not exists ai_cfo_favorites_user_id_idx
  on public.ai_cfo_favorite_questions (user_id);

create index if not exists ai_cfo_favorites_user_created_idx
  on public.ai_cfo_favorite_questions (user_id, created_at desc);

create index if not exists ai_cfo_favorites_user_last_used_idx
  on public.ai_cfo_favorite_questions (user_id, last_used_at desc);

drop trigger if exists ai_cfo_favorites_set_updated_at on public.ai_cfo_favorite_questions;

create trigger ai_cfo_favorites_set_updated_at
before update on public.ai_cfo_favorite_questions
for each row execute function public.set_updated_at();

alter table public.ai_cfo_favorite_questions enable row level security;

create policy "ai_cfo_favorites_select_own"
on public.ai_cfo_favorite_questions
for select
using (user_id = public.current_clerk_user_id());

create policy "ai_cfo_favorites_insert_own"
on public.ai_cfo_favorite_questions
for insert
with check (user_id = public.current_clerk_user_id());

create policy "ai_cfo_favorites_update_own"
on public.ai_cfo_favorite_questions
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "ai_cfo_favorites_delete_own"
on public.ai_cfo_favorite_questions
for delete
using (user_id = public.current_clerk_user_id());
