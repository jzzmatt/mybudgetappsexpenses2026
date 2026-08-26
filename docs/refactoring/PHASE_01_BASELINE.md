# Phase 01 — Discovery and Safe Baseline

**Date:** Wednesday, Aug 26, 2026  
**Status:** Completed  
**Branch:** `cursor/refactor-phase-01-02e7`

---

## 1. Executive Summary

This baseline audit establishes the current architectural, database, and operational state of the Budget App repository before starting functional domain refactoring.

The current codebase is functional and passes all type checks, linting, and Next.js builds. However, it currently operates on an **Expense-centric / Global Dashboard** model rather than the target **Project/Workspace-centric** model specified in `refactor/PRODUCT_MODEL.md`.

---

## 2. Current Architecture & State Inspection

### 2.1 Route Architecture (`app/`)
| Route | Category | Current Behavior | Target Blueprint Behavior |
|---|---|---|---|
| `/` | Landing / Redirect | Redirects to `/dashboard` | Redirects to `/projects` (or login) |
| `/dashboard` | Global Dashboard | Global KPIs, charts, top 5 pending, recent expenses, budget by project | Deprecated/replaced by Project Workspace Overview (`/projects/[id]`) |
| `/expenses` | Global Expense List | Global list of all expenses across all projects with filters and pagination | Replaced by Project-scoped expenses (`/projects/[id]/expenses`) |
| `/expenses/new` | Global Create Expense | Creates expense with optional project dropdown and manual currency picker | Project-scoped expense creation (`/projects/[id]/expenses/new`), inheriting currency |
| `/expenses/[id]/edit` | Global Edit Expense | Edits expense with project selector and independent currency | Project-scoped expense edit within current project |
| `/budgets` | Standalone Budgets | Separate budget entity tied optionally to category/project | Standalone `budgets` table removed; Project budget (`budget_amount`) becomes the primary budget container |
| `/budgets/new`, `[id]/edit` | Standalone Budgets | CRUD on standalone `budgets` table | Eliminated in favor of Project Budget |
| `/projects` | Project List | Simple table/card list (name, description, status) without financial workspace metadata | Primary home view (*My Projects*) with budget & currency |
| `/projects/new` | Create Project | Prompts for name, description, status | Requires name, `budget_amount`, `currency` (AOA default) |
| `/projects/[id]/edit` | Edit Project | Edits name, description, status | Edits name, description, status, `budget_amount`, `currency` |
| `/projects/[id]/expenses` | Project Expenses | Read-only expense listing with summary header | Main expense management table for project |
| `/categories` | Shared Categories | Shared category list and management | Preserved as shared user resource |
| `/vendors` | Shared Vendors | Shared vendor list and management | Preserved as shared user resource |
| `/reports` | Global Reports | Global report with period filters | Project-scoped reports (`/projects/[id]/reports`) |
| `/ai-report` | Global AI Report | Cross-project AI report generation | Project-scoped AI report (`/projects/[id]/ai-report`) |
| `/login`, `/register`, etc. | Authentication | Clerk-based authentication flows | Preserved |

### 2.2 Database Schema Inspection (`supabase/migrations/`)
- **`public.projects`**:
  - Existing columns: `id`, `user_id`, `name`, `description`, `status`, `created_at`, `updated_at`.
  - **Gap:** Missing mandatory `budget_amount` (numeric) and `currency` (text check in `'USD', 'EUR', 'KZ'` / default AOA).
- **`public.expenses`**:
  - Existing columns: `id`, `user_id`, `date`, `month`, `year`, `category_id`, `project_id`, `vendor_id`, `description`, `budget_amount`, `paid_amount`, `balance`, `payment_method`, `priority`, `status`, `notes`, `currency`, `created_at`, `updated_at`.
  - **Gap:** `project_id` is currently nullable (`references public.projects (id) on delete set null`). Target model requires `project_id NOT NULL`.
  - **Gap:** `currency` is stored at the expense level; target model inherits currency from `project`.
- **`public.budgets`**:
  - Standalone table with `amount`, `category_id`, `project_id`, `month`, `year`, `currency`.
  - **Target:** Scheduled for phase-out once Project Domain Model (Phase 02/03) is in place.
- **`public.categories` & `public.vendors`**:
  - Already properly scoped to `user_id` with RLS. Ready for reuse as shared resources.

### 2.3 Row Level Security (RLS) Baseline
- All tables (`users`, `categories`, `projects`, `vendors`, `budgets`, `expenses`) have RLS enabled with Clerk JWT claim validation via `auth.jwt() ->> 'sub'` (`public.current_clerk_user_id()`).
- Direct user isolation is maintained across `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.

### 2.4 Navigation Baseline (`components/layout/nav-items.ts`)
- Primary desktop navigation: Dashboard, Expenses, Budget, Categories, Projects, Vendors, Reports.
- Mobile bottom navigation: Dashboard, Expenses, Budget, Reports + More menu (Categories, Projects, Vendors, Sign out).
- **Target Navigation:** Projects (Home), Categories, Vendors, Settings. Project workspace contains internal project tabs (Overview, Expenses, Reports, AI Report).

---

## 3. Verification & Diagnostic Baseline

The following baseline validation checks were executed:

1. **TypeScript Typecheck (`npx tsc --noEmit`)**:
   - Status: **PASSED (0 errors)**.
2. **ESLint (`npm run lint`)**:
   - Status: **PASSED (0 errors, 0 warnings)**.
3. **Production Build (`next build`)**:
   - Status: **PASSED (Compiled 23 static/dynamic routes successfully)**.
4. **Environment Check (`scripts/verify-env.mjs`)**:
   - Requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

---

## 4. Phase 01 Findings & Strategy for Phase 02

1. **Domain Model Refactoring (Phase 02)**:
   - Introduce project domain types with mandatory `budget_amount` and `currency`.
   - Update expense domain models to enforce required `project_id`.
   - Build a centralized mathematical calculation module (`lib/projects/calculations.ts`) implementing all formulas defined in `refactor/PRODUCT_MODEL.md`.
2. **Safe Migration Strategy (Phase 03)**:
   - Additive database migration: add `budget_amount` and `currency` to `projects`.
   - Backfill strategy for existing unassigned expenses before applying `NOT NULL` constraint to `expenses.project_id`.
3. **No Breaking UX Changes in Phase 01**:
   - All existing user-facing functionality remains completely intact and verified.

---

## 5. Stop Condition

Phase 01 is complete. No product behavior was altered. All baseline diagnostics passed. Execution is stopped awaiting explicit user approval to proceed with Phase 02.
