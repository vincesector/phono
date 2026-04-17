/* coi-serviceworker.js
 * Injects Cross-Origin-Embedder-Policy + Cross-Origin-Opener-Policy headers
 * via a service worker so the page becomes crossOriginIsolated=true.
 * Required for SharedArrayBuffer (pthreads WASM / onnxruntime-web).
 * Pattern: https://github.com/gzuidhof/coi-serviceworker
 */

if (typeof window === "undefined") {
  /* ---- SERVICE WORKER SIDE ---- */
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

  self.addEventListener("fetch", (e) => {
    const req = e.request;
    // Only intercept same-origin requests (we can't modify cross-origin responses anyway).
    if (!req.url.startsWith(self.location.origin)) return;
    // Avoid intercepting no-cors cache-only requests (breaks some browsers).
    if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;

    e.respondWith(
      fetch(req).then((res) => {
        // Don't touch opaque or error responses.
        if (!res || res.status === 0 || res.type === "opaque") return res;

        const headers = new Headers(res.headers);
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        headers.set("Cross-Origin-Embedder-Policy", "credentialless");

        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers,
        });
      })
    );
  });
} else {
  /* ---- PAGE SIDE ---- */
  (() => {
    // Already isolated — nothing to do.
    if (self.crossOriginIsolated) return;

    // Needs HTTPS (service workers require a secure context).
    if (!window.isSecureContext) {
      console.warn("[phono] coi-serviceworker: not a secure context, skipping");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("[phono] coi-serviceworker: no service worker support");
      return;
    }

    function reload() {
      // Guard against edge cases where reload fires but isolation still isn't set.
      if (self.crossOriginIsolated) return;
      window.location.reload();
    }

    navigator.serviceWorker
      .register(document.currentScript.src)
      .then((reg) => {
        if (navigator.serviceWorker.controller) {
          // SW is already controlling this page but isolation isn't set yet
          // (e.g. page was loaded before SW activated on a previous visit).
          reload();
        } else {
          // Fresh install — wait for the SW to activate and claim clients.
          navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
        }
      })
      .catch((err) => {
        console.warn("[phono] coi-serviceworker: registration failed", err);
      });
  })();
}
