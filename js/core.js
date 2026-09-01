// ============================================================
// 核心：数学 / 语文 / 英语 模块切换（顶部 数学 | 语文 | 英语 分段控件）
// 三个模块共享同一份 localStorage（math_practice_data），
// 错题携带 module 标记，家长视图可统一查看。
// ============================================================
window.App = (function () {
  let current = 'math';

  // v79：年级持久化。此前 state.currentGrade（数学）与 cnState.grade（语文）
  // 都是纯内存变量，孩子明明只读六年级，每次重开却要重新点一遍年级。
  const GRADE_KEY = 'lyj_grade_v1';
  const DEFAULT_GRADE = 6;

  function readGradeMap() {
    try {
      const m = JSON.parse(localStorage.getItem(GRADE_KEY) || '{}');
      return (m && typeof m === 'object') ? m : {};
    } catch (e) { return {}; }
  }

  function getGrade(mod) {
    const g = parseInt(readGradeMap()[mod], 10);
    return (g >= 1 && g <= 6) ? g : DEFAULT_GRADE;
  }

  function setGrade(mod, g) {
    g = parseInt(g, 10);
    if (!(g >= 1 && g <= 6)) return;
    const m = readGradeMap();
    m[mod] = g;
    try { localStorage.setItem(GRADE_KEY, JSON.stringify(m)); } catch (e) {}
  }

  // ---- v79：Root / 全局页调度 ----
  // 底部导航已统一为一套（#globalNav），统计与家长后台提升为「全局页」（#globalPages），
  // 三个模块 Root 之外。切到全局页时三个 Root 全部隐藏；切回模块页时全局页隐藏。
  function rootEls() {
    return {
      math: document.getElementById('mathRoot'),
      chinese: document.getElementById('chineseRoot'),
      english: document.getElementById('englishRoot'),
      global: document.getElementById('globalPages')
    };
  }

  function hideAllRoots() {
    const r = rootEls();
    ['math', 'chinese', 'english', 'global'].forEach(function (k) {
      if (r[k]) r[k].style.display = 'none';
    });
  }

  function showGlobal(pageId) {
    hideAllRoots();
    const r = rootEls();
    if (r.global) r.global.style.display = 'block';
    activatePage(pageId);
  }

  function showRoot(mod) {
    hideAllRoots();
    const r = rootEls();
    if (r[mod]) r[mod].style.display = 'block';
  }

  function activatePage(pageId) {
    const ps = document.querySelectorAll('.page');
    for (let i = 0; i < ps.length; i++) ps[i].classList.remove('active');
    const p = document.getElementById(pageId);
    if (p) p.classList.add('active');
  }

  function setNavActive(tab) {
    const tabs = document.querySelectorAll('#globalNav .nav-tab');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-page') === tab);
    }
  }

  function switchModule(mod) {
    current = mod;
    showRoot(mod);

    const btns = document.querySelectorAll('.module-switch .mod-btn');
    btns.forEach(b => b.classList.toggle('active', b.getAttribute('data-mod') === mod));
    setNavActive('home');

    if (mod === 'english') {
      if (typeof switchMain === 'function') switchMain('phonics');
    } else if (mod === 'chinese') {
      if (window.CN && typeof CN.goHome === 'function') CN.goHome();
    } else {
      if (typeof showPage === 'function') showPage('home');
      const bb = document.getElementById('backBtn');
      if (bb) bb.style.display = 'none';
      // v79：回首页时重渲染，刷新「当前年级」回显与最近练习
      if (typeof renderHome === 'function') renderHome();
    }
  }

  return {
    get module() { return current; },
    switchModule,
    // v79 新增
    showGlobal, showRoot, hideAllRoots, activatePage, setNavActive,
    getGrade, setGrade, DEFAULT_GRADE
  };
})();

