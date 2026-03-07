import { useState, useMemo } from 'react';
import {
  X,
  DownloadSimple,
  CircleNotch,
  CheckSquare,
  Square,
  CheckSquareOffset,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { downloadCsv } from '../services/api';

export interface CsvExportColumn {
  key: string;
  label: string;
  default?: boolean;
}

interface CsvExportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: CsvExportColumn[];
  endpoint: string;
  filename: string;
  extraParams?: Record<string, string>;
}

type Delimiter = 'comma' | 'tab' | 'semicolon';
type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';

export default function CsvExportModal({
  open,
  onClose,
  title,
  columns,
  endpoint,
  filename,
  extraParams,
}: CsvExportModalProps) {
  const defaultSelected = useMemo(
    () => columns.filter((c) => c.default !== false).map((c) => c.key),
    [columns]
  );
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [delimiter, setDelimiter] = useState<Delimiter>('comma');
  const [dateFormat, setDateFormat] = useState<DateFormat>('YYYY-MM-DD');
  const [exporting, setExporting] = useState(false);

  const allSelected = selected.length === columns.length;
  const noneSelected = selected.length === 0;

  function toggleAll() {
    setSelected(allSelected ? [] : columns.map((c) => c.key));
  }

  function toggleColumn(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleExport() {
    if (noneSelected) return;
    try {
      setExporting(true);
      const params: Record<string, string> = {
        columns: selected.join(','),
        delimiter,
        dateFormat,
        ...extraParams,
      };
      await downloadCsv(endpoint, filename, params);
      onClose();
    } catch {
      // download errors are rare — silently ignore
    } finally {
      setExporting(false);
    }
  }

  function handleClose() {
    setSelected(defaultSelected);
    setDelimiter('comma');
    setDateFormat('YYYY-MM-DD');
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <DownloadSimple size={18} weight="bold" className="text-primary" />
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Column Selection */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Columns
              </p>
              <button
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                {allSelected ? (
                  <CheckSquareOffset size={14} weight="bold" />
                ) : (
                  <CheckSquare size={14} weight="bold" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border/50 bg-muted/20 p-2">
              <div className="grid grid-cols-2 gap-0.5">
                {columns.map((col) => {
                  const checked = selected.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                        checked
                          ? 'text-foreground'
                          : 'text-muted-foreground/60'
                      )}
                    >
                      {checked ? (
                        <CheckSquare
                          size={15}
                          weight="fill"
                          className="flex-shrink-0 text-primary"
                        />
                      ) : (
                        <Square
                          size={15}
                          weight="regular"
                          className="flex-shrink-0 text-muted-foreground/40"
                        />
                      )}
                      <span className="truncate text-[13px]">{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground/60">
              {selected.length} of {columns.length} columns selected
            </p>
          </div>

          {/* Format Options */}
          <div className="grid grid-cols-2 gap-4">
            {/* Delimiter */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Delimiter
              </p>
              <div className="space-y-1">
                {([
                  { value: 'comma', label: 'Comma (,)' },
                  { value: 'tab', label: 'Tab' },
                  { value: 'semicolon', label: 'Semicolon (;)' },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                        delimiter === opt.value
                          ? 'border-primary'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {delimiter === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[13px]',
                        delimiter === opt.value
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Format */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date Format
              </p>
              <div className="space-y-1">
                {([
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                ] as const).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                        dateFormat === opt.value
                          ? 'border-primary'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {dateFormat === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[13px]',
                        dateFormat === opt.value
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button
            onClick={handleClose}
            className="h-9 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={noneSelected || exporting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting && <CircleNotch size={14} className="animate-spin" />}
            <DownloadSimple size={14} weight="bold" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
