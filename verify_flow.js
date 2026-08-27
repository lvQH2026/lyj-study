// 第三遍：功能闭环验证（真实走一遍数学答题 + 英语课程 + 家长视图）
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const pass = [], fail = [];
const ok = (n, c, x) => (c ? pass : fail).push(n + (x ? '  →  ' + x : ''));

const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '');
html = html.replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '');
html = html.replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, '');

const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/',
  virtualConsole: vc, pretendToBeVisual: true
});
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function (t) { this.text = t; };
w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
w.scrollTo = () => {};
w.confirm = () => true;
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};

// 以真实 <script> 元素注入，复现浏览器同一全局作用域（let/const 全局词法绑定共享）
['js/core.js','js/math.js','js/data.js','js/english.js','js/chinese.js','js/diagram.js','js/main.js'].forEach(s => {
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
  w.document.body.appendChild(el);
});
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

const d = w.document, $ = id => d.getElementById(id);
// state 是 let 全局词法绑定（不挂 window），需通过 eval 读取
const S = () => w.eval('state');
let toast = '';
const origToast = w.showToast;
w.showToast = m => { toast = m; };

// ============ 一、数学答题闭环 ============
w.App.switchModule('math');
// 显式设定年级/学期（startUnitQuiz 依赖 state.currentGrade）
try { w.eval('state.currentGrade = 3; state.currentSemester = 1;'); } catch (e) { errs.push('set grade: ' + e.message); }
ok('数学：state 全局词法绑定可用', !!S() && S().currentGrade === 3, 'grade=' + (S() ? S().currentGrade : 'N/A'));

let mathQuizOK = false;
try {
  w.startUnitQuiz(0);
  // 新流程：进单元先弹「交互动画图解」页，需点「开始答题」才进入真正答题
  const cards = d.querySelectorAll('#diagramCards .diag-card').length;
  const btn = d.getElementById('specialIntroBtn');
  if (btn && btn.onclick) btn.onclick();
  const st = S();
  mathQuizOK = st && Array.isArray(st.quizQuestions) && st.quizQuestions.length > 0;
  ok('数学：进入单元先弹交互动画图解页', cards > 0, '图解卡片数 ' + cards);
  ok('数学：进入单元练习并生成题目', mathQuizOK,
    '题目数 ' + (st && st.quizQuestions ? st.quizQuestions.length : 0) + ' / 单元「' + (st ? st.quizTitle : '') + '」');
} catch (e) {
  ok('数学：进入单元练习并生成题目', false, e.message);
}

