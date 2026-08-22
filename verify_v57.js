// verify_v57.js — 3/4 年级双轨改造守卫（结构 + 题量 + 考试范围 + 同步学习页字段）
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

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log('  ✅ ' + m); };
const bad = (m) => { fail++; console.log('  ❌ ' + m); };

const KB = w.eval('KNOWLEDGE_BASE');

// ---------- 1. 双轨结构 ----------
console.log('\n[1] 3/4 年级双轨结构');
[3, 4].forEach(g => {
  [1, 2].forEach(sem => {
    const arr = KB[g][sem] || [];
    const tb = arr.filter(u => u.group === '课本');
    const sp = arr.filter(u => u.group === '专项');
    const none = arr.filter(u => !u.group);
    const label = `${g}年级${sem === 1 ? '上' : '下'}`;
    if (tb.length >= 6) ok(`${label} 课本单元 ${tb.length} 个`); else bad(`${label} 课本单元只有 ${tb.length} 个（应≥6）`);
    if (sp.length >= 3) ok(`${label} 专项单元 ${sp.length} 个`); else bad(`${label} 专项单元只有 ${sp.length} 个（应≥3）`);
    if (none.length === 0) ok(`${label} 无未分组单元`); else bad(`${label} 有 ${none.length} 个单元缺 group：${none.map(u => u.name).join('/')}`);
    // 课本单元必须有 term/unit 且 unit 连号
    const badTerm = tb.filter(u => u.term !== (sem === 1 ? '上' : '下') || !u.unit);
    if (!badTerm.length) ok(`${label} 课本单元 term/unit 齐全`); else bad(`${label} term/unit 异常：${badTerm.map(u => u.name).join('/')}`);
    const units = tb.map(u => u.unit).sort((a, b) => a - b);
    const seqOk = units.every((v, i) => v === i + 1);
    if (seqOk) ok(`${label} unit 连号 1..${units.length}`); else bad(`${label} unit 不连号：${units.join(',')}`);
    // 三字段
    const miss = tb.filter(u => !Array.isArray(u.summary) || u.summary.length < 3 || !Array.isArray(u.fidx) || !u.fidx.length || !Array.isArray(u.method) || !u.method.length);
    if (!miss.length) ok(`${label} 课本单元 summary/fidx/method 齐全`); else bad(`${label} 缺三字段：${miss.map(u => u.name).join('/')}`);
  });
});

// ---------- 2. 生成器可运行 + 去重键容量 ----------
console.log('\n[2] 生成器容量（非整卷单元「题面|答案」键 ≥35）');
const N = 1500;
const thin = [], errs = [];
[3, 4].forEach(g => [1, 2].forEach(sem => (KB[g][sem] || []).forEach(u => {
  const keys = new Set(); const texts = new Set(); let e0 = null;
  for (let i = 0; i < N; i++) {
    try {
      const raw = u.gen();
      const arr = Array.isArray(raw) ? raw : [raw];
      arr.forEach(q => { if (q && q.question && q.answer !== undefined) { keys.add(q.question + '|' + q.answer); texts.add(q.question); } });
    } catch (err) { if (!e0) e0 = err.message; }
  }
  if (e0) errs.push(`${g}${sem === 1 ? '上' : '下'} ${u.name}: ${e0}`);
  if (!u.paper && keys.size < 35) thin.push(`${g}${sem === 1 ? '上' : '下'} ${u.name}: ${keys.size} 键 / ${texts.size} 题面`);
})));
if (!errs.length) ok('全部生成器无运行时报错'); else errs.forEach(e => bad('生成器报错 ' + e));
if (!thin.length) ok('全部非整卷单元键容量 ≥35'); else thin.forEach(t => bad('容量不足 ' + t));

// ---------- 3. 考试只考课本单元（期中/期末/月考） ----------
console.log('\n[3] 考试范围只含课本单元');
const examState = w.eval('examState');
[3, 4].forEach(g => {
  [1, 2].forEach(sem => {
    ['mid', 'final', 'month'].forEach(tp => {
      examState.grade = g; examState.semester = sem; examState.type = tp; examState.month = 2;
      const r = w.eval('getExamUnits()');
      const names = (r.units || []).map(u => u.name);
      const leaked = names.filter(n => n.indexOf('专项') >= 0);
      if (names.length && !leaked.length) ok(`${g}年级${sem === 1 ? '上' : '下'} ${tp}：${names.length} 单元，无专项混入`);
      else bad(`${g}年级${sem === 1 ? '上' : '下'} ${tp} 异常：${names.join('/') || '空'}`);
    });
  });
});

// ---------- 4. 单元卷题量与题面去重（对齐真实渲染路径）----------
// v57：单元练习的真实路径是 beginUnitQuiz —— 非整卷单元采 3 倍候选后交给
// pickDifficultyMix（内部先按题面严格去重），整卷（paper:true）单元直接渲染
// gen() 返回的题组、不经过任何去重。因此守卫必须分两条路径，才能反映真实卷面：
//   非整卷 → 候选 + pickDifficultyMix（目标 UNIT_QUIZ_LENGTH）
//   整卷   → gen() 直接出卷（目标 ≥18，且题面必须各不相同）
console.log('\n[4] 单元练习题量（题面不重复）');
const UQL = w.eval('UNIT_QUIZ_LENGTH');
[3, 4].forEach(g => {
  [1, 2].forEach(sem => {
    (KB[g][sem] || []).forEach(u => {
      let qs = [];
      try {
        if (u.paper) {
          const raw = u.gen();
          qs = Array.isArray(raw) ? raw : [raw];
        } else {
          const cands = [u.gen()];
          for (let i = 1; i < UQL * 3; i++) {
            const gg = u.gen();
            if (Array.isArray(gg)) cands.push(...gg); else cands.push(gg);
          }
          qs = w.eval('pickDifficultyMix')(cands, UQL);
        }
      } catch (e) { bad(`${g}${sem === 1 ? '上' : '下'} ${u.name} 组卷异常：${e.message}`); return; }
      const label = `${g}${sem === 1 ? '上' : '下'} ${u.name}`;
      const need = u.paper ? 18 : UQL;
      const nonEmpty = qs.filter(q => q && q.question);
      const texts = new Set(nonEmpty.map(q => q.question));
      if (qs.length >= need && texts.size === nonEmpty.length) ok(`${label}：${qs.length} 题、题面无重复`);
      else if (qs.length >= need) bad(`${label}：${qs.length} 题但题面重复（去重后 ${texts.size}）`);
      else bad(`${label}：只组出 ${qs.length} 题（应 ≥${need}）`);
    });
  });
});

// ---------- 5. 同步学习页可渲染 ----------
console.log('\n[5] 同步学习页（课本单元 → summary/fidx/method 渲染）');
try {
  const u = (KB[3][1] || []).find(x => x.group === '课本');
  if (u && u.summary.length && u.fidx.length && u.method.length) ok('三上首个课本单元三字段可读：' + u.name);
  else bad('三上课本单元三字段缺失');
} catch (e) { bad('同步学习页字段读取异常：' + e.message); }

console.log(`\n===== v57 守卫结果：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail ? 1 : 0);
