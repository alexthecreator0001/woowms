# Changelog

All notable changes to PickNPack will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.22.0 / 2.22.0] - 2026-03-01

### Added
- **Professional label printing** — redesigned Print Labels modal with Code 128 barcodes (via bwip-js), zone-type color stripes, and a polished layout showing location code, zone name, warehouse name, and location breakdown
- **5 label size options** — Zebra 4×6" (shipping label), Zebra 2×1" (small shelf label), Sheet Small (30/page), Sheet Medium (10/page), Sheet Large (6/page). Zebra sizes use custom paper dimensions for direct thermal printing
- **Custom location prefix** — configurable prefix field (up to 5 chars, auto-uppercase) in both the Add Element modal and the Edit Element slide-over. Live preview shows what location codes will look like (e.g. "SHE-01-01"). Prefix is stored on the floor plan element and passed to the auto-zone API

### Changed
- **Label size selector** — split into two sections: "Direct Print (Zebra)" and "Sheet Labels (Letter)" with clearer descriptions
- **Print modal header** — shows zone-type color accent bar and zone/warehouse name in subtitle

## [3.21.0] - 2026-03-01

### Changed
- **Unified zone/element creation** — "Add Zone" replaced with "Add Element" modal that picks element type first (Shelving Rack, Pallet Rack, Packing Table, etc.), then configures label, shelves, and positions. Creates both zone + floor plan element in one step.
- **Click-to-edit element cards** — clicking a card opens the edit panel with rack config (name, shelves, positions per shelf). Hover shows Edit, Print, and Delete icons. No more confusing footer buttons.
- **Edit panel shows rack setup** — edit slide-over displays element type icon, name input, shelves (1-20), positions per shelf (1-20), and location count summary. Saves to both zone and floor plan element.
- **Zone cards show element type** — element summary cards display the element icon and type label (e.g. Shelving Rack, Pallet Storage) when linked to a floor plan element
- **Unplaced elements handled** — elements created from Zones tab (unplaced, x:-1/y:-1) are excluded from grid rendering and overlap checks; toolbar shows unplaced count

### Removed
- **Generate Bins button** — bins are now auto-created when elements are created, no separate generate step needed
- **View Locations / Floor Plan footer buttons** — replaced with click-to-edit on the whole card

## [3.20.0 / 2.21.0] - 2026-03-01

### Changed
- **Saving floor plan auto-creates zones** — clicking Save now automatically creates zones (with bins) for every element that doesn't have one yet. Place shelves, racks, tables → hit Save → zones appear in the Zones tab. No more clicking "Create Zone" on each element one by one.
- **Floor plan ↔ zones unified** — creating a zone from the floor plan now auto-saves the floor plan (persists the element↔zone link immediately) and switches to the Zones tab so the new zone is visible right away. The two tabs are now truly two views of the same data.
- **Element label on zone cards** — zone cards linked to a floor plan element show the element name (e.g. "Shelving Rack 1") with a grid icon, making the connection between both views visible

## [3.18.0 / 2.21.0] - 2026-03-01

### Added
- **3 new floor plan elements** — Pallet Storage (green, 2×2, ground-level pallet positions), Dock Door (teal, 3×1, loading bay entry points), Staging Area (pink, 2×3, temp holding between pick/pack)
- **Grid scale legend** — bottom-left corner of the floor plan grid shows "= 1 m" or "= 1 ft" so users understand what one square represents
- Backend auto-zone mapping for new element types: pallet_storage→STORAGE, dock_door→RECEIVING, staging_area→PICKING

### Fixed
- **Slide-over page overflow** — opening a zone edit slide-over on the Warehouse Detail page no longer causes horizontal scroll; added `overflow-x-hidden` to main content wrapper

## [3.17.0 / 2.20.0] - 2026-03-01

### Added
- **Configurable storage setup** — when creating a zone from a floor plan element, configure shelves (1-20) and positions per shelf (1-20) instead of hardcoded 4×3; settings persist on the element and are shown as a summary before zone creation
- **Cross-tab zone ↔ floor plan navigation** — click "Floor Plan" on a zone card to jump to the Floor Plan tab with the linked element auto-selected; click "View" on a linked zone in the floor plan properties to jump back to the Zones tab filtered to that zone's type
- Zone stats (shelf count, total locations) shown in ElementProperties when a zone is linked

