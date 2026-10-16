import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInstallController, type InstallEnvironment, type InstallPromptLike } from "@/lib/pwa/install-controller";
import { detectInstallPlatform, getInstallGuidance } from "@/lib/pwa/install-platform";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { enMessages } from "@/lib/i18n/messages/en";
import { frMessages } from "@/lib/i18n/messages/fr";
import { ptMessages } from "@/lib/i18n/messages/pt";
import { createTranslator } from "@/lib/i18n/translator";

const PWA_KEYS = [
  "pwa.install",
  "pwa.installAria",
  "pwa.dialogTitle",
  "pwa.dialogDescription",
  "pwa.dismissedNote",
  "pwa.installed",
  "pwa.stepsLabel",
  "pwa.androidStep1",
  "pwa.androidStep2",
  "pwa.androidStep3",
  "pwa.iosStep1",
  "pwa.iosStep2",
  "pwa.iosStep3",
  "pwa.desktopStep1",
  "pwa.desktopStep2",
  "pwa.desktopStep3",
  "pwa.desktopUnsupported",
] as const;

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DESKTOP_FIREFOX_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0";

function createHarness(userAgent = DESKTOP_CHROME_UA) {
  let standalone = false;
  let navigatorStandalone = false;
  let installedAlready = false;
  let displayListener: (() => void) | null = null;
  let pendingPrompt: InstallPromptLike | null = null;
  const listeners: Record<"beforeinstallprompt" | "appinstalled", Set<(event: InstallPromptLike) => void>> = {
    beforeinstallprompt: new Set(),
    appinstalled: new Set(),
  };

  const env: InstallEnvironment = {
    userAgent,
    maxTouchPoints: 0,
    isDisplayModeStandalone: () => standalone,
    navigatorStandalone: () => navigatorStandalone,
    wasInstalled: () => installedAlready,
    takeDeferredPrompt: () => {
      const prompt = pendingPrompt;
      pendingPrompt = null;
      return prompt;
    },
    addEventListener: (type, listener) => {
      listeners[type].add(listener);
    },
    removeEventListener: (type, listener) => {
      listeners[type].delete(listener);
    },
    watchDisplayMode: (onChange) => {
      displayListener = onChange;
      return () => {
        if (displayListener === onChange) {
          displayListener = null;
        }
      };
    },
  };

  return {
    env,
    listeners,
    setStandalone(value: boolean) {
      standalone = value;
      displayListener?.();
    },
    setNavigatorStandalone(value: boolean) {
      navigatorStandalone = value;
    },
    setInstalledAlready(value: boolean) {
      installedAlready = value;
    },
    stashPrompt(prompt: InstallPromptLike) {
      pendingPrompt = prompt;
    },
    emit(type: "beforeinstallprompt" | "appinstalled", event?: InstallPromptLike) {
      for (const listener of listeners[type]) {
        listener(event ?? { preventDefault() {}, prompt: async () => {}, userChoice: Promise.resolve({ outcome: "dismissed" }) });
      }
    },
  };
}

function createPrompt(outcome: "accepted" | "dismissed", promptImpl?: () => Promise<void>) {
  let prevented = false;
  let promptCalls = 0;

  const event: InstallPromptLike = {
    preventDefault() {
      prevented = true;
    },
    prompt() {
      promptCalls += 1;
      return promptImpl ? promptImpl() : Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome }),
  };

  return {
    event,
    get prevented() {
      return prevented;
    },
    get promptCalls() {
      return promptCalls;
    },
  };
}

