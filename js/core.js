// ============================================================
// 核心：数学 / 语文 / 英语 模块切换（顶部 数学 | 语文 | 英语 分段控件）
// 三个模块共享同一份 localStorage（math_practice_data），
// 错题携带 module 标记，家长视图可统一查看。
// ============================================================
window.App = (function () {
  let current = 'math';

  function switchModule(mod) {
    current = mod;
    const mathRoot = document.getElementById('mathRoot');
    const cnRoot = document.getElementById('chineseRoot');
    const engRoot = document.getElementById('englishRoot');
    const btns = document.querySelectorAll('.module-switch .mod-btn');

    // 隐藏所有根容器
    mathRoot.style.display = 'none';
    engRoot.style.display = 'none';
    if (cnRoot) cnRoot.style.display = 'none';

    // 移除所有按钮 active
    btns.forEach(b => b.classList.remove('active'));

    if (mod === 'english') {
      engRoot.style.display = 'block';
      const btn = document.querySelector('.module-switch .mod-btn[data-mod="english"]');
      if (btn) btn.classList.add('active');
      if (typeof switchMain === 'function') switchMain('phonics');
    } else if (mod === 'chinese') {
      if (cnRoot) cnRoot.style.display = 'block';
      const btn = document.querySelector('.module-switch .mod-btn[data-mod="chinese"]');
      if (btn) btn.classList.add('active');
      if (window.CN && typeof CN.init === 'function') CN.init();
    } else {
      mathRoot.style.display = 'block';
      const btn = document.querySelector('.module-switch .mod-btn[data-mod="math"]');
      if (btn) btn.classList.add('active');
    }
  }

  return { get module() { return current; }, switchModule };
})();

// ============================================================
// v73：练习设置弹层（进入单元练习前的难度选择）
// 数学与语文共用、PC 与移动端共用同一套 DOM（样式由 style.css / pc.css 各自控制），
// 动态创建，不必改动 index.html 与 pc.html。
// 难度沿用站内既有命名：0 混合 / 1 基础 / 2 提高 / 3 拓展。
// ============================================================
const PRACTICE_DIFF_OPTIONS = [
  { v: 0, label: '混合难度', desc: '基础 6 : 提高 3 : 拓展 1' },
  { v: 1, label: '基础题',   desc: '以课本例题难度为主' },
  { v: 2, label: '提高题',   desc: '需要转个弯才解得出来' },
  { v: 3, label: '拓展题',   desc: '挑战思维，难度最高' },
];
let _practiceDiffSel = 0;
let _practiceTypeSel = 0;

// v73.2：题型筛选（对齐用户第 2 条）——单元练习可按题型聚焦训练
const PRACTICE_TYPE_OPTIONS = [
  { v: 0, label: '全部题型', desc: '混合各题型' },
  { v: 'choice', label: '选择题', desc: '四选一' },
  { v: 'fill', label: '填空题', desc: '直接写答案' },
  { v: 'calc', label: '计算题', desc: '脱式/竖式' },
  { v: 'app', label: '应用题', desc: '生活情境' },
];

function openPracticeSettings(opts) {
  opts = opts || {};
  const title = opts.title || '练习设置';
  const okText = opts.okText || '开始练习';
  const note = opts.note || '每次固定 30 题';
  const typeOptions = Array.isArray(opts.typeOptions) ? opts.typeOptions : PRACTICE_TYPE_OPTIONS;
  const showType = opts.showType !== false;
  let mask = document.getElementById('practiceSettingsMask');
  if (!mask) {
    mask = document.createElement('div');
    mask.id = 'practiceSettingsMask';
    mask.className = 'ps-mask';
    document.body.appendChild(mask);
  }
  _practiceDiffSel = (typeof opts.value === 'number') ? opts.value : 0;
  _practiceTypeSel = (opts.typeValue !== undefined && opts.typeValue !== null) ? opts.typeValue : 0;
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
  if (showType) {
    h += '<div class="ps-label">选择题型</div>';
    h += '<div class="ps-options">';
    typeOptions.forEach(function (o) {
      h += '<button type="button" class="ps-opt' + (o.v === _practiceTypeSel ? ' on' : '') + '" data-grp="type" data-v="' + o.v + '">' +
        '<span class="ps-opt-name">' + o.label + '</span>' +
        '<span class="ps-opt-desc">' + o.desc + '</span></button>';
    });
    h += '</div>';
  }
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
      if (grp === 'diff') _practiceDiffSel = parseInt(v, 10) || 0;
      else _practiceTypeSel = (v === '0') ? 0 : v;
    });
  });
  const cancelBtn = mask.querySelector('[data-ps="cancel"]');
  const okBtn = mask.querySelector('[data-ps="ok"]');
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (okBtn) okBtn.addEventListener('click', function () {
    close();
    if (typeof opts.onStart === 'function') opts.onStart(_practiceDiffSel, _practiceTypeSel);
  });
  mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
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
