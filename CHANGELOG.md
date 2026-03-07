# Changelog

All notable changes to PickNPack will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.65.2 / 2.50.2] - 2026-03-07

### Fixed
- **Plugins dark theme** — Replaced 200+ hardcoded hex colors in Plugins page with shadcn CSS variable tokens (bg-card, text-foreground, border-border, etc.). All cards, modals, inputs, buttons, and spinners now properly adapt to dark mode. Brand colors (Zapier, Slack, Shippo, EasyPost, QuickBooks) preserved with opacity-based backgrounds for dark mode compatibility.
- **PO incoming display** — Products with Purchase Orders in Draft or Shipped status now correctly show as "Incoming" on the product detail page (previously only ORDERED and PARTIALLY_RECEIVED were shown).
- **Sidebar shortcut styling** — Keyboard shortcut hints on nav items now display as individually styled key badges with borders instead of plain text.

## [3.65.1 / 2.50.1] - 2026-03-07

### Fixed
- **Bin capacity defaults** — Capacity is now volume-based (1 unit ≈ 1 liter). Defaults updated: Small=25, Medium=100, Large=500, X-Large=4,000. Pallet racks now correctly have much higher capacity than shelf sections. Migration resets old item-count defaults to use new values.
- **Bin size change bug** — Changing a bin's Location Size now properly clears the old capacity so the new size default takes effect.

## [3.65.0 / 2.50.0] - 2026-03-07

### Fixed
- **Volume-weighted bin capacity** — Bin capacity now accounts for product dimensions. Large products consume proportionally more capacity units (1 unit ≈ 1 liter). A 100×200×100 cm product now uses 2,000 capacity units per item instead of 1. Products without dimensions default to 1 unit. Affects warehouse display, assign-bin, and transfer capacity warnings.

## [3.64.2] - 2026-03-07

### Changed
- **Sidebar polish** — Collapse/expand button moved to header next to company name. Keyboard shortcut hints (G D, G O, etc.) shown on nav items. Fixed notification panel positioning overflow.

## [3.64.1] - 2026-03-07

### Changed
- **Sidebar cleanup** — Moved notifications to the search bar area, removed theme toggle from sidebar (accessible via Settings → Appearance), simplified collapse to a minimal chevron icon. Sidebar footer now has only Help, Settings, and Log out.

## [3.64.0 / 2.49.0] - 2026-03-07

### Added
- **Cycle Counting** — Full cycle count workflow for inventory accuracy verification. Create counts by zone, location, or product. Supports blind counting, team assignment, planned dates, and notes. Four-phase workflow: Plan → Count → Review Variances → Reconcile stock. Reconciliation adjusts StockLocation and Product quantities, creates stock movements, triggers low stock alerts, and pushes to WooCommerce. Includes variance review with accept/dismiss per item or bulk, progress tracking, and full audit trail integration.
- **Cycle Count settings** — Default blind count and default count type preferences under Settings → Cycle Counts.
- **Cycle Count in global search** — Search by CC# or assignee name from Cmd+K search.
- **Keyboard shortcut G+C** — Navigate to Cycle Counts from anywhere.

## [3.63.2 / 2.48.0] - 2026-03-07

### Changed
- **Settings URLs** — Each settings section now has its own URL (e.g. `/settings/woocommerce`, `/settings/tags`, `/settings/shipping`). Supports direct linking, browser back/forward, and bookmarking.

## [3.63.1 / 2.48.0] - 2026-03-07

### Fixed
- **Dashboard** — Removed "Getting Started / Connect your WooCommerce store" banner that incorrectly showed even when a store was already connected. The banner could also flash if any API call failed during dashboard load.

## [3.63.0 / 2.48.0] - 2026-03-07

### Added
- **Dark mode** — Full dark theme support with light/dark/system modes. Toggle from the sidebar footer (Sun/Moon/Monitor icon) or Settings > Appearance. Persists to localStorage and follows OS preference in system mode.
- **Keyboard shortcuts** — Navigate anywhere with `G then D/O/I/P/S/H/W/K/X` chord shortcuts. Press `Shift + ?` to see all available shortcuts. Cmd+K search shortcut migrated to the new hotkeys system.
- **Notification center** — In-app notifications with unread badge in the sidebar. Receives alerts for new orders, low stock, PO received, and shipping labels. Polls every 30 seconds. Mark individual or all as read.
- **Activity / Audit log** — Full audit trail at `/activity` showing who did what and when. Tracks order status changes, stock adjustments, PO creation/status changes, and supplier creation. Filterable by resource type with pagination.

## [3.62.0 / 2.47.0] - 2026-03-07

### Added
- **CSV export modal** — Clicking "Export" on Inventory, Orders, Purchase Orders, or Suppliers now opens a modal where you can select which columns to include, choose a delimiter (comma, tab, or semicolon), and pick a date format (YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY) before downloading.

## [3.61.0 / 2.46.0] - 2026-03-07

### Added
- **Slack notifications plugin** — Install the Slack plugin to receive real-time warehouse notifications in your Slack channel via an Incoming Webhook URL. Supports 4 notification types: new orders, low stock alerts, shipping label creation, and PO fully received.
- **Slack notification toggles** — Configure which events trigger Slack notifications (new orders, low stock, shipping labels, PO received) from the plugin configure view.
- **Slack test notification** — Send a test message to your Slack channel to verify the webhook is working from the Slack plugin configure page.
- **Slack webhook URL management** — View masked webhook URL and update it without reinstalling the plugin.
- **Slack setup guide** — Step-by-step instructions for creating a Slack Incoming Webhook directly in the plugin configure view.

## [3.60.0 / 2.45.0] - 2026-03-06

### Added
- **Shippo plugin** — Install Shippo as a plugin from the Plugins page. Enter your Shippo API key to connect, then map WooCommerce shipping methods to Shippo carriers in Settings > Shipping. Labels are generated automatically from the packing station.
- **EasyPost plugin** — Install EasyPost as a plugin from the Plugins page. Supports multi-carrier shipping labels and tracking via the EasyPost API. Same install flow as Shippo — enter your API key, validate, and connect.
- **EasyPost shipping provider** — New backend provider implementation for EasyPost (carrier accounts, services, label creation via the EasyPost v2 API).
- **Shipping plugin install modal** — Shipping plugins show a dedicated connect modal that validates the API key before installation, instead of the instant-install flow used by other plugins.
- **Update API key route** — New `POST /api/v1/plugins/:key/update-api-key` endpoint lets admins update their shipping provider API key without reinstalling the plugin.
- **Single shipping plugin enforcement** — Only one shipping plugin can be installed at a time. Installing a second one returns a conflict error.

