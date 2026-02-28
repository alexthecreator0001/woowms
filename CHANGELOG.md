# Changelog

All notable changes to PickNPack will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.5.0] - 2026-02-28

### Added
- **Image proxy + cache** — backend route `GET /api/v1/images/proxy?url=&w=` fetches external WooCommerce images, resizes with `sharp`, converts to WebP, caches to disk, serves with 24h cache headers
- Frontend `proxyUrl()` helper in `lib/image.ts` — all product thumbnails in OrderDetail, Inventory, and ProductDetail now load through the proxy for fast, reliable rendering
- **Table column customization** — users can toggle which columns appear in Orders and Inventory tables via a "Columns" dropdown button
- `useTableConfig` hook with debounced save to backend + localStorage fallback
- `TableConfigDropdown` component with checkboxes and minimum 2-column enforcement
- `preferences` JSON column on User model (Prisma migration) for persisting column config
- `GET/PATCH /api/v1/account/preferences` endpoints for reading/updating user preferences
- "Tables" tab in Settings page to configure column visibility for Orders and Inventory
- **Full PO management** — complete purchase order lifecycle with create, view, edit, status transitions, receive items, and PDF export
- `GET /api/v1/receiving/:id` — single PO detail endpoint
- `PATCH /api/v1/receiving/:id` — edit PO fields and items (DRAFT only)
- `PATCH /api/v1/receiving/:id/status` — validated status transitions (DRAFT→ORDERED→RECEIVED etc.)
- `DELETE /api/v1/receiving/:id` — delete PO (DRAFT only)
- Pagination, status filter, and search on `GET /api/v1/receiving`
- Redesigned Receiving list page with status filter dropdown, search, pagination, total cost column, received/total items progress
- PO Detail page (`/receiving/:id`) — Shopify-style 2-column layout with items table, inline receive mode, cost summary, actions sidebar (status transitions, PDF download, delete)
- PO Create page (`/receiving/new`) — form with auto-generated PO number, supplier, expected date, notes, editable items table, save as Draft or save & mark Ordered
- PDF export via `jspdf` + `jspdf-autotable` — generates professional PO document with header, supplier info, items table, totals, and notes

### Changed
- Receiving list page now has pagination (25/page), status filter, search, clickable rows navigating to detail page
- Product images in Inventory/OrderDetail/ProductDetail load through image proxy instead of direct WooCommerce CDN URLs

## [2.4.0] - 2026-02-28

### Added
- Full Shopify-style order detail page at `/orders/:id` — two-column layout with items (thumbnails, picked badges, line totals), payment summary, shipments, notes on left; customer info, shipping/billing addresses, timeline on right
- Reusable `Pagination` component with smart page pills (first, last, current±1, ellipsis gaps), prev/next buttons, "Showing X–Y of Z" counter
- Pagination on Orders page — 25 per page, page resets on filter change
- Pagination on Inventory page — 25 per page (was 50), page resets on search change
- Shared `WooAddress` and `OrderDetail` types in `types/index.ts`

### Changed
- Order detail is now a full page (not a slide-over panel) — click row navigates to `/orders/:id`
- Orders table: added chevron arrow column indicating clickable navigation
- Inventory count display now shows total from API meta instead of local array length

### Removed
- Order detail slide-over panel (replaced by full page)

## [2.3.0] - 2026-02-28

### Added
- Full product detail page at `/inventory/:id` — image, 4 gradient stock stat cards, product info panel, warehouse locations panel, stock movement history table
- Product currency synced from WooCommerce store settings (fetches `woocommerce_currency` from store settings API)
- `currency` column on Product model (DB migration `20260228220000_add_product_currency`)
- Product image thumbnails in inventory list table
- Price column with correct currency in inventory list
- Chevron arrow on product rows indicating clickable navigation

### Changed
- Product detail is now a full page (not a sidebar) — navigates to `/inventory/:id`
- Inventory stat cards upgraded with gradient backgrounds and larger typography
- Inventory table redesigned: image thumbnail, name+SKU stacked, price with currency, centered stock numbers, available column with low-stock warning
- Inventory stat cards use `rounded-2xl` and gradient overlays for a more polished look

