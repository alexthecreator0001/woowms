import { useState, useRef, useCallback } from 'react';
import {
  X,
  UploadSimple,
  DownloadSimple,
  File as FileIcon,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Trash,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import api from '../services/api';

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  endpoint: string;
  requiredColumns: string[];
  optionalColumns?: string[];
  templateFilename: string;
  onSuccess: () => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function CsvImportModal({
  open,
  onClose,
  title,
  description,
  endpoint,
  requiredColumns,
  optionalColumns = [],
  templateFilename,
  onSuccess,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setFile(null);
    setResult(null);
    setError('');
    setDragOver(false);
    onClose();
  }, [onClose]);

  function handleFile(f: File) {
    if (!f.name.endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }
    setError('');
    setResult(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      if (data.data.imported > 0) onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Upload failed. Please check your file and try again.');
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate() {
    const allCols = [...requiredColumns, ...optionalColumns];
    const csv = '\uFEFF' + allCols.join(',') + '\r\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = templateFilename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UploadSimple size={18} weight="bold" className="text-primary" />
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Column reference */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {requiredColumns.map((col) => (
                <span key={col} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{col}</span>
              ))}
            </div>
            {optionalColumns.length > 0 && (
              <>
                <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Optional Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {optionalColumns.map((col) => (
                    <span key={col} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{col}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : file
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-border/60 hover:border-primary/40 hover:bg-muted/20'
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileIcon size={24} weight="duotone" className="text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-red-500"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <UploadSimple size={28} weight="duotone" className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Drop your CSV file here, or <span className="text-primary">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Max 5MB</p>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
              <WarningCircle size={16} weight="fill" className="mt-0.5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                <CheckCircle size={18} weight="fill" className="mt-0.5 flex-shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">Import complete</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-emerald-600">
                    <span>{result.imported} imported</span>
                    <span>{result.skipped} skipped</span>
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                  <p className="mb-1.5 text-xs font-semibold text-amber-700">Issues ({result.errors.length})</p>
                  <ul className="space-y-0.5">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-600">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <DownloadSimple size={14} weight="bold" />
            Download Template
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="h-9 rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading && <CircleNotch size={14} className="animate-spin" />}
                Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