### Changed
- **Settings > Shipping** — Replaced the manual provider dropdown and API key input with a plugin-aware status card. Shows connected provider status with a link to the Plugins page for management. Carrier mapping section is unchanged.
- **Plugin catalog** — Removed ShipStation (coming soon) placeholder. Added Shippo and EasyPost as available shipping plugins with user-provided API key mode.

## [3.59.0 / 2.44.0] - 2026-03-06

### Added
- **CSV Export** — Export data as CSV files from Inventory, Orders, Purchase Orders, and Suppliers pages. Orders export respects the active status filter.
- **CSV Import** — Bulk-import data via CSV upload for Inventory (update stock by SKU), Suppliers (create new suppliers), and Purchase Orders (create POs grouped by supplier). Includes drag-and-drop upload, downloadable CSV templates, and detailed import result reporting with error details.
- **Reusable CsvImportModal component** — Shared modal with file drop zone, column reference, template download, and result display.

## [3.58.0 / 2.43.0] - 2026-03-05

### Added
- **Mobile App Settings page** — New admin settings section under Settings > Warehouse > Mobile App. Admins can configure how the Android mobile app behaves for all pickers in the organization.
- **Picking mode** — Choose between single-order or batch picking mode, with configurable max batch size.
- **Pick confirmation method** — Set to barcode scan only, manual tap only, or flexible (both).
- **Workflow controls** — Toggle bin locations, partial picks, item skipping, auto-assign next pick list, priority-based queue, and require photo on damage/shortage.
- **Display options** — Toggle product images, weight, and customer info visibility on the mobile app.
- **Mobile modules** — Enable/disable PO Receiving and Inventory Counts on mobile.
- **User-overridable defaults** — Admin sets defaults for sort order, theme, font size, sound/vibration on scan, and auto-advance. Individual pickers can override these on their device.
- **Login API returns mobile settings** — `POST /api/v1/auth/login` response now includes `mobileSettings` object so the Android app gets all configuration in a single request on login.
- **Dedicated mobile settings endpoints** — `GET /api/v1/account/mobile-settings` (any authenticated user) and `PATCH /api/v1/account/mobile-settings` (admin only) for reading and updating mobile app settings.
- **Bins & Labels settings page** — New settings section under Warehouse settings for configuring bin label printing defaults (label size, show/hide warehouse name, show/hide location breakdown) and default bin properties (size, pickable, sellable flags). Saved preferences are automatically applied when opening the Print Labels dialog and when generating new bins.
- **Pick bin label printing** — Print static labels for physical pick bins/totes from the Picking page. Configurable prefix (BIN, TOTE, CART), numbering range, and 4 label sizes. Each label has a Code 128 barcode, bold bin code, and violet accent stripe.

## [3.57.0] - 2026-03-04

### Added
- **Page navigation in global search** — Cmd+K search now includes a "Pages" section that matches all app pages (Dashboard, Analytics, Orders, Inventory, Locations, Picking, Shipping, Purchase Orders, Create PO, Suppliers, Plugins, Settings) with keyword aliases. Pages appear instantly (client-side filtering) above API results. Works from just 1 character typed.

## [3.56.0] - 2026-03-04

### Changed
- **PO detail page layout overhaul** — Moved all action buttons (status transitions, Send, PDF, Cancel/Delete) into the page header for immediate access without scrolling. Added a 4-column summary stat strip showing item count, total cost, received progress with bar, and expected date. Removed the separate Actions card from the sidebar. Right sidebar now contains only PO Info and Invoice cards. Destructive actions (Cancel Order, Delete) moved to a "More" dropdown menu. Receive mode shows Save/Cancel in both header and items card. Responsive: stat strip collapses to 2×2 grid on mobile, header buttons wrap.

## [3.55.0 / 2.42.0] - 2026-03-04

### Added
- **New PO statuses: Shipped & Received with Issues** — Two new purchase order statuses added to the lifecycle. "Shipped" tracks when supplier has dispatched goods. "Received with Issues" marks POs received with discrepancies, damage, or missing items.
- **Send PO to Supplier via email** — New "Send to Supplier" button on PO detail page (Ordered/Shipped status). Generates PDF server-side and sends it as an email attachment via Resend. Tracks sent date and supports resending.
- **Invoice tracking on Purchase Orders** — New Invoice card on PO detail page with invoice number, date, amount fields (auto-save on blur) and file upload support (PDF/JPG/PNG/WEBP, max 10MB). Uploaded files can be previewed and deleted.
- **Mark as Shipped action button** — Available when PO is in Ordered status.
- **Mark Received with Issues action button** — Available when PO is in Partially Received status.

### Changed
- **Renamed "Receiving" to "Purchase Orders"** — Sidebar nav label, list page title, detail breadcrumb, create breadcrumb, and docs all updated to "Purchase Orders". Routes remain unchanged (`/receiving`).
- **Updated PO status transitions** — Ordered can now transition to Shipped. Shipped can transition to Partially Received, Received, Received with Issues, or Cancelled. Partially Received can transition to Received with Issues.
- **Editable fields extended to Shipped status** — Tracking number, tracking URL, expected date, and notes are now editable for Shipped POs (previously only Draft and Ordered).
- **Cancel button available for Shipped POs** — Cancel Order action now includes Shipped status.

## [3.54.2] - 2026-03-03

### Added
- **Mobile App documentation page** — New docs page at /mobile-app covering the Android picking app: features, screens, API endpoints, authentication, tech stack, and developer setup. Added "Mobile" nav section to docs sidebar.

## [3.54.1] - 2026-03-03

### Fixed
- **PO detail page broken layout** — Replaced the 9-column table (images tiny, text wrapping 5+ rows) with a card-based list layout. Each item shows a 40×40 square image, truncated product name, inline SKU/Supplier SKU/EAN metadata, and quantities + cost on the right.
- **PO PDF "Order Date" label** — All three templates (Modern, Classic, Minimal) now display "Order Date" instead of just "Date" for the PO creation date.
- **Minimal PO template missing barcode** — Added Code 128 barcode to the minimal template header, matching Modern and Classic templates.
- **Digital products showing as SIMPLE** — The `isDigital` flag was added to WooCommerce sync but existing products need a re-sync. Trigger a sync from Inventory page after deploying to update all products.

## [3.54.0] - 2026-03-03

### Changed
- **Settings restructure: Documents vs Business** — Moved brand color picker, company stamp/signature upload, and default PO note from Business settings into Documents settings. Documents page now has a "General document settings" section (color, stamp, note) above the PO template picker. Business page is streamlined to company name, address, contact details, logo, and sidebar preview.