if (mathQuizOK) {
  const card = $('questionCard');
  ok('数学：题面已渲染（#questionCard）', !!card && card.textContent.trim().length > 0,
    card ? card.textContent.trim().slice(0, 40).replace(/\s+/g, ' ') : 'no #questionCard');
  ok('数学：进度条已更新', ($('quizProgress') || {}).textContent === '第 1 / ' + S().quizQuestions.length + ' 题',
    ($('quizProgress') || {}).textContent);

  // 完整答完一整套（全部故意答错）→ finishQuiz 时批量入库
  const beforeWrong = w.getWrongBank().length;
  const total = S().quizQuestions.length;
  let answered = 0, skipped = 0;
  try {
    for (let i = 0; i < total; i++) {
      const q = S().quizQuestions[S().quizIndex];
      if ((q.type === 'choice' || q.type === 'shape_choice') && !q.forceFill) {
        const btns = d.querySelectorAll('.option-btn');
        let wrongIdx = -1;
        for (let k = 0; k < q.options.length; k++) {
          const v = typeof q.options[k] === 'object' ? q.options[k].value : q.options[k];
          if (v !== q.answer) { wrongIdx = k; break; }
        }
        if (wrongIdx < 0) { skipped++; wrongIdx = 0; }
        w.selectOption(wrongIdx);
      } else {
        const inp = $('answerInput');
        if (inp) inp.value = 'ZZ' + i; else skipped++;
      }
      w.submitAnswer();   // 判分
      answered++;
      w.submitAnswer();   // 下一题 / 最后一题触发 finishQuiz
    }
    ok('数学：整套题全部作答无异常', answered === total, answered + '/' + total + (skipped ? '（' + skipped + ' 题无法构造错答）' : ''));
  } catch (e) {
    ok('数学：整套题全部作答无异常', false, '第 ' + answered + ' 题：' + e.message);
  }

  const afterWrong = w.getWrongBank().length;
  ok('数学：交卷后错题批量入库', afterWrong > beforeWrong,
    beforeWrong + ' → ' + afterWrong + ' 条');

  const item = w.getWrongBank()[afterWrong - 1];
  ok('数学：错题不带 module 或标记为数学',
    !!item && (!item.module || item.module === '数学'), 'module=' + (item ? item.module : 'N/A'));
  ok('数学：错题带单元名与年级',
    !!item && !!item.unitName && item.grade != null,
    item ? (item.unitName + ' / 年级 ' + item.grade) : 'N/A');

  // 结果页
  const resultPage = $('page-result');
  ok('数学：结果页已切换', !!resultPage && resultPage.classList.contains('active'),
    resultPage ? resultPage.className : 'no #page-result');

  // 错题重练可进入
  try {
    toast = '';
    w.startWrongReview();
    ok('数学：错题重练可进入', !/空/.test(toast) && S().quizMode === 'wrong',
      'mode=' + S().quizMode + ' toast=' + toast);
  } catch (e) {
    ok('数学：错题重练可进入', false, e.message);
  }

  // 错题库列表渲染
  try {
    w.renderWrongBank();
    const c = $('wrongListContainer');
    ok('数学：错题库列表渲染', !!c && !/错题库是空的/.test(c.textContent),
      c ? c.textContent.trim().slice(0, 40).replace(/\s+/g, ' ') : 'no container');
  } catch (e) {
    ok('数学：错题库列表渲染', false, e.message);
  }

  // 统计页渲染
  try {
    w.renderStats();
    const so = $('statsOverview');
    ok('数学：统计页渲染', !!so && so.innerHTML.length > 50, '长度 ' + (so ? so.innerHTML.length : -1));
  } catch (e) {
    ok('数学：统计页渲染', false, e.message);
  }
}

// ============ 二、英语课程闭环 ============
w.App.switchModule('english');
try {
  w.switchMain('phonics');
  const ph = w.ENG_DATA && w.ENG_DATA.phonics;
  const lv0 = ph && ph.levels && ph.levels[0];
  const firstLesson = lv0 && lv0.lessons && lv0.lessons[0];
  const totalLessons = ph && ph.levels ? ph.levels.reduce((s, l) => s + (l.lessons ? l.lessons.length : 0), 0) : 0;
  ok('英语：数据结构可用（phonics.levels[].lessons[]）', !!firstLesson,
    firstLesson ? (ph.levels.length + ' 级 / 共 ' + totalLessons + ' 课 / 首课 ' + (firstLesson.title || firstLesson.id)) : JSON.stringify(Object.keys(w.ENG_DATA || {})));
  ok('英语：自然拼读 52 课齐备', totalLessons === 52, '实际 ' + totalLessons + ' 课');
  const ipaLessons = w.ENG_DATA && w.ENG_DATA.ipa && w.ENG_DATA.ipa.lessons ? w.ENG_DATA.ipa.lessons.length : 0;
  ok('英语：国际音标 8 课齐备', ipaLessons === 8, '实际 ' + ipaLessons + ' 课');

  if (firstLesson) {
    w.openPhonicsLesson(0, firstLesson.id);
    const body = $('engBody');
    ok('英语：课程播放页渲染', body.innerHTML.length > 200, '长度 ' + body.innerHTML.length);
    ok('英语：第1步显示发音要领',
      /要领|符号|发音|口型/.test(body.textContent), body.textContent.slice(0, 50).replace(/\s+/g, ' '));

    // 走 5 步
    for (let i = 0; i < 4; i++) {
      try { w.phonicsStep(1); } catch (e) { errs.push('phonicsStep ' + i + ': ' + e.message); }
    }
    ok('英语：5 步流程可走完（无异常）',
      $('engBody').innerHTML.length > 100, '末步长度 ' + $('engBody').innerHTML.length);
  }
} catch (e) {
  ok('英语：课程闭环', false, e.message);
}

