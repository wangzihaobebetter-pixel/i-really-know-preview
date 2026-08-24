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
const CACHE = 'irk-373b9eee3d00';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-hk96WPUQ.js",
  "./assets/BringScreen-CWhEMSCm.js",
  "./assets/ClassScreen-DuX8d45g.js",
  "./assets/CohortScreen-CF9oRK9Y.js",
  "./assets/Field-7XKbOxYM.js",
  "./assets/FollowupsScreen-Bzysqfyi.js",
  "./assets/JoinScreen-pZbDFD6s.js",
  "./assets/Marks-DPIyIx9t.js",
  "./assets/ReadScreen-AsQ0MBT5.js",
  "./assets/ResultScreen-CAK2m_nJ.js",
  "./assets/ReteachScreen-bG5y3HIQ.js",
  "./assets/ReturnScreen-CuOP3bAx.js",
  "./assets/SettingsScreen-D1tBmo5a.js",
  "./assets/StudentSheetScreen-jdBI383K.js",
  "./assets/TodayScreen-BI3IGZhQ.js",
  "./assets/VivaScreen-CAo4v5py.js",
  "./assets/WelcomeScreen-1TrTknWI.js",
  "./assets/WorkScreen-TmDq0yM5.js",
  "./assets/YouScreen-C6WLLKfk.js",
  "./assets/arrow-left-I5FplMpt.js",
  "./assets/arrow-right-CJNdRHwL.js",
  "./assets/arrow-up-BE19uOqd.js",
  "./assets/chevron-down-kLQe69iv.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-30EUzQVW.js",
  "./assets/index-B1mRE5N6.css",
  "./assets/index-By6Lrxgb.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index.es-Fz8cgg9X.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-CGgdo7-g.js",
  "./assets/lock-keyhole-CCHB-P5I.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-DDoEGyK6.js",
  "./assets/plus-B_9UToFL.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-DsKfZHH0.js",
  "./assets/session-ops-BBKl_Sfx.js",
  "./assets/sparkles-Ff8BAV6a.js",
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
