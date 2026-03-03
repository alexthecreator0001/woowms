import { useEffect, useState } from 'react';
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

// ~80 reference dots forming a recognizable world map
const COUNTRY_POINTS: { code: string; lat: number; lng: number }[] = [
  // North America
  { code: 'CA', lat: 62, lng: -110 }, { code: 'CA', lat: 53, lng: -80 },
  { code: 'US', lat: 47, lng: -120 }, { code: 'US', lat: 39, lng: -105 }, { code: 'US', lat: 38, lng: -85 }, { code: 'US', lat: 33, lng: -112 }, { code: 'US', lat: 30, lng: -95 }, { code: 'US', lat: 40, lng: -74 },
  { code: 'MX', lat: 23, lng: -102 }, { code: 'MX', lat: 19, lng: -99 },
  { code: 'GT', lat: 14, lng: -90 }, { code: 'CR', lat: 10, lng: -84 }, { code: 'CU', lat: 22, lng: -79 },
  { code: 'GL', lat: 72, lng: -42 },
  // South America
  { code: 'CO', lat: 4, lng: -74 }, { code: 'VE', lat: 6, lng: -66 },
  { code: 'BR', lat: -3, lng: -60 }, { code: 'BR', lat: -15, lng: -47 }, { code: 'BR', lat: -23, lng: -43 },
  { code: 'PE', lat: -12, lng: -77 }, { code: 'CL', lat: -33, lng: -71 }, { code: 'AR', lat: -34, lng: -58 }, { code: 'AR', lat: -43, lng: -65 },
  // Europe
  { code: 'IS', lat: 65, lng: -19 }, { code: 'IE', lat: 53, lng: -8 }, { code: 'GB', lat: 54, lng: -2 },
  { code: 'PT', lat: 39, lng: -8 }, { code: 'ES', lat: 40, lng: -4 }, { code: 'FR', lat: 46, lng: 2 },
  { code: 'BE', lat: 51, lng: 4 }, { code: 'NL', lat: 52, lng: 5 }, { code: 'DE', lat: 51, lng: 10 },
  { code: 'CH', lat: 47, lng: 8 }, { code: 'AT', lat: 47, lng: 14 }, { code: 'IT', lat: 42, lng: 12 },
  { code: 'CZ', lat: 50, lng: 15 }, { code: 'SK', lat: 48, lng: 19 }, { code: 'PL', lat: 52, lng: 20 },
  { code: 'HU', lat: 47, lng: 19 }, { code: 'RO', lat: 46, lng: 25 }, { code: 'BG', lat: 42, lng: 25 },
  { code: 'HR', lat: 45, lng: 16 }, { code: 'RS', lat: 44, lng: 21 }, { code: 'GR', lat: 39, lng: 22 },
  { code: 'NO', lat: 60, lng: 8 }, { code: 'SE', lat: 60, lng: 18 }, { code: 'FI', lat: 61, lng: 26 },
  { code: 'DK', lat: 56, lng: 10 }, { code: 'EE', lat: 59, lng: 25 }, { code: 'LV', lat: 57, lng: 25 },
  { code: 'LT', lat: 55, lng: 24 }, { code: 'UA', lat: 49, lng: 32 },
  // Russia / CIS
  { code: 'RU', lat: 56, lng: 38 }, { code: 'RU', lat: 55, lng: 73 }, { code: 'RU', lat: 56, lng: 105 }, { code: 'RU', lat: 62, lng: 134 },
  { code: 'KZ', lat: 48, lng: 68 },
  // Middle East
  { code: 'TR', lat: 39, lng: 35 }, { code: 'IL', lat: 31, lng: 35 }, { code: 'SA', lat: 24, lng: 45 }, { code: 'AE', lat: 24, lng: 54 }, { code: 'IQ', lat: 33, lng: 44 },
  // Africa
  { code: 'MA', lat: 32, lng: -5 }, { code: 'DZ', lat: 28, lng: 2 }, { code: 'EG', lat: 27, lng: 30 },
  { code: 'NG', lat: 10, lng: 8 }, { code: 'KE', lat: -1, lng: 38 }, { code: 'TZ', lat: -6, lng: 35 },
  { code: 'ZA', lat: -29, lng: 24 }, { code: 'CD', lat: -3, lng: 24 },
  // Asia
  { code: 'PK', lat: 30, lng: 69 }, { code: 'IN', lat: 20, lng: 78 }, { code: 'IN', lat: 28, lng: 77 },
  { code: 'BD', lat: 24, lng: 90 }, { code: 'TH', lat: 15, lng: 101 }, { code: 'VN', lat: 16, lng: 108 },
  { code: 'MY', lat: 4, lng: 102 }, { code: 'SG', lat: 1, lng: 104 }, { code: 'PH', lat: 13, lng: 122 },
  { code: 'ID', lat: -2, lng: 118 }, { code: 'CN', lat: 35, lng: 105 }, { code: 'CN', lat: 31, lng: 121 },
  { code: 'KR', lat: 36, lng: 128 }, { code: 'JP', lat: 36, lng: 140 }, { code: 'TW', lat: 24, lng: 121 },
  { code: 'MN', lat: 48, lng: 107 },
  // Oceania
  { code: 'AU', lat: -25, lng: 134 }, { code: 'AU', lat: -33, lng: 151 }, { code: 'NZ', lat: -41, lng: 174 },
];

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
  KE: 'Kenya', TZ: 'Tanzania', ZA: 'South Africa', CD: 'DR Congo',
  IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', CN: 'China',
  JP: 'Japan', KR: 'South Korea', TW: 'Taiwan',
  TH: 'Thailand', VN: 'Vietnam', MY: 'Malaysia', SG: 'Singapore',
  PH: 'Philippines', ID: 'Indonesia', MN: 'Mongolia',
  AU: 'Australia', NZ: 'New Zealand',
  GT: 'Guatemala', CR: 'Costa Rica', CU: 'Cuba', PA: 'Panama',
  GL: 'Greenland', JM: 'Jamaica',
};

