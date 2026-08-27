# Target Architecture

Browser
→ Next.js UI
→ Server Components / Server Actions / Route Handlers
→ Domain calculations + validation
→ Supabase PostgreSQL + RLS

Authentication:
Clerk → authenticated identity → Supabase JWT → RLS.

Payment Proof flow:
Browser PDF upload
→ authenticated server endpoint/action
→ private Supabase Storage
→ PDF extraction / OpenAI structured extraction
→ Zod validation
→ Expense Draft
→ user review/edit
→ server-side final validation
→ Expense INSERT
→ retain original PDF path on Expense.

AI must never directly mutate the Expense table.

Payment proof storage must be private and access-controlled.
