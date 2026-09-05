/* 专项·分数与小数混合运算 正确性校验（v91）
 * ① 调用 g_mix_frac_dec N 次，用独立有理数求值器从题面重算答案，与生成答案精确比对
 * ② 验证 looseNumericEquals 对分数/小数互化等价写法判对
 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

let html = fs.readFileSync('index.html', 'utf8')
  .replace(/<script[^>]*src="[^"]*"[^>]*>\s*<\/script>/g, '')
  .replace(/<script[\s\S]*?serviceWorker[\s\S]*?<\/script>/g, '');
const vc = new VirtualConsole();
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://lvqh2026.github.io/lyj-study/', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
w.scrollTo = () => {}; w.confirm = () => true; w.alert = () => {}; w.prompt = () => '';
w.HTMLElement.prototype.scrollIntoView = function () {};
w.HTMLCanvasElement.prototype.getContext = () => null;
['js/core.js', 'js/math.js'].forEach(f => {
  const s = w.document.createElement('script');
  s.textContent = fs.readFileSync(f, 'utf8');
  w.document.head.appendChild(s);
});

// ---------- 独立有理数求值器（与生成器无关，作交叉验证）----------
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { let t = a % b; a = b; b = t; } return a || 1; }
function reduce(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; }
function numToRat(s) {
  s = String(s).trim();
  if (s.indexOf('/') >= 0) { const p = s.split('/'); return reduce(parseInt(p[0], 10), parseInt(p[1], 10)); }
  if (s.indexOf('.') >= 0) {
    const [ip, fp] = s.split('.');
    const ipv = ip === '' || ip === '-' ? 0 : parseInt(ip, 10);
    const fpv = fp ? parseInt(fp, 10) : 0;
    const den = Math.pow(10, fp.length);
    return reduce(ipv * den + fpv, den);
  }
  return [parseInt(s, 10), 1];
}
// 词法：数字(含 a/b 与小数)、运算符 + − × ÷、（ ）
function tokenize(expr) {
  const ops = { '+': 1, '−': 1, '×': 2, '÷': 2 };
  const toks = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ' ' || ch === '\t') { i++; continue; }
    if (ch === '(') { toks.push(['lp']); i++; continue; }
    if (ch === ')') { toks.push(['rp']); i++; continue; }
    if (ops[ch]) { toks.push(['op', ch, ops[ch]]); i++; continue; }
    // 数字：连续 数字 / . /(分数斜杠)
    let j = i; let buf = '';
    while (j < expr.length && /[0-9./]/.test(expr[j])) { buf += expr[j]; j++; }
    if (buf) { toks.push(['num', numToRat(buf)]); i = j; continue; }
    throw new Error('无法解析字符: ' + ch + ' @ ' + expr);
  }
  return toks;
}
function parse(expr) {
  const toks = tokenize(expr);
  let p = 0;
  function peek() { return toks[p]; }
  function eat() { return toks[p++]; }
  function parseExpr() {
    let v = parseTerm();
    while (peek() && peek()[0] === 'op' && (peek()[2] === 1)) {
      const op = eat()[1];
      const r = parseTerm();
      v = op === '+' ? reduce(v[0] * r[1] + r[0] * v[1], v[1] * r[1]) : reduce(v[0] * r[1] - r[0] * v[1], v[1] * r[1]);
    }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    while (peek() && peek()[0] === 'op' && peek()[2] === 2) {
      const op = eat()[1];
      const r = parseFactor();
      v = op === '×' ? reduce(v[0] * r[0], v[1] * r[1]) : reduce(v[0] * r[1], v[1] * r[0]);
    }
    return v;
  }
  function parseFactor() {
    const t = peek();
    if (t && t[0] === 'lp') { eat(); const v = parseExpr(); if (peek() && peek()[0] === 'rp') eat(); return v; }
    if (t && t[0] === 'num') { eat(); return t[1]; }
    throw new Error('语法错误 @ ' + expr);
  }
  const r = parseExpr();
  if (p !== toks.length) throw new Error('多余 token @ ' + expr);
  return r;
}
function ratEq(a, b) { return a[0] * b[1] === b[0] * a[1]; }

// ---------- 运行 ----------
// v92：mf() 自 v96 起把分数渲染成上下叠放的 HTML（<span class="frac">），
// 纯文本解析器读不了，先把 num/den 还原成 a/b 再解析。
function toText(html) {
  return String(html == null ? '' : html)
    .replace(/<span class="frac">\s*<span class="num">([\s\S]*?)<\/span>\s*<span class="den">([\s\S]*?)<\/span>\s*<\/span>/g, '$1/$2')
    .replace(/<[^>]+>/g, '');
}
const N = 6000;
let fail = 0, neg = 0, samples = [];
const decLen = {}, worst = [], denStat = {};
const seen = {};
for (let k = 0; k < N; k++) {
  let q;
  try { q = w.eval('g_mix_frac_dec()'); } catch (e) { console.log('生成抛错:', e.message); fail++; if (fail > 5) break; continue; }
  if (!q || !q.question || q.answer === undefined) { fail++; console.log('空题', JSON.stringify(q)); continue; }
  // 去重统计
  seen[q.question] = (seen[q.question] || 0) + 1;
  // 选择题（mc）只校验答案在选项里、且为合法数；填空题（mf）做题面重算
  if (q.type === 'choice') {
    if (!q.options || q.options.indexOf(q.answer) < 0) { fail++; console.log('选择题答案不在选项:', q.question, q.answer, q.options); }
    // 互化题答案应为合法数
    try { numToRat(q.answer); } catch (e) { fail++; console.log('选择题答案非法:', q.question, q.answer); }
    continue;
  }
  const qtext = toText(q.question);
  const expr = qtext.replace(/=\s*？\s*$/, '').replace(/=\s*\?\s*$/, '').trim();
  let calc;
  try { calc = parse(expr); } catch (e) { fail++; console.log('题面解析失败:', qtext, e.message); continue; }
  const ans = numToRat(q.answer);
  if (!ratEq(calc, ans)) {
    fail++;
    if (fail <= 20) console.log('答案不一致:', qtext, '| 生成=', q.answer, '| 重算=', calc[0] + '/' + calc[1]);
  }
  if (calc[0] < 0) neg++;
  // v92：统计结果小数位分布（拒绝采样应把 >2 位压到 0）与分数分母分布
  const _dot = String(q.answer).indexOf('.');
  const _dl = _dot < 0 ? 0 : String(q.answer).length - _dot - 1;
  decLen[_dl] = (decLen[_dl] || 0) + 1;
  if (_dl > 2 && worst.length < 8) worst.push('[小数>2位] ' + qtext + ' = ' + q.answer);
  const _fm = String(q.answer).match(/^\d+\/(\d+)$/);
  if (_fm) {
    const _d = parseInt(_fm[1], 10);
    denStat[_d] = (denStat[_d] || 0) + 1;
    if (_d > 24 && worst.length < 8) worst.push('[分母>24] ' + qtext + ' = ' + q.answer);
  }
  if (samples.length < 12) samples.push(qtext + '  =  ' + q.answer + (q.type === 'choice' ? '  [选]' : ''));
}
const distinct = Object.keys(seen).length;
console.log('\n=== 生成 ' + N + ' 题，失败 ' + fail + ' 题，结果为负 ' + neg + ' 题，唯一题面 ' + distinct + ' ===');
console.log('样例：');
samples.forEach(s => console.log('  ' + s));
console.log('\n结果小数位分布（位:题数）:', JSON.stringify(decLen));
console.log('结果分数分母分布（分母:题数）:', JSON.stringify(denStat));
if (worst.length) { console.log('!! 仍存在超限结果：'); worst.forEach(s => console.log('   ' + s)); }
else console.log('超限结果（小数>2位 或 分母>24）：0 ✓');

// ---------- looseNumericEquals 互化等价校验 ----------
const cases = [
  ['0.8', '4/5', true], ['4/5', '0.8', true], ['3/4', '0.75', true], ['0.75', '3/4', true],
  ['5/8', '0.625', true], ['0.125', '1/8', true], ['1', '1.0', true], ['2/4', '1/2', true],
  ['3/5', '0.6', true], ['1/3', '0.33', false], ['5/4', '1.25', true], ['0.8', '0.81', false]
];
let jf = 0;
cases.forEach(c => {
  const got = w.eval('looseNumericEquals(' + JSON.stringify(c[0]) + ',' + JSON.stringify(c[1]) + ')');
  const ok = got === c[2];
  if (!ok) jf++;
  console.log((ok ? 'OK  ' : 'BAD ') + 'looseNumericEquals("' + c[0] + '","' + c[1] + '") = ' + got + ' (期望 ' + c[2] + ')');
});
console.log('\n判分互化用例失败：' + jf);
console.log('\n总判定：' + ((fail === 0 && jf === 0) ? 'PASS ✅' : 'FAIL ❌'));
process.exit((fail === 0 && jf === 0) ? 0 : 1);
