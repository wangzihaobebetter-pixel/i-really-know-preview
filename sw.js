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
const CACHE = 'irk-06ad2e913264';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-BoKp6DRr.js",
  "./assets/BringScreen-Dk6m-3Q-.js",
  "./assets/ClassScreen-DK0Lx0VF.js",
  "./assets/CohortScreen-CrqfHh6Z.js",
  "./assets/Field-TLLVgkRG.js",
  "./assets/FollowupsScreen-Czn8-_au.js",
  "./assets/JoinScreen-DsXFdhGF.js",
  "./assets/Marks-BsVZ84c1.js",
  "./assets/ReadScreen-UsV3kE9F.js",
  "./assets/ResultScreen-2x2oRwlR.js",
  "./assets/ReteachScreen-CRZRqxbc.js",
  "./assets/ReturnScreen-AgWRm3oj.js",
  "./assets/SettingsScreen-BH2VxkTg.js",
  "./assets/StudentSheetScreen-I3ykdy5d.js",
  "./assets/TodayScreen-DcE3ARlr.js",
  "./assets/VivaScreen-BDWJrGFw.js",
  "./assets/WelcomeScreen-WFf9xOzF.js",
  "./assets/WorkScreen-D4YG_G_N.js",
  "./assets/YouScreen-Cp2cJWgl.js",
  "./assets/arrow-left-D25SB_GY.js",
  "./assets/arrow-right-B-XTpga9.js",
  "./assets/arrow-up-cOcqlEMI.js",
  "./assets/chevron-down-CrBBgTj7.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-CRe2ik67.js",
  "./assets/index-C_joIspX.css",
  "./assets/index-DAlLrHan.js",
  "./assets/index.es-CJ8xr9hV.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-CB1jW9po.js",
  "./assets/lock-keyhole-KRT9WDR9.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-GuQ0Miwn.js",
  "./assets/plus-tsYWYbre.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-BSd6816P.js",
  "./assets/session-ops-Boz4h-Lk.js",
  "./assets/sparkles-2-TEG_68.js",
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
