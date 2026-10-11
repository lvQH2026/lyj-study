// ============================================================
// Supabase Edge Function: ai-solve
// ------------------------------------------------------------
// 作用：代理调用 DeepSeek（deepseek-flash）生成「豆包爱学式」讲题卡片。
//
// 为什么必须经过这一层（不能从浏览器直连 DeepSeek）：
//   1) API Key 放前端等于公开，会被扫库脚本盗刷。
//      2026-10-11 事故：key 明文(base64)放在公开 GitHub Pages 的 config.js，
//      被人拿去凌晨批量重放超长上下文，525 次请求打掉 2.74 亿 tokens、
//      把账户打欠费（deepseek-chat 已于 2026-07-24 退役，网站自己一次都没调成功）。
//   2) 服务器侧可以钉死单次成本上限 + 全局日限额，就算 URL 泄露损失也可控。
//
// 三道闸（缺一不可）：
//   ① 输入闸门：题干截断 1500 字、答案 200 字、max_tokens 锁 1600、模型锁 deepseek-flash
//      → 单次最大成本约 1 分钱（裸 key 时攻击者单次能打几十万 tokens）
//   ② 身份闸门：必须带本站 apikey（挡掉纯扫描器）
//   ③ 全局日限额：数据库计数，超过 AI_SOLVE_DAILY_LIMIT 次/天直接降级
//
// 输入：POST { question, subject, grade, answer }
// 输出：{ ok:true, data:{topic,key,steps,summary} }
//     或 { ok:false, degrade:true, error } —— 前端自动降级本地预置卡片（孩子无感）
//
// 部署（需先建表 + RPC，见 supabase/migrations/20261011_ai_solve_usage.sql）：
//   ① 密钥：supabase secrets set DEEPSEEK_API_KEY=sk-新的 --project-ref wrgupojuxnkgwbiddbsv
//      （也可在后台 Edge Functions → Secrets 里填，填完无需重新部署）
//   ② 部署：supabase functions deploy ai-solve --project-ref wrgupojuxnkgwbiddbsv
//
// ⚠️ 必须用 verify_jwt=false 部署！本项目用的是新版 sb_publishable_ 密钥，
//    而网关自带的 verify_jwt 只认旧版 JWT 密钥，开着会让请求在进函数前就被
//    判 Invalid JWT（401/403）。身份校验已在函数内部自己做（闸门②）。
//    CLI 部署时在 supabase/config.toml 写：
//      [functions.ai-solve]
//      verify_jwt = false
//    走 Management API 部署时，metadata 里带 "verify_jwt": false。
// ============================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const API_URL = 'https://api.deepseek.com/chat/completions';
// ⚠️ 2026-07-24 起 deepseek-chat / deepseek-reasoner 已退役，必须使用 deepseek-flash
const MODEL = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-flash';
const MAX_TOKENS = 1600;               // 闸门①：输出硬上限
const DAILY_LIMIT = Number(Deno.env.get('AI_SOLVE_DAILY_LIMIT') || 200); // 闸门③

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

// ---------- 输入清洗：去掉控制字符 + 长度截断 ----------
function clean(v: unknown, max: number): string {
  let s = String(v == null ? '' : v);
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
  s = s.trim();
  return s.length > max ? s.slice(0, max) : s;
}

// ---------- Prompt：只输出 JSON ----------
function buildPrompt(question: string, subject: string, grade: string, answer: string) {
  return `你是一位耐心的${grade || '小学'}${subject || '语文'}老师，正在给一名学生讲解一道做错的题。
请用"豆包爱学式"讲题卡片的结构来讲解，语言通俗易懂，步骤清晰，适合这个年级的孩子自己看懂。

【题目】${question}
${answer ? '【正确答案】' + answer : ''}

【输出要求】只输出一个 JSON 对象，不要任何解释文字、不要 markdown 代码块标记。格式如下：
{
  "topic": "题型名称，如：分数乘法应用题、修改病句、古诗词鉴赏",
  "key": "解题关键，一句话点出本题最核心的方法/规则/思路，50字以内",
  "steps": [
    { "title": "第一步：……（20字内）", "formula": "该步的演算或分析过程" },
    { "title": "第二步：……", "formula": "……" }
  ],
  "summary": "方法总结，一句话口诀或易错提醒，30字以内"
}

【字段说明】
- topic：20字以内，准确概括题型
- key：50字以内，点明核心方法，不要泛泛而谈
- steps：2~5步，每步 title 是动作描述（20字内），formula 是该步的演算/推理/分析内容（可用 \\n 换行）
- summary：30字以内的方法口诀或易错提醒
- 语文/英语等非计算题，formula 字段写该步的分析内容（如"找主旨句：文章第一段第一句"）
- 不要在 JSON 里出现未转义的换行符，formula 内的换行用 \\n 表示`;
}

