# Product Model

## Mental model
User → Projects → Project Workspace → Expenses.

## Project
A Project is only a named financial workspace.

Required:
- id
- user_id
- name
- budget_amount
- currency
- created_at
- updated_at

Rules:
- Budget is mandatory.
- Currency is mandatory.
- Default is AOA/Kz.
- All Expenses inherit the Project currency.
- No Project goal, task, milestone or business-purpose semantics.

## Expense
Fields:
- id
- user_id
- project_id (required)
- date
- description
- category_id
- vendor_id
- budget_amount
- paid_amount
- priority
- status
- notes
- created_at
- updated_at

Derived:
- remaining = budget_amount - paid_amount
- expense_paid_percent = paid_amount / budget_amount * 100
- project_budget_impact_percent = paid_amount / project.budget_amount * 100

## Project formulas
- Project Budget = project.budget_amount
- Total Expense Budget = SUM(expenses.budget_amount)
- Total Paid = SUM(expenses.paid_amount)
- Total Expense Remaining = SUM(budget_amount - paid_amount)
- Available Budget = Project Budget - Total Expense Budget
- Project Paid % = Total Paid / Project Budget × 100
- Allocated % = Total Expense Budget / Project Budget × 100

## Overspending
Allow an expense that causes expense budgets to exceed the Project budget. Warn before confirmation; do not block.

## Shared resources
Categories and Vendors are user-owned and reusable across Projects.

## Reporting
All reports are Project-scoped. AI is interpretation, never financial source of truth.
