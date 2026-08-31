// 吕泳冀学习站 Service Worker
// v70：清除跨年级（超纲）题目。
//      ① 四下「专项·展开图」「专项·视图与展开」原先直接复用六上/六下的生成器，
//         带出圆柱、圆锥、侧面积、棱长、表面积、体积等超纲内容（四下教材无展开图单元）。
//         现改为四下课标内的「专项·三角形进阶」「专项·观察物体」两个新专项。
//      ② 六上「专项·展开图」移除圆锥、侧面积相关题（属六下《圆柱与圆锥》）。
//      ③ 四上《条形统计图》移除「折线统计图」「扇形统计图」两道超纲题（分属五下、六上），
//         并把各题干扰项里的「比例/扇形/折线」换成四上已知的统计概念。
//      ④ 五下《折线统计图》干扰项去掉「扇形统计图」（属六上）。
// v71：补足单元题量，131 个单元全部达到 ≥24 题（考试组卷不再缺题）。
//      对 18 个「硬编码少数几题」的生成器做参数化重写：图形拼组、图形计数、图形的运动、
//      认识图形（一/二）、认识时间、认识人民币、时分的认识、长度单位、克和千克、
//      20以内进位加法、图形的运动（五下）、可能性、比、10以内加减法等。
//      同时把新增题中误用的高年级术语（射线/平行/垂直/量角器/体积/比例）改回本年级说法。
// v72：语文 + 英语模块全量体检修复（新建体检脚本 _cn_en_audit.js）。
//      ① 语文 12 道选择题的干扰项里误写了正确答案本身（如「软绵绵」出现两次），
//         屏幕上两个选项长得一模一样 —— 已换成正常干扰项。
//      ② 语文考试组卷的去重键从「题干」改为「题干+答案」。原逻辑把 12 道同题干
//         的近义词辨析题滤得只剩 1 道，导致专项单元卷组不满 24 题且严重偏科。
//      ③ 组卷补齐：阅读篇目不足时补满第二部分，末尾统一补齐到 24 题。
//      ④ 《观潮》作者填空题改为选择题（原为两个空共用一个输入框，精确判分下无法作答）。
//      ⑤ 词语积累专项题干改为「与"X"意思相近/相反的是？」，避免 12 道题雷同。
//      ⑥ 英语 Level 2/4 补齐凑数造成的 15 个重复单词。
// v73：广西真题注入层（js/gx_real.js）。
//      ① 期末卷命中真卷的年级（一年级下/二年级下/六年级下）注入真实期末原题，
//         卷头标注「真题（广西·柳州/钦州等）·含 N/30 道真题干」；
//         未命中真卷的年级/学期/单元考程序化生成并标注「模拟卷·广西真题风格」。
//      ② 数学考试去操作题分区、整卷重平衡五区固定 30 题 / 100 分；
//         新增「选择题型」筛选器（移动+PC）；题号导航范围改为全部（练习/考试可点跳转）；
//         难度命名统一 基础/提高/拓展；单元卷循环 gen 凑满 30（含短单元生成器扩容）。
// v74：考试中心（数学/语文考试）答错不再进入苏格拉底引导，直接揭晓答案并计入错题，可继续往后做。
const CACHE = 'lyj-shell-v74';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './css/english.css',
  './js/core.js', './js/math.js', './js/data.js', './js/gx_real.js', './js/english.js', './js/chinese.js', './js/diagram.js', './js/main.js', './js/aiAnalysis.js', './js/aiGrade.js',
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
