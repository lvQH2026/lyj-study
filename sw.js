// 吕泳冀学习站 Service Worker
// v48：考试板块单元考试对齐期末规则——单元考试启用同单元配图保底（imgSrc=units，绝不混入他单元）、配图保底题池独立 seen+按题面去重+采样量 200、修复 g5_equation 非整数解与 g5_tree/g_app_planting 不整除红线、行程三模板（求路程/相遇配线段图/求时间）、工程题扩容+专属步骤推导、5 个无图生成器重写扩容配图（旋转/分数条/分数圆/数阵/线段比/袋中球/数轴）、植树步骤正则对齐现行题干
const CACHE = 'lyj-shell-v48';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './css/english.css',
  './js/core.js', './js/math.js', './js/data.js', './js/english.js', './js/chinese.js', './js/diagram.js', './js/main.js', './js/aiAnalysis.js',
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