## [3.16.0 / 2.20.0] - 2026-03-01

### Added
- **Unit system for floor plans** — choose between feet (ft) and meters (m) when creating a floor plan; unit displayed in toolbar and property panel
- **Decimal element sizes** — elements can now have fractional dimensions (e.g., 1.3m wide rack) with 0.1 snap precision
- **Element duplication** — duplicate any selected element via "Duplicate" button or **Ctrl/Cmd+D** keyboard shortcut
- **Auto-collapse sidebar** — sidebar automatically collapses when viewing the Floor Plan tab for more editing space, restores on tab change

### Changed
- Floor plan grid now uses AABB overlap detection instead of integer occupancy grid, enabling precise decimal positioning
- Setup form uses `parseFloat` with `step="0.1"` for decimal warehouse dimensions
- Backend floor plan validation now accepts decimal width/height with `isFinite()` checks

### Removed
- **Aisle element type** — removed from the element palette; free space on the grid represents aisles naturally. Existing aisle elements are auto-filtered on load.

## [3.15.0 / 2.19.0] - 2026-03-01

### Added
- **Visual Floor Plan Builder** — new "Floor Plan" tab on the Warehouse Detail page with a 2D grid editor for designing warehouse layouts. Set warehouse dimensions in meters, then place elements (shelving racks, pallet racks, packing tables, receiving/shipping areas, aisles, walls) on a visual grid.
- **Floor plan element palette** — 7 element types with color-coded icons, default sizes, and drag-to-place interaction
- **Element properties panel** — edit label, resize, rotate (0/90°), link to existing zones, or auto-create new zones with bins
- **Auto-zone creation** — `POST /api/v1/warehouse/:id/floor-plan/auto-zone` creates a zone + optional bins from a floor plan element, mapping element types to zone types (shelf→STORAGE, packing_table→PACKING, etc.)
- **Floor plan persistence** — `PUT /api/v1/warehouse/:id/floor-plan` saves the complete floor plan (dimensions + elements) as JSONB
- **Floor plan schema** — `floor_plan` JSONB column on warehouses table (migration `20260301200000_warehouse_floor_plan`)
- Drag-to-move elements on the grid with collision detection
- Undo history (up to 20 steps) for floor plan edits

### Changed
- Warehouse Detail page now has a **Zones / Floor Plan** tab toggle — Zones tab shows the existing zone cards view (unchanged), Floor Plan tab shows the visual editor

## [3.14.0 / 2.18.0] - 2026-03-01

### Added
- **Sync progress bar** — product sync now shows real-time progress percentage with animated bar; sync runs in background so the modal can be closed while sync continues
- **Background sync banner** — when sync modal is closed during sync, a progress banner appears at the top of the Inventory page
- **Sync status polling endpoint** — `GET /api/v1/inventory/sync-status/:jobId` for tracking background sync progress
- **Docs site favicon** — PickNPack favicon added to docs site

### Changed
- **Help link** — sidebar Help button now opens `docs.picknpack.io` in a new tab instead of the in-app help center
- **Global search results** — increased from 5 to 25 results per category (orders, products, POs, suppliers) with scrollable results list
- **Docs site logo** — fixed to use the full PickNPack wordmark SVG instead of a broken clipped version
- **Sync endpoint** — `POST /api/v1/inventory/sync` now returns a `jobId` immediately and runs sync in background

## [3.13.0 / 2.17.0] - 2026-03-01

### Added
- **WooCommerce product variations support** — Variable products are now expanded into individual variations during sync (e.g., "T-Shirt - Large / Red"), each with its own SKU, price, stock quantity, and image. Parent "variable" products are skipped since they aren't sellable items.
- **Variation schema fields** — `product_type` (simple/variation), `woo_parent_id` (WooCommerce parent ID for grouping), `variant_attributes` (JSON of attribute name/value pairs like `{"Size": "Large", "Color": "Red"}`)
- **Variation-aware stock push** — Push stock and product edits to WooCommerce now uses the correct variation API endpoint (`products/{parent}/variations/{id}`) for variation products
- **Documentation site** (`docs-site/`) — Public docs at `docs.picknpack.io` built with React + Vite + Tailwind, featuring clean editorial design with sidebar navigation and 11 documentation pages covering all modules
- **CLAUDE.md docs rule** — New mandatory rule to keep documentation in sync with feature changes
- Database migration `20260301180000_product_variations`

