// ============================================================
// 启动引导：默认进入数学模块
// 支持 URL 参数 ?module=chinese 或 ?module=english 直达对应模块
// 数学引擎（math.js）自身在加载末尾已执行 renderHome()，
// 这里仅确保顶层模块状态正确。
// ============================================================
(function () {
  function boot() {
    if (window.App && typeof App.switchModule === 'function') {
      const params = new URLSearchParams(location.search);
      const m = params.get('module');
      const mod = (m === 'english' || m === 'chinese') ? m : 'math';
      App.switchModule(mod);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
