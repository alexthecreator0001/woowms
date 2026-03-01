import api from '../services/api';

export interface StatusStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

export interface StatusDef {
  value: string;
  label: string;
  color: string;
}

const BUILT_IN_STYLES: Record<string, StatusStyle> = {
  PENDING: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  PROCESSING: { label: 'Processing', bg: 'bg-sky-500/10', text: 'text-sky-600', dot: 'bg-sky-500' },
  AWAITING_PICK: { label: 'Awaiting Pick', bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  PICKING: { label: 'Picking', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  PICKED: { label: 'Picked', bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  PACKING: { label: 'Packing', bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  SHIPPED: { label: 'Shipped', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-500/10', text: 'text-green-600', dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-400' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', dot: 'bg-sky-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', dot: 'bg-orange-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-600', dot: 'bg-green-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-600', dot: 'bg-red-500' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-600', dot: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', dot: 'bg-cyan-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-600', dot: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500' },
};

export function getStatusStyle(status: string, customStatuses?: StatusDef[]): StatusStyle {
  if (BUILT_IN_STYLES[status]) return BUILT_IN_STYLES[status];

  const custom = customStatuses?.find((s) => s.value === status);
  if (custom) {
    const colors = COLOR_MAP[custom.color] || COLOR_MAP.gray;
    return { label: custom.label, ...colors };
  }

  // Fallback: derive label from value
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-400' };
}

export function getStatusDotBadge(status: string, customStatuses?: StatusDef[]): { dot: string; badge: string } {
  const style = getStatusStyle(status, customStatuses);
  return { dot: style.dot, badge: `${style.bg} ${style.text}` };
}

export async function fetchAllStatuses(): Promise<StatusDef[]> {
  try {
    const { data } = await api.get('/account/custom-statuses');
    return data.data;
  } catch {
    return Object.entries(BUILT_IN_STYLES).map(([value, s]) => ({
      value,
      label: s.label,
      color: 'gray',
    }));
  }
}

export const AVAILABLE_COLORS = Object.keys(COLOR_MAP);
