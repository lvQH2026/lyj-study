// ============================================================
// 核心：数学 / 英语 模块切换（顶部 数学 | 英语 分段控件）
// 英语与数学共享同一份 localStorage（math_practice_data），
// 错题携带 module 标记，家长视图可统一查看。
// ============================================================
window.App = (function () {
  let current = 'math';

  function switchModule(mod) {
    current = mod;
    const mathRoot = document.getElementById('mathRoot');
    const engRoot = document.getElementById('englishRoot');
    const mathBtn = document.querySelector('.module-switch .mod-btn[data-mod="math"]');
    const engBtn = document.querySelector('.module-switch .mod-btn[data-mod="english"]');

    if (mod === 'english') {
      mathRoot.style.display = 'none';
      engRoot.style.display = 'block';
      if (mathBtn) mathBtn.classList.remove('active');
      if (engBtn) engBtn.classList.add('active');
      // 首次进入英语时初始化其自然拼读首页（渲染到隐藏的 engBody）
      if (typeof switchMain === 'function') switchMain('phonics');
    } else {
      engRoot.style.display = 'none';
      mathRoot.style.display = 'block';
      if (engBtn) engBtn.classList.remove('active');
      if (mathBtn) mathBtn.classList.add('active');
    }
  }

  return { get module() { return current; }, switchModule };
})();
