# Changelog

All notable changes to PickNPack will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
