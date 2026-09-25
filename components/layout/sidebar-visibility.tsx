"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "budgetapp-sidebar-hidden";

const sidebarVisibilityListeners = new Set<() => void>();

function subscribeToSidebarVisibility(onStoreChange: () => void) {
  sidebarVisibilityListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    sidebarVisibilityListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function emitSidebarVisibilityChange() {
  for (const listener of sidebarVisibilityListeners) {
    listener();
  }
}

function readSidebarHidden() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeSidebarHidden(hidden: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(hidden));
  } catch {
    // Ignore storage failures; in-memory preference still applies for this session.
  }
  emitSidebarVisibilityChange();
}

type SidebarVisibilityContextValue = {
  hidden: boolean;
  toggle: () => void;
};

const SidebarVisibilityContext = createContext<SidebarVisibilityContextValue | null>(null);

export function SidebarVisibilityProvider({ children }: { children: ReactNode }) {
  const hidden = useSyncExternalStore(subscribeToSidebarVisibility, readSidebarHidden, () => false);

  const toggle = useCallback(() => {
    writeSidebarHidden(!readSidebarHidden());
  }, []);

  const value = useMemo(
    () => ({
      hidden,
      toggle,
    }),
    [hidden, toggle],
  );

  return <SidebarVisibilityContext.Provider value={value}>{children}</SidebarVisibilityContext.Provider>;
}

export function useSidebarVisibility() {
  const context = useContext(SidebarVisibilityContext);
  if (!context) {
    throw new Error("useSidebarVisibility must be used within SidebarVisibilityProvider");
  }
  return context;
}
