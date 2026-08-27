# Target Database

## projects
id
user_id
name
budget_amount
currency
created_at
updated_at

## expenses
id
user_id
project_id NOT NULL
date
description
category_id
vendor_id
budget_amount
paid_amount
priority
status
notes
payment_method
payment_reference
payment_proof_path
payment_proof_filename
created_at
updated_at

## Storage
Private bucket:
payment-proofs

Object path should be user/project/expense-scoped and non-guessable.

The database stores the storage object path/identifier, not a public URL.

## Migration
Existing expenses must be mapped to Projects before project_id becomes NOT NULL.
Existing expense currency data must be reconciled with Project currency.
Do not delete existing payment evidence or user data.
