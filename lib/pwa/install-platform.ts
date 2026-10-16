export type InstallPlatform = "android" | "ios" | "desktop";

export type InstallGuidance = {
  platform: InstallPlatform;
  stepKeys: readonly string[];
  unsupported: boolean;
};

const ANDROID_STEPS = ["pwa.androidStep1", "pwa.androidStep2", "pwa.androidStep3"] as const;
const IOS_STEPS = ["pwa.iosStep1", "pwa.iosStep2", "pwa.iosStep3"] as const;
const DESKTOP_STEPS = ["pwa.desktopStep1", "pwa.desktopStep2", "pwa.desktopStep3"] as const;

export function detectInstallPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  const agent = userAgent || "";

  if (/android/i.test(agent)) {
    return "android";
  }

  if (/iPad|iPhone|iPod/i.test(agent) || (/Macintosh/i.test(agent) && maxTouchPoints > 1)) {
    return "ios";
  }

  return "desktop";
}

export function isStandaloneMode(input: {
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
}): boolean {
  return input.displayModeStandalone || input.navigatorStandalone === true;
}

export function getInstallGuidance(platform: InstallPlatform, userAgent = ""): InstallGuidance {
  if (platform === "android") {
    return { platform, stepKeys: ANDROID_STEPS, unsupported: false };
  }

  if (platform === "ios") {
    return { platform, stepKeys: IOS_STEPS, unsupported: false };
  }

  const chromiumDesktop = /Edg\/|Chrome\/|Chromium\//.test(userAgent) && !/Mobile|Android/i.test(userAgent);

  if (chromiumDesktop) {
    return { platform: "desktop", stepKeys: DESKTOP_STEPS, unsupported: false };
  }

  return { platform: "desktop", stepKeys: ["pwa.desktopUnsupported"], unsupported: true };
}