### Changed
- **Product sync logic** — WooCommerce sync now handles product types: simple products imported as before, variable products expanded into variations, grouped/external products skipped entirely. Previously imported variable parent products are deactivated.

## [3.12.0 / 2.16.0] - 2026-03-01

### Added
- **Global search (Cmd+K)** — command palette searching across orders, products, purchase orders, and suppliers with keyboard navigation, recent searches, and status badges
- **Global search endpoint** — `GET /api/v1/search?q=` searches orders (by number, customer, tracking), products (by name, SKU, barcode), POs (by number, supplier, tracking), and suppliers (by name, email, phone) in parallel
- **Inventory filter-counts endpoint** — `GET /api/v1/inventory/filter-counts` returns server-side counts for total, out-of-stock, low-stock, and in-stock products
- **Sync options modal** — replaces the simple Sync button with a modal offering sync mode (add only, update only, add+update) and stock import toggle with warning
- **Product search dropdown** — reusable `ProductSearchDropdown` component with thumbnails, SKU badges, stock levels, keyboard navigation, and click-outside-to-close
- **Orders search bar** — text search input on the Orders page for searching by order number, customer name, or email
- **Inventory column sorting** — sortable column headers (Product, SKU, Price, On Hand, Reserved) with asc/desc toggle and backend sort params

### Changed
- **Product search expanded** — search now includes description and barcode fields in addition to name and SKU (backend + all product search UIs)
- **Inventory stock filters** — counts now come from server-side totals instead of being computed from the current 25-item page; filtering is fully server-side
- **Sync endpoint** — `POST /api/v1/inventory/sync` accepts `mode` and `importStock` options; returns added/updated/skipped counts
- **ProductDetail bundle search** — replaced inline search with reusable `ProductSearchDropdown` showing images, SKUs, and stock
- **SupplierDetail product mapping search** — replaced inline search with reusable `ProductSearchDropdown`
- **Layout sidebar** — added search trigger button with ⌘K keyboard shortcut hint

## [3.11.0 / 2.15.0] - 2026-03-01

### Added
- **Plugins / Marketplace page** — browse available integrations in a marketplace-style card grid with category filter pills, install/uninstall buttons, and per-plugin configuration panels
- **Zapier integration** — first available plugin; on install generates a secure API key (SHA-256 hashed, prefix-only stored) for authenticating Zapier webhook calls
- **Plugin API key management** — generate, regenerate, and display key prefix; full plaintext shown only on create/regenerate in a one-time modal
- **Zapier webhook endpoints** — `POST /api/v1/plugins/zapier/webhook` and `GET /api/v1/plugins/zapier/webhook/test` with API key auth via `X-API-Key` header; supports actions: `test`, `new_orders`, `low_stock`, `order_status`
- **Plugin settings** — per-plugin JSON settings with toggle controls (order notifications, low stock alerts, shipping updates for Zapier)
- **Plugin CRUD API** — `GET /api/v1/plugins` (catalog), `GET /:key` (detail), `POST /:key/install`, `POST /:key/uninstall`, `PATCH /:key/settings`, `POST /:key/regenerate-key`
- **Plugin catalog** — 4 plugins: Zapier (available), Slack, QuickBooks, ShipStation (coming soon) with brand colors and icons
- **Sidebar navigation** — new "Integrations" section with "Plugins" link using Plug icon
- **Setup instructions** — step-by-step Zapier configuration guide on the plugin configure page
- Database migration: `tenant_plugins` table with API key hash, prefix, settings JSON, tenant relation
- `TenantPlugin` added to tenant-scoped Prisma models

## [3.10.0 / 2.14.0] - 2026-03-01

