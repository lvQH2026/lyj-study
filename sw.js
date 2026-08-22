// 吕泳冀学习站 Service Worker
// v49：六年级课本同步三层结构——六上六下 13 课本单元（位置与方向二/数与形/鸽巢问题等 3 新单元）+ summary/fidx/method 三字段 + 同步学习页三层卡片 + 首页三分区；考试组卷铁律（期中/期末/月考只考课本单元）；选题器题面文本严格去重根治视觉重复题；figCompass/figSquareNum 反泄题（图上不再印答案）；负数/圆柱圆锥/比例补参数化配图题
const CACHE = 'lyj-shell-v50';
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
