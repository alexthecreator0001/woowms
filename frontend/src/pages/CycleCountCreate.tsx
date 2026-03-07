import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ListMagnifyingGlass,
  CaretDown,
  EyeSlash,
  CalendarBlank,
  User,
  CircleNotch,
  CheckCircle,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import type { Warehouse, Zone, TeamMember } from '../types';

type CountType = 'ZONE' | 'LOCATION' | 'PRODUCT';

interface BinOption {
  id: number;
  label: string;
  zoneId: number;
  zoneName: string;
  stockCount: number;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string | null;
  stockQty: number;
}

export default function CycleCountCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [countType, setCountType] = useState<CountType>('ZONE');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [bins, setBins] = useState<BinOption[]>([]);
  const [selectedBinIds, setSelectedBinIds] = useState<number[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [binSearch, setBinSearch] = useState('');
  const [blindCount, setBlindCount] = useState(false);
  const [plannedDate, setPlannedDate] = useState('');
  const [assignedToId, setAssignedToId] = useState<number | null>(null);
  const [assignedToName, setAssignedToName] = useState('');
  const [notes, setNotes] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [itemPreview, setItemPreview] = useState<number | null>(null);

  // Load warehouses + team
  useEffect(() => {
    api.get('/warehouse').then(({ data }) => setWarehouses(data.data || [])).catch(() => {});
    api.get('/team').then(({ data }) => setTeamMembers(data.data || [])).catch(() => {});
  }, []);

  // Load zones when warehouse changes
  useEffect(() => {
    if (!warehouseId) { setZones([]); return; }
    api.get(`/warehouse/${warehouseId}`)
      .then(({ data }) => setZones(data.data?.zones || []))
      .catch(() => {});
  }, [warehouseId]);

  // Load bins when warehouse changes (for LOCATION type)
  useEffect(() => {
    if (!warehouseId || countType !== 'LOCATION') { setBins([]); return; }
    api.get(`/warehouse/${warehouseId}`)
      .then(({ data }) => {
        const allBins: BinOption[] = [];
        for (const zone of (data.data?.zones || [])) {
          for (const bin of (zone.bins || [])) {
            allBins.push({
              id: bin.id,
              label: bin.label,
              zoneId: zone.id,
              zoneName: zone.name,
              stockCount: bin._stockCount ?? bin.stockLocations?.length ?? 0,
            });
          }
        }
        setBins(allBins);
      })
      .catch(() => {});
  }, [warehouseId, countType]);

  // Load products for PRODUCT type
  useEffect(() => {
    if (countType !== 'PRODUCT') { setProducts([]); return; }
    const params: Record<string, string | number> = { limit: 200 };
    if (productSearch) params.search = productSearch;
    api.get('/inventory', { params })
      .then(({ data }) => {
        setProducts((data.data || []).map((p: any) => ({
          id: p.id, name: p.name, sku: p.sku, stockQty: p.stockQty,
        })));
      })
      .catch(() => {});
  }, [countType, productSearch]);

  // Preview item count
  useEffect(() => {
    if (!warehouseId) { setItemPreview(null); return; }
    if (countType === 'ZONE' && zoneId) {
      api.get(`/warehouse/${warehouseId}`)
        .then(({ data }) => {
          const zone = (data.data?.zones || []).find((z: Zone) => z.id === zoneId);
          const count = (zone?.bins || []).reduce((sum: number, b: any) => sum + (b.stockLocations?.length || 0), 0);
          setItemPreview(count);
        })
        .catch(() => setItemPreview(null));
    } else if (countType === 'LOCATION') {
      setItemPreview(selectedBinIds.length > 0 ? bins.filter(b => selectedBinIds.includes(b.id)).reduce((s, b) => s + b.stockCount, 0) : null);
    } else if (countType === 'PRODUCT') {
      setItemPreview(selectedProductIds.length > 0 ? selectedProductIds.length : null);
    } else {
      setItemPreview(null);
    }
  }, [countType, warehouseId, zoneId, selectedBinIds, selectedProductIds, bins]);

  async function handleSave() {
    if (!warehouseId) return setError('Select a warehouse');
    if (countType === 'ZONE' && !zoneId) return setError('Select a zone');
    if (countType === 'LOCATION' && selectedBinIds.length === 0) return setError('Select at least one bin');
    if (countType === 'PRODUCT' && selectedProductIds.length === 0) return setError('Select at least one product');

    try {
      setSaving(true);
      setError('');
      const body: any = {
        type: countType,
        warehouseId,
        blindCount,
        notes: notes || undefined,
      };
      if (countType === 'ZONE') body.zoneId = zoneId;
      if (countType === 'LOCATION') body.binIds = selectedBinIds;
      if (countType === 'PRODUCT') body.productIds = selectedProductIds;
      if (plannedDate) body.plannedDate = plannedDate;
      if (assignedToId) {
        body.assignedToId = assignedToId;
        body.assignedToName = assignedToName;
      }

      const { data } = await api.post('/cycle-counts', body);
      navigate(`/cycle-counts/${data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create cycle count');
    } finally {
      setSaving(false);
    }
  }

  const filteredBins = binSearch
    ? bins.filter(b => b.label.toLowerCase().includes(binSearch.toLowerCase()) || b.zoneName.toLowerCase().includes(binSearch.toLowerCase()))
    : bins;

  const binsByZone = filteredBins.reduce<Record<string, BinOption[]>>((acc, b) => {
    if (!acc[b.zoneName]) acc[b.zoneName] = [];
    acc[b.zoneName].push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/cycle-counts')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          Cycle Counts
        </button>
        <h1 className="text-2xl font-bold tracking-tight">New Cycle Count</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Count Type */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">Count type</label>
            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
              {(['ZONE', 'LOCATION', 'PRODUCT'] as CountType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setCountType(t); setZoneId(null); setSelectedBinIds([]); setSelectedProductIds([]); }}
                  className={cn(
                    'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
                    countType === t
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t === 'ZONE' ? 'Zone' : t === 'LOCATION' ? 'Location' : 'Product'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {countType === 'ZONE' && 'Count all stock locations within a selected zone.'}
              {countType === 'LOCATION' && 'Count specific bins you select.'}
              {countType === 'PRODUCT' && 'Count specific products across the warehouse.'}
            </p>
          </div>

          {/* Warehouse */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">Warehouse</label>
            <div className="relative">
              <select
                value={warehouseId ?? ''}
                onChange={(e) => { setWarehouseId(e.target.value ? parseInt(e.target.value) : null); setZoneId(null); setSelectedBinIds([]); }}
                className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background pl-3.5 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Conditional selector */}
          {warehouseId && countType === 'ZONE' && (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold">Zone</label>
              <div className="relative">
                <select
                  value={zoneId ?? ''}
                  onChange={(e) => setZoneId(e.target.value ? parseInt(e.target.value) : null)}
                  className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background pl-3.5 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select zone...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
                  ))}
                </select>
                <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {warehouseId && countType === 'LOCATION' && (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold">
                Bins <span className="font-normal text-muted-foreground">({selectedBinIds.length} selected)</span>
              </label>
              <div className="relative mb-3">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search bins..."
                  value={binSearch}
                  onChange={(e) => setBinSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-4 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-3">
                {Object.entries(binsByZone).map(([zoneName, zoneBins]) => (
                  <div key={zoneName}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{zoneName}</p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {zoneBins.map((bin) => (
                        <label
                          key={bin.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                            selectedBinIds.includes(bin.id)
                              ? 'border-primary bg-primary/5 text-foreground'
                              : 'border-border/40 hover:border-border'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBinIds.includes(bin.id)}
                            onChange={() => {
                              setSelectedBinIds((prev) =>
                                prev.includes(bin.id) ? prev.filter((id) => id !== bin.id) : [...prev, bin.id]
                              );
                            }}
                            className="sr-only"
                          />
                          <div className={cn(
                            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                            selectedBinIds.includes(bin.id)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border/60'
                          )}>
                            {selectedBinIds.includes(bin.id) && <CheckCircle size={12} weight="fill" />}
                          </div>
                          <span className="font-medium">{bin.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredBins.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground/50">No bins found</p>
                )}
              </div>
            </div>
          )}

          {warehouseId && countType === 'PRODUCT' && (
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold">
                Products <span className="font-normal text-muted-foreground">({selectedProductIds.length} selected)</span>
              </label>
              {selectedProductIds.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {selectedProductIds.map((pid) => {
                    const p = products.find((p) => p.id === pid);
                    return (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {p?.name || `#${pid}`}
                        <button onClick={() => setSelectedProductIds((prev) => prev.filter((id) => id !== pid))}>
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative mb-3">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-4 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-border/30">
                {products
                  .filter((p) => !selectedProductIds.includes(p.id))
                  .slice(0, 50)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductIds((prev) => [...prev, p.id])}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="font-medium">{p.name}</span>
                      {p.sku && (
                        <code className="rounded bg-muted/50 px-1 py-px text-[10px] font-medium text-muted-foreground">{p.sku}</code>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">{p.stockQty} in stock</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeSlash size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Blind count</p>
                  <p className="text-xs text-muted-foreground">Hide expected quantities from counters</p>
                </div>
              </div>
              <button
                onClick={() => setBlindCount(!blindCount)}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                  blindCount ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200',
                  blindCount ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <CalendarBlank size={16} className="text-muted-foreground" />
                Planned date
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border/60 bg-background px-3.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <User size={16} className="text-muted-foreground" />
                Assign to
              </label>
              <div className="relative">
                <select
                  value={assignedToId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : null;
                    setAssignedToId(id);
                    const member = teamMembers.find((m) => m.id === id);
                    setAssignedToName(member?.name || '');
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-border/60 bg-background pl-3.5 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional notes..."
                className="w-full rounded-lg border border-border/60 bg-background px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Right column — sticky save card */}
        <div>
          <div className="sticky top-8 space-y-4">
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                  <ListMagnifyingGlass size={18} weight="duotone" className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Cycle Count</p>
                  <p className="text-xs text-muted-foreground">{countType === 'ZONE' ? 'Zone' : countType === 'LOCATION' ? 'Location' : 'Product'} count</p>
                </div>
              </div>

              {itemPreview !== null && (
                <div className="rounded-lg bg-muted/50 px-3.5 py-2.5 text-sm">
                  <span className="text-muted-foreground">This count will generate</span>{' '}
                  <span className="font-semibold text-foreground">~{itemPreview} items</span>
                </div>
              )}

              {error && (
                <p className="text-sm font-medium text-red-500">{error}</p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <CircleNotch size={16} className="animate-spin" /> : <ListMagnifyingGlass size={16} />}
                {saving ? 'Creating...' : 'Create Count'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
