# TindaTrack Architecture

## Application boundaries

- `frontend/` contains the React application, route guards, feature pages, and API clients.
- `frontend/src/features/auth/` owns typed browser session state, role routing, and cleanup.
- `backend/src/config/` owns validated environment configuration and infrastructure clients.
- `backend/src/routes/` defines HTTP routes and composes authentication, authorization, and rate limits.
- `backend/src/controllers/` validates HTTP input and maps service/model results to API responses.
- `backend/src/services/` owns external integrations and multi-step business workflows.
- `backend/src/models/` is the only layer that reads or writes MySQL.
- `backend/src/middleware/` contains cross-cutting HTTP security and request handling.
- `backend/src/utils/` contains stateless validation, response, and cryptographic helpers.
- `backend/database/` contains the canonical schema, migrations, and non-production seed data.

## Request flow

1. Request ID and security headers are attached.
2. CORS and bounded body parsing run.
3. Global and route-specific rate limits run.
4. The session-cookie or bearer JWT is verified with issuer, audience, and algorithm restrictions.
5. Current account status and role are loaded from MySQL.
6. Trial/subscription middleware blocks expired store operations while preserving payment access.
7. Role middleware enforces the route permission matrix.
8. Controllers validate input and invoke services or models.
9. Responses use one JSON envelope and include a request ID.

## Role matrix

| Module | Owner | Cashier | Inventory staff |
| --- | --- | --- | --- |
| Dashboard and finance | Yes | No | No |
| POS | Yes | Yes | No |
| Sales | Yes | Yes | No |
| Products | Yes | No | Yes |
| Inventory and stock-in | Yes | No | Yes |
| Reports, staff, settings, plans | Yes | No | No |

Super administrators are platform accounts without a store workspace. They use isolated `/api/v1/admin` routes to manage platform trial policy, store status, and user status. Store roles cannot access those routes.

The backend is authoritative. Frontend route guards improve navigation but never replace API authorization.

## Security rules

- Never commit `.env`, Firebase service accounts, private keys, or provider secrets.
- Browser authentication uses an `HttpOnly`, `SameSite=Lax` cookie. JWTs are not persisted in browser storage.
- Bearer authentication remains available for trusted mobile and API clients.
- Production startup fails when JWT or payment configuration is unsafe.
- Phone-first owner registration is verified through Twilio Verify in production; local OTP output is allowed only in development.
- Store logos are bounded image data, validated server-side, and fall back to TindaTrack branding when absent.
- Trial status is computed from database dates, not browser state. New trial duration comes from the protected `default_trial_days` platform setting.
- PayMongo secret keys remain server-side. Payment fulfillment requires verified server status or a signed webhook.
- Webhook signatures use the raw payload, timestamp validation, HMAC-SHA256, and timing-safe comparison.
- All SQL values must use parameterized queries.
- Every new write endpoint must include authentication, role authorization, validation, and a suitable rate limit.
- Run `npm run audit:prod` in both applications before deployment.

## Production scaling

The current rate-limit store is process-local. Before running multiple API instances, configure a shared Redis-compatible rate-limit store. Store secrets in the deployment platform's secret manager and set `TRUST_PROXY_HOPS` to the exact proxy count.
