"use client";

import type { InstallPromptLike } from "@/lib/pwa/install-controller";

type InstallWindow = Window & {
  __budgetAppInstallCapture?: boolean;
  __budgetAppDeferredInstallPrompt?: InstallPromptLike | null;
  __budgetAppInstalled?: boolean;
};

function installWindow(): InstallWindow | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window as InstallWindow;
}

export function captureInstallPrompt(): void {
  const target = installWindow();

  if (!target || target.__budgetAppInstallCapture) {
    return;
  }

  target.__budgetAppInstallCapture = true;

  target.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    target.__budgetAppDeferredInstallPrompt = event as unknown as InstallPromptLike;
  });

  target.addEventListener("appinstalled", () => {
    target.__budgetAppInstalled = true;
    target.__budgetAppDeferredInstallPrompt = null;
  });
}

export function takeDeferredInstallPrompt(): InstallPromptLike | null {
  const target = installWindow();

  if (!target) {
    return null;
  }

  const prompt = target.__budgetAppDeferredInstallPrompt ?? null;
  target.__budgetAppDeferredInstallPrompt = null;
  return prompt;
}

export function wasAppInstalled(): boolean {
  return installWindow()?.__budgetAppInstalled === true;
}
