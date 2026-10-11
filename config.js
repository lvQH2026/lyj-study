// ===== 应用配置 =====
// 生产部署到 GitHub Pages + Supabase 时，填写下面两项并把 USE_CLOUD 改为 true。
window.APP_CONFIG = {
  SUPABASE_URL: "https://wrgupojuxnkgwbiddbsv.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_o_iwC9uN6eB9eLFcILeqvw_gwvaUd1v",
  USE_CLOUD: true,           // 已启用云端同步（家长可远程查看）
  LEARNING_ID: "LYJ-YONGJI", // 固定学习ID（吕泳冀专属，所有设备通用）
  LEARNING_PW: "202506",     // 固定口令（家长记住，远程查看用）
  CONTENT_ROW_ID: "override",
  // v113：AI 讲题代理（DeepSeek key 只存在服务端，前端永不接触）
  //   AI_PROXY_URL   —— 讲题代理地址（WorkBuddy 托管）
  //   AI_PROXY_TOKEN —— 门槛 token（不是密钥，只用来挡盲扫；真正的 key 在服务端）
  AI_PROXY_URL: "https://lyj-ai-solve.app.workbuddy.host/",
  AI_PROXY_TOKEN: "lyj-ai-2026-v112-b7f3",

  // ⚠️ v112：DeepSeek 讲题 API key 已从前端移除。
  // 旧 key 明文(base64)放在公开 GitHub Pages，2026-10-11 被扫库脚本盗刷
  // （525 次 / 2.74 亿 tokens / 账户打欠费）。key 现在只存在于服务端：
  //   supabase secrets set DEEPSEEK_API_KEY=sk-xxx --project-ref wrgupojuxnkgwbiddbsv
  // 前端走 supabase/functions/ai-solve 代理，永不接触 key。

  // 内容更新机制（二选一）：
  // ① 本地覆盖层：把下面的 units 填上题，重新部署即生效（手机端 Service Worker 会自动更新）。
  // ② 云端：填好 SUPABASE_URL / SUPABASE_ANON_KEY 并把 USE_CLOUD 改为 true，
  //    之后在 Supabase 的 content 表改数据，手机端无需重装即可实时更新。
  LOCAL_OVERRIDE: {
    units: {}
  }
};