// ============================================================
// v82：全站统一线性图标集（B1 视觉风格治理）
// ------------------------------------------------------------
// 背景：此前图标是「三套体系混排」——底部导航「首页」用彩色 emoji（房子）、
// 「练习/统计」用线性 SVG、「家长」又用彩色 emoji（家庭人物），各页面按钮上还散落着
// 庆祝、灯泡、场记板、骰子等一堆彩色 emoji。彩色 emoji 由系统字体渲染，
// 安卓 / iOS / Windows 长得都不一样，且与「轻奢极简（黛蓝/香槟金/米白）」的定位冲突。
//
// 【本注释刻意不写出 emoji 字符本身】——否则以后跑「全站 emoji 清零」审计时，
// 注释里的字符也会被扫出来造成误报。描述一律用名称。
//
// 规范（与既有 SVG 保持一致，勿改）：
//   viewBox="0 0 24 24" · fill="none" · stroke="currentColor" · stroke-width="1.8"
//   · stroke-linecap="round" · stroke-linejoin="round"
// 全部走 currentColor，因此图标颜色自动跟随所处文字色（导航未选中/选中态自动生效）。
//
// 用法：UI_ICON.svg('home') 返回 SVG 字符串；UI_ICON.html('home', 22) 返回带尺寸的。
// 需要额外尺寸/类名时传第二个参数（像素）。
//
// 保留不替换的符号（单色文字符号，非彩色 emoji，渲染稳定且语义明确）：
//   ★ ☆   星级评分（功能性符号）
//   ✅    结果页「确认成绩」按钮（语义按钮）
//   ✓ ✗  对错判定（Dingbats 单色文本字形，各平台长得一致，不会像 emoji 因系统而异）
// ============================================================
const UI_ICON = (function () {
  // 每个图标只写 path/几何内容，外壳统一在此拼接，避免漏写属性导致风格漂移
  const P = {
    home:     '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
    book:     '<path d="M5 4h9a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M8 20a3 3 0 01-3-3"/>',
    // 错题库：书签夹在书里。原先这里用的是一个叉号，语义是「关闭/删除」，
    // 放在「错题」tab 上会让人以为点了会删东西，v82 换成书签。
    bookmark: '<path d="M7 3h10a1 1 0 011 1v17l-6-4-6 4V4a1 1 0 011-1z"/>',
    chart:    '<path d="M4 20V11M10 20V4M16 20v-7M21 20H3"/>',
    users:    '<path d="M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M17 4.5a3.5 3.5 0 010 6.9"/><path d="M19 20v-1a4 4 0 00-2.4-3.7"/>',
    compass:  '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.1 5-5 2.1 2.1-5z"/>',
    globe:    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.9 5.6 3.9 9S14.6 18.4 12 21c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/>',
    print:    '<path d="M7 8V3h10v5"/><path d="M7 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M7 14h10v7H7z"/>',
    download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    upload:   '<path d="M12 17V5"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/>',
    save:     '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3"/><path d="M8 14h8v7H8z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/>',
    target:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    list:     '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    // 警示：取代原来的警告三角（U+26A0 在 Windows/iOS 上会被渲染成橙色彩色三角，
    //       与黛蓝/香槟金配色冲突）
    warn:     '<path d="M12 3.6L2.6 20h18.8z"/><path d="M12 10v4.5"/><path d="M12 17.4h.01"/>',
    // 提示/思路：取代原来的灯泡符号（彩色 emoji，且在小字号下糊成一团）
    info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.8h.01"/>',
    bulb:     '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 00-3.6 10.8c.6.5.9 1.1 1 1.7h5.2c.1-.6.4-1.2 1-1.7A6 6 0 0012 3z"/>',
    film:     '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16"/><path d="M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    dice:     '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9.5h.01M15 9.5h.01M9 15h.01M15 15h.01M12 12h.01"/>',
    pointer:  '<path d="M9 4.5a1.6 1.6 0 013 0v6.2l1.3-1.4a1.6 1.6 0 012.4 2.1l-4 4.3a1.6 1.6 0 01-2.3.05L6 12.4a1.6 1.6 0 012.3-2.2l.7.7z"/><path d="M4 15v3.5A2.5 2.5 0 006.5 21h9"/>',
    refresh:  '<path d="M20 11a8 8 0 10-1.6 5.6"/><path d="M20 5v6h-6"/>',
    clipboard:'<rect x="6" y="4" width="12" height="3" rx="1"/><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 12h6M9 16h4"/>',
    eye:      '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    scissors: '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.8L20 18M8.2 16.2L20 6"/>',
    scale:    '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 8h14"/><path d="M5 8l-2.5 6h5z"/><path d="M19 8l-2.5 6h5z"/>',
    trend:    '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    file:     '<path d="M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9z"/><path d="M13 3v6h6"/>',
    arrowUp:  '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
    arrowDown:'<path d="M12 4v15"/><path d="M6 13l6 6 6-6"/>',
    parent:   '<path d="M12 21s-7-4.4-7-9.3A3.7 3.7 0 0112 9a3.7 3.7 0 015-1.3"/><path d="M12 21c0-3 1.5-5.5 4-7"/>'
  };
  function svg(name, size) {
    const g = P[name];
    if (!g) return '';
    const s = size || 22;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + g + '</svg>';
  }
  return { svg: svg, html: svg, has: function (n) { return !!P[n]; }, names: Object.keys(P) };
})();

