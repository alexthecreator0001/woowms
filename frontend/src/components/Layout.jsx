import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/orders', label: 'Orders' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/warehouse', label: 'Warehouse' },
  { path: '/picking', label: 'Picking' },
  { path: '/shipping', label: 'Shipping' },
  { path: '/receiving', label: 'Receiving' },
  { path: '/settings', label: 'Settings' },
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
        <h1>WooWMS</h1>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
              end={item.path === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '1.5rem', marginTop: 'auto' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
