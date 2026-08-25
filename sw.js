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
const CACHE = 'irk-e59da5db2fcc';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-CJmujtZU.js",
  "./assets/BringScreen-D3CCxmRp.js",
  "./assets/ClassScreen-YKzCrnnL.js",
  "./assets/CohortScreen-CzlLO2m-.js",
  "./assets/Field-CC3cq036.js",
  "./assets/FollowupsScreen-DZfqwKwl.js",
  "./assets/JoinScreen-rLvQku0o.js",
  "./assets/Marks-flnkIToR.js",
  "./assets/ReadScreen-BXCFltae.js",
  "./assets/ResultScreen-BC0Xaa4I.js",
  "./assets/ReteachScreen-hE-gXpmv.js",
  "./assets/ReturnScreen-C8b4fuBR.js",
  "./assets/SettingsScreen-DH5D8zBa.js",
  "./assets/StudentSheetScreen-C7F935fw.js",
  "./assets/TodayScreen-I63EZnA1.js",
  "./assets/VivaScreen-BkO96PYg.js",
  "./assets/WelcomeScreen-DwmeCPNe.js",
  "./assets/WorkScreen-DQ99NDfw.js",
  "./assets/YouScreen-BLWFm2tB.js",
  "./assets/arrow-left-PEQLV7Ea.js",
  "./assets/arrow-right-TMPcIZO9.js",
  "./assets/arrow-up-04FGA9wb.js",
  "./assets/chevron-down-DlPvS6lx.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-BGS0WR6S.js",
  "./assets/index-BgXAIviT.css",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-CCBwCaUA.js",
  "./assets/index.es-Z0JJVhMQ.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-BlityxWV.js",
  "./assets/lock-keyhole-BkoxdeBT.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-DxzyHAN3.js",
  "./assets/plus-KLMJZN01.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-CsNx_IJI.js",
  "./assets/session-ops-CWjT9g7U.js",
  "./assets/sparkles-Dyc9i7TE.js",
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