### Added
- **Supplier management** — full CRUD for suppliers with list page, detail page, product mappings (supplier SKU, price, lead time), sidebar navigation
- **Barcode/EAN tracking** — add, remove, set primary barcodes per product (EAN13, UPC, CODE128, Custom) with copy-to-clipboard
- **Bundle support** — mark products as bundles, add/remove/edit component products, view available bundle count computed from component stock
- **Incoming stock display** — 5th stock card on Product Detail showing incoming qty from active POs, with clickable PO table
- **Package quantity** — new field on products for pack sizes; PO Create shows "round up to nearest pack" hints when qty doesn't align
- **Supplier dropdown on PO Create** — searchable dropdown linked to supplier records, auto-linking supplierId
- **PO tracking fields** — tracking number and URL on PO Create/Detail, with copy button and external link
- **Supplier SKUs on Product Detail** — shows which suppliers provide this product with their SKUs and pricing
- **Improved product editing** — better error messages from server, packageQty field, proper number handling
- Supplier CRUD API: `GET/POST/PATCH/DELETE /api/v1/suppliers`, supplier-product mapping endpoints
- Barcode API: `GET/POST/PATCH/DELETE /api/v1/inventory/:id/barcodes`
- Bundle API: `GET/POST/PATCH/DELETE /api/v1/inventory/:id/bundle`
- Incoming stock API: `GET /api/v1/inventory/:id/incoming`
- Product info API: `GET /api/v1/receiving/product-info?sku=XXX`
- PO create/update now accepts `supplierId`, `trackingNumber`, `trackingUrl`
- Database migration: `suppliers`, `supplier_products`, `product_barcodes`, `bundle_items` tables; `package_qty`, `is_bundle` on products; `supplier_id`, `tracking_number`, `tracking_url` on purchase orders

## [3.9.0 / 2.13.0] - 2026-03-01

### Added
- **Product Detail page redesigned** — professional tabbed layout with 5 tabs: Overview, Orders, Purchase Orders, Stock History, Settings
- **Editable product fields** — click Edit to modify description, price, weight, dimensions, and low stock threshold inline, with save to database
- **Orders tab** — shows all orders containing this product with order number, customer, quantity, status badge, total, and date; clickable rows navigate to order detail
- **Purchase Orders tab** — shows all POs matching this product's SKU with PO number, supplier, ordered/received quantities, status badge, expected date; "Create PO" button; clickable rows navigate to PO detail
- **Stock History tab** — paginated stock movement history with PO reference links (clickable "PO-123" navigates to PO detail)
- **Settings tab** — per-product WooCommerce sync overrides (moved from inline card)
- `PATCH /api/v1/inventory/:id` — update product fields (description, price, weight, dimensions, low stock threshold) with optional push to WooCommerce
- `GET /api/v1/inventory/:id/orders` — paginated orders containing a product (by productId or SKU)
- `GET /api/v1/inventory/:id/purchase-orders` — paginated POs matching a product's SKU
- `GET /api/v1/inventory/:id/stock-movements` — paginated stock movement history
- `pushProductToWoo()` — push product details (description, price, dimensions) to WooCommerce
- **Push product edits setting** — new tenant setting "Push product edits to WooCommerce" in Inventory Settings, controls whether product edits auto-sync to WooCommerce
- Action buttons in product header: Edit, Create PO, Push to WooCommerce

## [3.8.0 / 2.12.0] - 2026-03-01

### Added
- **WMS → WooCommerce stock sync** — full stock push feature with global defaults and per-product overrides
- `pushStockToWoo()` now sends `stock_quantity`, `manage_stock`, `stock_status`, and `backorders` to WooCommerce (was only `stock_quantity`)
- `shouldPushStock()` helper — checks tenant-level push toggle with per-product override support
- **Out-of-stock behavior setting** — 4 options: hide product, show as sold out, allow backorders silently, allow backorders with notification
- `syncSettings` JSON column on Product model for per-product sync overrides (push enabled, out-of-stock behavior)
- `POST /api/v1/inventory/:id/push-stock` — manually push a single product's stock to WooCommerce (ADMIN/MANAGER)
- `POST /api/v1/inventory/push-stock-all` — push all active products to WooCommerce in bulk (ADMIN/MANAGER)
- `GET /api/v1/inventory/:id/sync-settings` — read per-product sync settings
- `PATCH /api/v1/inventory/:id/sync-settings` — update per-product sync overrides (ADMIN/MANAGER)
- **Automatic stock push on adjust** — `PATCH /:id/adjust` now auto-pushes to WooCommerce when push is enabled
- **Automatic stock push on receive** — receiving PO items now auto-pushes to WooCommerce when push is enabled
- **Inventory Settings redesigned** — 3 cards: low stock threshold, stock push with out-of-stock behavior dropdown, bulk actions with "Push all stock now" button
- **WooCommerce Sync card** in Product Detail — override global sync settings per product, toggle push, set behavior, manual push button with result display
- Database migration `20260301120000_product_sync_settings`

