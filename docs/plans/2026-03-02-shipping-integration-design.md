# Shipping Integration, Onboarding Improvements & Order URL Restructuring

**Date:** 2026-03-02
**Status:** Approved

## Summary

Four interconnected changes:
1. **Provider-agnostic shipping label integration** — adapter pattern supporting Shippo, ShipStation API, SendCloud. Tenant connects their own account.
2. **Onboarding step 3: Store Configuration** — auto-fetch WooCommerce shipping methods, payment gateways, and order statuses. User maps them to app equivalents.
3. **Settings pages** — shipping provider connection, method mapping, payment type config, status mapping.
4. **Order URL restructuring** — change from auto-increment DB IDs (`/orders/123`) to WooCommerce order numbers (`/orders/ORD-5847`).

---

## Data Model

### Order — new fields

```prisma
model Order {
  // existing fields unchanged...
  paymentMethod       String?  @map("payment_method")        // "bacs", "cod", "stripe"
  paymentMethodTitle  String?  @map("payment_method_title")   // "Bank Transfer", "Cash on Delivery"
  isPaid              Boolean  @default(true) @map("is_paid") // false for COD
  shippingMethod      String?  @map("shipping_method")        // "flat_rate:1", "free_shipping:2"
  shippingMethodTitle String?  @map("shipping_method_title")  // "DPD Express", "Free Shipping"
}
```

Populated from WooCommerce during order sync:
- `order.payment_method` → `paymentMethod`
- `order.payment_method_title` → `paymentMethodTitle`
- `order.shipping_lines[0].method_id` → `shippingMethod`
- `order.shipping_lines[0].method_title` → `shippingMethodTitle`
- `isPaid` derived from tenant's payment method configuration (COD = false, everything else = true)

### ShippingMapping — new model

```prisma
model ShippingMapping {
  id               Int      @id @default(autoincrement())
  storeId          Int      @map("store_id")
  store            Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  wooMethodId      String   @map("woo_method_id")       // "flat_rate:1"
  wooMethodTitle   String   @map("woo_method_title")     // "DPD Express"
  providerCarrier  String?  @map("provider_carrier")     // "dpd"
  providerService  String?  @map("provider_service")     // "dpd_classic"
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")

  @@unique([storeId, wooMethodId])
  @@map("shipping_mappings")
}
```

### Store — new fields

```prisma
model Store {
  // existing fields unchanged...
  shippingProvider    String?           @map("shipping_provider")  // "shippo" | "shipstation" | "sendcloud" | null
  shippingApiKey      String?           @map("shipping_api_key")   // encrypted
  shippingMappings    ShippingMapping[]
}
```

### Tenant.settings JSON — new keys

```json
{
  "unitSystem": "metric",
  "palletType": "EUR",
  "paymentMethods": {
    "cod": { "isPaid": false },
    "bacs": { "isPaid": true },
    "stripe": { "isPaid": true }
  },
  "statusMapping": {
    "PICKED": "wc-packed",
    "SHIPPED": "wc-shipped",
    "DELIVERED": "wc-completed"
  },
  "autoStatusPush": true
}
```

---

## Order URL Restructuring

**Before:** `/orders/123` (auto-increment DB ID)
**After:** `/orders/ORD-5847` (WooCommerce order number)

### Changes:

1. **Backend** — `GET /api/v1/orders/:id` changes lookup:
   ```ts
   // Before
   prisma.order.findUnique({ where: { id: parseInt(id) } })
   // After
   prisma.order.findFirst({ where: { orderNumber: id, store: { tenantId } } })
   ```
   Scoped to tenant so two stores with order #1234 don't collide.

2. **Frontend** — all links from `/orders/${order.id}` to `/orders/${order.orderNumber}`

3. **Internal references** — shipping, picking, and other endpoints that reference orders by ID continue using the internal DB `id`. Only the user-facing order URL changes.

---

## Onboarding Flow

**Before:** 3 steps (Verify Email → Connect Store → Warehouse Setup)
**After:** 4 steps (Verify Email → Connect Store → **Store Configuration** → Warehouse Setup)

### Step 3: Store Configuration (new page)

