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
const CACHE = 'irk-0c832c17f05f';
// build-sw.mjs replaces the marker in dist/sw.js with every emitted lazy
// chunk, font and icon. That makes a first successful load a complete offline
// install rather than an offline shell with dead routes.
const CORE = ['./', './index.html', './manifest.webmanifest', "./assets/AnchoredText-Dl-jf51F.js",
  "./assets/BringScreen-z1eiNAGk.js",
  "./assets/ClassScreen-D_3E3QnW.js",
  "./assets/CohortScreen-rkM4HN3n.js",
  "./assets/Field-Dn_8GLfs.js",
  "./assets/FollowupsScreen-DwBU6XrW.js",
  "./assets/JoinScreen-9DtjKSRR.js",
  "./assets/Marks-Cw0xi81F.js",
  "./assets/ReadScreen-BBGAxf_d.js",
  "./assets/ResultScreen-ecQiEWbb.js",
  "./assets/ReteachScreen-DWpc1vnj.js",
  "./assets/ReturnScreen-Br44S6Ou.js",
  "./assets/SettingsScreen-CTJ3VmfI.js",
  "./assets/StudentSheetScreen-tK5L2e-k.js",
  "./assets/TodayScreen-kgab_jRq.js",
  "./assets/VivaScreen-mERylONA.js",
  "./assets/WelcomeScreen-C6-XQp-T.js",
  "./assets/WorkDetailScreen-eoy0SshV.js",
  "./assets/WorkScreen-B6XynHEw.js",
  "./assets/YouScreen-Bcsiz67a.js",
  "./assets/arrow-left-DF8q4Zrp.js",
  "./assets/arrow-right-B-yCqb-d.js",
  "./assets/arrow-up-Cu7G4kpG.js",
  "./assets/chevron-down-B-wOnMHw.js",
  "./assets/html2canvas.esm-BfxBtG_O.js",
  "./assets/index-C8ujZ3OT.js",
  "./assets/index-CmKWBxEu.js",
  "./assets/index-DDiX0DQS.js",
  "./assets/index-Qma5q185.css",
  "./assets/index.es-yLVTQMH2.js",
  "./assets/inter-latin-ext-wght-normal-CFHvXkgd.woff2",
  "./assets/inter-latin-wght-normal-C2S99t-D.woff2",
  "./assets/llm-Dtxm_a4n.js",
  "./assets/lock-keyhole-BvwP0Bmj.js",
  "./assets/nunito-latin-wght-normal-BaTF6Vo7.woff2",
  "./assets/pdf-C1ciRO8N.js",
  "./assets/plus-BwuHINPr.js",
  "./assets/purify.es-DP5U8-sc.js",
  "./assets/rotate-ccw-vzw5w80P.js",
  "./assets/session-ops-BkBVnEl1.js",
  "./assets/sparkles-B-F1NzEm.js",
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
