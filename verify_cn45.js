// 语文 4/5 年级 课本同步 功能回归测试
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const pass = [], fail = [];
const ok = (n, c, x) => (c ? pass : fail).push(n + (x ? '  -> ' + x : ''));
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

['js/core.js','js/math.js','js/data.js','js/english.js','js/chinese.js','js/diagram.js','js/main.js'].forEach(s => {
  const el = w.document.createElement('script');
  el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
  w.document.body.appendChild(el);
});
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

(async () => {
  await sleep(300);
  const CN = w.CN;
  ok('window.CN 存在', !!CN, CN ? 'yes' : 'no');

  for (const g of [4, 5]) {
    const units = CN.data[g];
    ok(g + '年级 单元数 = 22 (8+8+6)', units.length === 22, '实际 ' + units.length);
    const tb = units.filter(u => u.group === '课本');
    const spec = units.filter(u => u.group === '专项');
    ok(g + '年级 课本单元 = 16 (8+8)', tb.length === 16, '实际 ' + tb.length);
    ok(g + '年级 专项单元 = 6', spec.length === 6, '实际 ' + spec.length);
    // 上册8 下册8
    ok(g + '年级 上册 = 8', tb.filter(u => u.term === '上').length === 8);
    ok(g + '年级 下册 = 8', tb.filter(u => u.term === '下').length === 8);
    // 每个课本单元 pool() 题量 >= 30
    let minN = 999, bad = [];
    tb.forEach(u => {
      const qs = u.pool();
      if (qs.length < 30) { bad.push(u.name + '(' + qs.length + ')'); }
      minN = Math.min(minN, qs.length);
    });
    ok(g + '年级 每个课本单元 pool >= 30 题', bad.length === 0, '最少 ' + minN + (bad.length ? ' 不足: ' + bad.join(',') : ''));
    // read/acc tag 存在
    let readN = 0, accN = 0;
    tb.forEach(u => u.pool().forEach(q => { if (q.tag === 'read') readN++; if (q.tag === 'acc') accN++; }));
    ok(g + '年级 含 read 阅读题', readN > 0, 'read=' + readN);
    ok(g + '年级 含 acc 积累题', accN > 0, 'acc=' + accN);

    // 组卷：上册期末、下册期中
    CN.selectGrade(g);
    for (const [kind, term] of [['final','上'], ['mid','下']]) {
      const paper = CN._buildExam(kind, term);
      ok(g + '年级 ' + term + (kind==='final'?'期末':'期中') + ' 组卷成功', !!paper && paper.questions.length >= 20,
         paper ? ('题数 ' + paper.questions.length) : 'null');
      if (paper) {
        const secs = new Set(paper.questions.map(q => q.paperSection));
        ok(g + '年级 ' + term + (kind==='final'?'期末':'期中') + ' 含3部分', secs.size >= 3, [...secs].join(' | '));
      }
    }
    // 单元考试（第1个课本单元）
    const u0 = tb[0];
    const uexam = CN._buildExam('unit', units.indexOf(u0));
    ok(g + '年级 单元考试(首单元) 成功', !!uexam && uexam.questions.length >= 20,
       uexam ? ('题数 ' + uexam.questions.length) : 'null');

    // 随机练习 30 题（beginQuiz 不报错即可，题量由 pool>=30 + fcount 保证=30）
    let pracErr = null;
    try { CN.beginQuiz(units.indexOf(u0)); } catch (e) { pracErr = e.message; }
    ok(g + '年级 随机练习 beginQuiz 无异常', !pracErr, pracErr || '题数按 PRAC_N=30 生成');

    // 首页渲染不报错
    let renderErr = null;
    try { CN.selectGrade(g); } catch (e) { renderErr = e.message; }
    ok(g + '年级 首页渲染无异常', !renderErr, renderErr || 'ok');
  }

  // 6 年级回归（不被破坏）
  CN.selectGrade(6);
  ok('6年级 单元数 = 20 (14+6)', CN.data[6].length === 20, '实际 ' + CN.data[6].length);
  const p6 = CN._buildExam('final','上');
  ok('6年级 六上期末 组卷成功', !!p6 && p6.questions.length >= 20, p6 ? ('题数 ' + p6.questions.length) : 'null');

  console.log('\n=== PASS (' + pass.length + ') ===');
  pass.forEach(p => console.log('  ✓ ' + p));
  if (fail.length) {
    console.log('\n=== FAIL (' + fail.length + ') ===');
    fail.forEach(f => console.log('  ✗ ' + f));
  }
  if (errs.length) {
    console.log('\n=== jsdom errors ===');
    errs.slice(0,10).forEach(e => console.log('  ! ' + e));
  }
  console.log('\nRESULT: ' + (fail.length === 0 && errs.length === 0 ? 'ALL PASS' : 'HAS FAILURES'));
  process.exit(fail.length === 0 && errs.length === 0 ? 0 : 1);
})();
