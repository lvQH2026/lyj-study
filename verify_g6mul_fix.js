// 验证 g6_mul 分数乘法修复后答案正确性
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

// === 测试 1: 直接调用 g6_mul 100 次，检查答案正确性 ===
// v47 起：分数乘法答案为最简分数形式（如 3/2、2），不再用小数截断
function gcdOf(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { let t = a % b; a = b; b = t; } return a || 1; }
function fracExpected(num, den) {
  const g = gcdOf(num, den);
  let n = num / g, d = den / g;
  if (d === 1) return String(n);
  return `${n}/${d}`;
}
function parseFracAnswer(s) {
  // "3/2" → 1.5；"2" → 2；其他 → NaN
  const m = String(s).match(/^(-?\d+)\/(\d+)$/);
  if (m) return parseInt(m[1]) / parseInt(m[2]);
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}
let total = 0, wrong = 0, samples = [];
for (let i = 0; i < 100; i++) {
  const q = w.eval('g6_mul()');
  if (!q || !q.question) continue;
  total++;
  // 解析题面 "a/b×c=？"
  const m = q.question.match(/^(\d+)\/(\d+)×(\d+)=？/);
  if (!m) { wrong++; samples.push({ q: q.question, a: q.answer, reason: '无法解析题面' }); continue; }
  const a = parseInt(m[1]), b = parseInt(m[2]), c = parseInt(m[3]);
  const expected = a / b * c;                    // 数值期望
  const expectedStr = fracExpected(a * c, b);    // 最简分数形式期望
  const actual = parseFracAnswer(q.answer);
  const formOk = String(q.answer) === expectedStr;   // 形式必须为最简分数
  if (!(Math.abs(expected - actual) < 0.01) || !formOk) {
    wrong++;
    if (samples.length < 5) samples.push({ q: q.question, expected: expectedStr, actual: q.answer });
  }
}
const pass = total - wrong;
console.log('=== g6_mul 直接调用 100 次验证 ===');
console.log(`总计 ${total} 题，正确 ${pass} 题，错误 ${wrong} 题`);
if (samples.length > 0) {
  console.log('错误样本:');
  samples.forEach(s => console.log(`  ${s.q} → 答=${s.actual} (应=${s.expected})`));
}

// === 测试 2: 6 上期末卷 10 次采样，统计分数乘法题正确率 ===
let examTotal = 0, examWrong = 0;
for (let i = 0; i < 10; i++) {
  w.eval('examState.grade=6;examState.semester=1;examState.type="final";');
  const qs = w.eval('generateExamPaper().questions');
  qs.forEach(q => {
    const m = (q.question || '').match(/^(\d+)\/(\d+)×(\d+)=？/);
    if (m) {
      examTotal++;
      const a = parseInt(m[1]), b = parseInt(m[2]), c = parseInt(m[3]);
      const expected = a / b * c;
      const actual = parseFracAnswer(q.answer);
      if (!(Math.abs(expected - actual) < 0.01)) examWrong++;
    }
  });
}
console.log('\n=== 6上期末卷 10 次采样 ===');
console.log(`分数乘法题共 ${examTotal} 道，错误 ${examWrong} 道 (${examTotal > 0 ? Math.round(examWrong / examTotal * 100) : 0}%)`);

// === 结论 ===
console.log('\n=== 结论 ===');
if (wrong === 0 && examWrong === 0) {
  console.log('✓ PASS: g6_mul 修复成功，所有题面乘数与答案乘数一致，答案全部正确');
} else {
  console.log('✗ FAIL: 仍存在错误答案');
  process.exit(1);
}

// 也检查 verify_flow.js
console.log('\n=== 语法检查 ===');
try {
  require('child_process').execSync(
    `"C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe" --check js/math.js`,
    { cwd: ROOT, stdio: 'pipe' }
  );
  console.log('✓ js/math.js 语法检查通过');
} catch (e) {
  console.log('✗ js/math.js 语法错误:', e.stderr?.toString() || e.message);
  process.exit(1);
}
