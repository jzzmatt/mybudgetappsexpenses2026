# Target Architecture

Preserve the current stack unless a phase proves a change necessary:
- Next.js App Router
- React
- TypeScript
- Clerk
- Supabase PostgreSQL + RLS
- Zod
- React Hook Form
- Recharts
- OpenAI for AI Reporting
- Existing PDF/Excel capabilities where useful

Flow:
Browser → Next.js UI → Server Components/Actions → data/domain layer → Supabase + RLS.

AI flow:
Project data → deterministic aggregation → controlled AI context → OpenAI → Project AI Report.

Rules:
1. Project is the primary application context.
2. Expense CRUD always operates within a Project.
3. Project currency is inherited by Expenses.
4. RLS remains the ownership boundary.
5. Service-role access is exceptional, never normal CRUD.
6. Centralize financial calculations.
7. Dashboard, Reports and AI use the same definitions.
8. Avoid duplicate KPI formulas in UI components.