// 英语错题页
try {
  w.switchMain('wrong');
  ok('英语：错题页渲染', $('engBody').innerHTML.length > 20, '长度 ' + $('engBody').innerHTML.length);
} catch (e) { ok('英语：错题页渲染', false, e.message); }

// 英语学习进度（家长视图）
try {
  w.switchMain('progress');
  ok('英语：学习进度页渲染', $('engBody').innerHTML.length > 100, '长度 ' + $('engBody').innerHTML.length);
} catch (e) { ok('英语：学习进度页渲染', false, e.message); }

// ============ 三、统一存储 + 家长视图 ============
try {
  w.addWrong({ module: '自然拼读', lesson: 'Level1 · a', prompt: '听音辨词', answer: 'cat', your: 'dog' });
  const store = JSON.parse(w.localStorage.getItem('math_practice_data') || '{}');
  const all = store.wrong || [];
  const eng = all.filter(x => x.module === '英语');
  const math = all.filter(x => !x.module || x.module === '数学');
  ok('统一存储：数学+英语共存于同一 key',
    eng.length >= 1 && math.length >= 1,
    '数学 ' + math.length + ' 条 / 英语 ' + eng.length + ' 条 / 总 ' + all.length);
  ok('家长视图数据源可见全部（getAllWrongBank）',
    w.getAllWrongBank().length === all.length, w.getAllWrongBank().length + ' == ' + all.length);
  ok('数学视图仅见数学（getWrongBank）',
    w.getWrongBank().length === math.length, w.getWrongBank().length + ' == ' + math.length);
} catch (e) {
  ok('统一存储验证', false, e.message);
}

// 清空数学错题不影响英语
try {
  w.showToast = m => { toast = m; };
  const engBefore = w.getAllWrongBank().filter(x => x.module === '英语').length;
  w.clearAllWrong();
  const engAfter = w.getAllWrongBank().filter(x => x.module === '英语').length;
  ok('清空数学错题不影响英语错题',
    w.getWrongBank().length === 0 && engAfter === engBefore,
    '数学剩 ' + w.getWrongBank().length + ' / 英语 ' + engBefore + ' → ' + engAfter);
} catch (e) {
  ok('清空数学错题不影响英语错题', false, e.message);
}

// ============ 四、SW 缓存清单 ============
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
['css/style.css', 'css/english.css', 'js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/chinese.js', 'js/diagram.js', 'js/main.js', 'js/aiAnalysis.js']
  .forEach(f => ok('SW 预缓存含 ' + f, sw.includes(f)));
{
  const mV = sw.match(/lyj-shell-v(\d+)/);
  ok('SW 版本号已升级 (v60 云端合并同步+本机补传恢复)', !!mV && +mV[1] === 60);
}
// v56 守卫：children 表数据通道替代 study_records
{
  const parentJs = fs.readFileSync(path.join(ROOT, 'parent.js'), 'utf8');
  const sbJs = fs.readFileSync(path.join(ROOT, 'supabase.js'), 'utf8');
  ok('v56：parentLogin 通过 getRecentHistory 取最近练习', parentJs.indexOf('getRecentHistory') >= 0 && parentJs.indexOf('buildStatsFromRecent') >= 0);
  ok('v56：renderRecentPractice 支持云端数据源 + _rpRecords', parentJs.indexOf('_rpRecords') >= 0 && parentJs.indexOf('renderRecentPractice') >= 0);
  ok('v56：supabase.js 含 getRecentHistory + pushRecentHistory', sbJs.indexOf('async function getRecentHistory') >= 0 && sbJs.indexOf('async function pushRecentHistory') >= 0);
  // 精确守卫：仅检查 study_records 的 toRow 行构造器是否含 module（children 通道的 pushRecentHistory 合法带 module，不在此列）
  const toRowMatch = sbJs.match(/const toRow = \(h\) => \(\{([\s\S]*?)\}\);/);
  ok('v56：supabase.js 不再向 study_records 推 module 列', !!toRowMatch && toRowMatch[1].indexOf('module:') < 0);
}

