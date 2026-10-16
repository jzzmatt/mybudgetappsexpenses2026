"use client";

import { captureInstallPrompt, takeDeferredInstallPrompt, wasAppInstalled } from "@/lib/pwa/deferred-install";
import type { InstallEnvironment } from "@/lib/pwa/install-controller";

export function createBrowserInstallEnvironment(): InstallEnvironment {
  captureInstallPrompt();
  const standaloneQuery = window.matchMedia("(display-mode: standalone)");

  return {
    userAgent: window.navigator.userAgent,
    maxTouchPoints: window.navigator.maxTouchPoints ?? 0,
    isDisplayModeStandalone: () => standaloneQuery.matches,
    navigatorStandalone: () => {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      return nav.standalone === true;
    },
    wasInstalled: wasAppInstalled,
    takeDeferredPrompt: takeDeferredInstallPrompt,
    addEventListener: (type, listener) => {
      window.addEventListener(type, listener as unknown as EventListener);
    },
    removeEventListener: (type, listener) => {
      window.removeEventListener(type, listener as unknown as EventListener);
    },
    watchDisplayMode: (onChange) => {
      const handler = () => onChange();
      standaloneQuery.addEventListener("change", handler);
      return () => standaloneQuery.removeEventListener("change", handler);
    },
  };
}
