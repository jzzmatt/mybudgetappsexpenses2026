/** Install assets that must stay reachable without a signed-in session. */
export const INSTALL_ASSET_PATHS = ["/manifest.webmanifest", "/sw.js", "/offline.html"] as const;

export function isInstallAssetPath(pathname: string): boolean {
  return (INSTALL_ASSET_PATHS as readonly string[]).includes(pathname);
}
