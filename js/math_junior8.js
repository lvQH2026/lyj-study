// ============================================================
// 初中数学题库 - 人教版 2024 新版 八年级（上下册）
// 接入方式：在 math.js / math_junior.js 之后加载；文件末尾注册 KNOWLEDGE_BASE[8]
// unit 编号：八上 13-18，八下 19-24（全年级连续）
// 依赖 math.js：ri / pick / mc / mf / msc / gcd / fracStr / fmt / fig* / svg*
// 制图：几何单元一律配图（孩子抽象思维弱），图形参数与题面同源
// ============================================================
(function () {
  if (typeof KNOWLEDGE_BASE === 'undefined') return;

  const S = (typeof FIG_STROKE !== 'undefined') ? FIG_STROKE : '#3E4A63';
  const G = (typeof FIG_GOLD !== 'undefined') ? FIG_GOLD : '#B4945A';
  const F1 = 'rgba(180,148,90,0.16)', F2 = 'rgba(62,74,99,0.10)';
  function lb(x, y, t, c) { return `<text x="${x}" y="${y}" text-anchor="middle" font-size="9" font-weight="600" fill="${c || G}">${t}</text>`; }
  function dt(x, y, c) { return `<circle cx="${x}" cy="${y}" r="1.6" fill="${c || S}"/>`; }

  // ---------- 干扰项清洗（防止撞答案 / 彼此重复 / 空值） ----------
  // 把答案里的数字整体加 k（只处理「纯数值+单位」或「x = 数值」两类），否则返回 null
  function bump(ans, k) {
    const a = String(ans);
    let m = a.match(/^(-?\d+(?:\.\d+)?)(\D*)$/);
    if (m) return String((parseFloat(m[1]) + k)) + m[2];
    m = a.match(/^(x = )(-?\d+)$/);
    if (m) return m[1] + String(parseInt(m[2], 10) + k);
    return null;
  }
  const FALLBACK = ['以上都不对', '无法确定', '不一定'];
  function ds(list, ans) {
    const a = String(ans), out = [];
    (list || []).forEach(v => {
      if (v === undefined || v === null || v === '') return;
      const s = String(v);
      if (s === a || out.indexOf(s) >= 0) return;
      out.push(s);
    });
    [1, -1, 2, -2, 11, -11].forEach(k => {
      if (out.length >= 3) return;
      const c = bump(a, k);
      if (c && c !== a && out.indexOf(c) < 0) out.push(c);
    });
    FALLBACK.forEach(f => {
      if (out.length >= 3) return;
      if (f !== a && out.indexOf(f) < 0) out.push(f);
    });
    return out.slice(0, 3);
  }
  // 题目包装：自动清洗干扰项；带 svg 走 msc（图形选择题）
  function mk(it) {
    const d = ds(it.d, it.a);
    return it.s ? msc(it.q, it.s, it.a, d) : mc(it.q, it.a, d);
  }
  // 近期题面不重复：同一份卷子（连续 24 题）内尽量不出现相同题干
  const _recent = [];
  const RECENT_MAX = 24;
  function _note(q) {
    _recent.push(q);
    while (_recent.length > RECENT_MAX) _recent.shift();
  }
  function pickNew(reps) {
    for (let t = 0; t < 14; t++) {
      const it = pick(reps);
      if (_recent.indexOf(it.q) < 0) { _note(it.q); return it; }
    }
    const it = pick(reps);
    _note(it.q);
    return it;
  }

  // 通用三角形：底边 b，顶点偏左，两侧边标注 l1 / l2
  function triBase(b, l1, l2, h) {
    const bw = Math.min(84, b * 8), hh = h || 50, x0 = 18, y0 = 82, vx = x0 + bw * 0.38;
    let s = `<polygon points="${x0},${y0} ${x0 + bw},${y0} ${vx},${y0 - hh}" fill="${F1}" stroke="${S}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += dt(x0, y0) + dt(x0 + bw, y0) + dt(vx, y0 - hh);
    s += lb(x0 + bw / 2, y0 + 11, b + 'cm');
    s += lb((x0 + vx) / 2 - 6, (y0 + y0 - hh) / 2, l1 + 'cm');
    s += lb((vx + x0 + bw) / 2 + 8, (y0 + y0 - hh) / 2, l2 + 'cm');
    return s;
  }
  // 等腰三角形：底 b、腰 a，顶角标注可选
  function triIso(b, a, topDeg) {
    const bw = Math.min(80, b * 8), hh = 52, x0 = (120 - bw) / 2, y0 = 82;
    let s = `<polygon points="${x0},${y0} ${x0 + bw},${y0} ${x0 + bw / 2},${y0 - hh}" fill="${F1}" stroke="${S}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += dt(x0, y0) + dt(x0 + bw, y0) + dt(x0 + bw / 2, y0 - hh);
    s += lb(x0 + bw / 2, y0 + 11, b + 'cm');
    s += lb(x0 + bw * 0.28, y0 - hh * 0.42, a + 'cm');
    s += lb(x0 + bw * 0.72, y0 - hh * 0.42, a + 'cm');
    if (topDeg != null) s += lb(x0 + bw / 2, y0 - hh + 12, topDeg + '°');
    // 底角相等标记
    s += `<path d="M ${x0 + 9} ${y0} A 9 9 0 0 1 ${x0 + 12.4} ${y0 - 6.4}" fill="none" stroke="${G}" stroke-width="1.4"/>`;
    s += `<path d="M ${x0 + bw - 9} ${y0} A 9 9 0 0 0 ${x0 + bw - 12.4} ${y0 - 6.4}" fill="none" stroke="${G}" stroke-width="1.4"/>`;
    return s;
  }
  // 直角三角形（两直角边 a、b，斜边 c），直角标记在左底角
  function triRt(a, b, c, showC) {
    const bw = Math.min(80, b * 8), hh = Math.min(50, a * 8), x0 = 18, y0 = 82;
    let s = `<polygon points="${x0},${y0} ${x0 + bw},${y0} ${x0},${y0 - hh}" fill="${F1}" stroke="${S}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<path d="M ${x0 + 7} ${y0} L ${x0 + 7} ${y0 - 7} L ${x0} ${y0 - 7}" fill="none" stroke="${S}" stroke-width="1.2"/>`;
    s += dt(x0, y0) + dt(x0 + bw, y0) + dt(x0, y0 - hh);
    s += lb(x0 + bw / 2, y0 + 11, b + 'cm');
    s += lb(x0 - 10, y0 - hh / 2, a + 'cm');
    if (showC) s += lb(x0 + bw * 0.55, y0 - hh * 0.45, 'c');
    else s += lb(x0 + bw * 0.55, y0 - hh * 0.45, c + 'cm');
    return s;
  }
  // 平行四边形（底 b 高 h，标一个角）
  function paraFig(b, h, deg) {
    const bw = Math.min(74, b * 7), hh = Math.min(44, h * 7), x0 = 20, y0 = 82, sl = 14;
    let s = `<polygon points="${x0},${y0} ${x0 + bw},${y0} ${x0 + bw + sl},${y0 - hh} ${x0 + sl},${y0 - hh}" fill="${F2}" stroke="${S}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += lb(x0 + bw / 2, y0 + 11, b + 'cm');
    if (deg != null) s += lb(x0 + 16, y0 - 6, deg + '°');
    return s;
  }
  // 平面直角坐标系（画网格 + 一条直线 y=kx+b）
  function coordFig(k, b) {
    const ox = 60, oy = 50, u = 8;
    let s = '';
    for (let i = -6; i <= 6; i++) {
      s += `<line x1="${ox + i * u}" y1="${oy - 44}" x2="${ox + i * u}" y2="${oy + 44}" stroke="#E3DFD5" stroke-width="0.6"/>`;
      s += `<line x1="${ox - 52}" y1="${oy - i * u}" x2="${ox + 52}" y2="${oy - i * u}" stroke="#E3DFD5" stroke-width="0.6"/>`;
    }
    s += `<line x1="${ox - 52}" y1="${oy}" x2="${ox + 52}" y2="${oy}" stroke="${S}" stroke-width="1.5"/>`;
    s += `<line x1="${ox}" y1="${oy - 44}" x2="${ox}" y2="${oy + 44}" stroke="${S}" stroke-width="1.5"/>`;
    s += `<text x="${ox + 55}" y="${oy + 4}" font-size="9" fill="${S}">x</text>`;
    s += `<text x="${ox - 6}" y="${oy - 46}" font-size="9" fill="${S}">y</text>`;
    // 直线 y=kx+b，取 x=-5 与 x=5
    const y1 = oy - (k * -5 + b) * u, y2 = oy - (k * 5 + b) * u;
    const x1 = ox - 5 * u, x2 = ox + 5 * u;
    s += `<line x1="${x1}" y1="${Math.max(oy - 44, Math.min(oy + 44, y1))}" x2="${x2}" y2="${Math.max(oy - 44, Math.min(oy + 44, y2))}" stroke="${G}" stroke-width="2"/>`;
    s += dt(ox, oy, S);
    if (b !== 0) s += lb(ox + 14, oy - b * u - 4, 'b');
    return s;
  }

  // ---------- 八下专用图形 ----------
  // 直角三角形（勾股定理）：hide 传 'a'/'b'/'c' 时该边标 '?'
  function rtTri(a, b, c, hide) {
    const bw = Math.min(78, b * 7), hh = Math.min(48, a * 7), x0 = 20, y0 = 80;
    let s = `<polygon points="${x0},${y0} ${x0 + bw},${y0} ${x0},${y0 - hh}" fill="${F1}" stroke="${S}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<path d="M ${x0 + 7} ${y0} L ${x0 + 7} ${y0 - 7} L ${x0} ${y0 - 7}" fill="none" stroke="${S}" stroke-width="1.2"/>`;
    s += dt(x0, y0) + dt(x0 + bw, y0) + dt(x0, y0 - hh);
    s += lb(x0 + bw / 2, y0 + 11, hide === 'b' ? '?' : b + 'cm');
    s += lb(x0 - 9, y0 - hh / 2, hide === 'a' ? '?' : a + 'cm');
    s += lb(x0 + bw * 0.56, y0 - hh * 0.5, hide === 'c' ? '?' : c + 'cm');
    return s;
  }
  // 两个三边对应相等的三角形（全等 SSS 示意）
  function twoTri(a, b, c) {
    const x1 = 4, x2 = 64, y0 = 78, hh = 42, w = 50;
    let s = `<polygon points="${x1},${y0} ${x1 + w},${y0} ${x1 + 12},${y0 - hh}" fill="${F1}" stroke="${S}" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += `<polygon points="${x2},${y0} ${x2 + w},${y0} ${x2 + 12},${y0 - hh}" fill="${F2}" stroke="${S}" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += lb(x1 + w / 2, y0 + 11, a + 'cm') + lb(x2 + w / 2, y0 + 11, a + 'cm');
    s += lb(x1 - 1, y0 - hh * 0.55, b + 'cm') + lb(x2 - 1, y0 - hh * 0.55, b + 'cm');
    s += lb(x1 + w - 4, y0 - hh * 0.4, c + 'cm') + lb(x2 + w - 4, y0 - hh * 0.4, c + 'cm');
    return s;
  }
  // 矩形（长 w、宽 h）
  function rectFig(w, h) {
    const ww = Math.min(80, w * 7), hh = Math.min(46, h * 7), x0 = (120 - ww) / 2, y0 = 80;
    let s = `<rect x="${x0}" y="${y0 - hh}" width="${ww}" height="${hh}" fill="${F2}" stroke="${S}" stroke-width="1.8"/>`;
    s += `<path d="M ${x0 + 6} ${y0} L ${x0 + 6} ${y0 - 6} L ${x0} ${y0 - 6}" fill="none" stroke="${S}" stroke-width="1.1"/>`;
    s += lb(x0 + ww / 2, y0 + 11, w + 'cm');
    s += lb(x0 - 10, y0 - hh / 2, h + 'cm');
    return s;
  }
  // 菱形（两条对角线）
  function rhombFig(d1, d2) {
    const a = Math.min(42, d1 * 3.4), b = Math.min(34, d2 * 3.4), cx = 60, cy = 52;
    let s = `<polygon points="${cx},${cy - b} ${cx + a},${cy} ${cx},${cy + b} ${cx - a},${cy}" fill="${F1}" stroke="${S}" stroke-width="1.8" stroke-linejoin="round"/>`;
    s += `<line x1="${cx - a}" y1="${cy}" x2="${cx + a}" y2="${cy}" stroke="${G}" stroke-width="1.2" stroke-dasharray="3 2"/>`;
    s += `<line x1="${cx}" y1="${cy - b}" x2="${cx}" y2="${cy + b}" stroke="${G}" stroke-width="1.2" stroke-dasharray="3 2"/>`;
    s += lb(cx + a * 0.6, cy - 4, d1 + 'cm');
    s += lb(cx + 14, cy + b * 0.6, d2 + 'cm');
    return s;
  }
  // 条形统计图
  function barFig(vals, names) {
    const x0 = 18, y0 = 84, W = 92, H = 56, n = vals.length;
    const max = Math.max.apply(null, vals) || 1;
    const gap = W / n, bw = gap * 0.52;
    let s = `<line x1="${x0 - 4}" y1="${y0}" x2="${x0 + W}" y2="${y0}" stroke="${S}" stroke-width="1.4"/>`;
    s += `<line x1="${x0 - 4}" y1="${y0}" x2="${x0 - 4}" y2="${y0 - H}" stroke="${S}" stroke-width="1.4"/>`;
    vals.forEach((v, i) => {
      const h = Math.max(2, v / max * H), bx = x0 + gap * i + (gap - bw) / 2;
      s += `<rect x="${bx}" y="${y0 - h}" width="${bw}" height="${h}" fill="${F1}" stroke="${S}" stroke-width="1.3"/>`;
      s += lb(bx + bw / 2, y0 - h - 3, String(v));
      if (names) s += lb(bx + bw / 2, y0 + 11, names[i]);
    });
    return s;
  }
  // 折线（第22章：由散点连成的函数图象示意）
  function polylineFig(pts) {
    const ox = 60, oy = 52, u = 8;
    let s = '';
    for (let i = -6; i <= 6; i++) {
      s += `<line x1="${ox + i * u}" y1="${oy - 42}" x2="${ox + i * u}" y2="${oy + 40}" stroke="#E3DFD5" stroke-width="0.6"/>`;
      s += `<line x1="${ox - 50}" y1="${oy - i * u}" x2="${ox + 50}" y2="${oy - i * u}" stroke="#E3DFD5" stroke-width="0.6"/>`;
    }
    s += `<line x1="${ox - 50}" y1="${oy}" x2="${ox + 50}" y2="${oy}" stroke="${S}" stroke-width="1.5"/>`;
    s += `<line x1="${ox}" y1="${oy - 42}" x2="${ox}" y2="${oy + 40}" stroke="${S}" stroke-width="1.5"/>`;
    s += `<polyline points="${pts.map(p => `${ox + p[0] * u},${oy - p[1] * u}`).join(' ')}" fill="none" stroke="${G}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach(p => { s += dt(ox + p[0] * u, oy - p[1] * u, G); });
    s += `<text x="${ox + 53}" y="${oy + 4}" font-size="9" fill="${S}">x</text>`;
    s += `<text x="${ox - 6}" y="${oy - 44}" font-size="9" fill="${S}">y</text>`;
    return s;
  }
  // 非函数图象（一个 x 对应两个 y）：画一个圆
  function circleFig() {
    const ox = 60, oy = 50;
    let s = `<line x1="${ox - 50}" y1="${oy}" x2="${ox + 50}" y2="${oy}" stroke="${S}" stroke-width="1.4"/>`;
    s += `<line x1="${ox}" y1="${oy - 42}" x2="${ox}" y2="${oy + 40}" stroke="${S}" stroke-width="1.4"/>`;
    s += `<circle cx="${ox}" cy="${oy}" r="26" fill="${F1}" stroke="${G}" stroke-width="2"/>`;
    s += `<line x1="${ox + 14}" y1="${oy - 42}" x2="${ox + 14}" y2="${oy + 40}" stroke="#E57373" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    s += dt(ox + 14, oy - 22, '#E57373') + dt(ox + 14, oy + 22, '#E57373');
    return s;
  }

  // ============================================================
  // 八年级上册
  // ============================================================

  // ---- 第13章 三角形 ----
  function jr8_tri() {
    const reps = [];
    // 三边关系（能否组成三角形）
    const tri = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [7, 8, 9], [4, 5, 8], [9, 12, 15], [5, 5, 6], [8, 15, 17]];
    tri.forEach(t => {
      reps.push({ q: `三条线段的长分别是 ${t[0]}cm、${t[1]}cm、${t[2]}cm，它们（　）`, a: '能组成三角形', d: ['不能组成三角形', '只能组成等腰三角形', '无法判断'] });
      reps.push({ q: `三角形两边长分别是 ${t[0]}cm 和 ${t[1]}cm，第三边长可以是（　）`, a: `${t[2]}cm`, d: [`${t[0] + t[1] + 2}cm`, `${Math.abs(t[1] - t[0]) - 1 > 0 ? Math.abs(t[1] - t[0]) - 1 : 1}cm`, `${t[0] + t[1]}cm`] });
      reps.push({ q: `三角形三边长分别是 ${t[0]}cm、${t[1]}cm、${t[2]}cm，它的周长是（　）`, a: `${t[0] + t[1] + t[2]}cm`, d: [`${t[0] + t[1]}cm`, `${t[0] + t[1] + t[2] + 2}cm`, `${(t[0] + t[1] + t[2]) / 2}cm`] });
    });
    [[1, 2, 3], [2, 2, 5], [1, 4, 6], [3, 3, 7], [2, 5, 8], [4, 4, 9]].forEach(t => {
      reps.push({ q: `三条线段的长分别是 ${t[0]}cm、${t[1]}cm、${t[2]}cm，它们（　）`, a: '不能组成三角形', d: ['能组成三角形', '能组成直角三角形', '无法判断'] });
    });
    // 内角和
    for (let i = 0; i < 10; i++) {
      let A = ri(30, 80), B = ri(30, 90), C = 180 - A - B, g = 0;
      while ((C < 20 || C > 120) && g++ < 20) { A = ri(30, 80); B = ri(30, 90); C = 180 - A - B; }
      reps.push({ q: `三角形中 ∠A=${A}°，∠B=${B}°，则 ∠C = （　）`, a: `${C}°`, d: [`${C + 10}°`, `${C - 10}°`, `${A + B}°`] });
    }
    // 外角
    for (let i = 0; i < 8; i++) {
      let A = ri(40, 70), B = ri(40, 70), g = 0;
      while ((A === B || A === B + 10 || B === A + 10 || B === 180 - A - B) && g++ < 20) { A = ri(40, 70); B = ri(40, 70); }
      reps.push({ q: `三角形的一个外角等于 ${A + B}°，与它不相邻的一个内角是 ${A}°，则另一个不相邻内角是（　）`, a: `${B}°`, d: [`${A}°`, `${A + B}°`, `${B + 10}°`] });
    }
    reps.push({ q: '三角形的内角和等于（　）', a: '180°', d: ['90°', '270°', '360°'] });
    reps.push({ q: '三角形的一个外角等于（　）', a: '与它不相邻的两个内角的和', d: ['与它相邻的内角', '两个内角的差', '180°'] });
    reps.push({ q: '三角形的三条高所在的直线相交于一点，这点可能在（　）', a: '三角形内、外或顶点上', d: ['只在三角形内', '只在三角形外', '只在顶点上'] });
    reps.push({ q: '三角形的一条中线把三角形分成两个（　）', a: '面积相等的三角形', d: ['周长相等的三角形', '全等三角形', '直角三角形'] });
    reps.push({ q: 'n 边形的内角和公式是（　）', a: '(n−2)×180°', d: ['n×180°', '(n−1)×180°', '(n−3)×180°'] });
    // 多边形内角和
    [[4, 360], [5, 540], [6, 720], [8, 1080], [10, 1440]].forEach(p => {
      reps.push({ q: `${p[0]} 边形的内角和是（　）`, a: `${p[1]}°`, d: [`${p[1] - 180}°`, `${p[1] + 180}°`, `${p[0] * 180}°`] });
    });
    reps.push({ q: '任意多边形的外角和等于（　）', a: '360°', d: ['180°', '720°', '与边数有关'] });
    reps.push({ q: '正八边形的每个外角是（　）', a: '45°', d: ['60°', '36°', '30°'] });
    // 图形题
    let b = ri(4, 9), a1 = ri(3, 8), a2 = ri(3, 8);
    if (a1 + a2 <= b || a1 + b <= a2 || a2 + b <= a1) a2 = Math.abs(a1 - b) + 2;
    reps.push({ s: triBase(b, a1, a2), q: `如图，三角形的三边长分别是 ${b}cm、${a1}cm、${a2}cm，它的周长是（　）`, a: `${b + a1 + a2}cm`, d: [`${b + a1 + a2 + 2}cm`, `${b + a1}cm`, `${(b + a1 + a2) / 2}cm`] });
    return mk(pickNew(reps));
  }

  // ---- 第14章 全等三角形 ----
  function jr8_cong() {
    const reps = [];
    const ways = [
      ['三边分别相等', 'SSS'], ['两边和它们的夹角分别相等', 'SAS'],
      ['两角和它们的夹边分别相等', 'ASA'], ['两角和其中一个角的对边分别相等', 'AAS'],
      ['斜边和一条直角边分别相等', 'HL']
    ];
    ways.forEach(w => {
      reps.push({ q: `判定两个三角形全等的方法中，「${w[0]}」简写成（　）`, a: w[1], d: ways.filter(x => x[1] !== w[1]).slice(0, 3).map(x => x[1]) });
    });
    reps.push({ q: '下列条件中，不能判定两个三角形全等的是（　）', a: '三个角分别相等', d: ['三边分别相等', '两边及夹角分别相等', '两角及夹边分别相等'] });
    reps.push({ q: '全等三角形的对应边（　）', a: '相等', d: ['不一定相等', '成比例', '互相平行'] });
    reps.push({ q: '全等三角形的对应角（　）', a: '相等', d: ['互补', '互余', '不一定相等'] });
    reps.push({ q: '全等三角形的周长和面积（　）', a: '都相等', d: ['周长相等面积不等', '面积相等周长不等', '都不一定'] });
    // 全等求边 / 求角
    for (let i = 0; i < 12; i++) {
      let x = ri(3, 15);
      reps.push({ q: `已知 △ABC ≌ △DEF，若 AB = ${x}cm，则 DE = （　）`, a: `${x}cm`, d: [`${x + 2}cm`, `${2 * x}cm`, `${x / 2}cm`] });
    }
    for (let i = 0; i < 10; i++) {
      let d1 = ri(30, 100);
      reps.push({ q: `已知 △ABC ≌ △DEF，若 ∠A = ${d1}°，则 ∠D = （　）`, a: `${d1}°`, d: [`${180 - d1}°`, `${90 - d1}°`, `${d1 + 20}°`] });
    }
    reps.push({ q: '判定直角三角形全等特有的方法是（　）', a: 'HL', d: ['SSS', 'AAS', 'AAA'] });
    reps.push({ q: '角平分线上的点到角两边的距离（　）', a: '相等', d: ['不相等', '成比例', '无法确定'] });
    reps.push({ q: '角的内部到角两边距离相等的点，在（　）', a: '这个角的平分线上', d: ['角的外部', '角的顶点上', '无法确定'] });
    reps.push({ q: '要使两个三角形全等，至少需要（　）组元素对应相等', a: '3', d: ['2', '4', '5'] });
    reps.push({ q: '有两边和其中一边的对角对应相等的两个三角形（　）', a: '不一定全等', d: ['一定全等', '一定不全等', '一定相似'] });
        // 给具体条件判断判定方法
    const CASES = [
      ['AB = DE，BC = EF，AC = DF', 'SSS'],
      ['AB = DE，∠B = ∠E，BC = EF', 'SAS'],
      ['∠A = ∠D，AB = DE，∠B = ∠E', 'ASA'],
      ['∠A = ∠D，∠B = ∠E，BC = EF', 'AAS'],
      ['∠C = ∠F = 90°，AB = DE，AC = DF', 'HL'],
      ['AB = DE，BC = EF，∠A = ∠D', '不能判定'],
      ['∠A = ∠D，∠B = ∠E，∠C = ∠F', '不能判定']
    ];
    const WAYALL = ['SSS', 'SAS', 'ASA', 'AAS', 'HL', '不能判定'];
    CASES.forEach(c => {
      reps.push({
        q: `在 △ABC 与 △DEF 中，已知 ${c[0]}，则（　）`,
        a: c[1], d: WAYALL.filter(x => x !== c[1]).slice(0, 3)
      });
    });
    // 补一个条件使全等
    [['AB = DE，∠B = ∠E', 'BC = EF', ['AC = DF', '∠A = ∠D', '∠C = ∠F']],
    ['AB = DE，AC = DF', '∠A = ∠D', ['∠B = ∠E', 'BC = EF', '∠C = ∠F']],
    ['∠A = ∠D，∠B = ∠E', 'AB = DE', ['BC = EF', 'AC = DF', '∠C = ∠F']],
    ['∠A = ∠D，AC = DF', '∠C = ∠F', ['AB = DE', 'BC = EF', '∠B = ∠E']],
    ['∠C = ∠F = 90°，AB = DE', 'AC = DF', ['BC = EF', '∠A = ∠D', '∠B = ∠E']]].forEach(c => {
      reps.push({ q: `在 △ABC 与 △DEF 中，已知 ${c[0]}，要判定 △ABC ≌ △DEF，还需添加的条件是（　）`, a: c[1], d: c[2] });
    });
    // 角平分线性质
    for (let i = 0; i < 10; i++) {
      let d0 = ri(2, 12), e = ri(1, 5);
      reps.push({
        q: `点 P 在 ∠AOB 的平分线上，PC ⊥ OA 于 C，PC = ${d0}cm，PD ⊥ OB 于 D，则 PD = （　）`,
        a: `${d0}cm`, d: [`${d0 + e}cm`, `${d0 - e > 0 ? d0 - e : d0 + 1}cm`, `${2 * d0}cm`]
      });
    }
    // 全等 → 周长
    for (let i = 0; i < 10; i++) {
      let x = ri(3, 9), y = ri(4, 10), z = ri(5, 12);
      if (x + y <= z) z = x + y - 1;
      let per = x + y + z;
      reps.push({
        q: `△ABC ≌ △DEF，△ABC 的三边分别是 ${x}cm、${y}cm、${z}cm，则 △DEF 的周长是（　）`,
        a: `${per}cm`, d: [`${per + 2}cm`, `${x + y}cm`, `${per - 2}cm`]
      });
    }
    // 全等 → 第三个角
    for (let i = 0; i < 10; i++) {
      let A = ri(30, 70), B = ri(30, 70); if (A + B >= 170) B = 170 - A;
      let C = 180 - A - B;
      reps.push({ q: `△ABC ≌ △DEF，∠A = ${A}°，∠B = ${B}°，则 ∠F = （　）`, a: `${C}°`, d: [`${A}°`, `${B}°`, `${A + B}°`] });
    }
    reps.push({ q: '「全等」用符号表示为（　）', a: '≌', d: ['∽', '≡', '='] });
    reps.push({ q: '记两个三角形全等时，要把表示（　）的字母写在对应的位置上', a: '对应顶点', d: ['对应边', '对应角', '任意顶点'] });
    reps.push({ q: '下列命题中，正确的是（　）', a: '全等三角形的面积相等', d: ['面积相等的两个三角形全等', '周长相等的两个三角形全等', '形状相同的两个三角形全等'] });
    reps.push({ q: '平移、翻折、旋转前后的两个图形（　）', a: '全等', d: ['相似但不一定全等', '面积不同', '形状不同'] });
    reps.push({ q: '判定两个三角形全等，至少要有一组（　）对应相等', a: '边', d: ['角', '顶点', '高'] });
    // 图形题：SSS
    for (let i = 0; i < 8; i++) {
      let x = ri(3, 9), y = ri(4, 10), z = ri(5, 11);
      reps.push({ s: twoTri(x, y, z), q: `如图，两个三角形的三边分别是 ${x}cm、${y}cm、${z}cm，判定它们全等的方法是（　）`, a: 'SSS', d: ['SAS', 'ASA', 'AAS'] });
    }
return mk(pickNew(reps));
  }

  // ---- 第15章 轴对称 ----
  function jr8_axial() {
    const reps = [];
    reps.push({ q: '下列图形中，一定是轴对称图形的是（　）', a: '等腰三角形', d: ['平行四边形', '直角梯形', '一般三角形'] });
    reps.push({ q: '下列图形中，对称轴条数最多的是（　）', a: '圆', d: ['正方形', '等边三角形', '长方形'] });
    reps.push({ q: '等边三角形有（　）条对称轴', a: '3', d: ['1', '2', '4'] });
    reps.push({ q: '正方形有（　）条对称轴', a: '4', d: ['2', '3', '6'] });
    reps.push({ q: '线段有（　）条对称轴', a: '2', d: ['1', '3', '无数'] });
    reps.push({ q: '轴对称的两个图形，对应点所连线段被对称轴（　）', a: '垂直平分', d: ['平分但不垂直', '垂直但不平分', '不相交'] });
    reps.push({ q: '轴对称不改变图形的（　）', a: '形状和大小', d: ['形状', '大小', '位置'] });
    // 等腰三角形
    for (let i = 0; i < 10; i++) {
      let top = ri(30, 100 - 20); if (top % 2) top += 1;
      let base = (180 - top) / 2;
      reps.push({ q: `等腰三角形的顶角是 ${top}°，它的一个底角是（　）`, a: `${base}°`, d: [`${180 - top}°`, `${top}°`, `${base / 2}°`] });
    }
    for (let i = 0; i < 10; i++) {
      let base = ri(35, 80);
      let top = 180 - 2 * base; if (top <= 0) top = 180 - 2 * 40;
      reps.push({ q: `等腰三角形的一个底角是 ${base}°，它的顶角是（　）`, a: `${top}°`, d: [`${base}°`, `${90 - base}°`, `${180 - base}°`] });
    }
    // 边
    for (let i = 0; i < 8; i++) {
      let leg = ri(4, 14), base = ri(3, 12);
      reps.push({ q: `等腰三角形的腰长 ${leg}cm，底边长 ${base}cm，它的周长是（　）`, a: `${2 * leg + base}cm`, d: [`${leg + base}cm`, `${leg + 2 * base}cm`, `${2 * (leg + base)}cm`] });
    }
    reps.push({ q: '等腰三角形的两个底角（　）', a: '相等', d: ['互补', '互余', '不一定'] });
    reps.push({ q: '等腰三角形顶角的平分线、底边上的中线、底边上的高（　）', a: '互相重合', d: ['互相垂直', '互相平行', '长度相等'] });
    reps.push({ q: '等边三角形的每个内角是（　）', a: '60°', d: ['45°', '90°', '30°'] });
    reps.push({ q: '有一个角是 60° 的等腰三角形是（　）', a: '等边三角形', d: ['直角三角形', '钝角三角形', '无法确定'] });
    reps.push({ q: '在直角三角形中，30° 角所对的直角边等于（　）', a: '斜边的一半', d: ['另一条直角边的一半', '斜边', '另一条直角边'] });
    for (let i = 0; i < 6; i++) {
      let hy = ri(4, 12) * 2;
      reps.push({ q: `直角三角形中，30° 角所对的直角边是 ${hy / 2}cm，则斜边长是（　）`, a: `${hy}cm`, d: [`${hy / 4}cm`, `${hy * 2}cm`, `${hy / 2}cm`] });
    }
    reps.push({ q: '线段垂直平分线上的点到线段两端点的距离（　）', a: '相等', d: ['不相等', '成比例', '无法确定'] });
    // 图形题
    let base = ri(4, 10) * 2, leg = ri(4, 9), top = ri(40, 100);
    reps.push({ s: triIso(base, leg), q: `如图，等腰三角形的底边是 ${base}cm，腰长 ${leg}cm，周长是（　）`, a: `${base + 2 * leg}cm`, d: [`${base + leg}cm`, `${2 * (base + leg)}cm`, `${base + leg / 2}cm`] });
    return mk(pickNew(reps));
  }

  // ---- 第16章 整式的乘法 ----
  function jr8_mul() {
    const reps = [];
    for (let i = 0; i < 10; i++) {
      let a = ri(2, 5), m = ri(2, 6), n = ri(2, 6);
      reps.push({ q: `计算：${a}^${m} × ${a}^${n} = （　）`, a: `${a}^${m + n}`, d: [`${a}^${m * n}`, `${a}^${m - n}`, `${2 * a}^${m + n}`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 5), m = ri(2, 5), n = ri(2, 4);
      reps.push({ q: `计算：(${a}^${m})^${n} = （　）`, a: `${a}^${m * n}`, d: [`${a}^${m + n}`, `${a}^${m - n}`, `${a * n}^${m}`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 5), b = ri(2, 4), n = ri(2, 3);
      reps.push({ q: `计算：(${a}×${b})^${n} = （　）`, a: `${a}^${n}×${b}^${n}`, d: [`${a}^${n}+${b}^${n}`, `${a}^${n}×${b}`, `${a}×${b}^${n}`] });
    }
    reps.push({ q: '计算：(ab)² = （　）', a: 'a²b²', d: ['ab²', 'a²b', 'a²+b²'] });
    reps.push({ q: '同底数幂相乘，底数（　），指数（　）', a: '不变，相加', d: ['不变，相乘', '相乘，相加', '相加，相乘'] });
    reps.push({ q: '幂的乘方，底数（　），指数（　）', a: '不变，相乘', d: ['不变，相加', '相乘，相加', '不变，相减'] });
    reps.push({ q: '积的乘方等于（　）', a: '把积的每一个因式分别乘方，再把所得的幂相乘', d: ['把因式相加再乘方', '只把第一个因式乘方', '指数相加'] });
    for (let i = 0; i < 8; i++) {
      let k = ri(2, 6), a = ri(1, 5), b = ri(1, 5);
      reps.push({ q: `计算：${k}x(${a}x + ${b}) = （　）`, a: `${k * a}x² + ${k * b}x`, d: [`${k * a}x + ${k * b}`, `${k * a}x² + ${b}x`, `${k + a}x² + ${k * b}x`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(1, 5), b = ri(1, 5); if (a === b) b = (a % 5) + 1;
      reps.push({ q: `计算：(x + ${a})(x + ${b}) = （　）`, a: `x² + ${a + b}x + ${a * b}`, d: [`x² + ${a * b}x + ${a + b}`, `x² + ${a + b}x + ${a + b}`, `x² + ${a * b}`] });
    }
    // 乘法公式
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 9), b = ri(1, 6);
      reps.push({ q: `计算：(${a} + ${b})(${a} − ${b}) = （　）`, a: `${a * a - b * b}`, d: [`${a * a + b * b}`, `${(a - b) * (a - b)}`, `${a * a - b}`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 8), b = ri(1, 5);
      reps.push({ q: `计算：(${a} + ${b})² = （　）`, a: `${a * a + 2 * a * b + b * b}`, d: [`${a * a + b * b}`, `${a * a + a * b + b * b}`, `${a * a + 2 * a * b}`] });
    }
    reps.push({ q: '平方差公式：(a+b)(a−b) = （　）', a: 'a² − b²', d: ['a² + b²', '(a−b)²', 'a² − 2ab + b²'] });
    reps.push({ q: '完全平方公式：(a+b)² = （　）', a: 'a² + 2ab + b²', d: ['a² + b²', 'a² − 2ab + b²', 'a² − b²'] });
    reps.push({ q: '完全平方公式：(a−b)² = （　）', a: 'a² − 2ab + b²', d: ['a² − b²', 'a² + 2ab + b²', 'a² + b²'] });
    for (let i = 0; i < 6; i++) {
      let a = ri(2, 6), m = ri(3, 7), n = ri(1, 3);
      reps.push({ q: `计算：${a * m}x^${m} ÷ ${a}x^${n} = （　）`, a: `${m}x^${m - n}`, d: [`${m}x^${m + n}`, `${a}x^${m - n}`, `${m}x^${m * n}`] });
    }
    return mk(pickNew(reps));
  }

  // ---- 第17章 因式分解 ----
  function jr8_fact() {
    const reps = [];
    for (let i = 0; i < 10; i++) {
      let k = ri(2, 7), a = ri(1, 6), b = ri(1, 6);
      reps.push({ q: `把 ${k * a}x + ${k * b}y 分解因式，结果是（　）`, a: `${k}(${a}x + ${b}y)`, d: [`${k}(${a}x − ${b}y)`, `${k * a}(x + y)`, `${k}(${a}x + ${b})`] });
    }
    for (let i = 0; i < 8; i++) {
      let k = ri(2, 5), a = ri(2, 6), n = ri(2, 4);
      reps.push({ q: `把 ${k * a}x² + ${k}x 分解因式，结果是（　）`, a: `${k}x(${a}x + 1)`, d: [`${k}x(${a}x − 1)`, `${k}x²(${a} + 1)`, `x(${k * a}x + ${k})`] });
    }
    for (let i = 0; i < 10; i++) {
      let a = ri(2, 9), b = ri(1, 6);
      reps.push({ q: `把 x² − ${b * b} 分解因式，结果是（　）`, a: `(x + ${b})(x − ${b})`, d: [`(x − ${b})²`, `(x + ${b})²`, `(x − ${b})(x − ${b})`] });
    }
    for (let i = 0; i < 10; i++) {
      let a = ri(2, 7);
      reps.push({ q: `把 x² + ${2 * a}x + ${a * a} 分解因式，结果是（　）`, a: `(x + ${a})²`, d: [`(x − ${a})²`, `(x + ${a})(x − ${a})`, `(x + ${a + 1})²`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 7), b = ri(1, 5); let s = a + b, p = a * b;
      reps.push({ q: `把 x² + ${s}x + ${p} 分解因式，结果是（　）`, a: `(x + ${a})(x + ${b})`, d: [`(x + ${a})(x − ${b})`, `(x − ${a})(x − ${b})`, `(x + ${a + b})(x + 1)`] });
    }
    reps.push({ q: '下列各式从左到右的变形，属于因式分解的是（　）', a: 'x² − 4 = (x+2)(x−2)', d: ['(x+1)(x−1) = x² − 1', 'x² + 2x + 1 = x(x+2) + 1', 'x² − 1 = x(x − 1/x)'] });
    reps.push({ q: '因式分解与整式乘法的关系是（　）', a: '互逆的变形', d: ['相同的变形', '无关的变形', '有时相同'] });
    reps.push({ q: '分解因式时，首先应考虑（　）', a: '提公因式', d: ['套公式', '分组', '展开'] });
    reps.push({ q: '把 2x² − 8 分解因式，结果是（　）', a: '2(x+2)(x−2)', d: ['2(x−2)²', '(2x+4)(x−2)', '2(x²−4)'] });
    reps.push({ q: '把 3a² − 6a + 3 分解因式，结果是（　）', a: '3(a−1)²', d: ['3(a+1)²', '3(a²−2a+1)', '(3a−3)(a−1)'] });
    reps.push({ q: 'x² + 1 在有理数范围内（　）', a: '不能分解因式', d: ['=(x+1)²', '=(x+1)(x−1)', '=(x−1)²'] });
    reps.push({ q: '若 x² + kx + 9 是完全平方式，则 k = （　）', a: '±6', d: ['6', '−6', '3'] });
    return mk(pickNew(reps));
  }

  // ---- 第18章 分式 ----
  function jr8_frac() {
    const reps = [];
    for (let i = 0; i < 10; i++) {
      let a = ri(1, 9);
      reps.push({ q: `当 x = ${a} 时，分式 1/(x − ${a}) （　）`, a: '无意义', d: ['值为 0', '值为 1', '有意义'] });
    }
    for (let i = 0; i < 6; i++) {
      let a = ri(1, 9);
      reps.push({ q: `要使分式 1/(x − ${a}) 有意义，x 应满足（　）`, a: `x ≠ ${a}`, d: [`x = ${a}`, `x > ${a}`, `x < ${a}`] });
    }
    reps.push({ q: '分式的值为 0 的条件是（　）', a: '分子为 0 且分母不为 0', d: ['分子为 0', '分母为 0', '分母为 0 且分子不为 0'] });
    reps.push({ q: '分式的基本性质：分式的分子与分母同乘（或除以）同一个（　），分式的值不变', a: '不等于 0 的整式', d: ['数', '整式', '任意式子'] });
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 6), b = ri(2, 6), c = ri(2, 6);
      reps.push({ q: `计算：${a}/${b} × ${c}/${a} = （　）`, a: `${c}/${b}`, d: [`${a * c}/${b * a}`, `${a}/${b * c}`, `${c}/${a}`] });
    }
    for (let i = 0; i < 8; i++) {
      let b = ri(2, 6), c = ri(2, 6), d = ri(2, 6);
      reps.push({ q: `计算：${b * c}/${b} ÷ ${d}/${c} = （　）`, a: `${c * c}/${d}`, d: [`${b * c * d}/${b * c}`, `${c}/${d}`, `${b * c}/${d}`] });
    }
    for (let i = 0; i < 8; i++) {
      let d = ri(7, 9), a = ri(1, 3), b = ri(1, 3);
      reps.push({ q: `计算：${a}/${d} + ${b}/${d} = （　）`, a: `${a + b}/${d}`, d: [`${a + b}/${2 * d}`, `${a * b}/${d}`, `${a + b}/${d * d}`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(1, 5), b = ri(1, 5); if (a === b) b = (a % 5) + 1;
      reps.push({ q: `计算：1/${a} + 1/${b} = （　）`, a: `${a + b}/${a * b}`, d: [`2/${a + b}`, `${a + b}/${a + b}`, `1/${a + b}`] });
    }
    reps.push({ q: '异分母分式相加减，先（　）再加减', a: '通分', d: ['约分', '因式分解', '直接相加'] });
    reps.push({ q: '分式运算的结果要化为（　）', a: '最简分式', d: ['带分数', '小数', '整式'] });
    for (let i = 0; i < 8; i++) {
      let k = ri(2, 9);
      reps.push({ q: `解分式方程：${k}/x = 1，则 x = （　）`, a: `${k}`, d: [`${k + 1}`, `${k - 1}`, `0`] });
    }
    for (let i = 0; i < 8; i++) {
      let k = ri(2, 6), x0 = ri(2, 8);
      reps.push({ q: `解分式方程：${k}/(x − ${x0}) = 1，则 x = （　）`, a: `${k + x0}`, d: [`${k + x0 + 1}`, `${k + x0 - 1}`, `${x0}`] });
    }
    reps.push({ q: '解方程 2/(x−1) = 1，得到的根 x = （　）', a: '3', d: ['1', '2', '0'] });
    reps.push({ q: '若分式方程的解使最简公分母为 0，则这个解是（　）', a: '增根，应舍去', d: ['原方程的根', '唯一解', '无意义的题'] });
    reps.push({ q: '解分式方程时，可能产生（　），必须检验', a: '增根', d: ['负根', '无解', '重根'] });
    reps.push({ q: '分式方程验根的方法是（　）', a: '把根代入最简公分母，看是否为 0', d: ['代入原方程左边', '看是否为正数', '看是否为整数'] });
    return mk(pickNew(reps));
  }

  // ============================================================
  // 八年级下册
  // ============================================================

  // ---- 第19章 二次根式 ----
  function jr8_sqrt() {
    const reps = [];
    // 有意义的条件
    for (let i = 0; i < 8; i++) {
      let k = ri(1, 9);
      reps.push({ q: `要使二次根式 √(x − ${k}) 有意义，x 应满足（　）`, a: `x ≥ ${k}`, d: [`x ≤ ${k}`, `x > ${k}`, `x ≠ ${k}`] });
    }
    for (let i = 0; i < 6; i++) {
      let k = ri(1, 9);
      reps.push({ q: `要使二次根式 √(${k} − x) 有意义，x 应满足（　）`, a: `x ≤ ${k}`, d: [`x ≥ ${k}`, `x < ${k}`, `x ≠ ${k}`] });
    }
    reps.push({ q: '二次根式 √a 有意义的条件是（　）', a: 'a ≥ 0', d: ['a > 0', 'a ≤ 0', 'a 为任意实数'] });
    reps.push({ q: '下列各式中，一定是二次根式的是（　）', a: '√(a²+1)', d: ['√a', '√(a−2)', '³√a'] });
    reps.push({ q: '下列各式中，不是二次根式的是（　）', a: '³√8', d: ['√5', '√(x²+1)', '√0'] });
    // 性质
    for (let i = 0; i < 8; i++) {
      let n = ri(2, 12);
      reps.push({ q: `计算：(√${n})² = （　）`, a: `${n}`, d: [`${n * n}`, `√${n}`, `−${n}`] });
    }
    for (let i = 0; i < 6; i++) {
      let n = ri(2, 12);
      reps.push({ q: `计算：√(${n})² = （　）`, a: `${n}`, d: [`±${n}`, `−${n}`, `${n * n}`] });
    }
    reps.push({ q: '计算：√((−5)²) = （　）', a: '5', d: ['−5', '±5', '25'] });
    reps.push({ q: '化简 √(a²) 的结果是（　）', a: '|a|', d: ['a', '−a', 'a²'] });
    reps.push({ q: '若 √(a²) = −a，则 a 的取值范围是（　）', a: 'a ≤ 0', d: ['a ≥ 0', 'a > 0', 'a 为任意实数'] });
    // 化简（最简二次根式）
    const SIMP = [[8, 2, 2], [12, 2, 3], [18, 3, 2], [20, 2, 5], [24, 2, 6], [27, 3, 3], [32, 4, 2],
    [45, 3, 5], [48, 4, 3], [50, 5, 2], [54, 3, 6], [75, 5, 3], [72, 6, 2], [80, 4, 5], [98, 7, 2]];
    SIMP.forEach(t => {
      const ans = `${t[1]}√${t[2]}`;
      let d1 = `${t[2]}√${t[1]}`; if (d1 === ans) d1 = `${t[1] + 1}√${t[2]}`;
      reps.push({ q: `化简：√${t[0]} = （　）`, a: ans, d: [d1, `${t[1] * t[2]}`, `${t[1]}√${t[2] + 1}`] });
    });
    reps.push({ q: '下列各式中，是最简二次根式的是（　）', a: '√7', d: ['√8', '√12', '√18'] });
    reps.push({ q: '下列各式中，不是最简二次根式的是（　）', a: '√12', d: ['√7', '√11', '√13'] });
    reps.push({ q: '下列各组中，与 √2 是同类二次根式的是（　）', a: '√8', d: ['√3', '√6', '√12'] });
    reps.push({ q: '下列各组中，与 √3 是同类二次根式的是（　）', a: '√12', d: ['√2', '√6', '√8'] });
    // 加减
    for (let i = 0; i < 8; i++) {
      let p = ri(2, 6), q = ri(2, 6), r = pick([2, 3, 5, 6, 7]);
      reps.push({ q: `计算：${p}√${r} + ${q}√${r} = （　）`, a: `${p + q}√${r}`, d: [`${p + q + 1}√${r}`, `${p * q}√${r}`, `${p + q}√${r + 1}`] });
    }
    for (let i = 0; i < 6; i++) {
      let p = ri(4, 9), q = ri(1, 3), r = pick([2, 3, 5, 6, 7]);
      reps.push({ q: `计算：${p}√${r} − ${q}√${r} = （　）`, a: `${p - q}√${r}`, d: [`${p - q + 1}√${r}`, `${p + q}√${r}`, `${p - q}√${r + 1}`] });
    }
    reps.push({ q: '计算：√8 + √2 = （　）', a: '3√2', d: ['2√2', '√10', '4√2'] });
    reps.push({ q: '计算：√12 − √3 = （　）', a: '√3', d: ['3', '√9', '2√3'] });
    reps.push({ q: '计算：√18 − √8 = （　）', a: '√2', d: ['√10', '2√2', '3√2'] });
    reps.push({ q: '二次根式相加减时，要先把各根式化为最简二次根式，再合并（　）', a: '同类二次根式', d: ['被开方数相同的根式以外的项', '所有根式', '系数相同的根式'] });
    // 乘除
    [[2, 3], [2, 5], [2, 7], [3, 5], [3, 7], [5, 6], [2, 11], [3, 10], [5, 7], [2, 13]].forEach(t => {
      reps.push({ q: `计算：√${t[0]} × √${t[1]} = （　）`, a: `√${t[0] * t[1]}`, d: [`√${t[0] + t[1]}`, `${t[0] * t[1]}`, `√${t[0]} + √${t[1]}`] });
    });
    reps.push({ q: '计算：√2 × √8 = （　）', a: '4', d: ['√10', '2√2', '16'] });
    reps.push({ q: '计算：√12 ÷ √3 = （　）', a: '2', d: ['√4', '4', '3'] });
    reps.push({ q: '计算：√3 × √6 = （　）', a: '3√2', d: ['2√3', '√18', '√9'] });
    reps.push({ q: '二次根式的乘法法则：√a × √b = （　）（a≥0，b≥0）', a: '√(ab)', d: ['√(a+b)', 'a√b', '√a + √b'] });
    reps.push({ q: '二次根式的除法法则：√a ÷ √b = （　）（a≥0，b>0）', a: '√(a/b)', d: ['√(ab)', '√(a−b)', '√a ÷ b'] });
    // 分母有理化
    reps.push({ q: '把 1/√2 分母有理化，结果是（　）', a: '√2/2', d: ['√2', '2√2', '1/2'] });
    reps.push({ q: '把 1/√3 分母有理化，结果是（　）', a: '√3/3', d: ['√3', '3√3', '1/3'] });
    reps.push({ q: '把 2/√2 分母有理化，结果是（　）', a: '√2', d: ['2√2', '√2/2', '2'] });
    return mk(pickNew(reps));
  }

  // ---- 第20章 勾股定理 ----
  function jr8_gougu() {
    const reps = [];
    reps.push({ q: '直角三角形两直角边为 a、b，斜边为 c，则它们的关系是（　）', a: 'a² + b² = c²', d: ['a + b = c', 'a² + c² = b²', 'c² + b² = a²'] });
    reps.push({ q: '勾股定理适用于（　）', a: '直角三角形', d: ['任意三角形', '锐角三角形', '钝角三角形'] });
    reps.push({ q: '在 Rt△ABC 中，∠C = 90°，则斜边是（　）', a: 'AB', d: ['AC', 'BC', '无法确定'] });
    // 勾股数求边
    const PY = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [9, 12, 15], [8, 15, 17], [7, 24, 25], [12, 16, 20], [10, 24, 26], [15, 20, 25], [20, 21, 29]];
    PY.forEach(t => {
      reps.push({ q: `直角三角形两直角边分别是 ${t[0]}cm 和 ${t[1]}cm，斜边长是（　）`, a: `${t[2]}cm`, d: [`${t[0] + t[1]}cm`, `${t[2] + 1}cm`, `${t[0] * t[1]}cm`] });
      reps.push({ q: `直角三角形斜边是 ${t[2]}cm，一条直角边是 ${t[0]}cm，另一条直角边是（　）`, a: `${t[1]}cm`, d: [`${t[2] - t[0]}cm`, `${t[1] + 1}cm`, `${t[2] + t[0]}cm`] });
      reps.push({ s: rtTri(t[0], t[1], t[2], 'c'), q: `如图，Rt△ABC 中两直角边分别是 ${t[0]}cm、${t[1]}cm，斜边 AB 的长是（　）`, a: `${t[2]}cm`, d: [`${t[0] + t[1]}cm`, `${t[2] + 1}cm`, `${t[2] - 1}cm`] });
    });
    // 逆定理
    reps.push({ q: '下列各组数中，能作为直角三角形三边长的是（　）', a: '6，8，10', d: ['2，3，4', '4，5，6', '5，6，7'] });
    reps.push({ q: '下列各组数中，不能作为直角三角形三边长的是（　）', a: '4，5，6', d: ['3，4，5', '5，12，13', '9，12，15'] });
    reps.push({ q: '三角形三边长分别为 6、8、10，这个三角形是（　）', a: '直角三角形', d: ['锐角三角形', '钝角三角形', '等腰三角形'] });
    reps.push({ q: '若三角形三边 a、b、c 满足 a² + b² = c²，则这个三角形是（　）', a: '直角三角形，且 c 边所对的角是直角', d: ['锐角三角形', '钝角三角形', '等腰三角形'] });
    // 应用
    for (let i = 0; i < 8; i++) {
      let lean = pick([[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13]]);
      reps.push({ q: `一架 ${lean[2]}m 长的梯子斜靠在墙上，梯子底端离墙脚 ${lean[0]}m，梯子顶端离地面的高度是（　）`, a: `${lean[1]}m`, d: [`${lean[2] - lean[0]}m`, `${lean[2]}m`, `${lean[1] + 1}m`] });
    }
    [[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13], [8, 15, 17], [12, 16, 20]].forEach(t => {
      reps.push({ q: `一个长方形长 ${t[1]}cm、宽 ${t[0]}cm，它的对角线长是（　）`, a: `${t[2]}cm`, d: [`${t[1] + t[0]}cm`, `${t[2] + 1}cm`, `${t[1] * t[0]}cm`] });
    });
    reps.push({ q: '长方形长 6cm、宽 8cm，它的对角线长是（　）', a: '10cm', d: ['14cm', '12cm', '48cm'] });
    reps.push({ q: '边长为 1cm 的正方形，对角线的长是（　）', a: '√2 cm', d: ['2cm', '1cm', '√3 cm'] });
    reps.push({ q: '边长为 3cm 的正方形，对角线的长是（　）', a: '3√2 cm', d: ['6cm', '3cm', '9cm'] });
    reps.push({ q: '等边三角形边长为 2cm，它的高是（　）', a: '√3 cm', d: ['2cm', '1cm', '2√3 cm'] });
    reps.push({ q: '一棵树在离地面 3m 处折断，树顶落在离树底 4m 处，这棵树折断前高（　）', a: '8m', d: ['7m', '5m', '9m'] });
    reps.push({ q: '小明向东走 8m，再向北走 6m，此时他离出发点（　）', a: '10m', d: ['14m', '12m', '2m'] });
    reps.push({ q: '在 Rt△ABC 中，∠C=90°，若 a=5，c=13，则 b = （　）', a: '12', d: ['8', '10', '18'] });
    reps.push({ q: '直角三角形两直角边分别为 1 和 1，斜边长是（　）', a: '√2', d: ['2', '1', '√3'] });
    reps.push({ q: '直角三角形斜边上的中线等于（　）', a: '斜边的一半', d: ['斜边', '直角边的一半', '高的一半'] });
        // 求面积
    for (let i = 0; i < 6; i++) {
      let t = pick(PY);
      reps.push({
        q: `直角三角形两直角边分别是 ${t[0]}cm 和 ${t[1]}cm，它的面积是（　）`,
        a: `${t[0] * t[1] / 2}cm²`, d: [`${t[0] * t[1]}cm²`, `${t[0] * t[1] / 4}cm²`, `${(t[0] + t[1]) * 2}cm²`]
      });
    }
    // 斜边中线
    for (let i = 0; i < 8; i++) {
      let t = pick(PY);
      reps.push({
        q: `直角三角形斜边长 ${t[2]}cm，斜边上的中线长是（　）`,
        a: `${t[2] / 2}cm`, d: [`${t[2]}cm`, `${t[2] * 2}cm`, `${t[0]}cm`]
      });
    }
    // 在 Rt△ 中知两边求第三边（代数式表述）
    for (let i = 0; i < 8; i++) {
      let t = pick(PY);
      reps.push({ q: `在 Rt△ABC 中，∠C = 90°，a = ${t[0]}，c = ${t[2]}，则 b = （　）`, a: `${t[1]}`, d: [`${t[2] - t[0]}`, `${t[1] + 1}`, `${t[0] + t[2]}`] });
    }
    reps.push({ q: '在 Rt△ABC 中，∠C=90°，若 a = 9，b = 12，则 c = （　）', a: '15', d: ['13', '21', '√63'] });
    // 逆定理判断
    [[7, 24, 25], [20, 21, 29], [10, 24, 26], [15, 20, 25], [12, 16, 20]].forEach(t => {
      reps.push({ q: `三角形三边长分别是 ${t[0]}、${t[1]}、${t[2]}，这个三角形（　）`, a: '是直角三角形', d: ['是锐角三角形', '是钝角三角形', '无法判断'] });
    });
    reps.push({ q: '三角形三边为 5、6、7，这个三角形是（　）', a: '锐角三角形', d: ['直角三角形', '钝角三角形', '无法判断'] });
    // 等腰三角形求腰
    [[6, 4, 5], [8, 3, 5], [10, 12, 13], [16, 6, 10], [12, 8, 10], [24, 5, 13]].forEach(t => {
      reps.push({
        q: `等腰三角形底边 ${t[0]}cm，底边上的高 ${t[1]}cm，它的腰长是（　）`,
        a: `${t[2]}cm`, d: [`${t[0] / 2 + t[1]}cm`, `${t[2] + 1}cm`, `${t[0]}cm`]
      });
    });
    // 折竹 / 旗杆
    for (let i = 0; i < 6; i++) {
      let t = pick([[3, 4, 5], [6, 8, 10], [9, 12, 15], [5, 12, 13]]);
      reps.push({
        q: `一根旗杆在离地面 ${t[0]}m 处折断，杆顶落在离杆底 ${t[1]}m 处，旗杆折断前的高度是（　）`,
        a: `${t[0] + t[2]}m`, d: [`${t[2]}m`, `${t[0] + t[1]}m`, `${t[0] + t[2] + 1}m`]
      });
    }
    reps.push({ q: '一根竹子高 10 尺，折断后竹梢恰好抵地，抵地处离竹根 6 尺，折断处离地（　）', a: '3.2 尺', d: ['4 尺', '6 尺', '8 尺'] });
    reps.push({ q: '为测湖宽，在岸上取点 C 使 ∠C = 90°，量得 AC = 30m，BC = 40m，则湖宽 AB = （　）', a: '50m', d: ['70m', '35m', '45m'] });
    reps.push({ q: '一个长方体长 3cm、宽 4cm、高 5cm，蚂蚁从一个顶点沿表面爬到相对顶点，最短路程是（　）', a: '√74 cm', d: ['√80 cm', '√90 cm', '12cm'] });
    reps.push({ q: '用四个全等的直角三角形拼图验证勾股定理，依据的是（　）', a: '面积相等（面积法）', d: ['周长相等', '角度相等', '相似性'] });
    reps.push({ q: '用勾股定理在数轴上作出 √13，需要构造两直角边分别为（　）的直角三角形', a: '2 和 3', d: ['1 和 12', '√13 和 1', '4 和 3'] });
    reps.push({ q: '用勾股定理在数轴上作出 √2，需要构造的直角三角形两直角边是（　）', a: '1 和 1', d: ['1 和 2', '2 和 2', '1 和 √2'] });
    reps.push({ q: '已知直角三角形斜边为 c，一条直角边为 a，则另一条直角边 b = （　）', a: '√(c² − a²)', d: ['c − a', '√(c² + a²)', '√(a² − c²)'] });
return mk(pickNew(reps));
  }

  // ---- 第21章 四边形 ----
  function jr8_quad() {
    const reps = [];
    // 平行四边形
    reps.push({ q: '两组对边分别平行的四边形叫做（　）', a: '平行四边形', d: ['梯形', '矩形', '菱形'] });
    reps.push({ q: '平行四边形的对边（　）', a: '平行且相等', d: ['只平行不相等', '只相等不平行', '互相垂直'] });
    reps.push({ q: '平行四边形的对角（　）', a: '相等', d: ['互补', '互余', '和为 360°'] });
    reps.push({ q: '平行四边形的对角线（　）', a: '互相平分', d: ['相等', '互相垂直', '互相垂直且相等'] });
    reps.push({ q: '平行四边形是（　）对称图形', a: '中心', d: ['轴', '既是轴对称又是中心', '不是'] });
    for (let i = 0; i < 8; i++) {
      let a = ri(4, 15), b = ri(3, 12);
      reps.push({ s: paraFig(a, b), q: `如图，平行四边形的一组邻边长分别是 ${a}cm 和 ${b}cm，它的周长是（　）`, a: `${2 * (a + b)}cm`, d: [`${a + b}cm`, `${a * b}cm`, `${2 * a + b}cm`] });
    }
    for (let i = 0; i < 8; i++) {
      let d1 = ri(40, 130);
      reps.push({ q: `平行四边形的一个内角是 ${d1}°，与它相对的角是（　）`, a: `${d1}°`, d: [`${180 - d1}°`, `${d1 + 10}°`, `${d1 - 10}°`] });
    }
    for (let i = 0; i < 8; i++) {
      let d1 = ri(40, 130);
      reps.push({ q: `平行四边形的一个内角是 ${d1}°，与它相邻的角是（　）`, a: `${180 - d1}°`, d: [`${d1}°`, `${190 - d1}°`, `${170 - d1}°`] });
    }
    reps.push({ q: '下列条件中，能判定四边形是平行四边形的是（　）', a: '对角线互相平分', d: ['对角线相等', '一组对边平行，另一组对边相等', '对角线互相垂直'] });
    reps.push({ q: '下列条件中，不能判定四边形是平行四边形的是（　）', a: '一组对边平行，另一组对边相等', d: ['两组对边分别平行', '两组对边分别相等', '一组对边平行且相等'] });
    reps.push({ q: '平行四边形的面积 = （　）', a: '底 × 高', d: ['两条邻边的积', '对角线积的一半', '周长 × 高'] });
    for (let i = 0; i < 6; i++) {
      let b = ri(4, 12), h = ri(3, 9);
      reps.push({ q: `平行四边形底为 ${b}cm、高为 ${h}cm，面积是（　）`, a: `${b * h}cm²`, d: [`${b + h}cm²`, `${2 * (b + h)}cm²`, `${b * h + 1}cm²`] });
    }
    // 矩形
    reps.push({ q: '有一个角是直角的平行四边形叫做（　）', a: '矩形', d: ['菱形', '正方形', '梯形'] });
    reps.push({ q: '矩形的四个角都是（　）', a: '直角', d: ['锐角', '钝角', '不确定'] });
    reps.push({ q: '矩形的对角线（　）', a: '相等且互相平分', d: ['互相垂直', '只相等不平分', '互相垂直平分'] });
    reps.push({ q: '下列条件中，能判定平行四边形是矩形的是（　）', a: '对角线相等', d: ['对角线互相垂直', '一组邻边相等', '对角线平分一组对角'] });
    reps.push({ q: '有三个角是直角的四边形是（　）', a: '矩形', d: ['菱形', '正方形', '平行四边形'] });
    reps.push({ q: '直角三角形斜边上的中线等于斜边的（　）', a: '一半', d: ['2 倍', '相等', '√2 倍'] });
    for (let i = 0; i < 6; i++) {
      let w = ri(3, 9), h = ri(3, 9);
      reps.push({ s: rectFig(w, h), q: `如图，长方形长 ${w}cm、宽 ${h}cm，它的面积是（　）`, a: `${w * h}cm²`, d: [`${2 * (w + h)}cm²`, `${w + h}cm²`, `${w * h + 1}cm²`] });
    }
    // 菱形
    reps.push({ q: '有一组邻边相等的平行四边形叫做（　）', a: '菱形', d: ['矩形', '正方形', '梯形'] });
    reps.push({ q: '菱形的四条边（　）', a: '都相等', d: ['只有对边相等', '都不相等', '只有邻边相等'] });
    reps.push({ q: '菱形的对角线（　）', a: '互相垂直平分', d: ['相等', '只平分不垂直', '只垂直不平分'] });
    reps.push({ q: '菱形的面积等于（　）', a: '对角线乘积的一半', d: ['底 × 高', '边长²', '周长 × 高'] });
    for (let i = 0; i < 6; i++) {
      let d1 = ri(4, 12) * 2, d2 = ri(3, 9) * 2;
      reps.push({ s: rhombFig(d1, d2), q: `如图，菱形两条对角线长分别是 ${d1}cm 和 ${d2}cm，它的面积是（　）`, a: `${d1 * d2 / 2}cm²`, d: [`${d1 * d2}cm²`, `${(d1 + d2) * 2}cm²`, `${d1 * d2 / 4}cm²`] });
    }
    for (let i = 0; i < 6; i++) {
      let a = ri(4, 14);
      reps.push({ q: `菱形的边长是 ${a}cm，它的周长是（　）`, a: `${4 * a}cm`, d: [`${2 * a}cm`, `${a * a}cm²`, `${3 * a}cm`] });
    }
    // 正方形
    reps.push({ q: '既是矩形又是菱形的四边形是（　）', a: '正方形', d: ['长方形', '平行四边形', '梯形'] });
    reps.push({ q: '正方形的对角线（　）', a: '相等且互相垂直平分', d: ['只相等', '只垂直', '只平分'] });
    reps.push({ q: '正方形有（　）条对称轴', a: '4', d: ['2', '3', '无数'] });
    for (let i = 0; i < 6; i++) {
      let a = ri(3, 12);
      reps.push({ q: `正方形边长 ${a}cm，它的面积是（　）`, a: `${a * a}cm²`, d: [`${4 * a}cm²`, `${2 * a}cm²`, `${a * a + 1}cm²`] });
    }
    // 中位线
    reps.push({ q: '三角形的中位线（　）于第三边，并且等于第三边的（　）', a: '平行，一半', d: ['垂直，一半', '平行，2 倍', '垂直，2 倍'] });
    reps.push({ q: '连接三角形两边中点的线段叫做三角形的（　）', a: '中位线', d: ['中线', '高', '角平分线'] });
    for (let i = 0; i < 8; i++) {
      let b = ri(4, 16) * 2;
      reps.push({ q: `三角形的一条中位线长 ${b / 2}cm，则第三边长是（　）`, a: `${b}cm`, d: [`${b / 4}cm`, `${b * 2}cm`, `${b / 2}cm`] });
    }
    reps.push({ q: '三角形三条中位线组成的三角形与原三角形（　）', a: '相似，周长是原三角形的一半', d: ['全等', '面积相等', '周长相等'] });
    reps.push({ q: '顺次连接任意四边形各边中点所得的四边形是（　）', a: '平行四边形', d: ['矩形', '菱形', '正方形'] });
    return mk(pickNew(reps));
  }

  // ---- 第22章 函数 ----
  function jr8_func() {
    const reps = [];
    reps.push({ q: '在一个变化过程中，数值发生变化的量叫做（　）', a: '变量', d: ['常量', '函数', '自变量'] });
    reps.push({ q: '在一个变化过程中，数值保持不变的量叫做（　）', a: '常量', d: ['变量', '函数', '因变量'] });
    reps.push({ q: '一般地，在一个变化过程中，如果有两个变量 x 和 y，并且对于 x 的每一个确定的值，y 都有（　）的值与其对应，那么就说 y 是 x 的函数', a: '唯一确定', d: ['两个', '至少两个', '任意多个'] });
    reps.push({ q: '在函数关系中，x 叫做（　）', a: '自变量', d: ['因变量', '函数值', '常量'] });
    reps.push({ q: '表示函数关系的方法有解析式法、列表法和（　）', a: '图象法', d: ['公式法', '代入法', '消元法'] });
    // 判断是否为函数
    reps.push({ s: circleFig(), q: '如图，下列判断正确的是（　）', a: '这个图象中 y 不是 x 的函数', d: ['这个图象中 y 是 x 的函数', '这个图象是正比例函数图象', '这个图象是一次函数图象'] });
    reps.push({ s: polylineFig([[-5, -4], [-3, -1], [0, 2], [2, 4], [5, 5]]), q: '如图是某函数的图象，下列判断正确的是（　）', a: '对于 x 的每一个值，y 都有唯一的值对应', d: ['存在一个 x 对应两个 y', '这不是函数图象', '无法判断是否为函数'] });
    // 自变量取值范围
    for (let i = 0; i < 6; i++) {
      let k = ri(1, 9);
      reps.push({ q: `函数 y = 1/(x − ${k}) 中，自变量 x 的取值范围是（　）`, a: `x ≠ ${k}`, d: [`x = ${k}`, `x ≥ ${k}`, `x 为全体实数`] });
    }
    for (let i = 0; i < 6; i++) {
      let k = ri(1, 9);
      reps.push({ q: `函数 y = √(x − ${k}) 中，自变量 x 的取值范围是（　）`, a: `x ≥ ${k}`, d: [`x ≤ ${k}`, `x > ${k}`, `x ≠ ${k}`] });
    }
    reps.push({ q: '函数 y = 3x − 2 中，自变量 x 的取值范围是（　）', a: '全体实数', d: ['x > 0', 'x ≠ 0', 'x ≥ 0'] });
    // 函数值
    for (let i = 0; i < 12; i++) {
      let k = ri(2, 6), b = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), x = ri(1, 9);
      reps.push({ q: `已知 y = ${k}x ${b >= 0 ? '+ ' + b : '− ' + (-b)}，当 x = ${x} 时，y = （　）`, a: `${k * x + b}`, d: [`${k * x + b + 1}`, `${k * x}`, `${k + x + b}`] });
    }
    for (let i = 0; i < 8; i++) {
      let a = ri(2, 5), x = ri(2, 6);
      reps.push({ q: `已知 y = x²，当 x = ${x} 时，y = （　）`, a: `${x * x}`, d: [`${2 * x}`, `${x * x + 1}`, `${x + 2}`] });
    }
    // 点在图象上
    for (let i = 0; i < 10; i++) {
      let k = ri(2, 5), b = ri(1, 8), x = ri(1, 6);
      reps.push({ q: `下列各点中，在函数 y = ${k}x + ${b} 的图象上的是（　）`, a: `(${x}, ${k * x + b})`, d: [`(${x}, ${k * x + b + 1})`, `(${x}, ${k * x})`, `(${x + 1}, ${k * x + b})`] });
    }
    // 图象读值
    reps.push({ s: polylineFig([[0, 0], [1, 2], [2, 4], [3, 6]]), q: '如图是某函数图象，当 x = 2 时，y 的值是（　）', a: '4', d: ['2', '6', '3'] });
    reps.push({ s: polylineFig([[0, 6], [1, 4], [2, 2], [3, 0]]), q: '如图是某函数图象，观察图象可知 y 随 x 的增大而（　）', a: '减小', d: ['增大', '不变', '先增后减'] });
    reps.push({ s: polylineFig([[0, 1], [1, 3], [2, 5]]), q: '如图是某函数图象，观察图象可知 y 随 x 的增大而（　）', a: '增大', d: ['减小', '不变', '先减后增'] });
    // 描点法
    reps.push({ q: '用描点法画函数图象的一般步骤是（　）', a: '列表、描点、连线', d: ['描点、列表、连线', '连线、描点、列表', '列表、连线、描点'] });
    reps.push({ q: '画函数图象时，连线通常按（　）的顺序用平滑曲线连接', a: '自变量由小到大', d: ['自变量由大到小', '任意', '函数值由大到小'] });
    return mk(pickNew(reps));
  }

  // ---- 第23章 一次函数 ----
  function jr8_lin() {
    const reps = [];
    reps.push({ q: '一般地，形如 y = kx + b（k、b 是常数，k ≠ 0）的函数叫做（　）', a: '一次函数', d: ['正比例函数', '二次函数', '反比例函数'] });
    reps.push({ q: '当 b = 0 时，一次函数 y = kx + b 变成（　）', a: '正比例函数', d: ['反比例函数', '二次函数', '常函数'] });
    reps.push({ q: '正比例函数 y = kx 的图象一定经过（　）', a: '原点', d: ['第一象限', 'x 轴正半轴', 'y 轴正半轴'] });
    reps.push({ q: '正比例函数 y = kx（k ≠ 0）的图象是一条经过原点的（　）', a: '直线', d: ['射线', '线段', '曲线'] });
    reps.push({ q: '一次函数 y = kx + b 中，k 叫做（　）', a: '比例系数', d: ['常数项', '截距', '斜率且必须为正'] });
    reps.push({ q: '一次函数 y = kx + b 的图象与 y 轴的交点坐标是（　）', a: '(0, b)', d: ['(b, 0)', '(−b/k, 0)', '(0, −b)'] });
    reps.push({ q: '一次函数 y = kx + b 中，若 k > 0，则 y 随 x 的增大而（　）', a: '增大', d: ['减小', '不变', '先增后减'] });
    reps.push({ q: '一次函数 y = kx + b 中，若 k < 0，则 y 随 x 的增大而（　）', a: '减小', d: ['增大', '不变', '先减后增'] });
    // k、b 与象限
    const QUAD = [
      ['k > 0，b > 0', '第一、二、三'], ['k > 0，b < 0', '第一、三、四'],
      ['k < 0，b > 0', '第一、二、四'], ['k < 0，b < 0', '第二、三、四'],
      ['k > 0，b = 0', '第一、三'], ['k < 0，b = 0', '第二、四']
    ];
    QUAD.forEach(t => {
      reps.push({ q: `一次函数 y = kx + b 中，若 ${t[0]}，则图象经过（　）象限`, a: t[1], d: QUAD.filter(x => x[1] !== t[1]).slice(0, 3).map(x => x[1]) });
    });
    // 待定系数法
    for (let i = 0; i < 10; i++) {
      let k = ri(2, 5), b = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), x1 = ri(1, 5);
      let y1 = k * x1 + b;
      reps.push({ q: `一次函数图象经过点 (0, ${b}) 和 (${x1}, ${y1})，这个函数的解析式是（　）`, a: `y = ${k}x ${b >= 0 ? '+ ' + b : '− ' + (-b)}`, d: [`y = ${k + 1}x ${b >= 0 ? '+ ' + b : '− ' + (-b)}`, `y = ${k}x ${b >= 0 ? '− ' + b : '+ ' + (-b)}`, `y = ${k}x`] });
    }
    for (let i = 0; i < 8; i++) {
      let k = ri(2, 6);
      reps.push({ q: `正比例函数图象经过点 (1, ${k})，这个函数的解析式是（　）`, a: `y = ${k}x`, d: [`y = ${k + 1}x`, `y = x + ${k}`, `y = ${k}`] });
    }
    // 与坐标轴交点
    for (let i = 0; i < 10; i++) {
      let k = ri(2, 6), x0 = ri(1, 6), b = -k * x0;
      reps.push({ q: `一次函数 y = ${k}x ${b >= 0 ? '+ ' + b : '− ' + (-b)} 与 x 轴的交点坐标是（　）`, a: `(${x0}, 0)`, d: [`(0, ${b})`, `(${-x0}, 0)`, `(0, ${-b})`] });
    }
    // 与方程、不等式
    for (let i = 0; i < 8; i++) {
      let k = ri(2, 6), x0 = ri(1, 6), b = -k * x0;
      reps.push({ q: `方程 ${k}x ${b >= 0 ? '+ ' + b : '− ' + (-b)} = 0 的解是（　）`, a: `x = ${x0}`, d: [`x = ${-x0}`, `x = ${x0 + 1}`, `x = ${x0 - 1}`] });
    }
    reps.push({ q: '一次函数 y = 2x − 4 的图象与 x 轴交点的横坐标，就是方程（　）的解', a: '2x − 4 = 0', d: ['2x − 4 > 0', '2x − 4 < 0', 'y = 2x − 4'] });
    reps.push({ q: '观察一次函数 y = 2x − 4 的图象，不等式 2x − 4 > 0 的解集是（　）', a: 'x > 2', d: ['x < 2', 'x > −2', 'x < −2'] });
    // 图象题
    for (let i = 0; i < 6; i++) {
      let k = pick([1, 2, -1, -2]), b = pick([-2, -1, 0, 1, 2]);
      if (k === 0) k = 1;
      reps.push({ s: coordFig(k, b), q: `如图是一次函数的图象，观察图象可知 k 的符号是（　）`, a: k > 0 ? 'k > 0' : 'k < 0', d: [k > 0 ? 'k < 0' : 'k > 0', 'k = 0', '无法判断'] });
    }
    for (let i = 0; i < 6; i++) {
      let k = pick([1, 2, -1, -2]), b = pick([-2, -1, 1, 2]);
      reps.push({ s: coordFig(k, b), q: `如图是一次函数 y = kx + b 的图象，b 的符号是（　）`, a: b > 0 ? 'b > 0' : 'b < 0', d: [b > 0 ? 'b < 0' : 'b > 0', 'b = 0', '无法判断'] });
    }
    // 求交点
    reps.push({ q: '求两条直线交点坐标的方法是（　）', a: '解由两条直线解析式组成的方程组', d: ['把两个解析式相加', '把两个解析式相乘', '分别令 x = 0'] });
    reps.push({ q: '一次函数 y = 3x + 1 与 y = 3x − 2 的图象（　）', a: '互相平行', d: ['相交', '重合', '垂直'] });
    reps.push({ q: '画一次函数图象时，通常找图象与坐标轴的（　）个点即可', a: '2', d: ['1', '3', '越多越好'] });
    return mk(pickNew(reps));
  }

  // ---- 第24章 数据的分析 ----
  function jr8_stat2() {
    const reps = [];
    // 平均数
    for (let i = 0; i < 10; i++) {
      let n = ri(3, 5), arr = [], sum = 0;
      for (let j = 0; j < n; j++) { let v = ri(2, 20); arr.push(v); sum += v; }
      if (sum % n !== 0) { arr[n - 1] += (n - sum % n) % n; sum += (n - sum % n) % n; }
      reps.push({ q: `一组数据 ${arr.join('，')} 的平均数是（　）`, a: `${sum / n}`, d: [`${sum / n + 1}`, `${sum}`, `${arr[0]}`] });
    }
    reps.push({ q: '计算算术平均数的公式是（　）', a: '所有数据之和 ÷ 数据的个数', d: ['（最大值 + 最小值）÷ 2', '出现次数最多的数据', '中间位置的数据'] });
    reps.push({ q: '一组数据中若有一个极端值，用（　）表示集中趋势更合适', a: '中位数', d: ['平均数', '众数', '方差'] });
    // 加权平均数
    reps.push({ q: '某生成绩：平时 80 分（占 30%），期末 90 分（占 70%），则总评成绩是（　）', a: '87 分', d: ['85 分', '86 分', '88 分'] });
    reps.push({ q: '加权平均数中，各个数据的（　）叫做这个数据的权', a: '重要程度（所占比例）', d: ['大小', '出现次数', '位置'] });
    reps.push({ q: '某班 20 名男生平均身高 165cm，30 名女生平均身高 158cm，全班平均身高是（　）', a: '160.8cm', d: ['161.5cm', '160cm', '161cm'] });
    // 中位数
    for (let i = 0; i < 8; i++) {
      let a = ri(1, 9), b = a + ri(1, 5), c = b + ri(1, 5);
      reps.push({ q: `一组数据 ${a}，${c}，${b} 按大小排列后，中位数是（　）`, a: `${b}`, d: [`${a}`, `${c}`, `${b + 1}`] });
    }
    reps.push({ q: '求中位数时，首先要把数据（　）', a: '按大小顺序排列', d: ['求平均数', '去掉最大值', '分组'] });
    reps.push({ q: '一组数据共有偶数个，中位数是（　）', a: '中间两个数的平均数', d: ['中间的那个数', '最大的数', '最小的数'] });
    reps.push({ q: '数据 1，2，3，4，100 的中位数是（　）', a: '3', d: ['2', '22', '50'] });
    // 众数
    reps.push({ q: '一组数据中出现次数最多的数据叫做（　）', a: '众数', d: ['中位数', '平均数', '极差'] });
    reps.push({ q: '数据 2，3，3，4，5 的众数是（　）', a: '3', d: ['2', '4', '没有众数'] });
    reps.push({ q: '数据 1，2，3，4，5 的众数情况是（　）', a: '没有众数', d: ['众数是 1', '众数是 3', '众数是 5'] });
    reps.push({ q: '一组数据的众数（　）', a: '可能不止一个', d: ['一定只有一个', '一定不存在', '一定等于中位数'] });
    // 极差与方差
    for (let i = 0; i < 8; i++) {
      let lo = ri(2, 15), hi = lo + ri(3, 20);
      reps.push({ q: `一组数据 ${lo}，${ri(lo, hi)}，${hi} 的极差是（　）`, a: `${hi - lo}`, d: [`${hi - lo + 1}`, `${hi + lo}`, `${hi}`] });
    }
    reps.push({ q: '极差 = （　）', a: '最大值 − 最小值', d: ['最大值 + 最小值', '平均数 − 最小值', '最大值 ÷ 最小值'] });
    reps.push({ q: '方差用来衡量一组数据的（　）', a: '波动大小', d: ['平均水平', '集中位置', '总个数'] });
    reps.push({ q: '方差越大，说明这组数据（　）', a: '波动越大，越不稳定', d: ['波动越小，越稳定', '平均数越大', '中位数越大'] });
    reps.push({ q: '方差的计算公式 s² = （　）', a: '各数据与平均数差的平方的平均数', d: ['各数据与平均数差的平均数', '各数据与中位数差的平方和', '最大值减最小值'] });
    reps.push({ q: '数据 1，2，3 的平均数是 2，则这组数据的方差是（　）', a: '2/3', d: ['1', '2', '0'] });
    reps.push({ q: '数据 2，2，2，2 的方差是（　）', a: '0', d: ['1', '2', '4'] });
    reps.push({ q: '甲、乙两组数据的平均数相同，甲方差 0.5，乙方差 2.1，则（　）', a: '甲组数据更稳定', d: ['乙组数据更稳定', '两组一样稳定', '无法比较'] });
    // 用样本估计总体
    reps.push({ q: '在统计中，常用（　）的平均数来估计总体的平均数', a: '样本', d: ['个体', '中位数', '众数'] });
    reps.push({ q: '为了解一批灯泡的使用寿命，通常采用（　）', a: '抽样调查', d: ['全面调查', '逐个调查', '不调查'] });
    // 图形题
    reps.push({ s: barFig([4, 7, 5, 9]), q: '如图是某小组四人一周内做错题数量的条形图，这四人平均每人做错（　）道', a: '6.25', d: ['6', '7', '5'] });
    reps.push({ s: barFig([3, 8, 5, 4]), q: '如图是四人一周内做错题数量的条形图，这组数据的最大值与最小值的差（极差）是（　）', a: '5', d: ['4', '8', '11'] });
    return mk(pickNew(reps));
  }

  // 先注册八上（八下在同文件后半部分追加）
  window.__JR8_UP = [
    {
      name: '三角形', type: 'shape', group: '课本', term: '上', unit: 13, gen: jr8_tri,
      summary: ['三角形任意两边之和大于第三边，任意两边之差小于第三边', '三角形的内角和等于 180°', '三角形的一个外角等于与它不相邻的两个内角的和', '三角形的高、中线、角平分线都是线段', 'n 边形内角和 = (n−2)×180°', '任意多边形的外角和都等于 360°'],
      fidx: [{ t: '三边关系', f: '两边之和 > 第三边；两边之差 < 第三边' }, { t: '内角和', f: '∠A+∠B+∠C = 180°' }, { t: '外角', f: '外角 = 不相邻两内角之和' }, { t: '多边形', f: '内角和 = (n−2)×180°，外角和 = 360°' }],
      method: [{ t: '判断能否组成三角形', s: '只需检验「较短两边之和 > 最长边」' }, { t: '易错', s: '外角是与它**不相邻**的两个内角的和，不是任意两个' }]
    },
    {
      name: '全等三角形', type: 'shape', group: '课本', term: '上', unit: 14, gen: jr8_cong,
      summary: ['能够完全重合的两个三角形叫做全等三角形', '全等三角形的对应边相等、对应角相等', '判定方法：SSS、SAS、ASA、AAS，直角三角形另有 HL', 'AAA 和 SSA 不能判定全等', '角平分线上的点到角两边的距离相等'],
      fidx: [{ t: 'SSS', f: '三边分别相等' }, { t: 'SAS', f: '两边及其夹角分别相等' }, { t: 'ASA / AAS', f: '两角一边对应相等' }, { t: 'HL', f: '斜边和一条直角边（仅直角三角形）' }],
      method: [{ t: '找对应', s: '按顶点字母顺序找对应边和对应角' }, { t: '易错', s: 'SSA（边边角）不能判定全等；AAA 只能判定相似' }]
    },
    {
      name: '轴对称', type: 'shape', group: '课本', term: '上', unit: 15, gen: jr8_axial,
      summary: ['如果一个图形沿一条直线折叠，直线两旁的部分能够互相重合，这个图形叫轴对称图形', '对称轴是任何一对对应点所连线段的垂直平分线', '等腰三角形两底角相等（等边对等角）', '等腰三角形顶角的平分线、底边上的中线、底边上的高互相重合（三线合一）', '等边三角形三个内角都是 60°', '直角三角形中 30° 角所对的直角边等于斜边的一半'],
      fidx: [{ t: '等腰', f: '两腰相等，两底角相等' }, { t: '三线合一', f: '顶角平分线 = 底边中线 = 底边高' }, { t: '含30°直角三角形', f: '30°角对边 = 斜边的一半' }, { t: '垂直平分线', f: '线上的点到线段两端距离相等' }],
      method: [{ t: '等腰求角', s: '已知顶角求底角：(180°−顶角)÷2；已知底角求顶角：180°−2×底角' }, { t: '易错', s: '等腰三角形的角要分「顶角」还是「底角」讨论，可能有两种情况' }]
    },
    {
      name: '整式的乘法', type: 'basic', group: '课本', term: '上', unit: 16, gen: jr8_mul,
      summary: ['同底数幂相乘：底数不变，指数相加', '幂的乘方：底数不变，指数相乘', '积的乘方：等于把积的每一个因式分别乘方，再把所得的幂相乘', '单项式乘单项式：系数相乘，同底数幂分别相乘', '单项式乘多项式、多项式乘多项式：用乘法分配律', '平方差公式：(a+b)(a−b)=a²−b²', '完全平方公式：(a±b)²=a²±2ab+b²'],
      fidx: [{ t: '同底数幂', f: 'a^m · a^n = a^(m+n)' }, { t: '幂的乘方', f: '(a^m)^n = a^(mn)' }, { t: '积的乘方', f: '(ab)^n = a^n b^n' }, { t: '平方差', f: '(a+b)(a−b) = a²−b²' }, { t: '完全平方', f: '(a±b)² = a²±2ab+b²' }],
      method: [{ t: '乘法规律', s: '单项式相乘「系数乘系数、同底数幂指数相加」，只在一个单项式里出现的字母连同指数照抄' }, { t: '易错', s: '(a+b)² ≠ a²+b²，中间漏了 2ab' }]
    },
    {
      name: '因式分解', type: 'basic', group: '课本', term: '上', unit: 17, gen: jr8_fact,
      summary: ['把一个多项式化成几个整式的积的形式，叫做因式分解', '因式分解与整式乘法是互逆的变形', '提公因式法：找出各项的公因式提出来', '公式法：平方差公式、完全平方公式', '分解要彻底：每个因式都不能再分解为止'],
      fidx: [{ t: '提公因式', f: 'ma + mb + mc = m(a+b+c)' }, { t: '平方差', f: 'a²−b² = (a+b)(a−b)' }, { t: '完全平方', f: 'a²±2ab+b² = (a±b)²' }, { t: '十字相乘', f: 'x²+(p+q)x+pq = (x+p)(x+q)' }],
      method: [{ t: '分解步骤', s: '① 先看有无公因式 → ② 再看能否套公式 → ③ 检查是否分解彻底' }, { t: '易错', s: '分解不彻底（如 x⁴−1 只分解成 (x²+1)(x²−1) 就停）' }]
    },
    {
      name: '分式', type: 'basic', group: '课本', term: '上', unit: 18, gen: jr8_frac,
      summary: ['形如 A/B 的式子，B 中含有字母，叫做分式', '分式有意义的条件：分母不等于 0', '分式的值为 0：分子等于 0 且分母不等于 0', '分式的基本性质：分子分母同乘（或除以）同一个不为 0 的整式，值不变', '分式乘除：分子乘分子、分母乘分母；除以一个分式等于乘它的倒数', '异分母分式相加减：先通分，再加减', '解分式方程要检验增根'],
      fidx: [{ t: '有意义', f: '分母 ≠ 0' }, { t: '值为0', f: '分子 = 0 且分母 ≠ 0' }, { t: '乘除', f: 'A/B × C/D = AC/BD' }, { t: '加减', f: '异分母先通分' }],
      method: [{ t: '解分式方程', s: '① 去分母化为整式方程 → ② 解整式方程 → ③ 代入最简公分母检验' }, { t: '易错', s: '忘记检验增根；去分母时漏乘不含分母的项' }]
    }
  ];
  const UP = window.__JR8_UP;

  // ---------------- 八下单元（19-24） ----------------
  const DOWN = [
    {
      name: '二次根式', type: 'basic', group: '课本', term: '下', unit: 19, gen: jr8_sqrt,
      summary: ['形如 √a（a ≥ 0）的式子叫做二次根式', '二次根式有意义的条件：被开方数大于或等于 0', '(√a)² = a（a ≥ 0）；√(a²) = |a|', '最简二次根式：被开方数不含分母，也不含能开得尽方的因数', '同类二次根式：化成最简二次根式后，被开方数相同', '二次根式加减：先化简，再合并同类二次根式', '乘除：√a × √b = √(ab)，√a ÷ √b = √(a/b)'],
      fidx: [{ t: '有意义', f: '被开方数 ≥ 0' }, { t: '性质一', f: '(√a)² = a（a≥0）' }, { t: '性质二', f: '√(a²) = |a|' }, { t: '乘法', f: '√a × √b = √(ab)（a≥0,b≥0）' }, { t: '除法', f: '√a ÷ √b = √(a/b)（a≥0,b>0）' }],
      method: [{ t: '化简步骤', s: '① 把被开方数分解出完全平方数 → ② 开方提到根号外 → ③ 检查是否最简' }, { t: '易错', s: '√(a²) = |a|，a 为负数时结果是 −a，不是 a；加减前必须先化成最简二次根式' }]
    },
    {
      name: '勾股定理', type: 'shape', group: '课本', term: '下', unit: 20, gen: jr8_gougu,
      summary: ['直角三角形两直角边的平方和等于斜边的平方：a² + b² = c²', '勾股定理只适用于直角三角形', '常见勾股数：3,4,5；5,12,13；6,8,10；9,12,15；8,15,17', '逆定理：若 a² + b² = c²，则该三角形是直角三角形，c 边所对角为直角', '直角三角形斜边上的中线等于斜边的一半', '应用：梯子靠墙、大树折断、求长方形对角线、求最短路径'],
      fidx: [{ t: '勾股定理', f: 'a² + b² = c²（c 为斜边）' }, { t: '求直角边', f: 'a = √(c² − b²)' }, { t: '逆定理', f: 'a² + b² = c² → 直角三角形' }, { t: '斜边中线', f: '斜边中线 = 斜边的一半' }],
      method: [{ t: '解题步骤', s: '① 先确认是直角三角形 → ② 分清斜边和直角边 → ③ 代入 a² + b² = c² → ④ 开方' }, { t: '易错', s: '只给三边、不知哪条是斜边时，要用逆定理判断；斜边一定是最长边' }]
    },
    {
      name: '四边形', type: 'shape', group: '课本', term: '下', unit: 21, gen: jr8_quad,
      summary: ['两组对边分别平行的四边形是平行四边形', '平行四边形：对边平行且相等、对角相等、对角线互相平分', '判定：两组对边分别平行/相等、一组对边平行且相等、对角线互相平分', '矩形：有一个角是直角的平行四边形；四个角都是直角、对角线相等', '菱形：有一组邻边相等的平行四边形；四边相等、对角线互相垂直平分', '正方形：既是矩形又是菱形', '三角形中位线平行于第三边且等于第三边的一半'],
      fidx: [{ t: '平行四边形', f: '对边平行且相等；对角线互相平分' }, { t: '矩形', f: '四角直角；对角线相等' }, { t: '菱形面积', f: 'S = 对角线乘积 ÷ 2' }, { t: '中位线', f: '平行于第三边且等于其一半' }, { t: '直角三角形斜边中线', f: '= 斜边的一半' }],
      method: [{ t: '判定思路', s: '先证是平行四边形 → 再加一个特殊条件（有直角→矩形，邻边相等→菱形）' }, { t: '易错', s: '「一组对边平行、另一组对边相等」不能判定平行四边形（可能是等腰梯形）' }]
    },
    {
      name: '函数', type: 'application', group: '课本', term: '下', unit: 22, gen: jr8_func,
      summary: ['变量与常量：变化的量叫变量，不变的量叫常量', '函数：x 每取一个值，y 都有唯一确定的值与之对应', '自变量、函数值、函数关系式', '函数的三种表示法：解析式法、列表法、图象法', '自变量取值范围：整式取全体实数；分式分母 ≠ 0；二次根式被开方数 ≥ 0；实际问题要符合实际', '描点法画图：列表 → 描点 → 连线'],
      fidx: [{ t: '函数定义', f: 'x 每取一值，y 有唯一值对应' }, { t: '分式型', f: '分母 ≠ 0' }, { t: '根式型', f: '被开方数 ≥ 0' }, { t: '描点法', f: '列表 → 描点 → 连线' }],
      method: [{ t: '判断是否为函数', s: '作一条竖线：若与图象有两个及以上交点，则 y 不是 x 的函数' }, { t: '易错', s: '实际问题中自变量取值还要符合题意（如人数只能是正整数）' }]
    },
    {
      name: '一次函数', type: 'application', group: '课本', term: '下', unit: 23, gen: jr8_lin,
      summary: ['形如 y = kx + b（k ≠ 0）的函数叫做一次函数', 'b = 0 时，y = kx 是正比例函数，图象过原点', 'k > 0 时 y 随 x 增大而增大；k < 0 时 y 随 x 增大而减小', 'b 是图象与 y 轴交点的纵坐标，交点 (0, b)', '图象经过的象限由 k、b 的符号共同决定', '待定系数法：设 y = kx + b，代入两点坐标解方程组', '一次函数与方程、不等式的关系'],
      fidx: [{ t: '一般形式', f: 'y = kx + b（k ≠ 0）' }, { t: '增减性', f: 'k>0 增，k<0 减' }, { t: '与 y 轴交点', f: '(0, b)' }, { t: '与 x 轴交点', f: '(−b/k, 0)' }, { t: '象限', f: 'k>0,b>0→一二三；k>0,b<0→一三四；k<0,b>0→一二四；k<0,b<0→二三四' }],
      method: [{ t: '求解析式', s: '① 设 y = kx + b → ② 代入两个点的坐标 → ③ 解方程组求 k、b' }, { t: '易错', s: 'k = 0 时不是一次函数；k 的符号决定增减性，b 的符号只决定上下平移' }]
    },
    {
      name: '数据的分析', type: 'application', group: '课本', term: '下', unit: 24, gen: jr8_stat2,
      summary: ['平均数反映数据的平均水平，易受极端值影响', '加权平均数：各数据乘以相应的权再求平均', '中位数：按大小排列后处在中间位置的数，不受极端值影响', '众数：出现次数最多的数据，可能不止一个也可能没有', '极差 = 最大值 − 最小值，反映数据波动范围', '方差反映数据的波动大小，方差越小越稳定', '用样本估计总体'],
      fidx: [{ t: '平均数', f: 'x̄ =（x₁+x₂+…+xₙ）÷ n' }, { t: '中位数', f: '排序后中间的数（偶数个取中间两数的平均数）' }, { t: '极差', f: '最大值 − 最小值' }, { t: '方差', f: 's² = [（x₁−x̄）² + … +（xₙ−x̄）²] ÷ n' }],
      method: [{ t: '选统计量', s: '有极端值用中位数；要「多数水平」用众数；要比稳定性用方差' }, { t: '易错', s: '求中位数必须先排序；方差单位是原单位的平方，比较稳定性时只看大小' }]
    }
  ];

  KNOWLEDGE_BASE[8] = { 1: UP, 2: DOWN };
})();
