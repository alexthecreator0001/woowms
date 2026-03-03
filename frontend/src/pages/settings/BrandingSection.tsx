import { useState, useEffect, useRef, type FormEvent } from 'react';
import { CircleNotch, Check, UploadSimple, Trash, ImageSquare } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const MAX_LOGO_SIZE = 512 * 1024; // 512KB

const BRAND_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#64748b', label: 'Slate' },
  { value: '#1e293b', label: 'Dark' },
];

export default function BrandingSection() {
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [defaultPoNote, setDefaultPoNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');
  const [colorSaving, setColorSaving] = useState(false);
  const [colorMsg, setColorMsg] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/account/tenant-settings'),
    ]).then(([meRes, settingsRes]) => {
      setCompanyName(meRes.data.data.tenantName || '');
      if (meRes.data.data.logoUrl) setLogoUrl(meRes.data.data.logoUrl);
      const s = settingsRes.data.data || {};
      if (s.brandColor) setBrandColor(s.brandColor);
      if (s.defaultPoNote) setDefaultPoNote(s.defaultPoNote);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      await api.patch('/account/branding', { companyName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to update company name');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoMsg('Please select an image file');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoMsg('Logo must be under 512KB');
      return;
    }

    setLogoUploading(true);
    setLogoMsg('');
    try {
      // Resize to max 200px and convert to WebP data URL
      const dataUrl = await resizeImage(file, 200);
      await api.patch('/account/tenant-settings', { logoUrl: dataUrl });
      setLogoUrl(dataUrl);
      setLogoMsg('Logo saved');
      setTimeout(() => setLogoMsg(''), 2000);
    } catch {
      setLogoMsg('Failed to upload logo');
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeLogo = async () => {
    setLogoUploading(true);
    try {
      await api.patch('/account/tenant-settings', { logoUrl: null });
      setLogoUrl('');
      setLogoMsg('Logo removed');
      setTimeout(() => setLogoMsg(''), 2000);
    } catch {
      setLogoMsg('Failed to remove logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const initial = (companyName || 'P').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Company name */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Company name</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Displayed in the sidebar and used across the app for all team members.
          </p>
        </div>
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <label htmlFor="companyName" className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Acme Inc."
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : saved ? (
                <>
                  <Check size={14} />
                  Saved
                </>
              ) : (
                'Save'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Logo upload */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Company logo</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Displayed in the sidebar and on purchase order PDFs. Max 512KB.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-5">
            {/* Preview */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/20">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded-lg object-contain" />
              ) : (
                <ImageSquare size={28} weight="duotone" className="text-muted-foreground/30" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  {logoUploading ? <CircleNotch size={14} className="animate-spin" /> : <UploadSimple size={14} />}
                  {logoUrl ? 'Change' : 'Upload'}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={logoUploading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-background px-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash size={14} />
                    Remove
                  </button>
                )}
              </div>
              {logoMsg && (
                <p className={cn('mt-2 text-xs', logoMsg.includes('Failed') || logoMsg.includes('must') || logoMsg.includes('Please') ? 'text-destructive' : 'text-emerald-600')}>
                  {logoMsg}
                </p>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </div>
      </div>

      {/* Brand color */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Brand color</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used as accent color on purchase order PDFs (headers, bars, highlights).
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={colorSaving}
                onClick={async () => {
                  setBrandColor(c.value);
                  setColorSaving(true);
                  setColorMsg('');
                  try {
                    await api.patch('/account/tenant-settings', { brandColor: c.value });
                    setColorMsg('Saved');
                    setTimeout(() => setColorMsg(''), 2000);
                  } catch { setColorMsg('Failed'); }
                  finally { setColorSaving(false); }
                }}
                className={cn(
                  'relative h-9 w-9 rounded-full border-2 transition-all',
                  brandColor === c.value ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              >
                {brandColor === c.value && (
                  <Check size={14} weight="bold" className="absolute inset-0 m-auto text-white drop-shadow-sm" />
                )}
              </button>
            ))}
          </div>
          {colorMsg && (
            <p className={cn('mt-2 text-xs', colorMsg === 'Failed' ? 'text-destructive' : 'text-emerald-600')}>{colorMsg}</p>
          )}
        </div>
      </div>

      {/* Default PO note */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Default PO note</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This note is automatically included on every purchase order PDF. E.g. payment terms, delivery instructions.
          </p>
        </div>
        <div className="px-6 py-4">
          <textarea
            value={defaultPoNote}
            onChange={(e) => setDefaultPoNote(e.target.value)}
            rows={3}
            placeholder="e.g. Payment within 30 days. Deliver to warehouse gate B."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={noteSaving}
              onClick={async () => {
                setNoteSaving(true);
                setNoteMsg('');
                try {
                  await api.patch('/account/tenant-settings', { defaultPoNote });
                  setNoteMsg('Saved');
                  setTimeout(() => setNoteMsg(''), 2000);
                } catch { setNoteMsg('Failed'); }
                finally { setNoteSaving(false); }
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {noteSaving ? <CircleNotch size={12} className="animate-spin" /> : 'Save note'}
            </button>
            {noteMsg && (
              <span className={cn('text-xs', noteMsg === 'Failed' ? 'text-destructive' : 'text-emerald-600')}>{noteMsg}</span>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar preview */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Sidebar preview</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How your company appears in the navigation sidebar.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="inline-flex items-center gap-2.5 rounded-lg border border-border/60 bg-[#fafafa] px-3 py-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
                {initial}
              </div>
            )}
            <span className="text-[13px] font-semibold text-[#0a0a0a]">{companyName || 'PickNPack'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Resize image to maxDim and return a data URL */
function resizeImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
