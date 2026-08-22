// verify_v49.js — v49「六年级课本同步三层结构」验证
// 1) KNOWLEDGE_BASE[6] 结构：13 课本单元（group/term/unit/summary≥4/fidx≥1/method≥1）+ 专项区
// 2) 新生成器 500 次采样：g6_direction2（方位角正确性）/ g6_numshape（n² 正确性）/ g6_pigeonhole（商+1 且有余数）
// 3) 新制图函数：figCompass / figSquareNum SVG 无 NaN/undefined
// 4) generateSteps 新分支命中：数与形 / 鸽巢
// 5) renderUnits 三分区 + showUnitDiagrams 三层学习卡渲染（jsdom）
// 6) 考试组卷：期中/期末只取课本单元（专项不混入）；单元考试可选专项且不混题
// 7) 全卷回归：六上/六下期末 30 题 100 分、配图≥5、无重复
// 8) 1-5 年级回归：getExamUnits 行为不变（无 group 字段时用原数组）
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

// ============ 1. KNOWLEDGE_BASE[6] 结构 ============
console.log('=== 1. 六年级课本同步结构 ===');
{
  const KB = w.eval('KNOWLEDGE_BASE');
  const up = KB[6][1], down = KB[6][2];
  const tbUp = up.filter(u => u.group === '课本'), tbDown = down.filter(u => group课本(u));
  function group课本(u){ return u.group === '课本'; }
  let e = 0;
  if (tbUp.length !== 8) { bad(`六上课本单元数=${tbUp.length}，应为 8`); e++; }
  if (tbDown.length !== 5) { bad(`六下课本单元数=${tbDown.length}，应为 5`); e++; }
  [...tbUp, ...tbDown].forEach(u => {
    if (!u.term || !u.unit) { bad(`${u.name} 缺 term/unit`); e++; }
    if (!u.summary || u.summary.length < 4) { bad(`${u.name} summary<4 条`); e++; }
    if (!u.fidx || !u.fidx.length) { bad(`${u.name} 缺 fidx 公式卡`); e++; }
    u.fidx.forEach(f => { if (!f.t || !f.f) { bad(`${u.name} fidx 条目缺 t/f`); e++; } });
    if (!u.method || !u.method.length) { bad(`${u.name} 缺 method 方法卡`); e++; }
    u.method.forEach(m => { if (!m.t || !m.s) { bad(`${u.name} method 条目缺 t/s`); e++; } });
    if (typeof u.gen !== 'function') { bad(`${u.name} 缺 gen`); e++; }
  });
  // 单元号连续
  const nums = tbUp.map(u => u.unit).join(',');
  if (nums !== '1,2,3,4,5,6,7,8') { bad('六上单元号不连续: ' + nums); e++; }
  const nums2 = tbDown.map(u => u.unit).join(',');
  if (nums2 !== '1,2,3,4,5') { bad('六下单元号不连续: ' + nums2); e++; }
  // 专项区
  const spUp = up.filter(u => u.group === '专项'), spDown = down.filter(u => u.group === '专项');
  if (spUp.length < 2) { bad('六上专项区过少'); e++; }
  if (spDown.length < 3) { bad('六下专项区过少'); e++; }
  if (e === 0) ok(`六上 ${tbUp.length} 课本 + ${spUp.length} 专项，六下 ${tbDown.length} 课本 + ${spDown.length} 专项，三字段齐全`);
}

