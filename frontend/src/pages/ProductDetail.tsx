import { useEffect, useState, useCallback, useRef } from 'react';
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
import ProductSearchDropdown from '../components/ProductSearchDropdown';
import FloorPlanMini from '../components/warehouse/FloorPlanMini';
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef('');

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
  const [bundleAdding, setBundleAdding] = useState(false);

  // Supplier SKU add form
  const [suppliersList, setSuppliersList] = useState<Array<{ id: number; name: string }>>([]);
  const [spAddOpen, setSpAddOpen] = useState(false);
  const [spForm, setSpForm] = useState({ supplierId: 0, supplierSku: '', supplierPrice: '', leadTimeDays: '' });
  const [spAdding, setSpAdding] = useState(false);

  // Unit system
  const [weightUnit, setWeightUnit] = useState('kg');
  const [dimUnit, setDimUnit] = useState('cm');

  // Assign bin
  const [assignOpen, setAssignOpen] = useState(false);
  const [allBins, setAllBins] = useState<Array<{ id: number; label: string; zoneName: string }>>([]);
  const [assignBinId, setAssignBinId] = useState(0);
  const [assignQty, setAssignQty] = useState('1');
  const [assigning, setAssigning] = useState(false);

  // ─── Data loading ─────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    api.get(`/inventory/${id}`)
      .then(({ data }) => {
        const p = data.data;
        setProduct(p);
        const fields = {
          description: p.description || '',
          price: String(p.price),
          weight: p.weight ? String(p.weight) : '',
          length: p.length ? String(p.length) : '',
          width: p.width ? String(p.width) : '',
          height: p.height ? String(p.height) : '',
          lowStockThreshold: p.lowStockThreshold,
          packageQty: p.packageQty ? String(p.packageQty) : '',
        };
        setEditFields(fields);
        lastSavedRef.current = JSON.stringify(fields);
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

  // Load suppliers list (for supplier SKU add form)
  useEffect(() => {
    api.get('/suppliers', { params: { limit: 200 } })
      .then(({ data }) => setSuppliersList((data.data || []).map((s: { id: number; name: string }) => ({ id: s.id, name: s.name }))))
      .catch(() => {});
  }, []);

  // Load tenant unit system
  useEffect(() => {
    api.get('/account/tenant-settings')
      .then(({ data }) => {
        const s = data.data || {};
        if (s.unitSystem === 'imperial') {
          setWeightUnit('lb');
          setDimUnit('in');
        }
      })
      .catch(() => {});
  }, []);

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

  const doSave = useCallback(async (fields: typeof editFields) => {
    if (!id) return;
    const fingerprint = JSON.stringify(fields);
    if (fingerprint === lastSavedRef.current) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload: Record<string, unknown> = { ...fields };
      if (fields.packageQty) {
        payload.packageQty = parseInt(fields.packageQty) || null;
      } else {
        payload.packageQty = null;
      }
      const { data } = await api.patch(`/inventory/${id}`, payload);
      setProduct(data.data);
      setBarcodes(data.data.barcodes || []);
      setBundleItems(data.data.bundleComponents || []);
      lastSavedRef.current = fingerprint;
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveMsg(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [id]);

  const handleSaveProduct = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(editFields), 500);
  }, [editFields, doSave]);

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

  const handleRemoveBundle = async () => {
    if (!id || bundleItems.length === 0) return;
    try {
      await Promise.all(bundleItems.map((item) => api.delete(`/inventory/${id}/bundle/${item.id}`)));
      setBundleItems([]);
    } catch { /* ignore */ }
  };

  const handleUpdateBundleQty = async (itemId: number, quantity: number) => {
    if (!id || quantity < 1) return;
    try {
      await api.patch(`/inventory/${id}/bundle/${itemId}`, { quantity });
      setBundleItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity } : i));
    } catch { /* ignore */ }
  };

  // Supplier SKU handlers
  const handleAddSupplierSku = async () => {
    if (!spForm.supplierId || !spForm.supplierSku.trim()) return;
    setSpAdding(true);
    try {
      await api.post(`/suppliers/${spForm.supplierId}/products`, {
        productId: parseInt(id || '0'),
        supplierSku: spForm.supplierSku.trim(),
        supplierPrice: spForm.supplierPrice ? parseFloat(spForm.supplierPrice) : undefined,
        leadTimeDays: spForm.leadTimeDays ? parseInt(spForm.leadTimeDays) : undefined,
      });
      // Reload product to refresh supplierProducts
      const { data } = await api.get(`/inventory/${id}`);
      setProduct(data.data);
      setSpForm({ supplierId: 0, supplierSku: '', supplierPrice: '', leadTimeDays: '' });
      setSpAddOpen(false);
    } catch { /* ignore */ }
    finally { setSpAdding(false); }
  };

  const handleDeleteSupplierSku = async (supplierId: number, productId: number) => {
    try {
      await api.delete(`/suppliers/${supplierId}/products/${productId}`);
      setProduct((prev) => prev ? { ...prev, supplierProducts: prev.supplierProducts?.filter((sp) => !(sp.supplierId === supplierId && sp.productId === productId)) } : prev);
    } catch { /* ignore */ }
  };


  // ─── Assign bin ──────────────────────────────────────
  const handleOpenAssign = async () => {
    setAssignOpen(true);
    if (allBins.length === 0) {
      try {
        const { data } = await api.get('/warehouse');
        const bins: Array<{ id: number; label: string; zoneName: string }> = [];
        for (const wh of data.data || []) {
          for (const zone of wh.zones || []) {
            for (const rack of zone.racks || []) {
              for (const bin of rack.bins || []) {
                bins.push({ id: bin.id, label: bin.label, zoneName: zone.name });
              }
            }
          }
        }
        setAllBins(bins);
        if (bins.length > 0 && !assignBinId) setAssignBinId(bins[0].id);
      } catch {}
    }
  };

  const handleAssignBin = async () => {
    if (!assignBinId || !assignQty || parseInt(assignQty) <= 0) return;
    setAssigning(true);
    try {
      await api.post(`/inventory/${id}/assign-bin`, { binId: assignBinId, quantity: parseInt(assignQty) });
      const { data } = await api.get(`/inventory/${id}`);
      setProduct(data.data);
      setAssignOpen(false);
      setAssignQty('1');
    } catch {}
    setAssigning(false);
  };

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
  const isBundle = product.isBundle && bundleItems.length > 0;

  // Bundle: available bundles = min of (component available / required qty) across all components
  const bundleAvailable = isBundle
    ? Math.max(0, Math.min(...bundleItems.map((i) => {
        const compAvail = (i.componentProduct?.stockQty || 0) - (i.componentProduct?.reservedQty || 0);
        return Math.floor(compAvail / i.quantity);
      })))
    : 0;
  const bundleComponentCount = bundleItems.length;

  const stockCards = isBundle
    ? [
        { label: 'Available', value: bundleAvailable, icon: Boxes, color: bundleAvailable > 0 ? 'text-violet-600' : 'text-red-500', bg: bundleAvailable > 0 ? 'bg-violet-500/10' : 'bg-red-500/10', border: bundleAvailable > 0 ? 'border-violet-500/20' : 'border-red-500/20' },
        { label: 'In Stock', value: product.stockQty, icon: Package, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
        { label: 'Reserved', value: product.reservedQty, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Components', value: bundleComponentCount, icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border/60' },
      ]
    : [
        { label: 'In Stock', value: product.stockQty, icon: Package, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
        { label: 'Reserved', value: product.reservedQty, icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Available', value: available, icon: CircleCheck, color: isLow ? 'text-red-500' : 'text-emerald-600', bg: isLow ? 'bg-red-500/10' : 'bg-emerald-500/10', border: isLow ? 'border-red-500/20' : 'border-emerald-500/20' },
        { label: 'Incoming', value: incoming, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Low Threshold', value: product.lowStockThreshold, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
      ];

  const filteredTabs = TABS.filter((tab) => {
    if (!isBundle) return true;
    if (tab.key === 'purchase-orders' || tab.key === 'stock-history') return false;
    return true;
  });

  const getTabCount = (key: TabKey) => {
    if (key === 'orders' && ordersMeta && ordersMeta.total > 0) return ordersMeta.total;
    if (key === 'purchase-orders' && posMeta && posMeta.total > 0) return posMeta.total;
    if (key === 'stock-history' && movementsMeta && movementsMeta.total > 0) return movementsMeta.total;
    return 0;
  };

  return (
    <div>
      {/* ─── Back Button ─────────────────────────────────── */}
      <button
        onClick={() => navigate('/inventory')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </button>

      {/* ─── Mobile Header (lg:hidden) ───────────────────── */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0">
            {product.imageUrl ? (
              <div className="h-8 w-8 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                <img src={proxyUrl(product.imageUrl, 64)!} alt={product.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                <ImageIcon className="h-4 w-4 text-muted-foreground/20" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">{product.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {product.sku && <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>}
              <span className="text-xs font-semibold text-emerald-600">
                {isBundle ? bundleAvailable : available} available
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              onClick={handlePushStock}
              disabled={syncPushing}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {syncPushing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
              Push
            </button>
          </div>
        </div>

        {/* Mobile feedback messages */}
        {pushResult && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Pushed qty {pushResult.stockQuantity}, status: {pushResult.stockStatus}
          </p>
        )}
        {saveMsg && (
          <p className={cn('mb-2 text-xs', saveMsg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>{saveMsg}</p>
        )}

        {/* Scrollable horizontal pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const count = getTabCount(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/60 text-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Layout ─────────────────────────────────── */}
      <div className="lg:flex lg:gap-6">

        {/* ─── Sidebar (desktop only) ──────────────────────── */}
        <aside className="hidden lg:block lg:w-[240px] lg:flex-shrink-0">
          <div className="sticky top-6 space-y-5">
            {/* Product identity */}
            <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  {product.imageUrl ? (
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-sm">
                      <img src={proxyUrl(product.imageUrl, 96)!} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30 shadow-sm">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold leading-tight line-clamp-2">{product.name}</h2>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {product.sku && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Hash className="h-2.5 w-2.5" />
                    {product.sku}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <Tag className="h-2.5 w-2.5" />
                  {product.currency} {product.price}
                </span>
                {product.store && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Store className="h-2.5 w-2.5" />
                    {product.store.name}
                  </span>
                )}
                {product.isBundle && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                    <Boxes className="h-2.5 w-2.5" />
                    Bundle
                  </span>
                )}
                {product.isDigital && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-600">
                    <CloudUpload className="h-2.5 w-2.5" />
                    Digital
                  </span>
                )}
                {!product.isActive && (
                  <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">Inactive</span>
                )}
              </div>
            </div>

            {/* Stock summary */}
            <div className="rounded-xl border border-border/60 bg-card shadow-sm p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stock</p>
              <div className="divide-y divide-border/30">
                {stockCards.map((card) => (
                  <div key={card.label} className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                    <span className={cn('text-sm font-semibold tabular-nums', card.color)}>
                      {card.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <nav className="rounded-xl border border-border/60 bg-card shadow-sm p-2">
              <div className="space-y-0.5">
                {filteredTabs.map((tab) => {
                  const Icon = tab.icon;
                  const count = getTabCount(tab.key);
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        activeTab === tab.key
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Quick actions */}
            <div className="space-y-2 border-t border-border/50 pt-4">
              {!product.isBundle && (
                <button
                  onClick={() => navigate('/receiving/new', { state: { sku: product.sku, productName: product.name } })}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium shadow-sm transition-all hover:bg-muted/60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create PO
                </button>
              )}
              <button
                onClick={handlePushStock}
                disabled={syncPushing}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {syncPushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
                Push to WooCommerce
              </button>
            </div>

            {/* Push result / save msg feedback */}
            {pushResult && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                Pushed qty {pushResult.stockQuantity}, status: {pushResult.stockStatus}
              </p>
            )}
          </div>
        </aside>

        {/* ─── Content Area ────────────────────────────────── */}
        <div className="min-w-0 flex-1">

      {/* ─── Tab Content ─────────────────────────────────── */}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Info (Always editable inline) */}
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4 text-muted-foreground" />
                Product Information
              </h3>
              {saving ? (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              ) : saveMsg ? (
                <span className={cn('text-[11px]', saveMsg.includes('Failed') ? 'text-destructive' : 'text-emerald-600')}>
                  {saveMsg}
                </span>
              ) : null}
            </div>
            <div className="divide-y divide-border/40 px-6">
              {/* Description */}
              <div className="py-3.5">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
                <textarea
                  value={editFields.description}
                  onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                  onBlur={handleSaveProduct}
                  rows={2}
                  placeholder="No description"
                  className="w-full rounded-lg border border-transparent bg-transparent px-0 py-1 text-sm leading-relaxed text-foreground transition-colors placeholder:italic placeholder:text-muted-foreground/50 hover:border-border/40 focus:border-primary focus:bg-background focus:px-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Price</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{product.currency}</span>
                  <input
                    type="text"
                    value={editFields.price}
                    onChange={(e) => setEditFields({ ...editFields, price: e.target.value })}
                    onBlur={handleSaveProduct}
                    className="h-7 w-24 rounded-md border border-transparent bg-transparent px-2 text-right text-sm font-semibold transition-colors hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Weight + Dimensions */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Scale className="h-3.5 w-3.5" />
                  Weight / Dims
                </span>
                <div className="flex items-center gap-1">
                  <input type="text" placeholder="—" value={editFields.weight} onChange={(e) => setEditFields({ ...editFields, weight: e.target.value })} onBlur={handleSaveProduct} className="h-7 w-14 rounded-md border border-transparent bg-transparent px-1.5 text-center text-xs font-medium transition-colors hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <span className="text-[10px] text-muted-foreground/60">{weightUnit}</span>
                  <input type="text" placeholder="L" value={editFields.length} onChange={(e) => setEditFields({ ...editFields, length: e.target.value })} onBlur={handleSaveProduct} className="h-7 w-11 rounded-md border border-transparent bg-transparent px-1 text-center text-xs font-medium transition-colors hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <span className="text-[10px] text-muted-foreground/40">×</span>
                  <input type="text" placeholder="W" value={editFields.width} onChange={(e) => setEditFields({ ...editFields, width: e.target.value })} onBlur={handleSaveProduct} className="h-7 w-11 rounded-md border border-transparent bg-transparent px-1 text-center text-xs font-medium transition-colors hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <span className="text-[10px] text-muted-foreground/40">×</span>
                  <input type="text" placeholder="H" value={editFields.height} onChange={(e) => setEditFields({ ...editFields, height: e.target.value })} onBlur={handleSaveProduct} className="h-7 w-11 rounded-md border border-transparent bg-transparent px-1 text-center text-xs font-medium transition-colors hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <span className="text-[10px] text-muted-foreground/60">{dimUnit}</span>
                </div>
              </div>

              {/* Low stock threshold */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Low Stock Threshold
                </span>
                <input
                  type="number"
                  min={0}
                  value={editFields.lowStockThreshold}
                  onChange={(e) => setEditFields({ ...editFields, lowStockThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                  onBlur={handleSaveProduct}
                  className="h-7 w-16 rounded-md border border-transparent bg-transparent px-2 text-right text-sm font-semibold text-red-500 transition-colors hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Package Qty */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Boxes className="h-3.5 w-3.5" />
                  Package Qty
                </span>
                <input
                  type="number"
                  min={1}
                  value={editFields.packageQty}
                  onChange={(e) => setEditFields({ ...editFields, packageQty: e.target.value })}
                  onBlur={handleSaveProduct}
                  placeholder="—"
                  className="h-7 w-16 rounded-md border border-transparent bg-transparent px-2 text-right text-sm font-medium transition-colors placeholder:text-muted-foreground hover:border-border/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Digital product toggle */}
              <div className="flex items-center justify-between py-3.5">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CloudUpload className="h-3.5 w-3.5" />
                  Digital Product
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const newVal = !product.isDigital;
                    try {
                      const { data } = await api.patch(`/inventory/${id}`, { isDigital: newVal });
                      setProduct(data.data);
                      setBarcodes(data.data.barcodes || []);
                      setBundleItems(data.data.bundleComponents || []);
                    } catch {
                      console.error('Failed to toggle digital');
                    }
                  }}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    product.isDigital ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                >
                  <span className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                    product.isDigital ? 'translate-x-[18px]' : 'translate-x-[2px]'
                  )} />
                </button>
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

          {/* Warehouse Locations (regular) / Component Breakdown (bundle) */}
          {isBundle ? (
            <div className="rounded-xl border border-violet-500/20 bg-card shadow-sm">
              <div className="border-b border-violet-500/10 px-6 py-3.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Boxes className="h-4 w-4 text-violet-600" />
                  Component Stock
                  <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                    {bundleItems.length}
                  </span>
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {bundleItems.map((item) => {
                    const cp = item.componentProduct;
                    const compAvail = (cp?.stockQty || 0) - (cp?.reservedQty || 0);
                    const canMake = Math.floor(compAvail / item.quantity);
                    const isLimiting = canMake === bundleAvailable;
                    return (
                      <div
                        key={item.id}
                        onClick={() => cp && navigate(`/inventory/${cp.sku || cp.id}`)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-4 py-2.5 transition-colors cursor-pointer',
                          isLimiting && compAvail > 0 ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' :
                          compAvail <= 0 ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10' :
                          'border-border/40 bg-muted/20 hover:bg-muted/40'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{cp?.name || `Product #${item.componentProductId}`}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            {cp?.sku && <code className="text-[10px] text-muted-foreground">{cp.sku}</code>}
                            <span className="text-[10px] text-muted-foreground">×{item.quantity} per bundle</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right ml-3">
                          <p className={cn('text-lg font-bold', compAvail <= 0 ? 'text-red-500' : 'text-foreground')}>{compAvail}</p>
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">avail</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {bundleItems.some((i) => {
                  const a = (i.componentProduct?.stockQty || 0) - (i.componentProduct?.reservedQty || 0);
                  return Math.floor(a / i.quantity) === bundleAvailable && bundleAvailable >= 0;
                }) && (
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    <AlertTriangle className="mr-1 inline h-3 w-3 text-amber-500" />
                    Highlighted component is the limiting factor
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Warehouse Locations
                  {product.stockLocations && product.stockLocations.length > 0 && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {product.stockLocations.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={handleOpenAssign}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Plus className="h-3 w-3" />
                  Assign
                </button>
              </div>
              {/* Assign bin form */}
              {assignOpen && (() => {
                const totalAssigned = (product.stockLocations || []).reduce((s, sl) => s + sl.quantity, 0);
                const maxAssignable = Math.max(0, product.stockQty - totalAssigned);
                return (
                  <div className="border-b border-border/40 bg-muted/20 px-6 py-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Bin</label>
                        <select
                          value={assignBinId}
                          onChange={(e) => setAssignBinId(parseInt(e.target.value))}
                          className="h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          {allBins.map((b) => (
                            <option key={b.id} value={b.id}>{b.label} — {b.zoneName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Qty</label>
                        <input
                          type="number"
                          min="1"
                          max={maxAssignable}
                          value={assignQty}
                          onChange={(e) => setAssignQty(e.target.value)}
                          className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-[12px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                      <button
                        onClick={handleAssignBin}
                        disabled={assigning || !assignBinId || maxAssignable <= 0}
                        className="h-8 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        {assigning ? '...' : 'Add'}
                      </button>
                      <button
                        onClick={() => setAssignOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted/40"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {maxAssignable <= 0 ? (
                      <p className="mt-2 text-[11px] text-amber-600">All {product.stockQty} units already assigned to bins.</p>
                    ) : (
                      <p className="mt-2 text-[11px] text-muted-foreground">{maxAssignable} of {product.stockQty} unassigned</p>
                    )}
                    {allBins.length === 0 && (
                      <p className="mt-2 text-[11px] text-muted-foreground">No bins found. Create zones and bins in Warehouse first.</p>
                    )}
                  </div>
                );
              })()}

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
                            {sl.bin?.rack?.zone && (
                              <p className="text-[11px] text-muted-foreground">{sl.bin.rack.zone.name} · {sl.bin.rack.zone.type}</p>
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

                {/* Mini floor plan showing product location */}
                {product.stockLocations && product.stockLocations.length > 0 && (
                  <FloorPlanMini
                    highlightZoneIds={[...new Set(
                      product.stockLocations
                        .map((sl) => sl.bin?.rack?.zone?.id)
                        .filter((id): id is number => id != null)
                    )]}
                    zoneQty={product.stockLocations.reduce((acc, sl) => {
                      const zId = sl.bin?.rack?.zone?.id;
                      if (zId != null) acc[zId] = (acc[zId] || 0) + sl.quantity;
                      return acc;
                    }, {} as Record<number, number>)}
                    className="mt-3"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Incoming Stock — hidden for bundles */}
        {!isBundle && incomingPOs.length > 0 && (
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
                      onClick={() => navigate(`/receiving/${po.poNumber || po.id}`)}
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
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Supplier SKUs
                {product.supplierProducts && product.supplierProducts.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{product.supplierProducts.length}</span>
                )}
              </h3>
              {!spAddOpen && (
                <button onClick={() => setSpAddOpen(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground">
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
            </div>
            <div className="p-4">
              {/* Add form */}
              {spAddOpen && (
                <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Supplier</label>
                      <select
                        value={spForm.supplierId}
                        onChange={(e) => setSpForm({ ...spForm, supplierId: parseInt(e.target.value) || 0 })}
                        className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value={0}>Select supplier...</option>
                        {suppliersList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Supplier SKU</label>
                      <input
                        type="text"
                        value={spForm.supplierSku}
                        onChange={(e) => setSpForm({ ...spForm, supplierSku: e.target.value })}
                        placeholder="e.g. SUP-12345"
                        className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Price</label>
                      <input
                        type="number"
                        step={0.01}
                        min={0}
                        value={spForm.supplierPrice}
                        onChange={(e) => setSpForm({ ...spForm, supplierPrice: e.target.value })}
                        placeholder="0.00"
                        className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-muted-foreground">Lead Time (days)</label>
                      <input
                        type="number"
                        min={0}
                        value={spForm.leadTimeDays}
                        onChange={(e) => setSpForm({ ...spForm, leadTimeDays: e.target.value })}
                        placeholder="e.g. 14"
                        className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <button onClick={() => { setSpAddOpen(false); setSpForm({ supplierId: 0, supplierSku: '', supplierPrice: '', leadTimeDays: '' }); }} className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60">Cancel</button>
                    <button
                      onClick={handleAddSupplierSku}
                      disabled={spAdding || !spForm.supplierId || !spForm.supplierSku.trim()}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {spAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      Add
                    </button>
                  </div>
                </div>
              )}

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
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{sp.supplierPrice ? `$${parseFloat(sp.supplierPrice).toFixed(2)}` : '—'}</p>
                          {sp.leadTimeDays && <p className="text-[10px] text-muted-foreground">{sp.leadTimeDays}d lead</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteSupplierSku(sp.supplierId, sp.productId)}
                          className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !spAddOpen ? (
                <div className="py-6 text-center">
                  <Link2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground">No supplier mappings</p>
                  <button onClick={() => setSpAddOpen(true)} className="mt-2 text-xs font-medium text-primary hover:underline">Add supplier SKU</button>
                </div>
              ) : null}
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
                        onClick={() => navigate(`/orders/${order.orderNumber}`)}
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
              onClick={() => navigate('/receiving/new', { state: { sku: product.sku, productName: product.name } })}
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
                        onClick={() => navigate(`/receiving/${po.poNumber || po.id}`)}
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
                          {m.reference && (m.reference.startsWith('PO-') || m.reference.startsWith('po-')) && (
                            <button
                              onClick={() => navigate(`/receiving/${m.reference}`)}
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
          {/* Bundle on/off toggle */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <button
              type="button"
              onClick={async () => {
                const newVal = !product.isBundle;
                try {
                  await api.patch(`/inventory/${id}`, { isBundle: newVal });
                  setProduct((prev) => prev ? { ...prev, isBundle: newVal } : prev);
                } catch { /* ignore */ }
              }}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', product.isBundle ? 'bg-violet-500/10' : 'bg-muted/50')}>
                  <Boxes className={cn('h-4.5 w-4.5', product.isBundle ? 'text-violet-600' : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className="text-sm font-medium">Bundle product</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {product.isBundle ? 'This product is a bundle of other products' : 'Turn on to add component products to this bundle'}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  'flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors',
                  product.isBundle ? 'bg-violet-500' : 'bg-border'
                )}
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    product.isBundle ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </div>
            </button>
          </div>

          {/* Available metric */}
          {product.isBundle && bundleItems.length > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-violet-600">Available</p>
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
              {bundleItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Remove all components from this bundle?')) {
                      handleRemoveBundle();
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove all
                </button>
              )}
            </div>
            <div className="p-4">
              {bundleItems.length > 0 && (
                <div className="mb-4 space-y-2">
                  {bundleItems.map((item) => {
                    const cp = item.componentProduct;
                    const available = (cp?.stockQty || 0) - (cp?.reservedQty || 0);
                    const thumbSrc = cp?.imageUrl ? proxyUrl(cp.imageUrl, 64) : null;
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {thumbSrc ? (
                            <img src={thumbSrc} alt="" className="h-8 w-8 rounded-md border border-border/60 object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-muted/50">
                              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <button onClick={() => cp && navigate(`/inventory/${cp.sku || cp.id}`)} className="text-sm font-medium text-primary hover:underline">
                              {cp?.name || `Product #${item.componentProductId}`}
                            </button>
                            {cp?.sku && <p className="text-[11px] text-muted-foreground">{cp.sku}</p>}
                          </div>
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
              <ProductSearchDropdown
                onSelect={(p) => handleAddBundleComponent(p.id)}
                excludeIds={[parseInt(id || '0'), ...bundleItems.map((i) => i.componentProduct?.id).filter((x): x is number => x != null)]}
                placeholder="Search product to add as component..."
              />
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

        </div>{/* end content area */}
      </div>{/* end lg:flex */}
    </div>
  );
}