## [3.53.1] - 2026-03-03

### Fixed
- **PO detail page images not loading** — The GET /receiving/:id endpoint now enriches PO items with product images, supplier SKU, and EAN (matching the PDF endpoint enrichment).
- **Expected Date not always shown on PO detail** — Expected Date now always displays in the PO Info card. Shows "Not set" when empty; editable via inline date picker for DRAFT and ORDERED POs.
- **Cannot edit expectedDate/notes for ORDERED POs** — The PATCH /receiving/:id endpoint now allows editing expectedDate and notes for both DRAFT and ORDERED status POs (supplier/items remain DRAFT-only).
- **Digital products not detected during WooCommerce sync** — Added `virtual` and `downloadable` fields to WooProduct interface; product and variation sync now sets `isDigital` flag based on these fields.
- **Missing border on receiving list thumbnails** — Product thumbnail images in the PO list now have a subtle ring border for better visibility.

## [3.53.0] - 2026-03-03

### Added
- **3 distinct PO PDF templates** — Modern, Classic, and Minimal templates now render with truly different layouts instead of sharing one design. Modern has accent bars, colored info boxes, and branded total box. Classic uses bordered header, grid-style table, and traditional right-aligned totals. Minimal features large PO number, no boxes, thin separators, and Product-first column order.
- **Company details on PO PDF** — All templates show company address, email, phone, VAT ID, and website. Modern in a "From" info box, Classic in the header area, Minimal as small text below PO number.
- **Stamp/signature on PO PDF** — When a company stamp image is uploaded in Branding settings, it renders at ~80x80pt above the "Authorized Signature" line on all templates.

## [3.52.0] - 2026-03-03

### Added
- **Business details settings** — New card in Branding settings for company address, email, phone, VAT/Tax ID, and website. All fields saved together via tenant settings.
- **Company stamp upload** — New card for uploading a company stamp/signature image (max 512KB, resized to 300px PNG). Shows preview with change/remove actions.

## [2.39.2] - 2026-03-03

### Fixed
- **PO PDF empty pages (root cause fix)** — PDFKit auto-creates pages when `doc.text()` is called near the bottom margin, even with `lineBreak: false`. Fixed by: (1) using `autoFirstPage: false` with manual page management instead of `bufferPages`, (2) temporarily setting `page.margins.bottom = 0` before drawing footer text, (3) tracking page count manually instead of relying on `bufferedPageRange()`.
- **PO PDF text wrapping in table cells** — `lineBreak: false` with `width` param does NOT prevent wrapping in PDFKit. Fixed by removing ALL `width` params from table cell `doc.text()` calls. Text is now manually truncated with `doc.widthOfString()` + ellipsis before rendering, and positioned manually using calculated x coordinates.
- **PO PDF column headers truncated** — "Supplier SKU" was too long for 60pt column. Shortened to "Sup. SKU". Increased column widths (SKU 70, Sup. SKU 70, EAN 85) for better readability.

## [3.51.0] - 2026-03-03

### Added
- **PO detail product images** — Items table now shows product thumbnails (32x32) via image proxy. Falls back to Package icon placeholder when no image available.
- **Supplier SKU column** — Conditionally shown in PO items table when any item has a supplier SKU.
- **EAN column** — Conditionally shown in PO items table when any item has an EAN code.
- **Receiving progress bar** — Visual colored progress bar in PO Info card showing received/ordered ratio with percentage. Green when fully received, amber for partial.

## [3.50.0 / 2.39.1] - 2026-03-03

### Fixed
- **PO PDF empty pages** — Rewrote poPdf.ts to use `bufferPages: true` with post-render footer injection. Footer was at y=815 (past A4 boundary of 841.89pt), causing PDFKit to auto-create empty pages. Now footers are written at y=790 after all content is laid out.
- **PO PDF long product names** — Added `lineBreak: false` to ALL `doc.text()` calls in the table (and throughout). Long names are truncated with ellipsis instead of wrapping into the next row.
- **PO PDF footer on every page** — Footer now appears on every page with company name (left), generated date (center), and "Page X of Y" (right) using buffered page iteration.
- **PO PDF table header repeats** — When items table spans multiple pages, the column header row is re-drawn at the top of each new page.

## [3.50.0 / 2.39.0] - 2026-03-03

### Added
- **Brand color setting** — Pick an accent color in Settings > Business. Used on PO PDF headers, bars, and highlights. 12 color presets.
- **Default PO note** — Set a default note (e.g. payment terms, delivery instructions) in Settings > Business. Automatically appended to every PO PDF.
- **PO barcode** — Scannable Code 128 barcode on every PO PDF for the PO number.
- **Signature lines** — "Authorized Signature" and "Received By (Supplier)" signature areas on PO PDF.
- **bwip-js** dependency for barcode generation.

### Fixed
- **Logo not showing on PDF** — Frontend saved logo as WebP, but PDFKit only supports PNG/JPEG. Now converts via Sharp on the backend. Also changed frontend upload to save as PNG.
- **PDF text too small** — Rewrote entire PDF with proper readable sizes: title 26pt, body 10.5pt, table 9.5pt, rows 28pt height.
- **PDF empty pages** — Fixed footer positioning and removed `bufferPages` that created blank pages. Added proper page break logic for long item lists.
- **Table text overflow** — Added `lineBreak: false` + `ellipsis: true` to prevent text wrapping into adjacent rows.

## [3.49.0 / 2.38.0] - 2026-03-03

### Fixed
- **Digital product toggle** — Toggle was visually broken due to invalid Tailwind class (`translate-x-4.5`). Fixed with proper arbitrary value classes.
- **Digital product type display** — Digital products now correctly show "Digital" badge in inventory list (requires migration deploy).
- **PO PDF generation** — Moved from broken client-side (jsPDF) to reliable server-side generation using PDFKit. PDFs now stream directly from `GET /receiving/:id/pdf`.

### Changed
- **PDF template previews** — Settings > Documents now shows realistic A4 aspect-ratio previews with actual sample data (SKUs, product names, prices, totals) instead of abstract placeholders.

### Removed
- **Client-side PDF generation** — Removed `generatePoPdf.ts` (jsPDF/jspdf-autotable). All PDF generation is now server-side via PDFKit.

## [3.48.0 / 2.37.0] - 2026-03-03

