# aerozag-backend

AeroZag SDR chatbot + lead capture API. Hosted on Railway.

## Stack
- Node 20 + TypeScript + Express
- SQLite (better-sqlite3) on Railway persistent volume
- OpenRouter (`z-ai/glm-5.2`) for the SDR chatbot
- Nodemailer + Gmail SMTP for lead notifications

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/chat` | — | SDR chatbot (rate-limited 20 req/min) |
| POST | `/api/leads` | — | Manual lead form submission |
| GET | `/api/leads` | `X-Admin-Token` header | List all leads |

## Local dev

```bash
cp .env.example .env
# fill in API keys
npm install
npm run dev
```

## Environment variables (set in Railway)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `GMAIL_USER` | Gmail address for SMTP sender |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not main password) |
| `LEAD_NOTIFY_EMAIL` | Where lead notifications are sent |
| `ADMIN_TOKEN` | Long random secret for GET /api/leads |
| `ALLOWED_ORIGIN` | Netlify domain (comma-separated for multiple) |
| `DB_PATH` | SQLite file path (set to `/data/aerozag.db` via Railway volume) |
| `PORT` | Server port (Railway sets this automatically) |

## Railway deployment

1. Push this repo to GitHub
2. New project → Deploy from GitHub repo → select this repo
3. Add a Volume: mount path `/data`
4. Set all environment variables above
5. Deploy — Railway builds via Dockerfile automatically