After store connection succeeds, the backend auto-fetches from WooCommerce:
- Shipping zones + methods: `GET /wc/v3/shipping/zones` then `GET /wc/v3/shipping/zones/{id}/methods`
- Payment gateways: `GET /wc/v3/payment_gateways`
- Order statuses: `GET /wc/v3/reports/orders/totals`

The page shows three sections:

**A. Shipping Methods**
- Table of fetched WooCommerce shipping methods
- Each row has a dropdown to pair with a shipping provider carrier/service
- If no shipping provider is connected yet, shows a prompt: "Connect a shipping provider in Settings to enable label printing" with a skip option
- Unmapped methods are fine — they just won't auto-print labels

**B. Payment Methods**
- Table of fetched WooCommerce payment gateways
- Toggle for "Prepaid" vs "COD" per method
- Auto-detected: `method_id === 'cod'` → COD, everything else → Prepaid

**C. Order Status Mapping**
- Two-column layout: App status (PICKED, PACKING, SHIPPED, DELIVERED) → WooCommerce status dropdown
- Pre-filled with sensible defaults where names match
- Toggle: "Auto-push status changes to WooCommerce"

All sections are skippable — user can configure in Settings later.

---

## Settings Pages

### Shipping Settings (new settings section)

**1. Shipping Provider Connection**
- Dropdown: Shippo / ShipStation API / SendCloud / None
- API key input (encrypted on save)
- "Test Connection" button (validates key against provider API)
- Connection status badge

**2. Shipping Method Mapping**
- Table: WooCommerce Method | Provider Carrier | Provider Service
- "Refresh from WooCommerce" button to re-fetch methods
- Carrier dropdown populated from provider API
- Service dropdown populated based on selected carrier
- Warning on unmapped methods

**3. Default Shipping Settings** (minimal for now)
- Default package dimensions and weight
- Return address (defaults to store address)

### Payment Methods (in store settings)
- Table: Payment Method | Type (Prepaid / COD)
- "Refresh from WooCommerce" button

### Status Mapping (in order settings)
- App Status → WooCommerce Status dropdown
- "Auto-push to WooCommerce" toggle

---

## Shipping Provider Adapter

### Architecture

```
backend/src/shipping/
├── types.ts           # ShippingProvider interface + shared types
├── registry.ts        # Provider registry (get by name)
├── shippo.ts          # Shippo implementation
└── routes.ts          # API routes for shipping config + label creation
```

### Interface

```ts
interface ShippingProvider {
  name: string;
  validateCredentials(apiKey: string): Promise<boolean>;
  getCarriers(apiKey: string): Promise<Carrier[]>;
  getServices(apiKey: string, carrierId: string): Promise<Service[]>;
  createShipment(apiKey: string, params: CreateShipmentParams): Promise<ShipmentResult>;
  getLabel(apiKey: string, shipmentId: string): Promise<LabelResult>;
  getTracking(apiKey: string, carrier: string, trackingNumber: string): Promise<TrackingResult>;
}

interface Carrier {
  id: string;        // "dpd", "dhl_express"
  name: string;      // "DPD", "DHL Express"
}

interface Service {
  id: string;        // "dpd_classic", "dhl_express_worldwide"
  name: string;      // "DPD Classic", "DHL Express Worldwide"
  carrierId: string;
}

interface CreateShipmentParams {
  fromAddress: Address;
  toAddress: Address;
  parcel: { weight: number; length: number; width: number; height: number };
  carrierId: string;
  serviceId: string;
}

interface ShipmentResult {
  shipmentId: string;
  trackingNumber: string;
  labelUrl: string;        // PDF URL
  trackingUrl: string;
  rate: { amount: number; currency: string };
}
```

### New API Routes

```
GET    /api/v1/shipping-config/providers       — list available providers
POST   /api/v1/shipping-config/validate        — test API key
GET    /api/v1/shipping-config/carriers        — get carriers from provider
GET    /api/v1/shipping-config/services/:carrier — get services for carrier
GET    /api/v1/shipping-config/mappings        — get store's shipping mappings
PUT    /api/v1/shipping-config/mappings        — save shipping mappings
POST   /api/v1/shipping/label                  — create label for an order
```

