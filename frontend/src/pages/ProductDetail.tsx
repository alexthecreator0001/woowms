import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  MapPin,
  ArrowUpDown,
  Scale,
  Tag,
  Store,
  AlertTriangle,
  Lock,
  CircleCheck,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Hash,
  RefreshCw,
  Check,
  ChevronDown,
  CloudUpload,
  ShoppingCart,
  ClipboardList,
  Settings,
  Pencil,
  X,
  Plus,
  ExternalLink,
  Truck,
  Barcode,
  Link2,
  Star,
  Copy,
  Boxes,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { proxyUrl } from '../lib/image';
import { getStatusStyle } from '../lib/statuses';
import api from '../services/api';
import Pagination from '../components/Pagination';
import type {
  ProductDetail as ProductDetailType,
  StockMovement,
  Order,
  PurchaseOrder,
  PaginationMeta,
  ProductBarcode,
  SupplierProduct,
  BundleItem,
} from '../types';

// ─── Constants ────────────────────────────────────────

type TabKey = 'overview' | 'orders' | 'purchase-orders' | 'stock-history' | 'bundle' | 'settings';

const TABS: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: 'overview', label: 'Overview', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
  { key: 'stock-history', label: 'Stock History', icon: ArrowUpDown },
  { key: 'bundle', label: 'Bundle', icon: Boxes },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const movementTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  PICKED: { label: 'Picked', bg: 'bg-violet-500/10', text: 'text-violet-600' },
  TRANSFERRED: { label: 'Transferred', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  ADJUSTED: { label: 'Adjusted', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  RETURNED: { label: 'Returned', bg: 'bg-orange-500/10', text: 'text-orange-600' },
  DAMAGED: { label: 'Damaged', bg: 'bg-red-500/10', text: 'text-red-600' },
};

const poStatusStyles: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-500/10', text: 'text-gray-500' },
  ORDERED: { label: 'Ordered', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  PARTIALLY_RECEIVED: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  RECEIVED: { label: 'Received', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600' },
};

const OOS_OPTIONS = [
  { value: 'show_sold_out', label: 'Show as sold out (no purchase)' },
  { value: 'hide', label: 'Hide product from store' },
  { value: 'allow_backorders', label: 'Allow backorders silently' },
  { value: 'allow_backorders_notify', label: 'Allow backorders (notify customer)' },
];

// ─── Component ────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core state
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    description: '',
    price: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    lowStockThreshold: 5,
    packageQty: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Orders tab
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersMeta, setOrdersMeta] = useState<PaginationMeta | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // PO tab
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [posMeta, setPosMeta] = useState<PaginationMeta | null>(null);
  const [posPage, setPosPage] = useState(1);
  const [posLoading, setPosLoading] = useState(false);

  // Stock history tab
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsMeta, setMovementsMeta] = useState<PaginationMeta | null>(null);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Sync settings tab
  const [syncOverride, setSyncOverride] = useState(false);
  const [syncPushEnabled, setSyncPushEnabled] = useState(true);
  const [syncBehavior, setSyncBehavior] = useState('');
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncPushing, setSyncPushing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [pushResult, setPushResult] = useState<{ stockQuantity: number; stockStatus: string } | null>(null);

  // Incoming stock
  const [incoming, setIncoming] = useState(0);
  const [incomingPOs, setIncomingPOs] = useState<Array<{ id: number; poNumber: string; supplier: string; expectedDate: string | null; incoming: number }>>([]);

  // Barcodes
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
  const [newBarcode, setNewBarcode] = useState('');
  const [newBarcodeType, setNewBarcodeType] = useState('EAN13');
  const [barcodeAdding, setBarcodeAdding] = useState(false);

  // Bundle
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [bundleSearch, setBundleSearch] = useState('');
  const [bundleSearchResults, setBundleSearchResults] = useState<Array<{ id: number; name: string; sku: string | null }>>([]);
  const [bundleAdding, setBundleAdding] = useState(false);

  // ─── Data loading ─────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    api.get(`/inventory/${id}`)
      .then(({ data }) => {
        const p = data.data;
        setProduct(p);
        setEditFields({
          description: p.description || '',
          price: String(p.price),
          weight: p.weight ? String(p.weight) : '',
          length: p.length ? String(p.length) : '',
          width: p.width ? String(p.width) : '',
          height: p.height ? String(p.height) : '',
          lowStockThreshold: p.lowStockThreshold,
          packageQty: p.packageQty ? String(p.packageQty) : '',
        });
        setBarcodes(p.barcodes || []);
        setBundleItems(p.bundleComponents || []);
      })
      .catch(() => navigate('/inventory'))
      .finally(() => setLoading(false));

    api.get(`/inventory/${id}/sync-settings`)
      .then(({ data }) => {
        const s = data.data || {};
        const hasOverride = s.pushEnabled !== undefined || s.outOfStockBehavior !== undefined;
        setSyncOverride(hasOverride);
        if (s.pushEnabled !== undefined) setSyncPushEnabled(s.pushEnabled);
        if (s.outOfStockBehavior) setSyncBehavior(s.outOfStockBehavior);
      })
      .catch(() => {});
  }, [id]);

  // Load incoming stock
  useEffect(() => {
    if (!id) return;
    api.get(`/inventory/${id}/incoming`)
      .then(({ data }) => {
        setIncoming(data.data.incoming || 0);
        setIncomingPOs(data.data.purchaseOrders || []);
      })
      .catch(() => {});
  }, [id]);

  const loadOrders = useCallback((page: number) => {
    if (!id) return;
    setOrdersLoading(true);
    api.get(`/inventory/${id}/orders?page=${page}&limit=10`)
      .then(({ data }) => { setOrders(data.data); setOrdersMeta(data.meta); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [id]);

  const loadPOs = useCallback((page: number) => {
    if (!id) return;
    setPosLoading(true);
    api.get(`/inventory/${id}/purchase-orders?page=${page}&limit=10`)
      .then(({ data }) => { setPos(data.data); setPosMeta(data.meta); })
      .catch(() => {})
      .finally(() => setPosLoading(false));
  }, [id]);

  const loadMovements = useCallback((page: number) => {
    if (!id) return;
    setMovementsLoading(true);
    api.get(`/inventory/${id}/stock-movements?page=${page}&limit=20`)
      .then(({ data }) => { setMovements(data.data); setMovementsMeta(data.meta); })
      .catch(() => {})
      .finally(() => setMovementsLoading(false));
  }, [id]);

  // Load tab data on tab switch
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0 && !ordersLoading) loadOrders(1);
    if (activeTab === 'purchase-orders' && pos.length === 0 && !posLoading) loadPOs(1);
    if (activeTab === 'stock-history' && movements.length === 0 && !movementsLoading) loadMovements(1);
  }, [activeTab]);

  // ─── Handlers ─────────────────────────────────────────

  const handleSaveProduct = async () => {
    if (!id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload: Record<string, unknown> = { ...editFields };
      if (editFields.packageQty) {
        payload.packageQty = parseInt(editFields.packageQty) || null;
      } else {
        payload.packageQty = null;
      }
      const { data } = await api.patch(`/inventory/${id}`, payload);
      setProduct(data.data);
      setBarcodes(data.data.barcodes || []);
      setEditing(false);
      setSaveMsg('Product updated');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveMsg(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncSave = async () => {
    if (!id) return;
    setSyncSaving(true);
    setSyncMsg('');
    try {
      const payload: Record<string, unknown> = { pushEnabled: syncPushEnabled };
      if (syncBehavior) payload.outOfStockBehavior = syncBehavior;
      await api.patch(`/inventory/${id}/sync-settings`, payload);
      setSyncMsg('Sync settings saved');
      setTimeout(() => setSyncMsg(''), 3000);
    } catch {
      setSyncMsg('Failed to save');
    } finally {
      setSyncSaving(false);
    }
  };

  const handlePushStock = async () => {
    if (!id) return;
    setSyncPushing(true);
    setPushResult(null);
    try {
      const { data } = await api.post(`/inventory/${id}/push-stock`);
      setPushResult({ stockQuantity: data.data.stockQuantity, stockStatus: data.data.stockStatus });
      setTimeout(() => setPushResult(null), 5000);
    } catch {
      setSyncMsg('Push failed');
      setTimeout(() => setSyncMsg(''), 3000);
    } finally {
      setSyncPushing(false);
    }
  };

  const handleAddBarcode = async () => {
    if (!id || !newBarcode.trim()) return;
    setBarcodeAdding(true);
    try {
      await api.post(`/inventory/${id}/barcodes`, { barcode: newBarcode.trim(), type: newBarcodeType });
      const { data } = await api.get(`/inventory/${id}/barcodes`);
      setBarcodes(data.data);
      setNewBarcode('');
    } catch { /* ignore */ }
    finally { setBarcodeAdding(false); }
  };

  const handleDeleteBarcode = async (barcodeId: number) => {
    if (!id) return;
    try {
      await api.delete(`/inventory/${id}/barcodes/${barcodeId}`);
      setBarcodes((prev) => prev.filter((b) => b.id !== barcodeId));
    } catch { /* ignore */ }
  };

  const handleSetPrimaryBarcode = async (barcodeId: number) => {
    if (!id) return;
    try {
      await api.patch(`/inventory/${id}/barcodes/${barcodeId}`, { isPrimary: true });
      setBarcodes((prev) => prev.map((b) => ({ ...b, isPrimary: b.id === barcodeId })));
    } catch { /* ignore */ }
  };

  const handleAddBundleComponent = async (componentProductId: number) => {
    if (!id) return;
    setBundleAdding(true);
    try {
      await api.post(`/inventory/${id}/bundle`, { componentProductId, quantity: 1 });
      const { data } = await api.get(`/inventory/${id}/bundle`);
      setBundleItems(data.data);
      setBundleSearch('');
      setBundleSearchResults([]);
      // Ensure product is marked as bundle
      setProduct((prev) => prev ? { ...prev, isBundle: true } : prev);
    } catch { /* ignore */ }
    finally { setBundleAdding(false); }
  };

  const handleRemoveBundleItem = async (itemId: number) => {
    if (!id) return;
    try {
      await api.delete(`/inventory/${id}/bundle/${itemId}`);
      setBundleItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch { /* ignore */ }
  };

  const handleUpdateBundleQty = async (itemId: number, quantity: number) => {
    if (!id || quantity < 1) return;
    try {
      await api.patch(`/inventory/${id}/bundle/${itemId}`, { quantity });
      setBundleItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity } : i));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!bundleSearch || bundleSearch.length < 2) { setBundleSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/inventory', { params: { search: bundleSearch, limit: 6 } });
        setBundleSearchResults(data.data.filter((p: any) => p.id !== parseInt(id || '0')));
      } catch { setBundleSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [bundleSearch, id]);

  // ─── Render ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) return null;

  const available = product.stockQty - product.reservedQty;
  const isLow = available <= product.lowStockThreshold;

  const stockCards = [
    { label: 'In Stock', value: product.stockQty, icon: Package, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { label: 'Reserved', value: product.reservedQty, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Available', value: available, icon: CircleCheck, color: isLow ? 'text-red-500' : 'text-emerald-600', bg: isLow ? 'bg-red-500/10' : 'bg-emerald-500/10', border: isLow ? 'border-red-500/20' : 'border-emerald-500/20' },
    { label: 'Incoming', value: incoming, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Low Threshold', value: product.lowStockThreshold, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/inventory')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </button>

        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-5">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {product.imageUrl ? (
                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-sm">
                  <img src={proxyUrl(product.imageUrl, 160)!} alt={product.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 shadow-sm">
                  <ImageIcon className="h-7 w-7 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Title + Meta */}
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight leading-tight">{product.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {product.sku && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {product.sku}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                  <Tag className="h-3 w-3" />
                  {product.currency} {product.price}
                </span>
                {product.store && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Store className="h-3 w-3" />
                    {product.store.name}
                  </span>
                )}
                {!product.isActive && (
                  <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">Inactive</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium shadow-sm transition-all hover:bg-muted/60"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              onClick={() => navigate('/receiving/new')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium shadow-sm transition-all hover:bg-muted/60"
            >
              <Plus className="h-3.5 w-3.5" />
              Create PO
            </button>
            <button
              onClick={handlePushStock}
              disabled={syncPushing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {syncPushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              Push to WooCommerce
            </button>
          </div>
        </div>

        {/* Push result feedback */}
        {pushResult && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Pushed qty {pushResult.stockQuantity}, status: {pushResult.stockStatus}
          </p>
        )}
        {saveMsg && (
          <p className={cn('mt-2 text-xs', saveMsg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>{saveMsg}</p>
        )}
      </div>

      {/* ─── Stock Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stockCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={cn('rounded-xl border p-4 shadow-sm', card.border)}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', card.bg)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </div>
              <p className={cn('mt-1 text-2xl font-bold tracking-tight', card.color)}>
                {card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* ─── Tab Bar ─────────────────────────────────────── */}
      <div className="border-b border-border/60">
        <div className="flex gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.key === 'orders' && ordersMeta && ordersMeta.total > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{ordersMeta.total}</span>
                )}
                {tab.key === 'purchase-orders' && posMeta && posMeta.total > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{posMeta.total}</span>
                )}
                {tab.key === 'stock-history' && movementsMeta && movementsMeta.total > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{movementsMeta.total}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Content ─────────────────────────────────── */}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Info (Editable) */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4 text-muted-foreground" />
                Product Information
              </h3>
              {editing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="divide-y divide-border/40 px-6">
              {/* Description */}
              <div className="py-3.5">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
                {editing ? (
                  <textarea
                    value={editFields.description}
                    onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.description ? (
                      <span dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <span className="italic">No description</span>
                    )}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Price</span>
                {editing ? (
                  <input
                    type="text"
                    value={editFields.price}
                    onChange={(e) => setEditFields({ ...editFields, price: e.target.value })}
                    className="h-8 w-28 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-semibold">{product.currency} {product.price}</span>
                )}
              </div>

              {/* Weight + Dimensions */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Scale className="h-3.5 w-3.5" />
                  Weight / Dimensions
                </span>
                {editing ? (
                  <div className="flex items-center gap-1.5">
                    <input type="text" placeholder="kg" value={editFields.weight} onChange={(e) => setEditFields({ ...editFields, weight: e.target.value })} className="h-8 w-16 rounded-lg border border-border/60 bg-background px-2 text-center text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <span className="text-xs text-muted-foreground">kg</span>
                    <input type="text" placeholder="L" value={editFields.length} onChange={(e) => setEditFields({ ...editFields, length: e.target.value })} className="h-8 w-12 rounded-lg border border-border/60 bg-background px-1.5 text-center text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <span className="text-xs text-muted-foreground">x</span>
                    <input type="text" placeholder="W" value={editFields.width} onChange={(e) => setEditFields({ ...editFields, width: e.target.value })} className="h-8 w-12 rounded-lg border border-border/60 bg-background px-1.5 text-center text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <span className="text-xs text-muted-foreground">x</span>
                    <input type="text" placeholder="H" value={editFields.height} onChange={(e) => setEditFields({ ...editFields, height: e.target.value })} className="h-8 w-12 rounded-lg border border-border/60 bg-background px-1.5 text-center text-xs shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    <span className="text-xs text-muted-foreground">cm</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium">
                    {[
                      product.weight && `${product.weight} kg`,
                      product.length && `${product.length} × ${product.width} × ${product.height} cm`,
                    ].filter(Boolean).join(' · ') || '—'}
                  </span>
                )}
              </div>

              {/* Low stock threshold */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Low Stock Threshold
                </span>
                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={editFields.lowStockThreshold}
                    onChange={(e) => setEditFields({ ...editFields, lowStockThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-8 w-20 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-semibold text-red-500">{product.lowStockThreshold}</span>
                )}
              </div>

              {/* Package Qty */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5" />
                  Package Qty
                </span>
                {editing ? (
                  <input
                    type="number"
                    min={1}
                    value={editFields.packageQty}
                    onChange={(e) => setEditFields({ ...editFields, packageQty: e.target.value })}
                    placeholder="e.g. 20"
                    className="h-8 w-20 rounded-lg border border-border/60 bg-background px-2 text-right text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {product.packageQty ? `${product.packageQty} units/pack` : '—'}
                  </span>
                )}
              </div>

              {/* Last updated */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Last Updated
                </span>
                <span className="text-sm font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Warehouse Locations */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Warehouse Locations
                {product.stockLocations && product.stockLocations.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {product.stockLocations.length}
                  </span>
                )}
              </h3>
            </div>
            <div className="p-4">
              {product.stockLocations && product.stockLocations.length > 0 ? (
                <div className="space-y-2">
                  {product.stockLocations.map((sl) => (
                    <div
                      key={sl.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{sl.bin?.label}</p>
                          {sl.bin?.zone && (
                            <p className="text-[11px] text-muted-foreground">{sl.bin.zone.name} · {sl.bin.zone.type}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{sl.quantity}</p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MapPin className="mx-auto mb-2 h-7 w-7 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No locations assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Incoming Stock */}
        {incomingPOs.length > 0 && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 shadow-sm">
            <div className="border-b border-blue-500/20 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Truck className="h-4 w-4" />
                Incoming Stock
                <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold">{incoming} units</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-500/10">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-blue-600/70">PO Number</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-blue-600/70">Supplier</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-blue-600/70">Incoming Qty</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-blue-600/70">Expected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/10">
                  {incomingPOs.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => navigate(`/receiving/${po.id}`)}
                      className="cursor-pointer transition-colors hover:bg-blue-500/5"
                    >
                      <td className="px-6 py-2.5 text-sm font-semibold text-blue-700">{po.poNumber}</td>
                      <td className="px-6 py-2.5 text-sm text-muted-foreground">{po.supplier}</td>
                      <td className="px-6 py-2.5 text-right text-sm font-bold text-blue-600">+{po.incoming}</td>
                      <td className="px-6 py-2.5 text-right text-sm text-muted-foreground">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Barcodes + Supplier SKUs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Barcodes / EAN */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Barcode className="h-4 w-4 text-muted-foreground" />
                Barcodes / EAN
                {barcodes.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{barcodes.length}</span>
                )}
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {barcodes.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSetPrimaryBarcode(b.id)} title={b.isPrimary ? 'Primary barcode' : 'Set as primary'}>
                      <Star className={cn('h-3.5 w-3.5', b.isPrimary ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400')} />
                    </button>
                    <code className="text-sm font-medium">{b.barcode}</code>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{b.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigator.clipboard.writeText(b.barcode)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteBarcode(b.id)}
                      className="p-1 text-muted-foreground hover:text-red-500"
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {/* Add barcode inline */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Enter barcode..."
                  className="h-8 flex-1 rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBarcode()}
                />
                <select
                  value={newBarcodeType}
                  onChange={(e) => setNewBarcodeType(e.target.value)}
                  className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs shadow-sm"
                >
                  <option value="EAN13">EAN13</option>
                  <option value="UPC">UPC</option>
                  <option value="CODE128">CODE128</option>
                  <option value="CUSTOM">Custom</option>
                </select>
                <button
                  onClick={handleAddBarcode}
                  disabled={barcodeAdding || !newBarcode.trim()}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {barcodeAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Supplier SKUs */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Supplier SKUs
                {product.supplierProducts && product.supplierProducts.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{product.supplierProducts.length}</span>
                )}
              </h3>
            </div>
            <div className="p-4">
              {product.supplierProducts && product.supplierProducts.length > 0 ? (
                <div className="space-y-2">
                  {product.supplierProducts.map((sp: SupplierProduct) => (
                    <div key={sp.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                      <div>
                        <button
                          onClick={() => sp.supplier && navigate(`/suppliers/${sp.supplier.id}`)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {sp.supplier?.name || `Supplier #${sp.supplierId}`}
                        </button>
                        <p className="text-[11px] text-muted-foreground">SKU: {sp.supplierSku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{sp.supplierPrice ? `$${parseFloat(sp.supplierPrice).toFixed(2)}` : '—'}</p>
                        {sp.leadTimeDays && <p className="text-[10px] text-muted-foreground">{sp.leadTimeDays}d lead</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Link2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground">No supplier mappings</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-3.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Orders containing this product
            </h3>
          </div>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length > 0 ? (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {orders.map((order) => {
                    const st = getStatusStyle(order.status);
                    const itemQty = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-primary hover:bg-primary/[0.02]"
                      >
                        <td className="px-6 py-3 text-sm font-semibold">#{order.orderNumber}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{order.customerName}</td>
                        <td className="px-6 py-3 text-right text-sm font-medium">{itemQty}</td>
                        <td className="px-6 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', st.bg, st.text)}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium">{order.currency} {order.total}</td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                          {new Date(order.wooCreatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {ordersMeta && ordersMeta.pages > 1 && (
                <div className="border-t border-border/40 px-6 py-3">
                  <Pagination meta={ordersMeta} onPageChange={(p) => { setOrdersPage(p); loadOrders(p); }} />
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-2 h-7 w-7 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No orders found for this product</p>
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'purchase-orders' && (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Purchase Orders for {product.sku || 'this product'}
            </h3>
            <button
              onClick={() => navigate('/receiving/new')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Create PO
            </button>
          </div>
          {posLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : pos.length > 0 ? (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO Number</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordered</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Received</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {pos.map((po) => {
                    const pst = poStatusStyles[po.status] || poStatusStyles.DRAFT;
                    const orderedQty = po.items?.reduce((s, i) => s + i.orderedQty, 0) || 0;
                    const receivedQty = po.items?.reduce((s, i) => s + i.receivedQty, 0) || 0;
                    return (
                      <tr
                        key={po.id}
                        onClick={() => navigate(`/receiving/${po.id}`)}
                        className="cursor-pointer border-l-4 border-l-transparent transition-all hover:border-l-amber-500 hover:bg-amber-500/[0.02]"
                      >
                        <td className="px-6 py-3 text-sm font-semibold">{po.poNumber}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{po.supplier}</td>
                        <td className="px-6 py-3 text-right text-sm font-medium">{orderedQty}</td>
                        <td className="px-6 py-3 text-right text-sm font-medium">{receivedQty}</td>
                        <td className="px-6 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', pst.bg, pst.text)}>
                            {pst.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                          {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {posMeta && posMeta.pages > 1 && (
                <div className="border-t border-border/40 px-6 py-3">
                  <Pagination meta={posMeta} onPageChange={(p) => { setPosPage(p); loadPOs(p); }} />
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto mb-2 h-7 w-7 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {product.sku ? 'No purchase orders found for this SKU' : 'Product has no SKU — cannot match purchase orders'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stock History Tab */}
      {activeTab === 'stock-history' && (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-3.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              Stock Movement History
              {movementsMeta && movementsMeta.total > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {movementsMeta.total}
                </span>
              )}
            </h3>
          </div>
          {movementsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : movements.length > 0 ? (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason / Reference</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {movements.map((m) => {
                    const mt = movementTypeConfig[m.type] || { label: m.type, bg: 'bg-gray-500/10', text: 'text-gray-500' };
                    return (
                      <tr key={m.id} className="border-l-4 border-l-transparent transition-all hover:border-l-emerald-500 hover:bg-emerald-500/[0.02]">
                        <td className="px-6 py-2.5">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', mt.bg, mt.text)}>
                            {mt.label}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <span className={cn('text-sm font-bold', m.quantity > 0 ? 'text-emerald-600' : 'text-red-500')}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-sm text-muted-foreground">{m.fromBin || '—'}</td>
                        <td className="px-6 py-2.5 text-sm text-muted-foreground">{m.toBin || '—'}</td>
                        <td className="px-6 py-2.5 text-sm text-muted-foreground">
                          {m.reason || m.reference || '—'}
                          {m.reference && m.reference.startsWith('PO-') && (
                            <button
                              onClick={() => navigate(`/receiving/${m.reference!.replace('PO-', '')}`)}
                              className="ml-1.5 inline-flex items-center gap-0.5 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-2.5 text-right text-sm text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {movementsMeta && movementsMeta.pages > 1 && (
                <div className="border-t border-border/40 px-6 py-3">
                  <Pagination meta={movementsMeta} onPageChange={(p) => { setMovementsPage(p); loadMovements(p); }} />
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <ArrowUpDown className="mx-auto mb-2 h-7 w-7 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No stock movements yet</p>
            </div>
          )}
        </div>
      )}

      {/* Bundle Tab */}
      {activeTab === 'bundle' && (
        <div className="space-y-6">
          {/* Available Bundles metric */}
          {bundleItems.length > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600">Available Bundles</p>
                  <p className="mt-1 text-3xl font-bold text-violet-700">
                    {Math.min(...bundleItems.map((i) => {
                      const avail = (i.componentProduct?.stockQty || 0) - (i.componentProduct?.reservedQty || 0);
                      return Math.floor(avail / i.quantity);
                    }))}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <Boxes className="h-5 w-5 text-violet-600" />
                </div>
              </div>
            </div>
          )}

          {/* Bundle toggle */}
          {!product.isBundle && bundleItems.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-6 text-center shadow-sm">
              <Boxes className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="mb-1 text-sm font-medium">This product is not a bundle</p>
              <p className="mb-4 text-xs text-muted-foreground">Add components to automatically mark it as a bundle product.</p>
            </div>
          )}

          {/* Components table */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Boxes className="h-4 w-4 text-muted-foreground" />
                Bundle Components
                {bundleItems.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{bundleItems.length}</span>
                )}
              </h3>
            </div>
            <div className="p-4">
              {bundleItems.length > 0 && (
                <div className="mb-4 space-y-2">
                  {bundleItems.map((item) => {
                    const cp = item.componentProduct;
                    const available = (cp?.stockQty || 0) - (cp?.reservedQty || 0);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <button onClick={() => cp && navigate(`/inventory/${cp.id}`)} className="text-sm font-medium text-primary hover:underline">
                            {cp?.name || `Product #${item.componentProductId}`}
                          </button>
                          {cp?.sku && <code className="text-[11px] text-muted-foreground">{cp.sku}</code>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{available} avail</span>
                          <span className="text-xs text-muted-foreground">x</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateBundleQty(item.id, parseInt(e.target.value) || 1)}
                            className="h-7 w-14 rounded border border-border/60 bg-background px-1.5 text-center text-sm font-medium shadow-sm focus:border-primary focus:outline-none"
                          />
                          <button onClick={() => handleRemoveBundleItem(item.id)} className="p-1 text-muted-foreground hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add component search */}
              <div className="relative">
                <input
                  type="text"
                  value={bundleSearch}
                  onChange={(e) => setBundleSearch(e.target.value)}
                  placeholder="Search product to add as component..."
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {bundleAdding && <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
                {bundleSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card shadow-lg">
                    {bundleSearchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAddBundleComponent(p.id)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                      >
                        <span className="font-medium">{p.name}</span>
                        {p.sku && <span className="text-xs text-muted-foreground">{p.sku}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CloudUpload className="h-4 w-4 text-muted-foreground" />
                WooCommerce Sync
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Override toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !syncOverride;
                  setSyncOverride(next);
                  if (!next) {
                    setSyncSaving(true);
                    api.patch(`/inventory/${id}/sync-settings`, {}).then(() => {
                      setSyncMsg('Overrides cleared');
                      setTimeout(() => setSyncMsg(''), 3000);
                    }).catch(() => {}).finally(() => setSyncSaving(false));
                  }
                }}
                className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium">Override global sync settings</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {syncOverride ? 'Using per-product settings' : 'Using global defaults'}
                  </p>
                </div>
                <div className={cn('flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors', syncOverride ? 'bg-primary' : 'bg-border')}>
                  <div className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition-transform', syncOverride ? 'translate-x-5' : 'translate-x-0')} />
                </div>
              </button>

              {syncOverride && (
                <div className="space-y-4 rounded-lg border border-border/40 bg-muted/10 p-4">
                  {/* Push enabled */}
                  <button
                    type="button"
                    onClick={() => setSyncPushEnabled(!syncPushEnabled)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <p className="text-sm font-medium">Push stock for this product</p>
                    <div className={cn('flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors', syncPushEnabled ? 'bg-primary' : 'bg-border')}>
                      <div className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition-transform', syncPushEnabled ? 'translate-x-5' : 'translate-x-0')} />
                    </div>
                  </button>

                  {/* Out-of-stock behavior */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Out-of-stock behavior</label>
                    <div className="relative">
                      <select
                        value={syncBehavior}
                        onChange={(e) => setSyncBehavior(e.target.value)}
                        className="h-9 w-full appearance-none rounded-lg border border-border/60 bg-background px-3 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Use global default</option>
                        {OOS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <button
                    onClick={handleSyncSave}
                    disabled={syncSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {syncSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save Sync Settings
                  </button>
                </div>
              )}

              {/* Manual push */}
              <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                <button
                  onClick={handlePushStock}
                  disabled={syncPushing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-muted/60 disabled:opacity-50"
                >
                  {syncPushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Push stock now
                </button>
                {pushResult && (
                  <span className="text-xs text-emerald-600">
                    Pushed qty {pushResult.stockQuantity}, status: {pushResult.stockStatus}
                  </span>
                )}
              </div>

              {syncMsg && (
                <p className={cn('text-xs', syncMsg.includes('Failed') || syncMsg.includes('failed') ? 'text-destructive' : 'text-emerald-600')}>
                  {syncMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
