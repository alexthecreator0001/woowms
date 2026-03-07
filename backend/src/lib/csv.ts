import type { Response } from 'express';

export function escapeCsvField(value: unknown, delimiter = ','): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvRow(fields: unknown[], delimiter = ','): string {
  return fields.map((f) => escapeCsvField(f, delimiter)).join(delimiter);
}

export function buildCsv(headers: string[], rows: unknown[][], delimiter = ','): string {
  const bom = '\uFEFF'; // BOM for Excel UTF-8
  const headerRow = buildCsvRow(headers, delimiter);
  const dataRows = rows.map((r) => buildCsvRow(r, delimiter));
  return bom + [headerRow, ...dataRows].join('\r\n');
}

export function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

const DELIMITER_MAP: Record<string, string> = { comma: ',', tab: '\t', semicolon: ';' };

export function resolveDelimiter(raw?: string): string {
  return (raw && DELIMITER_MAP[raw]) || ',';
}

export function formatDate(date: Date | string | null | undefined, format = 'YYYY-MM-DD'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  switch (format) {
    case 'MM/DD/YYYY': return `${m}/${day}/${y}`;
    case 'DD/MM/YYYY': return `${day}/${m}/${y}`;
    default: return `${y}-${m}-${day}`;
  }
}

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (item: T) => unknown;
}

export function filterColumns<T>(
  registry: ColumnDef<T>[],
  requestedKeys?: string
): ColumnDef<T>[] {
  if (!requestedKeys) return registry;
  const keys = requestedKeys.split(',').map((k) => k.trim());
  const filtered = registry.filter((c) => keys.includes(c.key));
  return filtered.length > 0 ? filtered : registry;
}