// ============================================================
// v78：读取 Service Worker 壳版本号，供页面页脚显示。
// 直接从 sw.js 文本解析 const CACHE = 'lyj-shell-vNN'，
// 取代手写版本号（此前 pc.html 长期停留在 v60，滞后 17 版）。
// ============================================================
function readShellVersion(cb) {
  if (typeof cb !== 'function') return;
  var fallback = 'v77';
  var done = function (v) { try { cb(v || fallback); } catch (e) {} };
  try {
    if (typeof fetch !== 'function') { done(fallback); return; }
    fetch('sw.js', { cache: 'no-store' }).then(function (r) {
      return r && r.ok ? r.text() : '';
    }).then(function (t) {
      // 行首锚定 + m 标志：只匹配真正的声明行，跳过注释里出现的同名文字
      var m = t && t.match(/^\s*const\s+CACHE\s*=\s*['"]([^'"]+)['"]/m);
      var v = m ? String(m[1]).replace(/^.*?(v\d+).*$/, '$1') : '';
      done(v);
    }).catch(function () { done(fallback); });
  } catch (e) { done(fallback); }
}

// ============================================================
// v73：练习设置弹层（进入单元练习前的难度选择）
// 数学与语文共用、PC 与移动端共用同一套 DOM（样式由 style.css / pc.css 各自控制），
// 动态创建，不必改动 index.html 与 pc.html。
// 难度三档（对应需求「三个层级」）：1 基础 / 2 提高 / 3 拓展；默认选中基础题。
// ============================================================
const PRACTICE_DIFF_OPTIONS = [
  { v: 1, label: '基础题',   desc: '以课本例题难度为主' },
  { v: 2, label: '提高题',   desc: '需要转个弯才解得出来' },
  { v: 3, label: '拓展题',   desc: '挑战思维，难度最高' },
];
let _practiceDiffSel = 1;

function openPracticeSettings(opts) {
  opts = opts || {};
  const title = opts.title || '练习设置';
  const okText = opts.okText || '开始练习';
  const note = opts.note || '每次固定 30 题';
  let mask = document.getElementById('practiceSettingsMask');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = 'practiceSettingsMask';
    mask.className = 'ps-mask';
    document.body.appendChild(mask);
  }
  _practiceDiffSel = (typeof opts.value === 'number') ? opts.value : 1;
  let h = '<div class="ps-dialog">';
  h += '<div class="ps-title">' + title + '</div>';
  h += '<div class="ps-note">' + note + '</div>';
  h += '<div class="ps-label">选择难度</div>';
  h += '<div class="ps-options">';
  PRACTICE_DIFF_OPTIONS.forEach(function (o) {
    h += '<button type="button" class="ps-opt' + (o.v === _practiceDiffSel ? ' on' : '') + '" data-grp="diff" data-v="' + o.v + '">' +
      '<span class="ps-opt-name">' + o.label + '</span>' +
      '<span class="ps-opt-desc">' + o.desc + '</span></button>';
  });
  h += '</div>';
  h += '<div class="ps-actions"><button type="button" class="ps-btn cancel" data-ps="cancel">取消</button>' +
    '<button type="button" class="ps-btn ok" data-ps="ok">' + okText + '</button></div>';
  h += '</div>';
  mask.innerHTML = h;
  mask.classList.add('show');
  const close = function () { mask.classList.remove('show'); };
  mask.querySelectorAll('.ps-opt').forEach(function (b) {
    b.addEventListener('click', function () {
      const grp = b.getAttribute('data-grp');
      mask.querySelectorAll('.ps-opt[data-grp="' + grp + '"]').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      const v = b.getAttribute('data-v');
      if (grp === 'diff') _practiceDiffSel = parseInt(v, 10) || 1;
    });
  });
  const cancelBtn = mask.querySelector('[data-ps="cancel"]');
  const okBtn = mask.querySelector('[data-ps="ok"]');
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (okBtn) okBtn.addEventListener('click', function () {
    close();
    if (typeof opts.onStart === 'function') opts.onStart(_practiceDiffSel);
  });
  mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
}

