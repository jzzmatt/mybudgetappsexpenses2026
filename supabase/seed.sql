-- Demo seed data for Budget App (Phase 03)
-- Replace the user id below with your Clerk user id before running, or set SEED_CLERK_USER_ID when using the seed script.

do $$
declare
  seed_user_id text := coalesce(current_setting('app.seed_clerk_user_id', true), 'user_seed_demo');
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
  values (seed_user_id, 'demo@budgetapp.local', 'Junior Mateus')
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

  insert into public.projects (user_id, name, description, status)
  values
    (seed_user_id, 'Alpha Platform', 'Core platform delivery', 'active'),
    (seed_user_id, 'Beta Launch', 'Go-to-market launch', 'active'),
    (seed_user_id, 'Gamma System', 'Internal systems modernization', 'active'),
    (seed_user_id, 'Delta Portal', 'Customer portal rollout', 'active')
  on conflict (user_id, name) do nothing;

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

  insert into public.budgets (user_id, category_id, project_id, name, amount, month, year)
  values
    (seed_user_id, technology_id, alpha_id, 'Alpha Platform Technology Budget', 250000, 7, 2026),
    (seed_user_id, marketing_id, beta_id, 'Beta Launch Marketing Budget', 150000, 7, 2026),
    (seed_user_id, infra_id, gamma_id, 'Gamma System Infrastructure Budget', 320000, 7, 2026),
    (seed_user_id, operations_id, delta_id, 'Delta Portal Operations Budget', 180000, 7, 2026);

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
    payment_method,
    priority,
    status,
    notes
  )
  values
    (seed_user_id, '2026-07-15', 7, 2026, technology_id, alpha_id, cloud_vendor_id, 'Cloud Infrastructure', 45000, 45000, 'bank_transfer', 'high', 'paid', null),
    (seed_user_id, '2026-07-12', 7, 2026, marketing_id, beta_id, null, 'Marketing Campaign', 28500, 15000, 'card', 'medium', 'partial', null),
    (seed_user_id, '2026-07-10', 7, 2026, operations_id, delta_id, null, 'Office Supplies', 3200, 3200, 'card', 'low', 'paid', null),
    (seed_user_id, '2026-07-08', 7, 2026, hr_id, gamma_id, null, 'Team Building', 12000, 0, 'bank_transfer', 'medium', 'pending', null),
    (seed_user_id, '2026-07-05', 7, 2026, technology_id, alpha_id, cloud_vendor_id, 'Software License', 8750, 8750, 'card', 'high', 'paid', null);
end $$;
