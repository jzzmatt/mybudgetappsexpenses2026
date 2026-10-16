import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import manifest from "@/app/manifest";
import { PWA_APPLE_TOUCH_ICON, PWA_BACKGROUND_COLOR, PWA_ICONS, PWA_SHORT_NAME, PWA_THEME_COLOR } from "@/lib/pwa/constants";
import { isInstallAssetPath } from "@/lib/pwa/public-paths";

function readPngSize(path: string) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(12), 0x49484452);
  return {
    bytes,
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

describe("web app manifest", () => {
  it("describes an installable BudgetApp in standalone portrait mode", () => {
    const webManifest = manifest();

    assert.equal(webManifest.name, "MY Expense Tracker");
    assert.equal(webManifest.short_name, PWA_SHORT_NAME);
    assert.equal(webManifest.description, "Controlo financeiro pessoal e de projetos.");
    assert.equal(webManifest.start_url, "/");
    assert.equal(webManifest.scope, "/");
    assert.equal(webManifest.display, "standalone");
    assert.equal(webManifest.orientation, "portrait");
    assert.equal(webManifest.theme_color, PWA_THEME_COLOR);
    assert.equal(webManifest.background_color, PWA_BACKGROUND_COLOR);
    assert.equal(webManifest.prefer_related_applications, false);
    assert.equal(webManifest.lang, "pt");

    const icons = webManifest.icons ?? [];
    assert.ok(icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png" && icon.purpose === "any"));
    assert.ok(icons.some((icon) => icon.sizes === "512x512" && icon.type === "image/png" && icon.purpose === "any"));
    assert.ok(icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png" && icon.purpose === "maskable"));
    assert.ok(icons.some((icon) => icon.sizes === "512x512" && icon.type === "image/png" && icon.purpose === "maskable"));
    assert.ok(icons.every((icon) => icon.type === "image/png" && icon.src?.endsWith(".png")));
    assert.deepEqual(
      icons.map((icon) => icon.src),
      PWA_ICONS.map((icon) => icon.src),
    );
  });
});

describe("install icons", () => {
  it("ships real PNG icons at the manifest sizes", () => {
    const expected = [
      ["public/icons/icon-192.png", 192],
      ["public/icons/icon-512.png", 512],
      ["public/icons/icon-maskable-192.png", 192],
      ["public/icons/icon-maskable-512.png", 512],
      ["public/icons/apple-touch-icon.png", 180],
    ] as const;

    for (const [path, size] of expected) {
      const png = readPngSize(path);
      assert.equal(png.width, size);
      assert.equal(png.height, size);
      assert.ok(png.bytes.length > 500);
    }

    assert.equal(PWA_APPLE_TOUCH_ICON, "/icons/apple-touch-icon.png");
  });
});

describe("install asset access", () => {
  it("keeps the manifest, service worker, and offline page public", () => {
    const proxy = readFileSync("proxy.ts", "utf8");

    for (const path of ["/manifest.webmanifest", "/sw.js", "/offline.html"]) {
      assert.equal(isInstallAssetPath(path), true);
    }

    assert.ok(proxy.includes("INSTALL_ASSET_PATHS"));
    assert.match(proxy, /manifest\\\\\.webmanifest\$/);
    assert.match(proxy, /sw\\\\\.js\$/);
    assert.match(proxy, /offline\\\\\.html\$/);
    assert.equal(isInstallAssetPath("/projects"), false);
    assert.equal(isInstallAssetPath("/api/expenses"), false);
  });
});
