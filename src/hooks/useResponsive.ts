import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;   // <= 768px
  isTablet: boolean;   // <= 1024px (includes mobile range)
  isDesktop: boolean;  // > 1024px
}

const MOBILE_QUERY = '(max-width: 768px)';
const TABLET_QUERY = '(max-width: 1024px)';
const DESKTOP_QUERY = '(min-width: 1025px)';

/**
 * Hook for detecting responsive breakpoints.
 * - isMobile: width <= 768px (week view calendar)
 * - isTablet: width <= 1024px (hamburger menu, includes mobile)
 * - isDesktop: width > 1024px (sidebar visible)
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: true };
    }
    const mobileMatch = window.matchMedia(MOBILE_QUERY);
    const tabletMatch = window.matchMedia(TABLET_QUERY);
    const desktopMatch = window.matchMedia(DESKTOP_QUERY);
    return {
      isMobile: mobileMatch.matches,
      isTablet: tabletMatch.matches,
      isDesktop: desktopMatch.matches,
    };
  });

  useEffect(() => {
    const mobileMediaQuery = window.matchMedia(MOBILE_QUERY);
    const tabletMediaQuery = window.matchMedia(TABLET_QUERY);
    const desktopMediaQuery = window.matchMedia(DESKTOP_QUERY);

    const handleMobileChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isMobile: e.matches }));
    };

    const handleTabletChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isTablet: e.matches }));
    };

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isDesktop: e.matches }));
    };

    mobileMediaQuery.addEventListener('change', handleMobileChange);
    tabletMediaQuery.addEventListener('change', handleTabletChange);
    desktopMediaQuery.addEventListener('change', handleDesktopChange);

    return () => {
      mobileMediaQuery.removeEventListener('change', handleMobileChange);
      tabletMediaQuery.removeEventListener('change', handleTabletChange);
      desktopMediaQuery.removeEventListener('change', handleDesktopChange);
    };
  }, []);

  return state;
}
