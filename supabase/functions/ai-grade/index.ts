// ============================================================
// Supabase Edge Function: ai-grade
// ------------------------------------------------------------
// 作用：代理调用智谱 GLM-4V-Flash 视觉大模型批改试卷。
//
// 为什么必须经过这一层（不能从浏览器直连智谱）：
//   1) 智谱 API 的 CORS 响应头为 null，浏览器 fetch 直接被拦；
//   2) API Key 放前端等于公开，会被盗刷。
//
// 输入：POST { imageUrl, subject?, grade?, hint? }
// 输出：{ ok:true, data:{...} } 或 { ok:false, error, degrade:true }
//      degrade=true 时前端自动降级为「半自动批改」（人工标对错）。
//
// 部署：
//   supabase secrets set ZHIPU_API_KEY=xxxx --project-ref wrgupojuxnkgwbiddbsv
//   supabase functions deploy ai-grade --project-ref wrgupojuxnkgwbiddbsv
// ============================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ZHIPU_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = Deno.env.get('ZHIPU_VL_MODEL') || 'glm-4v-flash';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

// ---------- Prompt：要求模型只输出 JSON ----------
function buildPrompt(subject: string, grade: string, hint: string) {
  const rules: Record<string, string> = {
    数学:
      '判分规则：口算/竖式/脱式/填空看最终结果，结果对即满分；应用题列式对但计算错扣一半分，' +
      '单位和答语缺失扣 0.5 分；几何作图题按图形要素是否齐全给分。',
    语文:
      '判分规则：看拼音写词语、组词、按课文填空以标准答案为准，错别字每个扣 0.5 分；' +
      '选择题按选项；阅读理解按要点给分，答到要点即给分；习作按内容、语句、格式三档给分' +
      '（优秀/良好/待改进），并在 note 里写 1 条最该改的地方。',
    英语:
      '判分规则：单词拼写大小写错误每个扣 0.5 分；选择题按选项；填空按标准答案；' +
      '句型转换看语法正确性。',
  };
  const rule = rules[subject] || rules['数学'];

  return `你是中国小学${grade || ''}的资深${subject}老师，正在批改一份学生做完的试卷照片。请逐题认真批改。

【判分标准】${rule}

【输出要求】只输出一个 JSON 对象，不要任何解释文字、不要 markdown 代码块标记。格式如下：
{
  "subject": "${subject}",
  "totalScore": 100,
  "earnedScore": 82,
  "level": "良",
  "comment": "两句话以内的总评，用老师批改作业的真实口吻，先肯定再指出最该改的地方",
  "questions": [
    {
      "no": "1",
      "text": "题干原文（过长可缩写到20字内）",
      "type": "口算",
      "studentAnswer": "学生实际写的答案（留空则写空字符串）",
      "correctAnswer": "正确答案",
      "status": "wrong",
      "score": 0,
      "maxScore": 2,
      "box": [0.10, 0.30, 0.50, 0.06],
      "note": "给学生的旁批，10字以内，如：进位错了、单位漏写、这一步很棒"
    }
  ]
}

【字段说明】
- status 只能是 correct / partial / wrong / unanswered 之一
- box 是该题在整张图上的位置，归一化坐标 [x, y, w, h]，取值 0~1，(x,y) 是左上角，w/h 是宽高占比
- score 是实得分，maxScore 是该题满分；所有题 maxScore 相加应等于 totalScore
- 如果卷面题数很多，最多批改 30 题，把分值按比例摊到这些题上
${hint ? '【补充说明】' + hint : ''}`;
}

// ---------- 从模型输出里抠出 JSON ----------
function extractJSON(raw: string): any {
  if (!raw) return null;
  let s = raw.trim();
  // 去掉 ```json ... ``` 包裹
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  // 截取第一个 { 到最后一个 }
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try {
    return JSON.parse(s);
  } catch (_) {
    // 模型偶尔在数组里多一个逗号，做一次宽松修复
    try {
      return JSON.parse(s.replace(/,\s*([}\]])/g, '$1'));
    } catch (__) {
      return null;
    }
  }
}

