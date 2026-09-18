# Quick Start

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your MongoDB Atlas URI and secrets
npm run dev
```

Open http://localhost:3000. Login with the seed email/password configured in `.env.local`.

For production, configure the same variables in Vercel and set `COOKIE_SECURE=true`.
