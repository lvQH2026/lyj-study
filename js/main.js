// ============================================================
// 启动引导：默认进入数学模块（英语模块在顶部「英语」被点击时初始化）
// 数学引擎（math.js）自身在加载末尾已执行 renderHome()，
// 这里仅确保顶层模块状态正确。
// ============================================================
(function () {
  function boot() {
    if (window.App && typeof App.switchModule === 'function') {
      // 默认数学；若 URL 带 ?module=english 可直接进入英语
      const params = new URLSearchParams(location.search);
      const mod = params.get('module') === 'english' ? 'english' : 'math';
      App.switchModule(mod);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