### Added
- **Custom logo upload** — Upload company logo in Settings > Business. Stored as optimized WebP data URL in tenant settings. Logo displayed in sidebar (replaces letter initial) and on PO PDFs. Max 512KB, auto-resized to 200px.
- **PO PDF templates** — Three professional PDF designs: Modern (accent bar, bold typography), Classic (bordered boxes, grid table), Minimal (ultra-clean whitespace). Choose template in Settings > Documents. All templates whitelabeled with your company name and logo.
- **Documents settings** — New Settings section to pick PO PDF template with visual previews of each design.

### Changed
- **Supplier product images** — Thumbnails now have visible `border-border/40` borders matching orders page style.
- **Suppliers columns button** — Moved to far-right position (matching Orders page layout).
- **Sidebar company name** — No longer clickable/navigates to settings. Just displays company name and logo.

## [3.47.0 / 2.36.0] - 2026-03-03

### Added
- **Tags management in Settings** — Create and manage order tags in Settings > Tags. Define tag name and color. Tags are shared across team. Default tags (VIP, Rush, Fragile, Gift, Wholesale, Return) auto-seeded for new tenants.
- **Tag picker on orders** — Order tags now picked from pre-defined tags (Settings) instead of inline creation. Non-admin users can pick tags via `/account/tags` endpoint.
- **Digital product toggle** — Mark products as digital (e.g. gift cards) with toggle in Product Information. Digital products show "Digital" badge in sidebar and inventory list. New `is_digital` column with migration.
- **Bundle component images** — Bundle component rows now show product thumbnail images.
- **Dynamic weight/dims units** — Weight and dimension labels respect tenant unit system setting (kg/cm for metric, lb/in for imperial) instead of being hardcoded.

## [3.46.0 / 2.35.0] - 2026-03-03

