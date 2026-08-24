/**
 * I Really Know — service worker.
 *
 * Two strategies, on purpose:
 *  - Vite emits content-hashed asset filenames, so those are immutable:
 *    cache-first, which is what makes the app genuinely usable offline.
 *  - Everything else (navigations, the manifest, icons) is network-first, so a
 *    new deploy is never hidden behind a stale cache. Falling back to the cached
 *    index.html keeps deep links working with no connection.
 */
const CACHE = 'irk-30b9aeafa09e';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-DzmIncPn.js",
  "./assets/BringScreen-BPulvVGG.js",
  "./assets/ClassScreen-fbDnXq0b.js",
  "./assets/CohortScreen-DHxbRpvX.js",
  "./assets/Field-B1-V6g1z.js",
  "./assets/FollowupsScreen-CoqJqbyV.js",
  "./assets/JoinScreen-DIb_ahPv.js",
  "./assets/Marks-CcYtzHXI.js",
  "./assets/ReadScreen-yPG5aruq.js",
  "./assets/ResultScreen-Ch4QlN0j.js",
  "./assets/ReteachScreen-yMWqfSOj.js",
  "./assets/ReturnScreen-CxtCyPMH.js",
  "./assets/SettingsScreen-B5v7W4cO.js",
  "./assets/StudentSheetScreen--bmOjB_5.js",
  "./assets/TodayScreen-DewkoIqT.js",
  "./assets/VivaScreen-CLCpiyME.js",
  "./assets/WelcomeScreen-BeLpwrYW.js",
  "./assets/WorkScreen-B1JUI-2W.js",
  "./assets/YouScreen-DyS-TURt.js",
  "./assets/arrow-left-DGj7ma6h.js",
  "./assets/arrow-right-C5NRZ-PM.js",
  "./assets/arrow-up-ySUi7ojT.js",
  "./assets/chevron-down-gdUNg4_Q.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-BfKFP4oy.js",
  "./assets/index-CMWJsZoy.css",
  "./assets/index-DDiX0DQS.js",
  "./assets/index-Q6VaXPLN.js",
  "./assets/index.es-Bxz9qxeD.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-XqFoXSao.js",
  "./assets/lock-keyhole-B54e9-Vv.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-D_B2T5SD.js",
  "./assets/plus-Cpg282W5.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-D812UgSW.js",
  "./assets/session-ops-DdU5nNb-.js",
  "./assets/sparkles-B_vXBVmb.js",
  "./assets/student-links-D05sJ4Le.js",
  "./fonts/fraunces-latin-wght-normal.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon-512.png",
  "./icons/icon.svg"];

const isImmutable = (url) =>
  url.pathname.includes('/assets/') && /-[A-Za-z0-9_-]{8,}\.(js|css|woff2?)$/.test(url.pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          // Only ever store a success. A 404 is a *successful* fetch as far as JS is
          // concerned, so caching one here would pin a dead asset forever under
          // cache-first — which is exactly how a deploy-window 404 bricked the app.
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html'))),
  );
});
