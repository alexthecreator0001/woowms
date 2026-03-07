import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  CreditCard,
  Trophy,
  ChartBar,
  MapPin,
  ListBullets,
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
  ordersByStatus: { status: string; count: number }[];
  ordersByPayment: { method: string; count: number; total: number }[];
  topProducts: { sku: string; name: string; quantity: number }[];
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

// Country centroids for map markers
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

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#6366f1',
  PICKING: '#8b5cf6',
  PICKED: '#a78bfa',
  PACKING: '#06b6d4',
  PACKED: '#14b8a6',
  SHIPPED: '#10b981',
  DELIVERED: '#22c55e',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
  ON_HOLD: '#f97316',
};

/* ─── Helpers ────────────────────────────────────────── */

function countryFlag(code: string): string {
  return code.toUpperCase().split('').map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function aggregateBars(data: { date: string; total: number; orders: number }[], period: string): { label: string; total: number; orders: number; date: string }[] {
  if (period === '7d' || period === '30d') {
    return data.map((d) => ({
      label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: d.total,
      orders: d.orders,
      date: d.date,
    }));
  }
  const buckets: Record<string, { total: number; orders: number; date: string }> = {};
  for (const d of data) {
    const dt = new Date(d.date + 'T00:00:00');
    const key = period === 'year'
      ? dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : `W${getISOWeek(dt)}`;
    if (!buckets[key]) buckets[key] = { total: 0, orders: 0, date: d.date };
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

function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toFixed(0);
}

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

/* ─── Interactive Bar Chart ──────────────────────────── */

interface BarData { label: string; total: number; orders: number; date: string }

function BarChart({ bars, currency }: { bars: BarData[]; currency: string }) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);

  if (!bars.length) return null;

  const W = 800;
  const H = 200;
  const pad = { t: 12, r: 12, b: 32, l: 48 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const maxVal = Math.max(...bars.map((b) => b.total), 1);
  const gap = cw / bars.length;
  const barW = Math.max(Math.min(gap * 0.65, 24), 3);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(Math.ceil(bars.length / 8), 1);

  const hoveredBar = hover ? bars[hover.idx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid lines */}
        {yTicks.map((pct) => {
          const y = pad.t + ch * (1 - pct);
          return (
            <line key={pct} x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray={pct === 0 ? undefined : '4 4'} />
          );
        })}
        {/* Bars + hover regions */}
        {bars.map((b, i) => {
          const x = pad.l + i * gap + (gap - barW) / 2;
          const barH = Math.max((b.total / maxVal) * ch, b.total > 0 ? 2 : 0);
          const y = pad.t + ch - barH;
          const isHovered = hover?.idx === i;
          return (
            <g key={i}>
              {/* Invisible hover region */}
              <rect
                x={pad.l + i * gap}
                y={pad.t}
                width={gap}
                height={ch}
                fill="transparent"
                onMouseEnter={(e) => {
                  const svg = (e.target as SVGRectElement).closest('svg')!;
                  const rect = svg.getBoundingClientRect();
                  const px = ((pad.l + i * gap + gap / 2) / W) * rect.width;
                  setHover({ idx: i, x: px, y: 0 });
                }}
              />
              {isHovered && (
                <rect x={pad.l + i * gap} y={pad.t} width={gap} height={ch} fill="#6366f1" opacity="0.04" rx="2" />
              )}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={barW > 6 ? 3 : 1.5}
                fill={isHovered ? '#4f46e5' : '#6366f1'}
                opacity={isHovered ? '1' : '0.8'}
                className="transition-all duration-100"
              />
            </g>
          );
        })}
        {/* Y-axis labels */}
        {yTicks.map((pct) => {
          const y = pad.t + ch * (1 - pct);
          return (
            <text key={pct} x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{fmtNum(maxVal * pct)}</text>
          );
        })}
        {/* X-axis labels */}
        {bars.map((b, i) => {
          if (i % labelStep !== 0 && i !== bars.length - 1) return null;
          const x = pad.l + i * gap + gap / 2;
          return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">{b.label}</text>;
        })}
      </svg>
      {/* Tooltip */}
      {hoveredBar && hover && (
        <div
          className="absolute top-0 pointer-events-none z-10"
          style={{ left: hover.x, transform: 'translateX(-50%)' }}
        >
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground">{fmtMoney(hoveredBar.total, currency)}</p>
            <p className="text-muted-foreground">{hoveredBar.orders} orders &middot; {hoveredBar.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Interactive Orders-per-day Line Chart ──────────── */

function OrdersChart({ bars, currency }: { bars: BarData[]; currency: string }) {
  const [hover, setHover] = useState<{ idx: number; x: number } | null>(null);
  if (!bars.length) return null;

  const W = 800;
  const H = 200;
  const pad = { t: 12, r: 12, b: 32, l: 36 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const maxVal = Math.max(...bars.map((b) => b.orders), 1);
  const gap = cw / Math.max(bars.length - 1, 1);
  const yTicks = [0, 0.5, 1];
  const labelStep = Math.max(Math.ceil(bars.length / 8), 1);

  const points = bars.map((b, i) => {
    const x = pad.l + i * gap;
    const y = pad.t + ch - (b.orders / maxVal) * ch;
    return { x, y };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.t + ch} L ${points[0].x} ${pad.t + ch} Z`;

  const hoveredBar = hover ? bars[hover.idx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((pct) => {
          const y = pad.t + ch * (1 - pct);
          return <line key={pct} x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray={pct === 0 ? undefined : '4 4'} />;
        })}
        <path d={areaD} fill="url(#orders-area-grad)" />
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="orders-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Hover dots + regions */}
        {points.map((p, i) => {
          const isHovered = hover?.idx === i;
          const halfGap = gap / 2;
          return (
            <g key={i}>
              <rect
                x={p.x - halfGap}
                y={pad.t}
                width={gap}
                height={ch}
                fill="transparent"
                onMouseEnter={(e) => {
                  const svg = (e.target as SVGRectElement).closest('svg')!;
                  const rect = svg.getBoundingClientRect();
                  const px = (p.x / W) * rect.width;
                  setHover({ idx: i, x: px });
                }}
              />
              {isHovered && (
                <>
                  <line x1={p.x} y1={pad.t} x2={p.x} y2={pad.t + ch} stroke="#8b5cf6" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx={p.x} cy={p.y} r="4" fill="#8b5cf6" />
                  <circle cx={p.x} cy={p.y} r="2" fill="white" />
                </>
              )}
            </g>
          );
        })}
        {yTicks.map((pct) => {
          const y = pad.t + ch * (1 - pct);
          return <text key={pct} x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{Math.round(maxVal * pct)}</text>;
        })}
        {bars.map((b, i) => {
          if (i % labelStep !== 0 && i !== bars.length - 1) return null;
          const x = pad.l + i * gap;
          return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">{b.label}</text>;
        })}
      </svg>
      {hoveredBar && hover && (
        <div className="absolute top-0 pointer-events-none z-10" style={{ left: hover.x, transform: 'translateX(-50%)' }}>
          <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground">{hoveredBar.orders} orders</p>
            <p className="text-muted-foreground">{fmtMoney(hoveredBar.total, currency)} &middot; {hoveredBar.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Horizontal Bar Chart (for status/payments) ─────── */

function HorizontalBars({ items, colorMap }: { items: { label: string; value: number; subValue?: string }[]; colorMap?: Record<string, string> }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const color = colorMap?.[item.label.toUpperCase().replace(/ /g, '_')] || '#6366f1';
        return (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-24 shrink-0">
              <p className="text-xs font-medium truncate">{item.label}</p>
            </div>
            <div className="flex-1 h-5 rounded-md bg-muted/40 overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all duration-300"
                style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: color, opacity: 0.75 }}
              />
              <span className="absolute right-2 top-0.5 text-[10px] font-semibold tabular-nums text-foreground">{item.value}</span>
            </div>
            {item.subValue && <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right tabular-nums">{item.subValue}</span>}
          </div>
        );
      })}
    </div>
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
  const configRef = useRef<HTMLDivElement>(null);

  const SECTION_DEFS = [
    { key: 'charts', label: 'Charts', Icon: ChartBar },
    { key: 'breakdowns', label: 'Status / Payments / Products', Icon: ListBullets },
    { key: 'map', label: 'Order Map', Icon: MapPin },
  ];
  const [visibleSections, setVisibleSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('analyticsSections');
      return saved ? JSON.parse(saved) : SECTION_DEFS.map((s) => s.key);
    } catch {
      return SECTION_DEFS.map((s) => s.key);
    }
  });

  const toggleSection = useCallback((key: string) => {
    setVisibleSections((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem('analyticsSections', JSON.stringify(next));
      return next;
    });
  }, []);

  // Close customize dropdown on click outside
  useEffect(() => {
    if (!showCardConfig) return;
    const handler = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) setShowCardConfig(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCardConfig]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/analytics?period=${period}`)
      .then(({ data: res }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const toggleCard = useCallback((key: string) => {
    setVisibleCards((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (next.length === 0) return prev;
      localStorage.setItem('analyticsCards', JSON.stringify(next));
      return next;
    });
  }, []);

  // Build world-map markers
  const mapMarkers = useMemo(() => {
    if (!data) return [];
    return data.ordersByCountry
      .filter((c) => COUNTRY_CENTROIDS[c.country])
      .map((c) => ({
        ...COUNTRY_CENTROIDS[c.country],
        label: COUNTRY_NAMES[c.country] || c.country,
        value: c.count,
        extra: fmtMoney(c.total, data.currency),
      }));
  }, [data]);

  // Aggregate bars for chart
  const chartBars = useMemo(() => {
    if (!data) return [];
    return aggregateBars(data.salesOverTime, period);
  }, [data, period]);

  if (loading && !data) {
    return (
      <div className="space-y-5">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
            <div>
              <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
              <div className="mt-1 h-4 w-44 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        {/* Metric cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded-md bg-muted" />
              <div className="mt-3 h-8 w-full animate-pulse rounded-md bg-muted" />
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border/40">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                <div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-5 py-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="p-3">
                <div className="h-[200px] w-full animate-pulse rounded-lg bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
        {/* Breakdowns skeleton */}
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-5 py-3">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="flex-1 h-5 animate-pulse rounded-md bg-muted/40" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, salesOverTime, ordersByCountry, ordersByStatus, ordersByPayment, topProducts, currency } = data;
  const sparkSales = salesOverTime.map((d) => d.total);
  const sparkOrders = salesOverTime.map((d) => d.orders);
  const sparkAvg = salesOverTime.map((d) => (d.orders > 0 ? d.total / d.orders : 0));

  const periodLabel = PERIODS.find((p) => p.value === period)?.label || period;

  const cardData: Record<string, { value: string; prevValue: string; rawValue: number; rawPrev: number; pct: number; sparkline: number[]; sparkColor: string }> = {
    totalSales: {
      value: fmtMoney(metrics.totalSales.value, metrics.totalSales.currency || currency),
      prevValue: fmtMoney(metrics.totalSales.previous, metrics.totalSales.currency || currency),
      rawValue: metrics.totalSales.value,
      rawPrev: metrics.totalSales.previous,
      pct: pctChange(metrics.totalSales.value, metrics.totalSales.previous),
      sparkline: sparkSales,
      sparkColor: ICON_COLORS.indigo.spark,
    },
    totalOrders: {
      value: metrics.totalOrders.value.toLocaleString(),
      prevValue: metrics.totalOrders.previous.toLocaleString(),
      rawValue: metrics.totalOrders.value,
      rawPrev: metrics.totalOrders.previous,
      pct: pctChange(metrics.totalOrders.value, metrics.totalOrders.previous),
      sparkline: sparkOrders,
      sparkColor: ICON_COLORS.violet.spark,
    },
    avgOrderValue: {
      value: fmtMoney(metrics.avgOrderValue.value, metrics.avgOrderValue.currency || currency),
      prevValue: fmtMoney(metrics.avgOrderValue.previous, metrics.avgOrderValue.currency || currency),
      rawValue: metrics.avgOrderValue.value,
      rawPrev: metrics.avgOrderValue.previous,
      pct: pctChange(metrics.avgOrderValue.value, metrics.avgOrderValue.previous),
      sparkline: sparkAvg,
      sparkColor: ICON_COLORS.emerald.spark,
    },
    itemsSold: {
      value: metrics.itemsSold.value.toLocaleString(),
      prevValue: metrics.itemsSold.previous.toLocaleString(),
      rawValue: metrics.itemsSold.value,
      rawPrev: metrics.itemsSold.previous,
      pct: pctChange(metrics.itemsSold.value, metrics.itemsSold.previous),
      sparkline: [],
      sparkColor: ICON_COLORS.amber.spark,
    },
  };

  const statusItems = ordersByStatus.map((s) => ({
    label: statusLabel(s.status),
    value: s.count,
  }));

  const paymentItems = ordersByPayment.map((p) => ({
    label: p.method,
    value: p.count,
    subValue: fmtMoney(p.total, currency),
  }));

  return (
    <div className="space-y-5">
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
          <div className="relative" ref={configRef}>
            <button
              onClick={() => setShowCardConfig(!showCardConfig)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <GearSix size={14} />
              Customize
            </button>
            {showCardConfig && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-border/60 bg-card shadow-lg">
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Metric Cards</p>
                </div>
                <div className="p-1.5">
                  {CARD_DEFS.map((c) => {
                    const on = visibleCards.includes(c.key);
                    const Icon = c.Icon;
                    return (
                      <button
                        key={c.key}
                        onClick={() => toggleCard(c.key)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        {on ? <Eye size={14} className="text-primary" /> : <EyeSlash size={14} className="text-muted-foreground" />}
                        <Icon size={14} weight="duotone" className={cn(ICON_COLORS[c.color].text)} />
                        <span className={cn('text-xs', on ? 'text-foreground' : 'text-muted-foreground')}>{c.title}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 py-2 border-t border-b border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
                </div>
                <div className="p-1.5">
                  {SECTION_DEFS.map((s) => {
                    const on = visibleSections.includes(s.key);
                    const SIcon = s.Icon;
                    return (
                      <button
                        key={s.key}
                        onClick={() => toggleSection(s.key)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        {on ? <Eye size={14} className="text-primary" /> : <EyeSlash size={14} className="text-muted-foreground" />}
                        <SIcon size={14} weight="duotone" className="text-muted-foreground" />
                        <span className={cn('text-xs', on ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
          const diff = d.rawValue - d.rawPrev;
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
              {/* Previous period comparison */}
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border/40">
                <span className="text-[11px] text-muted-foreground">prev {periodLabel}:</span>
                <span className="text-[11px] font-medium tabular-nums">{d.prevValue}</span>
                <span className={cn('text-[11px] font-semibold tabular-nums ml-auto', isUp && 'text-emerald-600', isDown && 'text-rose-600', !isUp && !isDown && 'text-muted-foreground')}>
                  {diff > 0 ? '+' : ''}{card.isMoney ? fmtMoney(diff, currency) : diff.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row: Sales + Orders ───────────────────── */}
      {visibleSections.includes('charts') && <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sales Over Time</h3>
          </div>
          <div className="p-3">
            {chartBars.length > 1 ? (
              <BarChart bars={chartBars} currency={currency} />
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No data for this period</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Orders Over Time</h3>
          </div>
          <div className="p-3">
            {chartBars.length > 1 ? (
              <OrdersChart bars={chartBars} currency={currency} />
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No data for this period</div>
            )}
          </div>
        </div>
      </div>}

      {/* ── Status + Payments Row ────────────────────────── */}
      {visibleSections.includes('breakdowns') && <div className="grid gap-5 lg:grid-cols-3">
        {/* Orders by Status */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-3 flex items-center gap-2">
            <ShoppingBag size={14} weight="duotone" className="text-violet-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Orders by Status</h3>
          </div>
          <div className="p-4">
            {statusItems.length > 0 ? (
              <HorizontalBars items={statusItems} colorMap={STATUS_COLORS} />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">No data</p>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-3 flex items-center gap-2">
            <CreditCard size={14} weight="duotone" className="text-emerald-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Methods</h3>
          </div>
          <div className="p-4">
            {paymentItems.length > 0 ? (
              <HorizontalBars items={paymentItems} />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">No data</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="border-b border-border/50 px-5 py-3 flex items-center gap-2">
            <Trophy size={14} weight="duotone" className="text-amber-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Products</h3>
          </div>
          <div className="divide-y divide-border/40 max-h-[280px] overflow-y-auto">
            {topProducts.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">No data</p>
            )}
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.sku}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums">{p.quantity} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* ── Order Map (full width) ─────────────────────── */}
      {visibleSections.includes('map') && <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlobeHemisphereWest size={16} weight="duotone" className="text-indigo-600" />
            <h3 className="text-sm font-semibold">Order Map</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {ordersByCountry.reduce((s, c) => s + c.count, 0)} orders from {ordersByCountry.length} {ordersByCountry.length === 1 ? 'country' : 'countries'}
          </span>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="px-4 py-2">
            {mapMarkers.length > 0 ? (
              <WorldMap markers={mapMarkers} markerColor="#6366f1" />
            ) : (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">No geographic data yet</div>
            )}
          </div>
          {/* Inline top countries */}
          <div className="border-l border-border/40">
            <div className="px-4 py-3 border-b border-border/40">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Countries</h4>
            </div>
            <div className="divide-y divide-border/40 max-h-[320px] overflow-y-auto">
              {ordersByCountry.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No data yet</div>
              )}
              {ordersByCountry.slice(0, 10).map((c) => {
                const maxC = ordersByCountry[0]?.count || 1;
                return (
                  <div key={c.country} className="flex items-center gap-2.5 px-4 py-2.5">
                    <span className="text-sm leading-none">{countryFlag(c.country)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{COUNTRY_NAMES[c.country] || c.country}</p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${(c.count / maxC) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-semibold tabular-nums">{c.count}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{fmtMoney(c.total, currency)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
