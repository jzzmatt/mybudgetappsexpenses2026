-- Demo seed data for Budget App (Phase 03)
-- Default Clerk user id for this project. Override with:
-- select set_config('app.seed_clerk_user_id', 'user_YOUR_ID', false);

do $$
declare
  seed_user_id text := coalesce(
    current_setting('app.seed_clerk_user_id', true),
    'user_3HEC2u3iI0PzsKUUZyF3si8TOqn'
  );
  infra_id uuid;
  marketing_id uuid;
  operations_id uuid;
  hr_id uuid;
  technology_id uuid;
  alpha_id uuid;
  beta_id uuid;
  gamma_id uuid;
  delta_id uuid;
  cloud_vendor_id uuid;
begin
  insert into public.users (id, email, full_name)
  values (seed_user_id, 'mateusjunior.ns@gmail.com', 'Junior Mateus')
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  insert into public.categories (user_id, name, description)
  values
    (seed_user_id, 'Infrastructure', 'Infrastructure and hosting costs'),
    (seed_user_id, 'Marketing', 'Campaigns and brand spend'),
    (seed_user_id, 'Operations', 'Day-to-day operating expenses'),
    (seed_user_id, 'HR', 'People and culture'),
    (seed_user_id, 'Technology', 'Software and tooling')
  on conflict (user_id, name) do nothing;

  select id into infra_id from public.categories where user_id = seed_user_id and name = 'Infrastructure';
  select id into marketing_id from public.categories where user_id = seed_user_id and name = 'Marketing';
  select id into operations_id from public.categories where user_id = seed_user_id and name = 'Operations';
  select id into hr_id from public.categories where user_id = seed_user_id and name = 'HR';
  select id into technology_id from public.categories where user_id = seed_user_id and name = 'Technology';

  insert into public.projects (user_id, name, description, budget_amount, currency, status)
  values
    (seed_user_id, 'Alpha Platform', 'Core platform delivery', 250000::numeric, 'KZ', 'active'),
    (seed_user_id, 'Beta Launch', 'Go-to-market launch', 150000::numeric, 'KZ', 'active'),
    (seed_user_id, 'Gamma System', 'Internal systems modernization', 320000::numeric, 'KZ', 'active'),
    (seed_user_id, 'Delta Portal', 'Customer portal rollout', 180000::numeric, 'KZ', 'active')
  on conflict (user_id, name) do update
  set budget_amount = excluded.budget_amount,
      currency = excluded.currency;

  select id into alpha_id from public.projects where user_id = seed_user_id and name = 'Alpha Platform';
  select id into beta_id from public.projects where user_id = seed_user_id and name = 'Beta Launch';
  select id into gamma_id from public.projects where user_id = seed_user_id and name = 'Gamma System';
  select id into delta_id from public.projects where user_id = seed_user_id and name = 'Delta Portal';

  insert into public.vendors (user_id, name, contact_info)
  values
    (seed_user_id, 'Cloud Provider', 'billing@cloud.example'),
    (seed_user_id, 'Office Supplies Co.', 'orders@office.example'),
    (seed_user_id, 'Creative Agency', 'hello@agency.example')
  on conflict (user_id, name) do nothing;

  select id into cloud_vendor_id from public.vendors where user_id = seed_user_id and name = 'Cloud Provider';

  insert into public.budgets (user_id, category_id, project_id, name, amount, currency, month, year)
  select seed_user_id, seed.category_id, seed.project_id, seed.name, seed.amount, seed.currency, seed.month, seed.year
  from (
    values
      (technology_id, alpha_id, 'Alpha Platform Technology Budget', 250000::numeric, 'KZ', 7, 2026),
      (marketing_id, beta_id, 'Beta Launch Marketing Budget', 150000::numeric, 'KZ', 7, 2026),
      (infra_id, gamma_id, 'Gamma System Infrastructure Budget', 320000::numeric, 'KZ', 7, 2026),
      (operations_id, delta_id, 'Delta Portal Operations Budget', 180000::numeric, 'KZ', 7, 2026)
  ) as seed(category_id, project_id, name, amount, currency, month, year)
  where not exists (
    select 1
    from public.budgets existing
    where existing.user_id = seed_user_id
      and existing.name = seed.name
      and existing.year = seed.year
      and existing.month = seed.month
  );

  insert into public.expenses (
    user_id,
    date,
    month,
    year,
    category_id,
    project_id,
    vendor_id,
    description,
    budget_amount,
    paid_amount,
    currency,
    payment_method,
    priority,
    status,
    notes
  )
  select
    seed_user_id,
    seed.date,
    seed.month,
    seed.year,
    seed.category_id,
    seed.project_id,
    seed.vendor_id,
    seed.description,
    seed.budget_amount,
    seed.paid_amount,
    seed.currency,
    seed.payment_method,
    seed.priority,
    seed.status,
    seed.notes
  from (
    values
      ('2026-07-15'::date, 7, 2026, technology_id, alpha_id, cloud_vendor_id, 'Cloud Infrastructure', 45000::numeric, 45000::numeric, 'KZ', 'bank_transfer', 'high', 'paid', null::text),
      ('2026-07-12'::date, 7, 2026, marketing_id, beta_id, null::uuid, 'Marketing Campaign', 28500::numeric, 15000::numeric, 'KZ', 'card', 'medium', 'partial', null::text),
      ('2026-07-10'::date, 7, 2026, operations_id, delta_id, null::uuid, 'Office Supplies', 3200::numeric, 3200::numeric, 'KZ', 'card', 'low', 'paid', null::text),
      ('2026-07-08'::date, 7, 2026, hr_id, gamma_id, null::uuid, 'Team Building', 12000::numeric, 0::numeric, 'KZ', 'bank_transfer', 'medium', 'pending', null::text),
      ('2026-07-05'::date, 7, 2026, technology_id, alpha_id, cloud_vendor_id, 'Software License', 8750::numeric, 8750::numeric, 'KZ', 'card', 'high', 'paid', null::text)
  ) as seed(date, month, year, category_id, project_id, vendor_id, description, budget_amount, paid_amount, currency, payment_method, priority, status, notes)
  where not exists (
    select 1
    from public.expenses existing
    where existing.user_id = seed_user_id
      and existing.description = seed.description
      and existing.date = seed.date
  );
end $$;
