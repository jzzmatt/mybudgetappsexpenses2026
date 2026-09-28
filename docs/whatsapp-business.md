# WhatsApp via WaAPI

Paid expenses can be shared from BudgetApp. The server sends the payment text first, then each comprovativo or picture as its own WhatsApp message. The text never says that a file is attached. BudgetApp fills the share dialog with that text, and the user can edit it before sending. The server sends the edited text exactly, then each file as its own message.

The WhatsApp gateway is [WaAPI](https://waapi.app) (`https://waapi.app/api/v1`). Credentials stay in server environment variables. They are not sent to the browser.

```env
WAAPI_API_TOKEN=
WAAPI_INSTANCE_ID=
```

`WAAPI_INSTANCE_ID` is the numeric instance id from the WaAPI dashboard.

## Setup

1. Create an account at [waapi.app](https://waapi.app).
2. Create a WhatsApp instance and scan the QR code so the instance is ready.
3. Copy the API token into `WAAPI_API_TOKEN`.
4. Copy the numeric instance id into `WAAPI_INSTANCE_ID`.
5. Set both variables in the server environment (for example Vercel) and redeploy. Do not commit the values.
6. Mark an expense as paid in BudgetApp, open Share via WhatsApp, confirm the number, and send.

The server posts the edited text to `POST /instances/{id}/client/action/send-message` with `chatId` set to `{digits}@c.us` and `message` set to the edited text. Each file is then posted to `POST /instances/{id}/client/action/send-media` as `mediaBase64` with `mediaName`. PDF and WebP files are sent with `asDocument: true`. JPEG and PNG files are sent with `asDocument: false`. Those requests do not include `mediaUrl` or a caption.

A WaAPI HTTP 200 response counts as a successful send only when both the outer `status` and `data.status` are `success`.

The share dialog counts characters up to 65536, the WhatsApp client text limit. WaAPI does not publish a smaller maximum for `message`.

Apply `supabase/migrations/20260927150000_payment_evidence_and_share_logs.sql` and `supabase/migrations/20260928120000_bulk_payments.sql` before using payment evidence, share logs, or bulk payments.

A bulk payment is one payment linked to many expenses. The share for that payment posts the edited message, then the payment evidence, through the same WaAPI actions. The saved share log stores `payment_id` and the final message. Evidence files stay in the private `payment-proofs` bucket. The server downloads them and sends the bytes as base64. Storage URLs are not placed in the message.
