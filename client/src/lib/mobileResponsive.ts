/**
 * MOBILE & TABLET RESPONSIVENESS UTILITIES
 *
 * Helper functions and hooks for responsive behavior.
 * Tested for iPad and mobile devices.
 */

import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
  mobile: 640, // sm
  tablet: 768, // md
  desktop: 1024, // lg
  wide: 1280, // xl
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.mobile + 1}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
}

/**
 * Hook for iPad-specific detection
 */
export function useIsIPad(): boolean {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPadUA = /ipad/.test(userAgent) || (/macintosh/.test(userAgent) && 'ontouchend' in document);
    setIsIPad(isIPadUA);
  }, []);

  return isIPad;
}

/**
 * Hook for touch device detection
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Get responsive value based on screen size
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop: T;
}): T {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return values.mobile;
  if (isTablet && values.tablet) return values.tablet;
  return values.desktop;
}

/**
 * Tailwind responsive class helpers
 */
export const responsive = {
  // Hide on mobile
  hideOnMobile: 'hidden sm:block',
  // Hide on tablet
  hideOnTablet: 'hidden md:hidden lg:block',
  // Hide on desktop
  hideOnDesktop: 'block lg:hidden',
  // Show only on mobile
  showOnMobile: 'block sm:hidden',
  // Show only on tablet
  showOnTablet: 'hidden sm:block lg:hidden',
  // Grid responsive
  grid: {
    '1-2-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '1-2-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    '1-3': 'grid-cols-1 lg:grid-cols-3',
  },
  // Text sizes
  text: {
    responsive: 'text-sm sm:text-base lg:text-lg',
    heading: 'text-2xl sm:text-3xl lg:text-4xl',
  },
  // Padding responsive
  padding: {
    page: 'px-4 sm:px-6 lg:px-8',
    section: 'py-8 sm:py-12 lg:py-16',
  },
};

/**
 * Touch-friendly sizes for buttons/inputs on mobile
 */
export const touchFriendly = {
  button: 'min-h-[44px] min-w-[44px]', // Apple HIG minimum
  input: 'min-h-[44px]',
  icon: 'h-6 w-6 sm:h-5 sm:w-5', // Larger on mobile
};

/**
 * Safe area insets for iOS devices with notch
 */
export const safeArea = {
  top: 'pt-[env(safe-area-inset-top)]',
  bottom: 'pb-[env(safe-area-inset-bottom)]',
  left: 'pl-[env(safe-area-inset-left)]',
  right: 'pr-[env(safe-area-inset-right)]',
};
