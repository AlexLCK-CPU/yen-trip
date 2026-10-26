/* 旅費換算 — 離線快取（App Shell）。
   加到主畫面後，就算冇網絡都開得返（會用上次存落嚟嘅滙率）。
   改版時把 VERSION 加一就會更新。
   注意：只快取自己網站嘅檔案，滙率 API 一定唔可以快取，否則永遠唔會更新。 */
var VERSION = 'yen-trip-v2';
var FILES = [
  './index.html',
  './site.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(c){
      return Promise.all(FILES.map(function(f){ return c.add(f)['catch'](function(){}); }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === VERSION ? null : caches['delete'](k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;

  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }

  /* 唔關自己事（例如滙率 API）→ 直接上網，唔經快取 */
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(hit){
      if (hit) return hit;
      return fetch(e.request)['catch'](function(){
        return caches.match('./index.html');
      });
    })
  );
});
