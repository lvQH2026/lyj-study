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
//         题号导航范围改为全部（练习/考试可点跳转）；
//         难度命名统一 基础/提高/拓展；单元卷循环 gen 凑满 30（含短单元生成器扩容）。
// v74：考试中心（数学/语文考试）答错不再进入苏格拉底引导，直接揭晓答案并计入错题，可继续往后做。
// v75：考试/练习交卷后统一走「真实老师批改」两步流程：批改成绩页 → 确认 → 答案与解析页。
// v76：补移动端语文模块接入 v75 两段式（成绩页含逐题明细/分部分成绩/老师批语，确认→答案解析）；
//      core.js detectMathConcepts 增加语文知识点规则（字词句/阅读/古诗文/习作/标点/修辞/文学常识/口语交际），
//      使语文错题批语可按知识点生成。
// v77：移除「选择题型」筛选器（UI/交互/数据结构/筛选逻辑全部删除，无残留引用）；难度档由「混合+三档」收敛为
//      基础(1)/提高(2)/拓展(3) 三档，弹层默认选中基础题；PC 端「暂无此类题型」toast 统一为「该单元暂无题目」。
// v78：S0 基础修正。① 解除移动端禁止缩放（index.html 去掉 maximum-scale=1.0/user-scalable=no，
//      改为 viewport-fit=cover），并给 input/textarea/select 兜底 font-size:16px，
//      避免 iOS 聚焦小字号输入框时强制放大页面。② 首页 banner 文案改为「人教版 · 六年级 · 小升初冲刺」。
//      ③ PC 页脚版本号不再手写（此前长期停留在 v60，滞后 17 版），改为 readShellVersion()
//      从 sw.js 解析 const CACHE 实际版本动态写入。
// v79：S1 三科导航统一 + 年级持久化。
//      ① 底部导航从「数学模块内一套 / 语文 2 个入口 / 英语 4 个入口」收敛为全局唯一一套
//         #globalNav（首页 / 练习 / 错题 / 统计 / 家长），删除 .cn-bottom-nav 与 .eng-bottom-nav。
//      ② 统计页与家长后台提升为「全局页」#globalPages（移出 #mathRoot，三科共用），
//         语文 / 英语现在也能看统计、进家长看板。
//      ③ switchTab 改为全局调度：统计/家长 → 全局页；其余按当前模块分发到数学 / 语文 / 英语。
//         语文新增独立考试中心页 #cnPageExam（CN.showExam），此前只有首页内联的几个考试按钮。
//         英语按 拼读=首页 / 音标=练习 / 错题本=错题 接入，原「进度」入口移入拼读首页。
//      ④ 年级持久化：core.js 新增 App.getGrade/setGrade（localStorage 键 lyj_grade_v1，
//         按模块分别记忆），数学 state.currentGrade 与语文 cnState.grade 默认六年级，
//         重开页面不再回到「未选年级」/ 四年级；首页回显「当前年级」并高亮对应卡片。
// v80：S2 今日任务驾驶舱（#todayPanel，移动端首页首屏）。
//      ① 小升初倒计时卡：默认目标日 2027-06-15（存 localStorage 键 lyj_exam_date，可点日期改），
//         配六年级冲刺进度条（起点 2026-09-01）。
//      ② 今日任务：数学/语文按当日练习记录判定完成，英语按当日点击标记（lyj_task_done），
//         每科一条并给「去做」直达按钮（数学进单元列表、语文进模块或错题库、英语进拼读）。
//      ③ 薄弱提醒：按错题所属单元聚合取 Top3，点击「专项练」按单元名反查 KNOWLEDGE_BASE 坐标；
//         查不到坐标时降级打开错题库。
//      ④ 本周概览：近 7 天练习次数 / 题量 / 正确率。
//      ⑤ 埋点 lyj_task_click：按天聚合记录驾驶舱任务点击数（留 30 天），用于连续观察是否真的带动练习。
//      ⑥ 卫生修复：startSpecialQuiz 此前只改内存年级未持久化，已补 App.setGrade。
// v81：S3 解析讲解回填。
//      ① 新增通用分步讲解引擎 buildSmartSteps(q, unit)（js/math.js）。题库里没有一道题自带
//         explain/steps（实测 630 道去重题 0%），全靠 generateSteps 现场生成，而旧兜底只吐一行
//         「答案：x」，实测 89.2% 的题拿不到任何讲解。新引擎三层：L1 句式语义规则（比例尺/折扣/
//         成数/比/解比例/倒数/圆/圆柱圆锥/统计/鸽巢/方向/植树/角度/数与形/公因数公倍数/竖式乘法…）
//         → L2 分数关系与关键词驱动列式（结果须与答案精确一致才输出，绝不瞎凑算式）
//         → L3 单元知识卡（用单元自带的 summary/fidx/method 生成「考点→公式→思路→答案」）。
//         实测空壳率 89.2% → 0%，其中真解析约 50%、知识卡约 21%。
//      ② 竖式乘法分解 verticalMulSteps：三位数乘两位数等计算题原先只有一行算式，现按位拆开讲。
//      ③ 移动端错题本 renderWrongBank 补「解析 + 分步讲解」；PC 端错题库 renderWrongBank
//         原先只列题干和错次，现补「你的答案 / 正确答案 + 分步讲解」。
//      ④ 容错：generateSteps 兜底生成的步骤会打 q.stepsGeneric，difficultyScore 与
//         questionDifficulty 不再把它当作「多步运算」的难度信号，避免 6:3:1 梯度被压平。
// v83：S5 英语 PEP 双轨模块（B4）。
//      ① 新建 js/pep.js 教材库：旧版 PEP 三~五年级 6 册 36 单元（补欠账）+ 2024 修订版
//         六年级上 6 单元 / 下 4 单元（同步新课），共 8 册 46 单元 552 词 185 句型。
//         六上 U1 标题经家长核对课本目录确认为 Amazing places。
//      ② 新建 js/engPep.js 练习引擎：英译中 / 中译英 / 单词拼写 / 选词填空 /
//         补全句子 / 连词成句，三档难度自动配比题型，20 题一练，两段式批改
//         （成绩页 → 确认成绩 → 答案与解析），记录进 history(module:英语) 与错题本。
//      ③ core.js 新增 engNorm / engAnswerEquals：英语判分放宽（忽略大小写、句末标点、
//         撇号写法、缩写展开），PC 端 pcJudge 对 judge:'eng' 的题转调该函数。
//      ④ PC 端解除「英语暂只支持单元练习」限制：考试中心可按 PEP 单元 / 阶段 / 期中 /
//         期末出卷（30 题，可选难度），单元练习页新增「人教 PEP 教材同步」区块。
//      ⑤ 移动端英语首页新增「教材同步」入口，册 → 单元 → 单词表 / 核心句型 / 语法要点 → 练习。
const CACHE = 'lyj-shell-v83';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './css/english.css',
  './js/core.js', './js/math.js', './js/data.js', './js/gx_real.js', './js/english.js', './js/pep.js', './js/engPep.js', './js/chinese.js', './js/diagram.js', './js/main.js', './js/aiAnalysis.js', './js/aiGrade.js',
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
