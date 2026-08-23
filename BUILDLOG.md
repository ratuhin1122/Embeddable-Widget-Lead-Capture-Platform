# BUILDLOG — AI Usage Log

Honest record of where AI helped, where it was wrong, and what was changed.

## Phase 1 — Design & Project Scaffold
- **AI assisted**: Project scaffolding, Knex configuration, database migrations (`users`, `widgets`, `submissions`), config loader, Docker Compose setup, and package manifests.
- **What I changed**: Made Knex configuration dynamically support both PostgreSQL (via Docker Compose) and SQLite (for zero-dependency testing and lightweight runs). Configured UUID primary keys and JSON parsing.
- **Where AI was wrong**: Initially relied only on native PostgreSQL UUID generation; updated to generate standard RFC4122 UUIDs in repository layers for universal cross-engine consistency.

## Phase 2 — The Hardened Submission Path
- **AI assisted**: Layered architecture separation (Data / Logic / HTTP), Zod schemas for input validation, JWT authentication middleware, rate limiting with `express-rate-limit`, CORS preflight handling, honeypot spam filter, geo enrichment fallback chain (`ip-api.com` -> `ipapi.co` -> graceful degrade), and safe email notification side effect with error insulation.
- **What I changed**: Ensured CORS headers are always attached even on 4xx/5xx responses so cross-origin browsers receive clean readable error bodies rather than generic network errors.
- **Where AI was wrong**: Honeypot initial dummy test passed random non-existent widget IDs; updated test fixtures to ensure tenant widgets exist before verifying honeypot silent-drop logic.

## Phase 3 — Delivery, Dashboard & Proof
- **AI assisted**: Embeddable `widget.js` script with dynamic form generator, styling themes, honeypot injection, public cached config delivery (`Cache-Control: public, max-age=300`), immutable script caching (`max-age=31536000, immutable`), test page on second origin, and dashboard endpoints for paginated submissions, counts by day, widget breakdown, and geo distribution.
- **What I changed**: Added CSS transitions, responsive mobile-friendly form styling, and clear feedback states (loading, success, error) to the embed script.

## Phase 4 — Demo Prep & Polish
- **AI assisted**: Comprehensive `README.md` with architecture diagram, `capstone.yaml` manifest, `EVIDENCE.md` test outputs, and seed script creating realistic sample multi-tenant data.
- **What I changed**: Verified all 9 test suites / 30 automated test cases execute with 100% pass rate.
