// 多文件重构集成验证（jsdom）
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const pass = [];
const fail = [];
function ok(name, cond, extra) {
  (cond ? pass : fail).push(name + (extra ? '  →  ' + extra : ''));
}

const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
vc.on('error', (...a) => errs.push('console.error: ' + a.join(' ')));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// 去掉外部 CDN（离线环境无法加载）与 SW 注册、云端脚本
html = html.replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '');
html = html.replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '');
// 精确移除 SW 注册脚本块（只匹配不含其它 <script 的最小块）
html = html.replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, '');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: undefined,
  url: 'https://lvqh2026.github.io/lyj-study/',
  virtualConsole: vc,
  pretendToBeVisual: true
});
const w = dom.window;

// 补齐 jsdom 缺失的浏览器 API
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function(t){ this.text = t; };
w.matchMedia = w.matchMedia || function(){ return { matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }; };
w.scrollTo = function(){};
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};

// 手动注入本地脚本（jsdom 不加载相对 src）
const scripts = ['js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/main.js'];
for (const s of scripts) {
  const code = fs.readFileSync(path.join(ROOT, s), 'utf8');
  try {
    w.eval(code);
    ok('加载 ' + s, true);
  } catch (e) {
    ok('加载 ' + s, false, e.message);
  }
}

// 触发 DOMContentLoaded / load，让各模块 boot
try {
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  w.dispatchEvent(new w.Event('load'));
} catch (e) { errs.push('event dispatch: ' + e.message); }

const d = w.document;
const $ = id => d.getElementById(id);
const disp = id => { const e = $(id); return e ? e.style.display : '(null)'; };

// ---------- 断言 ----------
// 1) 结构
ok('存在 #moduleSwitch 顶部切换', !!$('moduleSwitch'));
ok('存在 #mathRoot', !!$('mathRoot'));
ok('存在 #englishRoot', !!$('englishRoot'));
ok('存在 #engBody', !!$('engBody'));
ok('window.App 就绪', typeof w.App === 'object' && typeof w.App.switchModule === 'function');

// 2) 数学首页渲染
const gradeGrid = $('gradeGrid') || d.querySelector('.grade-grid');
ok('数学首页年级卡片已渲染',
  !!gradeGrid && gradeGrid.children.length > 0,
  gradeGrid ? '子节点 ' + gradeGrid.children.length : '未找到 gradeGrid');

const specialList = $('specialList');
if (specialList) {
  ok('专项练习板块已渲染', specialList.children.length > 0, '子节点 ' + specialList.children.length);
}

// 3) 切到英语
try {
  w.App.switchModule('english');
} catch (e) { errs.push('switchModule: ' + e.message); }
ok('切英语后 #mathRoot 隐藏', disp('mathRoot') === 'none', 'display=' + disp('mathRoot'));
ok('切英语后 #englishRoot 显示', $('englishRoot') && disp('englishRoot') !== 'none', 'display=' + disp('englishRoot'));
const engBody = $('engBody');
ok('英语自然拼读课程已渲染',
  !!engBody && engBody.innerHTML.trim().length > 100,
  engBody ? 'HTML 长度 ' + engBody.innerHTML.trim().length : 'no engBody');
ok('英语课程含「自然拼读」内容',
  !!engBody && (engBody.textContent.includes('拼读') || engBody.textContent.includes('Level') || engBody.textContent.includes('第')),
  engBody ? engBody.textContent.slice(0, 60).replace(/\s+/g, ' ') : '');

// 4) 英语四个 tab 均可渲染
['ipa', 'progress', 'wrong', 'phonics'].forEach(tab => {
  try {
    w.switchMain(tab);
    const eb = $('engBody');
    ok('英语 tab [' + tab + '] 渲染', !!eb && eb.innerHTML.trim().length > 20,
      '长度 ' + (eb ? eb.innerHTML.trim().length : -1));
  } catch (e) {
    ok('英语 tab [' + tab + '] 渲染', false, e.message);
  }
});

