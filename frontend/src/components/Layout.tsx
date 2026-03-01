import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  SquaresFour,
  ShoppingBag,
  Cube,
  Buildings,
  ListChecks,
  TruckTrailer,
  Package,
  UsersThree,
  GearSix,
  Question,
  SignOut,
  CaretLineLeft,
  CaretLineRight,
  CaretDown,
  Plug,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { LogoMark } from './Logo';
import api from '../services/api';
import GlobalSearch from './GlobalSearch';
import { SidebarContext } from '../contexts/SidebarContext';

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
      { path: '/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    label: 'Warehouse',
    items: [
      { path: '/inventory', label: 'Inventory', icon: Cube },
      { path: '/warehouse', label: 'Locations', icon: Buildings },
      { path: '/picking', label: 'Picking', icon: ListChecks },
    ],
  },
  {
    label: 'Logistics',
    items: [
      { path: '/shipping', label: 'Shipping', icon: TruckTrailer },
      { path: '/receiving', label: 'Receiving', icon: Package },
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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        setCompanyName(data.data.tenantName || '');
      })
      .catch(() => {});
  }, []);

  // Cmd+K / Ctrl+K keyboard shortcut for global search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#ebebeb] bg-white transition-all duration-300 ease-in-out',
          sidebarWidth
        )}
      >
        {/* Company header — Stripe style (clickable) */}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          title={collapsed ? (companyName || 'PickNPack') : undefined}
          className={cn(
            'flex items-center border-b border-[#ebebeb] px-3 py-3 transition-colors hover:bg-[#f5f5f5] w-full',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
              {initial}
            </div>
          ) : (
            <>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-[13px] font-bold text-primary">
                {initial}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span className="truncate text-[13px] font-semibold text-[#0a0a0a]">
                  {companyName || 'PickNPack'}
                </span>
                <CaretDown size={12} className="flex-shrink-0 text-[#a0a0a0]" />
              </div>
            </>
          )}
        </button>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          title={collapsed ? 'Search (⌘K)' : undefined}
          className={cn(
            'flex items-center mx-2.5 mt-3 mb-1 rounded-lg border border-border/50 bg-muted/30 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-[7px]'
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">
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
                            ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                            : 'text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
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
        <div className="border-t border-[#ebebeb] p-2.5 space-y-px">
          <a
            href="https://docs.picknpack.io"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'Help' : undefined}
            className={cn(
              'flex items-center rounded-md text-[13px] font-medium transition-colors duration-150',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-[7px]',
              'text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
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
                  ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                  : 'text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
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
              'flex w-full items-center rounded-md text-[13px] font-medium text-[#6b6b6b] transition-colors duration-150 hover:bg-red-50 hover:text-red-600',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-[7px]'
            )}
          >
            <SignOut size={collapsed ? 20 : 18} className="flex-shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className={cn(
              'flex w-full items-center rounded-md text-[13px] font-medium text-[#a0a0a0] transition-colors duration-150 hover:bg-[#f5f5f5] hover:text-[#6b6b6b]',
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-[7px]'
            )}
          >
            {collapsed ? (
              <CaretLineRight size={18} className="flex-shrink-0" />
            ) : (
              <>
                <CaretLineLeft size={18} className="flex-shrink-0" />
                <span>Collapse</span>
              </>
            )}
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
        <div className="mx-auto max-w-7xl overflow-x-hidden px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
    </SidebarContext.Provider>
  );
}