## [3.7.0 / 2.11.1] - 2026-03-01

### Added
- **Inventory page redesigned** — professional WMS-grade layout inspired by ShipBob/Cin7: compact stat strip, quick stock filter pills (All / Low Stock / Out of Stock / In Stock), inline stock level progress bars with color coding, dedicated SKU column, location column with map pin icons
- WooCommerce sync button now shows spinner + "Syncing..." text during sync operation

### Fixed
- **Product images not loading** — image proxy route was behind JWT auth middleware; `<img>` tags can't send JWT headers. Moved `/api/v1/images/proxy` before auth middleware so images load correctly

### Changed
- Inventory page migrated from lucide-react to @phosphor-icons/react
- Stock level visualization: inline colored progress bars (green/amber/red) replace plain numbers

## [3.6.0 / 2.11.0] - 2026-03-01

### Added
- **Custom order statuses** — admins can create/remove custom WMS statuses (Settings > Order Workflow), stored in tenant settings, available across all status dropdowns and filters
- **PROCESSING** built-in status — added as a 10th default WMS status for WooCommerce "processing" orders
- `GET /api/v1/account/custom-statuses` — returns built-in + custom statuses merged
- `POST /api/v1/account/custom-statuses` — create a custom status (admin only)
- `DELETE /api/v1/account/custom-statuses/:value` — remove a custom status (admin only)
- **Forgot password flow** — full email-based password reset using 6-digit code via Resend (`/forgot-password` page, `POST /auth/forgot-password`, `POST /auth/reset-password`)
- **Email verification on signup** — new accounts now require email verification before accessing the app; verification code sent automatically on registration
- Shared status utility (`frontend/src/lib/statuses.ts`) with `getStatusStyle()`, `fetchAllStatuses()`, and color fallbacks for unknown/custom statuses
- Backend status constants (`backend/src/lib/statuses.ts`) with 10 built-in status definitions

### Changed
- Order `status` column migrated from Prisma `OrderStatus` enum to `String` — enables custom statuses without schema changes
- `mapWooStatus()` now maps WooCommerce "processing" to `PROCESSING` (was incorrectly mapped to `PENDING`)
- Orders page, Order Detail, Dashboard, Settings (Order Workflow, Notifications) all use dynamic status list from API
- Registration now sets `emailVerified: false` and sends verification email
- `PrivateRoute` now redirects unverified users to `/onboarding/verify-email`
- Login "Forgot Password?" text changed from static `<p>` to `<Link>` to `/forgot-password`

### Fixed
- WooCommerce "processing" orders no longer incorrectly mapped to PENDING status

## [3.5.0 / 2.10.0] - 2026-03-01

### Added
- **Tenant settings** — `settings` JSON column on Tenant model for tenant-wide operational config
- `GET/PATCH /api/v1/account/tenant-settings` — read/update tenant settings (admin only)
- **Notifications section** in Settings — toggle low-stock alerts, new-order alerts, set default order filter (user preferences)
- **Order Workflow section** in Settings — map 7 WooCommerce statuses to WMS statuses, set default new-order status (tenant settings, admin only)
- **Inventory Defaults section** in Settings — configurable low-stock threshold and push-stock-to-WooCommerce toggle (tenant settings, admin only)
- **Warehouse settings** group in Settings card grid

### Changed
- Main content background changed from `#fafafa` to white for cleaner Stripe-like appearance
- `mapWooStatus()` in sync now reads custom status mapping from tenant settings, falls back to defaults
- Low-stock queries in inventory routes now read threshold from tenant settings instead of hardcoded `5`
- New products created during sync now use tenant low-stock threshold
- Settings page now shows 4 groups with 9 cards (was 3 groups with 6 cards)

## [3.4.0] - 2026-03-01

