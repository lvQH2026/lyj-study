/* 六年级数学题库「逐题全真模拟」审计（v92）
 * 对六年级上/下全部单元的每一道去重题，做五层体检：
 *   A 硬错误：undefined/NaN、答案缺失、选择题正解不在选项内、选项重复、双正解
 *   B 数值合理性：负答案、浮点误差尾巴、小数位过多、分数未约分、零答案
 *   C 判分模拟：构造「孩子真实会犯的错」作答，判对 = 漏判 BUG（答错也给分）
 *   D 正解等价形式：合法等价（空格/精确小数↔分数）判错 = 误杀 BUG
 *   E 重算验证：纯算式题用有理数精确重算，与标准答案比对（抓「答案算错」）
 *   F 语义合理性：问「多少人/只/棵」等计数类，答案必须为非负整数
 * 用法：NODE_PATH=... node _g6_audit.js  →  _g6_audit_out.txt
 */
const fs = require('fs');
const path = require('path');
const { boot } = require('./_dt_env');
const ROOT = process.cwd();
const ROUNDS = +(process.env.ROUNDS || 1200);
const EARLY_STOP = +(process.env.EARLY || 220);

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = b; b = a % b; a = t; } return a; };

// 分数 span → a/b（否则 1/2 会被拼成 "12"）
function toText(html) {
  return String(html == null ? '' : html)
    .replace(/<span class="frac">\s*<span class="num">([\s\S]*?)<\/span>\s*<span class="den">([\s\S]*?)<\/span>\s*<\/span>/g, '$1/$2')
    .replace(/<[^>]+>/g, '');
}
const norm = (s) => toText(s).replace(/\s+/g, ' ').trim();

// ================= 有理数（精确计算，杜绝浮点误差） =================
function R(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(Math.abs(n), d) || 1; return [Math.round(n / g), Math.round(d / g)]; }
const rAdd = (a, b) => R(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const rSub = (a, b) => R(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const rMul = (a, b) => R(a[0] * b[0], a[1] * b[1]);
const rDiv = (a, b) => (b[0] === 0 ? null : R(a[0] * b[1], a[1] * b[0]));
const ratEq = (a, b) => !!(a && b && a[0] * b[1] === b[0] * a[1]);

function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; out.push({ t: 'num', v: s.slice(i, j) }); i = j; continue; }
    if (c === '/') { out.push({ t: 'op', v: '/' }); i++; continue; }
    if ('+-×÷*()（）'.indexOf(c) >= 0) {
      let ch = c; if (ch === '*') ch = '×'; if (ch === '（') ch = '('; if (ch === '）') ch = ')';
      out.push({ t: 'op', v: ch }); i++; continue;
    }
    return null;
  }
  return out;
}
function parseExpr(ts) {
  let v = parseTerm(ts);
  if (v == null) return null;
  while (ts.pos < ts.length) {
    const op = ts[ts.pos].v;
    if (op === '+' || op === '-') { ts.pos++; const r = parseTerm(ts); if (r == null) return null; v = op === '+' ? rAdd(v, r) : rSub(v, r); }
    else break;
  }
  return v;
}
function parseTerm(ts) {
  let v = parsePrimary(ts);
  if (v == null) return null;
  while (ts.pos < ts.length) {
    const op = ts[ts.pos].v;
    if (op === '×' || op === '÷') {
      ts.pos++; const r = parsePrimary(ts); if (r == null) return null;
      if (op === '×') v = rMul(v, r); else { const d = rDiv(v, r); if (!d) return null; v = d; }
    } else break;
  }
  return v;
}
function parsePrimary(ts) {
  if (ts.pos >= ts.length) return null;
  const t = ts[ts.pos];
  if (t.v === '(') { ts.pos++; const v = parseExpr(ts); if (v == null) return null; if (ts.pos >= ts.length || ts[ts.pos].v !== ')') return null; ts.pos++; return v; }
  if (t.t === 'num') {
    ts.pos++; const s = t.v;
    if (ts.pos + 1 < ts.length && ts[ts.pos].v === '/' && ts[ts.pos + 1].t === 'num') {
      const den = ts[ts.pos + 1].v; ts.pos += 2;
      if (!/^\d+$/.test(s) || !/^\d+$/.test(den)) return null;
      const d = parseInt(den, 10); if (!(d > 0)) return null;
      return R(parseInt(s, 10), d);
    }
    if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
    if (s.indexOf('.') >= 0) { const dec = s.split('.')[1].length; return R(Math.round(parseFloat(s) * Math.pow(10, dec)), Math.pow(10, dec)); }
    return R(parseInt(s, 10), 1);
  }
  return null;
}
function evalExpr(s) {
  const ts = tokenize(s);
  if (!ts || !ts.length) return null;
  ts.pos = 0;
  const v = parseExpr(ts);
  if (v == null || ts.pos !== ts.length) return null;
  return v;
}
function ansToRat(s) {
  const t = String(s == null ? '' : s).trim();
  const FR = /^(-?\d+)\s*\/\s*(-?\d+)$/;
  if (FR.test(t)) { const p = t.split('/').map((x) => parseInt(x.trim(), 10)); return p[1] ? R(p[0], p[1]) : null; }
  const NUM = /^-?(\d+(\.\d*)?|\.\d+)$/;
  if (NUM.test(t)) {
    if (t.indexOf('.') >= 0) { const dec = t.split('.')[1].length; return R(Math.round(parseFloat(t) * Math.pow(10, dec)), Math.pow(10, dec)); }
    return R(parseInt(t, 10), 1);
  }
  return null;
}

