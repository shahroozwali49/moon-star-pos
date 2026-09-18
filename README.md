# Moon Star POS — Next.js

A starter POS administration system using Next.js App Router, MongoDB, secure HTTP-only JWT cookies, and responsive styling.

## Requirements
- Node.js 20+
- MongoDB Atlas database
- npm

## Setup
1. Extract this folder and open it in VS Code.
2. Run `npm install`.
3. Copy `.env.local.example` to `.env.local`.
4. Set `MONGODB_URI`, a random `JWT_SECRET` (32+ characters), and seed admin credentials.
5. In MongoDB Atlas, allow your deployment's network access and create a database user.
6. Run `npm run dev`, then open http://localhost:3000.

The seed admin is created automatically when the first login request is made, if no user with the configured seed email exists. Change the seed password after first login and keep `.env.local` private.

## Deploy to Vercel
Push the project to GitHub, import it into Vercel, and add all variables from `.env.local.example` in Project Settings → Environment Variables. Set `COOKIE_SECURE=true`. For same-origin app/API use `COOKIE_SAME_SITE=lax`; use `none` only when you truly require cross-site cookies (and always with HTTPS). Redeploy after changing environment variables.

## Included
- Login/logout/current-user endpoints
- MongoDB User and Store models
- Super Admin store/user management endpoints
- Role and store-access checks
- Responsive admin dashboard shell
- Health endpoint

## Important
This is a functional starter, not a fully audited commercial POS. Store Admin and Cashier screens currently provide the base dashboard and store access view; inventory, checkout, tax, receipts, payment integration, audit logs, password reset, rate limiting, and automated tests should be implemented and reviewed before production use. Use a strong secret and never commit `.env.local`.
