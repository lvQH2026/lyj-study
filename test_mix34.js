// 检测所有 3/4 年级课本单元的「单元练习」(pickDifficultyMix, 20题) 是否出现空题
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = __dirname;
const vc = new VirtualConsole(); vc.on('jsdomError', e => {});
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '')
  .replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '')
  .replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, ''),
  { runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function (t) { this.text = t; };
w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
w.scrollTo = () => {}; w.confirm = () => true;
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};
['js/core.js','js/math.js','js/data.js','js/english.js','js/chinese.js','js/diagram.js','js/main.js'].forEach(s => {
  const el = w.document.createElement('script'); el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8'); w.document.body.appendChild(el);
});
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));
const KB = w.eval('KNOWLEDGE_BASE');
let bad = [];
for (const g of [3, 4]) for (const s of [1, 2]) KB[g][s].filter(u => u.group === '课本').forEach(u => {
  let cands = [];
  for (let i = 0; i < 60; i++) { let r = u.gen(); if (Array.isArray(r)) cands = cands.concat(r); else cands.push(r); }
  let out = w.eval('pickDifficultyMix')(cands, 20);
  let empty = out.filter(q => !q.question || q.answer === undefined || q.answer === null || q.answer === '').length;
  let distinct = new Set(out.map(q => q.question)).size;
  if (empty > 0 || out.length < 20) bad.push(`${g}年级${s===1?'上':'下'}·${u.name} len=${out.length} empty=${empty} distinct=${distinct}`);
});
if (bad.length) { console.log('RISKY UNITS:'); bad.forEach(b => console.log('  x ' + b)); process.exit(1); }
else { console.log('ALL 课本单元 unit-practice 20题无空题 OK'); }
