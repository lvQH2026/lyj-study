// verify_v51.js — v51「错题公式卡联动 + 难度分级 6:3:1 + A4 打印导出」验证
// 1) 难度工具：diffMixFor 数值 / tagRelativeDifficulty 60-30-10 比例 / questionDifficulty q.diff 优先
// 2) 单元练习 6:3:1：抽查单元 20 题精确 12/6/2 + 答题页难度徽标渲染
// 3) 考试卷：30 题 / 分区 10/10/5/5 / 难度 18/10/2 / 副标题含难度分布
// 4) paper 单元（专项·植树）：30 题且每题带 diff 标签
// 5) 错题公式卡联动：错题库渲染公式卡 + 练同类题按钮 + practiceSimilarWrong 正常开练
// 6) 答错反馈内嵌公式卡（做错 → 回看公式）
// 7) A4 打印导出：printCurrentPaper 生成 #printRoot（题面/选项/答题线/参考答案页）
// 8) 静态守卫：CSS 打印规则 + index.html 打印按钮
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));

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

let fail = 0;
const bad = m => { fail++; console.log('  ✗ ' + m); };
const ok = m => console.log('  ✓ ' + m);

const diffCount = qs => {
  const c = { 1: 0, 2: 0, 3: 0 };
  qs.forEach(q => c[w.eval(`questionDifficulty(${JSON.stringify(q)})`)]++);
  return c;
};

// ============ 1. 难度工具 ============
console.log('=== 1. 难度分级工具 ===');
{
  let e = 0;
  // diffMixFor：6:3:1 配比
  const cases = [[10, [6, 3, 1]], [20, [12, 6, 2]], [30, [18, 9, 3]], [5, [3, 2, 0]]];
  cases.forEach(([n, want]) => {
    const got = w.eval(`diffMixFor(${n})`);
    if (JSON.stringify(got) !== JSON.stringify(want)) { bad(`diffMixFor(${n})=${got} 应为 ${want}`); e++; }
  });
  // tagRelativeDifficulty：100 题按 60/30/10 打标
  const tagged = w.eval(`(function(){
    let arr = [];
    for (let i = 0; i < 100; i++) arr.push({ question: 'x'.repeat(1 + (i % 30)) + ' ' + i, type: 'fill' });
    tagRelativeDifficulty(arr);
    return arr.map(q => q.diff);
  })()`);
  const c = { 1: 0, 2: 0, 3: 0 };
  tagged.forEach(d => c[d]++);
  if (c[1] !== 60 || c[2] !== 30 || c[3] !== 10) { bad(`打标比例 ${c[1]}/${c[2]}/${c[3]} 应为 60/30/10`); e++; }
  // 打标有序性：diff 越大题干应总体越长（前 60% 与后 10% 的平均长度比较）
  const lens = w.eval(`(function(){
    let arr = [];
    for (let i = 0; i < 100; i++) arr.push({ question: 'x'.repeat(1 + i % 30), type: 'fill' });
    tagRelativeDifficulty(arr);
    return arr.map(q => ({ d: q.diff, l: q.question.length }));
  })()`);
  const avg = d => { const a = lens.filter(x => x.d === d); return a.reduce((s, x) => s + x.l, 0) / a.length; };
  if (!(avg(1) <= avg(2) + 0.01 && avg(2) <= avg(3) + 0.01)) { bad(`难度分与题长非单调: ${avg(1).toFixed(1)}/${avg(2).toFixed(1)}/${avg(3).toFixed(1)}`); e++; }
  // questionDifficulty：q.diff 优先
  const lv = w.eval(`questionDifficulty({ question: '1+1=？', diff: 3 })`);
  if (lv !== 3) { bad('q.diff 未优先'); e++; }
  if (e === 0) ok('diffMixFor 6:3:1 / tagRelativeDifficulty 60-30-10 / q.diff 优先 全部正确');
}

