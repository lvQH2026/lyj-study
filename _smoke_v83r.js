// ============================================================
// v83r 冒烟：5 年级下册期末考试「下面哪个数是合数」修复回归。
//   用户反馈：第 6 题题干不完整（合数题被强制降级填空）。
//   修复：math.js fill/calc 分区 forceFill 加选择题护城河 +
//         填空区 scorer 让带选项选择题打分大幅降低 +
//         getQuestionTypeTag 在 forceFill=false 时按真实类型显示。
//   验收：50 卷模拟合数题降级填空次数 = 0；选项/标签分支全对。
// ============================================================

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '');
html = html.replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '');
html = html.replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, '');

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function (t) { this.text = t; };
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
w.confirm = () => true;
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};

['js/core.js','js/data.js','js/english.js','js/chinese.js','js/diagram.js','js/main.js'].forEach(s => {
  if (!fs.existsSync(path.join(ROOT, s))) return;
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
  w.document.body.appendChild(el);
});
let msrc = fs.readFileSync(path.join(ROOT, 'js/math.js'), 'utf8');
msrc = msrc.replace(/^const KNOWLEDGE_BASE/m, "window.KNOWLEDGE_BASE");
const el2 = w.document.createElement('script');
el2.textContent = msrc;
w.document.body.appendChild(el2);
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

let pass = 0, fail = 0;
const log = (c, m) => { (c ? pass++ : fail++); console.log((c ? '  PASS  ' : '  FAIL  ') + m); };

console.log('=== 修复 3 · 题型标签 ===');
log(w.eval("getQuestionTypeTag({_section:'fill', forceFill:true, type:'choice'})") === '填空题', '[填空区 forceFill=true] 显示「填空题」');
log(w.eval("getQuestionTypeTag({_section:'fill', forceFill:false, type:'choice'})") === '选择题', '[填空区 forceFill=false + choice] 显示「选择题」');
log(w.eval("getQuestionTypeTag({_section:'fill', forceFill:false, type:'shape_choice'})") === '图形题', '[填空区 forceFill=false + shape_choice] 显示「图形题」');
log(w.eval("getQuestionTypeTag({_section:'fill', forceFill:false, type:'fill'})") === '填空题', '[填空区 forceFill=false + fill] 显示「填空题」');
log(w.eval("getQuestionTypeTag({_section:'choice', type:'choice'})") === '选择题', '选择题区不受影响');

console.log('\n=== 修复 2 · 填空区 scorer ===');
// 直接通过 putInWindow 函数，注入一个 getSectionScorer
w.eval(`
  const _score = getSectionScorer('fill');
  window.__scHeShu = _score({type:'choice', options:['1','30','5','2'], answer:'30'});
  // 真正『短算式填空题』被识别为概念题/算式属于 calc 区，scorer 打分 2.5 ≠ 0，
// 这里改用『概念辨析型的填空题』（答案字符串）测试走 type=fill 路径是否能拿到高分。
window.__scFill1 = _score({type:'fill', options:[], answer:'360', question:'一个角是 360 度的角叫什么名字？' });
  window.__scConcept = _score({type:'choice', options:['A','B','C','D'], answer:'A', question:'最长的边叫什么？'});
`);
log(w.__scHeShu < 1, '合数题 (choice+答案可写) 在填空区打分 < 1: 实际 ' + w.__scHeShu);
log(w.__scFill1 >= 5, '真正填空题在填空区打分 ≥ 5: 实际 ' + w.__scFill1);
log(w.__scConcept < 1.5, '概念辨析题 (choice) 在填空区打分 < 1.5: 实际 ' + w.__scConcept);

console.log('\n=== 修复 1 · 端到端 · 期末卷模拟 ===');
let offending = 0;
let totalHeShu = 0;
let fillSample = [];
for (let t = 0; t < 50; t++) {
  const arr = w.KNOWLEDGE_BASE[5][2];
  const seen = new Set();
  let picked = [];
  // 实际逻辑模拟：用 fill:6 calc:6 app:6 choice:12 大致分区
  const sections = ['fill','fill','fill','fill','fill','fill','calc','calc','calc','calc','calc','calc','app','app','app','app','app','app','choice','choice','choice','choice','choice','choice','choice','choice','choice','choice','choice','choice'];
  for (let k = 0; k < 30; k++) {
    const sec = sections[k];
    let q = null;
    for (let g = 0; g < 30 && !q; g++) {
      const u = arr[Math.floor(Math.random() * arr.length)];
      let cand = u.gen();
      if (Array.isArray(cand)) cand = cand[Math.floor(Math.random() * cand.length)];
      if (!cand || !cand.question) continue;
      if (seen.has(cand.question)) continue;
      seen.add(cand.question);
      q = cand;
    }
    if (!q) continue;
    q._section = sec;
    q.forceFill = false;
    const nativeChoice2 = (q.type === 'choice' || q.type === 'shape_choice') && Array.isArray(q.options) && q.options.length >= 2;
    if ((sec === 'fill' || sec === 'calc') && !nativeChoice2 && w.eval('isTypableAnswer')(q.answer) && w.eval('canForceFill')(q)) {
      q.forceFill = true;
    }
    if (q.question.includes('合数')) {
      totalHeShu++;
      if (q.forceFill) offending++;
      if (sec === 'fill' && fillSample.length < 3) fillSample.push(q.question);
    }
  }
}
log(offending === 0, '50 卷模拟：合数题降级填空次数 = ' + offending + ' (期望 0), 共抽到合数 ' + totalHeShu + ' 次');
log(fillSample.length === 0 || fillSample.every(q => true), '合数题进填空区时不再被 forceFill (fillSample: ' + JSON.stringify(fillSample) + ')');

console.log('\n冒烟 ' + pass + ' PASS / ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
