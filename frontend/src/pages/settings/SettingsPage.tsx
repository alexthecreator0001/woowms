import { useState } from 'react';
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

function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

type Section = 'account' | 'branding' | 'team' | 'woocommerce' | 'tables' | 'danger' | 'notifications' | 'orderWorkflow' | 'inventoryDefaults';

interface SettingsCard {
  id: Section;
  title: string;
  description: string;
  icon: PhosphorIcon;
  group: string;
  adminOnly?: boolean;
  danger?: boolean;
}

const cards: SettingsCard[] = [
  { id: 'account', title: 'Personal details', description: 'Name, email, and password.', icon: User, group: 'Personal settings' },
  { id: 'tables', title: 'Table preferences', description: 'Configure visible columns in orders and inventory.', icon: Table, group: 'Personal settings' },
  { id: 'notifications', title: 'Notifications', description: 'Alerts, badges, and default filters.', icon: BellSimple, group: 'Personal settings' },
  { id: 'branding', title: 'Business', description: 'Company name and branding.', icon: Buildings, group: 'Account settings', adminOnly: true },
  { id: 'team', title: 'Team and security', description: 'Team members, roles, and permissions.', icon: UsersThree, group: 'Account settings', adminOnly: true },
  { id: 'danger', title: 'Danger zone', description: 'Delete account and all data.', icon: Warning, group: 'Account settings', adminOnly: true, danger: true },
  { id: 'orderWorkflow', title: 'Order workflow', description: 'Map WooCommerce statuses to WMS statuses.', icon: ArrowsLeftRight, group: 'Warehouse settings', adminOnly: true },
  { id: 'inventoryDefaults', title: 'Inventory defaults', description: 'Low stock threshold and stock sync.', icon: Package, group: 'Warehouse settings', adminOnly: true },
  { id: 'woocommerce', title: 'WooCommerce', description: 'Store connections and sync settings.', icon: Storefront, group: 'Integrations' },
];

export default function SettingsPage() {
  const [active, setActive] = useState<Section | null>(null);
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ADMIN';

  const visibleCards = cards.filter((c) => !c.adminOnly || isAdmin);
  const groups = [...new Set(visibleCards.map((c) => c.group))];

  // If a section is active, show its content
  if (active) {
    const card = cards.find((c) => c.id === active);
    return (
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => setActive(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Settings
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{card?.title}</h1>
        </div>

        {active === 'account' && <AccountSection />}
        {active === 'branding' && isAdmin && <BrandingSection />}
        {active === 'team' && isAdmin && <TeamSection />}
        {active === 'woocommerce' && <WooCommerceSection />}
        {active === 'tables' && <TableConfigSection />}
        {active === 'notifications' && <NotificationsSection />}
        {active === 'orderWorkflow' && isAdmin && <OrderWorkflowSection />}
        {active === 'inventoryDefaults' && isAdmin && <InventoryDefaultsSection />}
        {active === 'danger' && isAdmin && <DangerZoneSection />}
      </div>
    );
  }

  // Settings overview — card grid
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, team, and integrations.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group}>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCards
              .filter((c) => c.group === group)
              .map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActive(card.id)}
                    className={cn(
                      'flex items-start gap-3.5 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-border hover:bg-muted/30 hover:shadow-md',
                      card.danger ? 'border-red-200/60' : 'border-border/60'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                      card.danger ? 'bg-red-500/10' : 'bg-primary/10'
                    )}>
                      <Icon
                        size={18}
                        weight="duotone"
                        className={card.danger ? 'text-red-500' : 'text-primary'}
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
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
