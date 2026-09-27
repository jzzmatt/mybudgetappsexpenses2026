-- Store the conversation's active project. Financial queries still authorize
-- project ownership on every request; this column is context, not a grant.

alter table public.ai_cfo_conversations
  add column if not exists active_project_id uuid references public.projects (id) on delete set null;

alter table public.ai_cfo_conversations
  add column if not exists pending_question text;

create index if not exists ai_cfo_conversations_active_project_id_idx
  on public.ai_cfo_conversations (active_project_id);

create index if not exists expenses_user_project_date_idx
  on public.expenses (user_id, project_id, date desc);
