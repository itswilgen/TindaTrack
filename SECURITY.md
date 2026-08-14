# Security Policy

## Reporting

Report suspected vulnerabilities privately to the project owner. Do not include API keys, passwords, customer data, or full payment payloads in screenshots or issue trackers.

## Local secrets

Copy each `.env.example` to `.env` and keep the resulting files local. Firebase service-account JSON and PayMongo keys must never be committed. Rotate a credential immediately if it appears in Git history, logs, chat, or a client-side bundle.

Browser JWTs are stored only in an `HttpOnly` cookie. Do not reintroduce authentication tokens in `localStorage` or expose provider secrets through `VITE_*` variables.

Registration uses an SMS possession check before the user and business records are created. `SMS_OTP_PROVIDER=console` is development-only; production startup requires Twilio Verify credentials. OTPs must never be logged or returned by production APIs.

Generate a JWT secret with at least 32 random bytes, for example:

```sh
openssl rand -base64 48
```

## Deployment checklist

- Use HTTPS for the frontend, API, and PayMongo webhook.
- Prefer a same-site frontend/API deployment or reverse proxy so secure session cookies work predictably.
- Set `NODE_ENV=production` and an HTTPS `FRONTEND_URL`.
- Use live PayMongo keys only in the backend secret manager.
- Configure a dedicated PayMongo webhook secret and verify delivery in the dashboard.
- Configure a Twilio Verify Service and set `SMS_OTP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in the backend secret manager.
- Set the exact `TRUST_PROXY_HOPS` value for the hosting topology.
- Use a restricted MySQL user instead of `root`.
- Set `DB_SSL=true` for a remote production MySQL server.
- Run backend and frontend production audits and builds.
- Rotate all development credentials before processing real store data.
- Confirm expired trials receive `402 Payment Required` from store-operation APIs while subscription checkout remains available.
- Create production super administrators through a controlled deployment process. Never run `seed-super-admin.sql` in production, and rotate any local test password before sharing an environment.
