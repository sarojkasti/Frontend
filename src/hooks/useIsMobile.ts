import { useState, useEffect, useCallback } from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Responsive hook using matchMedia for reliable mobile detection.
 * Returns { isMobile, isTablet, isDesktop } based on viewport width.
 *
 * Breakpoints:
 * - Mobile:  < 768px
 * - Tablet:  768px – 1023px
 * - Desktop: >= 1024px
 */
export const useIsMobile = (): ResponsiveState => {
  const getState = useCallback((): ResponsiveState => {
    if (typeof window === "undefined") {
      return { isMobile: false, isTablet: false, isDesktop: true };
    }
    const width = window.innerWidth;
    return {
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT,
    };
  }, []);

  const [state, setState] = useState<ResponsiveState>(getState);

  useEffect(() => {
    const mobileQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );
    const tabletQuery = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    );

    const handleChange = () => {
      setState(getState());
    };

    mobileQuery.addEventListener("change", handleChange);
    tabletQuery.addEventListener("change", handleChange);

    // Sync on mount
    handleChange();

    return () => {
      mobileQuery.removeEventListener("change", handleChange);
      tabletQuery.removeEventListener("change", handleChange);
    };
  }, [getState]);

  return state;
};

export default useIsMobile;
