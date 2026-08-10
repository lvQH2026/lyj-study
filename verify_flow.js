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
['js/core.js','js/math.js','js/data.js','js/english.js','js/main.js'].forEach(s => {
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
  const st = S();
  mathQuizOK = st && Array.isArray(st.quizQuestions) && st.quizQuestions.length > 0;
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
['css/style.css', 'css/english.css', 'js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/main.js']
  .forEach(f => ok('SW 预缓存含 ' + f, sw.includes(f)));
ok('SW 版本号已升级 (v27)', /lyj-shell-v27/.test(sw) && !/lyj-shell-v1[23456789]/.test(sw) && !/lyj-shell-v2[0-6]/.test(sw));

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
['css/style.css', 'css/english.css', 'js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/main.js']
  .forEach(f => {
    const p = path.join(ROOT, f);
    const e = fs.existsSync(p);
    ok('文件存在 ' + f, e && fs.statSync(p).size > 100, e ? (fs.statSync(p).size + ' B') : '缺失');
  });

console.log('\n===== 通过 (' + pass.length + ') =====');
pass.forEach(p => console.log('  ✓ ' + p));
if (fail.length) { console.log('\n===== 失败 (' + fail.length + ') ====='); fail.forEach(f => console.log('  ✗ ' + f)); }
if (errs.length) { console.log('\n===== 运行时错误 (' + errs.length + ') ====='); errs.slice(0, 12).forEach(e => console.log('  ! ' + String(e).split('\n')[0])); }
console.log('\n结果: ' + (fail.length === 0 ? 'ALL PASS' : fail.length + ' FAILED'));
process.exit(fail.length === 0 ? 0 : 1);
