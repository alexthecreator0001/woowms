import { useState } from 'react';
import {
  User,
  UsersThree,
  Storefront,
  Warning,
} from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { TokenPayload } from '../../types';
import AccountSection from './AccountSection';
import TeamSection from './TeamSection';
import WooCommerceSection from './WooCommerceSection';
import DangerZoneSection from './DangerZoneSection';

function getTokenPayload(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

type Tab = 'account' | 'team' | 'woocommerce' | 'danger';

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const tabs: TabDef[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'team', label: 'Team', icon: UsersThree, adminOnly: true },
  { id: 'woocommerce', label: 'WooCommerce', icon: Storefront },
  { id: 'danger', label: 'Danger Zone', icon: Warning, adminOnly: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ADMIN';

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, team, and integrations.
        </p>
      </div>

      {/* Tab navigation — segmented control */}
      <div className="inline-flex items-center gap-1 rounded-lg bg-muted/60 p-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className="h-4 w-4"
                weight={isActive ? 'fill' : 'regular'}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'account' && <AccountSection />}
      {activeTab === 'team' && isAdmin && <TeamSection />}
      {activeTab === 'woocommerce' && <WooCommerceSection />}
      {activeTab === 'danger' && isAdmin && <DangerZoneSection />}
    </div>
  );
}
