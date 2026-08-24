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
const CACHE = 'irk-9b4926a47810';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-C80iua5d.js",
  "./assets/BringScreen-B40_c_Do.js",
  "./assets/ClassScreen-DCykKy1a.js",
  "./assets/CohortScreen-BnhHs-ib.js",
  "./assets/Field-DzodMgpv.js",
  "./assets/FollowupsScreen-Bog6MoWU.js",
  "./assets/JoinScreen-DXTYfwpt.js",
  "./assets/Marks-yGczrfZa.js",
  "./assets/ReadScreen-D0gb8QaX.js",
  "./assets/ResultScreen-DsYbWfrc.js",
  "./assets/ReteachScreen-DKrrnzDg.js",
  "./assets/ReturnScreen-C1giSi3y.js",
  "./assets/SettingsScreen-CI3_VEOK.js",
  "./assets/StudentSheetScreen-D9tTRvy8.js",
  "./assets/TodayScreen-BPgafg1D.js",
  "./assets/VivaScreen-D8dMLARL.js",
  "./assets/WelcomeScreen-BupkiDjk.js",
  "./assets/WorkDetailScreen-DqZRRkv1.js",
  "./assets/WorkScreen-Dy1Sl4jf.js",
  "./assets/YouScreen-CXKQ-tgv.js",
  "./assets/arrow-left-CuiPrWPV.js",
  "./assets/arrow-right-BkbkwJWz.js",
  "./assets/arrow-up-DW9rUkEw.js",
  "./assets/chevron-down-BO_RFq5W.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-BRV2yc0Q.css",
  "./assets/index-DDiX0DQS.js",
  "./assets/index-DN2cCdoD.js",
  "./assets/index-DlkgdETF.js",
  "./assets/index.es-B1tkMGVf.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-D87gErYx.js",
  "./assets/lock-keyhole-D_l6hUdd.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-JmnR4Jcd.js",
  "./assets/plus-DLD9guaM.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-ZXpUtfGm.js",
  "./assets/session-ops-Dkw0Ge6W.js",
  "./assets/sparkles-rcpfWkAv.js",
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
