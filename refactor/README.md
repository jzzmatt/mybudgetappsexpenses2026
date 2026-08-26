# Budget Expenser — Refactoring Blueprint

Approved direction: the application is Project/Workspace-centric, not Expense-centric.

Core rules:
- Project = named financial workspace, not a goal or project-management entity.
- Project creation requires name, budget and currency.
- Default currency is AOA/Kz.
- Expenses belong to exactly one Project.
- Expense currency is inherited from its Project.
- Categories and Vendors are shared user-level resources.
- Each Project has independent KPIs, charts and reports.
- AI Reporting is scoped to the active Project.
- No attachments, notifications, chatbot, OCR, categorization or forecasting.

Implementation target: existing repository, incremental refactor, Cursor-optimized workflow.
