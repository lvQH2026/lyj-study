// verify_v50.js — v50「五年级课本同步三层结构」验证
// 1) KNOWLEDGE_BASE[5] 结构：15 课本单元（五上7 + 五下8，group/term/unit/summary≥4/fidx≥1/method≥1）+ 专项区
// 2) 新生成器 500 次采样：g5_coord（数对/平移正确性+识图不泄题）/ g5_cuboid（体积/表面积/棱长总和）/ g5_defective（次数规律）
// 3) 扩容生成器采样：g5_equation（解方程）/ g5_tree（四种植树情形）
// 4) 新制图函数：figGrid / figCuboid / figBalance SVG 无 NaN、figGrid 不印答案
// 5) renderUnits 三分区 + showUnitDiagrams 三层学习卡渲染（jsdom）
// 6) 考试组卷：期中/期末只取课本单元；单元考试可选专项；1-4 年级与六年级回归
// 7) 全卷回归：五上/五下期末 30 题 100 分、配图≥5、无重复
// 8) 单元考试抽查（新单元 + 专项 + paper 专项）
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

// ============ 1. KNOWLEDGE_BASE[5] 结构 ============
console.log('=== 1. 五年级课本同步结构 ===');
{
  const KB = w.eval('KNOWLEDGE_BASE');
  const up = KB[5][1], down = KB[5][2];
  const tbUp = up.filter(u => u.group === '课本'), tbDown = down.filter(u => u.group === '课本');
  let e = 0;
  if (tbUp.length !== 7) { bad(`五上课本单元数=${tbUp.length}，应为 7`); e++; }
  if (tbDown.length !== 8) { bad(`五下课木单元数=${tbDown.length}，应为 8`); e++; }
  [...tbUp, ...tbDown].forEach(u => {
    if (!u.term || !u.unit) { bad(`${u.name} 缺 term/unit`); e++; }
    if (!u.summary || u.summary.length < 4) { bad(`${u.name} summary<4 条`); e++; }
    if (!u.fidx || !u.fidx.length) { bad(`${u.name} 缺 fidx 公式卡`); e++; }
    u.fidx.forEach(f => { if (!f.t || !f.f) { bad(`${u.name} fidx 条目缺 t/f`); e++; } });
    if (!u.method || !u.method.length) { bad(`${u.name} 缺 method 方法卡`); e++; }
    u.method.forEach(m => { if (!m.t || !m.s) { bad(`${u.name} method 条目缺 t/s`); e++; } });
    if (typeof u.gen !== 'function') { bad(`${u.name} 缺 gen`); e++; }
  });
  const nums = tbUp.map(u => u.unit).join(',');
  if (nums !== '1,2,3,4,5,6,7') { bad('五上单元号不连续: ' + nums); e++; }
  const nums2 = tbDown.map(u => u.unit).join(',');
  if (nums2 !== '1,2,3,4,5,6,7,8') { bad('五下单元号不连续: ' + nums2); e++; }
  const spUp = up.filter(u => u.group === '专项'), spDown = down.filter(u => u.group === '专项');
  if (spUp.length < 2) { bad('五上专项区过少'); e++; }
  if (spDown.length < 2) { bad('五下专项区过少'); e++; }
  const tbNames = [...tbUp, ...tbDown].map(u => u.name);
  ['位置（数对）', '数学广角——植树问题', '长方体和正方体', '数学广角——找次品'].forEach(n => {
    if (!tbNames.includes(n)) { bad(`缺新单元 ${n}`); e++; }
  });
  if (e === 0) ok(`五上 ${tbUp.length} 课本 + ${spUp.length} 专项，五下 ${tbDown.length} 课本 + ${spDown.length} 专项，三字段齐全、4 个新单元到位`);
}

