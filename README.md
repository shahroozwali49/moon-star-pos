# Moon Star POS — Next.js

Moon Star POS is a Next.js App Router application with MongoDB Atlas, HTTP-only JWT session cookies, and a responsive administration dashboard.

## Architecture

```
GitHub → Vercel (Next.js app + API routes) → MongoDB Atlas
```

Railway is not required for this architecture. The browser and API run from the same Next.js deployment, so the authentication cookie stays same-origin.

## Requirements

- Node.js 20+
- MongoDB Atlas
- npm
- Vercel account for deployment

## Local setup

1. Run `npm install`.
2. Copy `.env.local.example` to `.env.local`.
3. Edit `.env.local` and provide your real MongoDB URI, JWT secret, and seed administrator credentials.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

Never commit `.env.local`. It is intentionally ignored by Git.

## Vercel deployment

Import this GitHub repository into Vercel. Next.js is detected automatically.

In Vercel Project Settings → Environment Variables, add:

- `MONGODB_URI`
- `JWT_SECRET`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Use the Production, Preview, and Development scopes that you need. Redeploy after changing environment variables.

Do not put real values in GitHub. Vercel Environment Variables are the correct place for production secrets.

## First login

The first login request can create the configured seed Super Admin when the configured seed email does not already exist.

Use the seed credentials only for initial access, then implement a proper password-change/reset workflow before treating this as a production system.

## Included

- Secure login/logout
- HTTP-only JWT session cookie
- Current-user endpoint
- MongoDB User and Store models
- Super Admin store management
- Super Admin user management
- Store-specific user assignments
- Responsive admin dashboard
- Database health endpoint

## Important

This is a functional POS administration starter, not a fully audited commercial POS. Inventory, checkout, tax, receipts, payment integration, audit logs, password reset, rate limiting, and automated tests still need to be implemented and reviewed before production use.

## Security

If a real MongoDB password, JWT secret, or administrator password was ever committed to GitHub, rotate those credentials immediately. Removing a file from the latest commit does not remove older copies from Git history.

`.env.local.example` contains placeholders only and is safe to commit.

<!-- Vercel deployment trigger: 2026-09-22 -->
