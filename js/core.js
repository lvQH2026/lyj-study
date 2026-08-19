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
