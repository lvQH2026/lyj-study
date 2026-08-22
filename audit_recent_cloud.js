// audit_recent_cloud.js — v55 「家长端·远程云端登录 最近练习（含考试）」jsdom 实测
// 思路：stub getChildStats / getChildRecent（模拟 Supabase RPC 返回），全流程跑 parentLogin
const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = __dirname;
const vc = new VirtualConsole();
const errs = [];
vc.on('jsdomError', e => errs.push(e.message));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<script src="https?:\/\/[^"]*"><\/script>/g, '');
html = html.replace(/<script src="(config|supabase)\.js"><\/script>/g, '');
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

['js/core.js', 'js/math.js', 'js/data.js', 'js/english.js', 'js/chinese.js', 'js/diagram.js', 'js/main.js', 'parent.js']
  .forEach(s => {
    const el = w.document.createElement('script');
    el.textContent = fs.readFileSync(path.join(ROOT, s), 'utf8');
    w.document.body.appendChild(el);
  });
w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
w.dispatchEvent(new w.Event('load'));

let fail = 0;
const bad = m => { fail++; console.log('  ✗ ' + m); };
const ok  = m => console.log('  ✓ ' + m);

const H = 3600 * 1000, D = 24 * H;
const now = Date.now();

// ============ 云端 RPC 桩 ============
// get_child_recent 返回的行（与 supabase_v55.sql 输出一致）：
// { grade, unit_name, module, correct, total, accuracy, created_at, wrong_json }
const CLOUD_ROWS = [
  { grade: 6, unit_name: '六年级上学期期中考试', module: '数学', correct: 18, total: 30, accuracy: 60,
    created_at: new Date(now - 1 * H).toISOString(),
    wrong_json: [
      { unitName: '六年级上学期期中考试', grade: 6, userAnswer: '18.84',
        question: { question: '一个圆的半径是 3cm，它的面积是多少？', options: ['28.26', '18.84', '9.42', '113.04'], answer: '28.26', explain: '圆的面积=πr²=3.14×3²=28.26', svg: '', passage: '' } }
    ] },
  { grade: 5, unit_name: '第二单元 语文园地', module: '语文', correct: 8, total: 10, accuracy: 80,
    created_at: new Date(now - 1 * D).toISOString(), wrong_json: [] },
  { grade: 6, unit_name: '分数除法', module: null, correct: 10, total: 10, accuracy: 100,
    created_at: new Date(now - 2 * D).toISOString(), wrong_json: [] },
  { grade: 6, unit_name: '第3次月考', module: '数学', correct: 25, total: 30, accuracy: 83,
    created_at: new Date(now - 3 * D).toISOString(), wrong_json: [] },
  { grade: 5, unit_name: '五年级下学期期末考试', module: '数学', correct: 22, total: 30, accuracy: 73,
    created_at: new Date(now - 5 * D).toISOString(), wrong_json: [] },
  { grade: 5, unit_name: '很早的练习', module: '语文', correct: 9, total: 10, accuracy: 90,
    created_at: new Date(now - 30 * D).toISOString(), wrong_json: [] }
];

const STATS = { total: 6, avg: 81, units: [], weak: [], trend: [], wrong: [] };

function rpHtml() {
  const el = w.document.getElementById('parentResult');
  return el ? el.innerHTML : '';
}

function runLogin() {
  // 模拟家长输入学习ID+口令
  w.document.getElementById('parentId').value = 'LYJTEST';
  w.document.getElementById('parentPw').value = 'PW123';
  return w.parentLogin();
}

// ============ A. 云端登录 → 列表（含考试标记 + 科目 + 兜底） ============
console.log('\n=== A. 云端登录渲染「最近练习」列表 ===');
w.localStorage.removeItem('math_practice_data');
w.getChildStats = async () => STATS;
w.getChildRecent = async () => CLOUD_ROWS;

