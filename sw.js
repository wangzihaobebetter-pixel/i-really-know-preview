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
const CACHE = 'irk-89780ef11e59';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-C5UcPSh4.js",
  "./assets/BringScreen-C555k6qz.js",
  "./assets/ClassScreen-WEC3KotK.js",
  "./assets/CohortScreen-Bv94dwPM.js",
  "./assets/Field-Sf9dVlIF.js",
  "./assets/FollowupsScreen-BXVyHtSN.js",
  "./assets/JoinScreen-CYOXfFqh.js",
  "./assets/Marks-C1TCbW1l.js",
  "./assets/ReadScreen-DMetRuLw.js",
  "./assets/ResultScreen-VzF13U6c.js",
  "./assets/ReteachScreen-C1sK8HlT.js",
  "./assets/ReturnScreen-DvgGUQxZ.js",
  "./assets/SettingsScreen-C0SPZvNU.js",
  "./assets/StudentSheetScreen-CeUJV_1c.js",
  "./assets/TodayScreen-CK9hsyJV.js",
  "./assets/VivaScreen-DPAXORt2.js",
  "./assets/WelcomeScreen-CJq-B4YR.js",
  "./assets/WorkScreen-wlkwSEWO.js",
  "./assets/YouScreen-D8MFmVDC.js",
  "./assets/arrow-left-DwdblkiV.js",
  "./assets/arrow-right-BrXT9HY2.js",
  "./assets/arrow-up-B1KoVcki.js",
  "./assets/chevron-down-B28lH8gQ.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-BEL6k-xK.js",
  "./assets/index-CMWJsZoy.css",
  "./assets/index-DhcEE-ds.js",
  "./assets/index-Dj3eeY-W.js",
  "./assets/index.es-BXAOqj8B.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-BDsgn9Xe.js",
  "./assets/lock-keyhole-BftbyOy8.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-Bhby26P8.js",
  "./assets/plus-C8AUARMR.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-KqKCVBE_.js",
  "./assets/session-ops-CQxZ7dAI.js",
  "./assets/sparkles-B56SdNYi.js",
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
