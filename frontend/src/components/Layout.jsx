import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  SquaresFour,
  ShoppingBag,
  Cube,
  Buildings,
  ListChecks,
  TruckTrailer,
  Package,
  GearSix,
  SignOut,
  CaretLineLeft,
  CaretLineRight,
} from '@phosphor-icons/react';
import { cn } from '../lib/utils.js';

const navSections = [
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

  const sidebarWidth = collapsed ? 'w-[64px]' : 'w-[240px]';
  const mainMargin = collapsed ? 'ml-[64px]' : 'ml-[240px]';

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#ebebeb] bg-white transition-all duration-300 ease-in-out',
          sidebarWidth
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex items-center px-4 py-4',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0a0a0a]">
            <span className="text-[13px] font-extrabold text-white">P</span>
          </div>
          {!collapsed && (
            <span className="truncate text-[15px] font-bold tracking-tight text-[#0a0a0a]">PickNPack</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2">
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
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