// ============================================================
// v82 · B2：百分比宽度 -> .u-wp* 语义类
// ------------------------------------------------------------
// 进度条这类「宽度 = 某个百分比」的样式，值只能运行期确定，过去一律拼成
// 行内 style 属性，导致 B2 收不干净。这里按 5% 一档离散化，误差 ≤2.5%，
// 进度条上肉眼无差别，换来的是宽度也归 CSS 管、主题可统一治理。
//
// 档位类 .u-wp0/.u-wp5/.../.u-wp100（共 21 条）定义在：
//   - css/style.css（移动端 index.html 与 pc.html 都引）
//   - css/pc.css（pc.html 只引 pc.css，色值与 style.css 不同，需各自定义）
//   - parent-pc.html 的内嵌 <style>（该页完全独立，不引任何外部 CSS）
// 改档位粒度只需改本函数 + 上述三处生成规则。
// ============================================================
function wpCls(p) {
  var v = Math.round((Number(p) || 0) / 5) * 5;
  return 'u-wp' + Math.max(0, Math.min(100, v));
}

// ============================================================
// v75：考试/练习批改结果页公共工具函数（PC + 移动端共用）
// ============================================================
function formatDuration(ms) {
  if (!ms || ms < 0) return '0秒';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0 && s > 0) return m + '分' + s + '秒';
  if (m > 0) return m + '分';
  return s + '秒';
}

function getGradeLevel(accuracy) {
  if (accuracy >= 90) return { label: '优秀', cls: 'excellent', stars: '★★★' };
  if (accuracy >= 80) return { label: '良好', cls: 'good', stars: '★★' };
  if (accuracy >= 60) return { label: '及格', cls: 'pass', stars: '★' };
  return { label: '需努力', cls: 'needs', stars: '' };
}

function questionTypeLabel(type) {
  const map = { choice: '选择', fill: '填空', judge: '判断', calc: '计算', app: '应用', operation: '操作' };
  return map[type] || map[String(type)] || '其它';
}

