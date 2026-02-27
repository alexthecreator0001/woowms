import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  ClipboardList,
  Truck,
  PackageOpen,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

const navSections = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Warehouse',
    items: [
      { path: '/inventory', label: 'Inventory', icon: Package },
      { path: '/warehouse', label: 'Locations', icon: Warehouse },
      { path: '/picking', label: 'Picking', icon: ClipboardList },
    ],
  },
  {
    label: 'Logistics',
    items: [
      { path: '/shipping', label: 'Shipping', icon: Truck },
      { path: '/receiving', label: 'Receiving', icon: PackageOpen },
    ],
  },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';
  const mainMargin = collapsed ? 'ml-[72px]' : 'ml-[260px]';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out',
          sidebarWidth
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex items-center border-b border-border/50 px-5 py-4',
            collapsed ? 'justify-center' : 'gap-3'
          )}
        >
          <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <span className="text-xs font-bold text-white">P</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">PickNPack</p>
              <p className="truncate text-[11px] text-muted-foreground">picknpack.io</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
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
                          'group flex items-center rounded-lg text-[13px] font-medium transition-all duration-200',
                          collapsed
                            ? 'justify-center px-0 py-2.5'
                            : 'gap-3 px-3 py-2',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                      }
                    >
                      <Icon
                        className={cn(
                          'flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                          collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]'
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-3 space-y-1">
          {/* Settings */}
          <NavLink
            to="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg text-[13px] font-medium transition-all duration-200',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Settings className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            className={cn(
              'flex w-full items-center rounded-lg text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
            )}
          >
            <LogOut className={cn('flex-shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
            {!collapsed && <span>Log out</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex w-full items-center rounded-lg text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px] flex-shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px] flex-shrink-0" />
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
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
