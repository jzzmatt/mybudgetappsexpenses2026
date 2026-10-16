import {
  detectInstallPlatform,
  getInstallGuidance,
  isStandaloneMode,
  type InstallGuidance,
  type InstallPlatform,
} from "@/lib/pwa/install-platform";

export type InstallChoice = "accepted" | "dismissed";

export type InstallDialog = "closed" | "manual" | "dismissed";

export type InstallPromptLike = {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallChoice }>;
};

export type InstallSnapshot = {
  showButton: boolean;
  promptAvailable: boolean;
  installed: boolean;
  standalone: boolean;
  dialog: InstallDialog;
  platform: InstallPlatform;
  guidance: InstallGuidance;
  lastChoice: InstallChoice | null;
  busy: boolean;
};

export type InstallListener = (event: InstallPromptLike) => void;

export type InstallEnvironment = {
  userAgent: string;
  maxTouchPoints?: number;
  isDisplayModeStandalone: () => boolean;
  navigatorStandalone: () => boolean;
  wasInstalled?: () => boolean;
  takeDeferredPrompt?: () => InstallPromptLike | null;
  addEventListener: (type: "beforeinstallprompt" | "appinstalled", listener: InstallListener) => void;
  removeEventListener: (type: "beforeinstallprompt" | "appinstalled", listener: InstallListener) => void;
  watchDisplayMode: (onChange: () => void) => () => void;
};

export function createInstallController(env: InstallEnvironment) {
  let deferred: InstallPromptLike | null = null;
  let installed = false;
  let standalone = false;
  let dialog: InstallDialog = "closed";
  let lastChoice: InstallChoice | null = null;
  let busy = false;
  let started = false;
  let removeDisplayMode: () => void = () => {};
  const subscribers = new Set<(snapshot: InstallSnapshot) => void>();

  const readStandalone = () =>
    isStandaloneMode({
      displayModeStandalone: env.isDisplayModeStandalone(),
      navigatorStandalone: env.navigatorStandalone(),
    });

  const platform = () => detectInstallPlatform(env.userAgent, env.maxTouchPoints ?? 0);

  function snapshot(): InstallSnapshot {
    const currentPlatform = platform();
    const hidden = standalone || installed;

    return {
      showButton: !hidden,
      promptAvailable: deferred !== null && !hidden,
      installed,
      standalone,
      dialog: hidden ? "closed" : dialog,
      platform: currentPlatform,
      guidance: getInstallGuidance(currentPlatform, env.userAgent),
      lastChoice,
      busy,
    };
  }

  function emit() {
    const value = snapshot();
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  }

  const onBeforeInstallPrompt = (event: InstallPromptLike) => {
    event.preventDefault();
    env.takeDeferredPrompt?.();

    if (readStandalone() || installed) {
      standalone = readStandalone();
      deferred = null;
      emit();
      return;
    }

    deferred = event;
    emit();
  };

  const onAppInstalled = () => {
    installed = true;
    deferred = null;
    dialog = "closed";
    busy = false;
    emit();
  };

  const onDisplayModeChange = () => {
    standalone = readStandalone();
    if (standalone) {
      deferred = null;
      dialog = "closed";
    }
    emit();
  };

  return {
    start() {
      if (started) {
        return;
      }

      started = true;
      installed = env.wasInstalled?.() ?? false;
      standalone = readStandalone();

      const pending = env.takeDeferredPrompt?.() ?? null;
      if (pending && !standalone && !installed) {
        pending.preventDefault();
        deferred = pending;
      }

      env.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      env.addEventListener("appinstalled", onAppInstalled);
      removeDisplayMode = env.watchDisplayMode(onDisplayModeChange);
      emit();
    },

    stop() {
      if (!started) {
        return;
      }

      started = false;
      env.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      env.removeEventListener("appinstalled", onAppInstalled);
      removeDisplayMode();
      removeDisplayMode = () => {};
    },

    subscribe(listener: (snapshot: InstallSnapshot) => void) {
      subscribers.add(listener);
      listener(snapshot());
      return () => {
        subscribers.delete(listener);
      };
    },

    getSnapshot: snapshot,

    async requestInstall() {
      if (!snapshot().showButton || busy) {
        return snapshot();
      }

      if (!deferred) {
        dialog = "manual";
        emit();
        return snapshot();
      }

      const promptEvent = deferred;
      deferred = null;
      busy = true;
      emit();

      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        lastChoice = choice?.outcome === "accepted" ? "accepted" : "dismissed";
        dialog = lastChoice === "dismissed" ? "dismissed" : "closed";
      } catch {
        lastChoice = null;
        dialog = "manual";
      } finally {
        busy = false;
        emit();
      }

      return snapshot();
    },

    closeDialog() {
      dialog = "closed";
      emit();
    },
  };
}
