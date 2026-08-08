const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = __dirname;
const vc = new VirtualConsole();
vc.on('jsdomError', e => console.log('JSDOM ERR:', e.message));
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '')
  .replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, '')
  .replace(/<script>((?:(?!<\/?script)[\s\S])*?serviceWorker(?:(?!<\/?script)[\s\S])*?)<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;
w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
w.SpeechSynthesisUtterance = function (t) { this.text = t; };
w.matchMedia = w.matchMedia || (() => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
w.scrollTo = () => {};
w.confirm = () => true;
if (!w.HTMLElement.prototype.scrollIntoView) w.HTMLElement.prototype.scrollIntoView = function(){};
['js/core.js','js/math.js','js/data.js','js/english.js','js/main.js'].forEach(s => {
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
  w.document.body.appendChild(el);
});
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

w.eval('state.currentGrade=3; state.currentSemester=2;');
w.startUnitQuiz(0);
const qs = w.eval('state.quizQuestions');
console.log('total questions:', qs.length);
const texts = qs.map(q => q.question);
const uniq = [...new Set(texts)];
console.log('unique question TEXTS:', uniq.length, '/', qs.length);
qs.forEach((q, i) => {
  console.log(`#${i+1} [${q.question}] ans=${q.answer} svg=${q.svg ? q.svg.length : '-'} opts=${(q.options||[]).join('/')}`);
});
