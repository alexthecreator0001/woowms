# MANDATORY RULES

1. **VPS DEPLOY COMMAND**: After EVERY change, provide a single one-liner command for the user to run on VPS to pull and restart. Format: `cd /var/www/woowms && git pull && cd backend && npm install && npx prisma generate && pm2 restart woowms-backend && cd ../frontend && npm install && npm run build && pm2 restart woowms-frontend`
   - Shorten the command if the change only affects backend or frontend (skip the other).
   - If DB migrations were added: include `npx prisma migrate deploy` in the command.
   - If no dependency changes: skip `npm install`.
2. **CHANGELOG**: Update `CHANGELOG.md` with every change. Add entry under current version with date, short description, and category (Added/Changed/Fixed/Removed).
3. **VERSION BUMP**: Bump the version in the relevant `package.json` (backend, frontend, or both) with every change. Use semver:
   - Patch (x.x.X) for fixes and small changes
   - Minor (x.X.0) for new features
   - Major (X.0.0) for breaking changes
4. **GIT PUSH**: After EVERY change, commit and push to GitHub. Always commit + push before giving the VPS deploy command.
5. **DESIGN IS #1 PRIORITY**: UI/UX design quality is the top priority. Every frontend change must look polished, modern, and professional. Never ship ugly or default-looking UI.
6. **USE LUCIDE-REACT ICONS**: Always use `lucide-react` (shadcn's icon library) for all icons. Import from `lucide-react`.

---

# WooWMS - Warehouse Management System for WooCommerce

## Project Overview
A full-featured WMS web application that integrates with WooCommerce via REST API + Webhooks.

## Tech Stack
- **Backend:** Node.js + Express.js
- **Frontend:** React (Vite)
- **Database:** PostgreSQL with Prisma ORM
- **WooCommerce Integration:** REST API v3 + Webhooks
- **Auth:** JWT-based authentication
- **Deployment:** Vultr VPS (Ubuntu 22.04/24.04)

## Project Structure
```
woowms/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── models/       # Prisma schema + DB
│   │   ├── middleware/    # Auth, error handling
│   │   ├── woocommerce/  # WooCommerce API client + webhooks
│   │   └── config/       # App configuration
│   └── prisma/           # Prisma schema + migrations
├── frontend/         # React (Vite) SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/     # API client
│       └── store/        # State management
└── docker/           # Docker configs (optional)
```

## Core Modules
1. **Orders** — Sync from WooCommerce, manage fulfillment workflow
2. **Inventory** — Stock levels, SKU management, low-stock alerts
3. **Shipping** — Label generation, tracking, carrier integration
4. **Warehouse** — Zones, bins/locations, warehouse map
5. **Picking** — Pick lists, wave picking, pack & ship workflow
6. **Receiving** — Inbound shipments, purchase orders, stock receiving

## Conventions
- Use ES modules (import/export), not CommonJS
- Use async/await, no raw callbacks
- API routes prefixed with `/api/v1/`
- Environment variables via `.env` file (never commit)
- Prisma for all database operations
- Error responses: `{ error: true, message: "...", code: "ERROR_CODE" }`
- Success responses: `{ data: {...}, meta: {...} }`
- Use snake_case for database columns, camelCase for JS variables
- All dates stored as UTC in database

## WooCommerce Integration
- Connect via consumer key + consumer secret (API keys)
- Webhook events: order.created, order.updated, product.updated, stock.updated
- Sync runs: webhooks for real-time + polling every 5 min as fallback
- WooCommerce data cached locally in PostgreSQL

## VPS Deployment (Vultr Ubuntu 22.04)
- Node.js via nvm
- PostgreSQL 16
- Nginx reverse proxy
- PM2 process manager
- Let's Encrypt SSL via certbot
- UFW firewall
- App directory: `/var/www/woowms`
