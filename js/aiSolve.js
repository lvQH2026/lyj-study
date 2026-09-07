// ============================================================
// aiSolve.js — 直连 DeepSeek API 生成「豆包爱学式」讲题卡片
// 全局导出 window.AiSolve
// 特性：localStorage 缓存（同题不重复花钱）、失败返回 null（前端降级预置卡片）
// DeepSeek API 支持 CORS，可浏览器直连；key 存 config.js 的 DEEPSEEK_API_KEY
// ============================================================
(function () {
  'use strict';

  const API_URL = 'https://api.deepseek.com/chat/completions';
  const MODEL = 'deepseek-chat';
  const CACHE_PREFIX = 'aisolve_v1_';
  const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 天

  function apiKey() {
    var b64 = (window.APP_CONFIG && window.APP_CONFIG.DEEPSEEK_API_KEY_B64) || '';
    if (!b64) return '';
    try { return atob(b64); } catch (_) { return ''; }
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

  // ---------- Prompt ----------
  function buildPrompt(question, subject, grade, answer) {
    return `你是一位耐心的初中${subject || '数学'}老师，正在给一名${grade || '初中'}学生讲解一道做错的题。
请用"豆包爱学式"讲题卡片的结构来讲解，语言通俗易懂，步骤清晰。

【题目】${question}
${answer ? '【正确答案】' + answer : ''}

【输出要求】只输出一个 JSON 对象，不要任何解释文字、不要 markdown 代码块标记。格式如下：
{
  "topic": "题型名称，如：有理数乘法简便运算、一元一次方程解法、古诗词鉴赏",
  "key": "解题关键，一句话点出本题最核心的方法/定律/思路，如：乘法交换律——两个数相乘交换因数位置积不变",
  "steps": [
    { "title": "第一步：利用乘法交换律调整因数位置", "formula": "33 × (-17) × 3 = 33 × 3 × (-17)" },
    { "title": "第二步：计算 33 × 3", "formula": "33 × 3 = 99" },
    { "title": "第三步：利用乘法分配律计算 99 × (-17)", "formula": "99 × (-17) = (100-1) × (-17) = -1700 + 17 = -1683" }
  ],
  "summary": "方法总结，一句话口诀，如：先用交换律调整计算顺序，再用分配律凑整，注意符号。"
}

【字段说明】
- topic：20字以内，准确概括题型
- key：50字以内，点明核心方法，不要泛泛而谈
- steps：2~5步，每步 title 是动作描述（20字内），formula 是该步的演算/推理过程（可用多行，用 \\n 换行）
- summary：30字以内的方法口诀或易错提醒
- 如果是语文/英语等非计算题，formula 字段写该步的分析内容（如"找主旨句：文章第一段第一句"）
- 不要在 JSON 里出现未转义的换行符，formula 内的换行用 \\n 表示`;
  }

  // ---------- 抠 JSON ----------
  function extractJSON(raw) {
    if (!raw) return null;
    let s = raw.trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) s = fence[1].trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    try {
      return JSON.parse(s);
    } catch (_) {
      try {
        return JSON.parse(s.replace(/,\s*([}\]])/g, '$1'));
      } catch (__) {
        return null;
      }
    }
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

  /**
   * 调用 AI 讲题
   * @param {string} question 题干（可含 HTML，内部自动 strip）
   * @param {string} subject 学科
   * @param {string} grade 年级
   * @param {string} answer 正确答案（可选）
   * @returns {Promise<object|null>} 成功返回 {topic,key,steps,summary}，失败返回 null
   */
  async function callSolve(question, subject, grade, answer) {
    const q = stripHtml(question);
    if (!q) return null;

    const subj = subject || '数学';
    const gr = grade || '';
    const key = cacheKey(q, subj, gr);

    // 1. 缓存命中
    const cached = getCache(key);
    if (cached) return cached;

    // 2. 检查 key
    const ak = apiKey();
    if (!ak) return null;

    // 3. 直连 DeepSeek
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ak,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.3,
          max_tokens: 2000,
          messages: [{ role: 'user', content: buildPrompt(q, subj, gr, answer || '') }],
        }),
      });
      if (!resp.ok) return null;
      const parsed = await resp.json();
      const content = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
      const data = normalize(extractJSON(typeof content === 'string' ? content : ''));
      if (data) {
        setCache(key, data);
        return data;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  window.AiSolve = {
    callSolve: callSolve,
    stripHtml: stripHtml,
  };
})();
