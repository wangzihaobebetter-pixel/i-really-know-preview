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
const CACHE = 'irk-22696f0ee2fc';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-pW1XjflF.js",
  "./assets/BringScreen-CIn0NK1k.js",
  "./assets/ClassScreen-PmePMbKo.js",
  "./assets/CohortScreen-DvNcVmDr.js",
  "./assets/Field-DECP9uxm.js",
  "./assets/FollowupsScreen-DUfKncN7.js",
  "./assets/JoinScreen-OJFS4gY1.js",
  "./assets/Marks-CLhYZw3X.js",
  "./assets/ReadScreen-U2fx0Lbn.js",
  "./assets/ResultScreen-DXAWxCM_.js",
  "./assets/ReteachScreen-p5HNCpPK.js",
  "./assets/ReturnScreen-gakRRhVu.js",
  "./assets/SettingsScreen-BPIgMsc2.js",
  "./assets/StudentSheetScreen-ILwuNaMe.js",
  "./assets/TodayScreen-U3SOfQt-.js",
  "./assets/VivaScreen-Kemznpdr.js",
  "./assets/WelcomeScreen-BAzNufEP.js",
  "./assets/WorkScreen-BBL9Ec0Y.js",
  "./assets/YouScreen-CGbOL06L.js",
  "./assets/arrow-left-B7_NE2Qc.js",
  "./assets/arrow-right-Bxk97FmQ.js",
  "./assets/arrow-up-DAd0KP97.js",
  "./assets/chevron-down-DN21BjNo.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-4m38CMiJ.js",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-DrykTScv.css",
  "./assets/index-aAolPWCU.js",
  "./assets/index.es-DqIbNgzN.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-D3Jzq5CW.js",
  "./assets/lock-keyhole-T5efzAsr.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-BpXRhEdB.js",
  "./assets/plus-4WwwfL7a.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-a_kZk7Ju.js",
  "./assets/session-ops-DmbpssDW.js",
  "./assets/sparkles-PNCW2fR9.js",
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
