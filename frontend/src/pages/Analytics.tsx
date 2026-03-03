import { useEffect, useState, useMemo } from 'react';
import {
  ChartLineUp,
  CurrencyDollar,
  ShoppingBag,
  Receipt,
  Package,
  GlobeHemisphereWest,
  TrendUp,
  TrendDown,
  Spinner,
  GearSix,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { fmtMoney } from '../lib/currency';
import { WorldMap } from '../components/ui/world-map';
import api from '../services/api';

/* ─── Types ──────────────────────────────────────────── */

interface MetricValue {
  value: number;
  previous: number;
  currency?: string;
}

interface AnalyticsData {
  metrics: {
    totalSales: MetricValue;
    totalOrders: MetricValue;
    avgOrderValue: MetricValue;
    itemsSold: MetricValue;
  };
  salesOverTime: { date: string; total: number; orders: number }[];
  ordersByCountry: { country: string; count: number; total: number }[];
  currency: string;
}

/* ─── Constants ──────────────────────────────────────── */

const PERIODS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: '1 year' },
];

const CARD_DEFS = [
  { key: 'totalSales', title: 'Total Sales', Icon: CurrencyDollar, color: 'indigo', isMoney: true },
  { key: 'totalOrders', title: 'Total Orders', Icon: ShoppingBag, color: 'violet', isMoney: false },
  { key: 'avgOrderValue', title: 'Avg Order Value', Icon: Receipt, color: 'emerald', isMoney: true },
  { key: 'itemsSold', title: 'Items Sold', Icon: Package, color: 'amber', isMoney: false },
] as const;

const ICON_COLORS: Record<string, { bg: string; text: string; spark: string }> = {
  indigo:  { bg: 'bg-indigo-500/10', text: 'text-indigo-600', spark: '#6366f1' },
  violet:  { bg: 'bg-violet-500/10', text: 'text-violet-600', spark: '#8b5cf6' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', spark: '#10b981' },
  amber:   { bg: 'bg-amber-500/10', text: 'text-amber-600', spark: '#f59e0b' },
};

// Warehouse origin for map lines (default: Prague, CZ)
const WAREHOUSE_ORIGIN = { lat: 50.08, lng: 14.44 };

// Country centroids for map dot destinations
const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  US: { lat: 38, lng: -97 }, CA: { lat: 56, lng: -96 }, MX: { lat: 23, lng: -102 },
  BR: { lat: -14, lng: -51 }, AR: { lat: -34, lng: -58 }, CL: { lat: -33, lng: -71 },
  CO: { lat: 4, lng: -74 }, PE: { lat: -12, lng: -77 }, VE: { lat: 6, lng: -66 },
  GB: { lat: 54, lng: -2 }, IE: { lat: 53, lng: -8 }, FR: { lat: 46, lng: 2 },
  DE: { lat: 51, lng: 10 }, IT: { lat: 42, lng: 12 }, ES: { lat: 40, lng: -4 },
  PT: { lat: 39, lng: -8 }, NL: { lat: 52, lng: 5 }, BE: { lat: 51, lng: 4 },
  CH: { lat: 47, lng: 8 }, AT: { lat: 47, lng: 14 }, PL: { lat: 52, lng: 20 },
  CZ: { lat: 50, lng: 15 }, SK: { lat: 48, lng: 19 }, HU: { lat: 47, lng: 19 },
  RO: { lat: 46, lng: 25 }, BG: { lat: 42, lng: 25 }, HR: { lat: 45, lng: 16 },
  RS: { lat: 44, lng: 21 }, GR: { lat: 39, lng: 22 }, SE: { lat: 60, lng: 18 },
  NO: { lat: 60, lng: 8 }, DK: { lat: 56, lng: 10 }, FI: { lat: 61, lng: 26 },
  EE: { lat: 59, lng: 25 }, LV: { lat: 57, lng: 25 }, LT: { lat: 55, lng: 24 },
  UA: { lat: 49, lng: 32 }, RU: { lat: 56, lng: 38 }, TR: { lat: 39, lng: 35 },
  IL: { lat: 31, lng: 35 }, SA: { lat: 24, lng: 45 }, AE: { lat: 24, lng: 54 },
  EG: { lat: 27, lng: 30 }, MA: { lat: 32, lng: -5 }, NG: { lat: 10, lng: 8 },
  KE: { lat: -1, lng: 38 }, ZA: { lat: -29, lng: 24 }, IN: { lat: 20, lng: 78 },
  CN: { lat: 35, lng: 105 }, JP: { lat: 36, lng: 140 }, KR: { lat: 36, lng: 128 },
  TH: { lat: 15, lng: 101 }, VN: { lat: 16, lng: 108 }, SG: { lat: 1, lng: 104 },
  MY: { lat: 4, lng: 102 }, PH: { lat: 13, lng: 122 }, ID: { lat: -2, lng: 118 },
  AU: { lat: -25, lng: 134 }, NZ: { lat: -41, lng: 174 },
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela', UY: 'Uruguay',
  GB: 'United Kingdom', IE: 'Ireland', FR: 'France', DE: 'Germany', IT: 'Italy',
  ES: 'Spain', PT: 'Portugal', NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland',
  AT: 'Austria', PL: 'Poland', CZ: 'Czech Republic', SK: 'Slovakia', HU: 'Hungary',
  RO: 'Romania', BG: 'Bulgaria', HR: 'Croatia', RS: 'Serbia', GR: 'Greece',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', IS: 'Iceland',
  EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', UA: 'Ukraine',
  RU: 'Russia', KZ: 'Kazakhstan', TR: 'Turkey', IL: 'Israel',
  SA: 'Saudi Arabia', AE: 'UAE', IQ: 'Iraq',
  EG: 'Egypt', MA: 'Morocco', DZ: 'Algeria', NG: 'Nigeria',
  KE: 'Kenya', TZ: 'Tanzania', ZA: 'South Africa',
  IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', CN: 'China',
  JP: 'Japan', KR: 'South Korea', TW: 'Taiwan',
  TH: 'Thailand', VN: 'Vietnam', MY: 'Malaysia', SG: 'Singapore',
  PH: 'Philippines', ID: 'Indonesia', AU: 'Australia', NZ: 'New Zealand',
};