## [2.2.1] - 2026-02-28

### Fixed
- Order detail slide-over: shipping/billing addresses now render properly (were JSON objects, displayed as `[object Object]`)

### Added
- Product detail slide-over on Inventory page — click any product row to see stock overview (4 mini stat boxes), product details, locations, and recent stock movements
- `GET /api/v1/inventory/:id` endpoint returning product with stock locations and recent movements
- `StockMovement` and `ProductDetail` types in frontend

## [2.2.0] - 2026-02-28

### Added
- Order detail slide-over panel — click any order row to view full details (items, customer, shipments, addresses)
- Order status change from slide-over panel via dropdown select
- Inventory stats dashboard — 4 colorful stat cards: In Stock, Reserved, Incoming, Free to Sell
- `GET /api/v1/inventory/stats` — aggregated inventory statistics endpoint
- `POST /api/v1/inventory/sync` — manual product import trigger from WooCommerce (ADMIN/MANAGER)
- "Import Products" button on Inventory page to sync products from all active stores

### Changed
- Visual refresh across all pages — colored header icons, vivid row hovers with left-border accents, gradient empty states
- Orders page: clickable rows with blue left-border hover, enhanced empty state with gradient blob
- Inventory page: emerald-themed with stat cards, left-border hover accents
- Shipping page: violet-themed header icon and row hover accents
- Receiving page: amber-themed header icon and row hover accents
- Warehouse page: primary-blue themed header icon, zone row hover accents
- Picking page: violet-themed header icon, item row hover accents, card hover shadow lift

## [2.1.0] - 2026-02-28

### Added
- Full Settings page with tabbed navigation (Account, Team, WooCommerce, Danger Zone)
- Account management: update profile name, change email (with password verification), change password
- Team management (admin only): add members with role assignment, change roles, remove members
- WooCommerce sync configuration per store: toggle order/product/inventory sync, auto-sync interval (1–60 min), order status filter, days lookback, sync-since-date cutoff
- Danger Zone: full account deletion with cascade (all tenant data) behind password + confirmation
- Backend routes: `/api/v1/account` (4 endpoints), `/api/v1/team` (4 endpoints), `PATCH /stores/:id/sync-settings`
- Store model: 8 new sync settings fields (`sync_orders`, `sync_products`, `sync_inventory`, `auto_sync`, `sync_interval_min`, `order_status_filter`, `sync_days_back`, `sync_since_date`)
- Database migration `20260228200000_add_store_sync_settings`

### Changed
- Cron job now runs every 1 minute instead of 5, checking per-store `autoSync` and `syncIntervalMin` settings
- WooCommerce sync respects store-level toggles, status filters, and date-range preferences
- Settings page restructured from single file to modular folder (`pages/settings/`)
- Team and Danger Zone tabs only visible to ADMIN role

## [2.0.1] - 2026-02-28

### Changed
- Default email sender updated to `noreply@picknpack.io`

## [2.0.0] - 2026-02-28

### Changed
- **Full TypeScript migration** — entire codebase (backend + frontend) converted from JavaScript to TypeScript
- Backend: 20 files migrated (.js → .ts) with strict mode, Express Request augmentation, Prisma types
- Frontend: 17 files migrated (.jsx/.js → .tsx/.ts) with typed React state, props, and event handlers
- Added `tsconfig.json` for both backend and frontend with strict configuration
- Backend runtime changed from `node`/`nodemon` to `tsx` for native TypeScript execution
- Frontend build now runs `tsc -b && vite build` for type checking before bundling
- Created shared type definitions: `backend/src/types/index.ts`, `frontend/src/types/index.ts`
- Custom type declarations for `@woocommerce/woocommerce-rest-api` (no built-in types)
- Express Request augmented with `req.user`, `req.tenantId`, `req.prisma` types
- All route handlers typed with `Request`, `Response`, `NextFunction`
- All React components typed with proper props interfaces and `useState<T>()` generics