// ============ 四·四-二、数学 3/4 年级双轨结构守卫（v57） ============
(function v57grade34() {
  const KB = w.eval('KNOWLEDGE_BASE');
  if (!KB) { ok('v57：KNOWLEDGE_BASE 已加载', false); return; }
  ok('v57：KNOWLEDGE_BASE[3] 双轨（含 group:课本）', KB[3][1].some(u => u.group === '课本') && KB[3][2].some(u => u.group === '课本'));
  ok('v57：KNOWLEDGE_BASE[4] 双轨（含 group:课本）', KB[4][1].some(u => u.group === '课本') && KB[4][2].some(u => u.group === '课本'));
  const expect = { 3: { 1: 9, 2: 8 }, 4: { 1: 8, 2: 9 } };
  for (const g of [3, 4]) for (const s of [1, 2]) {
    const tb = KB[g][s].filter(u => u.group === '课本');
    ok(`v57：${g}年级${s===1?'上':'下'} 课本同步单元数=${expect[g][s]}`, tb.length === expect[g][s], '实际 ' + tb.length);
    const sp = KB[g][s].filter(u => u.group === '专项');
    ok(`v57：${g}年级${s===1?'上':'下'} 专项≥5`, sp.length >= 5, '实际 ' + sp.length);
    let metaBad = [], lowGen = [];
    tb.forEach(u => {
      if (!(u.summary && u.summary.length >= 3) || !(u.fidx && u.fidx.length >= 2) || !(u.method && u.method.length >= 2)) metaBad.push(u.name);
      if (u.gen) {
        let seen = new Set();
        for (let i = 0; i < 300; i++) { try { let raw = u.gen(); let c = Array.isArray(raw) ? raw : [raw]; c.forEach(q => { if (q && q.question && q.answer !== undefined && q.answer !== null) seen.add(q.question + '|' + q.answer); }); } catch (e) {} }
        if (seen.size < 35) lowGen.push(u.name + ':' + seen.size);
      }
    });
    ok(`v57：${g}年级${s===1?'上':'下'} 课本单元含 summary≥3/fidx≥2/method≥2`, metaBad.length === 0, metaBad.join(','));
    ok(`v57：${g}年级${s===1?'上':'下'} 课本单元 gen 去重键≥35`, lowGen.length === 0, lowGen.join(','));
  }
  // 整卷（paper:true）单元直接渲染、不经选题去重，题面必须各不相同（v57 修 专项·角度计算 真实劣化）
  [3, 4].forEach(g => [1, 2].forEach(s => {
    (KB[g][s] || []).filter(u => u.paper).forEach(u => {
      try {
        const raw = u.gen(); const arr = Array.isArray(raw) ? raw : [raw];
        const t = new Set(arr.map(q => q && q.question));
        ok(`v57：${g}年级${s===1?'上':'下'} 整卷「${u.name}」题面无重复`, arr.length >= 18 && t.size === arr.length, arr.length + ' 题/去重 ' + t.size);
      } catch (e) { ok(`v57：${g}年级${s===1?'上':'下'} 整卷「${u.name}」可渲染`, false, e.message); }
    });
  }));
})();

