// v51 探针：各单元单元练习 6:3:1 分布摸底 + 考试卷难度分布
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
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

// 摸底：五、六年级所有单元 beginUnitQuiz 后的难度分布
const report = [];
for (const grade of [5, 6]) {
  for (let sem = 1; sem <= 2; sem++) {
    const units = w.eval(`KNOWLEDGE_BASE[${grade}][${sem}]`);
    if (!units) continue;
    units.forEach((u, idx) => {
      try {
        w.eval(`examState.type=null; beginUnitQuiz(${idx}, ${grade}, ${sem});`);
        const dist = w.eval(`JSON.stringify((function(){
          let c={1:0,2:0,3:0};
          state.quizQuestions.forEach(q=>c[questionDifficulty(q)]++);
          return c;
        })())`);
        const n = w.eval('state.quizQuestions.length');
        const d = JSON.parse(dist);
        const ok = (n === 20);
        const exact = (d[1] === 12 && d[2] === 6 && d[3] === 2);
        report.push({ grade, sem, name: u.name, n, d, exact });
        if (!ok || !exact) console.log(`${ok ? '' : '!!题数' + n + ' '}${exact ? '' : '偏差'} ${grade}年级${sem === 1 ? '上' : '下'} ${u.name}: 基${d[1]}/提${d[2]}/拓${d[3]}`);
      } catch (e) {
        console.log(`!!异常 ${grade}/${sem} ${u.name}: ${e.message}`);
      }
    });
  }
}
const exactCount = report.filter(r => r.exact).length;
console.log(`\n单元练习 6:3:1 精确达标: ${exactCount}/${report.length}`);
const badLen = report.filter(r => r.n !== 20).length;
console.log(`题数!=20 的单元: ${badLen}`);

// 考试卷难度分布
console.log('\n--- 考试卷 ---');
for (const cfg of [
  { type: 'final', grade: 5, sem: 1 },
  { type: 'final', grade: 6, sem: 1 },
  { type: 'final', grade: 6, sem: 2 },
  { type: 'mid', grade: 5, sem: 2 },
]) {
  w.eval(`examState.type='${cfg.type}'; examState.grade=${cfg.grade}; examState.semester=${cfg.sem};`);
  const paper = w.eval('generateExamPaper()');
  if (!paper) { console.log(`${cfg.grade}/${cfg.sem} ${cfg.type}: 组卷失败`); continue; }
  const d = { 1: 0, 2: 0, 3: 0 };
  paper.questions.forEach(q => {
    const lv = w.eval(`questionDifficulty(${JSON.stringify(q)})`);
    d[lv]++;
  });
  console.log(`${cfg.grade}年级${cfg.sem === 1 ? '上' : '下'} ${cfg.type}: 共${paper.questions.length}题 基${d[1]}/提${d[2]}/拓${d[3]} | sub: ${paper.sub}`);
}
