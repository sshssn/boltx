import { useCallback } from 'react';

let setDashboardOpen: ((open: boolean) => void) | null = null;

export function useDashboardOverlay() {
  return useCallback(() => {
    if (setDashboardOpen) setDashboardOpen(true);
  }, []);
}

export function registerDashboardOverlaySetter(
  setter: (open: boolean) => void,
) {
  setDashboardOpen = setter;
}