### Changed
- **Dashboard redesigned Stripe-style** — personalized greeting with user name, cleaner metric cards (icon top-right), "Shortcuts" row with 5 quick links, 2/3+1/3 layout with recent orders (clickable rows) and resources sidebar (guide, help center, store/order counts)
- **Settings page as card grid** — Stripe-style grouped cards (Personal settings, Account settings, Integrations) with icon + title + description, click to drill into section, back arrow to return to overview
- **Business/Branding section improved** — company name form with sidebar preview showing the actual avatar + name, coming-soon logo upload placeholder with dashed border
- **Sidebar company name clickable** — clicking the company header now navigates to Settings
- Dashboard fully migrated from lucide-react to @phosphor-icons/react

### Removed
- Tab-based settings navigation (replaced by card grid)

## [3.3.0] - 2026-02-28

### Added
- **Whitelabel branding** — admins can set company name in Settings → Branding tab, displayed in sidebar for all team members
- `PATCH /api/v1/account/branding` — update tenant company name (admin only)
- `/auth/me` now returns `tenantName` field
- **Reusable `GradientBlobs` component** — shared blue-violet-rose pastel gradient background, used on auth pages and available for any page
- **Branding tab** in Settings — company name field with live sidebar avatar preview

### Changed
- **Sidebar redesigned Stripe-style** — company initial avatar + company name + dropdown chevron at top (replaces large wordmark logo), cleaner section headers
- **Auth page gradient** updated to blue-violet-rose tones (was rose-violet-sky-amber)

## [3.2.4] - 2026-02-28

### Changed
- **Auth pages redesigned** — clean centered layout with soft pastel gradient blobs (rose, violet, sky, amber) fading to white, no card container, floating form
- Login: logo mark at top, "Welcome back!" heading, email/password fields with eye toggle, lavender submit button, "Forgot Password?" link, "Need help?" footer
- Register: matching style with "Create your account" heading, email + company/name row + password, "Create Account" lavender button, terms text
- New `.auth-input-clean` style — 44px height, 8px radius, white background, focus ring with primary color
- New `.auth-btn` style — lavender purple (hsl 240 70% 72%) with hover darken
- Removed split two-column layout and image placeholder panel

## [3.2.3] - 2026-02-28

### Changed
- **Auth pages rebuilt as split layout** — `grid lg:grid-cols-2` with form on the left, image placeholder panel on the right (shadcn login-01 pattern)
- Form is centered in its half with max-w-xs (login) / max-w-sm (register), logo top-left, clean centered heading + subtext
- Uses shadcn HSL color tokens (`bg-primary`, `text-muted-foreground`, `border`, `ring`) instead of hardcoded hex throughout
- Inputs use `.auth-input` class with token-based colors, 40px height, 6px radius
- Right panel is `bg-muted` with an `<img>` placeholder — ready for a custom image later
- On mobile (<lg) the image panel hides, form takes full width

### Removed
- All gradient ribbon CSS (`.auth-ribbon-*`, `.auth-scene`, `.auth-card`, `.auth-card-footer`) — completely stripped
- All dark aurora / glass-morphism remnants

## [3.2.1] - 2026-02-28

### Changed
- **Login & Register redesigned** with light background + flowing gradient ribbon shapes — vibrant blue, coral/pink, indigo, and warm accent bands sweep across a clean `#f6f9fc` background
- Clean white card with subtle shadow, no glass/blur/dark effects — form is dead simple with dark text on white, standard gray-bordered inputs
- Logo sits top-left of page, card centered vertically, footer at bottom
- Inputs use standard light styling: white background, `#d1d5db` border, `#111827` text, blue focus ring
- Error messages use light red (red-50 bg, red-200 border, red-600 text)
- Bottom link section separated by a subtle border divider
- Labels are normal weight `text-[14px]` dark text — no uppercase, no tracking tricks

### Added
- 4 gradient ribbon shapes (`.auth-ribbon-1` through `.auth-ribbon-4`) using positioned ellipses with linear gradients and rotation transforms
- `.auth-card` clean white card class, `.auth-input` light input class

### Removed
- Dark aurora system (`.aurora`, `.aurora-2`, `.auth-vignette`, `.auth-glass`, `.auth-glow`, `auroraRotate`, `glowPulse` keyframes)
- All glass-morphism, backdrop-filter, dark background styling from auth pages

## [3.0.1] - 2026-02-28