/* ─── Helpers ────────────────────────────────────────── */

function countryFlag(code: string): string {
  return code.toUpperCase().split('').map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Aggregate daily data into weekly or monthly buckets
function aggregateBars(data: { date: string; total: number; orders: number }[], period: string): { label: string; total: number; orders: number }[] {
  if (period === '7d' || period === '30d') {
    return data.map((d) => ({
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: d.total,
      orders: d.orders,
    }));
  }
  // 90d → weekly, year → monthly
  const buckets: Record<string, { total: number; orders: number }> = {};
  for (const d of data) {
    const dt = new Date(d.date + 'T00:00:00');
    const key = period === 'year'
      ? dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : `W${getISOWeek(dt)}`;
    if (!buckets[key]) buckets[key] = { total: 0, orders: 0 };
    buckets[key].total += d.total;
    buckets[key].orders += d.orders;
  }
  return Object.entries(buckets).map(([label, v]) => ({ label, ...v }));
}

function getISOWeek(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/* ─── Sparkline ──────────────────────────────────────── */

function Sparkline({ data, color = '#6366f1' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const w = 96;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h * 0.9 - h * 0.05;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPath = `M 0,${h} L ${pts.map((p) => `L ${p}`).join(' ')} L ${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts.join(' ')} />
    </svg>
  );
}

/* ─── Bar Chart (Shopify-style) ──────────────────────── */

function BarChart({ bars }: { bars: { label: string; total: number; orders: number }[] }) {
  if (!bars.length) return null;

  const W = 800;
  const H = 280;
  const pad = { t: 16, r: 16, b: 40, l: 52 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const maxVal = Math.max(...bars.map((b) => b.total), 1);
  const gap = cw / bars.length;
  const barW = Math.max(Math.min(gap * 0.65, 28), 3);

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  // X-axis labels — show ~8 evenly spaced
  const labelStep = Math.max(Math.ceil(bars.length / 8), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((pct) => {
        const y = pad.t + ch * (1 - pct);
        return (
          <line
            key={pct}
            x1={pad.l}
            y1={y}
            x2={W - pad.r}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
            strokeDasharray={pct === 0 ? undefined : '4 4'}
          />
        );
      })}

      {/* Bars */}
      {bars.map((b, i) => {
        const x = pad.l + i * gap + (gap - barW) / 2;
        const barH = Math.max((b.total / maxVal) * ch, b.total > 0 ? 2 : 0);
        const y = pad.t + ch - barH;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={barW > 6 ? 3 : 1.5}
            fill="#6366f1"
            opacity="0.85"
          />
        );
      })}

      {/* Y-axis labels */}
      {yTicks.map((pct) => {
        const y = pad.t + ch * (1 - pct);
        const val = maxVal * pct;
        const label = val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : val.toFixed(0);
        return (
          <text key={pct} x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af">
            {label}
          </text>
        );
      })}

      {/* X-axis labels */}
      {bars.map((b, i) => {
        if (i % labelStep !== 0 && i !== bars.length - 1) return null;
        const x = pad.l + i * gap + gap / 2;
        return (
          <text key={i} x={x} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">
            {b.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────────── */

export default function Analytics() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('analyticsCards');
      return saved ? JSON.parse(saved) : CARD_DEFS.map((c) => c.key);
    } catch {
      return CARD_DEFS.map((c) => c.key);
    }
  });
  const [showCardConfig, setShowCardConfig] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/analytics?period=${period}`)
      .then(({ data: res }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const toggleCard = (key: string) => {
    setVisibleCards((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (next.length === 0) return prev;
      localStorage.setItem('analyticsCards', JSON.stringify(next));
      return next;
    });
  };

  // Build world-map dots: warehouse → each order country
  const mapDots = useMemo(() => {
    if (!data) return [];
    return data.ordersByCountry
      .filter((c) => COUNTRY_CENTROIDS[c.country])
      .slice(0, 12) // limit lines for readability
      .map((c) => ({
        start: WAREHOUSE_ORIGIN,
        end: COUNTRY_CENTROIDS[c.country],
      }));
  }, [data]);

  // Aggregate bars for chart
  const chartBars = useMemo(() => {
    if (!data) return [];
    return aggregateBars(data.salesOverTime, period);
  }, [data, period]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { metrics, salesOverTime, ordersByCountry, currency } = data;
  const sparkSales = salesOverTime.map((d) => d.total);
  const sparkOrders = salesOverTime.map((d) => d.orders);
  const sparkAvg = salesOverTime.map((d) => (d.orders > 0 ? d.total / d.orders : 0));

  const cardData: Record<string, { value: string; pct: number; sparkline: number[]; sparkColor: string }> = {
    totalSales: {
      value: fmtMoney(metrics.totalSales.value, metrics.totalSales.currency || currency),
      pct: pctChange(metrics.totalSales.value, metrics.totalSales.previous),
      sparkline: sparkSales,
      sparkColor: ICON_COLORS.indigo.spark,
    },
    totalOrders: {
      value: metrics.totalOrders.value.toLocaleString(),
      pct: pctChange(metrics.totalOrders.value, metrics.totalOrders.previous),
      sparkline: sparkOrders,
      sparkColor: ICON_COLORS.violet.spark,
    },
    avgOrderValue: {
      value: fmtMoney(metrics.avgOrderValue.value, metrics.avgOrderValue.currency || currency),
      pct: pctChange(metrics.avgOrderValue.value, metrics.avgOrderValue.previous),
      sparkline: sparkAvg,
      sparkColor: ICON_COLORS.emerald.spark,
    },
    itemsSold: {
      value: metrics.itemsSold.value.toLocaleString(),
      pct: pctChange(metrics.itemsSold.value, metrics.itemsSold.previous),
      sparkline: [],
      sparkColor: ICON_COLORS.amber.spark,
    },
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
            <ChartLineUp size={22} weight="duotone" className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-sm text-muted-foreground">Sales and order insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Card config */}
          <div className="relative">
            <button
              onClick={() => setShowCardConfig(!showCardConfig)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <GearSix size={14} />
              Customize
            </button>
            {showCardConfig && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-border/60 bg-card p-2 shadow-lg">
                {CARD_DEFS.map((c) => {
                  const on = visibleCards.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => toggleCard(c.key)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      {on ? <Eye size={14} className="text-primary" /> : <EyeSlash size={14} className="text-muted-foreground" />}
                      <span className={cn(on ? 'text-foreground' : 'text-muted-foreground')}>{c.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Period selector */}
          <div className="flex gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  period === p.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className={cn('grid gap-4', visibleCards.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4')}>
        {CARD_DEFS.filter((c) => visibleCards.includes(c.key)).map((card) => {
          const d = cardData[card.key];
          const ic = ICON_COLORS[card.color];
          const Icon = card.Icon;
          const isUp = d.pct > 0;
          const isDown = d.pct < 0;
          return (
            <div key={card.key} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', ic.bg)}>
                  <Icon size={18} weight="duotone" className={ic.text} />
                </div>
                {d.pct !== 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      isUp && 'bg-emerald-500/10 text-emerald-600',
                      isDown && 'bg-rose-500/10 text-rose-600'
                    )}
                  >
                    {isUp ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
                    {Math.abs(d.pct).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">{d.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.title}</p>
              {d.sparkline.length > 1 && (
                <div className="mt-3">
                  <Sparkline data={d.sparkline} color={d.sparkColor} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Sales Bar Chart ────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sales Over Time</h3>
        </div>
        <div className="p-4">
          {chartBars.length > 1 ? (
            <BarChart bars={chartBars} />
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">No data for this period</div>
          )}
        </div>
      </div>

      {/* ── Map + Top Countries ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden">
          <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GlobeHemisphereWest size={16} weight="duotone" className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Order Map</h3>
            </div>
            <span className="text-xs text-slate-400">
              {ordersByCountry.reduce((s, c) => s + c.count, 0)} orders from {ordersByCountry.length} {ordersByCountry.length === 1 ? 'country' : 'countries'}
            </span>
          </div>
          <div className="px-4 py-2">
            {mapDots.length > 0 ? (
              <WorldMap dots={mapDots} lineColor="#818cf8" />
            ) : (
              <div className="flex items-center justify-center py-20 text-sm text-slate-500">No geographic data yet</div>
            )}
          </div>
        </div>

        {/* Top Countries */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-sm font-semibold">Top Countries</h3>
          </div>
          <div className="divide-y divide-border/40">
            {ordersByCountry.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">No data yet</div>
            )}
            {ordersByCountry.slice(0, 10).map((c) => {
              const maxC = ordersByCountry[0]?.count || 1;
              return (
                <div key={c.country} className="flex items-center gap-3 px-6 py-3">
                  <span className="text-base leading-none">{countryFlag(c.country)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{COUNTRY_NAMES[c.country] || c.country}</p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${(c.count / maxC) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{c.count}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{fmtMoney(c.total, currency)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
