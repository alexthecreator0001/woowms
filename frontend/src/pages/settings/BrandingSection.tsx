import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  CircleNotch,
  Check,
  UploadSimple,
  Trash,
  ImageSquare,
  Buildings,
  Envelope,
  Phone,
  IdentificationBadge,
  Globe,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import api from '../../services/api';

const MAX_FILE_SIZE = 512 * 1024; // 512KB

export default function BrandingSection() {
  // --- Company name (saved via /account/branding) ---
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // --- Logo ---
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');
  const logoFileRef = useRef<HTMLInputElement>(null);

  // --- Business details (all saved together via tenant-settings) ---
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyVatId, setCompanyVatId] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState('');

  // --- Load data ---
  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/account/tenant-settings'),
    ]).then(([meRes, settingsRes]) => {
      setCompanyName(meRes.data.data.tenantName || '');
      if (meRes.data.data.logoUrl) setLogoUrl(meRes.data.data.logoUrl);
      const s = settingsRes.data.data || {};
      if (s.companyAddress) setCompanyAddress(s.companyAddress);
      if (s.companyEmail) setCompanyEmail(s.companyEmail);
      if (s.companyPhone) setCompanyPhone(s.companyPhone);
      if (s.companyVatId) setCompanyVatId(s.companyVatId);
      if (s.companyWebsite) setCompanyWebsite(s.companyWebsite);
    }).catch(() => {});
  }, []);

  // --- Company name handler ---
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

  // --- Logo handlers ---
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoMsg('Please select an image file');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setLogoMsg('Logo must be under 512KB');
      return;
    }
    setLogoUploading(true);
    setLogoMsg('');
    try {
      const dataUrl = await resizeImage(file, 200);
      await api.patch('/account/tenant-settings', { logoUrl: dataUrl });
      setLogoUrl(dataUrl);
      setLogoMsg('Logo saved');
      setTimeout(() => setLogoMsg(''), 2000);
    } catch {
      setLogoMsg('Failed to upload logo');
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
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

  // --- Business details handler ---
  const handleDetailsSave = async () => {
    setDetailsSaving(true);
    setDetailsMsg('');
    try {
      await api.patch('/account/tenant-settings', {
        companyAddress,
        companyEmail,
        companyPhone,
        companyVatId,
        companyWebsite,
      });
      setDetailsMsg('Saved');
      setTimeout(() => setDetailsMsg(''), 2000);
    } catch {
      setDetailsMsg('Failed to save');
    } finally {
      setDetailsSaving(false);
    }
  };

  const initial = (companyName || 'P').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Company name ── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Company name</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Displayed in the sidebar and used across the app for all team members.
          </p>
        </div>
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

      {/* ── Business details ── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Buildings size={16} weight="duotone" className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Business details</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Contact information and tax details used on purchase orders and documents.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Address */}
          <div>
            <label htmlFor="companyAddress" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Buildings size={13} />
              Address
            </label>
            <textarea
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={3}
              placeholder={"123 Warehouse Blvd\nSuite 200\nNew York, NY 10001"}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="companyEmail" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Envelope size={13} />
                Email
              </label>
              <input
                id="companyEmail"
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="orders@acme.com"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="companyPhone" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Phone size={13} />
                Phone
              </label>
              <input
                id="companyPhone"
                type="tel"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* VAT ID + Website row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="companyVatId" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <IdentificationBadge size={13} />
                VAT / Tax ID
              </label>
              <input
                id="companyVatId"
                type="text"
                value={companyVatId}
                onChange={(e) => setCompanyVatId(e.target.value)}
                placeholder="US123456789"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="companyWebsite" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Globe size={13} />
                Website
              </label>
              <input
                id="companyWebsite"
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://acme.com"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={detailsSaving}
              onClick={handleDetailsSave}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {detailsSaving ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : detailsMsg === 'Saved' ? (
                <>
                  <Check size={14} />
                  Saved
                </>
              ) : (
                'Save details'
              )}
            </button>
            {detailsMsg && detailsMsg !== 'Saved' && (
              <span className="text-xs text-destructive">{detailsMsg}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Logo upload ── */}
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
                  onClick={() => logoFileRef.current?.click()}
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
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/20 bg-background px-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:opacity-50"
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
            ref={logoFileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </div>
      </div>

      {/* ── Sidebar preview ── */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/40 px-6 py-4">
          <h3 className="text-sm font-semibold">Sidebar preview</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How your company appears in the navigation sidebar.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="inline-flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
                {initial}
              </div>
            )}
            <span className="text-[13px] font-semibold text-foreground">{companyName || 'PickNPack'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Resize image to maxDim and return a PNG data URL */
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
