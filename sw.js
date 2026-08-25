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
const CACHE = 'irk-36f7f927ee73';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-CKTtcfgM.js",
  "./assets/BringScreen-Bl4UrcE7.js",
  "./assets/ClassScreen-D6C_E_bs.js",
  "./assets/CohortScreen-CAOHMdzw.js",
  "./assets/Field-m7issIgk.js",
  "./assets/FollowupsScreen-BWLFsizb.js",
  "./assets/JoinScreen-C99Xra4M.js",
  "./assets/Marks-62n_lTxP.js",
  "./assets/ReadScreen-ciqSGHVv.js",
  "./assets/ResultScreen-CxQyCB_i.js",
  "./assets/ReteachScreen-Bn8kzhfy.js",
  "./assets/ReturnScreen-D6AWhHMp.js",
  "./assets/SettingsScreen-oF-xxxRK.js",
  "./assets/StudentSheetScreen-DQT2mYN6.js",
  "./assets/TodayScreen-BIslNAml.js",
  "./assets/VivaScreen-DnNCJkc0.js",
  "./assets/WelcomeScreen-B5WJ5V1E.js",
  "./assets/WorkScreen-BTqvsJKT.js",
  "./assets/YouScreen-tRqhen4M.js",
  "./assets/arrow-left-DPWMR-Yz.js",
  "./assets/arrow-right-B5aMFpMC.js",
  "./assets/arrow-up-CeZBEUbl.js",
  "./assets/chevron-down-ButmjKgd.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-B1mRE5N6.css",
  "./assets/index-C-YgKOYd.js",
  "./assets/index-CjdFUQ-6.js",
  "./assets/index-D0X-5kFJ.js",
  "./assets/index.es-BIh8BNBl.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-D0bXunq-.js",
  "./assets/lock-keyhole-Bamz3EpM.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-DGJf-K1d.js",
  "./assets/plus-Kvums-h4.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-DJLX1GqD.js",
  "./assets/session-ops-fWSlC2qg.js",
  "./assets/sparkles-B_cGKE4Q.js",
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
