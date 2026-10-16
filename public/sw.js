/* BudgetApp public shell service worker.
 *
 * Caches only the generic offline page and branded icons.
 * Never caches HTML navigations, RSC payloads, API routes, Clerk,
 * Supabase, auth responses, non-GET requests, or credentialed data.
 */
"use strict";

const CACHE_NAME = "budgetapp-public-shell-v1";
const PUBLIC_ASSET_PATHS = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];
const SENSITIVE_PREFIXES = ["/api", "/_next", "/__clerk", "/clerk"];
const SECRET_QUERY_KEYS = {
  token: true,
  access_token: true,
  refresh_token: true,
  id_token: true,
  code: true,
  api_key: true,
  apikey: true,
  secret: true,
  session: true,
  clerk: true,
  authorization: true,
  key: true,
};

function headerValue(headers, name) {
  if (!headers) {
    return "";
  }

  const target = name.toLowerCase();
  const keys = Object.keys(headers);

  for (let index = 0; index < keys.length; index += 1) {
    if (keys[index].toLowerCase() === target) {
      const value = headers[keys[index]];
      return value == null ? "" : String(value);
    }
  }

  return "";
}

function isSensitivePath(pathname) {
  const path = String(pathname || "").toLowerCase();

  for (let index = 0; index < SENSITIVE_PREFIXES.length; index += 1) {
    const prefix = SENSITIVE_PREFIXES[index];
    if (path === prefix || path.indexOf(prefix + "/") === 0) {
      return true;
    }
  }

  return path.indexOf("clerk") !== -1 || path.indexOf("supabase") !== -1;
}

function hasSecretQuery(url) {
  const params = url.searchParams;
  const names = Array.from(params.keys());

  for (let index = 0; index < names.length; index += 1) {
    if (SECRET_QUERY_KEYS[names[index].toLowerCase()]) {
      return true;
    }
  }

  return false;
}

function isPrivateFetch(headers, url) {
  if (headerValue(headers, "authorization") || headerValue(headers, "proxy-authorization")) {
    return true;
  }

  if (headerValue(headers, "rsc") === "1") {
    return true;
  }

  if (headerValue(headers, "next-router-state-tree") || headerValue(headers, "next-url")) {
    return true;
  }

  if (headerValue(headers, "next-router-prefetch")) {
    return true;
  }

  const purpose = (headerValue(headers, "purpose") + " " + headerValue(headers, "sec-purpose")).toLowerCase();
  if (purpose.indexOf("prefetch") !== -1) {
    return true;
  }

  const accept = headerValue(headers, "accept").toLowerCase();
  if (accept.indexOf("text/x-component") !== -1) {
    return true;
  }

  return url.search.indexOf("_rsc=") !== -1;
}

function expectedContentType(pathname) {
  if (pathname === "/offline.html") {
    return "text/html";
  }

  if (PUBLIC_ASSET_PATHS.indexOf(pathname) !== -1 && pathname.slice(-4) === ".png") {
    return "image/png";
  }

  return "";
}

function classifyFetch(input) {
  const method = String((input && input.method) || "").toUpperCase();

  if (method !== "GET") {
    return "network-only";
  }

  let url;
  try {
    url = new URL(input.url);
  } catch {
    return "network-only";
  }

  if (!input.origin || url.origin !== input.origin) {
    return "network-only";
  }

  if (hasSecretQuery(url) || isPrivateFetch(input.headers, url) || isSensitivePath(url.pathname)) {
    return "network-only";
  }

  if (PUBLIC_ASSET_PATHS.indexOf(url.pathname) !== -1 && url.search === "") {
    return "cache-static";
  }

  const mode = input.mode || "";
  const destination = input.destination || "";

  if (mode === "navigate" || destination === "document") {
    return "navigation-fallback";
  }

  return "network-only";
}

function canStoreStaticResponse(input) {
  if (!input || input.ok !== true || input.status !== 200 || input.type !== "basic" || input.redirected) {
    return false;
  }

  if (input.setCookie) {
    return false;
  }

  const cacheControl = String(input.cacheControl || "").toLowerCase();
  if (cacheControl.indexOf("no-store") !== -1 || cacheControl.indexOf("private") !== -1) {
    return false;
  }

  if (String(input.vary || "").toLowerCase().indexOf("cookie") !== -1) {
    return false;
  }

  const expected = expectedContentType(input.pathname);
  if (!expected) {
    return false;
  }

  return String(input.contentType || "").toLowerCase().indexOf(expected) !== -1;
}

function headersToObject(headers) {
  const result = {};

  if (!headers || typeof headers.forEach !== "function") {
    return result;
  }

  headers.forEach((value, key) => {
    result[String(key).toLowerCase()] = value;
  });

  return result;
}

function classifyRequest(request) {
  return classifyFetch({
    method: request.method,
    url: request.url,
    origin: self.location.origin,
    mode: request.mode,
    destination: request.destination,
    headers: headersToObject(request.headers),
  });
}

function responseFacts(response, pathname) {
  return {
    ok: response.ok,
    status: response.status,
    type: response.type,
    redirected: response.redirected,
    setCookie: response.headers.get("set-cookie"),
    cacheControl: response.headers.get("cache-control"),
    vary: response.headers.get("vary"),
    contentType: response.headers.get("content-type"),
    pathname: pathname,
  };
}

async function putIfSafe(cache, request, response, pathname) {
  if (!canStoreStaticResponse(responseFacts(response, pathname))) {
    return false;
  }

  await cache.put(request, response.clone());
  return true;
}

async function precachePublicAssets() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    PUBLIC_ASSET_PATHS.map(async (path) => {
      try {
        const response = await fetch(path, { cache: "reload", redirect: "manual", credentials: "omit" });
        await putIfSafe(cache, path, response, path);
      } catch {
        // A missing public asset must not block the worker from activating.
      }
    }),
  );
}

async function cachePublicAsset(request, pathname) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(pathname);

  if (cached) {
    return cached;
  }

  const response = await fetch(request.url, { cache: "reload", redirect: "manual", credentials: "omit" });
  await putIfSafe(cache, pathname, response, pathname);
  return response;
}

async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const offline = await cache.match("/offline.html");

    if (offline) {
      return offline;
    }

    return new Response(
      "BudgetApp is offline. Budgets, expenses, sign-in, and AI are unavailable without a connection.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}

self.BudgetAppCachePolicy = {
  CACHE_NAME: CACHE_NAME,
  PUBLIC_ASSET_PATHS: PUBLIC_ASSET_PATHS,
  classifyFetch: classifyFetch,
  canStoreStaticResponse: canStoreStaticResponse,
  expectedContentType: expectedContentType,
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    precachePublicAssets().catch(() => {
      return undefined;
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.indexOf("budgetapp-") === 0 && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const decision = classifyRequest(request);

  if (decision === "network-only") {
    return;
  }

  if (decision === "cache-static") {
    const pathname = new URL(request.url).pathname;
    event.respondWith(cachePublicAsset(request, pathname));
    return;
  }

  if (decision === "navigation-fallback") {
    event.respondWith(networkWithOfflineFallback(request));
  }
});
