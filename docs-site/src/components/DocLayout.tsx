import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    label: 'Getting Started',
    items: [
      { to: '/getting-started', label: 'Setup & Connect' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Core Modules',
    items: [
      { to: '/orders', label: 'Orders' },
      { to: '/inventory', label: 'Inventory' },
      { to: '/picking', label: 'Picking' },
    ],
  },
  {
    label: 'Warehouse',
    items: [
      { to: '/warehouse', label: 'Overview' },
      { to: '/warehouse/zones', label: 'Zones & Racks' },
      { to: '/warehouse/floor-plan', label: 'Floor Plan' },
      { to: '/warehouse/bins', label: 'Bins & Stock' },
      { to: '/warehouse/labels', label: 'Labels' },
    ],
  },
  {
    label: 'Logistics',
    items: [
      { to: '/shipping', label: 'Shipping' },
      { to: '/receiving', label: 'Purchase Orders' },
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
  {
    label: 'Customization',
    items: [
      { to: '/dark-mode', label: 'Dark Mode' },
      { to: '/keyboard-shortcuts', label: 'Keyboard Shortcuts' },
      { to: '/activity-log', label: 'Activity Log' },
    ],
  },
  {
    label: 'Mobile',
    items: [
      { to: '/mobile-app', label: 'Picking App' },
    ],
  },
];

export default function DocLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
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

          {/* Logo — compact icon on mobile, full wordmark on desktop */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            {/* Icon mark (always visible) */}
            <svg width="24" height="24" viewBox="0 120 320 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M165.995 462C194.864 462 217.847 468.999 233.25 484.553L233.973 485.286C249.016 500.815 255.814 523.581 255.814 552.018V580.229H192.792V554.367C192.792 542.451 190.14 535.488 186.521 531.67C183.061 528.019 176.46 525.236 164.585 525.236H96.167C84.4835 525.236 77.9404 528.003 74.4648 531.67C70.8466 535.488 68.1954 542.451 68.1953 554.367V576.458C68.1953 587.726 70.5276 594.575 73.7656 598.478C76.9176 601.949 82.7333 604.678 93.0576 605.119H320V668.121H260.752V722.867C260.752 734.595 263.39 741.497 267.022 745.33C270.498 748.997 277.04 751.764 288.724 751.764H320V815H296.953C267.672 815 244.433 807.621 228.952 791.538C213.323 807.583 190.245 815 161.293 815H90.0537C61.4761 815 38.5722 807.875 22.8662 792.221C7.15533 776.562 3.06462e-05 753.718 0 725.218V708.297C2.543e-05 686.442 3.90246 668.031 12.4043 653.69C18.0997 644.084 25.5591 636.562 34.6777 631.189C26.9956 625.252 20.6865 617.84 15.8066 608.992L15.7773 608.939L15.749 608.886C8.37247 595.017 4.93754 577.954 4.9375 558.128V552.018C4.9375 523.45 12.0668 500.554 27.7285 484.854C43.3938 469.151 66.2458 462 94.7568 462H165.995ZM91.4648 668.121C79.5391 668.121 72.9065 670.85 69.4541 674.396C65.9201 678.027 63.2578 684.841 63.2578 696.782V722.867C63.2578 734.595 65.8957 741.497 69.5283 745.33C72.9884 748.981 79.5897 751.764 91.4648 751.764H169.287C181.162 751.764 187.764 748.981 191.224 745.33C194.856 741.497 197.494 734.595 197.494 722.867V668.121H91.4648Z" fill="#2B67FF"/>
              <path d="M0 451.839V115.219H63.2576V143.685C81.9336 121.996 106.484 111.152 136.907 111.152C166.729 111.152 191.58 122.298 211.461 144.588C231.342 166.578 241.282 194.14 241.282 227.275C241.282 259.808 231.342 287.219 211.461 309.51C191.58 331.801 166.729 342.946 136.907 342.946C106.785 342.946 82.2348 332.102 63.2576 310.414V451.839H0ZM79.9756 270.2C91.121 281.647 104.827 287.37 121.093 287.37C137.359 287.37 150.914 281.647 161.759 270.2C172.603 258.753 178.025 244.445 178.025 227.275C178.025 209.804 172.603 195.345 161.759 183.899C150.914 172.151 137.359 166.277 121.093 166.277C104.827 166.277 91.121 172.151 79.9756 183.899C68.8303 195.345 63.2576 209.804 63.2576 227.275C63.2576 244.445 68.8303 258.753 79.9756 270.2Z" fill="currentColor"/>
            </svg>
            {/* Wordmark — hidden on small mobile */}
            <span className="hidden sm:block text-[15px] font-semibold text-surface-900 tracking-tight">
              PickNPack
            </span>
            <span className="text-2xs font-medium text-surface-400 uppercase tracking-widest border-l border-surface-200 pl-2.5">
              Docs
            </span>
          </a>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <a
              href="https://app.picknpack.io"
              className="text-sm font-medium text-surface-500 hover:text-surface-800 transition-colors hidden sm:block"
            >
              Open App
            </a>
            <a
              href="https://app.picknpack.io"
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-brand-500 text-white px-3.5 py-1.5 rounded-lg hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20"
            >
              Sign In
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.25 3.5L8.75 7L5.25 10.5" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1440px] mx-auto pt-14 flex-1 w-full">
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
          <div className="px-5 sm:px-6 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14 max-w-prose-wide">
            <div className="animate-fade-in" key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-surface-100 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <svg width="18" height="18" viewBox="0 120 320 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M165.995 462C194.864 462 217.847 468.999 233.25 484.553L233.973 485.286C249.016 500.815 255.814 523.581 255.814 552.018V580.229H192.792V554.367C192.792 542.451 190.14 535.488 186.521 531.67C183.061 528.019 176.46 525.236 164.585 525.236H96.167C84.4835 525.236 77.9404 528.003 74.4648 531.67C70.8466 535.488 68.1954 542.451 68.1953 554.367V576.458C68.1953 587.726 70.5276 594.575 73.7656 598.478C76.9176 601.949 82.7333 604.678 93.0576 605.119H320V668.121H260.752V722.867C260.752 734.595 263.39 741.497 267.022 745.33C270.498 748.997 277.04 751.764 288.724 751.764H320V815H296.953C267.672 815 244.433 807.621 228.952 791.538C213.323 807.583 190.245 815 161.293 815H90.0537C61.4761 815 38.5722 807.875 22.8662 792.221C7.15533 776.562 3.06462e-05 753.718 0 725.218V708.297C2.543e-05 686.442 3.90246 668.031 12.4043 653.69C18.0997 644.084 25.5591 636.562 34.6777 631.189C26.9956 625.252 20.6865 617.84 15.8066 608.992L15.7773 608.939L15.749 608.886C8.37247 595.017 4.93754 577.954 4.9375 558.128V552.018C4.9375 523.45 12.0668 500.554 27.7285 484.854C43.3938 469.151 66.2458 462 94.7568 462H165.995ZM91.4648 668.121C79.5391 668.121 72.9065 670.85 69.4541 674.396C65.9201 678.027 63.2578 684.841 63.2578 696.782V722.867C63.2578 734.595 65.8957 741.497 69.5283 745.33C72.9884 748.981 79.5897 751.764 91.4648 751.764H169.287C181.162 751.764 187.764 748.981 191.224 745.33C194.856 741.497 197.494 734.595 197.494 722.867V668.121H91.4648Z" fill="#2B67FF"/>
              <path d="M0 451.839V115.219H63.2576V143.685C81.9336 121.996 106.484 111.152 136.907 111.152C166.729 111.152 191.58 122.298 211.461 144.588C231.342 166.578 241.282 194.14 241.282 227.275C241.282 259.808 231.342 287.219 211.461 309.51C191.58 331.801 166.729 342.946 136.907 342.946C106.785 342.946 82.2348 332.102 63.2576 310.414V451.839H0ZM79.9756 270.2C91.121 281.647 104.827 287.37 121.093 287.37C137.359 287.37 150.914 281.647 161.759 270.2C172.603 258.753 178.025 244.445 178.025 227.275C178.025 209.804 172.603 195.345 161.759 183.899C150.914 172.151 137.359 166.277 121.093 166.277C104.827 166.277 91.121 172.151 79.9756 183.899C68.8303 195.345 63.2576 209.804 63.2576 227.275C63.2576 244.445 68.8303 258.753 79.9756 270.2Z" fill="currentColor"/>
            </svg>
            <span>PickNPack Documentation</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="https://app.picknpack.io" className="text-surface-400 hover:text-surface-700 transition-colors">
              App
            </a>
            <span className="text-surface-200">|</span>
            <a href="https://picknpack.io" className="text-surface-400 hover:text-surface-700 transition-colors">
              Website
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