function detectMathConcepts(text) {
  if (!text) return [];
  const t = String(text).toLowerCase();
  const out = [];
  const rules = [
    { keys: ['因数','倍数','质数','合数','最小公倍数','最大公因数','公因数','公倍数','分解质因数'], name: '因数与倍数' },
    { keys: ['分数','约分','通分','分子','分母','真分数','假分数','带分数','倒数'], name: '分数' },
    { keys: ['小数','循环小数','有限小数','无限小数','小数点','近似数','四舍五入'], name: '小数' },
    { keys: ['百分数','百分率','折扣','税率','利率','百分比'], name: '百分数' },
    { keys: ['比','比例','比值','按比分配','正比例','反比例','比例尺'], name: '比和比例' },
    { keys: ['方程','等式','未知数','解方程','列方程','方程两边'], name: '简易方程' },
    { keys: ['面积','长方形','正方形','平行四边形','三角形','梯形','圆面积','圆的周长','周长'], name: '图形面积' },
    { keys: ['体积','容积','立方米','立方分米','立方厘米','圆柱','圆锥','表面积','侧面积'], name: '体积与表面积' },
    { keys: ['角度','锐角','直角','钝角','平角','周角','量角器','角的度量','三角形内角和'], name: '角与角度' },
    { keys: ['四则运算','加减乘除','运算顺序','脱式','竖式','简便计算','运算定律','交换律','结合律','分配律'], name: '四则运算' },
    { keys: ['平均数','统计图','条形统计图','折线统计图','扇形统计图','众数','中位数'], name: '统计' },
    { keys: ['可能性','概率','一定','不可能','可能','公平','不公平','转盘'], name: '可能性' },
    { keys: ['行程','速度','时间','路程','相遇','追及','相向','同向'], name: '行程问题' },
    { keys: ['工程问题','工作效率','工作时间','工作总量'], name: '工程问题' },
    { keys: ['植树','间隔','两端','一端','封闭'], name: '植树问题' },
    { keys: ['鸡兔同笼','假设法','抬脚法'], name: '鸡兔同笼' },
    { keys: ['进一法','去尾法','近似','保留','精确'], name: '近似计算' },
    { keys: ['平移','旋转','轴对称','对称轴','变换','图形运动'], name: '图形的运动' },
    { keys: ['位置','方向','坐标','数对','行列','方位','东北','西北','东南','西南'], name: '位置与方向' },
    { keys: ['负数','正数','数轴','相反意义的量','零下'], name: '负数' },
    { keys: ['时间','钟表','时分秒','24时','年','月','日','闰年'], name: '时间' },
    { keys: ['人民币','元','角','分','购物','找零','付钱'], name: '人民币' },
    { keys: ['长度','米','分米','厘米','毫米','千米','单位换算'], name: '长度单位' },
    { keys: ['质量','克','千克','吨','公斤','单位换算'], name: '质量单位' },
    { keys: ['乘法','除法','口诀','九九乘法表','乘数','被除数','除数','商','余数'], name: '乘除法' },
    // ===== 语文知识点（v75：语文模块接入「真实老师批改」两段式，批语可按错题知识点生成）=====
    { keys: ['生字','生词','多音字','形近字','同音字','查字典','部首','笔画','笔顺','组词','造句','词语','近义词','反义词','词语搭配'], name: '字词句' },
    { keys: ['课文','段落','中心思想','阅读理解','主要内容','读后感','概括','含义','体会','联系上下文'], name: '阅读' },
    { keys: ['古诗','古文','文言文','诗词','诗句','背诵','默写','唐诗','宋词','译文','注释'], name: '古诗文' },
    { keys: ['习作','作文','写话','想象','记实','书信','应用文','倡议书','演讲稿','缩写','扩写'], name: '习作' },
    { keys: ['标点','逗号','句号','引号','顿号','分号','冒号','省略号','书名号','破折号','问号','感叹号'], name: '标点符号' },
    { keys: ['比喻','拟人','排比','夸张','反问','设问','修辞','对偶','反复','借代'], name: '修辞手法' },
    { keys: ['文学常识','名著','成语出处','四大名著','童话','寓言','神话','民间故事','作者','作家'], name: '文学常识' },
    { keys: ['口语交际','转述','讨论','讲述','劝说','讨论会','辩论'], name: '口语交际' }
  ];
  rules.forEach(function (r) {
    if (r.keys.some(function (k) { return t.indexOf(k) !== -1; }) && out.indexOf(r.name) === -1) out.push(r.name);
  });
  return out;
}

function generateTeacherComment(score, total, accuracy, wrongItems, grade, isExam) {
  const level = getGradeLevel(accuracy);
  const concepts = [];
  (wrongItems || []).forEach(function (it) {
    const q = (it && it.q) || (it && it.question) || it;
    if (!q) return;
    const parts = [];
    if (q.question) parts.push(q.question);
    if (q.sectionTitle) parts.push(q.sectionTitle);
    if (q._section) parts.push(q._section);
    if (q._unitName) parts.push(q._unitName);
    if (q.paperSection) parts.push(q.paperSection);
    detectMathConcepts(parts.join(' ')).forEach(function (c) { if (concepts.indexOf(c) === -1) concepts.push(c); });
  });
  const top = concepts.slice(0, 3);
  let base = '', focus = '';
  if (accuracy >= 90) {
    base = '表现优秀，基础扎实！';
    focus = top.length ? `注意保持：${top.join('、')}。` : '继续保持，争取次次全对！';
  } else if (accuracy >= 80) {
    base = '整体良好，继续保持！';
    focus = top.length ? `再巩固一下：${top.join('、')}。` : '稳住状态，下次冲刺优秀！';
  } else if (accuracy >= 60) {
    base = '基本掌握，还有提升空间。';
    focus = top.length ? `重点突破：${top.join('、')}。` : '建议把错题再做一遍。';
  } else {
    base = '别灰心，先把基础打牢。';
    focus = top.length ? `重点补一补：${top.join('、')}。` : '多练基础题，继续加油！';
  }
  return base + focus + '继续加油！';
}

function svgHandwrittenCheck(correct) {
  // 返回一个手绘风格的 ✓ 或 ✗ SVG，用于批改标记
  const color = correct ? '#c23a2b' : '#c23a2b';
  const path = correct
    ? 'M3 12 L9 18 L21 4'
    : 'M5 5 L19 19 M19 5 L5 19';
  return '<svg class="teacher-mark" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
