"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/pwa/deferred-install";

captureInstallPrompt();

export function PwaRegister() {
  useEffect(() => {
    captureInstallPrompt();

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const register = () => {
      if (cancelled) {
        return;
      }

      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // The browser menu can still install the app if registration fails.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
