"use client";

import { useEffect } from "react";

export function redirectAfterAuth(path: string) {
  const target = path.startsWith("/") ? path : `/${path}`;
  window.location.assign(target);
}

export function useClerkLoadedNotice(isLoaded: boolean, onMissing: () => void) {
  useEffect(() => {
    if (!isLoaded) {
      onMissing();
    }
  }, [isLoaded, onMissing]);
}
