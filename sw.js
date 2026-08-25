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
const CACHE = 'irk-7ee82c9ee588';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-7bnBhjnZ.js",
  "./assets/BringScreen-BVAKnFqm.js",
  "./assets/ClassScreen-DKZmyNwE.js",
  "./assets/CohortScreen-DjA6WGwK.js",
  "./assets/Field-QMTwqCKn.js",
  "./assets/FollowupsScreen-414KQwaP.js",
  "./assets/JoinScreen-B3L3OQXW.js",
  "./assets/Marks-CGRHOs9k.js",
  "./assets/ReadScreen-CXFLnBfr.js",
  "./assets/ResultScreen-CIEpkbRj.js",
  "./assets/ReteachScreen-BFamrZz0.js",
  "./assets/ReturnScreen-vyLwf3ge.js",
  "./assets/SettingsScreen-QuTq36wm.js",
  "./assets/StudentSheetScreen-WA5D2oA7.js",
  "./assets/TodayScreen-D-o4vaaz.js",
  "./assets/VivaScreen-BA7VFWA0.js",
  "./assets/WelcomeScreen-S9caSGPD.js",
  "./assets/WorkScreen-a5vemDO9.js",
  "./assets/YouScreen-mRcUdiYa.js",
  "./assets/arrow-left-D_VQ8bPp.js",
  "./assets/arrow-right-BOCCfQCM.js",
  "./assets/arrow-up-ubyRBjfh.js",
  "./assets/chevron-down-Ccr8kxPP.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-C50mhAbe.js",
  "./assets/index-O3_ZbIUC.css",
  "./assets/index-WAwxZNLG.js",
  "./assets/index.es-BL_jBRDS.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-DLNkBhne.js",
  "./assets/lock-keyhole-C_a1jZ8G.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-o6mdvIQz.js",
  "./assets/plus-CyWbo036.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-CvXJ3xEo.js",
  "./assets/session-ops-CFKcEDXp.js",
  "./assets/sparkles-BYNrMp-q.js",
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
