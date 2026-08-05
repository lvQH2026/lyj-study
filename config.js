// ===== 应用配置 =====
// 生产部署到 GitHub Pages + Supabase 时，填写下面两项并把 USE_CLOUD 改为 true。
window.APP_CONFIG = {
  SUPABASE_URL: "https://wrgupojuxnkgwbiddbsv.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_o_iwC9uN6eB9eLFcILeqvw_gwvaUd1v",
  USE_CLOUD: true,           // 已启用云端同步（家长可远程查看）
  CONTENT_ROW_ID: "override",

  // 内容更新机制（二选一）：
  // ① 本地覆盖层：把下面的 units 填上题，重新部署即生效（手机端 Service Worker 会自动更新）。
  // ② 云端：填好 SUPABASE_URL / SUPABASE_ANON_KEY 并把 USE_CLOUD 改为 true，
  //    之后在 Supabase 的 content 表改数据，手机端无需重装即可实时更新。
  LOCAL_OVERRIDE: {
    units: {}
  }
};
