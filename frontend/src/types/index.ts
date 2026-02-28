// JWT token payload (decoded from localStorage)
export interface TokenPayload {
  id: number;
  tenantId: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PICKER';
  name: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  iat: number;
  exp: number;
}

// API response wrappers
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Domain models
export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  tenantId: number;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Store {
  id: number;
  name: string;
  url: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncOrders: boolean;
  syncProducts: boolean;
  syncInventory: boolean;
  autoSync: boolean;
  syncIntervalMin: number;
  orderStatusFilter: string[];
  syncDaysBack: number;
  syncSinceDate: string | null;
  createdAt: string;
  _count?: { orders: number; products: number };
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PICK'
  | 'PICKING'
  | 'PICKED'
  | 'PACKING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'ON_HOLD';

export interface OrderItem {
  id: number;
  sku: string | null;
  name: string;
  quantity: number;
  pickedQty: number;
  price: string;
  product?: Product;
}

export interface Order {
  id: number;
  wooId: number;
  orderNumber: string;
  status: OrderStatus;
  wooStatus: string;
  customerName: string;
  customerEmail: string;
  total: string;
  currency: string;
  wooCreatedAt: string;
  items: OrderItem[];
  _count?: { shipments: number };
  store?: Store;
}

export interface Product {
  id: number;
  sku: string | null;
  name: string;
  stockQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  isActive: boolean;
  stockLocations?: StockLocation[];
}

export interface StockLocation {
  id: number;
  quantity: number;
  bin?: Bin;
}

export interface Bin {
  id: number;
  label: string;
  row: string | null;
  shelf: string | null;
  position: string | null;
  zone?: Zone;
}

export interface Zone {
  id: number;
  name: string;
  type: string;
  description: string | null;
  bins?: Bin[];
}

export interface Warehouse {
  id: number;
  name: string;
  address: string | null;
  isDefault: boolean;
  zones?: Zone[];
}

export type PickStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PickListItem {
  id: number;
  sku: string;
  productName: string;
  binLabel: string;
  quantity: number;
  pickedQty: number;
  isPicked: boolean;
}

export interface PickList {
  id: number;
  status: PickStatus;
  assignedTo: string | null;
  order?: Order;
  items?: PickListItem[];
  createdAt: string;
}

export type ShipmentStatus = 'PENDING' | 'LABEL_CREATED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface Shipment {
  id: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  order?: Order;
}

export interface InventoryStats {
  inStock: number;
  reserved: number;
  incoming: number;
  freeToSell: number;
}

export type POStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: number;
  sku: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: string | null;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: string;
  status: POStatus;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  items?: PurchaseOrderItem[];
  createdAt: string;
}