runLogin().then(() => {
  const htmlA = rpHtml();
  if (htmlA.indexOf('最近练习') >= 0) ok('云端登录后含「最近练习」模块');
  else bad('云端登录后未出现「最近练习」');

  const itemCount = (htmlA.match(/class="rp-item"/g) || []).length;
  console.log('    列表渲染条目数=' + itemCount + '（6 条云端记录→截断为 5）');
  if (itemCount === 5) ok('云端列表仅展示最近 5 条');
  else bad('云端列表条数错误（期望=5，实际=' + itemCount + '）');

  const examCnt = (htmlA.match(/📄/g) || []).length;
  console.log('    考试徽标数=' + examCnt + '（期中/月考/期末 3 条在近5条内）');
  if (examCnt === 3) ok('期中/月考/期末考试条目带 📄 考试标记');
  else bad('考试标记数量错误（期望=3，实际=' + examCnt + '）');

  if (htmlA.indexOf('期中考试') >= 0) ok('列表含「期中考试」条目');
  else bad('列表缺期中考试条目');

  const mathCount = (htmlA.match(/rp-sub-math/g) || []).length;
  const cnCount = (htmlA.match(/rp-sub-cn/g) || []).length;
  console.log('    数学徽标=' + mathCount + ' 语文徽标=' + cnCount);
  if (mathCount >= 3 && cnCount >= 1) ok('云端科目徽标区分数学/语文');
  else bad('云端科目徽标缺失');

  // module=null 的旧行兜底为数学（分数除法条目无语文徽标即视为数学）
  if (htmlA.indexOf('分数除法') >= 0) ok('module=null 旧云端记录正常展示');

  if (htmlA.indexOf('rp-acc') >= 0 && htmlA.indexOf('rp-count') >= 0 && htmlA.indexOf('rp-time') >= 0)
    ok('每条含正确率/题数/时间');
  else bad('列表项缺关键信息（正确率/题数/时间）');

  // ============ B. 云端详情（wrong_json 明细） ============
  console.log('\n=== B. 云端考试详情（错题明细） ===');
  w.showPracticeDetail(0); // 第1条=期中考试
  const detailEl = w.document.getElementById('rpDetail');
  const listEl = w.document.getElementById('rpList');
  const dHtml = detailEl ? detailEl.innerHTML : '';
  if (detailEl && detailEl.style.display !== 'none') ok('点击云端条目后详情展开');
  else bad('云端详情未展开');
  if (dHtml.indexOf('期中考试') >= 0) ok('详情标题为期中考试');
  else bad('详情标题错误');
  if (dHtml.indexOf('答题情况') >= 0 && dHtml.indexOf('错题汇总') >= 0) ok('详情含答题情况+错题汇总');
  else bad('详情缺答题情况/错题汇总');
  if (dHtml.indexOf('rp-opt-ans') >= 0 && dHtml.indexOf('28.26') >= 0) ok('云端 wrong_json 选项高亮正确答案');
  else bad('云端错题选项/高亮缺失');
  if (dHtml.indexOf('你的答案：18.84') >= 0 && dHtml.indexOf('正确答案：28.26') >= 0) ok('展示你的答案 vs 正确答案');
  else bad('未正确展示 你的答案/正确答案');
  if (dHtml.indexOf('圆的面积=πr²') >= 0) ok('展示云端解析');
  else bad('云端解析缺失');
  w.hidePracticeDetail();
  if (listEl && listEl.style.display !== 'none' && detailEl.style.display === 'none') ok('返回后恢复列表');
  else bad('返回后未恢复列表');

  // ============ C. 云端无近期记录 → 空状态 ============
  console.log('\n=== C. 云端近7天无记录 → 空状态 ===');
  w.getChildRecent = async () => [
    { grade: 5, unit_name: '很早的练习', module: '语文', correct: 9, total: 10, accuracy: 90,
      created_at: new Date(now - 30 * D).toISOString(), wrong_json: [] }
  ];
  return runLogin();
}).then(() => {
  const htmlC = rpHtml();
  if (htmlC.indexOf('近 7 天还没有练习记录') >= 0 && (htmlC.match(/class="rp-item"/g) || []).length === 0)
    ok('云端近7天无记录显示空状态');
  else bad('云端空状态未正确显示');

  // ============ D. RPC 失败 → 降级提示，不白屏 ============
  console.log('\n=== D. get_child_recent 失败 → 降级提示 ===');
  w.getChildRecent = async () => { throw new Error('rpc error'); };
  return runLogin();
}).then(() => {
  const htmlD = rpHtml();
  if (htmlD.indexOf('暂时加载失败') >= 0 && htmlD.indexOf('最近练习') >= 0) ok('RPC 失败显示降级提示且不白屏');
  else bad('RPC 失败未降级');

  console.log('\n[jsdom 加载期错误] ' + (errs.length ? errs.join(' | ') : '无'));
  console.log(fail === 0 ? '\n✅ audit_recent_cloud 全部通过' : `\n❌ audit_recent_cloud 失败 ${fail} 项`);
  process.exit(fail === 0 ? 0 : 1);
}).catch(e => {
  console.error('测试异常：', e && e.stack || e);
  process.exit(1);
});
