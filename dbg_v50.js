// dbg_v50.js — 定位单元卷间歇性缺题：连续调用真实 generateExamPaper，统计题数/分区/池规模
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
const targets = [
  { sem: 1, name: '位置（数对）' },
  { sem: 2, name: '专项·立体图形' },
  { sem: 1, name: '数学广角——植树问题' },
  { sem: 2, name: '数学广角——找次品' },
];

const N = 50;
targets.forEach(t => {
  const idx = KB[5][t.sem].findIndex(u => u.name === t.name);
  w.eval(`examState.type='unit'; examState.grade=5; examState.semester=${t.sem}; examState.unitIdx=${idx};`);
  const stats = {};
  let fails = 0;
  for (let i = 0; i < N; i++) {
    const paper = w.eval('generateExamPaper()');
    const arr = (paper && paper.questions) || [];
    const sec = {};
    arr.forEach(q => { sec[q.sectionTitle] = (sec[q.sectionTitle] || 0) + 1; });
    const key = arr.length + ' | ' + Object.values(sec).join('/');
    stats[key] = (stats[key] || 0) + 1;
    if (arr.length !== 30) {
      fails++;
      if (fails <= 3) {
        const distinct = new Set(arr.map(q => q.question)).size;
        console.log(`  [FAIL ${t.name}] run#${i} 题数=${arr.length} 去重题面=${distinct} 分区=${JSON.stringify(sec)}`);
        // 打出重复题面
        const seen = new Set();
        arr.forEach(q => { if (seen.has(q.question)) console.log('    重复题面: ' + q.question.slice(0, 40)); seen.add(q.question); });
      }
    }
  }
  console.log(`${t.name}: ${N} 次中 ${fails} 次不足30题；分布:`);
  Object.keys(stats).sort().forEach(k => console.log(`   ${stats[k]}× [${k}]`));
});

// 单独测：数对单元的 buildQuestionPool 池规模分布
{
  const idx = KB[5][1].findIndex(u => u.name === '位置（数对）');
  const sizes = [];
  for (let i = 0; i < 30; i++) {
    const r = w.eval(`(() => { examState.type='unit'; examState.grade=5; examState.semester=1; examState.unitIdx=${idx};
      const {units} = getExamUnits(); return buildQuestionPool(units, 90, new Set(), true).length; })()`);
    sizes.push(r);
  }
  console.log('数对单元池规模(30次): ' + sizes.join(','));
}