// ============ 2. 新生成器 500 次 ============
console.log('=== 2. 新生成器 500 次采样 ===');
{
  // g6_direction2：罗盘题的方位角与数学角一致性
  let e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g6_direction2()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    // v49 反泄题：罗盘识图题的 SVG 不得包含答案方位名
    if (/箭头所指的方向/.test(q.question) && String(q.svg || '').includes(String(q.answer))) {
      if (e < 3) bad('罗盘图泄露答案: ' + q.question); e++; continue;
    }
    // 方位角题校验：另一种说法 = 90-度
    let m = q.question.match(/^「([南北])偏([东西])(\d+)°」方向的另一种说法是？$/);
    if (m) {
      const right = m[2] + '偏' + m[1] + (90 - +m[3]) + '°';
      if (q.answer !== right) { if (e < 3) bad(`另一种说法错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
    // 反方向题校验
    m = q.question.match(/^小明在小华的([南北])偏([东西])(\d+)°方向上，那么小华在小明的（　）方向上。$/);
    if (m) {
      const opp = { '北': '南', '南': '北', '东': '西', '西': '东' };
      const right = opp[m[1]] + '偏' + opp[m[2]] + m[3] + '°';
      if (q.answer !== right) { if (e < 3) bad(`反方向错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
    // 比例尺题校验
    m = q.question.match(/^比例尺是1:([\d,]+)，图上距离(\d+)厘米表示实际距离是多少千米？$/);
    if (m) {
      const scale = +m[1].replace(/,/g, ''), cm = +m[2];
      const right = String(+(cm * scale / 100000).toFixed(cm * scale % 100000 ? 1 : 0)) + '千米';
      if (q.answer !== right) { if (e < 3) bad(`比例尺错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
  }
  if (e === 0) ok('g6_direction2 500 次全部结构合法、方位角/比例尺计算正确');
  else bad(`g6_direction2 错误 ${e} 次`);

  // g6_numshape
  e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g6_numshape()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    let m = q.question.match(/^1\+3\+5\+…\+(\d+)=？$/);
    if (m) {
      const n = (+m[1] + 1) / 2;
      if (String(n * n) !== String(q.answer)) { if (e < 3) bad(`奇数列求和错: ${q.question} 答=${q.answer}`); e++; }
    }
    m = q.question.match(/^从1开始的连续奇数相加，和是(\d+)，一共有几个加数？$/);
    if (m) {
      const n = Math.sqrt(+m[1]);
      if (String(n) !== String(q.answer)) { if (e < 3) bad(`加数个数错: ${q.question} 答=${q.answer} 应=${n}`); e++; }
    }
    m = q.question.match(/^(\d+)²−(\d+)²=？$/);
    if (m) {
      const n = +m[1];
      if (String(2 * n - 1) !== String(q.answer)) { if (e < 3) bad(`n²−(n−1)² 错: ${q.question}`); e++; }
    }
  }
  if (e === 0) ok('g6_numshape 500 次全部正确（n²/加数个数/n²−(n−1)²）');
  else bad(`g6_numshape 错误 ${e} 次`);

  // g6_pigeonhole
  e = 0;
  for (let i = 0; i < 500; i++) {
    const q = w.eval('g6_pigeonhole()');
    if (!q || !q.question || !q.options || q.options.length < 4) { if (e < 3) bad('结构非法'); e++; continue; }
    if (!q.options.includes(q.answer)) { if (e < 3) bad('答案不在选项中: ' + q.question); e++; continue; }
    let m = q.question.match(/^(\d+)支铅笔放进(\d+)个笔筒里，总有一个笔筒里至少放进几支铅笔？$/)
           || q.question.match(/^(\d+)本书分给(\d+)个同学，总有一个同学至少分到几本书？$/);
    if (m) {
      const n = +m[1], d = +m[2];
      if (n % d === 0) { if (e < 3) bad(`整除仍出题（题目不成立）: ${q.question}`); e++; continue; }
      const right = Math.floor(n / d) + 1;
      if (!q.answer.startsWith(String(right))) { if (e < 3) bad(`至少数错: ${q.question} 答=${q.answer} 应=${right}`); e++; }
    }
  }
  if (e === 0) ok('g6_pigeonhole 500 次全部有余数且至少数=商+1');
  else bad(`g6_pigeonhole 错误 ${e} 次`);
}

// ============ 3. 新制图函数 SVG 合法性 ============
console.log('=== 3. figCompass / figSquareNum SVG ===');
{
  let e = 0;
  for (let i = 0; i < 100; i++) {
    const a = w.eval(`figCompass(${Math.round(Math.random() * 360) - 180}, '南偏东30°')`);
    if (/NaN|undefined/.test(a)) { bad('figCompass 含 NaN/undefined'); e++; break; }
  }
  for (let i = 0; i < 100; i++) {
    const n = 2 + Math.floor(Math.random() * 8);
    const a = w.eval(`figSquareNum(${n})`);
    if (/NaN|undefined/.test(a)) { bad('figSquareNum 含 NaN/undefined'); e++; break; }
    // v49 反泄题：底部标注只允许出现奇数列开头「1+3+5+…」，不得含总和(n²)/n²
    // 注：标签本身含数字 1、3、5，故不检查 2n−1（n≤3 时必撞，属正常）
    const lbl = (a.match(/<text[^>]*>([^<]*)<\/text>/) || [])[1] || '';
    if (lbl !== '1+3+5+…') { bad(`figSquareNum 标注异常 n=${n}: "${lbl}"`); e++; break; }
    if (lbl.includes(String(n * n)) || lbl.includes(`${n}²`)) { bad(`figSquareNum 标注泄露答案 n=${n}`); e++; break; }
  }
  if (e === 0) ok('figCompass / figSquareNum 100 次 SVG 无 NaN、标注不泄露答案');
}

// ============ 4. generateSteps 新分支 ============
console.log('=== 4. generateSteps 新分支 ===');
{
  const cases = [
    { q: { question: '1+3+5+…+15=？', answer: '64' }, kw: '平方' },
    { q: { question: '5²−4²=？', answer: '9' }, kw: '拐角' },
    { q: { question: '13支铅笔放进3个笔筒里，总有一个笔筒里至少放进几支铅笔？', answer: '5支' }, kw: '抽屉' },
    { q: { question: '11本书分给4个同学，总有一个同学至少分到几本书？', answer: '3本' }, kw: '抽屉' },
  ];
  let e = 0;
  cases.forEach(c => {
    const steps = w.eval(`generateSteps(${JSON.stringify(c.q)})`);
    const txt = (steps || []).join(' ');
    if (!txt.includes(c.kw)) { bad(`步骤缺关键词"${c.kw}"：${c.q.question} → ${txt}`); e++; }
  });
  if (e === 0) ok('数与形/鸽巢 4 个用例步骤分支全部命中');
}

// ============ 5. UI：三分区 + 三层学习卡（jsdom 渲染） ============
console.log('=== 5. UI 渲染 ===');
{
  let e = 0;
  w.eval('selectGrade(6)');
  const listHtml = w.document.getElementById('unitList').innerHTML;
  if (!listHtml.includes('课本同步（上册）')) { bad('六上单元列表缺「课本同步」分区'); e++; }
  if (!listHtml.includes('专项练习')) { bad('六上单元列表缺「专项练习」分区'); e++; }
  if (!listHtml.includes('位置与方向（二）')) { bad('六上缺新单元「位置与方向（二）」'); e++; }
  if (!listHtml.includes('数学广角——数与形')) { bad('六上缺新单元「数与形」'); e++; }
  if (e === 0) ok('六上单元列表三分区渲染正确');
  e = 0;
  w.eval('switchSemester(2)');
  const listHtml2 = w.document.getElementById('unitList').innerHTML;
  if (!listHtml2.includes('课本同步（下册）')) { bad('六下单元列表缺「课本同步」分区'); e++; }
  if (!listHtml2.includes('数学广角——鸽巢问题')) { bad('六下缺新单元「鸽巢问题」'); e++; }
  if (!listHtml2.includes('专项·总复习')) { bad('六下缺专项·总复习'); e++; }
  if (e === 0) ok('六下单元列表三分区渲染正确');

  // 三层学习卡：进入圆单元的同步学习页
  e = 0;
  w.eval('switchSemester(1)');
  const KB = w.eval('KNOWLEDGE_BASE');
  const idx = KB[6][1].findIndex(u => u.name === '圆');
  w.eval(`showUnitDiagrams(KNOWLEDGE_BASE[6][1][${idx}], 6, 1, ${idx})`);
  const study = w.document.getElementById('studyCards').innerHTML;
  if (!study.includes('知识点总结')) { bad('学习页缺知识点总结卡'); e++; }
  if (!study.includes('万能公式')) { bad('学习页缺万能公式卡'); e++; }
  if (!study.includes('S = πr²')) { bad('学习页圆单元缺面积公式'); e++; }
  if (!study.includes('万能答题方法')) { bad('学习页缺万能方法卡'); e++; }
  if (!study.includes('易漏直径')) { bad('学习页圆单元缺易错警示'); e++; }
  if (w.document.getElementById('specialIntroBtn').textContent !== '开始练习') { bad('按钮文案未切换为「开始练习」'); e++; }
  if (e === 0) ok('圆单元同步学习页三层卡片渲染正确');

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
  // 六上期末：units 应全部为课本单元
  w.eval(`examState.type='final'; examState.grade=6; examState.semester=1;`);
  let r = w.eval('getExamUnits()');
  if (r.units.some(u => u.group === '专项')) { bad('六上期末混入专项单元'); e++; }
  if (r.units.length !== 8) { bad(`六上期末单元数=${r.units.length}，应为 8`); e++; }
  // 六下期中：前一半课本单元
  w.eval(`examState.type='mid'; examState.semester=2;`);
  r = w.eval('getExamUnits()');
  if (r.units.some(u => u.group === '专项')) { bad('六下期中混入专项单元'); e++; }
  if (r.units.length !== 3) { bad(`六下期中单元数=${r.units.length}，应为 3（⌈5/2⌉）`); e++; }
  // 单元考试：可选专项（索引基于原始数组）
  w.eval(`examState.type='unit'; examState.grade=6; examState.semester=1;`);
  const KB = w.eval('KNOWLEDGE_BASE');
  const spIdx = KB[6][1].findIndex(u => u.group === '专项');
  w.eval(`examState.unitIdx=${spIdx}`);
  r = w.eval('getExamUnits()');
  if (r.units.length !== 1 || r.units[0].group !== '专项') { bad('单元考试无法选中专项单元'); e++; }
  if (r.rangeText.includes('第') && r.rangeText.includes('单元') && r.units[0].group === '专项') { bad('专项单元考试标题不应带单元号'); e++; }
  // 一年级回归：无 group 时 all = 原数组
  w.eval(`examState.type='final'; examState.grade=1; examState.semester=1;`);
  r = w.eval('getExamUnits()');
  if (r.units.length !== KB[1][1].length) { bad(`一年级期末单元数变了: ${r.units.length} != ${KB[1][1].length}`); e++; }
  if (e === 0) ok('期末/期中只取课本单元、单元考试可选专项、1-5 年级行为不变');
}

// ============ 7. 六上/六下期末卷回归 ============
console.log('=== 7. 期末卷回归 ===');
{
  ['六上', '六下'].forEach((label, si) => {
    w.eval(`examState.type='final'; examState.grade=6; examState.semester=${si + 1}; examState.unitIdx=0;`);
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
    }
    if (e === 0) ok(`${label}期末 5 次采样：30 题 / 100 分 / 配图≥5 / 无重复`);
  });
}

// ============ 8. 专项不进期末但单元考试可考专项（抽查单元卷） ============
console.log('=== 8. 单元考试抽查（新单元 + 专项） ===');
{
  const KB = w.eval('KNOWLEDGE_BASE');
  const checks = [
    { sem: 1, name: '位置与方向（二）' },
    { sem: 1, name: '数学广角——数与形' },
    { sem: 2, name: '数学广角——鸽巢问题' },
    { sem: 2, name: '专项·行程问题' },
  ];
  let e = 0;
  checks.forEach(c => {
    const idx = KB[6][c.sem].findIndex(u => u.name === c.name);
    if (idx < 0) { bad(`找不到单元 ${c.name}`); e++; return; }
    w.eval(`examState.type='unit'; examState.grade=6; examState.semester=${c.sem}; examState.unitIdx=${idx};`);
    const paper = w.eval('generateExamPaper()');
    const arr = paper && paper.questions;
    if (!arr || !arr.length) { bad(`${c.name}: 未能生成单元卷`); e++; return; }
    // 单元考试铁律：题面多样性（buildQuestionPool 已按题面去重）
    const distinct = new Set(arr.map(q => q.question)).size;
    if (distinct !== arr.length) { bad(`${c.name} 单元卷存在重复题 (${distinct}/${arr.length})`); e++; }
    if (arr.some(q => !q || !q.question || q.answer === undefined)) { bad(`${c.name} 单元卷存在残缺题`); e++; }
    if (arr.some(q => !q.steps || !q.steps.length)) { bad(`${c.name} 单元卷存在缺步骤题`); e++; }
  });
  if (e === 0) ok('新单元与专项的单元考试卷 4 张全部合法（无重复/无残缺/步骤齐全）');
}

console.log('');
if (fail === 0) console.log('ALL PASS ✅  v49 六年级课本同步三层结构验证全部通过');
else console.log(`FAILED ❌  共 ${fail} 处失败`);
process.exit(fail === 0 ? 0 : 1);
