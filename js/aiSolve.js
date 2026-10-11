// ============================================================
// aiSolve.js — 生成「豆包爱学式」讲题卡片（经服务端代理）
// 全局导出 window.AiSolve
// ------------------------------------------------------------
// ⚠️ v112 起因：不再从浏览器直连 DeepSeek。
//    key 明文(base64)放在公开 GitHub Pages 的 config.js，
//    2026-10-11 被扫库脚本盗刷：525 次请求 / 2.74 亿 tokens /
//    账户打欠费。且 deepseek-chat 已于 2026-07-24 退役，
//    直连其实早就一直在失败。key 必须在服务端。
//
// v113：讲题代理已上线 https://lyj-ai-solve.app.workbuddy.host/
//    （WorkBuddy 托管，Node；三道闸：输入截断+max_tokens 锁 1600+
//      身份 token+全局 300 次/天+单 IP 40 次/天+服务端 30 天缓存）
//    若日后也部署了 Supabase 的 ai-solve 函数，会作为备用端点自动接上。
//
// 特性：localStorage 缓存（同题 30 天不重复请求）、失败返回 null（降级预置卡片）
// ============================================================
(function () {
  'use strict';

  const CACHE_PREFIX = 'aisolve_v2_';
  const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 天
  const FN_TIMEOUT = 25000; // 25 秒超时，超时即降级本地卡片

  // 讲题代理（默认走已上线的 WorkBuddy 托管；config.js 可覆盖）
  const DEFAULT_PROXY = 'https://lyj-ai-solve.app.workbuddy.host/';
  const DEFAULT_TOKEN = 'lyj-ai-2026-v112-b7f3'; // 门槛 token，非密钥

  function appCfg() { return window.APP_CONFIG || {}; }
  // 显式写成空字符串 = 关闭代理（应急开关）；留空不写则用默认托管地址
  function proxyUrl() {
    const v = appCfg().AI_PROXY_URL;
    if (v === '') return '';
    return String(v || DEFAULT_PROXY).replace(/\/+$/, '');
  }
  function proxyToken() { return String(appCfg().AI_PROXY_TOKEN || DEFAULT_TOKEN); }
  function sbUrl() { const u = appCfg().SUPABASE_URL; return u ? String(u).replace(/\/+$/, '') : ''; }
  function sbKey() { return String(appCfg().SUPABASE_ANON_KEY || ''); }

  // 候选端点：① 讲题代理 ② Supabase Edge Function（若已部署）
  function endpoints() {
    const list = [];
    const p = proxyUrl();
    if (p) {
      list.push({
        url: p,
        headers: { 'x-lyj-token': proxyToken(), apikey: proxyToken() },
      });
    }
    const base = sbUrl(), ak = sbKey();
    if (base && ak) {
      list.push({
        url: base + '/functions/v1/ai-solve',
        headers: { Authorization: 'Bearer ' + ak, apikey: ak },
      });
    }
    return list;
  }

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
   * @returns {Promise<object|null>} 成功返回 {topic,key,steps,summary}，失败返回 null（降级本地卡片）
   */
  async function callSolve(question, subject, grade, answer) {
    const q = stripHtml(question);
    if (!q) return null;

    const subj = subject || '语文';
    const gr = grade || '';
    const key = cacheKey(q, subj, gr);

    // 1. 本地缓存命中（30 天，既省钱又快）
    const cached = getCache(key);
    if (cached) return cached;

    const eps = endpoints();
    if (!eps.length) return null;

    const body = JSON.stringify({
      question: q.slice(0, 1500),
      subject: String(subj).slice(0, 10),
      grade: String(gr).slice(0, 10),
      answer: String(answer || '').slice(0, 200),
    });

    // 2. 依次尝试各端点，任一成功即返回；全失败返回 null（静默降级）
    for (let i = 0; i < eps.length; i++) {
      const ep = eps[i];
      try {
        const resp = await withTimeout(fetch(ep.url, {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, ep.headers),
          body: body,
        }), FN_TIMEOUT);
        if (!resp.ok) continue;
        const parsed = await resp.json();
        if (!parsed || !parsed.ok || !parsed.data) continue;
        const data = normalize(parsed.data);
        if (data) {
          setCache(key, data);
          return data;
        }
      } catch (_) {
        /* 断网/超时/端点未部署 —— 换下一个端点，全挂了就降级 */
      }
    }
    return null;
  }

  window.AiSolve = {
    callSolve: callSolve,
    stripHtml: stripHtml,
  };
})();
