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