// ---------- 从模型输出里抠出 JSON ----------
function extractJSON(raw: string): any {
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

function normalize(res: any) {
  if (!res || typeof res !== 'object') return null;
  const topic = String(res.topic || '').slice(0, 40) || '本题讲解';
  const key = String(res.key || '').slice(0, 200);
  const summary = String(res.summary || '').slice(0, 200);
  const stepsRaw = Array.isArray(res.steps) ? res.steps : [];
  const steps = stepsRaw
    .map((s: any) => ({
      title: String((s && s.title) || '').slice(0, 60),
      formula: String((s && s.formula) || '').slice(0, 500),
    }))
    .filter((s: any) => s.title || s.formula)
    .slice(0, 6);
  if (!key && steps.length === 0) return null;
  return { topic, key, steps, summary };
}

// ---------- 项目密钥：兼容「新版 publishable/secret key」与「旧版 JWT key」 ----------
// 2026 起 Supabase 推新版密钥（sb_publishable_* / sb_secret_*）：
//   - 旧变量 SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 是字符串
//   - 新变量 SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS 是 JSON（按名字索引）
// 网关的 verify_jwt 只认旧版 JWT，所以部署时必须 verify_jwt=false，
// 身份校验改在函数里自己做（见下方 projectKeys）。
function jsonVals(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === 'object') return Object.values(o).map((v) => String(v));
  } catch (_) { /* 不是 JSON，当普通字符串处理 */ }
  return [String(raw)];
}

function projectKeys(): string[] {
  const e = Deno.env;
  const set = new Set<string>();
  [e.get('SUPABASE_ANON_KEY'), e.get('SUPABASE_SERVICE_ROLE_KEY')].forEach((v) => { if (v) set.add(v); });
  jsonVals(e.get('SUPABASE_PUBLISHABLE_KEYS')).forEach((v) => set.add(v));
  jsonVals(e.get('SUPABASE_SECRET_KEYS')).forEach((v) => set.add(v));
  return Array.from(set);
}

function serviceKey(): string {
  const e = Deno.env;
  const news = jsonVals(e.get('SUPABASE_SECRET_KEYS'));
  return news[0] || e.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

// ---------- 闸门③：全局日限额（数据库计数，失败则放行，不阻断讲题） ----------
// RPC ai_solve_tick(p_limit) 语义：返回当日累计次数；超过 p_limit 时返回 -1。
// 这里归一化成 { over, cnt }：计数器不可用（表/RPC 未建、网络异常）一律 fail-open。
async function tickDaily(): Promise<{ over: boolean; cnt: number }> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = serviceKey();
  if (!url || !key) return { over: false, cnt: 0 }; // 没配 → 放行
  try {
    const resp = await fetch(url.replace(/\/+$/, '') + '/rest/v1/rpc/ai_solve_tick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key },
      body: JSON.stringify({ p_limit: DAILY_LIMIT }),
    });
    if (!resp.ok) return { over: false, cnt: 0 };
    const v = Number(await resp.json());
    if (!Number.isFinite(v)) return { over: false, cnt: 0 };
    if (v === -1) return { over: true, cnt: DAILY_LIMIT };
    return { over: false, cnt: v };
  } catch (_) {
    return { over: false, cnt: 0 };
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: '仅支持 POST' }, 405);

  // ---- 闸门②：必须带本站密钥（挡掉盲扫；网关 verify_jwt 已设为 false） ----
  const known = projectKeys();
  const gotKey = req.headers.get('apikey') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (known.length && !known.includes(gotKey)) {
    return json({ ok: false, degrade: true, error: '身份校验未通过' }, 403);
  }

  const dk = Deno.env.get('DEEPSEEK_API_KEY');
  if (!dk) {
    return json({ ok: false, degrade: true, error: '未配置 DEEPSEEK_API_KEY' }, 200);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (_) {
    return json({ ok: false, error: '请求体不是合法 JSON' }, 400);
  }

  // ---- 闸门①：输入长度硬截断 ----
  const question = clean(payload.question, 1500);
  const answer = clean(payload.answer, 200);
  const subject = clean(payload.subject, 10);
  const grade = clean(payload.grade, 10);
  if (!question) {
    return json({ ok: false, error: 'question 缺失' }, 400);
  }

  // ---- 闸门③：先计数再调用，超限直接降级（不花钱） ----
  const quota = await tickDaily();
  if (quota.over) {
    return json({ ok: false, degrade: true, error: '今日 AI 讲题额度已用完' }, 200);
  }

  const body: any = {
    model: MODEL,
    temperature: 0.3,
    max_tokens: MAX_TOKENS,
    // 讲题是简单任务：关闭思考模式，省输出 token、更快（非思考模式才支持 temperature）
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildPrompt(question, subject || '语文', grade, answer) }],
  };

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + dk },
      body: JSON.stringify(body),
    });
    const raw = await resp.text();

    if (!resp.ok) {
      // 402/422 常见于余额不足、模型名失效 —— 明确降级，不要当成故障
      return json({ ok: false, degrade: true, error: `DeepSeek 接口 ${resp.status}: ${raw.slice(0, 300)}` }, 200);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return json({ ok: false, degrade: true, error: 'DeepSeek 返回非 JSON' }, 200);
    }

    const content = parsed?.choices?.[0]?.message?.content;
    const data = normalize(extractJSON(typeof content === 'string' ? content : ''));
    if (!data) {
      return json({
        ok: false,
        degrade: true,
        error: '模型没返回可解析的讲题结果（可重试）',
        raw: String(content || '').slice(0, 200),
      }, 200);
    }
    return json({ ok: true, data, used: quota.cnt });
  } catch (e) {
    return json({ ok: false, degrade: true, error: '调用 DeepSeek 失败: ' + String(e) }, 200);
  }
});
