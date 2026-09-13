// 离线缓存：先用缓存秒开页面，后台再更新（国内访问 GitHub 慢时也不用干等）
const CACHE = "time-planner-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // GitHub API 等外部请求不缓存
  const net = fetch(e.request).then(r => {
    if (!r.ok) return r;
    const cp = r.clone();
    return caches.open(CACHE).then(c => c.put(e.request, cp)).then(() => r);
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || net)
      .catch(() => caches.match("./index.html"))
  );
});
