# Phase 03 — Project Data Migration

## Objective

Safely migrate database/data structures. Add Project budget/currency, backfill existing expenses to valid Projects using an explicit strategy, reconcile currencies, remove expense currency only after verification, tighten project_id, preserve RLS and document rollback considerations.

## Acceptance Criteria

- Phase requirements implemented.
- No future phase implemented.
- Unrelated functionality remains intact.
- Security/RLS preserved.
- Financial formulas match PRODUCT_MODEL.md.
- Relevant checks pass.
- Changed files and verification results reported.

## Required Reading

- docs/CURSOR_RULES.md
- docs/PRODUCT_MODEL.md
- docs/ARCHITECTURE.md
- docs/DATABASE_TARGET.md
- docs/UX_FLOW.md

## Stop Condition

STOP after this phase and wait for explicit user approval.
