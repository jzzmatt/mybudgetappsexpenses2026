# AI Payment Proof Specification

## Goal
Convert a user-uploaded PDF payment proof into a validated Expense Draft.

## Input
PDF from the authenticated user inside an active Project.

## Extraction schema
Suggested structured fields:
- date
- description
- vendor_person
- paid_amount
- currency_detected
- payment_method
- payment_reference
- suggested_expense_budget
- suggested_status
- notes
- extraction_warnings

## Rules
- Never invent missing data.
- Missing fields must be null/unknown.
- Paid amount should represent the amount evidenced by the document.
- Suggested Expense Budget may equal Paid Amount only as a clearly editable suggestion when no planned amount is present.
- Category is user-confirmed; AI may suggest but never silently assign.
- Priority is user-confirmed.
- Project comes from application context.
- Currency comes from Project; detected PDF currency is used for validation/warning, not authority.

## Output
Validated Expense Draft, never a database record.

## Example from supplied payment proof
The sample contains:
- Date/time: 2026-07-27 19:49:07
- Operation: Bank Transfer
- Recipient: ADRIANO UTALE CAMUTALI EDUARDO
- Amount/Total: 2,083,333.00 Kz
- Transaction: 32305151

These values are evidence for extraction testing, not hard-coded application values.
