# PayMongo Hosted Checkout Setup

This app uses PayMongo Hosted Checkout V2 from the backend.

## 1. Backend Environment

Create or update `backend/.env`:

```env
PAYMENT_PROVIDER=paymongo
PAYMONGO_SECRET_KEY=sk_test_your_key_here
PAYMONGO_WEBHOOK_SECRET=your_webhook_secret_here
PAYMONGO_HOSTED_PAYMENT_METHOD_TYPES=card,gcash,qrph
FRONTEND_URL=http://localhost:5173
```

Use `sk_test_...` while testing. Switch to the live secret key only when your PayMongo account and domain are ready for production.

## 2. Frontend Environment

Create or update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

## 3. Webhook Endpoint

Register this endpoint in the PayMongo dashboard:

```text
https://your-domain.com/api/v1/payments/webhooks/paymongo
```

For local testing, expose the backend with a tunnel such as ngrok:

```bash
ngrok http 5001
```

Then use:

```text
https://your-ngrok-domain.ngrok-free.app/api/v1/payments/webhooks/paymongo
```

Listen for the `checkout_session.payment.paid` event.

## 4. Flow

1. User fills out billing address in TindaTrack.
2. Backend creates a PayMongo `/v2/checkout_sessions` session.
3. Frontend redirects to PayMongo's `checkout_url`.
4. PayMongo handles payment methods and card/wallet details.
5. PayMongo sends `checkout_session.payment.paid` to the webhook.
6. Backend marks the transaction paid and activates the subscription.

## 5. Verify

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

PayMongo Hosted Checkout docs:
https://docs.paymongo.com/docs/payment-channels-hosted-checkout
