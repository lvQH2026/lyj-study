// audit_keys.js — 量化每个单元生成器的「题面|答案」去重键容量（单元卷 30 题的硬上限参考）
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '').replace(/<script src="(config|supabase|parent)\.js"><\/script>/g, ''), {
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

const KB = w.eval('KNOWLEDGE_BASE');
const N = 3000;
const rows = [];
[3, 4, 5, 6].forEach(g => {
  [1, 2].forEach(sem => {
    (KB[g][sem] || []).forEach(u => {
      const keys = new Set();
      for (let i = 0; i < N; i++) {
        try {
          const raw = u.gen();
          const arr = Array.isArray(raw) ? raw : [raw];
          arr.forEach(q => { if (q && q.question && q.answer !== undefined) keys.add(q.question + '|' + q.answer); });
        } catch (e) {}
      }
      rows.push({ g, sem, name: u.name, paper: !!u.paper, keys: keys.size });
    });
  });
});
rows.sort((a, b) => a.keys - b.keys);
console.log('年级 学期 单元                     键容量(paper)');
rows.forEach(r => console.log(`${r.g}年级 ${r.sem === 1 ? '上' : '下'}  ${r.name.padEnd(22)} ${String(r.keys).padStart(4)}${r.paper ? ' (整卷)' : ''}`));
console.log('\n键容量 < 35 的非 paper 单元（单元卷有缺题风险）：');
rows.filter(r => !r.paper && r.keys < 35).forEach(r => console.log(`  ${r.g}年级${r.sem === 1 ? '上' : '下'} ${r.name}: ${r.keys}`));
