// audit_master.js — v53 「错题重练答对即移出错题库」实测
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

let fail = 0;
const bad = m => { fail++; console.log('  ✗ ' + m); };
const ok  = m => console.log('  ✓ ' + m);

const STORE = 'math_practice_data';
const allWrong = () => (JSON.parse(w.localStorage.getItem(STORE) || '{}').wrong) || [];

// ============ 数学：错题重练答对即移除 ============
console.log('\n=== 数学：startWrongReview 答对移除 ===');
w.localStorage.removeItem(STORE);
const mq1 = { question: '数学填空1：12 + 7 = ?', answer: '19', type: 'fill' };
const mq2 = { question: '数学填空2：8 × 3 = ?', answer: '24', type: 'fill' };
w.addToWrongBank(mq1, 'x', '四则', 5);
w.addToWrongBank(mq2, 'x', '四则', 5);
w.startWrongReview();
const st = w.eval('state');
console.log('    quizMode=' + st.quizMode + '  sourceIds=' + JSON.stringify(st.quizWrongSourceIds) + '  题数=' + st.quizQuestions.length);
if (st.quizMode !== 'wrong') bad('未进入 wrong 模式');
if (!st.quizWrongSourceIds || st.quizWrongSourceIds.length !== 2) bad('quizWrongSourceIds 未正确记录（长度应=2）');
else ok('sourceIds 记录正确（2 条）');

// 第一题答对
const q0 = w.eval('state.quizQuestions[state.quizIndex]');
const ansInput = w.document.getElementById('answerInput');
ansInput.value = q0.answer;
w.submitAnswer();
const afterMathCorrect = w.getWrongBank().length;
console.log('    答对第1题后 数学错题数=' + afterMathCorrect + '（期望=1，被移除1条）');
if (afterMathCorrect !== 1) bad('答对后未移除错题（剩余=' + afterMathCorrect + '）');
else ok('答对自动移除对应错题');
// 确认被移除的是刚答对的第1题
const remainQ = w.getWrongBank()[0].question.question;
if (remainQ !== q0.question) ok('移除的正是刚答对的第1题（保留另一题）');
else bad('移除错位：剩余=' + remainQ);

// 第二题答错 → 保留（先推进到第2题，answerInput 会被重新渲染）
w.submitAnswer(); // else 分支：advance 到 q1 并重渲染
const q1 = w.eval('state.quizQuestions[state.quizIndex]');
w.document.getElementById('answerInput').value = (String(q1.answer) === '999' ? '998' : '999'); // 必定答错
w.submitAnswer(); // 处理 q1：答错
const afterMathWrong = w.getWrongBank().length;
console.log('    答错第2题后 数学错题数=' + afterMathWrong + '（期望=1，错题保留+可能 count+1）');
if (afterMathWrong < 1) bad('答错后错题丢失（应保留）');
else ok('答错保留错题');

// ============ 数学：retryOneWrong 单题答对移除 ============
console.log('\n=== 数学：retryOneWrong 单题答对移除 ===');
w.localStorage.removeItem(STORE);
const mq3 = { question: '数学填空3：100 - 36 = ?', answer: '64', type: 'fill' };
w.addToWrongBank(mq3, 'x', '四则', 5);
const onlyId = w.getWrongBank()[0].id;
w.retryOneWrong(onlyId);
const st2 = w.eval('state');
console.log('    quizWrongSourceIds=' + JSON.stringify(st2.quizWrongSourceIds) + ' 期望=[' + onlyId + ']');
if (st2.quizWrongSourceIds[0] === onlyId) ok('retryOneWrong sourceIds 正确');
else bad('retryOneWrong sourceIds 错误');
w.document.getElementById('answerInput').value = '64';
w.submitAnswer();
const afterRetry = w.getWrongBank().length;
console.log('    单题答对后 数学错题数=' + afterRetry + '（期望=0）');
if (afterRetry !== 0) bad('单题答对后未移除（剩余=' + afterRetry + '）');
else ok('单题答对自动移除');

