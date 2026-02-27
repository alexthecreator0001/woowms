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
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>
            <span className="brand-dot" />
            WooWMS
          </h1>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                end={item.path === '/'}
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}>
            <LogOut />
            Log out
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
