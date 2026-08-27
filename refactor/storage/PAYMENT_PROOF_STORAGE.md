# Payment Proof Storage

Use a private Supabase Storage bucket named `payment-proofs`.

Never use a public URL.

Recommended object structure:
payment-proofs/{user_id}/{project_id}/{random_id}.pdf

Store only the object path and original filename in the expense record.

Access:
- Verify Clerk identity.
- Verify user owns the Project/Expense through application checks and RLS.
- Generate a short-lived signed URL for view/download.
- Do not expose service-role credentials to client code.

Validation:
- Accept PDF only.
- Enforce a documented maximum file size.
- Validate MIME type and extension server-side.
- Use a generated object name.
