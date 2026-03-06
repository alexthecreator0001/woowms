import type { Response } from 'express';

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvRow(fields: unknown[]): string {
  return fields.map(escapeCsvField).join(',');
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const bom = '\uFEFF'; // BOM for Excel UTF-8
  const headerRow = buildCsvRow(headers);
  const dataRows = rows.map(buildCsvRow);
  return bom + [headerRow, ...dataRows].join('\r\n');
}

export function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}
