# AI CFO

AI CFO is a read-only financial assistant. It answers natural-language questions about the signed-in user's BudgetApp data.

**BudgetApp database is the source of truth.**

OpenAI chooses tools and writes the reply. It does not receive database credentials, and it is not a source of financial facts. There is no web search tool.

## Architecture

```text
User
  → /ai-cfo
  → POST /api/ai-cfo/chat
  → OpenAI (tool selection and wording)
  → controlled tools in lib/ai-cfo/tools.ts
  → Supabase queries scoped with the Clerk user id and RLS
  → deterministic totals in lib/ai-cfo/aggregate.ts
  → OpenAI
  → reply, evidence, and source summary
```

Financial sums use `paid_amount` for spending (`basis: "paid"`) and `budget_amount` for budgeted amounts (`basis: "budget"`). Payment status comes from `expenses.status` (`pending`, `partial`, `paid`). There is no separate payments table.

## Tools

All tools are read-only and ignore any user id supplied by the model.

- `search_categories`, `get_category`
- `search_projects`, `get_project`
- `search_expenses`, `get_expense`
- `get_expenses_by_category`, `get_expenses_by_project`, `get_expenses_by_period`
- `get_payment_status`
- `calculate_expense_total`, `calculate_category_total`, `calculate_project_total`
- `get_monthly_summary`
- `get_budget_summary`, `get_budget_vs_actual`
- `get_unpaid_expenses`

Names are matched by normalized whole tokens (accents and hyphens ignored). Several confident matches are returned as ambiguous instead of being merged. A month without a year is not guessed.

## Security

- The route requires the existing Clerk session via `ensureUserRecord()`.
- Queries use the user-scoped Supabase server client (`user_id = authenticated user`) and existing RLS (`current_clerk_user_id()`).
- The service role is not used.
- Conversation rows in `ai_cfo_conversations` and `ai_cfo_messages` have their own RLS policies.
- Requests that ask for another user's data, secrets, or external information are refused before any tool runs.
- Rate limit: `AI_CFO_RATE_LIMIT` requests per user per hour (default 30).

Apply `supabase/migrations/20260927120000_ai_cfo_conversations.sql` before relying on saved chats. If the tables are missing, answers still return and history is skipped.

## Environment

```env
OPENAI_API_KEY=
AI_CFO_MODEL=
AI_CFO_RATE_LIMIT=30
AI_CFO_TIMEZONE=Africa/Luanda
```

`OPENAI_API_KEY` stays on the server. `AI_CFO_MODEL` overrides `OPENAI_MODEL` for this feature only. The default timezone is `Africa/Luanda` because expense dates are calendar dates for this product. Do not commit real keys.

## Logging

Each request logs `user_id`, `request_id`, tool name, duration, success, model, and token counts when OpenAI returns them. Message text and secrets are not logged.

## Tests

`tests/ai-cfo/finance.test.ts` covers category totals, last-3-month grouping, multiple payment matches, separate currencies, August 31 / September 1, leap years, the Luanda date line, ambiguous names, prompt-injection refusals, and the rate limiter.

Live model answers still depend on `OPENAI_API_KEY` and the signed-in user's rows.

## Limits

- Version 1 cannot create or edit financial records.
- List tools return at most 50 rows. Totals scan up to 2000 matching rows and mark evidence as truncated in the tool payload.
- Currency conversion is not performed.
- Vector search is not used. Structured SQL filters are enough for this schema.
- The chat UI follows the app's light theme and adds a dark treatment when the device requests dark mode.

## Later tools

The tool registry can grow with `get_cash_flow`, `compare_periods`, or `get_top_expenses` without giving the model SQL access.
