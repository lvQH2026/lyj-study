// 4年级双轨改造结构验证（jsdom 真加载）
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = __dirname;
const pass = [], fail = [];
const ok = (n, c, x) => (c ? pass : fail).push(n + (x ? '  →  ' + x : ''));

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => errs.push(e.message));
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '');
html = html.replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '');
html = html.replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function (t) { this.text = t; };
w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
w.scrollTo = () => {}; w.confirm = () => true;
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};
['js/core.js','js/math.js','js/data.js','js/english.js','js/chinese.js','js/diagram.js','js/main.js'].forEach(s => {
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
  w.document.body.appendChild(el);
});
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

const KB = w.eval('KNOWLEDGE_BASE');
const g4 = KB[4];
ok('四年级存在双轨（含 group:课本）', g4[1].some(u => u.group === '课本') && g4[2].some(u => u.group === '课本'));

const tb1 = g4[1].filter(u => u.group === '课本');
const tb2 = g4[2].filter(u => u.group === '课本');
ok('四上课本同步单元=8', tb1.length === 8, 'actual=' + tb1.length);
ok('四下课本同步单元=9', tb2.length === 9, 'actual=' + tb2.length);

let allMeta = true, bad = [];
[...tb1, ...tb2].forEach(u => {
  if (!(u.summary && u.summary.length >= 3) || !(u.fidx && u.fidx.length >= 2) || !(u.method && u.method.length >= 2)) { allMeta = false; bad.push(u.name); }
});
ok('所有课本单元含 summary≥3/fidx≥3/method≥2', allMeta, bad.join(','));

let lowGen = [];
[...tb1, ...tb2].forEach(u => {
  if (!u.gen) { lowGen.push(u.name + ':无gen'); return; }
  let seen = new Set();
  for (let i = 0; i < 300; i++) {
    try { let raw = u.gen(); let cands = Array.isArray(raw) ? raw : [raw];
      cands.forEach(q => { if (q && q.question && q.answer !== undefined && q.answer !== null) seen.add(q.question + '|' + q.answer); });
    } catch (e) {}
  }
  if (seen.size < 35) lowGen.push(u.name + ':' + seen.size);
});
ok('所有课本单元 gen 去重键≥35', lowGen.length === 0, lowGen.join(','));

const sp1 = g4[1].filter(u => u.group === '专项');
const sp2 = g4[2].filter(u => u.group === '专项');
ok('四上专项≥5', sp1.length >= 5, 'actual=' + sp1.length);
ok('四下专项≥5', sp2.length >= 5, 'actual=' + sp2.length);

try { w.eval('examState.grade=4; examState.semester=1; examState.type="final";'); } catch (e) { errs.push('set examState: ' + e.message); }
const ex = w.eval('getExamUnits()');
ok('期末只考课本单元（8个，四上）', ex.units.length === 8, 'actual=' + ex.units.length);
try { w.eval('examState.grade=4; examState.semester=2; examState.type="final";'); } catch (e) {}
const ex2 = w.eval('getExamUnits()');
ok('期末只考课本单元（9个，四下）', ex2.units.length === 9, 'actual=' + ex2.units.length);

console.log('PASS(' + pass.length + '):'); pass.forEach(p => console.log('  ✓ ' + p));
console.log('FAIL(' + fail.length + '):'); fail.forEach(f => console.log('  ✗ ' + f));
if (errs.length) console.log('JSDOM ERR:', errs.slice(0, 5));
process.exit(fail.length ? 1 : 0);
