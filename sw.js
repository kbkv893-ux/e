const CACHE = "ledger-v1";
const FILES = ["./", "index.html", "script.js", "style.css", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("fetch", function(e) {
  e.respondWith(
    fetch(e.request).catch(function() { return caches.match(e.request); })
  );
});