// ============ 语文：错题重练答对移除（含对齐验证） ============
console.log('\n=== 语文：startWrongReview 答对移除 + 对齐 ===');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runCn() {
  w.localStorage.removeItem(STORE);
  w.CN.selectGrade(5); // 设定年级，避免答错分支 CN_DATA[grade] 崩溃
  function injectCnWrong(qtext, ans) {
    const d = JSON.parse(w.localStorage.getItem(STORE) || '{}');
    if (!d.wrong) d.wrong = [];
    d.wrong.push({
      id: 'cn_' + Math.random().toString(36).slice(2, 8),
      module: '语文',
      question: { question: qtext, answer: ans, type: 'fill' },
      userAnswer: 'x', unitName: '专项', grade: 5, time: 1, count: 1
    });
    w.localStorage.setItem(STORE, JSON.stringify(d));
  }
  const cnCount = () => allWrong().filter(x => x.module === '语文').length;
  const cnMap = { '白日依山': '尽', '黄河入海': '流' };
  function cnCurrentAnswer() {
    const t = (w.document.getElementById('cnQuestionCard') || {}).textContent || '';
    for (const k in cnMap) if (t.indexOf(k) >= 0) return cnMap[k];
    return null;
  }

  injectCnWrong('语文填空1：白日依山__', '尽');
  injectCnWrong('语文填空2：黄河入海__', '流');
  w.CN.startWrongReview();
  console.log('    重练前语文错题数=' + cnCount() + '（期望=2）');
  if (cnCount() !== 2) bad('语文错题注入异常（=' + cnCount() + '）');

  // 第1题（读取当前题面→反查正确答案，抗随机打乱）答对 → 应移除该对应题
  const cinput = w.document.getElementById('cnFillInput');
  console.log('    cnFillInput 存在=' + !!cinput);
  const ans1 = cnCurrentAnswer();
  if (!ans1) { bad('无法从 DOM 识别当前题'); return; }
  const answeredMarker = Object.keys(cnMap).find(k => cnMap[k] === ans1);
  cinput.value = ans1;
  try { w.CN.submit(); } catch (e) { console.log('    [submit 异常] ' + (e && e.stack ? e.stack : e)); }
  const afterCnCorrect = cnCount();
  console.log('    答对第1题后 语文错题数=' + afterCnCorrect + '（期望=1）');
  if (afterCnCorrect !== 1) bad('语文答对后未移除（剩余=' + afterCnCorrect + '）');
  else ok('语文答对自动移除');
  const remaining = allWrong().filter(x => x.module === '语文');
  const removedCorrect = remaining.length === 1 && !remaining[0].question.question.includes(answeredMarker);
  if (removedCorrect) ok('被移除的正是刚答对的那一题，非误删');
  else bad('对齐错误：移除的不是刚答对的那一题');

  // 等待 setTimeout 推进到第2题
  await sleep(750);
  const cinput2 = w.document.getElementById('cnFillInput');
  if (!cinput2) { bad('第2题未渲染（cnFillInput 缺失）'); return; }
  const ans2 = cnCurrentAnswer();
  cinput2.value = (ans2 === '错' ? '对' : '错'); // 必定答错 → 保留
  try { w.CN.submit(); } catch (e) { console.log('    [submit 异常] ' + (e && e.stack ? e.stack : e)); }
  const afterCnWrong = cnCount();
  console.log('    答错第2题后 语文错题数=' + afterCnWrong + '（期望=1）');
  if (afterCnWrong < 1) bad('语文答错后错题丢失');
  else ok('语文答错保留错题');
}
runCn().then(() => {
  console.log('\n[jsdom 加载期错误] ' + (errs.length ? errs.join(' | ') : '无'));
  console.log(fail === 0 ? '\n✅ audit_master 全部通过' : `\n❌ audit_master 失败 ${fail} 项`);
  process.exit(fail === 0 ? 0 : 1);
}).catch(e => { console.log('运行异常：' + e.message); process.exit(1); });