// ============ 2. 单元练习 6:3:1 ============
console.log('=== 2. 单元练习难度分级 ===');
{
  const targets = [
    { grade: 6, sem: 1, name: '圆' },
    { grade: 5, sem: 1, name: '多边形的面积' },
    { grade: 5, sem: 2, name: '数学广角——找次品' },
    { grade: 6, sem: 2, name: '圆柱与圆锥' },
  ];
  let e = 0;
  targets.forEach(t => {
    const idx = w.eval(`KNOWLEDGE_BASE[${t.grade}][${t.sem}].findIndex(u => u.name === '${t.name}')`);
    if (idx < 0) { bad(`找不到单元 ${t.name}`); e++; return; }
    w.eval(`examState.type=null; beginUnitQuiz(${idx}, ${t.grade}, ${t.sem});`);
    const qs = w.eval('state.quizQuestions');
    if (qs.length !== 20) { bad(`${t.name} 题数=${qs.length} 应为 20`); e++; }
    const c = diffCount(qs);
    if (c[1] !== 12 || c[2] !== 6 || c[3] !== 2) { bad(`${t.name} 难度分布 基${c[1]}/提${c[2]}/拓${c[3]} 应为 12/6/2`); e++; }
    // 由易到难排序（基础在前拓展在后）
    let last = 0, ordered = true;
    qs.forEach(q => { const d = w.eval(`questionDifficulty(${JSON.stringify(q)})`); if (d < last) ordered = false; last = d; });
    if (!ordered) { bad(`${t.name} 未按由易到难排序`); e++; }
    // 答题页徽标
    const cardHtml = w.document.getElementById('questionCard').innerHTML;
    if (!/diff-badge diff-[123]/.test(cardHtml)) { bad(`${t.name} 答题页缺少难度徽标`); e++; }
  });
  if (e === 0) ok('4 个抽查单元 20 题精确 12/6/2、由易到难、徽标渲染正确');
}

// ============ 3. 考试卷难度分级 ============
console.log('=== 3. 考试卷难度分级 ===');
{
  let e = 0;
  const targets = [
    { type: 'final', grade: 5, sem: 1 },
    { type: 'final', grade: 6, sem: 2 },
    { type: 'mid', grade: 5, sem: 2 },
  ];
  targets.forEach(t => {
    w.eval(`examState.type='${t.type}'; examState.grade=${t.grade}; examState.semester=${t.sem};`);
    const paper = w.eval('generateExamPaper()');
    if (!paper) { bad(`${t.grade}/${t.sem} ${t.type} 组卷失败`); e++; return; }
    if (paper.questions.length !== 30) { bad(`题数=${paper.questions.length}`); e++; }
    const c = diffCount(paper.questions);
    if (c[1] !== 18 || c[2] !== 10 || c[3] !== 2) { bad(`${t.type} 难度 基${c[1]}/提${c[2]}/拓${c[3]} 应为 18/10/2`); e++; }
    if (!/基础18／提高10／拓展2/.test(paper.sub)) { bad(`sub 缺难度分布: ${paper.sub}`); e++; }
    const secs = {};
    paper.questions.forEach(q => { secs[q.sectionTitle] = (secs[q.sectionTitle] || 0) + 1; });
    const counts = Object.values(secs);
    if (counts.join(',') !== '10,10,5,5') { bad(`分区=${counts.join(',')} 应为 10,10,5,5`); e++; }
  });
  if (e === 0) ok('3 张考试卷 30 题、分区 10/10/5/5、难度精确 18/10/2、副标题含分布');
}

// ============ 4. paper 单元打标 ============
console.log('=== 4. paper 单元（专项·植树）===');
{
  const idx = w.eval(`KNOWLEDGE_BASE[5][1].findIndex(u => u.name === '专项·植树问题')`);
  let e = 0;
  if (idx < 0) { bad('找不到 专项·植树问题'); e++; }
  else {
    w.eval(`examState.type=null; beginUnitQuiz(${idx}, 5, 1);`);
    const qs = w.eval('state.quizQuestions');
    if (qs.length !== 30) { bad(`paper 单元题数=${qs.length} 应为 30`); e++; }
    if (qs.some(q => ![1, 2, 3].includes(q.diff))) { bad('paper 单元存在未打标题目'); e++; }
    const c = diffCount(qs);
    if (c[1] < 15 || c[3] < 1) { bad(`paper 单元分布退化 基${c[1]}/提${c[2]}/拓${c[3]}`); e++; }
  }
  if (e === 0) ok('paper 单元 30 题全部带难度标签且分布合理');
}