// ================= 孩子真实会犯的错 =================
function wrongVariants(ans) {
  const s = String(ans == null ? '' : ans).trim();
  const out = new Set();
  if (!s) return [];
  const fm = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fm) {
    const a = parseInt(fm[1], 10), b = parseInt(fm[2], 10);
    if (b !== 0) {
      out.add(b + '/' + a);
      out.add((a + 1) + '/' + b);
      out.add(Math.abs(a - 1) + '/' + b);
      out.add(a + '/' + (b + 1));
      if (b - 1 > 0) out.add(a + '/' + (b - 1));
    }
  }
  const re = /-?\d+(?:\.\d+)?/g;
  const nums = []; let m;
  while ((m = re.exec(s))) nums.push({ v: m[0], i: m.index, len: m[0].length });
  nums.forEach((n) => {
    const v = n.v; let cands = [];
    if (v.indexOf('.') >= 0) {
      const f = parseFloat(v);
      cands = [+(f + 0.1).toFixed(2), +Math.abs(f - 0.1).toFixed(2), +(f + 1).toFixed(2), +(f * 10).toFixed(4), +(f / 10).toFixed(6)];
      cands = cands.map((x) => String(x));
    } else {
      const i = parseInt(v, 10);
      cands = [String(i + 1), String(i - 1), String(i + 10), String(i * 10)];
      if (i !== 0) cands.push(String(-Math.abs(i)));
      if (Math.abs(i) >= 10) { const r = parseInt(String(Math.abs(i)).split('').reverse().join(''), 10); if (r !== i) cands.push(String(i < 0 ? -r : r)); }
    }
    cands.forEach((c) => { const ns = s.slice(0, n.i) + c + s.slice(n.i + n.len); if (ns !== s) out.add(ns); });
  });
  return [...out].filter((x) => x !== s);
}