// ---------- 校验并规整结果 ----------
function normalize(res: any, subject: string) {
  if (!res || !Array.isArray(res.questions)) return null;
  const qs = res.questions
    .map((q: any) => {
      const box = Array.isArray(q.box) && q.box.length === 4
        ? q.box.map((n: any) => {
            const v = Number(n);
            return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
          })
        : [0.1, 0.5, 0.5, 0.05];
      const status = ['correct', 'partial', 'wrong', 'unanswered'].includes(q.status)
        ? q.status
        : 'wrong';
      const maxScore = Number(q.maxScore);
      const score = Number(q.score);
      return {
        no: String(q.no ?? ''),
        text: String(q.text ?? '').slice(0, 80),
        type: String(q.type ?? ''),
        studentAnswer: String(q.studentAnswer ?? ''),
        correctAnswer: String(q.correctAnswer ?? ''),
        status,
        score: Number.isFinite(score) ? score : 0,
        maxScore: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 1,
        box,
        note: String(q.note ?? '').slice(0, 40),
      };
    })
    .filter((q: any) => q.text || q.studentAnswer || q.correctAnswer)
    .slice(0, 40);

  if (!qs.length) return null;

  const calcTotal = qs.reduce((s: number, q: any) => s + q.maxScore, 0);
  const calcEarned = qs.reduce((s: number, q: any) => s + q.score, 0);
  const totalScore = Number(res.totalScore) > 0 ? Number(res.totalScore) : calcTotal;
  let earnedScore = Number.isFinite(Number(res.earnedScore)) ? Number(res.earnedScore) : calcEarned;
  earnedScore = Math.max(0, Math.min(totalScore, earnedScore));

  const rate = totalScore ? earnedScore / totalScore : 0;
  const level = String(res.level || '').trim() ||
    (rate >= 0.9 ? '优' : rate >= 0.8 ? '良' : rate >= 0.6 ? '及格' : '待努力');

  return {
    subject: String(res.subject || subject || '数学'),
    totalScore,
    earnedScore: Math.round(earnedScore * 10) / 10,
    level,
    comment: String(res.comment || '').slice(0, 200),
    questions: qs,
    model: MODEL,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: '仅支持 POST' }, 405);

  const key = Deno.env.get('ZHIPU_API_KEY');
  if (!key) {
    // 没配 Key —— 明确告诉前端降级，不要当成故障
    return json({ ok: false, degrade: true, error: '未配置 ZHIPU_API_KEY' }, 200);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (_) {
    return json({ ok: false, error: '请求体不是合法 JSON' }, 400);
  }

  const imageUrl = String(payload.imageUrl || '');
  if (!/^https?:\/\//.test(imageUrl)) {
    return json({ ok: false, error: 'imageUrl 缺失或不是 http(s) 地址' }, 400);
  }
  const subject = ['数学', '语文', '英语'].includes(payload.subject) ? payload.subject : '数学';
  const grade = String(payload.grade || '');
  const hint = String(payload.hint || '');

  const body = {
    model: MODEL,
    temperature: 0.2,
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: buildPrompt(subject, grade, hint) },
        ],
      },
    ],
  };

  try {
    const resp = await fetch(ZHIPU_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    const raw = await resp.text();

    if (!resp.ok) {
      // 智谱返回的错误码一并透出，方便排查配额 / Key 失效
      return json({ ok: false, degrade: true, error: `智谱接口 ${resp.status}: ${raw.slice(0, 300)}` }, 200);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return json({ ok: false, degrade: true, error: '智谱返回非 JSON' }, 200);
    }

    const content = parsed?.choices?.[0]?.message?.content;
    const data = normalize(extractJSON(typeof content === 'string' ? content : ''), subject);
    if (!data) {
      return json({
        ok: false,
        degrade: true,
        error: '模型没返回可解析的批改结果（可重试，或改用半自动批改）',
        raw: String(content || '').slice(0, 200),
      }, 200);
    }
    return json({ ok: true, data });
  } catch (e) {
    return json({ ok: false, degrade: true, error: '调用智谱失败: ' + String(e) }, 200);
  }
});
