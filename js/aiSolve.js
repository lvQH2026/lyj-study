// ============================================================
// aiSolve.js — 生成「豆包爱学式」讲题卡片（经自家 Edge Function 代理）
// 全局导出 window.AiSolve
// ------------------------------------------------------------
// ⚠️ v112 重大变更：不再从浏览器直连 DeepSeek。
//    原因：key 明文(base64)放在公开 GitHub Pages 的 config.js，
//    2026-10-11 被人扫走后凌晨批量重放超长上下文盗刷
//    （525 次请求 / 2.74 亿 tokens / 把账户打欠费）。
//    且 deepseek-chat 已于 2026-07-24 退役，直连其实早就一直在失败。
//
//    现在：浏览器 → Supabase Edge Function `ai-solve` → DeepSeek。
//    key 只在服务端（supabase secrets set DEEPSEEK_API_KEY=...），
//    单次成本上限、全局日限额也都由服务端钉死。
//
// 特性：localStorage 缓存（同题 30 天不重复请求）、失败返回 null（前端降级预置卡片）
// ============================================================
(function () {
  'use strict';

  const CACHE_PREFIX = 'aisolve_v2_';
  const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 天
  const FN_TIMEOUT = 25000; // 25 秒超时，超时即降级本地卡片

  // ---------- Supabase 配置（与 aiGrade.js 同一套读法） ----------
  function cfg() {
    return (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) ? window.APP_CONFIG : null;
  }
  function sbUrl() { const c = cfg(); return c ? String(c.SUPABASE_URL).replace(/\/+$/, '') : ''; }
  function sbKey() { const c = cfg(); return c ? String(c.SUPABASE_ANON_KEY || '') : ''; }

  // 简单字符串 hash（用于缓存 key）
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
  }

  // 去掉 HTML 标签；先把分数 <span class="frac"><span class="num">4</span><span class="den">5</span></span> 转成 4/5
  function stripHtml(text) {
    let s = String(text == null ? '' : text);
    s = s.replace(/<span[^>]*class="[^"]*frac[^"]*"[^>]*>\s*<span[^>]*class="[^"]*num[^"]*"[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*class="[^"]*den[^"]*"[^>]*>([\s\S]*?)<\/span>\s*<\/span>/g, function (_, n, d) {
      return String(n).replace(/<[^>]+>/g, '').trim() + '/' + String(d).replace(/<[^>]+>/g, '').trim();
    });
    return s.replace(/<[^>]+>/g, '').trim();
  }

  function cacheKey(question, subject, grade) {
    return CACHE_PREFIX + hash(question + '|' + subject + '|' + grade);
  }

  function getCache(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj.t && Date.now() - obj.t > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return obj.data || null;
    } catch (_) {
      return null;
    }
  }

  function setCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: data }));
    } catch (_) { /* 存储满了就不缓存 */ }
  }

  function normalize(res) {
    if (!res || typeof res !== 'object') return null;
    const topic = String(res.topic || '').slice(0, 40) || '本题讲解';
    const key = String(res.key || '').slice(0, 200);
    const summary = String(res.summary || '').slice(0, 200);
    const stepsRaw = Array.isArray(res.steps) ? res.steps : [];
    const steps = stepsRaw
      .map(function (s) {
        return {
          title: String(s && s.title || '').slice(0, 60),
          formula: String(s && s.formula || '').slice(0, 500),
        };
      })
      .filter(function (s) { return s.title || s.formula; })
      .slice(0, 6);
    if (!key && steps.length === 0) return null;
    return { topic: topic, key: key, steps: steps, summary: summary };
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      const t = setTimeout(function () { reject(new Error('timeout')); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); },
        function (e) { clearTimeout(t); reject(e); });
    });
  }

  /**
   * 调用 AI 讲题
   * @param {string} question 题干（可含 HTML，内部自动 strip）
   * @param {string} subject 学科
   * @param {string} grade 年级
   * @param {string} answer 正确答案（可选）
   * @returns {Promise<object|null>} 成功返回 {topic,key,steps,summary}，失败/未配置返回 null
   */
  async function callSolve(question, subject, grade, answer) {
    const q = stripHtml(question);
    if (!q) return null;

    const subj = subject || '语文';
    const gr = grade || '';
    const key = cacheKey(q, subj, gr);

    // 1. 缓存命中（本地 30 天，既省钱又快）
    const cached = getCache(key);
    if (cached) return cached;

    // 2. 检查 Supabase 配置；没配就直接降级，不报错
    const base = sbUrl(), ak = sbKey();
    if (!base || !ak) return null;

    // 3. 走自家 Edge Function（key 在服务端，浏览器侧永远拿不到）
    try {
      const resp = await withTimeout(fetch(base + '/functions/v1/ai-solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + ak,
          apikey: ak,
        },
        body: JSON.stringify({
          question: q.slice(0, 1500),
          subject: String(subj).slice(0, 10),
          grade: String(gr).slice(0, 10),
          answer: String(answer || '').slice(0, 200),
        }),
      }), FN_TIMEOUT);

      if (!resp.ok) return null; // 未部署/403/额度用尽 → 一律降级
      const parsed = await resp.json();
      if (!parsed || !parsed.ok || !parsed.data) return null;
      const data = normalize(parsed.data);
      if (data) {
        setCache(key, data);
        return data;
      }
      return null;
    } catch (_) {
      return null; // 断网、超时、函数未部署 —— 全部静默降级到本地预置卡片
    }
  }

  window.AiSolve = {
    callSolve: callSolve,
    stripHtml: stripHtml,
  };
})();
