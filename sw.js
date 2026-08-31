// 吕泳冀学习站 Service Worker
// v70：清除跨年级（超纲）题目。
//      ① 四下「专项·展开图」「专项·视图与展开」原先直接复用六上/六下的生成器，
//         带出圆柱、圆锥、侧面积、棱长、表面积、体积等超纲内容（四下教材无展开图单元）。
//         现改为四下课标内的「专项·三角形进阶」「专项·观察物体」两个新专项。
//      ② 六上「专项·展开图」移除圆锥、侧面积相关题（属六下《圆柱与圆锥》）。
//      ③ 四上《条形统计图》移除「折线统计图」「扇形统计图」两道超纲题（分属五下、六上），
//         并把各题干扰项里的「比例/扇形/折线」换成四上已知的统计概念。
//      ④ 五下《折线统计图》干扰项去掉「扇形统计图」（属六上）。
const CACHE = 'lyj-shell-v70';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './css/english.css',
  './js/core.js', './js/math.js', './js/data.js', './js/english.js', './js/chinese.js', './js/diagram.js', './js/main.js', './js/aiAnalysis.js', './js/aiGrade.js',
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
