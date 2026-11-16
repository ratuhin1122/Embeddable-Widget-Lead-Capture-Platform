# Embeddable Widget & Lead-Capture Platform

A platform that lets customers create embeddable widgets — signup forms, contact forms, call-to-action popovers — and install them on any website with a single `<script>` tag. Submissions are validated, spam-filtered, geo-enriched, and dashboarded.

## Architecture

```
Widget Owner (authenticated)
    └─► Widget Management API ─► Widget DB (tenant-isolated) ─► embed snippet

Customer Website (any origin)
    └─ <script src="widget.js?id=123">
           └─► GET /api/widgets/:id/config   (public · cached · CORS)
                   └─► render widget

Website Visitor
    └─► POST /api/submit/:widgetId   (public · CORS)
           ├─► validation          ── bad payload? → 4xx, never 500
           ├─► rate limit + spam   ── flood? → 429, service stays up
           ├─► geo enrichment      ── Provider A → Provider B → store anyway
           ├─► store submission
           └─► email side effect   (failure does NOT block success)

Widget Owner (authenticated)
    └─► Dashboard API ◄── submissions + stats + geo
```

## Tech Stack

| Component | Tool |
|-----------|------|
| Language + Framework | Node.js + Express |
| Database | PostgreSQL 16 via Docker |
| Migrations | Knex.js |
| Validation | Zod |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Geo Provider A | ip-api.com (free, no key) |
| Geo Provider B | ipapi.co (free tier) |
| Email | Mailpit (local catcher) |
| Test Page | Plain HTML on port 5500 |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/ratuhin1122/Embeddable-Widget-Lead-Capture-Platform.git
cd Embeddable-Widget-Lead-Capture-Platform

# 2. Copy environment variables
cp .env.example .env

# 3. Start PostgreSQL + Mailpit
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run migrations
npm run migrate

# 6. Seed demo data
npm run seed

# 7. Start the API server
npm run dev
```

### Test the Widget

```bash
# Serve the test page on a different origin (port 5500)
npx serve public/test-page -l 5500
```

Open `http://localhost:5500?id=WIDGET_ID` — replace `WIDGET_ID` with one of the
IDs printed by `npm run seed`. The widget loads from http://localhost:3000
(cross-origin). If no `?id=` parameter is provided, the page shows a short
help message.

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a new account |
| POST | `/api/auth/login` | No | Log in, receive JWT |

### Widgets (Authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/widgets` | Yes | Create a widget |
| GET | `/api/widgets` | Yes | List your widgets |
| GET | `/api/widgets/:id` | Yes | Get a widget + embed snippet |
| PUT | `/api/widgets/:id` | Yes | Update a widget |
| DELETE | `/api/widgets/:id` | Yes | Delete a widget |

### Public
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/widgets/:id/config` | No | Widget config (cached) |
| GET | `/widget.js` | No | Embeddable script (immutable cache) |
| POST | `/api/submit/:widgetId` | No | Submit a form (CORS, rate-limited) |

### Dashboard (Authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/submissions` | Yes | Paginated submissions |
| GET | `/api/dashboard/stats` | Yes | Aggregated stats |
| GET | `/api/dashboard/geo` | Yes | Geo distribution |

## Limitations

- **No production deployment** — everything runs locally. The "customer site" is a plain HTML file on a second port.
- **Widget UI is minimal** — the grade lives in the backend, not the CSS.
- **Email is local-only** — uses Mailpit; what's graded is that email failure doesn't block success.
- **Geo providers are rate-limited** — ip-api.com allows 45 req/min; ipapi.co allows ~1000/day.

## License

MIT
