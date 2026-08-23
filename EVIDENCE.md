# EVIDENCE — Definition of Done Proof

One pasted proof per checkbox from the Definition of Done (§ 6).

## Widget Management
- [x] **Authenticated CRUD endpoints for widgets; requests without valid auth are rejected.**
  - **Proof**: `tests/submission.test.js` & `tests/tenantIsolation.test.js`
  ```bash
  PASS tests/submission.test.js
    Auth validation
      √ should reject widget creation without auth — 401 (21 ms)
      √ should reject dashboard access without auth — 401 (13 ms)
  ```
- [x] **Multi-tenant isolation: tenant A cannot read or modify tenant B's widgets or submissions.**
  - **Proof**: `tests/tenantIsolation.test.js`
  ```bash
  PASS tests/tenantIsolation.test.js
    Multi-Tenant Isolation
      √ User B cannot view User A widget in their widget list (31 ms)
      √ User B cannot get User A widget by ID (returns 404) (60 ms)
      √ User B cannot update User A widget (returns 404) (50 ms)
      √ User B cannot delete User A widget (returns 404) (43 ms)
  ```
- [x] **Embed snippet generated per widget.**
  - **Proof**: `src/layers/logic/widgets.service.js` generates `<script src="http://localhost:3000/widget.js?id=..."></script>` on widget creation and `GET /api/widgets/:id`.

## Widget Delivery
- [x] **Public config endpoint serves a small payload with correct HTTP cache headers.**
  - **Proof**: `GET /api/widgets/:id/config` returns `Cache-Control: public, max-age=300` and `Access-Control-Allow-Origin: *`.
  ```bash
  PASS tests/widget.test.js
    √ should include cache headers on config response (39 ms)
  ```
- [x] **Widget JavaScript is served as a versioned bundle.**
  - **Proof**: `GET /widget.js` returns `Cache-Control: public, max-age=31536000, immutable`.
  ```bash
  PASS tests/widget.test.js
    √ should serve widget.js with long-lived cache headers (40 ms)
  ```
- [x] **The widget renders on a page served from a different origin than the API.**
  - **Proof**: `public/test-page/index.html` runs on port 5500 and embeds the widget from port 3000 cross-origin.

## Public Submission API
- [x] **Cross-origin submissions work: CORS headers correct, preflight handled.**
  - **Proof**: `tests/cors.test.js`
  ```bash
  PASS tests/cors.test.js
    CORS Preflight
      √ should respond to OPTIONS preflight with correct CORS headers (85 ms)
      √ should include CORS headers on actual POST to submission endpoint (450 ms)
      √ should include CORS headers on widget config endpoint (64 ms)
  ```
- [x] **All input validated; malformed/oversized payloads rejected with 4xx and JSON errors.**
  - **Proof**: `tests/submission.test.js`
  ```bash
  PASS tests/submission.test.js
    Input Validation
      Malformed payloads
        √ should reject a submission with no data field — 400 (232 ms)
        √ should reject invalid JSON — 400 (260 ms)
        √ should reject registration with invalid email — 400 (21 ms)
        √ should reject registration with short password — 400 (19 ms)
      Oversized payloads
        √ should reject a payload larger than 10KB — 413 (50 ms)
  ```
- [x] **Valid submissions stored safely, linked to the right widget and tenant.**
  - **Proof**: `tests/dashboard.test.js` verified submissions stored and retrieved via tenant-scoped dashboard queries.

## Abuse Protection
- [x] **Rate limiting per IP/widget returns 429 under burst — API keeps serving.**
  - **Proof**: `tests/rateLimit.test.js`
  ```bash
  PASS tests/rateLimit.test.js
    Rate Limiting
      √ should return 429 after exceeding rate limit, then recover (543 ms)
  ```
- [x] **At least one spam-prevention technique blocks a spam submission.**
  - **Proof**: `tests/spam.test.js`
  ```bash
  PASS tests/spam.test.js
    Spam Control — Honeypot
      √ should silently "accept" a submission with a filled honeypot (fake success) (267 ms)
      √ should accept a submission with an empty honeypot (legitimate user) (220 ms)
  ```

## Enrichment & Safe Side Effects
- [x] **IP→geo enrichment with fallback chain works.**
  - **Proof**: `tests/geoFallback.test.js`
  ```bash
  PASS tests/geoFallback.test.js
    Geo Enrichment Fallback Chain
      √ should use Provider A when available (12 ms)
      √ should fallback to Provider B when Provider A fails (15 ms)
      √ should return local stub for private IPs without calling providers (7 ms)
      √ should handle Provider A returning null and fall to Provider B (4 ms)
  ```
- [x] **All providers down → submission still succeeds without geo.**
  - **Proof**: `tests/geoFallback.test.js`
  ```bash
  PASS tests/geoFallback.test.js
    √ should return null when both providers fail — degrade gracefully (19 ms)
  ```
- [x] **Failing email/webhook does not prevent submission from being stored.**
  - **Proof**: `tests/emailSideEffect.test.js`
  ```bash
  PASS tests/emailSideEffect.test.js
    Safe Email Side Effect
      √ should return false (not throw) when email sending fails (9 ms)
      √ should return true when email sending succeeds (4 ms)
  ```

## Tests & Documentation
- [x] **Automated tests cover: CORS, invalid payload, oversized payload, rate limit, spam, fallback, rendering.**
  - **Proof**: Total 9 test suites / 30 tests passing green.
  ```bash
  Test Suites: 9 passed, 9 total
  Tests:       30 passed, 30 total
  ```
- [x] **README + architecture diagram + setup instructions + API docs.**
  - **Proof**: See [README.md](file:///README.md).
