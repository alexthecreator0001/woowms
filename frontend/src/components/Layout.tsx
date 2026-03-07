import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  SquaresFour,
  ChartLineUp,
  ClockCounterClockwise,
  ShoppingBag,
  Cube,
  Buildings,
  ListChecks,
  ListMagnifyingGlass,
  TruckTrailer,
  Package,
  UsersThree,
  GearSix,
  Question,
  SignOut,
  CaretLineLeft,
  CaretLineRight,
  Plug,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { LogoMark } from './Logo';
import api from '../services/api';
import GlobalSearch from './GlobalSearch';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import NotificationCenter from './NotificationCenter';
import { SidebarContext } from '../contexts/SidebarContext';
import { useHotkeys } from '../hooks/useHotkeys';

interface NavItem {
  path: string;
  label: string;
  icon: PhosphorIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: SquaresFour },
      { path: '/analytics', label: 'Analytics', icon: ChartLineUp },
      { path: '/activity', label: 'Activity', icon: ClockCounterClockwise },
      { path: '/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    label: 'Warehouse',
    items: [
      { path: '/inventory', label: 'Inventory', icon: Cube },
      { path: '/warehouse', label: 'Locations', icon: Buildings },
      { path: '/picking', label: 'Picking', icon: ListChecks },
      { path: '/cycle-counts', label: 'Cycle Counts', icon: ListMagnifyingGlass },
    ],
  },
  {
    label: 'Logistics',
    items: [
      { path: '/shipping', label: 'Shipping', icon: TruckTrailer },
      { path: '/receiving', label: 'Purchase Orders', icon: Package },
      { path: '/suppliers', label: 'Suppliers', icon: UsersThree },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { path: '/plugins', label: 'Plugins', icon: Plug },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        setCompanyName(data.data.tenantName || '');
        if (data.data.logoUrl) setLogoUrl(data.data.logoUrl);
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcuts
  useHotkeys([
    { key: 'k', meta: true, handler: () => setSearchOpen(true) },
    { key: '?', shift: true, handler: () => setShortcutsOpen(true) },
    { chord: 'g', key: 'd', handler: () => navigate('/') },
    { chord: 'g', key: 'o', handler: () => navigate('/orders') },
    { chord: 'g', key: 'i', handler: () => navigate('/inventory') },
    { chord: 'g', key: 'p', handler: () => navigate('/receiving') },
    { chord: 'g', key: 's', handler: () => navigate('/suppliers') },
    { chord: 'g', key: 'h', handler: () => navigate('/shipping') },
    { chord: 'g', key: 'w', handler: () => navigate('/warehouse') },
    { chord: 'g', key: 'k', handler: () => navigate('/picking') },
    { chord: 'g', key: 'c', handler: () => navigate('/cycle-counts') },
    { chord: 'g', key: 'x', handler: () => navigate('/settings') },
  ]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-[64px]' : 'w-[240px]';
  const mainMargin = collapsed ? 'ml-[64px]' : 'ml-[240px]';

  // Get company initial for the avatar
  const initial = (companyName || 'P').charAt(0).toUpperCase();

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out',
          sidebarWidth
        )}
      >
        {/* Company header */}
        <div
          title={collapsed ? (companyName || 'PickNPack') : undefined}
          className={cn(
            'flex items-center border-b border-border px-3 py-3',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          {collapsed ? (
            logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
                {initial}
              </div>
            )
          ) : (
            <>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-md object-contain" />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
                  {initial}
                </div>
              )}
              <span className="truncate text-[13px] font-semibold text-foreground">
                {companyName || 'PickNPack'}
              </span>
            </>
          )}
        </div>

        {/* Search + Notifications row */}
        <div className={cn('flex items-center mx-2.5 mt-3 mb-1 gap-1.5', collapsed && 'flex-col')}>
          <button
            onClick={() => setSearchOpen(true)}
            title={collapsed ? 'Search (⌘K)' : undefined}
            className={cn(
              'flex items-center rounded-lg border border-border/50 bg-muted/30 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
              collapsed ? 'justify-center p-2' : 'flex-1 gap-2.5 px-2.5 py-[7px]'
            )}
          >
            <MagnifyingGlass size={collapsed ? 18 : 15} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-muted-foreground/60">Search...</span>
                <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border/40 bg-background px-1.5 text-[10px] font-medium text-muted-foreground/40">⌘K</kbd>
              </>
            )}
          </button>
          <NotificationCenter collapsed={collapsed} position="top" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.label}
                </p>
              )}
              <div className="space-y-px">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center rounded-md text-[13px] font-medium transition-colors duration-150',
                          collapsed
                            ? 'justify-center p-2.5'
                            : 'gap-2.5 px-2.5 py-[7px]',
                          isActive
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={collapsed ? 20 : 18}
                            weight={isActive ? 'fill' : 'regular'}
                            className="flex-shrink-0"
                          />
                          {!collapsed && <span>{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2.5 space-y-px">
          <a
            href="https://docs.picknpack.io"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'Help' : undefined}
            className={cn(
              'flex items-center rounded-md text-[13px] font-medium transition-colors duration-150',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-[7px]',
              'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Question size={collapsed ? 20 : 18} weight="regular" className="flex-shrink-0" />
            {!collapsed && <span>Help</span>}
          </a>
          <NavLink
            to="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md text-[13px] font-medium transition-colors duration-150',
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-[7px]',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <GearSix size={collapsed ? 20 : 18} weight={isActive ? 'fill' : 'regular'} className="flex-shrink-0" />
                {!collapsed && <span>Settings</span>}
              </>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            className={cn(
              'flex w-full items-center rounded-md text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-[7px]'
            )}
          >
            <SignOut size={collapsed ? 20 : 18} className="flex-shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex w-full items-center justify-center rounded-md p-1.5 text-muted-foreground/40 transition-colors duration-150 hover:bg-muted hover:text-muted-foreground"
          >
            {collapsed ? <CaretLineRight size={16} /> : <CaretLineLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          mainMargin
        )}
      >
        <div className="mx-auto max-w-7xl overflow-x-hidden px-6 py-8 lg:px-8 min-h-[calc(100vh-2rem)]">
          {children}
        </div>
      </main>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
    </SidebarContext.Provider>
  );
}
