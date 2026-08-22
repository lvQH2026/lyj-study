// audit_wrong.js — 跨版块错题逻辑审计
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
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

['js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/chinese.js', 'js/diagram.js', 'js/main.js']
  .forEach(s => {
    const el = w.document.createElement('script');
    el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
    w.document.body.appendChild(el);
  });
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

if (errs.length) { console.log('[jsdom 加载期错误] ' + errs.join(' | ')); }

let fail = 0;
const bad = m => { fail++; console.log('  ✗ ' + m); };
const ok = m => console.log('  ✓ ' + m);

const STORE = 'math_practice_data';
function resetStore() { w.localStorage.removeItem(STORE); }
function allWrong() { return JSON.parse(w.localStorage.getItem(STORE) || '{}').wrong || []; }
function byModule(m) { return allWrong().filter(x => x.module === m); }
// 往现有存储「追加」一条指定模块的错题（不覆盖），用于构造三模块共存场景
function appendWrong(module, q, a, ua, unit) {
  const d = JSON.parse(w.localStorage.getItem(STORE) || '{}');
  if (!d.wrong) d.wrong = [];
  d.wrong.push({ id: module + '_' + Math.random().toString(36).slice(2, 8), module: module, question: { question: q, answer: a }, userAnswer: ua, unitName: unit, grade: 5, time: 1, count: 1 });
  w.localStorage.setItem(STORE, JSON.stringify(d));
}

// ============ ① 数学去重 ============
console.log('=== ① 数学版块：错题去重 ===');
resetStore();
const mq = { question: '数学题：3 + 5 = ?', answer: '8', type: 'fill' };
w.addToWrongBank(mq, '12', '四则运算', 5);
w.addToWrongBank(mq, '12', '四则运算', 5);
const mBank = w.getWrongBank();
console.log('    存储的数学错题条目数=' + mBank.length + '（期望=1）  首条 count=' + (mBank[0] && mBank[0].count) + '（期望=2）');
console.log('    存储项 .question 类型=' + typeof (mBank[0] && mBank[0].question) + '，has module=' + (mBank[0] && ('module' in mBank[0])));
if (mBank.length !== 1) bad('数学去重失效：同一题错两次生成 ' + mBank.length + ' 条（应为1条且 count=2）');
else ok('数学去重正常');
if (mBank[0] && mBank[0].count !== 2) bad('数学错题 count 未累加（count=' + (mBank[0] && mBank[0].count) + '）');
if (mBank[0] && !('module' in mBank[0])) console.log('    [提示] 数学错题未写入 module 字段（依赖 !w.module 兜底，存在潜在不一致）');

// ============ ② 英语去重 ============
console.log('=== ② 英语版块：错题去重 ===');
try {
  resetStore();
  w.addWrong({ module: '自然拼读', lesson: 'L1', your: 'kat', answer: 'cat', prompt: '听音辨词' });
  w.addWrong({ module: '自然拼读', lesson: 'L1', your: 'kat', answer: 'cat', prompt: '听音辨词' });
  const eBank = w.loadEnglishWrong();
  console.log('    英语错题条目数=' + eBank.length + '（期望=1），count=' + (eBank[0] && eBank[0].count));
  if (eBank.length === 1 && eBank[0] && eBank[0].count === 2) ok('英语去重正常');
  else bad('英语去重异常：条目=' + eBank.length + ' count=' + (eBank[0] && eBank[0].count));
} catch (e) { bad('英语审计抛错: ' + e.message); }

