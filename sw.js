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
const CACHE = 'irk-f1bb2946d6ce';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-BKHwLv8Z.js",
  "./assets/BringScreen-BpEsjPqg.js",
  "./assets/ClassScreen-CT-1RG6D.js",
  "./assets/CohortScreen-BBz1_Qv3.js",
  "./assets/Field-B9DBKJ_U.js",
  "./assets/FollowupsScreen-bufPbfQt.js",
  "./assets/JoinScreen-YCN3gR21.js",
  "./assets/Marks-DF_WO0Ot.js",
  "./assets/ReadScreen-DvRaj1Vm.js",
  "./assets/ResultScreen-S0ug8ZU9.js",
  "./assets/ReteachScreen-NjK84cj7.js",
  "./assets/ReturnScreen-6AJAqNth.js",
  "./assets/SettingsScreen-Jv3chVpP.js",
  "./assets/StudentSheetScreen-DclOKsLk.js",
  "./assets/TodayScreen-DTclSz_3.js",
  "./assets/VivaScreen-BMfgnJdg.js",
  "./assets/WelcomeScreen-q6UQQtj1.js",
  "./assets/WorkScreen-D3F1PVE9.js",
  "./assets/YouScreen-B-Ig-skY.js",
  "./assets/arrow-left-MGDfQHBq.js",
  "./assets/arrow-right-yaPhmeV8.js",
  "./assets/arrow-up-MdnrvdrV.js",
  "./assets/chevron-down-BKbi7vre.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-BQwd4aGu.css",
  "./assets/index-Bm_Gy8fZ.js",
  "./assets/index-BtlKmQsb.js",
  "./assets/index-DDiX0DQS.js",
  "./assets/index.es-DXjf6XiI.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-B8ggZWZb.js",
  "./assets/lock-keyhole-v8M1ULcO.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-BOBEERiJ.js",
  "./assets/plus-D-o9b4yI.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-gQg1xTZd.js",
  "./assets/session-ops-DLbtzgwk.js",
  "./assets/sparkles-BAb6cc-r.js",
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
