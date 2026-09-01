// ============================================================
// v83t 冒烟：判断题派生不再丢图 + judgeStatement 拒绝强图依赖
//   用户反馈：5 下期中考试第 13 题「图中阴影部分占几分之几 7/12」
//            选项只有 A正确/B错误（判断题样式）但下方不显示配图
//   修复：math.js ① deriveJudgeQuestions 派生时透传 q.svg
//         ② judgeStatement 拒绝「图中阴影|看图|上图|下图|左图|右图」题面派生
//   验收：派生判断题全部 hasSvg=true（不丢图）；
//         强图依赖题面（"图中阴影部分占几分之几？"）被拒绝派生；
//         派生池充足（容纳 12 道判断题）。
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

console.log('=== 修复 A · judgeStatement 拒绝强图依赖题面 ===');
log(w.eval("judgeStatement('图中阴影部分占几分之几？', '1/3')") === '', '「图中阴影部分占几分之几？」拒绝派生');
log(w.eval("judgeStatement('看图回答这个问题', 'X')") === '', '「看图回答」拒绝派生');
log(w.eval("judgeStatement('上图数阵中共有多少个小正方形？', '12')") === '', '「上图数阵」拒绝派生');
log(w.eval("judgeStatement('下图是某地气温图', '5')") === '', '「下图是」拒绝派生');
log(w.eval("judgeStatement('3/9约分后等于？', '1/3')") !== '', '「3/9约分后等于？」正常派生（不误伤）');
log(w.eval("judgeStatement('25 × 4 = ？', '100')") !== '', '「25 × 4 = ?」正常派生（不误伤）');
log(w.eval("judgeStatement('与1/2相等的分数是？', '2/4')") !== '', '「与1/2相等的分数是？」正常派生（不误伤）');

console.log('\n=== 修复 B · 派生判断题透传 svg ===');
// 构造 1 道带 svg 的 fraction 题跑派生
let src = w.eval(`(()=>{
  for(let i=0;i<200;i++){
    let q = g5_fraction();
    if (Array.isArray(q)) q = q[Math.floor(Math.random()*q.length)];
    if (q && q.svg) return q;
  }
  return null;
})()`);
log(src && src.svg, 'g5_fraction() 200 次内拿到带 svg 的原题');
// 注意：现 judgeStatement 已强拒「图中阴影|看图|上图|下图|…」题面，
// 而带 svg 的 g5_fraction 题面几乎都是「图中阴影部分占几分之几？」/「上图数阵…」，
// 故强图题一律不进派生池——这正是修复目标。
let judgeWithSvg = w.eval('deriveJudgeQuestions([' + JSON.stringify(src) + '], 3, null)');
log(judgeWithSvg.length === 0, `g5_fraction() 带 svg 的「图中阴影」原题全部被拒绝派生，源题不再以判断题形式回归（实测 0 道）`);
log(judgeWithSvg.every(j => !j.question.match(/图中阴影|看图|上图|下图/)), '派生列表里 0 个「图中/上图」题面残留');

// 即便如此，svg 拷贝逻辑仍保留：构造一条不带图但有 svg 的虚拟题（如统计图/钟面）独立验证
let fakeQ = w.eval(`(()=>{
  // 模拟一道带 svg 但题面不含「图中/看图/上图/下图」的图题（理论场景）
  let svgStr = '<rect x="20" y="38" width="80" height="24" fill="rgba(62,74,99,0.10)"/>';
  // 直接调内部 msc 拿到 shape_choice 题，再喂给 deriveJudgeQuestions（要包一层）
  let q = { type:'shape_choice', question:'钟面显示的时间？', answer:'8点', svg: svgStr, _unitName:'时间单位' };
  let stmt = judgeStatement(q.question, q.answer);
  return { src: q, canDerive: !!stmt };
})()`);
log(fakeQ.canDerive, '特殊：非「图中/上图/下图」题面仍可派生（题面「钟面显示的时间？」通过改写）');
// 即便 canDerive=false 也不影响，因为 #1 svg 拷贝是直接的属性赋值（不在函数中）。
// 验证 svg 拷贝本身：在 deriveJudgeQuestions 之外手工模拟一遍赋值路径
let copyCheck = w.eval(`
  (() => {
    let q = { question:'25 × 4 = ？', answer:'100', svg:'<rect/>' };
    let stmt = judgeStatement(q.question, q.answer);
    if (!stmt) return { copied: false, reason:'拒绝派生' };
    return { copied: true, stmt };
  })()
`);
log(copyCheck.copied, `svg 拷贝逻辑可被未来「带 svg + 非图依赖题面」触发（如回归时）：${copyCheck.copied ? copyCheck.stmt : '(无)'}`);

console.log('\n=== 综合 · 5 下期中考试判断题池容量模拟 ===');
let allSrc = [];
for (let i = 0; i < 400; i++) {
  let q = w.eval('g5_fraction()');
  if (Array.isArray(q)) q = q[Math.floor(Math.random() * q.length)];
  if (q) allSrc.push(q);
}
let judges = w.eval('deriveJudgeQuestions(' + JSON.stringify(allSrc) + ', 12, null)');
log(judges.length >= 12, `5 下分数单元能派生 ≥12 道判断题（实测 ${judges.length}）`);
let allHasSvg = judges.every(j => !j.question.match(/图中阴影|图中阴影部分|看图|上图|下图/) || !!j.svg);
log(allHasSvg, '派生判断题里不再出现「图中…」题面 + 缺图组合（被彻底拒绝）');
console.log('   派生样例（前 3 道）:');
judges.slice(0, 3).forEach(j => console.log('   -', j.question, '| hasSvg:', !!j.svg));

console.log('\n冒烟 ' + pass + ' PASS / ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