### Label Printing Flow

1. Packer clicks "Print Label" on order/shipment
2. Frontend: `POST /api/v1/shipping/label { orderId }`
3. Backend: looks up order → finds `shippingMethod` → looks up `ShippingMapping` → gets provider carrier/service
4. Backend: calls provider adapter → creates shipment + generates label PDF
5. Backend: updates `Shipment` record with tracking number, label URL, tracking URL
6. Backend: returns label PDF URL
7. Frontend: opens PDF in new tab → triggers browser print dialog
8. If `autoStatusPush` is on, pushes updated status to WooCommerce

---

## WooCommerce Sync Updates

### Order sync changes

During order sync (`backend/src/woocommerce/sync.ts`), additionally extract and store:
- `order.payment_method` → `paymentMethod`
- `order.payment_method_title` → `paymentMethodTitle`
- `order.shipping_lines[0].method_id` + instance suffix → `shippingMethod`
- `order.shipping_lines[0].method_title` → `shippingMethodTitle`
- Derive `isPaid` from tenant's payment method config

### New WooCommerce fetch functions

```ts
async function fetchShippingMethods(woo: WooCommerceAPI): Promise<WooShippingMethod[]>
async function fetchPaymentGateways(woo: WooCommerceAPI): Promise<WooPaymentGateway[]>
async function fetchOrderStatuses(woo: WooCommerceAPI): Promise<WooOrderStatus[]>
async function pushOrderStatus(woo: WooCommerceAPI, wooOrderId: number, status: string): Promise<void>
```

### Status push-back

When the app transitions an order status and `autoStatusPush` is enabled:
1. Look up `statusMapping` in tenant settings
2. If mapping exists for the new status, call `pushOrderStatus()` to update WooCommerce

---

## Files Summary

| Area | Files | Changes |
|------|-------|---------|
| **Schema** | `backend/prisma/schema.prisma` | Add Order fields, ShippingMapping model, Store fields |
| **Migration** | `backend/prisma/migrations/` | New migration for all schema changes |
| **Sync** | `backend/src/woocommerce/sync.ts` | Extract payment + shipping data from orders |
| **WooCommerce** | `backend/src/woocommerce/fetch.ts` (new) | Fetch shipping methods, payment gateways, statuses |
| **WooCommerce** | `backend/src/woocommerce/push.ts` (new) | Push order status back to WooCommerce |
| **Shipping adapter** | `backend/src/shipping/types.ts` (new) | Provider interface + types |
| **Shipping adapter** | `backend/src/shipping/registry.ts` (new) | Provider registry |
| **Shipping adapter** | `backend/src/shipping/shippo.ts` (new) | Shippo implementation |
| **Shipping routes** | `backend/src/shipping/routes.ts` (new) | Config + label API routes |
| **Orders route** | `backend/src/routes/orders.ts` | Change ID lookup to orderNumber |
| **Onboarding** | `frontend/src/pages/onboarding/StoreConfig.tsx` (new) | New onboarding step 3 |
| **Onboarding** | `frontend/src/pages/onboarding/ConnectStore.tsx` | Navigate to store-config |
| **Onboarding** | `frontend/src/pages/onboarding/WarehouseSetup.tsx` | Update step indicators |
| **App** | `frontend/src/App.tsx` | Add store-config route, update order route |
| **Settings** | `frontend/src/pages/settings/ShippingSection.tsx` (new) | Shipping provider + mapping UI |
| **Settings** | `frontend/src/pages/settings/PaymentSection.tsx` (new) | Payment method config UI |
| **Settings** | `frontend/src/pages/settings/StatusMappingSection.tsx` (new) | Status mapping UI |
| **Settings** | `frontend/src/pages/settings/SettingsPage.tsx` | Add new settings sections |
| **Orders** | `frontend/src/pages/Orders.tsx` | Update order links to use orderNumber |
| **Orders** | `frontend/src/pages/OrderDetail.tsx` | Update ID usage |
| **Types** | `frontend/src/types/index.ts` | Add new fields to Order type |
| **Package** | `backend/package.json` | Add `shippo` SDK dependency |