// ============ 2. 新生成器 500 次 ============
console.log('=== 2. 新生成器 500 次采样 ===');
{
  // g5_coord
  let e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g5_coord()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    // 反泄题：识图题 SVG 不得印出答案数对
    if (/上图方格纸中，点A的位置/.test(q.question)) {
      if (String(q.svg || '').includes(String(q.answer))) { if (e < 3) bad('方格纸图泄露答案: ' + q.answer); e++; continue; }
      if (!/^\(\d+,\d+\)$/.test(String(q.answer))) { if (e < 3) bad('数对格式错: ' + q.answer); e++; }
    }
    let m = q.question.match(/^点A的位置是\((\d+),(\d+)\)，向右平移2格后的位置是？$/);
    if (m) {
      const right = `(${+m[1] + 2},${m[2]})`;
      if (q.answer !== right) { if (e < 3) bad(`右移错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
    m = q.question.match(/^点A的位置是\((\d+),(\d+)\)，向上平移1格后的位置是？$/);
    if (m) {
      const right = `(${m[1]},${+m[2] + 1})`;
      if (q.answer !== right) { if (e < 3) bad(`上移错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
  }
  if (e === 0) ok('g5_coord 500 次全部结构合法、数对/平移正确、识图不泄题');
  else bad(`g5_coord 错误 ${e} 次`);

  // g5_cuboid
  e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g5_cuboid()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    let m = q.question.match(/^一个长方体长(\d+)厘米、宽(\d+)厘米、高(\d+)厘米，体积是多少立方厘米？$/);
    if (m) { const a = +m[1], b = +m[2], h = +m[3];
      if (q.answer !== String(a * b * h)) { if (e < 3) bad(`体积错: ${q.question} 答=${q.answer}`); e++; } }
    m = q.question.match(/^一个长方体长(\d+)厘米、宽(\d+)厘米、高(\d+)厘米，表面积是多少平方厘米？$/);
    if (m) { const a = +m[1], b = +m[2], h = +m[3];
      if (q.answer !== String(2 * (a * b + a * h + b * h))) { if (e < 3) bad(`表面积错: ${q.question} 答=${q.answer}`); e++; } }
    m = q.question.match(/^一个长方体长(\d+)厘米、宽(\d+)厘米、高(\d+)厘米，棱长总和是多少厘米？$/);
    if (m) { const a = +m[1], b = +m[2], h = +m[3];
      if (q.answer !== String(4 * (a + b + h))) { if (e < 3) bad(`棱长总和错: ${q.question} 答=${q.answer}`); e++; } }
    m = q.question.match(/^一个正方体棱长(\d+)厘米，体积是多少立方厘米？$/);
    if (m) { if (q.answer !== String(Math.pow(+m[1], 3))) { if (e < 3) bad(`正方体体积错: ${q.question} 答=${q.answer}`); e++; } }
    m = q.question.match(/^一个正方体棱长(\d+)厘米，表面积是多少平方厘米？$/);
    if (m) { if (q.answer !== String(6 * Math.pow(+m[1], 2))) { if (e < 3) bad(`正方体表面积错: ${q.question} 答=${q.answer}`); e++; } }
  }
  if (e === 0) ok('g5_cuboid 500 次全部正确（体积/表面积/棱长总和/正方体）');
  else bad(`g5_cuboid 错误 ${e} 次`);

  // g5_defective
  e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g5_defective()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    const m = q.question.match(/^(\d+)个零件里有1个是次品（次品轻一些），用天平至少称几次就一定能找出次品？$/);
    if (m) {
      const n = +m[1];
      const right = n <= 3 ? '1次' : n <= 9 ? '2次' : n <= 27 ? '3次' : '4次';
      if (q.answer !== right) { if (e < 3) bad(`次数错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
    // 平均分 3 份题：nM 必为 3 的倍数
    const m2 = q.question.match(/^(\d+)个零件找次品时尽量平均分成3份，每份多少个？$/);
    if (m2) {
      const n = +m2[1];
      if (n % 3 !== 0 || q.answer !== String(n / 3) + '个') { if (e < 3) bad(`分份错: ${q.question} 答=${q.answer}`); e++; }
    }
    // 称 t 次最多 3^t
    const m3 = q.question.match(/^用天平称(\d+)次，最多能从多少个物品中保证找出1个次品？$/);
    if (m3) {
      if (q.answer !== String(Math.pow(3, +m3[1])) + '个') { if (e < 3) bad(`3^t 错: ${q.question} 答=${q.answer}`); e++; }
    }
    if (/^27个零件找1个次品（次品轻），最少称几次？$/.test(q.question) && q.answer !== '3次') {
      if (e < 3) bad('27个找次品应为3次'); e++;
    }
  }
  if (e === 0) ok('g5_defective 500 次全部符合三分法规律（2~3个1次/4~9个2次/10~27个3次/28~60个4次）');
  else bad(`g5_defective 错误 ${e} 次`);
}

// ============ 3. 扩容生成器采样 ============
console.log('=== 3. 扩容生成器采样 ===');
{
  // g5_equation
  let e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g5_equation()');
    if (!q || !q.question || q.answer === undefined) { if (e < 3) bad('结构非法'); e++; continue; }
    if (q.options && !q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    let m = q.question.match(/^解方程：(\d+)x\+(\d+)=(\d+)，x=？$/);
    if (m) { if (q.answer !== String((+m[3] - +m[2]) / +m[1])) { if (e < 3) bad(`解方程错(+): ${q.question} 答=${q.answer}`); e++; } }
    m = q.question.match(/^解方程：(\d+)x−(\d+)=(\d+)，x=？$/);
    if (m) { if (q.answer !== String((+m[3] + +m[2]) / +m[1])) { if (e < 3) bad(`解方程错(−): ${q.question} 答=${q.answer}`); e++; } }
    m = q.question.match(/^解方程：x÷(\d+)=(\d+)，x=？$/);
    if (m) { if (q.answer !== String(+m[1] * +m[2])) { if (e < 3) bad(`解方程错(÷): ${q.question} 答=${q.answer}`); e++; } }
  }
  if (e === 0) ok('g5_equation 500 次解方程全部正确');
  else bad(`g5_equation 错误 ${e} 次`);

  // g5_tree
  e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g5_tree()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    let m = q.question.match(/^一条路长(\d+)米，每隔(\d+)米种一棵（两端都种），共几棵？$/);
    if (m) { if (q.answer !== String(+m[1] / +m[2] + 1)) { if (e < 3) bad(`两端都种错: ${q.question}`); e++; } }
    m = q.question.match(/^一条走廊长(\d+)米，每隔(\d+)米放一盆花（只在一端放），共放几盆？$/);
    if (m) { if (q.answer !== String(+m[1] / +m[2])) { if (e < 3) bad(`只种一端错: ${q.question}`); e++; } }
    m = q.question.match(/^一条小路长(\d+)米，每隔(\d+)米种一棵（两端都不种），共种几棵？$/);
    if (m) { if (q.answer !== String(+m[1] / +m[2] - 1)) { if (e < 3) bad(`两端不种错: ${q.question}`); e++; } }
    m = q.question.match(/^圆形花坛周长(\d+)米，每隔(\d+)米种一棵，共种几棵？$/);
    if (m) { if (q.answer !== String(+m[1] / +m[2])) { if (e < 3) bad(`封闭图形错: ${q.question}`); e++; } }
  }
  if (e === 0) ok('g5_tree 500 次四种植树情形全部正确（整除红线无事故）');
  else bad(`g5_tree 错误 ${e} 次`);

  // g5_mul / g5_div / g5_fraction_calc：结构合法性
  e = 0;
  for (const fn of ['g5_mul', 'g5_div', 'g5_fraction_calc']) {
    for (let i = 0; i < 300; i++) {
      const q = w.eval(`${fn}()`);
      if (!q || !q.question || q.answer === undefined) { if (e < 3) bad(`${fn} 结构非法`); e++; continue; }
      if (q.options && !q.options.includes(q.answer)) { if (e < 3) bad(`${fn} 答案不在选项中: ${q.question}`); e++; }
    }
  }
  if (e === 0) ok('g5_mul / g5_div / g5_fraction_calc 各 300 次结构合法');
  else bad(`扩容生成器错误 ${e} 次`);
}

// ============ 4. 新制图函数 SVG 合法性 ============
console.log('=== 4. figGrid / figCuboid / figBalance SVG ===');
{
  let e = 0;
  for (let i = 0; i < 100; i++) {
    const cols = 5, rows = 5, px = 2 + Math.floor(Math.random() * 4), py = 1 + Math.floor(Math.random() * 5);
    const a = w.eval(`figGrid(${cols}, ${rows}, ${px}, ${py})`);
    if (/NaN|undefined/.test(a)) { bad('figGrid 含 NaN/undefined'); e++; break; }
    // 反泄题：图中不得印出数对答案
    if (a.includes(`(${px},${py})`)) { bad(`figGrid 泄露答案 (${px},${py})`); e++; break; }
  }
  for (let i = 0; i < 100; i++) {
    const a = w.eval('figCuboid()');
    if (/NaN|undefined/.test(a)) { bad('figCuboid 含 NaN/undefined'); e++; break; }
  }
  for (let i = 0; i < 100; i++) {
    const a = w.eval('figBalance()');
    if (/NaN|undefined/.test(a)) { bad('figBalance 含 NaN/undefined'); e++; break; }
  }
  if (e === 0) ok('figGrid / figCuboid / figBalance 100 次 SVG 无 NaN、方格纸不印答案');
}

// ============ 5. UI：三分区 + 三层学习卡（jsdom 渲染） ============
console.log('=== 5. UI 渲染 ===');
{
  let e = 0;
  w.eval('selectGrade(5)');
  const listHtml = w.document.getElementById('unitList').innerHTML;
  if (!listHtml.includes('课本同步（上册）')) { bad('五上单元列表缺「课本同步」分区'); e++; }
  if (!listHtml.includes('专项练习')) { bad('五上单元列表缺「专项练习」分区'); e++; }
  if (!listHtml.includes('位置（数对）')) { bad('五上缺新单元「位置（数对）」'); e++; }
  if (!listHtml.includes('数学广角——植树问题')) { bad('五上缺「数学广角——植树问题」'); e++; }
  if (!listHtml.includes('专项·鸡兔同笼')) { bad('五上缺专项·鸡兔同笼'); e++; }
  if (e === 0) ok('五上单元列表三分区渲染正确');
  e = 0;
  w.eval('switchSemester(2)');
  const listHtml2 = w.document.getElementById('unitList').innerHTML;
  if (!listHtml2.includes('课本同步（下册）')) { bad('五下单元列表缺「课本同步」分区'); e++; }
  if (!listHtml2.includes('长方体和正方体')) { bad('五下缺新单元「长方体和正方体」'); e++; }
  if (!listHtml2.includes('数学广角——找次品')) { bad('五下缺新单元「数学广角——找次品」'); e++; }
  if (!listHtml2.includes('专项·立体图形')) { bad('五下缺专项·立体图形'); e++; }
  if (e === 0) ok('五下单元列表三分区渲染正确');

  // 三层学习卡：进入「长方体和正方体」单元的同步学习页
  e = 0;
  w.eval('switchSemester(1)');
  const KB = w.eval('KNOWLEDGE_BASE');
  const idx = KB[5][1].findIndex(u => u.name === '多边形的面积');
  w.eval(`showUnitDiagrams(KNOWLEDGE_BASE[5][1][${idx}], 5, 1, ${idx})`);
  const study = w.document.getElementById('studyCards').innerHTML;
  if (!study.includes('知识点总结')) { bad('学习页缺知识点总结卡'); e++; }
  if (!study.includes('万能公式')) { bad('学习页缺万能公式卡'); e++; }
  if (!study.includes('S = ah ÷ 2')) { bad('学习页多边形面积单元缺三角形公式'); e++; }
  if (!study.includes('万能答题方法')) { bad('学习页缺万能方法卡'); e++; }
  if (!study.includes('别忘÷2')) { bad('学习页缺易错警示'); e++; }
  if (w.document.getElementById('specialIntroBtn').textContent !== '开始练习') { bad('按钮文案未切换为「开始练习」'); e++; }
  if (e === 0) ok('多边形的面积单元同步学习页三层卡片渲染正确');

  // 无三字段单元（如一年级）回退旧文案
  e = 0;
  w.eval('showUnitDiagrams(KNOWLEDGE_BASE[1][1][0], 1, 1, 0)');
  if (w.document.getElementById('studyCards').innerHTML !== '') { bad('无三字段单元 studyCards 应为空'); e++; }
  if (w.document.getElementById('specialIntroBtn').textContent !== '开始答题') { bad('旧单元按钮文案应保持「开始答题」'); e++; }
  if (e === 0) ok('无三字段单元正常回退（studyCards 空、按钮「开始答题」）');
}

// ============ 6. 考试组卷范围 ============
console.log('=== 6. 考试组卷范围 ===');
{
  let e = 0;
  const KB = w.eval('KNOWLEDGE_BASE');
  // 五上期末：units 应全部为课本单元（7 个）
  w.eval(`examState.type='final'; examState.grade=5; examState.semester=1;`);
  let r = w.eval('getExamUnits()');
  if (r.units.some(u => u.group === '专项')) { bad('五上期末混入专项单元'); e++; }
  if (r.units.length !== 7) { bad(`五上期末单元数=${r.units.length}，应为 7`); e++; }
  // 五下期中：前一半课本单元（⌈8/2⌉=4）
  w.eval(`examState.type='mid'; examState.semester=2;`);
  r = w.eval('getExamUnits()');
  if (r.units.some(u => u.group === '专项')) { bad('五下期中混入专项单元'); e++; }
  if (r.units.length !== 4) { bad(`五下期中单元数=${r.units.length}，应为 4（⌈8/2⌉）`); e++; }
  // 单元考试：可选专项（索引基于原始数组）
  w.eval(`examState.type='unit'; examState.grade=5; examState.semester=1;`);
  const spIdx = KB[5][1].findIndex(u => u.group === '专项');
  w.eval(`examState.unitIdx=${spIdx}`);
  r = w.eval('getExamUnits()');
  if (r.units.length !== 1 || r.units[0].group !== '专项') { bad('单元考试无法选中专项单元'); e++; }
  if (r.rangeText.includes('第') && r.rangeText.includes('单元') && r.units[0].group === '专项') { bad('专项单元考试标题不应带单元号'); e++; }
  // 一年级与六年级回归：行为不变
  w.eval(`examState.type='final'; examState.grade=1; examState.semester=1;`);
  r = w.eval('getExamUnits()');
  if (r.units.length !== KB[1][1].length) { bad(`一年级期末单元数变了: ${r.units.length}`); e++; }
  w.eval(`examState.type='final'; examState.grade=6; examState.semester=1;`);
  r = w.eval('getExamUnits()');
  if (r.units.length !== 8 || r.units.some(u => u.group === '专项')) { bad(`六年级期末行为变了: ${r.units.length}`); e++; }
  if (e === 0) ok('五年级期末/期中只取课本单元、单元考试可选专项、1 年级与六年级行为不变');
}

// ============ 7. 五上/五下期末卷回归 ============
console.log('=== 7. 期末卷回归 ===');
{
  ['五上', '五下'].forEach((label, si) => {
    w.eval(`examState.type='final'; examState.grade=5; examState.semester=${si + 1}; examState.unitIdx=0;`);
    let e = 0;
    for (let k = 0; k < 5; k++) {
      const paper = w.eval('generateExamPaper()');
      const arr = paper && paper.questions;
      if (!arr || !arr.length) { bad(`${label}期末卷生成失败`); e++; break; }
      if (arr.length !== 30) { bad(`${label}期末题数=${arr.length}，应为 30`); e++; break; }
      const total = arr.reduce((s, q) => s + (q.score || 0), 0);
      if (Math.abs(total - 100) > 0.01) { bad(`${label}期末总分=${total}`); e++; }
      const seenQ = new Set(arr.map(q => q.question));
      if (seenQ.size !== arr.length) { bad(`${label}期末存在重复题`); e++; }
      const imgs = arr.filter(q => String(q.svg || '').includes('<')).length;
      if (imgs < 5) { bad(`${label}期末配图=${imgs} 张（<5）`); e++; }
      if (arr.some(q => !q.steps || !q.steps.length)) { bad(`${label}期末存在缺步骤题`); e++; }
    }
    if (e === 0) ok(`${label}期末 5 次采样：30 题 / 100 分 / 配图≥5 / 无重复 / 步骤齐全`);
  });
}

// ============ 8. 单元考试抽查（新单元 + 专项 + paper 专项） ============
console.log('=== 8. 单元考试抽查 ===');
{
  const KB = w.eval('KNOWLEDGE_BASE');
  const checks = [
    { sem: 1, name: '位置（数对）' },
    { sem: 1, name: '数学广角——植树问题' },
    { sem: 2, name: '长方体和正方体' },
    { sem: 2, name: '数学广角——找次品' },
    { sem: 1, name: '专项·鸡兔同笼' },
    { sem: 2, name: '专项·立体图形' },
  ];
  let e = 0;
  checks.forEach(c => {
    const idx = KB[5][c.sem].findIndex(u => u.name === c.name);
    if (idx < 0) { bad(`找不到单元 ${c.name}`); e++; return; }
    w.eval(`examState.type='unit'; examState.grade=5; examState.semester=${c.sem}; examState.unitIdx=${idx};`);
    for (let k = 0; k < 5; k++) {
      const paper = w.eval('generateExamPaper()');
      const arr = paper && paper.questions;
      if (!arr || !arr.length) { bad(`${c.name}: 未能生成单元卷`); e++; return; }
      if (arr.length !== 30) { bad(`${c.name} 单元卷第${k+1}次题数=${arr.length}，应为 30`); e++; return; }
      const distinct = new Set(arr.map(q => q.question)).size;
      if (distinct !== arr.length) { bad(`${c.name} 单元卷存在重复题 (${distinct}/${arr.length})`); e++; }
      if (arr.some(q => !q || !q.question || q.answer === undefined)) { bad(`${c.name} 单元卷存在残缺题`); e++; }
      if (arr.some(q => !q.steps || !q.steps.length)) { bad(`${c.name} 单元卷存在缺步骤题`); e++; }
    }
  });
  if (e === 0) ok('新单元与专项的单元考试卷 6 单元 × 5 次全部 30 题（无重复/无残缺/步骤齐全）');
}

console.log('');
if (fail === 0) console.log('ALL PASS ✅  v50 五年级课本同步三层结构验证全部通过');
else console.log(`FAILED ❌  共 ${fail} 处失败`);
process.exit(fail === 0 ? 0 : 1);
