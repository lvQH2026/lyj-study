// 检测 3/4 年级：① 每课本单元可独立组满30题单元卷；② 期中/期末试卷结构正确
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = __dirname;
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '')
    .replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '')
    .replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, ''),
  { runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/', virtualConsole: vc, pretendToBeVisual: true }
);
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function (t) { this.text = t; };
w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
w.scrollTo = () => {}; w.confirm = () => true;
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};
['js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/chinese.js', 'js/diagram.js', 'js/main.js']
  .forEach(s => {
    const el = w.document.createElement('script');
    el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
    w.document.body.appendChild(el);
  });
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

const pass = [], fail = [];
const ok = (n, c, x) => (c ? pass : fail).push(n + (x ? '  →  ' + x : ''));

const KB = w.eval('KNOWLEDGE_BASE');
// ① 每课本单元独立组满 30 题
for (const g of [3, 4]) {
  for (const s of [1, 2]) {
    KB[g][s].filter(u => u.group === '课本').forEach(u => {
      let pool = w.eval(`(function(){ var seen=new Set(); return buildQuestionPool([KNOWLEDGE_BASE[${g}][${s}].find(x=>x.name==='${u.name.replace(/'/g,"\\'")}')], 30, seen, true); })()`);
      const distinct = new Set(pool.map(q => q.question)).size;
      ok(`${g}年级${s===1?'上':'下'}·${u.name} 单元卷≥30题`, pool.length >= 30, 'len=' + pool.length + ' 题面distinct=' + distinct);
    });
  }
}

// ② 期中/期末试卷结构
for (const g of [3, 4]) for (const s of [1, 2]) for (const t of ['mid', 'final']) {
  w.eval(`examState.grade=${g};examState.semester=${s};examState.type="${t}";`);
  const paper = w.eval('generateExamPaper()');
  if (!paper) { fail.push(`${g}年级${s===1?'上':'下'} ${t} 组卷失败`); continue; }
  let total = 0, emptyQ = 0, emptyA = 0, badNum = false;
  const names = new Set();
  paper.questions.forEach((q, i) => {
    total += (q.score || 0);
    if (!q.question) emptyQ++;
    if (q.answer === undefined || q.answer === null || q.answer === '') emptyA++;
    if (q.num !== i + 1) badNum = true;
    names.add(q._unitName);
  });
  ok(`${g}年级${s===1?'上':'下'} ${t} 总分=100`, total === 100, 'total=' + total);
  ok(`${g}年级${s===1?'上':'下'} ${t} 无空题干/空答案`, emptyQ === 0 && emptyA === 0, `emptyQ=${emptyQ},emptyA=${emptyA}`);
  ok(`${g}年级${s===1?'上':'下'} ${t} 题号连续`, !badNum);
  // 期末只应含课本单元；期中同理（getExamUnits 已过滤 group）
  const tbNames = new Set(KB[g][s].filter(u => u.group === '课本').map(u => u.name));
  let onlyTb = true;
  names.forEach(n => { if (!tbNames.has(n)) onlyTb = false; });
  ok(`${g}年级${s===1?'上':'下'} ${t} 仅含课本单元`, onlyTb, [...names].join(','));
}

console.log('PASS(' + pass.length + '):'); pass.forEach(p => console.log('  ✓ ' + p));
console.log('FAIL(' + fail.length + '):'); fail.forEach(f => console.log('  ✗ ' + f));
if (errs.length) console.log('JSDOM ERR:', errs.slice(0, 5));
process.exit(fail.length ? 1 : 0);
