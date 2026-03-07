import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  User,
  UsersThree,
  Storefront,
  Warning,
  Table,
  Buildings,
  ArrowLeft,
  CaretRight,
  BellSimple,
  ArrowsLeftRight,
  Package,
  Ruler,
  TruckTrailer,
  Lightning,
  Tag,
  FileText,
  DeviceMobile,
  Barcode,
  PaintBrush,
  ListMagnifyingGlass,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { TokenPayload } from '../../types';
import AccountSection from './AccountSection';
import TeamSection from './TeamSection';
import WooCommerceSection from './WooCommerceSection';
import DangerZoneSection from './DangerZoneSection';
import TableConfigSection from './TableConfigSection';
import BrandingSection from './BrandingSection';
import NotificationsSection from './NotificationsSection';
import OrderWorkflowSection from './OrderWorkflowSection';
import InventoryDefaultsSection from './InventoryDefaultsSection';
import UnitsSection from './UnitsSection';
import ShippingSection from './ShippingSection';
import TagsSection from './TagsSection';
import DocumentsSection from './DocumentsSection';
import RulesSection from './RulesSection';
import MobileAppSection from './MobileAppSection';
import BinsSection from './BinsSection';
import AppearanceSection from './AppearanceSection';
import CycleCountSection from './CycleCountSection';

function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

interface SettingsCard {
  slug: string;
  title: string;
  description: string;
  icon: PhosphorIcon;
  group: string;
  adminOnly?: boolean;
  danger?: boolean;
  component: React.ComponentType;
}

const cards: SettingsCard[] = [
  { slug: 'account', title: 'Personal details', description: 'Name, email, and password.', icon: User, group: 'Personal settings', component: AccountSection },
  { slug: 'tables', title: 'Table preferences', description: 'Configure visible columns in orders and inventory.', icon: Table, group: 'Personal settings', component: TableConfigSection },
  { slug: 'notifications', title: 'Notifications', description: 'Alerts, badges, and default filters.', icon: BellSimple, group: 'Personal settings', component: NotificationsSection },
  { slug: 'appearance', title: 'Appearance', description: 'Theme and display preferences.', icon: PaintBrush, group: 'Personal settings', component: AppearanceSection },
  { slug: 'branding', title: 'Business', description: 'Company name, address, and contact details.', icon: Buildings, group: 'Account settings', adminOnly: true, component: BrandingSection },
  { slug: 'team', title: 'Team and security', description: 'Team members, roles, and permissions.', icon: UsersThree, group: 'Account settings', adminOnly: true, component: TeamSection },
  { slug: 'danger-zone', title: 'Danger zone', description: 'Delete account and all data.', icon: Warning, group: 'Account settings', adminOnly: true, danger: true, component: DangerZoneSection },
  { slug: 'order-workflow', title: 'Order workflow', description: 'Map WooCommerce statuses to WMS statuses.', icon: ArrowsLeftRight, group: 'Warehouse settings', adminOnly: true, component: OrderWorkflowSection },
  { slug: 'inventory-defaults', title: 'Inventory defaults', description: 'Low stock threshold and stock sync.', icon: Package, group: 'Warehouse settings', adminOnly: true, component: InventoryDefaultsSection },
  { slug: 'units', title: 'Units & measurements', description: 'Unit system and pallet type defaults.', icon: Ruler, group: 'Warehouse settings', adminOnly: true, component: UnitsSection },
  { slug: 'bins', title: 'Bins & Labels', description: 'Default bin size, label printing, and bin properties.', icon: Barcode, group: 'Warehouse settings', adminOnly: true, component: BinsSection },
  { slug: 'tags', title: 'Tags', description: 'Create and manage order tags.', icon: Tag, group: 'Warehouse settings', adminOnly: true, component: TagsSection },
  { slug: 'documents', title: 'Documents', description: 'Document templates, branding colors, and stamps.', icon: FileText, group: 'Warehouse settings', adminOnly: true, component: DocumentsSection },
  { slug: 'rules', title: 'Rules', description: 'Automate order actions, customer tags, and free gifts.', icon: Lightning, group: 'Warehouse settings', adminOnly: true, component: RulesSection },
  { slug: 'mobile-app', title: 'Mobile App', description: 'Picking mode, barcode rules, and mobile modules.', icon: DeviceMobile, group: 'Warehouse settings', adminOnly: true, component: MobileAppSection },
  { slug: 'cycle-counts', title: 'Cycle Counts', description: 'Default blind count and count type preferences.', icon: ListMagnifyingGlass, group: 'Warehouse settings', adminOnly: true, component: CycleCountSection },
  { slug: 'shipping', title: 'Shipping & Labels', description: 'Shipping provider, carrier mapping, and label printing.', icon: TruckTrailer, group: 'Integrations', adminOnly: true, component: ShippingSection },
  { slug: 'woocommerce', title: 'WooCommerce', description: 'Store connections and sync settings.', icon: Storefront, group: 'Integrations', component: WooCommerceSection },
];

export default function SettingsPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ADMIN';

  const [search, setSearch] = useState('');

  const visibleCards = cards.filter((c) => !c.adminOnly || isAdmin);

  // Filter by search query
  const q = search.toLowerCase().trim();
  const filteredCards = q
    ? visibleCards.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      )
    : visibleCards;
  const groups = [...new Set(filteredCards.map((c) => c.group))];

  // If a section is active via URL, show its content
  if (section) {
    const card = cards.find((c) => c.slug === section);
    if (!card || (card.adminOnly && !isAdmin)) {
      navigate('/settings', { replace: true });
      return null;
    }
    const SectionComponent = card.component;
    return (
      <div className="space-y-6">
        <div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Settings
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{card.title}</h1>
        </div>
        <SectionComponent />
      </div>
    );
  }

  // Group color styles
  const groupStyles: Record<string, { bg: string; icon: string; dot: string }> = {
    'Personal settings':  { bg: 'bg-blue-500/10',    icon: 'text-blue-500',    dot: 'bg-blue-500' },
    'Account settings':   { bg: 'bg-violet-500/10',  icon: 'text-violet-500',  dot: 'bg-violet-500' },
    'Warehouse settings': { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', dot: 'bg-emerald-500' },
    'Integrations':       { bg: 'bg-amber-500/10',   icon: 'text-amber-500',   dot: 'bg-amber-500' },
  };

  // Settings overview — card grid
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account, team, and integrations.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      </div>

      {q && filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MagnifyingGlass size={40} weight="duotone" className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No settings found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
        </div>
      )}

      {groups.map((group) => {
        const gs = groupStyles[group] || groupStyles['Personal settings'];
        return (
          <div key={group}>
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <span className={cn('h-2 w-2 rounded-full', gs.dot)} />
              {group}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCards
                .filter((c) => c.group === group)
                .map((card) => {
                  const Icon = card.icon;
                  const iconBg = card.danger ? 'bg-red-500/10' : gs.bg;
                  const iconColor = card.danger ? 'text-red-500' : gs.icon;
                  return (
                    <Link
                      key={card.slug}
                      to={`/settings/${card.slug}`}
                      className={cn(
                        'flex items-start gap-3.5 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-border hover:bg-muted/30 hover:shadow-md',
                        card.danger ? 'border-red-200/60' : 'border-border/60'
                      )}
                    >
                      <div className={cn(
                        'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                        iconBg
                      )}>
                        <Icon
                          size={18}
                          weight="duotone"
                          className={iconColor}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-semibold', card.danger && 'text-red-600')}>
                          {card.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                      <CaretRight size={14} className="mt-1 flex-shrink-0 text-muted-foreground/40" />
                    </Link>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