/* ─── Helpers ────────────────────────────────────────── */

function project(lat: number, lng: number): [number, number] {
  return [10 + ((lng + 180) / 360) * 780, 10 + ((90 - lat) / 180) * 380];
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
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

/* ─── Sales Chart ────────────────────────────────────── */

function SalesChart({ data, currency }: { data: { date: string; total: number; orders: number }[]; currency: string }) {
  if (!data.length) return null;

  const W = 800;
  const H = 280;
  const pad = { t: 20, r: 16, b: 36, l: 56 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  const points = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.t + ch - (d.total / maxVal) * ch,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(pad.t + ch).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.t + ch).toFixed(1)} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  // X-axis labels — show ~6 evenly spaced
  const step = Math.max(Math.floor(data.length / 6), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((pct) => {
        const y = pad.t + ch * (1 - pct);
        return <line key={pct} x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray={pct === 0 ? undefined : '4 4'} />;
      })}

      {/* Area + Line */}
      <path d={areaPath} fill="url(#chart-area)" />
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots at data points (show for < 60 points) */}
      {data.length <= 60 &&
        points.map((p, i) =>
          data[i].total > 0 ? <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#6366f1" /> : null
        )}

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
      {data.map((d, i) =>
        i % step === 0 || i === data.length - 1 ? (
          <text key={d.date} x={points[i].x} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">
            {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ─── World Map ──────────────────────────────────────── */

function WorldMap({ ordersByCountry }: { ordersByCountry: { country: string; count: number; total: number }[] }) {
  const countryMap = new Map(ordersByCountry.map((c) => [c.country, c]));
  const maxCount = Math.max(...ordersByCountry.map((c) => c.count), 1);

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Background grid dots for visual texture */}
      {Array.from({ length: 40 }, (_, row) =>
        Array.from({ length: 80 }, (_, col) => (
          <circle key={`g${row}-${col}`} cx={col * 10 + 5} cy={row * 10 + 5} r="0.5" fill="#334155" opacity="0.3" />
        ))
      )}

      {/* Country reference dots */}
      {COUNTRY_POINTS.map((pt, i) => {
        const [x, y] = project(pt.lat, pt.lng);
        const data = countryMap.get(pt.code);
        const isActive = !!data;
        const scale = isActive ? Math.min(3 + (data!.count / maxCount) * 9, 12) : 2;
        const opacity = isActive ? 0.7 + (data!.count / maxCount) * 0.3 : 0.12;
        return (
          <g key={i}>
            {isActive && (
              <circle cx={x} cy={y} r={scale + 4} fill="#818cf8" opacity="0.15">
                <animate attributeName="r" values={`${scale + 2};${scale + 8};${scale + 2}`} dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.15;0.05;0.15" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={scale} fill={isActive ? '#818cf8' : '#475569'} opacity={opacity} />
            {isActive && data!.count > 2 && (
              <text x={x} y={y - scale - 4} textAnchor="middle" fontSize="8" fill="#c7d2fe" fontWeight="600">
                {data!.count}
              </text>
            )}
          </g>
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
      if (next.length === 0) return prev; // at least 1
      localStorage.setItem('analyticsCards', JSON.stringify(next));
      return next;
    });
  };

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

      {/* ── Sales Chart ────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-6 py-4">
          <h3 className="text-sm font-semibold">Sales Over Time</h3>
        </div>
        <div className="p-4">
          {salesOverTime.length > 1 ? (
            <SalesChart data={salesOverTime} currency={currency} />
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">No data for this period</div>
          )}
        </div>
      </div>

      {/* ── Map + Top Countries ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-slate-900 shadow-sm overflow-hidden">
          <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GlobeHemisphereWest size={16} weight="duotone" className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Order Map</h3>
            </div>
            <span className="text-xs text-slate-400">
              {ordersByCountry.reduce((s, c) => s + c.count, 0)} orders from {ordersByCountry.length} {ordersByCountry.length === 1 ? 'country' : 'countries'}
            </span>
          </div>
          <div className="p-4">
            {ordersByCountry.length > 0 ? (
              <WorldMap ordersByCountry={ordersByCountry} />
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
            {ordersByCountry.slice(0, 10).map((c, i) => {
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