// ================= 合法等价形式（必须判对） =================
function okVariants(ans) {
  const s = String(ans == null ? '' : ans).trim();
  const out = [s, ' ' + s + ' ', s + ' '];
  const FR = /^-?\d+\s*\/\s*-?\d+$/;
  const NUM = /^-?(\d+(\.\d*)?|\.\d+)$/;
  if (FR.test(s)) {
    const p = s.split('/').map((x) => parseInt(x.trim(), 10));
    if (p[1] !== 0) {
      let d = p[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
      if (d === 1) out.push(String(+(p[0] / p[1]).toFixed(10))); // 仅有限小数才算精确等价
    }
  } else if (NUM.test(s)) {
    const v = parseFloat(s);
    if (Number.isInteger(v)) out.push(String(v) + '.0');
    const rv = ansToRat(s);
    if (rv && rv[1] !== 1) out.push(rv[0] + '/' + rv[1]);
  }
  return [...new Set(out)].filter(Boolean);
}

// 计数类单位（离散量，必须为非负整数）。
// 刻意排除连续量：天/小时/分钟（工程问题答案本就可以是分数）、元/角/分（钱可为小数）、岁/周。
const COUNT_UNIT = '人|只|棵|个|本|辆|次|台|件|块|名|张|条|支|盒|朵|面|把|双|对|架|艘|头|匹|颗|粒|份|排|组|袋|箱|页|道|题|封|束|根|座|间|扇|盏|层|级|位|户|栋|颗';
function asksCount(text) {
  const t = String(text).replace(/几分之几/g, '');   // 防「几分之几」被误读成「多少+分」
  let m = t.match(new RegExp('(有多少|多少|几)[^，。？?!！]{0,4}?(' + COUNT_UNIT + ')'));
  if (m) return m[2];
  m = t.match(new RegExp('(' + COUNT_UNIT + ')[？?]'));
  if (m && /多少|几/.test(t)) return m[1];
  return null;
}
// 剥离答案中的单位/中文，取出数值部分（"210元"→"210"，"20/3天"→"20/3"）
function numPart(s) {
  const m = String(s == null ? '' : s).match(/-?\d+(?:\.\d+)?\s*\/\s*-?\d+|-?\d+(?:\.\d+)?/);
  return m ? m[0].trim() : null;
}

boot({ wait: 800 }).then(({ w }) => {
  const KB = w.eval('KNOWLEDGE_BASE');
  const fae = w.eval('fillAnswerEquals');
  const semName = (s) => (String(s) === '1' ? '上' : '下');

  function judgeChoice(q, selIdx) {
    const sel = q.options[selIdx];
    const userAnswer = typeof sel === 'object' ? sel.value : sel;
    const idxOpt = q.options[q.answerIdx];
    const correctOpt = q.type === 'choice' && typeof idxOpt === 'object' ? idxOpt.value : q.answer;
    return userAnswer === correctOpt || userAnswer === q.answer;
  }
  const optVal = (o) => (typeof o === 'object' ? o.value : o);

  const issues = [];
  const add = (cat, sev, unit, q, detail) => issues.push({ cat, sev, unit, q: norm(q && q.question), ans: q ? String(q.answer) : '', detail });

  let totalQ = 0, calcChecked = 0;
  const unitRows = [];

  for (const sem of [1, 2]) {
    (KB[6][sem] || []).forEach((u, uidx) => {
      const uName = '6' + semName(sem) + '·' + (u.name || 'u' + uidx);
      const seen = new Map();
      let genThrow = 0, idle = 0;
      for (let r = 0; r < ROUNDS; r++) {
        let q;
        try { q = u.gen ? u.gen() : null; } catch (e) { genThrow++; continue; }
        const arr = Array.isArray(q) ? q : (q ? [q] : []);
        let added = 0;
        for (const it of arr) {
          if (!it || it.question == null) continue;
          const key = norm(it.question) + '||' + String(it.answer);
          if (!seen.has(key)) { seen.set(key, it); added++; }
        }
        if (added > 0) idle = 0; else if (++idle >= EARLY_STOP) break;
      }
      const qs = [...seen.values()];
      totalQ += qs.length;
      if (genThrow > 0) add('A0_生成抛错', 'P0', uName, { question: uName, answer: '' }, 'gen() 抛错 ' + genThrow + ' 次');

      let bad = 0;
      qs.forEach((q) => {
        const Q = String(q.question == null ? '' : q.question);
        const A = q.answer;
        const As = String(A == null ? '' : A);
        const qt = q.type || (q.options ? 'choice' : 'fill');
        const isChoice = (qt === 'choice' || qt === 'shape_choice') && !q.forceFill;
        const flat = norm(Q) + ' ' + As;
        let flagged = false;
        const F = (cat, sev, detail) => { flagged = true; add(cat, sev, uName, q, detail); };

        // ===== A 硬错误 =====
        if (/undefined|NaN|Infinity|\[object|null/.test(flat)) F('A1_占位符残留', 'P0', '题干或答案含 undefined/NaN/Infinity → ' + flat.slice(0, 90));
        if (A == null || As.trim() === '') { F('A2_答案缺失', 'P0', 'answer 为空'); return; }
        if (norm(Q).length < 5) F('A3_题干过短', 'P1', '题干仅 ' + norm(Q).length + ' 字');

        if (isChoice) {
          const opts = q.options || [];
          if (!opts.length) { F('A4_选项缺失', 'P0', 'choice 但无 options'); return; }
          if (opts.length < 2) F('A4_选项缺失', 'P0', '选项仅 ' + opts.length + ' 个');
          const vals = opts.map(optVal).map((x) => String(x));
          if (!vals.includes(As)) {
            const eq = vals.find((v) => fae(v, As));
            F('A5_正解不在选项', 'P0', eq ? '正解仅数值等价出现在[' + eq + ']，严格匹配失败→不会标绿' : '选项内无正解');
          }
          const dup = vals.filter((v, i) => vals.indexOf(v) !== i);
          if (dup.length) F('A6_选项重复', 'P1', '重复项: ' + [...new Set(dup)].join(' / '));
          if (q.answerIdx != null && opts[q.answerIdx] != null) {
            const iv = String(optVal(opts[q.answerIdx]));
            if (iv !== As && !fae(iv, As)) F('A7_双正解风险', 'P0', 'answerIdx 指向[' + iv + '] ≠ answer[' + As + ']');
          }
          const wrongHit = [];
          vals.forEach((v, i) => {
            let ok = false; try { ok = judgeChoice(q, i); } catch (e) { ok = false; }
            const isAns = v === As || fae(v, As);
            if (!isAns && ok) wrongHit.push('[干扰项判对]' + v);
            if (isAns && !ok) wrongHit.push('[正解判错]' + v);
          });
          if (wrongHit.length) F('C1_选择判分异常', 'P0', wrongHit.join(' | '));
        } else {
          const wrongs = wrongVariants(As);
          const leak = [];
          wrongs.forEach((wv) => { let ok = false; try { ok = fae(wv, As); } catch (e) { ok = false; } if (ok) leak.push(wv); });
          if (leak.length) F('C2_错答判对(漏判)', 'P0', '这些错误答案被判对: ' + leak.slice(0, 6).join(' | '));
          const oks = okVariants(As);
          const kill = [];
          oks.forEach((ov) => { let ok = false; try { ok = fae(ov, As); } catch (e) { ok = false; } if (!ok) kill.push(ov); });
          if (kill.length) F('D1_等价判错(误杀)', 'P1', '这些等价形式被判错: ' + kill.slice(0, 6).join(' | '));
        }

        // ===== B 数值合理性 =====
        const isNegUnit = /负数/.test(uName);
        const NUM = /^-?(\d+(\.\d*)?|\.\d+)$/;
        const FR = /^(-?\d+)\s*\/\s*(-?\d+)$/;
        let isFloatNoise = false;
        if (NUM.test(As)) {
          const v = parseFloat(As);
          if (v < 0 && !isNegUnit) F('B1_负答案', 'P1', '数值答案为负: ' + As);
          const dot = As.indexOf('.');
          const dec = dot >= 0 ? As.length - dot - 1 : 0;
          if (dec >= 10 || (dec >= 4 && /(\d)\1{2,}/.test(As.split('.')[1] || ''))) {
            isFloatNoise = true;
            F('B5_浮点误差尾巴', 'P0', '答案为无限小数/浮点噪声: ' + As);
          } else if (dec > 3) F('B3_小数位过多', 'P1', '答案 ' + As + ' 小数位 ' + dec);
          if (v === 0 && !isNegUnit) F('B2_零答案', 'P2', '答案为 0');
        } else if (FR.test(As)) {
          const p = As.split('/').map((x) => parseInt(x.trim(), 10));
          if (p[1] === 0) F('A1_占位符残留', 'P0', '分母为 0');
          else if (p[1] < 0) F('B1_负答案', 'P1', '分母为负: ' + As);
          else if (gcd(p[0], p[1]) > 1) F('B4_分数未约分', 'P1', '标准答案未约分: ' + As);
        }

        // ===== F 语义合理性：离散计数必须为整数 =====
        const cu = asksCount(norm(Q));
        if (cu) {
          const np = numPart(As);
          const rv = np ? ansToRat(np) : null;
          if (!rv) F('F1_计数答案无数值', 'P1', '问「多少' + cu + '」但答案取不出数值: ' + As);
          else if (rv[1] !== 1) F('F2_计数答案非整数', 'P0', '问「多少' + cu + '」答案却是 ' + As + '（' + cu + '必须整数）');
          else if (rv[0] < 0) F('F3_计数答案为负', 'P0', '问「多少' + cu + '」答案为负: ' + As);
          else if (rv[0] === 0) F('F4_计数答案为零', 'P2', '问「多少' + cu + '」答案为 0');
        }

        // ===== G 零打字可答性：答案带中文单位，但纯数字作答被判错 =====
        // 孩子只能用 InputKit 数字/小数/分数键盘，打不出「元」「厘米」等汉字。
        // 若标准答案带单位而纯数字不被判对 → 孩子答对也判错（必然性误杀）。
        if (/[\u4e00-\u9fa5]/.test(As) && !isChoice) {
          const np = numPart(As);
          if (np && np !== As) {
            let okNum = false;
            try { okNum = fae(np, As); } catch (e) { okNum = false; }
            if (!okNum) F('G1_带单位答案数字键盘答不出', 'P0', '标准答案「' + As + '」，孩子只输「' + np + '」被判错（数字键盘打不出单位）');
          }
        }

        // ===== E 重算验证（纯算式题） =====
        let body = norm(Q).replace(/[=＝]\s*[？?]+\s*$/, '').replace(/[=＝]\s*[（(]\s*[）)]\s*$/, '').trim();
        body = body.replace(/^[计算]{0,2}[:：]\s*/, '');
        if (!isChoice && body && /^[-+×÷()\/\d.\s]+$/.test(body) && /[+－\-×÷*\/]/.test(body)) {
          const rv = evalExpr(body);
          if (rv) {
            calcChecked++;
            const ar = ansToRat(As);
            if (!ar) F('E1_算式题答案非数值', 'P1', '算式 ' + body + ' 答案非数值: ' + As);
            else if (!ratEq(rv, ar)) F('E2_答案算错', 'P0', '算式 ' + body + ' 精确值 ' + rv[0] + '/' + rv[1] + '，标准答案却是 ' + As);
          }
        }
        if (flagged) bad++;
      });
      unitRows.push({ unit: uName, n: qs.length, bad });
    });
  }

  // ---------- 报告 ----------
  const SEV = { P0: 0, P1: 1, P2: 2 };
  issues.sort((a, b) => (SEV[a.sev] - SEV[b.sev]) || a.cat.localeCompare(b.cat) || a.unit.localeCompare(b.unit));
  const out = [];
  out.push('六年级数学题库逐题审计报告（' + new Date().toLocaleString('zh-CN') + '）');
  out.push('覆盖：六年级上/下 ' + unitRows.length + ' 个单元，' + totalQ + ' 道去重题；其中纯算式题重算 ' + calcChecked + ' 道');
  out.push('模拟错答：数字±1/±10/数字颠倒/小数点移位/分子分母颠倒/分子分母±1 等真实错误');
  out.push('');
  out.push('===== 一、问题汇总 =====');
  const byCat = {};
  issues.forEach((i) => { (byCat[i.cat] = byCat[i.cat] || []).push(i); });
  Object.keys(byCat).sort((a, b) => (SEV[byCat[a][0].sev] - SEV[byCat[b][0].sev])).forEach((c) => {
    const list = byCat[c];
    const units = [...new Set(list.map((x) => x.unit))];
    out.push('【' + list[0].sev + '】' + c + '：' + list.length + ' 题，涉及 ' + units.length + ' 单元');
    out.push('       ' + units.join('、'));
  });
  out.push('');
  out.push('===== 二、逐单元问题数 =====');
  unitRows.sort((a, b) => b.bad - a.bad).forEach((r) => {
    out.push('  ' + String(r.bad).padStart(4) + ' /' + String(r.n).padStart(5) + '  ' + r.unit + (r.n ? '  (' + (r.bad / r.n * 100).toFixed(1) + '%)' : ''));
  });
  out.push('');
  out.push('===== 三、问题明细（每类最多 35 条）=====');
  let curCat = '', cnt = 0;
  issues.forEach((i) => {
    if (i.cat !== curCat) { curCat = i.cat; cnt = 0; out.push('\n---- ' + i.sev + ' ' + i.cat + ' ----'); }
    if (cnt >= 35) return;
    cnt++;
    out.push('[' + i.unit + '] ' + i.q.slice(0, 120));
    out.push('    答 ' + i.ans + '   << ' + i.detail);
  });

  fs.writeFileSync(path.join(ROOT, '_g6_audit_out.txt'), out.join('\n'), 'utf8');
  fs.writeFileSync(path.join(ROOT, '_g6_audit_raw.json'), JSON.stringify(issues, null, 1), 'utf8');
  console.log('题库题数:', totalQ, '| 重算验证:', calcChecked, '| 问题数:', issues.length);
  console.log('--- 汇总 ---');
  Object.keys(byCat).sort((a, b) => (SEV[byCat[a][0].sev] - SEV[byCat[b][0].sev])).forEach((c) => {
    console.log('  [' + byCat[c][0].sev + '] ' + c + ': ' + byCat[c].length);
  });
  console.log('--- 问题最多单元 ---');
  unitRows.sort((a, b) => b.bad - a.bad).slice(0, 10).forEach((r) => console.log('  ' + String(r.bad).padStart(4) + '/' + String(r.n).padStart(5) + '  ' + r.unit));
  console.log('详细 -> _g6_audit_out.txt');
  process.exit(0);
}).catch((e) => { console.log('ERR', e); process.exit(1); });
