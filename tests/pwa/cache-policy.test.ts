import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";

const ORIGIN = "https://budget.example";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

type CacheDecision = "cache-static" | "navigation-fallback" | "network-only";

type Policy = {
  CACHE_NAME: string;
  PUBLIC_ASSET_PATHS: string[];
  classifyFetch: (input: {
    method: string;
    url: string;
    origin: string;
    mode?: string;
    destination?: string;
    headers?: Record<string, string>;
  }) => CacheDecision;
  canStoreStaticResponse: (input: {
    ok?: boolean;
    status?: number;
    type?: string;
    redirected?: boolean;
    setCookie?: string | null;
    cacheControl?: string | null;
    vary?: string | null;
    contentType?: string | null;
    pathname?: string;
  }) => boolean;
};

function loadPolicy(): Policy {
  const self = {
    addEventListener() {},
    skipWaiting() {},
    location: { origin: ORIGIN },
    clients: { claim: () => Promise.resolve() },
  };
  const context = vm.createContext({
    self,
    URL,
    Response,
    console,
    fetch: () => Promise.reject(new Error("fetch should not run while loading the worker")),
    caches: {
      open: () => Promise.resolve({ match() {}, put() {} }),
      keys: () => Promise.resolve([]),
    },
  });
  vm.runInContext(source, context);
  return (self as { BudgetAppCachePolicy?: Policy }).BudgetAppCachePolicy as Policy;
}

const policy = loadPolicy();

function classify(
  path: string,
  extras: {
    method?: string;
    origin?: string;
    mode?: string;
    destination?: string;
    headers?: Record<string, string>;
    absoluteUrl?: string;
  } = {},
) {
  return policy.classifyFetch({
    method: extras.method ?? "GET",
    url: extras.absoluteUrl ?? `${ORIGIN}${path}`,
    origin: extras.origin ?? ORIGIN,
    mode: extras.mode ?? "cors",
    destination: extras.destination ?? "",
    headers: extras.headers,
  });
}

describe("service worker cache policy", () => {
  it("caches only the public offline shell and branded icons", () => {
    assert.equal(classify("/offline.html"), "cache-static");
    assert.equal(classify("/icons/icon-192.png"), "cache-static");
    assert.equal(classify("/icons/icon-512.png"), "cache-static");
    assert.equal(classify("/icons/icon-maskable-192.png"), "cache-static");
    assert.equal(classify("/icons/icon-maskable-512.png"), "cache-static");
    assert.equal(classify("/icons/apple-touch-icon.png"), "cache-static");
    assert.ok(policy.PUBLIC_ASSET_PATHS.includes("/offline.html"));
    assert.match(policy.CACHE_NAME, /^budgetapp-public-shell-/);
  });

  it("does not cache API, auth, Clerk, Supabase, RSC, or personalized HTML", () => {
    assert.equal(classify("/api/expenses"), "network-only");
    assert.equal(classify("/api/ai-cfo/chat"), "network-only");
    assert.equal(classify("/api/payments/batches"), "network-only");
    assert.equal(classify("/__clerk/v1/client"), "network-only");
    assert.equal(classify("/clerk/handshake"), "network-only");
    assert.equal(
      classify("/rest/v1/expenses", {
        absoluteUrl: "https://project.supabase.co/rest/v1/expenses?select=*",
        origin: ORIGIN,
      }),
      "network-only",
    );
    assert.equal(
      classify("/v1/client", {
        absoluteUrl: "https://example.clerk.accounts.dev/v1/client",
      }),
      "network-only",
    );
    assert.equal(classify("/projects", { headers: { rsc: "1", "next-url": "/projects" } }), "network-only");
    assert.equal(classify("/projects?_rsc=abc", { headers: { accept: "text/x-component" } }), "network-only");
    assert.equal(classify("/dashboard", { headers: { "next-router-state-tree": "1" } }), "network-only");
    assert.equal(classify("/projects", { headers: { "next-router-prefetch": "1" } }), "network-only");
    assert.equal(classify("/projects", { mode: "navigate", destination: "document" }), "navigation-fallback");
    assert.notEqual(classify("/expenses", { mode: "navigate", destination: "document" }), "cache-static");
    assert.equal(classify("/login", { mode: "navigate", destination: "document" }), "navigation-fallback");
  });

  it("does not cache non-GET requests or requests carrying authorization or secrets", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"]) {
      assert.equal(classify("/offline.html", { method }), "network-only");
      assert.equal(classify("/api/expenses", { method }), "network-only");
    }

    assert.equal(
      classify("/icons/icon-192.png", { headers: { authorization: "Bearer secret-token" } }),
      "network-only",
    );
    assert.equal(
      classify("/projects", {
        mode: "navigate",
        destination: "document",
        headers: { "proxy-authorization": "Basic abc" },
      }),
      "network-only",
    );
    assert.equal(classify("/icons/icon-512.png?token=secret"), "network-only");
    assert.equal(classify("/offline.html?access_token=secret"), "network-only");
    assert.equal(classify("/projects?code=oauth-code", { mode: "navigate", destination: "document" }), "network-only");
  });

  it("refuses to store redirected, private, cookie-setting, or mistyped responses", () => {
    const safePng = {
      ok: true,
      status: 200,
      type: "basic",
      redirected: false,
      setCookie: null,
      cacheControl: "public, max-age=3600",
      vary: null,
      contentType: "image/png",
      pathname: "/icons/icon-192.png",
    };

    assert.equal(policy.canStoreStaticResponse(safePng), true);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, pathname: "/offline.html", contentType: "text/html; charset=utf-8" }), true);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, setCookie: "clerk_session=secret" }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, cacheControl: "private, no-store" }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, redirected: true }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, status: 302, ok: false }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, type: "opaqueredirect" }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, contentType: "text/html", pathname: "/icons/icon-192.png" }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, pathname: "/projects", contentType: "text/html" }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, vary: "Cookie" }), false);
    assert.equal(policy.canStoreStaticResponse({ ...safePng, pathname: "/api/expenses", contentType: "application/json" }), false);
  });

  it("keeps navigation fallback out of the cache write path", () => {
    assert.equal(source.split("cache.put").length - 1, 1);
    const fallback = source.slice(
      source.indexOf("async function networkWithOfflineFallback"),
      source.indexOf("self.BudgetAppCachePolicy"),
    );
    assert.equal(fallback.includes("cache.put"), false);
    assert.match(fallback, /cache\.match\("\/offline\.html"\)/);
    assert.match(source, /decision === "network-only"/);
  });
});
