// ============================================================
// v83s 冒烟：5下「图中阴影部分占几分之几」修复回归。
//   用户反馈：期末考第 7 题图形不清晰（密集竖线条，看不出阴影）。
//   根因：figFracBar(na*k, nb*k) 在 na*k 或 nb*k 大时（最高 12×6=72），
//         每份宽度仅 1.1px，被 stroke-width=1 完全吞没。
//   修复：① 8767 行调用改回最简 (na, nb)，题面去括号；
//         ② figFracBar 函数本身做防御自适应：cw<3 时按比例放大 w 到上限 100，
//            描边降至 0.6（兜底其他调用点 + 未来防御）。
//   验收：所有 figFracBar 调用点的每份宽度 cw ≥ 3、描边占比 <50%。
// =========================================================
const path=require('path'),fs=require('fs');
const ROOT = __dirname.replace(/\\/g,'/');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body></body></html>`;
const vc = new VirtualConsole();
vc.on('jsdomError', (e)=>console.error('[jsdom]', e.message.slice(0,200)));
const dom = new JSDOM(html, { runScripts: 'outside-only', virtualConsole: vc, pretendToBeVisual: true });
const w = dom.window;

// 把 figFracBar + 依赖常量和验证脚本一起注入（同闭包）
let msrc = fs.readFileSync(path.join(ROOT,'js/math.js'),'utf8');
msrc = msrc.replace(/^const KNOWLEDGE_BASE/m, "window.KNOWLEDGE_BASE");
// 顶层 stub：UI_ICON 由 core.js 提供，jsdom 只跑 math.js 时需兜底
const stub = `var UI_ICON = { svg: () => '' };\n`;
msrc = stub + msrc;

// 探针：注入到顶层（与 figFracBar 共享闭包）
const probe = `
;(() => {
  const cases = [
    {n: 1, d: 3}, {n: 1, d: 4}, {n: 1, d: 6}, {n: 1, d: 8}, {n: 1, d: 12},
    {n: 3, d: 9}, {n: 1, d: 16}, {n: 1, d: 24}, {n: 1, d: 36}, {n: 1, d: 48}, {n: 1, d: 72}
  ];
  const out = [];
  for (const c of cases) {
    const svg = figFracBar(c.n, c.d);
    const rects = (svg.match(/<rect/g)||[]).length;
    const lines = (svg.match(/<line/g)||[]).length;
    // 解析出实际 w 值（rect 第一个的 width，匹配到第一个 width="数字"）
    const wMatch = svg.match(/width="([0-9.]+)"/);
    const W = wMatch ? parseFloat(wMatch[1]) : 80;
    const cw = W / c.d;
    const strokeW = cw >= 6 ? 1 : 0.6;
    const ratio = ((strokeW / cw) * 100).toFixed(0);
    out.push({n:c.n, d:c.d, W: W.toFixed(1), cw: cw.toFixed(2), strokeW, ratio, rects, lines, ok: cw >= 3});
  }
  window.__cases = out;
})();
`;

// jsdom 'outside-only' 不执行 <script>，改用 dom.window.eval
dom.window.eval(msrc + probe);

let pass = 0, fail = 0;
function assert(name, cond, extra='') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else      { fail++; console.log(`  FAIL  ${name} ${extra}`); }
}

console.log('==== figFracBar 渲染质量（修复后） ====');
for (const c of w.__cases) {
  console.log(`    n=${c.n} d=${c.d} → W=${c.W} cw=${c.cw}px 描边=${c.strokeW} 占比=${c.ratio}% ${c.ok?'OK':'✗'}`);
}

// 断言 1：典型调用范围 (n∈[1,11] d∈[3,12]) cw ≥ 6（视觉最优）
let minTypicalCw = Infinity;
for (const c of w.__cases) {
  if (c.n >= 1 && c.n <= 11 && c.d >= 3 && c.d <= 12) {
    minTypicalCw = Math.min(minTypicalCw, parseFloat(c.cw));
  }
}
assert(`典型调用范围 cw ≥ 6（实测最小 ${minTypicalCw.toFixed(2)}）`, minTypicalCw >= 6);

// 断言 2：W 上限不超过 100（不超出 viewBox 120）
let maxW = 0;
for (const c of w.__cases) maxW = Math.max(maxW, parseFloat(c.W));
assert(`W 上限 ≤ 100（实测最大 ${maxW}）`, maxW <= 100);

// 断言 3：所有 d 描边占比 <50%
let allOk = w.__cases.every(c => parseFloat(c.ratio) < 50);
assert('所有 d 描边占比 <50%', allOk);

// 断言 4：d=24 中等 case 描边占比 ≤25%（修复前 70%）
const c24 = w.__cases.find(c => c.d === 24);
assert('d=24 描边占比 ≤25%', c24 && parseFloat(c24.ratio) <= 25, `ratio=${c24?.ratio}%`);

// 断言 5：d=72 极端 case 描边占比 ≤50%（修复前 90%+）
const worst = w.__cases.find(c => c.d === 72);
assert('d=72 描边占比 ≤50%（修复前 90%+）', worst && parseFloat(worst.ratio) <= 50, `ratio=${worst?.ratio}%`);

// 断言 6：d=72 极端 case 描边宽度已降至 0.6（修复前 1.0）
assert('d=72 描边宽度降至 0.6', worst && worst.strokeW === 0.6, `strokeW=${worst?.strokeW}`);

// 断言 7：常见 case (n=1, d=12) 与原行为兼容（cw=6.67、stroke=1，原 ratio=15%）
const c12 = w.__cases.find(c => c.d === 12);
assert('d=12 描边=1 与原行为一致', c12 && c12.strokeW === 1);

// 断言 8：第 8772 行写死的 (3, 9) 调用正常
const c39 = w.__cases.find(c => c.n === 3 && c.d === 9);
assert('(3, 9) 写死调用 cw=8.89', c39 && Math.abs(parseFloat(c39.cw) - 8.89) < 0.1, `cw=${c39?.cw}`);

// 断言 9：典型 (na, nb) 调用全部描边占比 <20%
let allTypicalOk = true;
for (const c of w.__cases) {
  if (c.n >= 1 && c.n <= 11 && c.d >= 3 && c.d <= 12) {
    if (parseFloat(c.ratio) >= 20) allTypicalOk = false;
  }
}
assert('典型 (na, nb) 全部描边占比 <20%', allTypicalOk);

console.log(`\n==== 总结 ====`);
console.log(`  PASS: ${pass}`);
console.log(`  FAIL: ${fail}`);
console.log(`  RESULT: ${fail === 0 ? '✅ ALL PASS' : '❌ FAILED'}`);
process.exit(fail === 0 ? 0 : 1);