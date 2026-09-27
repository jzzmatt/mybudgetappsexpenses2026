-- AI CFO conversation history. Financial records stay in expenses/projects/categories.
-- These tables store chat text only and are scoped to the Clerk user id.

create table if not exists public.ai_cfo_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_cfo_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_cfo_conversations (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_cfo_conversations_user_id_idx
  on public.ai_cfo_conversations (user_id, updated_at desc);

create index if not exists ai_cfo_messages_conversation_id_idx
  on public.ai_cfo_messages (conversation_id, created_at);

create index if not exists ai_cfo_messages_user_id_idx
  on public.ai_cfo_messages (user_id);

drop trigger if exists ai_cfo_conversations_set_updated_at on public.ai_cfo_conversations;

create trigger ai_cfo_conversations_set_updated_at
before update on public.ai_cfo_conversations
for each row execute function public.set_updated_at();

alter table public.ai_cfo_conversations enable row level security;
alter table public.ai_cfo_messages enable row level security;

create policy "ai_cfo_conversations_select_own"
on public.ai_cfo_conversations
for select
using (user_id = public.current_clerk_user_id());

create policy "ai_cfo_conversations_insert_own"
on public.ai_cfo_conversations
for insert
with check (user_id = public.current_clerk_user_id());

create policy "ai_cfo_conversations_update_own"
on public.ai_cfo_conversations
for update
using (user_id = public.current_clerk_user_id())
with check (user_id = public.current_clerk_user_id());

create policy "ai_cfo_conversations_delete_own"
on public.ai_cfo_conversations
for delete
using (user_id = public.current_clerk_user_id());

create policy "ai_cfo_messages_select_own"
on public.ai_cfo_messages
for select
using (user_id = public.current_clerk_user_id());

create policy "ai_cfo_messages_insert_own"
on public.ai_cfo_messages
for insert
with check (user_id = public.current_clerk_user_id());

create policy "ai_cfo_messages_delete_own"
on public.ai_cfo_messages
for delete
using (user_id = public.current_clerk_user_id());
