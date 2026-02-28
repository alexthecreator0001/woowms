import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Book,
  MagnifyingGlass,
  Warehouse,
  Package,
  Barcode,
  HandGrabbing,
  TruckTrailer,
  GearSix,
  ArrowRight,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';

interface HelpTopic {
  icon: React.ElementType;
  title: string;
  description: string;
  route: string;
  color: string;
  iconBg: string;
  iconColor: string;
  comingSoon: boolean;
}

const helpTopics: HelpTopic[] = [
  {
    icon: Warehouse,
    title: 'Warehouse Setup',
    description: 'Learn how zones, aisles, racks, and shelves work',
    route: '/warehouse/guide',
    color: 'blue',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    comingSoon: false,
  },
  {
    icon: Package,
    title: 'Orders & Fulfillment',
    description: 'Managing orders from WooCommerce through picking and shipping',
    route: '/docs',
    color: 'violet',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    comingSoon: true,
  },
  {
    icon: Barcode,
    title: 'Inventory Management',
    description: 'Stock levels, SKU management, and low-stock alerts',
    route: '/docs',
    color: 'emerald',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    comingSoon: true,
  },
  {
    icon: HandGrabbing,
    title: 'Picking & Packing',
    description: 'Pick lists, wave picking, and packing workflows',
    route: '/docs',
    color: 'amber',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    comingSoon: true,
  },
  {
    icon: TruckTrailer,
    title: 'Receiving & Purchase Orders',
    description: 'Inbound shipments, PO management, and receiving workflows',
    route: '/docs',
    color: 'orange',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600',
    comingSoon: true,
  },
  {
    icon: GearSix,
    title: 'Settings & Integrations',
    description: 'Account settings, team management, and WooCommerce sync configuration',
    route: '/docs',
    color: 'gray',
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-600',
    comingSoon: true,
  },
];

interface QuickLink {
  label: string;
  route: string;
}

const quickLinks: QuickLink[] = [
  { label: 'Create a Warehouse', route: '/warehouse' },
  { label: 'Import Products', route: '/inventory' },
  { label: 'Create Purchase Order', route: '/receiving/new' },
  { label: 'Configure WooCommerce', route: '/settings' },
];

export default function Docs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredTopics = helpTopics.filter((topic) =>
    topic.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Book size={22} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Learn how to use PickNPack to manage your warehouse
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search help topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'w-full rounded-xl border border-border/60 bg-card py-2.5 pl-10 pr-4',
            'text-sm placeholder:text-muted-foreground/60',
            'outline-none ring-0 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
            'transition-all'
          )}
        />
      </div>

      {/* Help Topic Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.title}
              type="button"
              onClick={() => navigate(topic.route)}
              className={cn(
                'relative rounded-xl border border-border/60 bg-card p-5 text-left',
                'cursor-pointer transition-all hover:shadow-md hover:border-primary/30'
              )}
            >
              {topic.comingSoon && (
                <span className="absolute top-3 right-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Coming Soon
                </span>
              )}
              <div
                className={cn(
                  'mb-3 flex h-10 w-10 items-center justify-center rounded-lg',
                  topic.iconBg
                )}
              >
                <Icon size={20} weight="duotone" className={topic.iconColor} />
              </div>
              <p className="text-sm font-semibold">{topic.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{topic.description}</p>
            </button>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <div className="rounded-xl border border-border/60 bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No help topics match your search.
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Links</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => navigate(link.route)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card',
                'px-3.5 py-1.5 text-xs font-medium text-foreground',
                'transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
              )}
            >
              {link.label}
              <ArrowRight size={12} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
