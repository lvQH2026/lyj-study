// ============================================================
// AI 拍图批改（v67）
// ------------------------------------------------------------
// 拍照 / 选图 → 上传 Supabase Storage → Edge Function 调智谱
// GLM-4V-Flash 批改 → 返回结构化结果 → canvas 合成手写批注
// → PNG 下载 → 错题入库。
//
// 没有 API Key / 网络不通 / 模型返回异常时，自动降级为「半自动」：
// 前端用水平投影切出题目块，人工点选对 / 半对 / 错，共用同一套
// 批注引擎、算分逻辑、PNG 导出和错题库。
// ============================================================
window.AI_GRADE = (function () {
  'use strict';

  // ---------- 配置 ----------
  const BUCKET = 'papers';
  const MAX_EDGE = 1600;          // 上传前压缩到最长边
  const JPG_QUALITY = 0.86;
  const HAND_FONT = '"楷体", KaiTi, STKaiti, "Kaiti SC", "Xingkai SC", "STKaiti SC", serif';
  const INK = '#D93025';          // 红笔主色（老师最常用的红）
  const INK_DARK = '#B71C1C';
  const PENCIL = '#1F4E79';       // 蓝笔（写正确答案用）

  // ---------- 运行时状态 ----------
  const S = {
    file: null,
    srcURL: null,        // 本地 objectURL，用于 canvas 绘制（同源，不受 CORS 限制）
    img: null,           // HTMLImageElement
    W: 0, H: 0,
    remoteURL: null,     // Storage 公开 URL（给 AI 与存储用）
    subject: '数学',
    grade: '',
    mode: 'ai',          // ai | manual
    busy: false,
    result: null,        // { subject,totalScore,earnedScore,level,comment,questions[] }
    blocks: [],          // 半自动模式切出的题块 [{y0,y1,status,box}]
    canvas: null,
    ctx: null,
    showOverlay: true,
  };

  // ============================================================
  // 工具
  // ============================================================
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const jit = (amp) => (Math.random() - 0.5) * 2 * amp;
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function cfg() {
    return (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) ? window.APP_CONFIG : null;
  }
  function sbUrl() { const c = cfg(); return c ? c.SUPABASE_URL.replace(/\/+$/, '') : ''; }
  function sbKey() { const c = cfg(); return c ? c.SUPABASE_ANON_KEY : ''; }

  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
    else if (window.alert) { /* 静默 */ }
  }

  // ============================================================
  // 一、读取图片并压缩
  // ============================================================
  function loadImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  }

  function compress(img, mime) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const W = Math.max(1, Math.round(w * scale));
    const H = Math.max(1, Math.round(h * scale));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const cx = cv.getContext('2d');
    if (!cx) throw new Error('当前浏览器不支持画布，无法批改');
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, W, H);
    cx.drawImage(img, 0, 0, W, H);
    return { canvas: cv, W, H, type: mime || 'image/jpeg' };
  }

  function canvasToBlob(cv, type, q) {
    return new Promise((res) => {
      try { cv.toBlob((b) => res(b), type || 'image/jpeg', q || JPG_QUALITY); }
      catch (e) { res(null); }
    });
  }

  // ============================================================
  // 二、上传到 Supabase Storage（拿公开 URL）
  // ============================================================
  async function uploadToStorage(blob) {
    const base = sbUrl(), key = sbKey();
    if (!base || !key) throw new Error('未配置 Supabase');
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const path = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}/` +
                 `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const resp = await fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        apikey: key,
        'Content-Type': blob.type || 'image/jpeg',
        'x-upsert': 'true',
        'cache-control': '3600',
      },
      body: blob,
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error('上传失败 ' + resp.status + ' ' + t.slice(0, 120));
    }
    return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  // ============================================================
  // 三、调用 Edge Function 让 AI 批改
  // ============================================================
  async function callGradeAPI(imageUrl, subject, grade) {
    const base = sbUrl(), key = sbKey();
    if (!base || !key) throw new Error('未配置 Supabase');
    const resp = await fetch(`${base}/functions/v1/ai-grade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, subject, grade, hint: '' }),
    });
    if (!resp.ok) throw new Error('批改服务 ' + resp.status);
    return await resp.json();
  }

  // ============================================================
  // 四、半自动：水平投影切题块
  // ============================================================
  function detectBlocks(cv) {
    const W = cv.width, H = cv.height;
    const cx = cv.getContext('2d');
    let data;
    try { data = cx.getImageData(0, 0, W, H).data; }
    catch (e) { return []; }

    // 逐行统计「暗像素」数量
    const rows = new Array(H).fill(0);
    for (let y = 0; y < H; y++) {
      let c = 0;
      const base = y * W * 4;
      for (let x = 0; x < W; x++) {
        const i = base + x * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < 150) c++;
      }
      rows[y] = c;
    }

    const thr = Math.max(2, W * 0.008);   // 一行至少这么多暗像素才算「有内容」
    const minH = Math.max(10, H * 0.012); // 太矮的行段忽略（噪点/横线）
    const raw = [];
    let s = -1;
    for (let y = 0; y < H; y++) {
      if (rows[y] > thr) { if (s < 0) s = y; }
      else {
        if (s >= 0) { if (y - s >= minH) raw.push([s, y]); s = -1; }
      }
    }
    if (s >= 0 && H - s >= minH) raw.push([s, H]);

    // 合并间隙很小的相邻块（同一题被切碎）
    const gap = Math.max(4, H * 0.006);
    const merged = [];
    raw.forEach((b) => {
      const last = merged[merged.length - 1];
      if (last && b[0] - last[1] < gap) last[1] = b[1];
      else merged.push([b[0], b[1]]);
    });

    return merged.slice(0, 40).map((b, i) => ({
      no: String(i + 1),
      y0: b[0], y1: b[1],
      box: [0.03, b[0] / H, 0.94, (b[1] - b[0]) / H],
      status: 'unanswered',
      text: '第 ' + (i + 1) + ' 题',
      note: '',
      maxScore: 0,
      score: 0,
    }));
  }

  // ============================================================
  // 五、手写批注引擎（canvas）
  // ============================================================
  // Catmull-Rom 插值成密集点，逐点抖动 → 像手抖的笔迹
  function inkStroke(ctx, pts, amp, width, color) {
    if (pts.length < 2) return;
    const P = [pts[0]].concat(pts, [pts[pts.length - 1]]);
    const out = [];
    for (let i = 0; i < P.length - 3; i++) {
      const p0 = P[i], p1 = P[i + 1], p2 = P[i + 2], p3 = P[i + 3];
      for (let t = 0; t < 1; t += 0.08) {
        const t2 = t * t, t3 = t2 * t;
        const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        out.push([x + jit(amp), y + jit(amp)]);
      }
    }
    out.push([pts[pts.length - 1][0] + jit(amp * 0.5), pts[pts.length - 1][1] + jit(amp * 0.5)]);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(out[0][0], out[0][1]);
    for (let i = 1; i < out.length; i++) ctx.lineTo(out[i][0], out[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  // 对勾 √：下行到低点再右上出锋，分两笔更像真人
  function drawCheck(ctx, x, y, s, color) {
    const w = s * 0.115;
    inkStroke(ctx, [[x, y], [x + s * 0.12, y + s * 0.26], [x + s * 0.34, y + s * 0.46]], s * 0.012, w, color);
    inkStroke(ctx, [[x + s * 0.32, y + s * 0.45], [x + s * 0.62, y + s * 0.16], [x + s * 0.86, y - s * 0.22], [x + s * 1.0, y - s * 0.5]], s * 0.014, w * 0.92, color);
  }

  // 叉 ×：两笔交叉
  function drawCross(ctx, x, y, s, color) {
    const w = s * 0.11;
    inkStroke(ctx, [[x, y], [x + s * 0.4, y + s * 0.36], [x + s * 0.78, y + s * 0.72]], s * 0.013, w, color);
    inkStroke(ctx, [[x + s * 0.8, y], [x + s * 0.42, y + s * 0.36], [x + s * 0.04, y + s * 0.74]], s * 0.013, w, color);
  }

  // 半对：勾 + 一点，表示「部分正确」
  function drawHalf(ctx, x, y, s, color) {
    drawCheck(ctx, x, y, s * 0.82, color);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + s * 1.12, y - s * 0.3, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 未作答：问号
  function drawQuestionMark(ctx, x, y, s, color) {
    const w = s * 0.1;
    inkStroke(ctx, [[x, y], [x + s * 0.26, y - s * 0.14], [x + s * 0.42, y + s * 0.02], [x + s * 0.28, y + s * 0.22], [x + s * 0.3, y + s * 0.4]], s * 0.012, w, color);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + s * 0.3, y + s * 0.62, s * 0.062, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 手画圈：不闭合的椭圆，圈住错误处
  function drawCircle(ctx, cx, cy, rx, ry, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const turns = 1.06;                 // 略超一圈，收笔压过起笔
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = -0.35 + t * Math.PI * 2 * turns;
      const x = cx + Math.cos(a) * rx + jit(rx * 0.035);
      const y = cy + Math.sin(a) * ry + jit(ry * 0.05);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 波浪线：表扬用
  function drawWave(ctx, x, y, w, amp, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const px = x + w * t;
      const py = y + Math.sin(t * Math.PI * 4) * amp + jit(amp * 0.15);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 手写体文字
  function inkText(ctx, text, x, y, size, color, font) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'italic ' + size + 'px ' + (font || HAND_FONT);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    // 轻微旋转，避免机械感
    const chars = String(text).split('');
    let cx = x;
    chars.forEach((ch) => {
      ctx.save();
      ctx.translate(cx, y);
      ctx.rotate(jit(0.035));
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      cx += ctx.measureText(ch).width;
    });
    ctx.restore();
  }

  // 分数印章：双圈 + 大数字 + 「分」
  function drawScoreStamp(ctx, cx, cy, R, score, total, level) {
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = R * 0.075;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = R * 0.035;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    const fs = R * (String(score).length >= 3 ? 0.78 : 0.95);
    ctx.fillStyle = INK;
    ctx.font = 'italic bold ' + fs + 'px ' + HAND_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(cx, cy - R * 0.06);
    ctx.rotate(-0.06);
    ctx.fillText(String(score), 0, 0);
    ctx.restore();

    if (level) {
      ctx.font = 'italic ' + R * 0.34 + 'px ' + HAND_FONT;
      ctx.fillText(level, cx, cy + R * 0.52);
    }
    ctx.restore();
  }

  // ============================================================
  // 六、把批注合成到原图上
  // ============================================================
  function render() {
    const cv = S.canvas;
    if (!cv || !S.img) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height;
    const k = Math.max(W, H) / 1000;      // 笔迹缩放系数
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(S.img, 0, 0, W, H);

    if (!S.showOverlay) return;

    const list = S.result ? S.result.questions : [];

    // --- 逐题批注 ---
    list.forEach((q) => {
      const box = q.box || [0.05, 0.5, 0.5, 0.05];
      const bx = box[0] * W, by = box[1] * H;
      const bw = box[2] * W, bh = box[3] * H;

      // 错题圈注（在题块右侧留白处画圈）
      if (q.status === 'wrong' || q.status === 'partial') {
        const rx = bw * 0.13, ry = Math.max(bh * 0.42, k * 14);
        const cx0 = Math.min(W - rx - k * 8, bx + bw - rx * 0.9);
        const cy0 = by + bh * 0.5;
        drawCircle(ctx, cx0, cy0, rx, ry, INK, k * 2.4);
      }

      // 判定符号：放在题块右端外侧
      const ms = Math.max(k * 26, Math.min(bh * 0.9, k * 46));
      let mx = bx + bw + k * 10;
      if (mx + ms > W - k * 6) mx = Math.max(k * 6, W - ms - k * 6);
      const my = by + bh * 0.5 - ms * 0.35;

      if (q.status === 'correct') {
        drawCheck(ctx, mx, my, ms, INK);
        // 特别好的题给波浪表扬
        if (/很棒|正确|好/.test(q.note || '')) {
          drawWave(ctx, bx + bw * 0.1, by + bh * 0.92, bw * 0.6, k * 2.2, INK, k * 2);
        }
      } else if (q.status === 'wrong') {
        drawCross(ctx, mx, my, ms, INK);
      } else if (q.status === 'partial') {
        drawHalf(ctx, mx, my, ms, INK);
      } else {
        drawQuestionMark(ctx, mx, my, ms * 0.8, INK);
      }

      // 旁批（红笔小字，写在题块右侧或下方）
      if (q.note) {
        const fs = Math.max(k * 18, 12, Math.min(bh * 0.42, k * 24));
        // 优先写在符号下方，竖向排不下的话写字号小一点
        let nx = mx, ny = my + ms * 1.1;
        if (ny > H - k * 10) ny = by + bh * 0.95;
        if (nx + String(q.note).length * fs * 0.6 > W - k * 6) {
          nx = Math.max(k * 6, W - String(q.note).length * fs * 0.62 - k * 6);
        }
        inkText(ctx, q.note, nx, ny, fs, INK_DARK);
      }

      // 错题在旁边补一个正确答案（蓝笔），像老师订正示范
      if ((q.status === 'wrong' || q.status === 'partial') && q.correctAnswer) {
        const fs = Math.max(k * 16, 11, Math.min(bh * 0.34, k * 21));
        const txt = '正解:' + q.correctAnswer;
        let nx = bx + k * 4;
        let ny = by + bh + fs * 1.05;
        if (ny > H - k * 6) ny = by + bh * 0.9;
        inkText(ctx, txt, nx, ny, fs, PENCIL, '"楷体", KaiTi, STKaiti, serif');
      }
    });

    // --- 右上角分数印章 ---
    if (S.result) {
      const R = k * 52;
      drawScoreStamp(
        ctx,
        W - R - k * 26,
        R + k * 26,
        R,
        S.result.earnedScore,
        S.result.totalScore,
        S.result.level || ''
      );
      // 日期
      const d = new Date();
      const ds = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      inkText(ctx, ds, W - R * 2 - k * 46, R * 2 + k * 58, k * 17, INK_DARK);
    }

    // --- 底部总评语 ---
    if (S.result && S.result.comment) {
      const fs = k * 22;
      const maxW = W - k * 40;
      const chars = S.result.comment.split('');
      const lines = [];
      let cur = '';
      ctx.save();
      ctx.font = 'italic ' + fs + 'px ' + HAND_FONT;
      chars.forEach((ch) => {
        const t = cur + ch;
        if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = ch; }
        else cur = t;
      });
      if (cur) lines.push(cur);
      ctx.restore();

      const lineH = fs * 1.55;
      const blockH = lines.length * lineH + k * 18;
      // 半透明白底，保证评语看得清
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillRect(0, H - blockH - k * 10, W, blockH + k * 10);
      ctx.strokeStyle = 'rgba(217,48,37,0.35)';
      ctx.lineWidth = k * 1.6;
      ctx.beginPath();
      ctx.moveTo(k * 14, H - blockH - k * 10);
      ctx.lineTo(W - k * 14, H - blockH - k * 10);
      ctx.stroke();
      ctx.restore();

      lines.forEach((ln, i) => {
        inkText(ctx, ln, k * 22, H - blockH + i * lineH + fs * 1.1, fs, INK_DARK);
      });
    }
  }

  // ============================================================
  // 七、主流程
  // ============================================================
  async function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('请选择图片文件'); return; }
    if (file.size > 20 * 1024 * 1024) { toast('图片太大了，请换一张 20MB 以内的'); return; }
    if (S.busy) return;
    S.busy = true;
    S.file = file;
    S.result = null;
    S.blocks = [];
    S.remoteURL = null;

    const st = $('gradeStatus');
    const setStatus = (t) => { if (st) st.innerHTML = t; };

    try {
      setStatus('<div class="gz-loading">正在读取图片…</div>');
      const { img, url } = await loadImage(file);
      S.img = img;
      S.srcURL = url;

      const cm = compress(img, 'image/jpeg');
      S.canvas = cm.canvas;
      S.W = cm.W; S.H = cm.H;
      const blob = await canvasToBlob(cm.canvas, 'image/jpeg', JPG_QUALITY);

      // 先把预览画出来（无批注），让用户立刻看到图
      const holder = $('gradeCanvasHolder');
      if (holder) {
        holder.innerHTML = '';
        holder.appendChild(S.canvas);
        S.canvas.className = 'gz-canvas';
        S.canvas.addEventListener('click', onCanvasClick);
      }
      const wrap = $('gradeCanvasWrap');
      if (wrap) wrap.style.display = 'block';
      render();

      // 上传 → 拿公开 URL
      let remote = null;
      if (cfg()) {
        try {
          setStatus('<div class="gz-loading">正在上传图片…</div>');
          remote = await uploadToStorage(blob);
          S.remoteURL = remote;
        } catch (e) {
          console.warn('[aiGrade] 上传失败:', e);
          setStatus('<div class="gz-warn">图片上传失败，转为「半自动批改」<br><span class="u-fs12">' +
            esc(e.message) + '</span></div>');
          return enterManual('图片上传失败');
        }
      } else {
        setStatus('<div class="gz-warn">未配置云存储，转为「半自动批改」</div>');
        return enterManual('未配置云存储');
      }

      // 调 AI 批改
      setStatus('<div class="gz-loading">AI 老师正在批改…<br><span class="u-fs12 u-op75">大约需要 10~30 秒</span></div>');
      let res;
      try {
        res = await callGradeAPI(remote, S.subject, S.grade);
      } catch (e) {
        console.warn('[aiGrade] 批改服务异常:', e);
        setStatus('<div class="gz-warn">批改服务不可用，转为「半自动批改」<br><span class="u-fs12">' +
          esc(e.message) + '</span></div>');
        return enterManual('服务不可用');
      }

      if (res && res.ok && res.data) {
        S.mode = 'ai';
        S.result = res.data;
        setStatus('<div class="gz-ok">批改完成，共 ' + S.result.questions.length + ' 题</div>');
        render();
        renderResult();
      } else {
        const why = (res && res.error) ? res.error : '模型未返回结果';
        console.warn('[aiGrade] 降级:', why);
        setStatus('<div class="gz-warn">AI 批改未成功，转为「半自动批改」<br><span class="u-fs12">' +
          esc(why) + '</span></div>');
        enterManual(why);
      }
    } catch (e) {
      console.error('[aiGrade]', e);
      setStatus('<div class="gz-warn">出错了：' + esc(e.message) + '</div>');
    } finally {
      S.busy = false;
    }
  }

  // ---------- 进入半自动模式 ----------
  function enterManual(reason) {
    S.mode = 'manual';
    S.result = null;
    if (!S.canvas) return;
    S.blocks = detectBlocks(S.canvas);
    if (!S.blocks.length) {
      S.blocks = [{
        no: '1', y0: 0, y1: S.canvas.height,
        box: [0.03, 0, 0.94, 1], status: 'unanswered',
        text: '整页', note: '', maxScore: 0, score: 0,
      }];
    }
    recomputeManualScore();
    render();
    renderResult(reason);
  }

  function recomputeManualScore() {
    const n = S.blocks.length || 1;
    const each = Math.round((100 / n) * 10) / 10;
    let earned = 0;
    S.blocks.forEach((b) => {
      b.maxScore = each;
      if (b.status === 'correct') b.score = each;
      else if (b.status === 'partial') b.score = Math.round(each * 0.5 * 10) / 10;
      else b.score = 0;
      earned += b.score;
    });
    S.result = {
      subject: S.subject,
      totalScore: 100,
      earnedScore: Math.round(earned * 10) / 10,
      level: '',
      comment: '',
      questions: S.blocks,
    };
  }

  // 半自动模式下点画布切题块状态：未判 → 错 → 半对 → 对 → 未判
  const CYCLE = ['unanswered', 'wrong', 'partial', 'correct'];
  function onCanvasClick(ev) {
    if (S.mode !== 'manual') return;
    const cv = S.canvas;
    const r = cv.getBoundingClientRect();
    const y = (ev.clientY - r.top) / r.height * cv.height;
    let hit = null, best = 1e9;
    S.blocks.forEach((b) => {
      if (y >= b.y0 - 6 && y <= b.y1 + 6) {
        const d = Math.abs(y - (b.y0 + b.y1) / 2);
        if (d < best) { best = d; hit = b; }
      }
    });
    if (!hit) return;
    const i = CYCLE.indexOf(hit.status);
    hit.status = CYCLE[(i + 1) % CYCLE.length];
    recomputeManualScore();
    render();
    renderResult();
  }

  // ============================================================
  // 八、结果面板渲染
  // ============================================================
  function renderResult(degradeReason) {
    const box = $('gradeResult');
    if (!box) return;
    const r = S.result;
    if (!r) { box.innerHTML = ''; return; }

    const rate = r.totalScore ? Math.round(r.earnedScore / r.totalScore * 100) : 0;
    const lv = r.level || (rate >= 90 ? '优' : rate >= 80 ? '良' : rate >= 60 ? '及格' : '待努力');
    const wrongN = r.questions.filter((q) => q.status === 'wrong' || q.status === 'partial').length;
    const correctN = r.questions.filter((q) => q.status === 'correct').length;

    let h = '';

    // 分数卡
    h += `<div class="gz-score-card">
      <div class="gz-score-num">${r.earnedScore}<span>/${r.totalScore}</span></div>
      <div class="gz-score-meta">
        <div class="gz-score-lv">${esc(lv)}</div>
        <div class="gz-score-sub">正确率 ${rate}% · 对 ${correctN} 题 · 错 ${wrongN} 题</div>
      </div>
    </div>`;

    if (S.mode === 'manual') {
      h += `<div class="gz-tip">
        <strong>半自动批改</strong>：AI 未接管${degradeReason ? '（' + esc(degradeReason) + '）' : ''}。
        在图上<strong>点一下题目所在的行</strong>，即可在「错 → 半对 → 对 → 未判」之间切换，系统自动算分并画批注。
      </div>`;
    }

    // 逐题列表
    h += '<div class="gz-q-list">';
    r.questions.forEach((q, i) => {
      const tag = q.status === 'correct' ? '<span class="gz-tag ok">对</span>'
        : q.status === 'partial' ? '<span class="gz-tag half">半对</span>'
        : q.status === 'wrong' ? '<span class="gz-tag no">错</span>'
        : '<span class="gz-tag none">未判</span>';
      h += `<div class="gz-q" data-i="${i}">
        <div class="gz-q-head">
          <span class="gz-q-no">${esc(q.no || (i + 1))}</span>${tag}
          <span class="gz-q-score">${q.score}/${q.maxScore}</span>
        </div>
        <div class="gz-q-text">${esc(q.text || '（未识别到题干）')}</div>
        ${(q.studentAnswer || q.correctAnswer) ? `<div class="gz-q-ans">
          你的答案：<b>${esc(q.studentAnswer || '空')}</b>
          ${q.correctAnswer ? `　正确答案：<b class="gz-right">${esc(q.correctAnswer)}</b>` : ''}
        </div>` : ''}
        ${q.note ? `<div class="gz-q-note">${esc(q.note)}</div>` : ''}
        ${S.mode === 'manual' ? `<div class="gz-q-ops">
          <button class="gz-mini" onclick="AI_GRADE.setStatus(${i},'correct')">对</button>
          <button class="gz-mini" onclick="AI_GRADE.setStatus(${i},'partial')">半对</button>
          <button class="gz-mini" onclick="AI_GRADE.setStatus(${i},'wrong')">错</button>
          <button class="gz-mini ghost" onclick="AI_GRADE.setStatus(${i},'unanswered')">清除</button>
        </div>` : ''}
      </div>`;
    });
    h += '</div>';

    // 操作按钮
    h += `<div class="gz-actions">
      <button class="btn btn-primary" onclick="AI_GRADE.downloadPNG()">下载批改后的试卷</button>
      <button class="btn btn-outline" onclick="AI_GRADE.toggleOverlay()">${S.showOverlay ? '只看原图' : '显示批注'}</button>
      <button class="btn btn-outline" onclick="AI_GRADE.savePaper()">${wrongN ? '把 ' + wrongN + ' 道错题加入错题库' : '保存批改记录'}</button>
      <button class="btn btn-ghost" onclick="AI_GRADE.reset()">重新批改</button>
    </div>`;

    box.innerHTML = h;
  }

  function setStatus(i, st) {
    if (S.mode !== 'manual') return;
    if (!S.blocks[i]) return;
    S.blocks[i].status = st;
    recomputeManualScore();
    render();
    renderResult();
  }

  function toggleOverlay() {
    S.showOverlay = !S.showOverlay;
    render();
    renderResult();
  }

  // ============================================================
  // 九、PNG 导出
  // ============================================================
  async function downloadPNG() {
    if (!S.canvas) { toast('还没有批改结果'); return; }
    const prev = S.showOverlay;
    S.showOverlay = true;
    render();
    S.showOverlay = prev;

    const blob = await canvasToBlob(S.canvas, 'image/png', 1);
    if (!blob) { toast('导出失败，请重试'); return; }
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const name = `批改_${S.subject}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.png`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast('已保存：' + name);
    render();
  }

  // ============================================================
  // 十、保存记录 + 错题入库
  // ============================================================
  function savePaper() {
    if (!S.result) { toast('还没有批改结果'); return; }
    let data;
    try { data = JSON.parse(localStorage.getItem('math_practice_data')) || {}; }
    catch (e) { data = {}; }
    if (!data.papers) data.papers = [];
    if (!data.wrong) data.wrong = [];

    const id = 'P' + Date.now();
    const r = S.result;
    const paper = {
      id,
      time: Date.now(),
      module: S.subject,
      subject: S.subject,
      grade: S.grade || '',
      mode: S.mode,
      imageUrl: S.remoteURL || '',
      totalScore: r.totalScore,
      earnedScore: r.earnedScore,
      level: r.level || '',
      comment: r.comment || '',
      questions: r.questions.map((q) => ({
        no: q.no, text: q.text, type: q.type || '',
        studentAnswer: q.studentAnswer || '', correctAnswer: q.correctAnswer || '',
        status: q.status, score: q.score, maxScore: q.maxScore,
        box: q.box, note: q.note || '',
      })),
    };
    data.papers.unshift(paper);
    if (data.papers.length > 60) data.papers = data.papers.slice(0, 60);

    // 错题入错题库
    let added = 0;
    paper.questions.forEach((q, idx) => {
      if (q.status !== 'wrong' && q.status !== 'partial') return;
      const question = {
        type: 'fill',
        question: '[' + S.subject + '·拍图批改] ' + (q.text || ('第 ' + (q.no || idx + 1) + ' 题')),
        answer: q.correctAnswer || '（见原卷）',
        _paperId: id,
        _paperUrl: paper.imageUrl,
        _box: q.box,
        _note: q.note,
        _studentAnswer: q.studentAnswer,
        _from: 'photo',
      };
      const dup = data.wrong.find((w) =>
        w.module === S.subject &&
        w.question && w.question.question === question.question &&
        w.question.answer === question.answer);
      if (dup) {
        dup.count = (dup.count || 1) + 1;
        dup.lastWrong = Date.now();
      } else {
        data.wrong.push({
          id: id + '_' + idx,
          module: S.subject,
          question,
          userAnswer: q.studentAnswer || '',
          unitName: '拍图批改',
          grade: S.grade || '',
          time: Date.now(),
          count: 1,
        });
        added++;
      }
    });

    try {
      localStorage.setItem('math_practice_data', JSON.stringify(data));
    } catch (e) {
      toast('存储空间不足，保存失败');
      return;
    }
    toast(added ? `已保存，${added} 道错题已加入错题库` : '批改记录已保存');
    if (typeof renderRecent === 'function') { try { renderRecent(); } catch (e) {} }
    renderHistory();
  }

  // ============================================================
  // 十·补 批改历史
  // ============================================================
  function renderHistory() {
    const box = $('gradeHistory');
    if (!box) return;
    const list = listPapers();
    if (!list.length) { box.innerHTML = ''; return; }
    const dt = (t) => {
      const d = new Date(t);
      const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    const shown = list.slice(0, 12);
    let h = `<div class="section-title u-mt4">批改记录</div><div class="card">`;
    shown.forEach((p) => {
      const rate = p.totalScore ? Math.round(p.earnedScore / p.totalScore * 100) : 0;
      const wrongN = (p.questions || []).filter((q) => q.status === 'wrong' || q.status === 'partial').length;
      h += `<div class="gz-hist">
        <div class="gz-hist-l">
          <div class="gz-hist-t">${esc(p.subject)} · ${p.earnedScore}/${p.totalScore} 分</div>
          <div class="gz-hist-s">${dt(p.time)} · 正确率 ${rate}% · 错题 ${wrongN} 道 · ${p.mode === 'ai' ? 'AI 批改' : '半自动'}</div>
        </div>
        ${p.imageUrl ? `<button class="gz-mini" onclick="window.open('${esc(p.imageUrl)}','_blank')">看原卷</button>` : ''}
      </div>`;
    });
    h += `</div>`;
    box.innerHTML = h;
  }

  // ============================================================
  // 十一、重置 / 学科切换
  // ============================================================
  function reset() {
    if (S.srcURL) { try { URL.revokeObjectURL(S.srcURL); } catch (e) {} }
    S.file = null; S.srcURL = null; S.img = null;
    S.result = null; S.blocks = []; S.remoteURL = null;
    S.canvas = null; S.showOverlay = true; S.busy = false;
    const holder = $('gradeCanvasHolder');
    if (holder) holder.innerHTML = '';
    const wrap = $('gradeCanvasWrap');
    if (wrap) wrap.style.display = 'none';
    const box = $('gradeResult');
    if (box) box.innerHTML = '';
    const st = $('gradeStatus');
    if (st) st.innerHTML = '';
    const fi = $('fileInput');
    if (fi) fi.value = '';
  }

  function setSubject(sub) {
    S.subject = sub;
    document.querySelectorAll('.gz-sub-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.sub === sub);
    });
  }

  function init() {
    const fi = $('fileInput');
    if (fi) {
      fi.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        handleFile(f);
      });
    }
    document.querySelectorAll('.gz-sub-btn').forEach((b) => {
      b.addEventListener('click', () => setSubject(b.dataset.sub));
    });
    setSubject('数学');
  }

  return {
    init, handleFile, setSubject, setStatus, toggleOverlay,
    downloadPNG, savePaper, reset, render, renderHistory,
    get state() { return S; },
    // 供错题库/家长端查看原卷
    getPaper(id) {
      try {
        const d = JSON.parse(localStorage.getItem('math_practice_data')) || {};
        return (d.papers || []).find((p) => p.id === id) || null;
      } catch (e) { return null; }
    },
    listPapers() {
      try {
        const d = JSON.parse(localStorage.getItem('math_practice_data')) || {};
        return d.papers || [];
      } catch (e) { return []; }
    },
  };
})();
