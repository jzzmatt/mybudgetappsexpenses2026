# Cursor Refactoring Rules

## Approval gate
Implement exactly one phase at a time. After verification, STOP and wait for explicit approval.

## Inspect before editing
Inspect routes, components, server actions, queries, migrations and tests before changing code. Never assume the repository matches this blueprint.

## Preserve working behavior
This is a refactor, not a rewrite. Prefer incremental changes, additive migrations and reusable existing code. Do not replace Next.js, Clerk or Supabase without explicit approval.

## Data safety
Never silently delete user data. For schema changes: migrate, backfill, verify, then tighten constraints. Document rollback considerations.

## Financial correctness
Use formulas in PRODUCT_MODEL.md. Centralize calculations. Never mix currencies. Project currency is inherited by Expenses.

## Security
Preserve Supabase RLS. Never expose service-role credentials to the browser. Do not weaken RLS to simplify implementation.

## AI
AI interprets deterministic project-level data. No chatbot, forecasting, OCR or AI categorization.

## Verification
Run relevant tests, TypeScript checking, lint and build when practical. Distinguish phase-caused failures from pre-existing failures.

## Git
Use a feature branch per phase. Commit format: `refactor(phase-NN): short description`. Do not rewrite history without approval.
