# WhatsApp Business Cloud API

Paid expenses can be shared from BudgetApp. The server sends the payment text first, then each comprovativo or picture as its own WhatsApp document or image. The text never says that a file is attached. BudgetApp fills the share dialog with that text, and the user can edit it before sending. The server sends the edited text exactly, then each file as its own message.

Credentials stay in server environment variables. They are not sent to the browser.

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_VERSION=v22.0
```

`WHATSAPP_API_VERSION` should be a Graph API version Meta currently supports. `v22.0` is the default used by this app.

## Setup

1. Create a Meta Developer account at [developers.facebook.com](https://developers.facebook.com/).
2. Create a Meta application.
3. Add the WhatsApp product to that application.
4. Create or select a WhatsApp Business Account.
5. Add and verify the business phone number that will send messages.
6. Generate a system user or temporary access token with `whatsapp_business_messaging` permission.
7. Copy the Phone Number ID from the WhatsApp API setup page into `WHATSAPP_PHONE_NUMBER_ID`.
8. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, and `WHATSAPP_API_VERSION` in the server environment. Do not commit the values.
9. Configure the webhook only if you need delivery status callbacks. Sending does not require a webhook.
10. Send a text message to a number that has opted in, using the API setup tool.
11. Send a PDF with the media upload endpoint, then a document message that references the returned media id.
12. Send a JPEG the same way with an image message.
13. Put the production token and production phone number id in the hosting environment.
14. If Meta requires a template for business-initiated messages outside the customer care window, create that template in WhatsApp Manager and use it for production. The in-app sender currently posts a session text message plus media messages.
15. Mark an expense as paid in BudgetApp, open Share via WhatsApp, confirm the number, and send. The recipient should get the payment text and, when files exist, each file in a following message.

Apply `supabase/migrations/20260927150000_payment_evidence_and_share_logs.sql` before using payment evidence or share logs. Evidence files stay in the private `payment-proofs` bucket. The server downloads them and uploads the bytes to WhatsApp. Signed storage URLs are not placed in the message.