// ============ 5. 错题公式卡联动 ============
console.log('=== 5. 错题公式卡联动 ===');
{
  let e = 0;
  w.eval(`localStorage.clear()`);
  // 正例：六上「圆」单元的错题
  const qObj = { question: '一个圆的半径是3厘米，它的面积是多少？', answer: '28.26平方厘米', type: 'fill', options: [] };
  w.eval(`addToWrongBank(${JSON.stringify(qObj)}, '18.84平方厘米', '圆', 6)`);
  // 反例：快速练习的错题（无对应单元）
  const qObj2 = { question: '3+5=？', answer: '8', type: 'fill', options: [] };
  w.eval(`addToWrongBank(${JSON.stringify(qObj2)}, '7', '基础运算', 6)`);
  w.eval(`renderWrongBank()`);
  const htmlOut = w.document.getElementById('wrongListContainer').innerHTML;
  if (!/wrong-fidx/.test(htmlOut)) { bad('错题库缺少公式卡 details'); e++; }
  if (!/练同类题/.test(htmlOut)) { bad('错题库缺少「练同类题」按钮'); e++; }
  if (!/万能公式/.test(htmlOut)) { bad('公式卡缺少「万能公式」标题'); e++; }
  if (!/C = πd = 2πr|S = πr²/.test(htmlOut)) { bad('公式卡未渲染圆单元公式'); e++; }
  // 反例不应有公式卡
  const items = w.document.querySelectorAll('.wrong-item');
  if (items.length !== 2) { bad(`错题条目数=${items.length} 应为 2`); e++; }
  else {
    const second = items[1].innerHTML;
    if (/wrong-fidx/.test(second)) { bad('无单元错题不应有公式卡'); e++; }
    if (/练同类题/.test(second)) { bad('无单元错题不应有练同类题按钮'); e++; }
  }
  // practiceSimilarWrong：定位单元并开始 20 题 6:3:1 练习
  const wid = w.eval(`getWrongBank()[0].id`);
  w.eval(`practiceSimilarWrong('${wid}')`);
  if (w.eval(`state.quizMode`) !== 'unit') { bad('practiceSimilarWrong 未进入 unit 模式'); e++; }
  if (w.eval(`state.quizTitle`) !== '圆') { bad(`quizTitle=${w.eval('state.quizTitle')} 应为 圆`); e++; }
  const n = w.eval('state.quizQuestions.length');
  if (n !== 20) { bad(`同类练习题数=${n} 应为 20`); e++; }
  if (e === 0) ok('错题库公式卡 + 练同类题按钮 + practiceSimilarWrong 20 题闭环正确');
}

// ============ 6. 答错反馈内嵌公式卡 ============
console.log('=== 6. 答错反馈公式卡 ===');
{
  let e = 0;
  const idx = w.eval(`KNOWLEDGE_BASE[6][1].findIndex(u => u.name === '圆')`);
  w.eval(`examState.type=null; beginUnitQuiz(${idx}, 6, 1);`);
  w.eval(`renderQuestion()`);
  const q = w.eval('state.quizQuestions[0]');
  // 故意答错
  if ((q.type === 'choice' || q.type === 'shape_choice') && !q.forceFill) {
    let wrongIdx = 0;
    q.options.forEach((o, i) => { if ((typeof o === 'object' ? o.value : o) !== q.answer) wrongIdx = i; });
    w.eval(`selectOption(${wrongIdx}); submitAnswer();`);
  } else {
    w.eval(`document.getElementById('answerInput').value='zzz'; submitAnswer();`);
  }
  const fb = w.document.getElementById('feedback').innerHTML;
  if (!/万能公式/.test(fb)) { bad('答错反馈缺少公式卡'); e++; }
  if (!/fb-fidx/.test(fb)) { bad('答错反馈缺少 fb-fidx 容器'); e++; }
  if (e === 0) ok('答错后反馈内嵌该单元万能公式卡');
}

