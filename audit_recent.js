// audit_recent.js — v54 「家长端·最近练习」jsdom 实测
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '');
html = html.replace(/<script src="(config|supabase)\.js"><\/script>/g, '');
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

['js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/chinese.js', 'js/diagram.js', 'js/main.js', 'parent.js']
  .forEach(s => {
    const el = w.document.createElement('script');
    el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
    w.document.body.appendChild(el);
  });
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

let fail = 0;
const bad = m => { fail++; console.log('  ✗ ' + m); };
const ok  = m => console.log('  ✓ ' + m);

const STORE = 'math_practice_data';
const H = 3600 * 1000, D = 24 * H;
const now = Date.now();

function wm(q, a, ua, opts) {
  return { unitName: '测试单元', grade: 5, userAnswer: ua,
    question: { question: q, options: opts || [], answer: a, explain: '这是解析', svg: '' } };
}
function rec(module, score, total, agoMs, wrong, noModule) {
  const r = { grade: 5, unitName: '单元测试', score, total, accuracy: Math.round(score/total*100),
    time: now - agoMs, wrong: wrong || [], synced: false };
  if (!noModule) r.module = module;
  return r;
}
function seed(history) {
  w.localStorage.setItem(STORE, JSON.stringify({ wrong: [], stats: {}, history }));
}
function rpHtml() {
  const el = w.document.getElementById('parentResult');
  return el ? el.innerHTML : '';
}

// ============ A. 列表 + 详情（含 module 字段） ============
console.log('\n=== A. 最近练习列表（最近5条）+ 点击详情 ===');
w.localStorage.removeItem(STORE);
const histories = [];
for (let i = 0; i < 7; i++) {
  const mod = (i % 2 === 0) ? '数学' : '语文';
  const withOpts = (i === 0)
    ? [ wm('下列读音正确的一项是？', 'B. 重zhòng要', 'A. 重chóng复', ['A. 重chóng复', 'B. 重zhòng要', 'C. 重cóng复', 'D. 重zòng要']) ]
    : [ wm('练习题' + i + '：3×4=?', '12', 'x'), wm('练习题' + i + 'b：7+8=?', '15', 'x') ];
  histories.push(rec(mod, 18 - i, 20, (i + 1) * H, withOpts));
}
seed(histories);
w.renderParent();
const htmlA = rpHtml();
if (htmlA.indexOf('最近练习') >= 0) ok('首页含「最近练习」模块');
else bad('首页未出现「最近练习」');

const itemCount = (htmlA.match(/class="rp-item"/g) || []).length;
console.log('    列表渲染条目数=' + itemCount + '（期望=5，最多近5条）');
if (itemCount === 5) ok('列表仅展示最近 5 条（7 条记录→截断为 5）');
else bad('列表条数错误（期望=5，实际=' + itemCount + '）');

const mathCount = (htmlA.match(/rp-sub-math/g) || []).length;
const cnCount = (htmlA.match(/rp-sub-cn/g) || []).length;
console.log('    数学徽标=' + mathCount + ' 语文徽标=' + cnCount);
if (mathCount > 0 && cnCount > 0) ok('科目徽标区分数学/语文');
else bad('科目徽标缺失');

if (htmlA.indexOf('rp-acc') >= 0 && htmlA.indexOf('rp-count') >= 0 && htmlA.indexOf('rp-time') >= 0) ok('每条含正确率/题数/时间');
else bad('列表项缺关键信息（正确率/题数/时间）');

// 点击第1条 → 详情
w.showPracticeDetail(0);
const detailEl = w.document.getElementById('rpDetail');
const listEl = w.document.getElementById('rpList');
const dHtml = detailEl ? detailEl.innerHTML : '';
if (detailEl && detailEl.style.display !== 'none') ok('点击后详情面板展开');
else bad('点击后详情未展开');
if (listEl && listEl.style.display === 'none') ok('点击后列表隐藏');
else bad('点击后列表未隐藏');

if (dHtml.indexOf('答题情况') >= 0) ok('详情含「答题情况」');
else bad('详情缺答题情况');
if (dHtml.indexOf('错题汇总') >= 0) ok('详情含「错题汇总」');
else bad('详情缺错题汇总');
// 第1条数学、含 options，应高亮正确答案 B
if (dHtml.indexOf('rp-opt-ans') >= 0 && dHtml.indexOf('重zhòng要') >= 0) ok('错题明细带选项且高亮正确答案');
else bad('错题明细选项/高亮缺失');
if (dHtml.indexOf('你的答案：A. 重chóng复') >= 0 && dHtml.indexOf('正确答案：B. 重zhòng要') >= 0) ok('展示你的答案 vs 正确答案');
else bad('未正确展示 你的答案/正确答案');

// 返回
w.hidePracticeDetail();
if (listEl && listEl.style.display !== 'none' && detailEl.style.display === 'none') ok('返回后恢复列表');
else bad('返回后未恢复列表');

// ============ B. 旧数学记录无 module → 按数学兜底 ============
console.log('\n=== B. 旧记录无 module 字段兜底为数学 ===');
w.localStorage.removeItem(STORE);
seed([
  rec('数学', 19, 20, 2 * H, [ wm('旧题：9×9=?', '81', 'x') ], true) // noModule=true
]);
w.renderParent();
const htmlB = rpHtml();
if (htmlB.indexOf('rp-sub-math') >= 0 && htmlB.indexOf('>数学<') >= 0) ok('无 module 旧记录按「数学」展示');
else bad('旧记录未兜底为数学');

// ============ C. 近7天空状态 ============
console.log('\n=== C. 近 7 天无记录 → 空状态 ===');
w.localStorage.removeItem(STORE);
seed([
  rec('数学', 19, 20, 10 * D, [ wm('很久以前：1+1=?', '2', 'x') ]),
  rec('语文', 15, 20, 30 * D, [ wm('很久以前2', 'x', 'y') ])
]);
w.renderParent();
const htmlC = rpHtml();
const emptyCnt = (htmlC.match(/class="rp-empty"/g) || []).length;
if (emptyCnt >= 1) ok('近7天无记录显示空状态卡片');
else bad('未显示空状态');
if (htmlC.indexOf('近 7 天还没有练习记录') >= 0) ok('空状态文案正确');
else bad('空状态文案缺失');
if ((htmlC.match(/class="rp-item"/g) || []).length === 0) ok('空状态下不展示旧记录列表');
else bad('空状态下仍展示了旧记录列表');

// 完全无记录
w.localStorage.removeItem(STORE);
seed([]);
w.renderParent();
if ((rpHtml().match(/class="rp-item"/g) || []).length === 0 && rpHtml().indexOf('rp-empty') >= 0) ok('零记录也显示空状态');
else bad('零记录未显示空状态');

console.log('\n[jsdom 加载期错误] ' + (errs.length ? errs.join(' | ') : '无'));
console.log(fail === 0 ? '\n✅ audit_recent 全部通过' : `\n❌ audit_recent 失败 ${fail} 项`);
process.exit(fail === 0 ? 0 : 1);