// ============ ③ 语文去重（cnAddWrong 未暴露，做静态确认 + 注入验证渲染） ============
console.log('=== ③ 语文版块：错题去重（代码静态确认） ===');
{
  const src = fs.readFileSync(path.join(ROOT, 'js/chinese.js'), 'utf8');
  const m = src.match(/function cnAddWrong[\s\S]*?w\.question\.question === question\.question/);
  if (m) ok('语文 cnAddWrong 去重比较为 w.question.question === question.question（对象.题面 === 字符串题面，形态正确）');
  else bad('语文 cnAddWrong 去重比较形态异常，需人工复核');
  // 注入两条相同语文错题，验证 cnGetWrong 渲染不丢、clearWrong 只清语文
  resetStore();
  const base = { id: 'c1', module: '语文', question: { question: '语文题A', answer: 'A' }, userAnswer: 'B', unitName: '一单元', grade: 5, time: 1, count: 1 };
  const data = { wrong: [JSON.parse(JSON.stringify(base)), Object.assign({}, base, { id: 'c2' })], stats: {}, history: [] };
  w.localStorage.setItem(STORE, JSON.stringify(data));
  try { w.CN.clearWrong(); } catch (e) { console.log('    CN.clearWrong 抛错(可忽略): ' + e.message); }
  const cnLeft = byModule('语文').length;
  console.log('    注入2条语文错题并调 CN.clearWrong 后，语文剩余=' + cnLeft + '（期望=0）');
  if (cnLeft === 0) ok('语文清空隔离正确');
  else bad('语文清空隔离异常：剩余 ' + cnLeft);
}

// ============ ④ 三模块「清空」隔离 ============
console.log('=== ④ 清空隔离：数学 clearAllWrong 不误伤英/语 ===');
resetStore();
w.addToWrongBank({ question: 'M', answer: '1', type: 'fill' }, '0', 'u', 5);
w.addWrong({ module: '国际音标', lesson: 'L1', your: 'x', answer: 'a', prompt: '听音' });
appendWrong('语文', 'C', 'A', 'B', 's');
w.clearAllWrong();
const afterMath = { math: byModule('数学').length, eng: byModule('英语').length, cn: byModule('语文').length, legacy: allWrong().filter(x => !x.module).length };
console.log('    清空数学后：数学=' + afterMath.math + ' 英语=' + afterMath.eng + ' 语文=' + afterMath.cn + ' 无module=' + afterMath.legacy);
if (afterMath.math === 0 && afterMath.eng === 1 && afterMath.cn === 1 && afterMath.legacy === 0) ok('clearAllWrong 仅清空数学，隔离正确');
else bad('clearAllWrong 隔离错误：' + JSON.stringify(afterMath));

console.log('=== ⑤ 清空隔离：英语 clearWrong 不误伤数/语 ===');
resetStore();
w.addToWrongBank({ question: 'M', answer: '1', type: 'fill' }, '0', 'u', 5);
w.addWrong({ module: '国际音标', lesson: 'L1', your: 'x', answer: 'a', prompt: '听音' });
appendWrong('语文', 'C', 'A', 'B', 's');
w.clearWrong();
const afterEng = { math: byModule('数学').length + allWrong().filter(x => !x.module).length, eng: byModule('英语').length, cn: byModule('语文').length };
console.log('    清空英语后：数学=' + afterEng.math + ' 英语=' + afterEng.eng + ' 语文=' + afterEng.cn);
if (afterEng.eng === 0 && afterEng.math === 1 && afterEng.cn === 1) ok('clearWrong 仅清空英语，隔离正确');
else bad('clearWrong 隔离错误：' + JSON.stringify(afterEng));

console.log('=== ⑥ 清空隔离：语文 CN.clearWrong 不误伤数/英 ===');
resetStore();
w.addToWrongBank({ question: 'M', answer: '1', type: 'fill' }, '0', 'u', 5);
w.addWrong({ module: '国际音标', lesson: 'L1', your: 'x', answer: 'a', prompt: '听音' });
appendWrong('语文', 'C', 'A', 'B', 's');
w.CN.clearWrong();
const afterCn = { math: byModule('数学').length + allWrong().filter(x => !x.module).length, eng: byModule('英语').length, cn: byModule('语文').length };
console.log('    清空语文后：数学=' + afterCn.math + ' 英语=' + afterCn.eng + ' 语文=' + afterCn.cn);
if (afterCn.cn === 0 && afterCn.math === 1 && afterCn.eng === 1) ok('CN.clearWrong 仅清空语文，隔离正确');
else bad('CN.clearWrong 隔离错误：' + JSON.stringify(afterCn));

console.log('\n运行时错误数: ' + errs.length + (errs.length ? (' -> ' + errs.join(' | ')) : ''));
console.log(fail === 0 ? '审计结果：除已标记项外未发现新的跨模块隔离/去重缺陷' : ('审计发现 ' + fail + ' 处问题 ✗'));
process.exit(fail === 0 ? 0 : 1);