// 5) 统一存储：英语错题写入 math_practice_data
const KEY = 'math_practice_data';
const beforeMath = (typeof w.getWrongBank === 'function') ? w.getWrongBank().length : -1;
try {
  w.addWrong({ module: '自然拼读', lesson: 'Level1 · a', prompt: '听音辨词', answer: 'cat', your: 'dog' });
  w.addWrong({ module: '国际音标', lesson: '/i:/', prompt: '听音辨词', answer: 'see', your: 'sea' });
  ok('addWrong 调用成功', true);
} catch (e) {
  ok('addWrong 调用成功', false, e.message);
}
let store = {};
try { store = JSON.parse(w.localStorage.getItem(KEY) || '{}'); } catch (e) {}
const wrongArr = store.wrong || [];
const engItems = wrongArr.filter(x => x.module === '英语');
ok('英语错题写入 math_practice_data.wrong', engItems.length === 2, '英语项 ' + engItems.length + ' / 总 ' + wrongArr.length);
ok('英语错题带 module 标记 + unitName',
  engItems.length > 0 && engItems[0].module === '英语' && /英语/.test(engItems[0].unitName || ''),
  engItems[0] ? engItems[0].unitName : '');

// 6) 数学 getWrongBank 不受污染
const afterMath = (typeof w.getWrongBank === 'function') ? w.getWrongBank().length : -1;
ok('数学 getWrongBank 已过滤英语错题', beforeMath === afterMath,
  '前 ' + beforeMath + ' → 后 ' + afterMath);

// 7) 英语统计写入
try {
  w.recordAccuracy('p_l1_a', 'Level1 · a', 8, 10);
  const s2 = JSON.parse(w.localStorage.getItem(KEY) || '{}');
  const k = Object.keys(s2.stats || {}).filter(x => x.startsWith('eng_'));
  ok('英语统计写入 stats[eng_*]', k.length > 0, k.join(','));
} catch (e) {
  ok('英语统计写入 stats[eng_*]', false, e.message);
}

// 8) 切回数学
try {
  w.App.switchModule('math');
  ok('切回数学正常', disp('mathRoot') !== 'none' && disp('englishRoot') === 'none',
    'math=' + disp('mathRoot') + ' eng=' + disp('englishRoot'));
} catch (e) {
  ok('切回数学正常', false, e.message);
}

// 9) 关键数学函数存在
['renderHome', 'startUnitQuiz', 'startSpecialQuiz', 'startWrongReview', 'getWrongBank',
 'getAllWrongBank', 'addToWrongBank', 'renderStats', 'renderWrongBank', 'exportWrongBookText',
 'clearAllWrong', 'retryOneWrong']
  .forEach(fn => ok('数学函数 ' + fn + ' 存在', typeof w[fn] === 'function'));

// 10) 英语错题不进数学重练队列（startWrongReview 应提示为空）
let toastMsg = '';
w.showToast = function (m) { toastMsg = m; };
try {
  w.startWrongReview();
  ok('英语错题不会被数学「错题重练」抓取', /空/.test(toastMsg), 'toast=' + toastMsg);
} catch (e) {
  ok('英语错题不会被数学「错题重练」抓取', false, e.message);
}

// 11) 家长视图仍能看到全部（含英语）
ok('getAllWrongBank 保留英语错题（家长视图可见）',
  typeof w.getAllWrongBank === 'function' && w.getAllWrongBank().length === 2,
  '全部 ' + (typeof w.getAllWrongBank === 'function' ? w.getAllWrongBank().length : 'N/A'));

// ---------- 报告 ----------
console.log('\n===== 通过 (' + pass.length + ') =====');
pass.forEach(p => console.log('  ✓ ' + p));
if (fail.length) {
  console.log('\n===== 失败 (' + fail.length + ') =====');
  fail.forEach(f => console.log('  ✗ ' + f));
}
if (errs.length) {
  console.log('\n===== 运行时错误 (' + errs.length + ') =====');
  errs.slice(0, 15).forEach(e => console.log('  ! ' + String(e).split('\n')[0]));
}
console.log('\n结果: ' + (fail.length === 0 ? 'ALL PASS' : fail.length + ' FAILED'));
process.exit(fail.length === 0 ? 0 : 1);
