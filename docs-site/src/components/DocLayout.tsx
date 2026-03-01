import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'Getting Started',
    items: [
      { to: '/getting-started', label: 'Setup & Connect' },
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Core Modules',
    items: [
      { to: '/orders', label: 'Orders' },
      { to: '/inventory', label: 'Inventory' },
      { to: '/warehouse', label: 'Warehouse' },
      { to: '/picking', label: 'Picking' },
    ],
  },
  {
    label: 'Logistics',
    items: [
      { to: '/shipping', label: 'Shipping' },
      { to: '/receiving', label: 'Receiving' },
      { to: '/suppliers', label: 'Suppliers' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { to: '/plugins', label: 'Plugins' },
      { to: '/search', label: 'Global Search' },
    ],
  },
];

export default function DocLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-surface-0/80 backdrop-blur-lg border-b border-surface-100">
        <div className="flex items-center h-full px-4 lg:px-6 max-w-[1440px] mx-auto">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden mr-3 p-1.5 rounded-md hover:bg-surface-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm shadow-brand-500/20">
              <span className="text-white font-bold text-sm leading-none">P</span>
            </div>
            <span className="font-display text-lg text-surface-900 tracking-tight">
              PickNPack
            </span>
            <span className="text-2xs font-medium text-surface-400 uppercase tracking-widest ml-1">
              Docs
            </span>
          </a>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://app.picknpack.io"
              className="text-sm font-medium text-surface-500 hover:text-surface-800 transition-colors hidden sm:block"
            >
              Open App
            </a>
            <a
              href="https://app.picknpack.io"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium bg-brand-500 text-white px-3.5 py-1.5 rounded-lg hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20"
            >
              Sign In
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.25 3.5L8.75 7L5.25 10.5" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1440px] mx-auto pt-14">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-14 z-30 h-[calc(100vh-3.5rem)] w-64 shrink-0
            bg-surface-0 lg:bg-transparent
            border-r border-surface-100 lg:border-none
            overflow-y-auto overscroll-contain
            transition-transform duration-200
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="py-6 px-4 lg:pl-6 lg:pr-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-6">
                <h4 className="text-2xs font-semibold uppercase tracking-[0.12em] text-surface-400 mb-2 px-3">
                  {section.label}
                </h4>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-md text-[13.5px] font-medium transition-all duration-150 ${
                            isActive
                              ? 'text-brand-600 bg-brand-50'
                              : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="px-6 lg:px-12 xl:px-16 py-10 lg:py-14 max-w-prose-wide">
            <div className="animate-fade-in" key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
