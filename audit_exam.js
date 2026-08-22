// 检测 5/6 年级期中期末试卷：专业性 / 美观性 / 图形合理性
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
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

const SUITES = [];
for (let g of [5, 6]) for (let s of [1, 2]) for (let t of ['mid', 'final']) SUITES.push({ g, s, t });

for (const { g, s, t } of SUITES) {
  w.eval(`examState.grade=${g};examState.semester=${s};examState.type="${t}";`);
  const paper = w.eval('generateExamPaper()');
  if (!paper) { console.log(`\n##### ${g}年级${s===1?'上':'下'}册 ${t==='mid'?'期中':'期末'}：组卷失败!`); continue; }

  console.log(`\n##### ${g}年级${s===1?'上':'下'}册 ${t==='mid'?'期中':'期末'} #####`);
  console.log(`标题: ${paper.title}`);
  console.log(`副题: ${paper.sub}`);

  // 题型分布
  const secCount = {};
  paper.questions.forEach(q => {
    const sec = (q.sectionTitle || '?').split('（')[0];
    secCount[sec] = (secCount[sec] || 0) + 1;
  });
  console.log('分区分布: ' + JSON.stringify(secCount));

  // 分区完整检查
  PAPER_STRUCTURE_CHECK(paper);

  // 单元覆盖
  const unitCount = {};
  paper.questions.forEach(q => {
    const u = q._unitName || '?';
    unitCount[u] = (unitCount[u] || 0) + 1;
  });
  console.log('单元覆盖: ' + Object.entries(unitCount).map(([k, v]) => `${k}(${v})`).join(' '));

  // 配图题统计与 SVG 检查
  const imgQs = paper.questions.filter(q => String(q.svg || '').includes('<'));
  console.log(`配图题: ${imgQs.length}/30`);
  imgQs.forEach(q => {
    const svg = String(q.svg);
    const elCount = (svg.match(/<(circle|rect|line|path|polygon|polyline|text|ellipse|g)\b/g) || []).length;
    const textEls = (svg.match(/<text[^>]*>([^<]*)<\/text>/g) || []).length;
    console.log(`  [题${q.num}] ${q._unitName} | SVG元素=${elCount} 文本=${textEls} | ${(q.question||'').slice(0,40).replace(/\n/g,' ')}`);
  });

  // 应用题质量抽查（前3题）
  const appQs = paper.questions.filter(q => q.sectionTitle && q.sectionTitle.includes('应用'));
  console.log(`应用题样本:`);
  appQs.slice(0, 3).forEach(q => {
    console.log(`  [题${q.num}] ${(q.question||'').slice(0,60).replace(/\n/g,' ')} → 答:${q.answer}`);
    console.log(`         步骤: ${(q.steps||[]).join(' | ').slice(0,100)}`);
  });

  // 计算题步骤质量抽查（检查 generateSteps 是否驴唇不对马嘴）
  const calcQs = paper.questions.filter(q => q.sectionTitle && q.sectionTitle.includes('计算'));
  console.log(`计算题全部:`);
  calcQs.forEach(q => {
    console.log(`  [题${q.num}] ${(q.question||'').slice(0,50)} → 答:${q.answer}`);
    console.log(`         步骤: ${(q.steps||[]).join(' | ').slice(0,110)}`);
  });
}

function PAPER_STRUCTURE_CHECK(paper) {
  // 检查分数总和
  let totalScore = 0;
  paper.questions.forEach(q => totalScore += (q.score || 0));
  if (totalScore !== 100) console.log(`⚠️ 总分异常: ${totalScore} (应为100)`);
  // 检查题号连续
  paper.questions.forEach((q, i) => {
    if (q.num !== i + 1) console.log(`⚠️ 题号不连续: 第${i}位置题号为${q.num}`);
  });
  // 检查空题干/空答案
  paper.questions.forEach(q => {
    if (!q.question) console.log(`⚠️ 题${q.num} 题干为空`);
    if (q.answer === undefined || q.answer === null || q.answer === '') console.log(`⚠️ 题${q.num} 答案为空`);
  });
}