// ============ 四·四、语文 4/5 年级 课本同步结构守卫（v45） ============
const cnJs = fs.readFileSync(path.join(ROOT, 'js', 'chinese.js'), 'utf8');
ok('语文：chinese.js 不再硬编码 grade===6（已泛化为 group===\'课本\'）', !/cnState\.grade\s*===\s*6/.test(cnJs) && !/grade\s*===\s*6/.test(cnJs));
ok('语文：首页/考试均用 isTbGrade 检测 group===\'课本\'（>=2 处）', (cnJs.match(/units\.some\(function \(u\) \{ return u\.group === '\\u8BFE\\u672C'; \}\)/g) || []).length >= 2);
const CN = w.CN;
ok('语文：window.CN 已加载', !!CN);
if (CN) {
  for (const g of [4, 5]) {
    const units = CN.data[g];
    ok(g + '年级 单元数 = 22 (8+8+6)', units.length === 22, '实际 ' + units.length);
    const tb = units.filter(u => u.group === '课本');
    ok(g + '年级 课本单元 = 16 (8上+8下)', tb.length === 16, '实际 ' + tb.length);
    ok(g + '年级 上册 = 8 且 下册 = 8', tb.filter(u => u.term === '上').length === 8 && tb.filter(u => u.term === '下').length === 8);
    ok(g + '年级 专项单元 = 6', units.filter(u => u.group === '专项').length === 6);
    let minN = 999, bad = [];
    tb.forEach(u => { const n = u.pool().length; if (n < 30) bad.push(u.name + '(' + n + ')'); if (n < minN) minN = n; });
    ok(g + '年级 每个课本单元 pool >= 30 题', bad.length === 0, '最少 ' + minN + (bad.length ? ' 不足: ' + bad.join(',') : ''));
  }
  ok('6年级 结构未被破坏 (20 单元)', CN.data[6].length === 20, '实际 ' + CN.data[6].length);
}

