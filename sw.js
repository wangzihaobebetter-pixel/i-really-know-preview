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
const CACHE = 'irk-b35c7db83e16';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-Ce_-kSRy.js",
  "./assets/BringScreen-D7dd5E5s.js",
  "./assets/ClassScreen-hmRvLsmd.js",
  "./assets/CohortScreen-DrD5XhRh.js",
  "./assets/Field-CRQlyLQe.js",
  "./assets/FollowupsScreen-aPNj0CrP.js",
  "./assets/JoinScreen-Cq1PZ_5C.js",
  "./assets/Marks-vHvqiltg.js",
  "./assets/ReadScreen-ByNoC8e2.js",
  "./assets/ResultScreen-R4dtcyn5.js",
  "./assets/ReteachScreen-DWhhaVPU.js",
  "./assets/ReturnScreen-DxAMR2En.js",
  "./assets/SettingsScreen-CvssTBGh.js",
  "./assets/StudentSheetScreen-ChaX5oWj.js",
  "./assets/TodayScreen-CDVau4n-.js",
  "./assets/VivaScreen-DThnS8BV.js",
  "./assets/WelcomeScreen-LEXBpZVC.js",
  "./assets/WorkScreen-C2bCgua5.js",
  "./assets/YouScreen-BOif7oo7.js",
  "./assets/arrow-left-m0py6lUF.js",
  "./assets/arrow-right-C3V3_M6u.js",
  "./assets/arrow-up-DbDGtL8O.js",
  "./assets/chevron-down-CzZl_iWr.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-CAVx5Yqb.css",
  "./assets/index-Cg3YkKHl.js",
  "./assets/index-DO8mYPQt.js",
  "./assets/index.es-B4yOJnjb.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-B0qLNIEu.js",
  "./assets/lock-keyhole-BmxUdXQD.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-CEuq9wJr.js",
  "./assets/plus-B_xG_-8L.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-B_Zh5YDf.js",
  "./assets/session-ops-D54PyRae.js",
  "./assets/sparkles-CRhAHBa0.js",
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