### Changed
- **Brand color** updated to `#2B67FF` — primary HSL token changed from `221 83% 53%` to `222 100% 58%`, affects all `bg-primary`, `text-primary`, focus rings, and selection highlights across the app
- **Logo** replaced placeholder black "P" square with actual PickNPack SVG wordmark logo in all 4 locations (sidebar, login, register, connect store)
- Sidebar shows full wordmark when expanded, compact "p+Q" logomark when collapsed
- Logo text paths use `currentColor` for flexibility, brand "Q" shape stays `#2B67FF`

### Added
- `Logo` component (`components/Logo.tsx`) — full SVG wordmark, accepts `width`/`className` props
- `LogoMark` component — compact icon variant for collapsed sidebar

## [3.0.0] - 2026-02-28

### Changed
- **Warehouse page redesigned** — complete ground-up rethink from single-screen to three-level drill-down architecture (`/warehouse` → `/warehouse/:id` → `/warehouse/:id/zones/:zoneId`)
- **WarehouseOverview** — new dashboard landing with 4 stat cards (Total Locations, Occupied, Empty, Utilization %), warehouse summary cards in a 2-column grid with utilization mini-bars, "?" guide button instead of 3 redundant help banners
- **WarehouseDetail** — per-warehouse page showing all zones with full-width stacked utilization bar colored by zone type, segmented zone type filter pills, zone summary cards with stats and action footers (View Locations, Generate, Print)
- **ZoneDetail** — per-zone page with bin-level detail: 4 stat pills, real-time search input, aisle/status dropdown filters, grid/list view toggle, collapsible aisle sections with rack limit (show 5 racks initially, expand on click), inline add location form (replaces `window.prompt()`)
- **Slide-over panels** replace centered modals for editing warehouses, zones, and bins (right-anchored 420px panel with backdrop and Escape-to-close)
- **BinGrid refactored** — aisles are now collapsible sections with expand/collapse toggle, multi-rack aisles show each rack separately with "Show N more" overflow
- **BinListView** — new sortable data table view for bins with columns (Label, Aisle, Shelf, Position, Stock, Status), 25-per-page pagination, ideal for 500+ locations

### Added
- `SlideOver` shared component — generic right-anchored panel for edit forms
- `UtilizationBar` shared component — stacked horizontal bar with colored segments and optional labels
- `WarehouseSummaryCard` — warehouse card with stats, utilization bar, and "View Details" link
- `ZoneSummaryCard` — zone card with type badge, stats, utilization bar, and action footer buttons
- `BinListView` — table view with sort/pagination for large zones
- Three new routes: `/warehouse/:warehouseId`, `/warehouse/:warehouseId/zones/:zoneId`

### Removed
- Old `Warehouse.tsx` page (single-screen with everything crammed together)
- `WarehouseCard.tsx` (expandable card replaced by `WarehouseSummaryCard`)
- `ZoneSection.tsx` (inline zone with embedded bin grid replaced by `ZoneSummaryCard`)
- `BinModal.tsx` (centered modal replaced by slide-over panel in `ZoneDetail`)
- Inline "How It Works" dismissible help card and localStorage dismiss logic
- Bottom help banner ("Not sure what zones mean?")

## [2.8.0] - 2026-02-28

### Added
- **Help Center** (`/docs`) — central documentation page with searchable help topic cards (Warehouse Setup, Orders, Inventory, Picking, Receiving, Settings), quick links, and "Coming Soon" badges for future guides
- **"Help" link in sidebar** — Question icon link above Settings in the sidebar footer, navigating to `/docs`
- **Print Location Labels** — PDF label generator per zone with 3 size options (Small 30/page for shelf edges, Medium 10/page for rack labels, Large 6/page for aisle signs), select all/individual checkbox selection grouped by aisle, generates professional PDF with location code in bold, zone/warehouse name, and label breakdown (Aisle · Rack · Shelf · Position)
- "Print Labels" button in zone header (visible when zone has locations)
- "All Help Topics" button in warehouse page bottom banner linking to `/docs`

### Fixed
- Zone creation bug — creating a second zone after the first now works correctly (form state resets properly between creates, `zone={null}` passed explicitly to create modal)

## [2.7.1] - 2026-02-28