// ============ 四·零、家长端浅色主题守卫（v43） ============
const pStyle = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
ok('家长端令牌 --pp-bg1 为浅色（#F 开头，非深色 #0E1220）', /--pp-bg1:#F[0-9A-Fa-f]{5}/.test(pStyle) && !/--pp-bg1:#0E1220/.test(pStyle));
ok('家长端 --pp-text 为深字浅底（#3E4A63 黛蓝，非 #E8EBF5 浅字）', /--pp-text:#3E4A63/.test(pStyle) && !/--pp-text:#E8EBF5/.test(pStyle));
ok('家长端 #page-parent 无深色径向光晕（无 #7C8CFF 霓虹/无 #0E1220）', !/#7C8CFF|\.20\),|#0E1220/.test(pStyle.split('#page-parent{')[1] ? pStyle.split('#page-parent{')[1].split('}')[0] : ''));
ok('aiAnalysis.js：提升方案卡为浅色金边（无 #2E3648 深色渐变）', !/linear-gradient\(135deg,#3E4A63,#2E3648\)/.test(fs.readFileSync(path.join(ROOT, 'js', 'aiAnalysis.js'), 'utf8')));

// ============ 四·一、云端同步（supabase.js v39 修复守卫） ============
const sbjs = fs.readFileSync(path.join(ROOT, 'supabase.js'), 'utf8');
ok('supabase.js：insert 显式检查 {error}（supabase-js v2 失败不抛异常）', /r\s*&&\s*r\.error/.test(sbjs));
ok('supabase.js：doInsert 封装存在', sbjs.includes('doInsert'));
ok('supabase.js：同步失败落盘 syncError', sbjs.includes('syncError'));
ok('supabase.js：语文 synced 误标一次性迁移 resetCnSyncedOnce', sbjs.includes('resetCnSyncedOnce') && sbjs.includes('lyj_v39_cn_resync'));
ok('supabase.js：打开页面自动补同步积压记录', /loadAndApplyContent[\s\S]*pushStudyRecords\(\)/.test(sbjs) && sbjs.split('ensureChild()').length >= 2);
const parentjs = fs.readFileSync(path.join(ROOT, 'parent.js'), 'utf8');
ok('parent.js：家长页显示云端同步异常提示', parentjs.includes('云端同步异常'));
ok('parent.js：家长页 SDK 未加载单独提示', parentjs.includes('云端同步不可用'));

// ============ 四·二、AI 学习分析（aiAnalysis.js v40 守卫） ============
const aijs = fs.readFileSync(path.join(ROOT, 'js', 'aiAnalysis.js'), 'utf8');
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok('index.html：引入 js/aiAnalysis.js', idx.includes('js/aiAnalysis.js'));
ok('aiAnalysis.js：暴露 window.AI_ANALYSIS', aijs.includes('window.AI_ANALYSIS'));
ok('aiAnalysis.js：趋势分桶 bucketize（周/月/学期）', aijs.includes("'week'") && aijs.includes("'month'") && aijs.includes("'term'"));
ok('aiAnalysis.js：线性回归斜率 slopeOf', aijs.includes('function slopeOf'));
ok('aiAnalysis.js：错题归因 attribute', aijs.includes('function attribute'));
ok('aiAnalysis.js：风险预测 risks', aijs.includes('function risks'));
ok('aiAnalysis.js：提升方案 planOf', aijs.includes('function planOf'));
ok('aiAnalysis.js：折线图 renderLineSvg', aijs.includes('function renderLineSvg'));
ok('aiAnalysis.js：柱状图 renderBarSvg', aijs.includes('function renderBarSvg'));
ok('aiAnalysis.js：报告导出 buildReport（本机+云端）', aijs.includes('function buildReport') && aijs.includes('cloudAttribution'));
ok('aiAnalysis.js：分享摘要 shareTextOf', aijs.includes('function shareTextOf'));
ok('parent.js：分析版块挂载本机+远程', parentjs.includes('mountAiAnalysis') && parentjs.includes("'cloud'"));

// ============ 四·三、AI 图表标签可读性守卫（v44） ============
// SVG viewBox 宽 640 缩放到手机约 340px，缩放比≈0.53；原 font-size 9.5-10 实际仅约 5px 看不清。
ok('AI 图表：折线图 X 轴标签字号已放大（非 10，≥14）', /font-size="15" fill="#5A6478" text-anchor="middle">' \+ p\.label/.test(aijs));
ok('AI 图表：柱状图单元名标签字号已放大且斜排（非 9.5，≥14 + rotate）', /rotate\(-30 .*\)" x=".*font-size="15" fill="#5A6478" text-anchor="middle">' \+ esc\(name\)/.test(aijs));
ok('AI 图表：柱状图百分比标签字号已放大（非 10.5，≥14）', /font-size="15" fill="' \+ color \+ '" text-anchor="middle" font-weight="700">' \+ v \+ '%/.test(aijs));

// ============ 四点五、CSS 隔离守卫 ============
const engCss = fs.readFileSync(path.join(ROOT, 'css', 'english.css'), 'utf8');
const mainCss = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

const unscoped = engCss.split('\n')
  .map((l, i) => ({ l: l.trim(), n: i + 1 }))
  .filter(x => /^[^#@/\s][^{]*\{/.test(x.l) && !x.l.startsWith('#englishRoot'));
ok('CSS：english.css 无未作用域选择器（不污染数学）', unscoped.length === 0,
  unscoped.length ? unscoped.slice(0, 3).map(x => 'L' + x.n + ' ' + x.l.slice(0, 30)).join(' | ') : '');

ok('CSS：无 #englishRoot body 死规则', !/#englishRoot\s+(body|html)\b/.test(engCss));
ok('CSS：英语导航避让切换条 top:48px', /#englishRoot\s+\.navbar\s*\{[^}]*top:\s*48px/.test(engCss));
ok('CSS：英语底部留白 72px（避让底部导航）', /#englishRoot\s*\{[^}]*padding-bottom:\s*72px/.test(engCss));
ok('CSS：存在 .module-switch 切换条样式', /\.module-switch\s*\{/.test(mainCss));
ok('CSS：数学导航避让切换条 .navbar{top:48px}', /\.navbar\s*\{\s*top:\s*48px/.test(mainCss));

// 数学与英语共用类名必须在英语侧带作用域
['.option-btn', '.feedback', '.wrong-item'].forEach(cls => {
  const bad = new RegExp('(^|\\n)\\s*\\' + cls + '[.\\s{]', 'm').test(engCss);
  ok('CSS：共用类名 ' + cls + ' 已作用域隔离', !bad);
});

// ============ 四又六、英语 UI 对齐数学守卫 ============
ok('对齐：english.css 不再覆盖 .card（继承数学全局）', !/#englishRoot\s+\.card\s*\{/.test(engCss));
ok('对齐：english.css 不再覆盖 .section-title（继承数学全局）', !/#englishRoot\s+\.section-title\s*\{/.test(engCss));
ok('对齐：english.css 不再覆盖 .btn-primary（继承数学全局）', !/#englishRoot\s+\.btn-primary\s*\{/.test(engCss));
ok('对齐：english.js 首页使用数学 .unit-item 行样式', /class="unit-item"/.test(fs.readFileSync(path.join(ROOT, 'js', 'english.js'), 'utf8')));

// ============ 五、文件存在性 ============
['css/style.css', 'css/english.css', 'js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/chinese.js', 'js/main.js']
  .forEach(f => {
    const p = path.join(ROOT, f);
    const e = fs.existsSync(p);
    ok('文件存在 ' + f, e && fs.statSync(p).size > 100, e ? (fs.statSync(p).size + ' B') : '缺失');
  });

// ============ v58、P0 去海外 CDN 依赖守卫 ============
const idx58 = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok('v58：index.html 已无海外 CDN 引用（jsdelivr/tailwindcss）', !/cdn\.jsdelivr|cdn\.tailwindcss|tailwindcss\.com/.test(idx58));
ok('v58：index.html 已无 Tailwind 运行时（tailwind.config / text/tailwindcss）', !/tailwind\.config|text\/tailwindcss/.test(idx58));
ok('v58：supabase-js 已自托管为本地 js/supabase-js.min.js', /js\/supabase-js\.min\.js/.test(idx58) && fs.existsSync(path.join(ROOT, 'js', 'supabase-js.min.js')));
const sbMin = fs.readFileSync(path.join(ROOT, 'js', 'supabase-js.min.js'), 'utf8');
ok('v58：supabase-js.min.js 是自托管 UMD（含 createClient 且非 CDN 重定向）', sbMin.includes('createClient') && sbMin.length > 50000 && !/cdn\.jsdelivr/.test(sbMin));
ok('v58：组件 CSS 已静态化进 css/style.css（.option-btn.wrong + --danger）', /\.option-btn\.wrong\{/.test(mainCss) && /--danger:/.test(mainCss));
ok('v60：SW 缓存版本号已升级为 lyj-shell-v60', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('lyj-shell-v60'));
ok('v62：圆柱与圆锥接入专属四段交互动图 + SW 缓存升级为 lyj-shell-v62', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('lyj-shell-v62') && /diagCylinderCone/.test(fs.readFileSync(path.join(ROOT, 'js/diagram.js'), 'utf8')));
ok('v63：长方体和正方体/多边形的面积/圆 接入专属四段交互动图 + SW 缓存升级为 lyj-shell-v63', fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('lyj-shell-v63') && /diagCuboid/.test(fs.readFileSync(path.join(ROOT, 'js/diagram.js'), 'utf8')) && /diagPolygonArea/.test(fs.readFileSync(path.join(ROOT, 'js/diagram.js'), 'utf8')) && /diagCircleArea/.test(fs.readFileSync(path.join(ROOT, 'js/diagram.js'), 'utf8')));

console.log('\n===== 通过 (' + pass.length + ') =====');
pass.forEach(p => console.log('  ✓ ' + p));
if (fail.length) { console.log('\n===== 失败 (' + fail.length + ') ====='); fail.forEach(f => console.log('  ✗ ' + f)); }
if (errs.length) { console.log('\n===== 运行时错误 (' + errs.length + ') ====='); errs.slice(0, 12).forEach(e => console.log('  ! ' + String(e).split('\n')[0])); }
console.log('\n结果: ' + (fail.length === 0 ? 'ALL PASS' : fail.length + ' FAILED'));
process.exit(fail.length === 0 ? 0 : 1);