// ============ 7. A4 打印导出 ============
console.log('=== 7. A4 打印导出 ===');
{
  let e = 0;
  let printed = false;
  w.print = () => { printed = true; };
  // 考试卷打印
  w.eval(`examState.type='final'; examState.grade=6; examState.semester=1;`);
  const paper = w.eval('generateExamPaper()');
  w.eval(`state.quizMode='exam'; state.quizTitle=${JSON.stringify(paper.title)}; state.examPaper=${JSON.stringify({ title: paper.title, sub: paper.sub })}; state.quizQuestions=${JSON.stringify(paper.questions)};`);
  w.eval(`printCurrentPaper()`);
  if (!printed) { bad('printCurrentPaper 未调起 window.print'); e++; }
  const root = w.document.getElementById('printRoot');
  if (!root) { bad('缺少 #printRoot'); e++; }
  else {
    const h = root.innerHTML;
    const qCount = (h.match(/class="prt-q"/g) || []).length;
    if (qCount !== 30) { bad(`打印题数=${qCount} 应为 30`); e++; }
    if (!/参考答案/.test(h)) { bad('缺少参考答案页'); e++; }
    if (!/姓名/.test(h) || !/班级/.test(h)) { bad('缺少姓名/班级填写栏'); e++; }
    if (!/难度：基础\d+／提高\d+／拓展\d+/.test(h)) { bad('缺少难度分布行'); e++; }
    if (!/prt-sec/.test(h)) { bad('缺少分区标题'); e++; }
    if (!/prt-blank|prt-opts/.test(h)) { bad('缺少答题线/选项区'); e++; }
    const ansCount = (h.match(/class="prt-ans-item"/g) || []).length;
    if (ansCount !== 30) { bad(`答案条目=${ansCount} 应为 30`); e++; }
    // SVG 配图题应进入打印视图
    if (!/<svg/.test(h)) { bad('配图未进入打印视图'); e++; }
  }
  // 单元练习打印（非考试模式）
  printed = false;
  w.eval(`state.quizMode='unit'; state.quizTitle='圆'; state.examPaper=null;`);
  w.eval(`printCurrentPaper()`);
  if (!printed) { bad('单元练习打印未触发'); e++; }
  else {
    const h2 = w.document.getElementById('printRoot').innerHTML;
    if (!/圆 练习卷/.test(h2)) { bad('单元打印标题不对: ' + (h2.match(/prt-title">[^<]*/) || [''])[0]); e++; }
  }
  if (e === 0) ok('考试卷/单元练习 A4 打印视图生成正确（30 题+答案页+填答栏+配图）');
}

// ============ 8. 静态守卫 ============
console.log('=== 8. 静态资源守卫 ===');
{
  let e = 0;
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  if (!/\.diff-badge/.test(css)) { bad('style.css 缺少 .diff-badge'); e++; }
  if (!/\.fb-fidx/.test(css) || !/\.wrong-fidx-card/.test(css)) { bad('style.css 缺少公式卡样式'); e++; }
  if (!/@media print/.test(css) || !/#printRoot/.test(css) || !/@page/.test(css)) { bad('style.css 缺少打印样式'); e++; }
  const ih = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const btnCount = (ih.match(/printCurrentPaper\(\)/g) || []).length;
  if (btnCount < 2) { bad(`index.html 打印按钮数=${btnCount} 应 ≥2`); e++; }
  if (e === 0) ok('CSS 打印规则与打印按钮齐备');
}

console.log('');
if (fail === 0 && errs.filter(x => !/tailwind/.test(x)).length === 0) {
  console.log('ALL PASS ✅  v51 错题公式卡联动 + 难度分级 6:3:1 + A4 打印导出验证全部通过');
} else {
  console.log(`FAIL ❌  ${fail} 处断言失败`);
  process.exit(1);
}
