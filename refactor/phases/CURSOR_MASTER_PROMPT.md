# Cursor Master Prompt

You are refactoring the existing Budget Expenser repository.

Read the required project documents before editing.

This is an incremental refactor. Do not rebuild working functionality unnecessarily.

For the requested phase:
1. Inspect the current implementation.
2. Map dependencies and data flow.
3. Identify the smallest safe implementation.
4. Implement ONLY the requested phase.
5. Preserve security and existing working behavior.
6. Run relevant tests, typecheck, lint and build where practical.
7. Review the diff for unrelated changes.
8. Report exactly what changed and what was verified.
9. STOP.

Do not start the next phase until the user explicitly approves it.

For Payment Proof:
PDF → private storage → AI extraction → validated draft → user review → confirmed Expense + retained original PDF.

Never:
PDF → AI → automatic database Expense.

Never let AI invent missing values.
Never let AI override Project currency.
Never expose private storage publicly.
