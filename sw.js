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
const CACHE = 'irk-a0fd9c62fb99';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-CRmJz-0r.js",
  "./assets/BringScreen-LATymowm.js",
  "./assets/ClassScreen-C9kgYP3y.js",
  "./assets/CohortScreen-BkLPqVQY.js",
  "./assets/Field-Bdl-7y9i.js",
  "./assets/FollowupsScreen-CBJT7fG7.js",
  "./assets/JoinScreen-H2ZpjGWP.js",
  "./assets/Marks-Cy7ZvLqD.js",
  "./assets/ReadScreen-DuYnt5U2.js",
  "./assets/ResultScreen-RFzSGQBA.js",
  "./assets/ReteachScreen-Cqd4lmku.js",
  "./assets/ReturnScreen-BIym_TxZ.js",
  "./assets/SettingsScreen-uey2D5nx.js",
  "./assets/StudentSheetScreen-lUoM7s52.js",
  "./assets/TodayScreen-Cm9SNCcM.js",
  "./assets/VivaScreen-DiMDUiTy.js",
  "./assets/WelcomeScreen-FXHzRrxQ.js",
  "./assets/WorkScreen-afA78Ezp.js",
  "./assets/YouScreen-B8aBsmSI.js",
  "./assets/arrow-left-CkjnyLVF.js",
  "./assets/arrow-right-B9hdaphy.js",
  "./assets/arrow-up-BxJ8OGkZ.js",
  "./assets/chevron-down-C6mCNWN1.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-CguxFRop.js",
  "./assets/index-DxKuBT0u.css",
  "./assets/index-Xgn1yNzR.js",
  "./assets/index.es-BSPQaDb1.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-jhSfiAW5.js",
  "./assets/lock-keyhole-DpJq9Tnn.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-bMvrHOtF.js",
  "./assets/plus-TSby8ly7.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-BT3BkxvH.js",
  "./assets/session-ops-Df37iEXc.js",
  "./assets/sparkles-D2SKLaHl.js",
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
