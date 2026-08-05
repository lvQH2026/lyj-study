// ===== 应用配置 =====
// 生产部署到 GitHub Pages + Supabase 时，填写下面两项并把 USE_CLOUD 改为 true。
window.APP_CONFIG = {
  SUPABASE_URL: "",          // 例如 https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "",     // Supabase 项目的 anon public key
  USE_CLOUD: false,          // 设为 true 后启用云端同步（需先填上面两项并运行 schema.sql）
  CONTENT_ROW_ID: "override",

  // 内容更新机制（二选一）：
  // ① 本地覆盖层：把下面的 units 填上题，重新部署即生效（手机端 Service Worker 会自动更新）。
  // ② 云端：填好 SUPABASE_URL / SUPABASE_ANON_KEY 并把 USE_CLOUD 改为 true，
  //    之后在 Supabase 的 content 表改数据，手机端无需重装即可实时更新。
  LOCAL_OVERRIDE: {
    units: {}
  }
};