### Added
- **PO product detail popup** — Click any SKU or product name in the PO items table to see a popup with product image, stock levels (in stock / reserved / available), pack size, sell price, weight, and supplier info. Link to full product detail page.
- **Product images in PO items** — Each item row shows a product thumbnail on the left.
- **Full-pack ordering hints** — When a product has a `packageQty`, the qty field shows whether you're ordering full packs. If not, shows a clickable prompt like "Order 2 full packs (72 pcs)?" to round up. When qty is already a full-pack multiple, shows a green confirmation like "3 full packs (36/pack)".
- **Bundles excluded from PO search** — Product search in PO creation now filters out bundle products (can't order bundles from suppliers).
- Backend `/inventory` endpoint now accepts `excludeBundles=true` query param.
- Backend `/receiving/product-info` now returns `imageUrl`, `price`, `stockQty`, `reservedQty`, `weight`.

## [3.45.0] - 2026-03-03

### Changed
- **World map much more visible** — Map background dots opacity raised to 63% for a clearly visible world outline.
- **Hoverable map markers** — Hovering a country dot on the map shows a tooltip with country name, order count, and revenue.
- **Stat cards show comparison permanently** — Previous period value and change amount now displayed below each sparkline (not hidden behind hover). Shows "prev 30 days: €X / +€Y" at a glance.
- **Better Customize dropdown** — Two sections: "Metric Cards" (toggle cards) and "Sections" (toggle Charts, Breakdowns, Map). Click outside to close.

## [3.44.0] - 2026-03-03

### Changed
- **Map markers smaller** — Reduced marker dot size on world map. Base size is now tiny, scales logarithmically with order count so countries with more orders get larger dots.
- **Map dots more visible** — Increased opacity of the dotted world map background from 20% to 37% for better visibility.
- **Stat card tooltips** — Hovering any metric card now shows a tooltip with current value, previous period value, and absolute change amount.
- **Better Customize dropdown** — Dropdown now has two sections: "Metric Cards" (toggle individual cards) and "Sections" (toggle Charts, Status/Payments/Products, and Order Map). Click outside to close.

## [3.43.0 / 2.34.0] - 2026-03-03

### Changed
- **Analytics map redesign** — White background dotted world map with correctly placed pulsing markers per country. Uses DottedMap's own projection (`getPin`) for accurate dot placement. Removed curved lines — map now simply shows where orders come from. Full-width layout with inline top countries sidebar.
- **Interactive charts** — Sales Over Time bar chart and new Orders Over Time line chart both support hover tooltips showing exact values, date, and order count.
- **Analytics layout** — Smaller, more compact charts. Two charts side-by-side (sales bars + orders line).

### Added
- **Orders Over Time** — New interactive area/line chart showing daily order count alongside the sales bar chart.
- **Orders by Status** — Horizontal bar chart breakdown of orders by fulfillment status (Pending, Processing, Shipped, etc.) with color-coded bars.
- **Payment Methods** — Horizontal bar chart showing order count and revenue per payment method.
- **Top Products** — Ranked list of top 10 best-selling products by quantity in the selected period.
- Backend analytics endpoint now returns `ordersByStatus`, `ordersByPayment`, and `topProducts` data.

### Removed
- `framer-motion` dependency (no longer needed — map uses pure SVG animations).

## [3.42.0] - 2026-03-03

### Changed
- **Analytics world map** — Replaced custom SVG dot map with `dotted-map` library. Map now shows a proper dotted world map with animated curved lines from warehouse origin (Prague) to order destination countries using `framer-motion`.
- **Analytics bar chart** — Replaced area chart with Shopify-style vertical bar chart. Bars aggregate by day (7d/30d), week (90d), or month (1y) for clean readability.

### Added
- `dotted-map` and `framer-motion` as frontend dependencies.
- `frontend/src/components/ui/world-map.tsx` — Reusable WorldMap component adapted from shadcn/aceternity pattern.

## [3.41.0 / 2.33.0] - 2026-03-03

### Added
- **Analytics page** — New `/analytics` route with period selector (7d/30d/90d/1y), four configurable stat cards with sparklines (Total Sales, Total Orders, Avg Order Value, Items Sold), SVG area chart for sales over time, dark-themed SVG world map with animated dots for order geography, and Top Countries sidebar with flags and proportional bars. Cards can be customized via the "Customize" button.
- **Order tags** — Add colored tags to orders from the order detail header. Tags are stored per order and help warehouse staff flag orders for special attention.
- **Customer manual tags** — Add manual colored tags to customers (by email) from the order detail Customer card. Tags persist across all orders from the same customer, alongside auto-generated rule tags.
- **Packing note** — Amber-tinted editable text area on order detail for warehouse packing/picking instructions. Auto-saves on blur. Separate from WooCommerce order notes.
- **Currency symbols** — All monetary values now display with proper currency symbols (€, $, £, Kč, etc.) instead of raw codes (EUR, USD). Supports postfix currencies (e.g. "123.45 Kč").

### Changed
- **Suppliers list product images** — Products column now shows thumbnail images (up to 3 with +N overflow) instead of a plain count.
- **Supplier detail name truncation** — Long product names in supplier detail tables are now truncated to one line with smaller font.
- **Notes card renamed** — Order detail "Notes" card renamed to "Customer Notes" to distinguish from the new Packing Note.

### Fixed
- Removed duplicate "Column Customization" section from Orders documentation.

## [3.40.0 / 2.32.0] - 2026-03-03

### Added
- **Suppliers column builder** — Suppliers list now has a Columns toggle button to show/hide columns (Website, Address). Preferences saved per user.
- **Supplier website URL field** — New `website` field on suppliers. Shown in detail page info card and as a clickable link in the table. Editable and available in the create modal.
- **Supplier detail product images** — Products table on supplier detail now shows product thumbnail images alongside names.
- **Supplier detail pagination** — Products and Purchase Orders tables on supplier detail page are now paginated (5 per page).
- **PACKER role** — New team member role "Packer" available alongside Picker, Staff, and Manager. Orange badge in team settings.
- **Receiving items preview** — Receiving (PO) list now shows up to 3 product thumbnail images per PO with +N overflow badge, matching the Orders page style.

### Changed
- **Receiving page icons** — Switched from lucide-react to Phosphor icons for consistency with the rest of the app.
- **Supplier detail product images** — Backend now returns product image URLs in supplier detail endpoint for richer product display.
- **Settings table config** — Table Configuration section now includes Suppliers table alongside Orders and Inventory.

## [3.39.0] - 2026-03-03

### Added
- **Suppliers stat strip** — Suppliers list page now shows stat cards: Total Suppliers, Active, Products Linked, Purchase Orders
- **Supplier detail summary cards** — Detail page shows Products, POs, Avg Lead Time, and Open POs at a glance
- **Supplier status filter** — Quick-filter pills for All / Active / Inactive suppliers
- **Supplier avatar initials** — Table rows now show colored avatar initials for each supplier

### Changed
- **Enhanced Suppliers UI** — Full redesign of Suppliers list and detail pages: Phosphor icons, consistent table headers, better contact info display (email + phone in one column), loading states, improved empty states
- **Supplier detail polish** — Consistent card styling, violet-tinted supplier SKU badges, hover-to-show delete buttons, dot indicators on PO status badges

### Removed
- **Warehouse Guide page** — Removed `/warehouse/guide` route and all links to it. Guide content moved to docs site at https://docs.picknpack.io/warehouse. Dashboard and WarehouseOverview now link to external docs.

## [3.38.0 / 2.31.0] - 2026-03-03

### Changed
- **Items column shows product thumbnails** — Orders table Items column now displays up to 3 product thumbnail images with a "+N" overflow badge for orders with more items, instead of just a plain number. Backend order list endpoint now includes product image URLs.

## [3.37.0 / 2.30.0] - 2026-03-03

### Added
- **Order stats strip** — Orders page now shows a stat strip with counts for Pending, Processing, Picking/Packing, and Shipped orders. New `GET /orders/stats` backend endpoint returns order counts grouped by status
- **Order page header** — Shows total order count in subtitle

### Changed
- **Inventory stat strip fixed** — Replaced confusing unit-level aggregates with product-level counts (Total Products, In Stock, Low Stock, Out of Stock) matching the filter buttons. Numbers are now consistent and accurate
- **Removed BUNDLE badge from product name** — Since there's now a dedicated "Type" column, the inline bundle badge next to the product name has been removed to avoid redundancy
- **Page layout height fix** — Main content area now fills the viewport properly so pages aren't cut off

## [3.36.0] - 2026-03-03

### Added
- **Columns toggle on Inventory** — Inventory page now has the same Columns dropdown as Orders, allowing users to show/hide columns. Preferences persist across refreshes (synced to server)
- **More column options** — Orders table adds Email, Payment Method, Shipping Method, and Priority columns (hidden by default). Inventory table adds SKU (separate toggle), Type (Simple/Bundle), and Low Threshold columns (hidden by default)

### Changed
- **Fixed inventory stat cards** — header subtitle now shows product count + products in stock (from filter counts) instead of mixing product count with unit count. Stat strip cards now clearly labeled "Total Units", "Reserved Units", etc. to distinguish from product-level counts in filter buttons
- **Consistent page styling** — Orders and Inventory now use the same heading size, icon library (Phosphor), spacing, and table header styles

## [3.35.0 / 2.29.0] - 2026-03-03

### Added
- **Order Rules engine** — "Customer Tags" in Settings renamed to "Rules" with four rule types: Customer Tag (colored badges), Free Gift (auto-add SKU at price $0), Auto Priority (set order priority 1-3), and Auto Note (append note to order). Sync-time rules (free gift, auto priority, auto note) fire once when new orders arrive from WooCommerce. Customer tags evaluate at view time. Full backward compatibility with existing customerRules data.

### Changed
- **Docs site is the single help source** — removed the in-app `/docs` Help Center page. All help links (sidebar "Help", dashboard "Documentation") now point to https://docs.picknpack.io
- **Docs site logo fixed** — header and footer now use the correct PickNPack LogoMark (the "pQ" icon with proper viewBox), matching the app's favicon and sidebar icon
- **Warehouse docs split into 5 pages** — the massive single Warehouse page is now organized into subcategories: Overview, Zones & Racks, Floor Plan, Bins & Stock, and Labels. Sidebar shows "Warehouse" as its own section with sub-links
- **Docs site design improvements** — added footer, improved mobile text sizes and responsive padding
- **CLAUDE.md updated** — docs-site update is now a numbered mandatory rule (rule #5) alongside changelog and version bump

## [3.33.0 / 2.28.0] - 2026-03-03

### Added
- **Customer tags on order detail** — order detail Customer card now shows lifetime order count, total revenue, and auto-generated colored badges (e.g. "VIP", "Loyal") based on classification rules
- **Customer classification rules in Settings** — new admin-only "Customer Tags" settings section where you define rules like "if revenue > $1000 → VIP (amber)" or "if orders > 10 → Loyal (emerald)". Rules are evaluated automatically on every order detail view

### Changed
- **Consistent font** — removed Plus Jakarta Sans from onboarding pages; Inter is now the sole font across the entire app
- **Colorful settings groups** — settings overview now uses distinct group colors (blue for Personal, violet for Account, emerald for Warehouse, amber for Integrations) with colored dots on group headers and tinted icon backgrounds

## [3.32.0] - 2026-03-03

### Changed
- **Order Detail page redesigned** — enhanced two-column layout with bigger 56px product thumbnails (clickable to inventory), per-item picking progress bars, rich shipment tracking cards with copy-to-clipboard tracking numbers + "Track Package" / "Download Label" buttons, customer avatar with initials + mailto/tel links, embedded Google Maps preview for shipping address, visual vertical timeline with colored dots (emerald/blue/gray), payment summary with method + Paid/COD badge, billing address shown only when different from shipping

## [3.31.1] - 2026-03-03

### Fixed
- **Warehouse utilization now capacity-based** — zone and warehouse utilization is now calculated as items stored vs total capacity (based on Location Size: Small=25, Medium=50, Large=100, XL=200) instead of treating each item as filling an entire location. "3/600 capacity used (1%)" instead of the misleading "3/12 locations occupied (25%)"

## [2.27.1] - 2026-03-03

### Fixed
- **Orders not opening** — order resolver was treating numeric order numbers (e.g. "12345") as internal DB IDs instead of WooCommerce order numbers. Now tries orderNumber first, falls back to internal ID
- **Products with numeric SKUs not opening** — product resolver now falls back to SKU lookup when a numeric param doesn't match any internal ID, fixing products with all-digit SKUs

## [3.31.0 / 2.27.0] - 2026-03-03

### Changed
- **URL structure overhaul** — URLs now use natural identifiers instead of auto-increment IDs:
  - Orders: `/orders/12345` (order number) instead of `/orders/2905`
  - Products: `/inventory/WIDGET-01` (SKU) instead of `/inventory/2905`, falls back to numeric ID for products without SKU
  - Purchase Orders: `/receiving/PO-2024-001` (PO number) instead of `/receiving/5`
  - Suppliers: unchanged (internal entity, numeric ID is fine)
- **Backend smart resolvers** — all inventory and receiving API endpoints now accept both numeric IDs and natural identifiers (SKU, poNumber). Orders already had this
- **Global search** — search results now navigate using natural identifiers
- **Stock movement references** — PO receive movements now store the actual PO number instead of `PO-{id}`

### Fixed
- **Dashboard order links** — were using numeric `order.id` instead of `order.orderNumber`, breaking the smart resolver pattern
- **Product detail order links** — same fix as Dashboard

## [3.30.4 / 2.26.4] - 2026-03-03

### Fixed
- **Product edit destroying stock/barcodes** — PATCH endpoint was returning incomplete data (missing barcodes, supplier SKUs, bundle components). Frontend was overwriting product state with this incomplete response, making stock appear as 0 and barcodes disappear. Now returns all relations matching the GET endpoint
- **Inline edit debounce** — auto-save now debounces (500ms) and skips if nothing changed, preventing duplicate/concurrent API calls when tabbing between fields

## [3.30.3 / 2.26.3] - 2026-03-02

### Changed
- **Floor plan mini — bigger with legend** — increased canvas size, added color legend ("Product location" = green, "Other zones" = gray) below the map
- **Product Information inline editing** — all fields are now always editable inline without needing to click "Edit Product" first. Auto-saves on blur. Inputs appear as plain text until focused

## [3.30.2 / 2.26.3] - 2026-03-02

### Fixed
- **Floor plan mini visualization** — all elements now render as neutral gray (#e0e0e0), highlighted product zones in emerald green (#10b981) with quantity badge displayed inside. Clean, minimal look replacing the previous colorful visualization
- **Assign-to-bin stock validation** — backend now blocks assigning more pieces to bins than the product has in stock. Returns clear error message with remaining unassigned count
- **Assign form max qty** — frontend assign form shows how many units are unassigned, caps the input at max available, and disables the button when all stock is already assigned

## [3.30.1 / 2.26.2] - 2026-03-02

### Added
- **Floor plan location on product detail** — warehouse locations card now shows a mini floor plan with the product's zone(s) highlighted in orange. Auto-fetches the warehouse floor plan and scales it to fit. Other zones shown dimmed for context
- **Assign product to bin** — "Assign" button in the Warehouse Locations card opens an inline form with bin dropdown (grouped by zone) and quantity input. Uses existing `POST /inventory/:id/assign-bin` API

### Removed
- **Packing station from main app** — removed `/packing-station` route and sidebar nav item. Packing station is now only accessible via the `pack.*` subdomain

## [3.29.1 / 2.26.2] - 2026-03-02

### Changed
- **Packing station v3** — tighter, denser layout with less wasted space. Active queue item now uses inverted (black) highlight. Items are compact cards with larger images (56px), orange hover states, emerald checked states. Scan bar + progress merged into single row. Ship-to address in a subtle card. Overall more professional and warehouse-tool-like
- **Currency formatting** — proper symbols for EUR (€), GBP (£), CZK (Kč), and 30+ currencies instead of showing raw currency codes like "EUR0.14"
- **System notes filtered** — packing station sidebar hides system-generated notes ("Packing started by user X at...") and only shows actual customer/order notes
- **Compact top bar** — standalone mode top bar reduced to 44px, embedded page header tightened

## [3.28.3 / 2.26.2] - 2026-03-02

### Fixed
- **Packing station shows product images** — items table now displays product thumbnail in each row using the image proxy
- **Packing station error feedback** — "Print Label & Ship" failures now show a red error banner with the actual API error message instead of silently logging to console
- **Packing station bin locations** — backend query now includes stock location / bin data so the Bin column populates correctly

### Removed
- **Onboarding skip buttons** — removed "I'll connect later" and "I'll set this up later" skip links from ConnectStore, StoreConfig, and WarehouseSetup onboarding pages

## [3.28.2 / 2.26.1] - 2026-03-02

### Changed
- **Onboarding VerifyEmail page restyled** — rewrote to match the polished ConnectStore/WarehouseSetup design: grain texture bg, Logo nav with slash-separated step indicators, centered layout, Phosphor icons, styled code input card, matching success state
- **Onboarding StoreConfig page restyled** — rewrote to match the same design system: grain texture bg, Logo nav, Phosphor icons, nicer payment toggle buttons with icons, card-based status mapping with custom select dropdowns, empty states for missing data, full-width dark CTA button with skip link

## [3.28.1 / 2.26.1] - 2026-03-02

### Fixed
- **Shipping settings API key persistence** — shipping provider now correctly shows "Connected" state after page refresh. Backend returns `shippingProvider` and `hasShippingApiKey` in store data without exposing the encrypted key. Connected view shows placeholder indicating key is saved with option to update it

## [3.28.0 / 2.26.0] - 2026-03-02

### Added
- **Packing Station** — new full-width packing page at `/packing-station` with two-panel layout: order queue on the left (PICKED/PACKING orders sorted by priority), active order on the right with item checklist, shipping info, and action buttons
- **Print Label & Ship** — one-click button generates a shipping label via the configured provider (Shippo), creates shipment record, sets order to SHIPPED, and auto-advances to the next order
- **Ship Without Label** — skip label generation for manual shipping workflows
- **Packing backend API** — 4 new endpoints: `GET /packing/queue`, `POST /packing/start`, `POST /packing/complete`, `POST /packing/skip`
- **Sidebar navigation** — "Packing" added to Warehouse section in the sidebar
- **Standalone subdomain mode** — packing station runs fullscreen on `pack.yourdomain.com` with its own top bar (no sidebar), auto-detected via subdomain. Same build, same API, just a different shell

## [3.27.0 / 2.25.0] - 2026-03-02

### Added
- **Shipping provider adapter** — provider-agnostic shipping integration supporting Shippo (with ShipStation API and SendCloud ready to add). Tenants connect their own account and API key
- **Shipping method mapping** — pair WooCommerce shipping methods with carrier services so the packer just presses "Print Label" and the right carrier label prints
- **Shipping & Labels settings page** — connect shipping provider, test API key, fetch WooCommerce methods, and configure carrier mapping
- **Store Configuration onboarding step** — new step 3 in onboarding that auto-fetches WooCommerce shipping methods, payment gateways, and order statuses. Users configure payment types (prepaid vs COD) and status mapping
- **Payment tracking on orders** — orders now store `paymentMethod`, `paymentMethodTitle`, and `isPaid` fields synced from WooCommerce. COD/Paid badges shown on order detail
- **Shipping method on orders** — orders now store `shippingMethod` and `shippingMethodTitle` from WooCommerce shipping lines, displayed as a badge on order detail
- **WooCommerce status push-back** — when app changes order status (e.g., to SHIPPED), it pushes the mapped WooCommerce status back automatically (configurable in settings)
- **WooCommerce config fetch API** — new endpoint to fetch shipping methods, payment gateways, and order statuses from a connected WooCommerce store
- **Shipping label creation endpoint** — `POST /api/v1/shipping-config/label` creates a shipping label via the connected provider, auto-selecting carrier from the shipping method mapping

### Changed
- **Order URLs use order numbers** — order detail routes now accept WooCommerce order numbers (e.g., `/orders/1234`) in addition to numeric DB IDs. Frontend links now use `orderNumber`
- **Onboarding is now 4 steps** — Verify Email → Connect Store → Store Configuration → Warehouse Setup
- **Order sync extracts more data** — payment method, payment title, shipping method, and shipping title are now captured during WooCommerce order sync

## [3.26.3] - 2026-03-02

### Changed
- **Product detail page redesign** — replaced horizontal tab navigation with a sidebar + content layout. Desktop shows a sticky left sidebar with product identity, stock summary, vertical navigation, and quick actions. Mobile collapses to a compact header with horizontal scrollable pill navigation

## [3.26.2 / 2.24.1] - 2026-03-02

### Fixed
- **Images not loading** — reverted image proxy to public (SSRF protection still active). `<img>` tags can't send JWT headers, so auth broke all proxied images
- **Bundle toggle** — replaced auto-bundle behavior with a simple on/off toggle switch. Bundle status is now independent of component count — you can turn it on/off anytime
- **Remove bundle cleanup** — "Remove all" button removes components without changing bundle status. Toggle controls bundle status separately

## [3.26.1] - 2026-03-02

### Fixed
- **Bundle "Can Build" renamed to "Available"** — bundle products in inventory list and product detail now use standard "Available" / "In stock" / "Out of stock" labels instead of confusing "Can build" / "Cannot build"
- **Can convert stuck bundles back to regular products** — if a product is marked as a bundle but has no components, a "Convert to regular product" button now appears in the Bundle tab

## [3.26.0] - 2026-03-02

### Added
- **Warehouse setup onboarding step** — new onboarding page between "Connect Store" and completion where users choose their unit system (metric/imperial) and pallet type (EUR/GMA)
- **Units & measurements settings** — new settings section under Warehouse settings to change unit system and pallet type after onboarding
- **Floor plan auto-defaults from settings** — floor plan setup now reads the tenant's unit system setting to default to meters or feet
- **Dynamic pallet dimensions** — element palette adjusts pallet rack and pallet storage default dimensions based on tenant pallet type (EUR: 1x1, GMA: 2x3/2x2)

### Changed
- **Connect Store onboarding flow** — now navigates to warehouse setup instead of completing onboarding directly; step indicators updated to show 3-step flow

## [2.24.0] - 2026-03-02

### Added
- **Production secret guards** — backend now throws a fatal error at startup if JWT_SECRET or ENCRYPTION_KEY are left at default values in production
- **Rate limiting on auth routes** — 15 requests per 15 minutes on all auth endpoints; stricter 5 requests per 15 minutes on verify-email and reset-password
- **Helmet security headers** — added helmet middleware for HTTP security headers (XSS protection, content-type sniffing prevention, etc.)
- **SSRF protection on image proxy** — DNS resolution check blocks requests to private/internal IP ranges (127.x, 10.x, 192.168.x, etc.)
- **Webhook secret required** — WooCommerce webhooks now reject requests if the store has no webhook secret configured (was previously optional)
- **Tenant isolation on picking/shipping** — pick-item and shipment update handlers now verify tenant ownership before modifying data
- **JWT algorithm pinning** — token verification now explicitly requires HS256 algorithm, preventing algorithm confusion attacks
- **Error message hardening** — 500 errors in production now return generic "Internal server error" instead of leaking internal details; stack traces only shown in development
- **Pagination caps** — inventory and orders list endpoints now cap page size at 100; picking and shipping list endpoints limited to 200 results
- **Password length validation on registration** — register endpoint now requires passwords of at least 8 characters

### Changed
- **Image proxy now requires authentication** — moved behind the authenticate middleware (previously public)
- **Webhook error responses no longer leak details** — catch block returns generic "Processing failed" instead of the actual error message

## [3.25.4 / 2.23.3] - 2026-03-02

### Fixed
- **Can remove bundle status from product** — added "Remove Bundle" button in Bundle tab that deletes all components and converts back to a regular product
- **Auto-unbundle when last component removed** — backend now automatically sets `isBundle = false` when the last bundle component is deleted, so products no longer get stuck as bundles

## [3.25.3] - 2026-03-02

### Fixed
- **Pallet storage uses correct labels** — pallet storage elements now show "Rows" / "Spots" instead of "Shelves" / "Positions" in both the floor plan properties panel and the zone creation modal. Help text also updated (e.g. "Rows (front→back)", "Pallet spots per row")

## [3.25.2 / 2.23.2] - 2026-03-02

### Fixed
- **Bundle "Available" shows Can Build in inventory list** — bundle products now show the number of bundles that can be built from component stock instead of always showing 0. Backend calculates `_canBuild` and includes it in the list API response
- **Bundle badge in inventory list** — bundle products show a violet "BUNDLE" badge next to the product name
- **Bundle stock bar uses violet color** — distinguishes bundle availability from regular stock at a glance

## [3.25.1 / 2.23.1] - 2026-03-02

### Fixed
- **Backend blocks non-storage zone creation** — the auto-zone API endpoint now rejects dock_door, packing_table, receiving_area, shipping_area, staging_area. Only shelf, pallet_rack, pallet_storage can create zones. This is a hard block at the API level so zones can never be created for non-storage elements regardless of frontend state
- **Manual zone creation also guarded** — the "Create Zone" button in floor plan element properties now checks `hasZone` before calling the API

## [3.25.0] - 2026-03-02

### Added
- **Product search in PO creation** — added ProductSearchDropdown to PO create page so you can search for products by name/SKU instead of typing manually
- **Prefill PO from product page** — clicking "Create PO" on a product detail page now prefills the first line item with that product's SKU and name
- **Supplier SKU management from product detail** — can now add and delete supplier SKU mappings directly from the product detail page (Overview tab, Supplier SKUs card)

### Changed
- **Bundle stat cards show own stock** — bundle products now show 4 cards: "Can Build" (from components), "In Stock" (own assembled stock), "Reserved", "Components". Previously hid the product's own stock which made it look like stock disappeared

## [3.24.0] - 2026-03-02

### Added
- **Bundle product display overhaul** — bundle products now have a completely different UI treatment:
  - Stat cards show "Can Build" (calculated from components), "Components" count, and "Reserved" instead of regular stock metrics
  - Violet "Bundle" badge displayed next to product name
  - Overview tab shows "Component Stock" breakdown with per-component availability, limiting factor highlighted in amber
  - Components are clickable to navigate to the component product
  - "Create PO" button hidden (can't PO a bundle)
  - "Purchase Orders" and "Stock History" tabs hidden for bundles
  - "Incoming Stock" section hidden for bundles

### Fixed
- **Bundle search dropdown no longer cut off** — dropdown auto-detects viewport space and opens upward when near the bottom of the page, so results are always fully visible and clickable
- **Bundle search returns more results** — increased from 8 to 15 results for better discoverability

## [3.23.2] - 2026-03-02

### Fixed
- **Non-storage elements no longer create zones** — Packing Table, Receiving Area, Shipping Area, Dock Door, and Staging Area are now map-only elements on the floor plan. Only actual storage elements (Shelving Rack, Pallet Rack, Pallet Storage) create zones with bin locations

## [3.23.1] - 2026-03-01

### Changed
- **Zone modal shows racks only** — Add Element on the Zones tab now only shows Shelving Rack, Pallet Rack, and Pallet Storage. Non-storage elements (Packing Table, Dock Door, Receiving Area, Shipping Area, Staging Area) are placed from the Floor Plan tab only
- **Warehouse docs rewritten** — comprehensive step-by-step usage guide with links to /warehouse, covering hierarchy, rack setup, bin sizing, stock-to-bin flow, floor plan builder, label printing, editing, and typical workflow

## [3.23.0 / 2.23.0] - 2026-03-01

### Added
- **Bin sizing (S/M/L/XL)** — bins now have a size category (Small=25, Medium=50, Large=100, XLarge=200 capacity). Selectable when generating locations, creating zones, and editing individual bins
- **Product size categories** — products auto-classified as Small/Medium/Large/XLarge/Oversized based on WooCommerce dimensions (L×W×H volume). Also settable manually via product edit
- **Assign stock to bin** — `POST /inventory/:id/assign-bin` endpoint upserts stock into a specific bin location with soft capacity warnings
- **Transfer stock between bins** — `POST /inventory/:id/transfer` endpoint moves stock from one bin to another with validation and capacity warnings
- **Bin selection during PO receiving** — when receiving items, a "Put to Bin" dropdown lets you assign each line item to a specific bin location
- **Bin contents in edit panel** — editing a bin now shows a "Contents" section listing all products stored in that bin with quantities
- **Pickable/Sellable flags** — bins can be marked as pickable (available for pick lists) and sellable (inventory counts toward available stock)

### Fixed
- **Stock-to-bin pipeline** — receiving items now creates `StockLocation` records linking stock to physical bin locations. Previously stock was only tracked as a global number on the product with no bin association
- **StockMovement toBin field** — now stores the human-readable bin label instead of the numeric bin ID

### Changed
- **Capacity indicators** — bin grid cells and list view now show stock/capacity fractions with red highlighting when over capacity
- **Bin edit panel** — replaced plain capacity number input with bin size selector + capacity override, plus pickable/sellable/active checkboxes

## [3.22.0 / 2.22.0] - 2026-03-01

### Added
- **Professional label printing** — redesigned Print Labels modal with Code 128 barcodes (via bwip-js), zone-type color stripes, and a polished layout showing location code, zone name, warehouse name, and location breakdown
- **5 label size options** — Zebra 4×6" (shipping label), Zebra 2×1" (small shelf label), Sheet Small (30/page), Sheet Medium (10/page), Sheet Large (6/page). Zebra sizes use custom paper dimensions for direct thermal printing
- **Custom location prefix** — configurable prefix field (up to 5 chars, auto-uppercase) in both the Add Element modal and the Edit Element slide-over. Live preview shows what location codes will look like (e.g. "SHE-01-01"). Prefix is stored on the floor plan element and passed to the auto-zone API
- **Print All Labels** — button in warehouse header prints labels for all locations across all zones at once
- **Regenerate bins endpoint** — `POST /zones/:zoneId/regenerate-bins` deletes old empty bins and creates new ones when shelves/positions change

### Changed
- **Label size selector** — split into two sections: "Direct Print (Zebra)" and "Sheet Labels (Letter)" with clearer descriptions
- **Print modal header** — shows zone-type color accent bar and zone/warehouse name in subtitle
- **Shelf/position descriptions** — fields now show helper text: "Vertical levels (floor → top)" and "Horizontal slots (left → right)" everywhere they appear
- **Floor plan storage setup** — shelves/positions inputs now visible for linked zones too, not just unlinked elements
- **Edit element save** — changing shelves/positions now regenerates the actual bin locations in the database (was only saving config without updating bins)
- **Edit warning** — shows amber warning when shelf/position count differs from existing locations, explaining bins will be regenerated

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
