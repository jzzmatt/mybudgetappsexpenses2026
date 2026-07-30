-- Reassign demo seed data from user_seed_demo to your Clerk account.
-- Safe to run multiple times.

do $$
declare
  old_user_id text := 'user_seed_demo';
  new_user_id text := 'user_3HEC2u3iI0PzsKUUZyF3si8TOqn';
begin
  insert into public.users (id, email, full_name)
  values (new_user_id, 'mateusjunior.ns@gmail.com', 'Junior Mateus')
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  if exists (select 1 from public.users where id = old_user_id) then
    update public.categories set user_id = new_user_id where user_id = old_user_id;
    update public.projects set user_id = new_user_id where user_id = old_user_id;
    update public.vendors set user_id = new_user_id where user_id = old_user_id;
    update public.budgets set user_id = new_user_id where user_id = old_user_id;
    update public.expenses set user_id = new_user_id where user_id = old_user_id;
    delete from public.users where id = old_user_id;
  end if;
end $$;
