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
} from 'lucide-react';
import { cn } from '../lib/utils.js';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/warehouse', label: 'Warehouse', icon: Warehouse },
  { path: '/picking', label: 'Picking', icon: ClipboardList },
  { path: '/shipping', label: 'Shipping', icon: Truck },
  { path: '/receiving', label: 'Receiving', icon: PackageOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border/40 bg-card">
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-border/40 px-6 py-5">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
          <span className="text-lg font-semibold tracking-tight">WooWMS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/40 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[260px] flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
