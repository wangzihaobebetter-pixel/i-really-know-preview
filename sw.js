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
const CACHE = 'irk-b601f165e453';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-Bb6y4q7u.js",
  "./assets/BringScreen-L_UJSFeB.js",
  "./assets/ClassScreen-BJoWZ_yB.js",
  "./assets/CohortScreen-a_n0Uns5.js",
  "./assets/Field-YgG5lRyQ.js",
  "./assets/FollowupsScreen-D8BIRLLa.js",
  "./assets/JoinScreen-f3P9Whjn.js",
  "./assets/Marks-DxEkOr1R.js",
  "./assets/ReadScreen-V5i8juBM.js",
  "./assets/ResultScreen-BRaCdtJ-.js",
  "./assets/ReteachScreen-1bjZOoiJ.js",
  "./assets/ReturnScreen-Db87CgTy.js",
  "./assets/SettingsScreen-DKtswmi1.js",
  "./assets/StudentSheetScreen-D2NOe3Bn.js",
  "./assets/TodayScreen-BXkY-UmC.js",
  "./assets/VivaScreen-PftcENiX.js",
  "./assets/WelcomeScreen-BSsMoeea.js",
  "./assets/WorkScreen-aXYq5X_G.js",
  "./assets/YouScreen-Bel0Efz0.js",
  "./assets/arrow-left-B7aESJfF.js",
  "./assets/arrow-right-BK55wM3J.js",
  "./assets/arrow-up-D1CgATGq.js",
  "./assets/chevron-down-DS3jAf5w.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-B9D89AIN.js",
  "./assets/index-CMWJsZoy.css",
  "./assets/index-DDiX0DQS.js",
  "./assets/index-DJ7QvVuL.js",
  "./assets/index.es-BffeFiIv.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-C0k7yhGr.js",
  "./assets/lock-keyhole-DO_9TSMG.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-DkJeza94.js",
  "./assets/plus-BHZxRsvY.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-1YWEVf0H.js",
  "./assets/session-ops-BO12vjCL.js",
  "./assets/sparkles-CsTuhumA.js",
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
