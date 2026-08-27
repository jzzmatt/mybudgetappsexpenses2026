# Product Model

## Project
A named financial workspace.

Required:
- id
- user_id
- name
- budget_amount
- currency
- created_at
- updated_at

## Expense
- id
- user_id
- project_id NOT NULL
- date
- description
- category_id
- vendor_id
- budget_amount
- paid_amount
- priority
- status
- notes
- payment_method
- payment_reference
- payment_proof_path
- payment_proof_filename
- created_at
- updated_at

Derived values:
remaining = budget_amount - paid_amount
expense_paid_percent = paid_amount / budget_amount * 100
project_budget_impact_percent = paid_amount / project.budget_amount * 100

## Project metrics
project_budget = project.budget_amount
total_expense_budget = SUM(expenses.budget_amount)
total_paid = SUM(expenses.paid_amount)
total_expense_remaining = SUM(budget_amount - paid_amount)
available_budget = project_budget - total_expense_budget

## Overspending
Allow expense budgets to exceed project budget. Warn before confirmation; do not block.

## Payment Proof
The original uploaded PDF remains associated with the created Expense.
The file is evidence of the payment/import source. It is not itself the financial source of truth.
