/* coi-serviceworker.js — DISABLED
 * Previous version caused regressions on WebKit/iOS by intercepting and
 * reconstructing all fetch responses. This version self-destructs to clean
 * up any installations in users' browsers.
 */
if (typeof window === "undefined") {
  // Service worker side: unregister immediately on activation.
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => {
    e.waitUntil(
      self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
        clients.forEach((c) => c.navigate(c.url));
      })
    );
  });
}
// No page-side registration — don't install new SW.