describe("install controller", () => {
  it("stores a native prompt without opening it until the user clicks", async () => {
    const harness = createHarness();
    const controller = createInstallController(harness.env);
    const prompt = createPrompt("accepted");
    controller.start();

    harness.emit("beforeinstallprompt", prompt.event);

    assert.equal(prompt.prevented, true);
    assert.equal(prompt.promptCalls, 0);
    assert.equal(controller.getSnapshot().promptAvailable, true);
    assert.equal(controller.getSnapshot().dialog, "closed");
    assert.equal(controller.getSnapshot().showButton, true);

    const snapshot = await controller.requestInstall();
    assert.equal(prompt.promptCalls, 1);
    assert.equal(snapshot.lastChoice, "accepted");
    assert.equal(snapshot.installed, false);
    assert.equal(snapshot.dialog, "closed");
    assert.equal(snapshot.showButton, true);
  });

  it("opens manual instructions when no native prompt is available", async () => {
    const harness = createHarness(ANDROID_UA);
    const controller = createInstallController(harness.env);
    controller.start();

    const snapshot = await controller.requestInstall();

    assert.equal(snapshot.promptAvailable, false);
    assert.equal(snapshot.dialog, "manual");
    assert.equal(snapshot.lastChoice, null);
    assert.equal(snapshot.installed, false);
    assert.deepEqual(snapshot.guidance.stepKeys, ["pwa.androidStep1", "pwa.androidStep2", "pwa.androidStep3"]);
  });

  it("keeps the button available after a dismissed install and does not claim success", async () => {
    const harness = createHarness(ANDROID_UA);
    const controller = createInstallController(harness.env);
    const prompt = createPrompt("dismissed");
    controller.start();
    harness.emit("beforeinstallprompt", prompt.event);

    const snapshot = await controller.requestInstall();

    assert.equal(prompt.promptCalls, 1);
    assert.equal(snapshot.lastChoice, "dismissed");
    assert.equal(snapshot.dialog, "dismissed");
    assert.equal(snapshot.installed, false);
    assert.equal(snapshot.showButton, true);
    assert.equal(snapshot.promptAvailable, false);

    const retry = await controller.requestInstall();
    assert.equal(prompt.promptCalls, 1);
    assert.equal(retry.dialog, "manual");
    assert.equal(retry.installed, false);
  });

  it("hides the install control after the appinstalled event", () => {
    const harness = createHarness();
    const controller = createInstallController(harness.env);
    controller.start();
    harness.emit("beforeinstallprompt", createPrompt("accepted").event);

    harness.emit("appinstalled");

    assert.equal(controller.getSnapshot().installed, true);
    assert.equal(controller.getSnapshot().showButton, false);
    assert.equal(controller.getSnapshot().promptAvailable, false);
    assert.equal(controller.getSnapshot().dialog, "closed");
  });

  it("hides the CTA in standalone display mode and when the browser reports an installed app", () => {
    const standaloneHarness = createHarness();
    standaloneHarness.setStandalone(true);
    const standaloneController = createInstallController(standaloneHarness.env);
    standaloneController.start();
    const prompt = createPrompt("accepted");
    standaloneHarness.emit("beforeinstallprompt", prompt.event);

    assert.equal(prompt.prevented, true);
    assert.equal(prompt.promptCalls, 0);
    assert.equal(standaloneController.getSnapshot().standalone, true);
    assert.equal(standaloneController.getSnapshot().showButton, false);

    const iosHarness = createHarness(IPHONE_UA);
    iosHarness.setNavigatorStandalone(true);
    const iosController = createInstallController(iosHarness.env);
    iosController.start();
    assert.equal(iosController.getSnapshot().showButton, false);
    assert.equal(iosController.getSnapshot().platform, "ios");
  });

  it("updates the CTA when display mode changes", async () => {
    const harness = createHarness();
    const controller = createInstallController(harness.env);
    controller.start();
    await controller.requestInstall();
    assert.equal(controller.getSnapshot().dialog, "manual");

    harness.setStandalone(true);

    assert.equal(controller.getSnapshot().showButton, false);
    assert.equal(controller.getSnapshot().dialog, "closed");
  });

  it("removes install listeners on cleanup", () => {
    const harness = createHarness();
    const controller = createInstallController(harness.env);
    controller.start();
    assert.equal(harness.listeners.beforeinstallprompt.size, 1);
    assert.equal(harness.listeners.appinstalled.size, 1);

    controller.stop();
    harness.emit("beforeinstallprompt", createPrompt("accepted").event);
    harness.emit("appinstalled");

    assert.equal(harness.listeners.beforeinstallprompt.size, 0);
    assert.equal(harness.listeners.appinstalled.size, 0);
    assert.equal(controller.getSnapshot().promptAvailable, false);
    assert.equal(controller.getSnapshot().installed, false);
  });

  it("uses a prompt that was captured before the controller started", async () => {
    const harness = createHarness();
    const prompt = createPrompt("accepted");
    harness.stashPrompt(prompt.event);
    const controller = createInstallController(harness.env);
    controller.start();

    assert.equal(controller.getSnapshot().promptAvailable, true);
    assert.equal(prompt.promptCalls, 0);
    await controller.requestInstall();
    assert.equal(prompt.promptCalls, 1);
  });
});

describe("install platform instructions", () => {
  it("selects Android, iOS, and desktop guidance", () => {
    assert.equal(detectInstallPlatform(ANDROID_UA), "android");
    assert.deepEqual(getInstallGuidance("android").stepKeys, ["pwa.androidStep1", "pwa.androidStep2", "pwa.androidStep3"]);

    assert.equal(detectInstallPlatform(IPHONE_UA), "ios");
    assert.deepEqual(getInstallGuidance("ios", IPHONE_UA).stepKeys, ["pwa.iosStep1", "pwa.iosStep2", "pwa.iosStep3"]);
    assert.equal(detectInstallPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", 5), "ios");

    assert.equal(detectInstallPlatform(DESKTOP_CHROME_UA), "desktop");
    assert.equal(getInstallGuidance("desktop", DESKTOP_CHROME_UA).unsupported, false);
    assert.deepEqual(getInstallGuidance("desktop", DESKTOP_CHROME_UA).stepKeys, [
      "pwa.desktopStep1",
      "pwa.desktopStep2",
      "pwa.desktopStep3",
    ]);
    assert.equal(getInstallGuidance("desktop", DESKTOP_FIREFOX_UA).unsupported, true);
    assert.deepEqual(getInstallGuidance("desktop", DESKTOP_FIREFOX_UA).stepKeys, ["pwa.desktopUnsupported"]);
  });
});

describe("install localization", () => {
  it("provides Portuguese, English, and French copy without changing the active locale", () => {
    const messages = { pt: ptMessages, en: enMessages, fr: frMessages };
    const locale: Locale = "fr";
    const guidance = getInstallGuidance("android", ANDROID_UA);

    for (const code of LOCALES) {
      const translator = createTranslator(getMessages(code));
      for (const key of PWA_KEYS) {
        const value = translator(key);
        assert.notEqual(value, key);
        assert.ok(value.trim().length > 0);
      }
    }

    assert.equal(createTranslator(getMessages(locale))(guidance.stepKeys[0]), messages.fr.pwa.androidStep1);
    assert.notEqual(messages.pt.pwa.install, messages.en.pwa.install);
    assert.notEqual(messages.en.pwa.install, messages.fr.pwa.install);
    assert.notEqual(messages.pt.pwa.iosStep2, messages.en.pwa.iosStep2);
    assert.equal(locale, "fr");
  });
});
