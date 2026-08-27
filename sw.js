// 吕泳冀学习站 Service Worker
// v64：圆柱与圆锥单元新增「侧面展开·表面积」tab（沿高剪开→侧面展开成长方形→S侧=2πrh→加两底面得 S表=2πrh+2πr²），与已上线体积推导成组。diagram.js 在 SHELL 内，升版本强制重装
const CACHE = 'lyj-shell-v64';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './css/english.css',
  './js/core.js', './js/math.js', './js/data.js', './js/english.js', './js/chinese.js', './js/diagram.js', './js/main.js', './js/aiAnalysis.js',
  './js/supabase-js.min.js',
  './config.js', './supabase.js', './parent.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 网络优先：保证题库/内容更新（来自 Supabase）能实时生效；离线时回退缓存
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});
