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
const CACHE = 'irk-34341ab4e790';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-CroZKQ6j.js",
  "./assets/BringScreen-Co7gL6Li.js",
  "./assets/ClassScreen-38yezw8O.js",
  "./assets/CohortScreen-DFHxuFz7.js",
  "./assets/Field-eqdaPl0j.js",
  "./assets/FollowupsScreen-4_8mi4pl.js",
  "./assets/JoinScreen-ByYEB7-G.js",
  "./assets/Marks-B11Ih3fo.js",
  "./assets/ReadScreen-wHlvqhPL.js",
  "./assets/ResultScreen-CVvwKY1o.js",
  "./assets/ReteachScreen-Cd_DtdgK.js",
  "./assets/ReturnScreen-l9Yb5oWd.js",
  "./assets/SettingsScreen-rp3AIRnc.js",
  "./assets/StudentSheetScreen-DkvaSbt1.js",
  "./assets/TodayScreen-DVRjzuuY.js",
  "./assets/VivaScreen-FFCddkjo.js",
  "./assets/WelcomeScreen-QrMHeW3I.js",
  "./assets/WorkScreen-BnSMwIgK.js",
  "./assets/YouScreen-Bpoy-c5a.js",
  "./assets/arrow-left-DmM31loU.js",
  "./assets/arrow-right-BBL2Wp00.js",
  "./assets/arrow-up-BnAKPs8z.js",
  "./assets/chevron-down-Iu6ptzM-.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-BZE95mqj.js",
  "./assets/index-BovQVBvv.js",
  "./assets/index-CMWJsZoy.css",
  "./assets/index-D-jYLVPJ.js",
  "./assets/index.es-QV0MhxbX.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-DyDTYAgw.js",
  "./assets/lock-keyhole-Bwdblw-Y.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-BDCQQqBG.js",
  "./assets/plus-BtR8z2xr.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-CkIrO-Qd.js",
  "./assets/session-ops-Dv-7-XLD.js",
  "./assets/sparkles-BnnkAIbt.js",
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