### Added
- **Warehouse Setup Guide** page (`/warehouse/guide`) — visual documentation explaining the full warehouse hierarchy (Zone → Aisle → Rack → Shelf → Position) with real-world analogies (library/grocery store), color-coded label breakdown, interactive rack diagram, zone type explanations with examples, 3-step quick start, and a complete small e-commerce warehouse example (268 locations)
- **Inline "How it Works" card** on Warehouse page — dismissible 4-column explainer showing Aisle/Rack/Shelf/Position with descriptions, label format example, and link to full guide (persists dismissal in localStorage)
- **"Guide" button** in Warehouse page header linking to `/warehouse/guide`
- **Bottom help banner** on Warehouse page — "Not sure what zones, aisles, or racks mean?" with link to guide
- "Read the Guide First" button in empty state alongside "Create Warehouse"
- Zone type hints in ZoneModal dropdown — each type now shows a plain-English description (e.g. "Storage — Main area where products live on shelves")

## [2.7.0] - 2026-02-28

### Changed
- **Real WMS location hierarchy** — warehouse locations now follow the ShipHero-inspired `Aisle-Rack-Shelf-Position` naming convention (e.g. `A-01-03-02` = Aisle A, Rack 01, Shelf 03, Position 02)
- **Location Generator Wizard** — completely rewritten with 4 inputs (aisles, racks per aisle, shelf levels, positions per shelf), Letters/Numbers toggle for aisle naming, live mini rack diagram preview, color-coded label format explainer, and total location count summary
- **Vertical Rack Visualization** — bins grouped by aisle and displayed as visual rack units (top shelf → floor), with shelf level labels on the left and position cells across each shelf; ungrouped locations shown separately
- **Zone sections** — now show left-colored accent border matching zone type, location/aisle/item counts, "Generate Locations" button highlighted when zone is empty
- Terminology updated from "bins" to "locations" throughout (BinModal, ZoneSection, WarehouseCard, page header)
- Backend generate endpoint now accepts `{aisles, aisleNaming, racksPerAisle, shelvesPerRack, positionsPerShelf}` for proper 4-level WMS hierarchy (up to 2,000 locations per batch), with backward compatibility for legacy `{prefix, rows, positions}` format
- Shelves numbered from floor up (level 01 = floor, highest = top) per WMS best practices
- Zero-padded numbers in all location labels for correct alphanumeric sorting

## [2.6.0] - 2026-02-28

### Added
- **Visual Warehouse Shelf Manager** — full interactive grid-based warehouse builder with create/edit/delete for warehouses, zones, and bins
- `PATCH /api/v1/warehouse/:id` — update warehouse (name, address, isDefault)
- `DELETE /api/v1/warehouse/:id` — delete warehouse with cascade (blocked if any bin has stock)
- `PATCH /api/v1/warehouse/zones/:zoneId` — update zone (name, type, description)
- `DELETE /api/v1/warehouse/zones/:zoneId` — delete zone with cascade (blocked if stock exists)
- `PATCH /api/v1/warehouse/bins/:binId` — update bin (label, capacity, isActive)
- `DELETE /api/v1/warehouse/bins/:binId` — delete bin (blocked if stock exists)
- `POST /api/v1/warehouse/zones/:zoneId/bins/generate` — bulk generate bins with prefix × rows × positions pattern
- `WarehouseCard` component — expandable card per warehouse with zone sections, edit/delete actions
- `ZoneSection` component — zone header with type badge, bin grid, add/generate/edit/delete actions
- `BinGrid` component — visual grid of ~76px bin cells with zone-type color coding, stock counts, inactive state
- `WarehouseModal` — create/edit warehouse with name, address, default checkbox
- `ZoneModal` — create/edit zone with name, type dropdown (6 zone types), description
- `BinModal` — edit bin with label, row/shelf/position, capacity, active toggle, delete (blocked if stocked)
- `GenerateBinsModal` — bulk bin generation with live preview of generated labels
- Zone type color coding: Storage (blue), Picking (violet), Receiving (amber), Packing (orange), Shipping (emerald), Returns (red)

### Changed
- Warehouse page fully rewritten from read-only display to interactive shelf builder
- `GET /api/v1/warehouse` now includes stock location counts per bin (`_stockCount` field)
- Warehouse creation now auto-unsets previous default when marking a new warehouse as default

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
