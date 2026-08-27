# Cursor Rules

## Approval gate
Execute exactly one phase. Verify it. STOP. Never start another phase without explicit approval.

## Refactor, don't rewrite
Inspect current code first. Reuse working modules. Avoid unrelated dependency/framework changes.

## Data safety
Never silently delete or overwrite user data. Database changes must be additive/backfilled/verified before constraints are tightened.

## Security
Clerk owns identity. Supabase owns application data and RLS. Never expose service-role credentials to the browser. Never weaken RLS.

## Project context
All expense operations must have an active Project context. Project ID is mandatory.

## Currency
Project currency is authoritative. Expense currency is inherited and cannot be changed independently.

## Financial truth
Use centralized deterministic calculations:
- total expense budget = SUM(expense budget)
- total paid = SUM(paid)
- total expense remaining = SUM(budget - paid)
- available project budget = project budget - total expense budget
- expense paid % = paid / expense budget
- project budget impact % = paid / project budget

Never mix currencies.

## Payment Proof
A Payment Proof is a specialized evidence document, not a generic attachment feature.
- PDF only.
- Preserve original PDF after expense creation.
- Store in private Supabase Storage.
- Never expose a public bucket.
- Use signed URLs for authorized viewing/download.
- AI creates a draft only.
- User must review and confirm before database insertion.
- Never trust AI output without schema validation.
- Never let AI decide Project, Priority or final Category without user confirmation.
- Payment amount may be extracted from the proof; Expense Budget must be treated as a suggested value if the proof only establishes payment.

## AI
AI is interpretation/extraction, not source of financial truth.
Validate structured AI output with Zod.
Handle uncertain/missing fields explicitly.
Do not fabricate values.

## Verification
Run relevant tests, TypeScript, lint and build when practical. Review diff for accidental changes.

## Git
Feature branch per phase. Commit format:
refactor(phase-NN): short description
