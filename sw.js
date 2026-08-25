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
const CACHE = 'irk-3255e57ef7ab';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-_tfimHAc.js",
  "./assets/BringScreen-DHPrYktq.js",
  "./assets/ClassScreen-BikZm_Nw.js",
  "./assets/CohortScreen-GdEzAZiY.js",
  "./assets/Field-DWEQIGq8.js",
  "./assets/FollowupsScreen-CBFrx3Gk.js",
  "./assets/JoinScreen-Ddj-XFYJ.js",
  "./assets/Marks-BE3m3lw3.js",
  "./assets/ReadScreen-hPu-_Vei.js",
  "./assets/ResultScreen-B3e34fpU.js",
  "./assets/ReteachScreen-BKYyNq1C.js",
  "./assets/ReturnScreen-BUt9YebY.js",
  "./assets/SettingsScreen-DimPTn5i.js",
  "./assets/StudentSheetScreen-QHaO742t.js",
  "./assets/TodayScreen-D65UuK77.js",
  "./assets/VivaScreen-CdAZrqqc.js",
  "./assets/WelcomeScreen-Bp_luyLF.js",
  "./assets/WorkScreen-7B896zPq.js",
  "./assets/YouScreen-CKHnUcJR.js",
  "./assets/arrow-left-CP1bScPU.js",
  "./assets/arrow-right-Bv4sjM98.js",
  "./assets/arrow-up-Do5dJ6nA.js",
  "./assets/chevron-down-CV2bO-jU.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-C7eQaV27.js",
  "./assets/index-DXHQpS0W.css",
  "./assets/index-j1F16gnf.js",
  "./assets/index.es-BSTOKIIs.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-BiOHFc0Q.js",
  "./assets/lock-keyhole-CUl18hzs.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-B9sYk_u2.js",
  "./assets/plus-DMArvZ_T.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-9D7kmpe_.js",
  "./assets/session-ops-C7yT-9mr.js",
  "./assets/sparkles-BbTJug-1.js",
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
