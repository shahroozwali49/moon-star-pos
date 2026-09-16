# Moon Star POS — Milestone 1

React + Vite frontend, Express API, MongoDB/Mongoose, JWT in HttpOnly cookies.

## Setup
1. Create a MongoDB Atlas database and copy its connection string.
2. Copy `server/.env.example` to `server/.env` and fill values.
3. From `server/`: `npm install` then `npm run dev`
4. From `client/`: `npm install`, then `npm run dev`
5. Open the Vite URL. The first admin is created from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` on server startup if no super admin exists.

Deploy:
- Railway: deploy `server` as a service; set environment variables from `.env.example`.
- Vercel: deploy `client`, set `VITE_API_URL` to your Railway API URL (no trailing slash).
- For production cross-site cookies, set `CLIENT_ORIGIN` to your Vercel URL and `COOKIE_SECURE=true`. Use HTTPS.
- Set `COOKIE_SAME_SITE=none` for cross-site deployments; otherwise `lax` for same-site/local.
- Set a strong random `JWT_SECRET`; never commit `.env`.

This is a starter milestone, not a fully audited production system. Add rate limiting, audit logging, backup/restore testing, and stronger operational controls before handling live transactions.
