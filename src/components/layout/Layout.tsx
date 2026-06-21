import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';

function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center px-4 py-3 bg-card border-b border-border shadow-card">
      <button
        onClick={onMenuOpen}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-button text-text-secondary hover:bg-hover-row hover:text-text-primary transition-fast"
        aria-label="Open navigation menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <span className="ml-3 text-h3 font-semibold text-primary">Cycle Tracker</span>
    </header>
  );
}

export function Layout() {
  const { isDesktop } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {isDesktop && <Sidebar />}

      <main className={`flex-1 ${isDesktop ? 'ml-[280px]' : ''}`}>
        {!isDesktop && <MobileHeader onMenuOpen={() => setIsMenuOpen(true)} />}
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {!isDesktop && (
        <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      )}
    </div>
  );
}