### Added
- TypeScript 5.7+ as dev dependency in both packages
- `tsx` runtime for backend (dev + production)
- `@types/node`, `@types/express`, `@types/cors`, `@types/morgan`, `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/node-cron` (backend)
- `@types/react-dom` (frontend)
- `typecheck` npm script in both packages
- `vite-env.d.ts` for Vite client types
- `tsconfig.node.json` for frontend Vite/Tailwind config files

### Removed
- All `.js` and `.jsx` source files (replaced by `.ts`/`.tsx`)
- `nodemon` dev dependency (replaced by `tsx watch`)

## [1.5.2] - 2026-02-28

### Fixed
- Fix "handleSkip is not defined" crash on Connect Store page — "I'll connect later" button now works

## [1.5.1] - 2026-02-28

### Changed
- Disabled email verification on registration — users go straight to Connect Store step
- Email verification endpoints remain in code for future re-enablement

## [1.5.0] - 2026-02-28

### Changed
- Rebrand from WooWMS to **PickNPack** (picknpack.io)
- Updated all UI text, page titles, sidebar branding, email templates
- Package names changed to picknpack-frontend and picknpack-backend
- Sidebar logo: "P" icon with "PickNPack" brand text
- Seed admin email changed to admin@picknpack.io

## [1.4.0] - 2026-02-28

### Added
- Email verification onboarding flow with 6-digit code
- Resend API integration for transactional emails
- Verification code endpoint: POST /auth/send-verification
- Email verify endpoint: POST /auth/verify-email
- Onboarding complete endpoint: POST /auth/complete-onboarding
- User model: emailVerified, verificationCode, verificationCodeExpiresAt, onboardingCompleted fields
- Frontend: /onboarding/verify-email page with individual digit inputs, auto-submit, paste support
- Frontend: /onboarding/connect-store page with WooCommerce credentials form and skip option
- Step indicator component in onboarding flow
- Smart routing: unverified users redirected to onboarding, verified users go to dashboard
- Resend cooldown (60s) for verification codes, 10-minute code expiry
- Database migration for email verification fields

### Changed
- Register flow now redirects to email verification instead of dashboard
- Login flow checks emailVerified and onboardingCompleted status for proper redirect
- JWT token now includes emailVerified and onboardingCompleted claims
- Auth /me endpoint returns verification and onboarding status

## [1.3.0] - 2026-02-28

### Changed
- Complete macOS Sonoma-inspired UI redesign across all pages
- Sidebar: collapsible with smooth animation, grouped nav sections (Overview, Warehouse, Logistics), frosted glass backdrop, icon-only collapsed mode
- Orders: modern table with status pill badges, filter dropdown with icon, empty states
- Inventory: search bar with icon, stock level indicators with low-stock alerts, clean table
- Warehouse: card-based layout with zone type badges, bin chips, default warehouse star badge
- Picking: pick list cards with progress bars, picked/unpicked icons, status indicators
- Shipping: clean table with carrier icons, tracking code chips, status badges
- Receiving: table with calendar icons for expected dates, PO status badges
- Settings: modern form with field icons, action buttons with icons, connect/disconnect store UI
- Updated color tokens for warmer, softer grays (Apple-inspired palette)
- Added global table reset, selection highlight, and focus-ring utility

## [1.2.0] - 2026-02-28

### Changed
- Full shadcn/ui design system with Tailwind CSS
- Sidebar: clean card-style with lucide icons, active state uses primary/10 tint
- Dashboard: stat cards, quick actions, recent orders, quick stats — all shadcn styled
- Login & Register pages: centered card layout with brand icon, loading spinners, error alerts
- CSS variables follow shadcn convention (HSL-based tokens)
- All inline styles replaced with Tailwind utility classes

### Added
- Tailwind CSS 3.4 + PostCSS + Autoprefixer
- `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn utilities)
- `cn()` helper in `src/lib/utils.js`
- `tailwind.config.js` with shadcn color tokens
- Inter font via Google Fonts

## [1.0.0] - 2026-02-27

### Added
- Initial project setup
- Backend: Express.js API server with JWT auth
- Frontend: React (Vite) SPA
- PostgreSQL database with Prisma ORM
- WooCommerce REST API v3 integration
- Core modules: Orders, Inventory, Shipping, Warehouse, Picking, Receiving
