# Changelog

All notable changes to WooWMS will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2026-02-28

### Changed
- Complete UI redesign with Apple-inspired design system
- New sidebar with lucide-react icons, brand dot, frosted glass style
- Dashboard: stat cards with colored icons, quick actions grid, recent orders feed, quick stats panel
- Premium typography with Inter font, refined spacing, smooth transitions
- New color system with semantic variables (success, warning, danger, purple)

### Added
- `lucide-react` icon library (shadcn icons)
- Welcome banner for first-time users (no stores connected)
- Dashboard quick action shortcuts (Orders, Pick Lists, Shipping, Receiving)
- Time-based greeting on dashboard
- Custom scrollbar styling

## [1.0.0] - 2026-02-27

### Added
- Initial project setup
- Backend: Express.js API server with JWT auth
- Frontend: React (Vite) SPA
- PostgreSQL database with Prisma ORM
- WooCommerce REST API v3 integration
- Core modules: Orders, Inventory, Shipping, Warehouse, Picking, Receiving
