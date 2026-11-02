/* ============================================================================
 * 专项·圆的阴影部分  (circle_shade.js)
 * ----------------------------------------------------------------------------
 * 吕泳冀学习站 PWA —— 六年级（小升初奥数·圆与组合图形阴影面积/周长）专项练习。
 *
 * v126 重写要点（依据 v125 评测报告的 P0/P1/P2 问题）：
 *  1. 【配图几何全部校正】v125 只断言"SVG 存在"，漏掉 4 类图形画错，本版按几何语义重画：
 *     - T4 半圆：改为「坐在水平直径上的上半圆」，半圆平边与直径线方向一致，标注移入图内。
 *     - T5 四角花：四分之一圆半径由 SVG 自动放大后的「边长」纠正为「边长的一半」，
 *       弧端点改到各边中点（四段弧正好连成正方形内切圆），图形与答案重新自洽。
 *     - T7 月牙：半圆由「右半圆」纠正为「上半圆」，使内接等腰直角三角形真正落在半圆内。
 *     - T8 跑道：两端半圆由水平弦纠正为竖直直径（真正向左右外凸的跑道帽），
 *       并按 k(L+W)≤112 自适应缩放，杜绝 SVG 越出 viewBox 被裁切。
 *     - T10 直角三角+斜边半圆：法向角改由「斜边方向」求得，半圆直径真正落在斜边上。
 *     - T12 四叶草：4 个半圆的圆心由正方形中心纠正到四条边的中点。
 *  2. 【新增 T13 大圆内两半圆（花瓣形）】补上评测中「全库 0 命中」的缺失题型。
 *  3. 【参数空间 208 → 约 380】各类型取值范围扩大，SEEN_CAP 120 → 400（约 20 场），
 *     且跨场补题时优先取「最久没练过」的签名（原实现恰好取最近练过的，最差选择）。
 *  4. 【答案零舍入】T9 面积参数改为 R、r 均取偶数，使 (R²−r²)/4 为整数，
 *     不再出现 71.435 → 71.44 这类与「精确判等」冲突的四舍五入。
 *  5. 【每题带解析】13 类各写公式型 explain（PC 与手机端都会渲染「解析：」）。
 *
 * 设计约定：
 *  - 导出全局 g_circle_shade()，每次调用返回【整组 20 题数组】（基础8/进阶6/提高6）。
 *  - 每题均为填空(fill) + 数字键盘(inputType:'number')，零打字；答案为纯数字，
 *    单位写在题干里；π 统一取 3.14；所有答案精确到两位小数（与判分精确相等兼容）。
 *  - 每题必配图：内联 SVG（viewBox 0 0 120 100），灰色=阴影、黛蓝=描边、香槟金=标注。
 * ========================================================================== */
(function () {
  'use strict';

  // ---- 配色（与全站 FIG_* 一致：黛蓝描边 / 香槟金标注 / 灰填充阴影） ----
  var CS = '#3E4A63';   // stroke 黛蓝
  var CG = '#B4945A';   // gold 香槟金（尺寸标注）
  var CSH = '#DCDCDC';  // shade 灰色（阴影部分）
  var CW = '#FFFFFF';   // 空白（被挖去/未阴影）

  // ---- 基础工具 ----
  function cs_fmt(n) {
    n = Number(n);
    if (isNaN(n)) return String(n);
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2).replace(/\.?0+$/, '');
  }
  function cs_ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function cs_pick(arr) { return arr[cs_ri(0, arr.length - 1)]; }

  // 极坐标约定：deg=0 正上、90 右、180 下、270 左（顺时针增大，屏幕坐标 y 向下）
  function polar(cx, cy, r, deg) {
    var t = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  }
  // 圆弧路径（sweep=1 顺时针）：
  //   上半圆(270→90) 下半圆(90→270) 左半圆(180→360) 右半圆(0→180)
  function arcP(cx, cy, r, a0, a1) {
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    var large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return 'M ' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) +
      ' A ' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 ' + large + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
  }
  // 以角点为圆心的四分之一圆扇形（两条半径 + 圆弧），a0 为第一条半径的极角
  function quarterDisc(cx, cy, r, a0) {
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a0 + 90);
    return 'M ' + cx.toFixed(1) + ' ' + cy.toFixed(1) +
      ' L ' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) +
      ' A ' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 0 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' Z';
  }
  // 扇环（a0→a1 之间的环形扇区，含两条半径边）
  function sectorRing(cx, cy, Ro, Ri, a0, a1) {
    var o0 = polar(cx, cy, Ro, a0), o1 = polar(cx, cy, Ro, a1);
    var i1 = polar(cx, cy, Ri, a1), i0 = polar(cx, cy, Ri, a0);
    var large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return 'M ' + o0[0].toFixed(1) + ' ' + o0[1].toFixed(1) +
      ' A ' + Ro.toFixed(1) + ' ' + Ro.toFixed(1) + ' 0 ' + large + ' 1 ' + o1[0].toFixed(1) + ' ' + o1[1].toFixed(1) +
      ' L ' + i1[0].toFixed(1) + ' ' + i1[1].toFixed(1) +
      ' A ' + Ri.toFixed(1) + ' ' + Ri.toFixed(1) + ' 0 ' + large + ' 0 ' + i0[0].toFixed(1) + ' ' + i0[1].toFixed(1) + ' Z';
  }
  function T(x, y, txt, col, size) {
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
      '" text-anchor="middle" font-size="' + (size || 9) + '" fill="' + (col || CS) + '">' + txt + '</text>';
  }
  function ln(x1, y1, x2, y2, col, w) {
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
      '" stroke="' + (col || CS) + '" stroke-width="' + (w || 1.8) + '"/>';
  }
  function cir(cx, cy, r) { return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="none" stroke="' + CS + '" stroke-width="1.8"/>'; }

  var PI = 3.14;
  function head() { return '(π取3.14)'; }

  // ===========================================================================
  //  13 类图形生成器（每类返回 {q, a, svg, diff, ask, sig, explain}）
  // ===========================================================================

  // ---- T1 方中圆：正方形内最大圆（阴影=四个角）  [基础] ----
  function t1() {
    var a = cs_pick([4, 6, 8, 10, 12, 14, 16]);
    var S = a * Math.min(7, 96 / a);                 // 自适应：保证正方形不出画布
    var x = 60 - S / 2, y = 50 - S / 2, rad = S / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + S.toFixed(1) + '" height="' + S.toFixed(1) +
      '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60, 50, 60, 50 - rad, CG, 1.1) +
      T(60, y - 4, 'a=' + a, CG, 9) + T(60 + rad / 2, 50 - rad / 2 - 3, 'r=' + (a / 2), CG, 8.5);
    var ask = cs_pick(['area', 'perim']);
    var a1 = a * a - PI * (a / 2) * (a / 2), p1 = 4 * a + PI * a;
    var ex = '正方形面积 a² = ' + a + '×' + a + ' = ' + (a * a) + '；最大的圆半径 a÷2 = ' + (a / 2) +
      '，面积 πr² = ' + PI + '×' + (a / 2) + '² = ' + cs_fmt(PI * (a / 2) * (a / 2)) +
      '。阴影（四个角）= 正方形 − 圆 = ' + (a * a) + ' − ' + cs_fmt(PI * (a / 2) * (a / 2)) + ' = ' + cs_fmt(a1) + ' 平方厘米。' +
      (ask === 'perim' ? '周长 = 正方形周长 + 圆周长 = ' + (4 * a) + ' + ' + cs_fmt(PI * a) + ' = ' + cs_fmt(p1) + ' 厘米。' : '');
    return {
      q: '如图，正方形边长 ' + a + ' 厘米，里面画了一个最大的圆（阴影为四个角）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a1 : p1, svg: svg, diff: 1, ask: ask, sig: 'T1|' + a + '|' + ask, explain: ex
    };
  }

  // ---- T2 圆中方：圆内最大正方形（阴影=四角弓形）  [基础, 仅面积]
  //     正方形对角线=2R → 边长 R√2，周长含无理数，数字键盘无法输入，故只问面积 ----
  function t2() {
    var R = cs_pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    var k = Math.min(4.8, 42 / R);
    var h = R * k;                                    // 正方形半对角线（= 圆半径）
    var pts = [[60, 50 - h], [60 + h, 50], [60, 50 + h], [60 - h, 50]]
      .map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var svg = '<circle cx="60" cy="50" r="' + h.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<polygon points="' + pts + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60, 50, 60, 50 - h, CG, 1.1) +
      T(60, 50 - h - 4, 'R=' + R, CG, 9) + T(60 + h / 2, 50 - h / 2 - 3, 'r=' + R, CG, 8.5);
    var a2 = PI * R * R - 2 * R * R;
    var ex = '圆的面积 πR² = ' + PI + '×' + R + '² = ' + cs_fmt(PI * R * R) +
      '；内接最大正方形的对角线等于直径 2R，所以边长 = 2R÷√2，面积 = 对角线²÷2 = ' + (2 * R) + '²÷2 = ' + (2 * R * R) +
      '。阴影（四个角）= 圆 − 正方形 = ' + cs_fmt(PI * R * R) + ' − ' + (2 * R * R) + ' = ' + cs_fmt(a2) + ' 平方厘米。';
    return {
      q: '如图，圆的半径 ' + R + ' 厘米，里面画了一个最大的正方形（阴影为四个角）。阴影部分的面积约是多少平方厘米？' + head(),
      a: a2, svg: svg, diff: 1, ask: 'area', sig: 'T2|' + R, explain: ex
    };
  }

  // ---- T3 圆环  [基础] ----
  function t3() {
    var R = cs_pick([5, 6, 7, 8, 9, 10, 11, 12]);
    var r = cs_pick([2, 3, 4, 5, 6]);
    if (r >= R) r = Math.max(2, R - cs_ri(1, 2));
    var k = Math.min(4.2, 40 / R);
    var Ro = R * k, Ri = r * k;
    var svg = '<circle cx="60" cy="50" r="' + Ro.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<circle cx="60" cy="50" r="' + Ri.toFixed(1) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60, 50, 60 + Ro, 50, CG, 1.1) + ln(60, 50, 60, 50 + Ri, CG, 1.1) +
      T(60 + Ro / 2, 47, 'R=' + R, CG, 9) + T(53, 50 + Ri / 2, 'r=' + r, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a3 = PI * (R * R - r * r), p3 = 2 * PI * (R + r);
    var ex = '圆环面积 = 外圆 − 内圆 = πR² − πr² = ' + PI + '×(' + R + '² − ' + r + '²) = ' + cs_fmt(a3) + ' 平方厘米。' +
      (ask === 'perim' ? '圆环周长 = 外圆周长 + 内圆周长 = 2π(R+r) = ' + cs_fmt(p3) + ' 厘米。' : '');
    return {
      q: '如图，圆环外圆半径 ' + R + ' 厘米、内圆半径 ' + r + ' 厘米（阴影为圆环）。圆环的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a3 : p3, svg: svg, diff: 1, ask: ask, sig: 'T3|' + R + '|' + r + '|' + ask, explain: ex
    };
  }

  // ---- T4 半圆（坐在水平直径上的上半圆）  [基础] ----
  function t4() {
    var r = cs_pick([2, 3, 4, 5, 6, 7, 8]);
    var R = r * Math.min(6, 44 / r), cy = 54;
    var svg = '<path d="' + arcP(60, cy, R, 270, 90) + ' Z" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60 - R, cy, 60 + R, cy) +
      ln(60, cy, 60, cy - R, CG, 1.1) +
      T(60, cy + 13, 'r=' + r, CG, 9) + T(63, cy - R / 2, 'r', CG, 8.5);
    var ask = cs_pick(['area', 'perim']);
    var a4 = PI * r * r / 2, p4 = PI * r + 2 * r;
    var ex = '半圆面积 = 整圆面积 ÷ 2 = πr² ÷ 2 = ' + PI + '×' + r + '² ÷ 2 = ' + cs_fmt(a4) + ' 平方厘米。' +
      (ask === 'perim' ? '半圆周长 = 弧长 + 直径 = πr + 2r = ' + cs_fmt(PI * r) + ' + ' + (2 * r) + ' = ' + cs_fmt(p4) + ' 厘米（别漏直径）。' : '');
    return {
      q: '如图，半圆的半径 ' + r + ' 厘米（阴影为半圆）。半圆的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a4 : p4, svg: svg, diff: 1, ask: ask, sig: 'T4|' + r + '|' + ask, explain: ex
    };
  }

  // ---- T5 四角花：正方形四角各画四分之一圆（弧连成内切圆），阴影=这四个四分之一圆  [进阶] ----
  function t5() {
    var a = cs_pick([4, 6, 8, 10, 12, 14, 16]);
    var S = a * Math.min(6, 96 / a), r = S / 2;
    var x0 = 60 - S / 2, y0 = 50 - S / 2, x1 = 60 + S / 2, y1 = 50 + S / 2;
    // 四条边中点处的四分之一圆（圆心在角，半径 = 边长一半）
    var svg = '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + S.toFixed(1) + '" height="' + S.toFixed(1) +
      '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + quarterDisc(x0, y0, r, 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + quarterDisc(x1, y0, r, 180) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + quarterDisc(x1, y1, r, 270) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + quarterDisc(x0, y1, r, 0) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      T(60, y0 - 4, 'a=' + a, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a5 = PI * (a / 2) * (a / 2);                 // 4 个四分之一圆（半径 a/2）
    var p5 = 4 * a + PI * a;                         // 4 块角：每块 2 条半径 + 1/4 圆弧
    var ex = '正方形边长 ' + a + '，四个角上每个四分之一圆的半径 = 边长÷2 = ' + (a / 2) +
      '。四个四分之一圆合起来正好是 1 个整圆：面积 = π×(' + (a / 2) + ')² = ' + cs_fmt(a5) + ' 平方厘米。' +
      (ask === 'perim' ? '阴影（四个角）的周长 = 每块角的两条半径 + 一段四分之一圆弧，4 块共 4×2×(' + (a / 2) + ') + 整圆周长 π×' + a + ' = ' + cs_fmt(p5) + ' 厘米。' : '');
    return {
      q: '如图，正方形边长 ' + a + ' 厘米，四个角各画一个四分之一圆（阴影为四个角）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a5 : p5, svg: svg, diff: 2, ask: ask, sig: 'T5|' + a + '|' + ask, explain: ex
    };
  }

  // ---- T6 长方内最大圆（阴影=四角）  [进阶] ----
  function t6() {
    var W = cs_pick([4, 6, 8, 10, 12]);
    var L = W + cs_ri(2, 8);
    var k = Math.min(6, 104 / L, 38 / W);
    var SW = W * k, SL = L * k, x = 60 - SL / 2, y = 50 - SW / 2, rad = SW / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + SL.toFixed(1) + '" height="' + SW.toFixed(1) +
      '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60, 50, 60, 50 - rad, CG, 1.1) +
      T(60, y - 4, '长 ' + L, CG, 9) + T(x + 12, 50 + SW / 2 + 12, '宽 ' + W, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a6 = L * W - PI * (W / 2) * (W / 2), p6 = 2 * (L + W) + PI * W;
    var ex = '长方形面积 = ' + L + '×' + W + ' = ' + (L * W) +
      '；最大的圆直径 = 宽 ' + W + '，半径 = ' + (W / 2) + '，面积 = ' + cs_fmt(PI * (W / 2) * (W / 2)) +
      '。阴影（四个角）= 长方形 − 圆 = ' + cs_fmt(a6) + ' 平方厘米。' +
      (ask === 'perim' ? '周长 = 长方形周长 + 圆周长 = ' + (2 * (L + W)) + ' + ' + cs_fmt(PI * W) + ' = ' + cs_fmt(p6) + ' 厘米。' : '');
    return {
      q: '如图，长方形长 ' + L + ' 厘米、宽 ' + W + ' 厘米，里面画了一个最大的圆（阴影为四个角）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a6 : p6, svg: svg, diff: 2, ask: ask, sig: 'T6|' + L + '|' + W + '|' + ask, explain: ex
    };
  }

  // ---- T7 半圆 − 内接等腰直角三角形（阴影=月牙）  [进阶, 仅面积] ----
  function t7() {
    var r = cs_pick([2, 3, 4, 5, 6, 7, 8]);
    var R = r * Math.min(6, 40 / r), cy = 52;
    var lx = 60 - R, rx = 60 + R, ty = cy - R;
    var svg = '<path d="' + arcP(60, cy, R, 270, 90) + ' Z" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(lx, cy, rx, cy) +
      '<polygon points="' + lx.toFixed(1) + ',' + cy + ' ' + rx.toFixed(1) + ',' + cy + ' ' + 60 + ',' + ty.toFixed(1) +
      '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60, cy, 60, ty, CG, 1.1) +
      T(60, cy + 13, 'r=' + r, CG, 9);
    var a7 = PI * r * r / 2 - r * r;
    var ex = '半圆面积 = πr² ÷ 2 = ' + PI + '×' + r + '² ÷ 2 = ' + cs_fmt(PI * r * r / 2) +
      '；内接等腰直角三角形的斜边就是直径 2' + r + '，高 = ' + r + '，面积 = ' + r + '×' + r + ' ÷ 2 = ' + (r * r) +
      '。阴影（月牙）= 半圆 − 三角形 = ' + cs_fmt(a7) + ' 平方厘米。';
    return {
      q: '如图，半圆的半径 ' + r + ' 厘米，里面画了一个最大的等腰直角三角形（阴影为月牙形）。阴影部分的面积约是多少平方厘米？' + head(),
      a: a7, svg: svg, diff: 2, ask: 'area', sig: 'T7|' + r, explain: ex
    };
  }

  // ---- T8 双半圆跑道（矩形 + 左右两端竖直半圆）  [进阶] ----
  function t8() {
    var W = cs_pick([4, 6, 8, 10, 12]);
    var L = W + cs_ri(3, 10);
    var k = Math.min(6, 112 / (L + W), 44 / W);     // 保证跑道总宽 ≤112，不出画布
    var SW = W * k, SL = L * k, x = 60 - SL / 2, y = 50 - SW / 2, rad = SW / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + SL.toFixed(1) + '" height="' + SW.toFixed(1) +
      '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 左端半圆帽：竖直直径、向左外凸
      '<path d="' + arcP(x, 50, rad, 180, 360) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 右端半圆帽：竖直直径、向右外凸
      '<path d="' + arcP(x + SL, 50, rad, 0, 180) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, y - 4, '长 ' + L, CG, 9) + T(x + SL / 2, 50 + SW / 2 + 13, '宽 ' + W, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a8 = L * W + PI * (W / 2) * (W / 2), p8 = 2 * L + PI * W;
    var ex = '跑道面积 = 中间长方形 + 两端两个半圆（合起来正好 1 个整圆）= ' + L + '×' + W + ' + π×(' + (W / 2) + ')² = ' +
      cs_fmt(a8) + ' 平方厘米。' +
      (ask === 'perim' ? '跑道一周长 = 两条长 + 一个整圆的周长 = ' + (2 * L) + ' + ' + cs_fmt(PI * W) + ' = ' + cs_fmt(p8) +
        ' 厘米（两端半圆的弧正好凑成一个整圆周长，别把直边漏掉）。' : '');
    return {
      q: '如图，跑道由中间长方形（长 ' + L + ' 厘米、宽 ' + W + ' 厘米）和两端两个半圆组成（阴影为整个跑道）。跑道的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '一周长约是多少厘米？') + head(),
      a: ask === 'area' ? a8 : p8, svg: svg, diff: 2, ask: ask, sig: 'T8|' + L + '|' + W + '|' + ask, explain: ex
    };
  }

  // ---- T9 四分之一圆环（扇环）  [提高] R、r 取偶数 → (R²−r²)/4 为整数，答案无需舍入 ----
  function t9() {
    var R = cs_pick([6, 8, 10, 12, 14]);
    var r = cs_pick([2, 4, 6]);
    if (r >= R) r = 2;
    var k = Math.min(4.0, 40 / R);
    var Ro = R * k, Ri = r * k;
    var svg = '<path d="' + sectorRing(60, 50, Ro, Ri, 0, 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60, 50, 60 + Ro, 50, CG, 1.1) + ln(60, 50, 60, 50 + Ri, CG, 1.1) +
      T(60 + Ro / 2 + 3, 47, 'R=' + R, CG, 9) + T(53, 50 + Ri / 2 + 1, 'r=' + r, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a9 = PI * (R * R - r * r) / 4;
    var p9 = 2 * (R - r) + PI * (R + r) / 2;
    var ex = '扇环面积 = 整圆环面积 ÷ 4 = π(R²−r²) ÷ 4 = ' + PI + '×(' + R + '²−' + r + '²) ÷ 4 = ' + cs_fmt(a9) + ' 平方厘米。' +
      (ask === 'perim' ? '扇环周长 = 两条半径 + 两段弧（合起来是半个圆环的弧）= 2×(' + R + '−' + r + ') + ' + cs_fmt(PI * (R + r) / 2) + ' = ' + cs_fmt(p9) + ' 厘米。' : '');
    return {
      q: '如图，一个四分之一圆环（扇环），外圆半径 ' + R + ' 厘米、内圆半径 ' + r + ' 厘米（阴影为扇环）。这个扇环的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a9 : p9, svg: svg, diff: 3, ask: ask, sig: 'T9|' + R + '|' + r + '|' + ask, explain: ex
    };
  }

  // ---- T10 直角三角形 + 斜边半圆（半圆在外部）  [提高] ----
  function t10() {
    var trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20],
                 [10, 24, 26], [7, 24, 25], [15, 20, 25], [16, 30, 34], [20, 21, 29], [18, 24, 30]];
    var tr = cs_pick(trips), a = tr[0], b = tr[1], c = tr[2];
    var k = Math.min(3.4, 56 / Math.max(a, b));
    var ax = 60 - a * k / 2, ay = 50 + b * k / 2;      // 直角顶点（左下）
    var bx = ax + a * k, by = ay;                       // a 边右端
    var cx2 = ax, cy2 = ay - b * k;                     // b 边上端
    var mx = (bx + cx2) / 2, my = (by + cy2) / 2, R = c * k / 2;   // 半圆圆心 = 斜边中点
    // 半圆直径必须落在斜边方向上：u = 单位(斜边方向)；a0 使弦方向 = u
    var ux = (cx2 - bx), uy = (cy2 - by);
    var ul = Math.sqrt(ux * ux + uy * uy);
    ux /= ul; uy /= ul;
    var a0 = Math.atan2(uy, ux) * 180 / Math.PI;       // 弦方向角
    // 该角度下弧的凸出方向为 (sin a0, −cos a0)；若朝向三角形内侧则翻 180°
    if ((uy * (mx - ax) + (-ux) * (my - ay)) < 0) a0 += 180;
    var svg = '<polygon points="' + ax.toFixed(1) + ',' + ay.toFixed(1) + ' ' + bx.toFixed(1) + ',' + by.toFixed(1) + ' ' +
      cx2.toFixed(1) + ',' + cy2.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="' + arcP(mx, my, R, a0 - 90, a0 + 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T((ax + bx) / 2, ay + 12, 'a=' + a, CG, 8.5) + T(ax - 6, (ay + cy2) / 2, 'b=' + b, CG, 8.5) +
      T(mx + 4, my - R - 5, 'c=' + c, CG, 8.5);
    var ask = cs_pick(['area', 'perim']);
    var a10 = a * b / 2 + PI * c * c / 2, p10 = a + b + c + PI * c;
    var ex = '三角形面积 = ' + a + '×' + b + ' ÷ 2 = ' + (a * b / 2) +
      '；斜边 ' + c + ' 上的半圆（以斜边为直径）面积 = π×(' + c + ' ÷ 2)² ÷ 2 = ' + cs_fmt(PI * c * c / 2) +
      '。组合图形 = 三角形 + 半圆 = ' + cs_fmt(a10) + ' 平方厘米。' +
      (ask === 'perim' ? '周长 = 三条边 + 半圆弧（弧长 = πc）= ' + (a + b + c) + ' + ' + cs_fmt(PI * c) + ' = ' + cs_fmt(p10) + ' 厘米。' : '');
    return {
      q: '如图，直角三角形两条直角边 ' + a + ' 厘米、' + b + ' 厘米，斜边 ' + c + ' 厘米；在斜边外侧画了一个半圆（阴影为整个图形）。这个组合图形的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a10 : p10, svg: svg, diff: 3, ask: ask, sig: 'T10|' + a + '|' + b + '|' + c + '|' + ask, explain: ex
    };
  }

  // ---- T11 圆被直径分成 4 份，阴影为其中 k 份  [提高] ----
  function t11() {
    var parts = cs_pick([2, 3]);
    var R = parts === 3 ? cs_pick([4, 6, 8, 10]) : cs_pick([3, 4, 5, 6, 7, 8, 9, 10]);
    var k = Math.min(4.4, 42 / R);
    var rad = R * k;
    var svg = '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      ln(60 - rad, 50, 60 + rad, 50, CG, 1.1) + ln(60, 50 - rad, 60, 50 + rad, CG, 1.1) +
      T(60, 50 - rad - 4, 'R=' + R, CG, 9);
    // 阴影：2 份 → 相对两份；3 份 → 遮白其中 1 份，其余 3 份为阴影
    if (parts === 2) {
      svg = '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
        '<path d="' + sectorRing(60, 50, rad, 0, 90, 270) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1"/>' +
        ln(60 - rad, 50, 60 + rad, 50, CG, 1.1) + ln(60, 50 - rad, 60, 50 + rad, CG, 1.1) +
        T(60, 50 - rad - 4, 'R=' + R, CG, 9);
    } else {
      svg = '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
        '<path d="' + sectorRing(60, 50, rad, 0, 90, 180) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1"/>' +
        ln(60 - rad, 50, 60 + rad, 50, CG, 1.1) + ln(60, 50 - rad, 60, 50 + rad, CG, 1.1) +
        T(60, 50 - rad - 4, 'R=' + R, CG, 9);
    }
    var a11 = PI * R * R * parts / 4;
    var ex = '整个圆分成 4 份，每份是 πR² ÷ 4 = ' + cs_fmt(PI * R * R / 4) +
      ' 平方厘米；阴影 ' + parts + ' 份 = ' + parts + ' × ' + cs_fmt(PI * R * R / 4) + ' = ' + cs_fmt(a11) + ' 平方厘米。';
    return {
      q: '如图，圆被两条互相垂直的直径分成 4 等份，阴影为其中 ' + parts + ' 份' +
        (parts === 2 ? '（相对的两份）' : '') + '。阴影部分的面积约是多少平方厘米？' + head(),
      a: a11, svg: svg, diff: 3, ask: 'area', sig: 'T11|' + R + '|' + parts, explain: ex
    };
  }

  // ---- T12 四叶草：正方形四条边各向外画一个半圆（阴影=四个叶子）  [提高] ----
  function t12() {
    var a = cs_pick([4, 6, 8, 10, 12]);
    var S = a * Math.min(5.0, 48 / a), r = S / 2;
    var x0 = 60 - S / 2, y0 = 50 - S / 2, x1 = 60 + S / 2, y1 = 50 + S / 2;
    var svg = '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + S.toFixed(1) + '" height="' + S.toFixed(1) +
      '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 上边：水平直径、向外（上）凸
      '<path d="' + arcP(60, y0, r, 270, 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 下边
      '<path d="' + arcP(60, y1, r, 90, 270) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 左边：竖直直径、向外（左）凸
      '<path d="' + arcP(x0, 50, r, 180, 360) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 右边
      '<path d="' + arcP(x1, 50, r, 0, 180) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, y0 - r - 2, 'a=' + a, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a12 = 4 * (PI * (a / 2) * (a / 2) / 2);        // 4 个半圆（叶子）
    var p12 = 4 * (PI * (a / 2));                        // 4 段半圆弧
    var ex = '每个半圆的直径 = 正方形边长 ' + a + '，半径 = ' + (a / 2) +
      '。4 个半圆（叶子）面积 = 4 × π×(' + (a / 2) + ')² ÷ 2 = ' + cs_fmt(a12) + ' 平方厘米。' +
      (ask === 'perim' ? '四叶草周长 = 4 段半圆弧 = 4 × π×(' + (a / 2) + ') = ' + cs_fmt(p12) + ' 厘米（正方形的边不是它的边界）。' : '');
    return {
      q: '如图，正方形边长 ' + a + ' 厘米，四条边上各向外画一个半圆（阴影为四个叶子）。四叶草的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a12 : p12, svg: svg, diff: 3, ask: ask, sig: 'T12|' + a + '|' + ask, explain: ex
    };
  }

  // ---- T13 大圆内两个半圆（花瓣形）：直径上作两个半圆，阴影=上半大圆减去两个小半圆  [进阶]
  function t13() {
    var R = cs_pick([4, 6, 8, 10]);                     // 偶数 → 面积 πR²/4 精确两位小数
    var k = Math.min(5.0, 44 / R);
    var rad = R * k, sr = rad / 2;
    var svg = '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(60, 50, rad, 90, 270) + ' Z" fill="' + CW + '" stroke="none"/>' +
      '<path d="' + arcP(60 - sr, 50, sr, 270, 90) + ' Z" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + arcP(60 + sr, 50, sr, 270, 90) + ' Z" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      ln(60 - rad, 50, 60 + rad, 50) +
      T(60 - rad / 2, 58, 'R', CG, 9) + T(60 + rad / 2, 58, 'R', CG, 9) +
      T(60, 50 - rad - 5, '大圆半径 R', CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a13 = PI * R * R / 4;
    var p13 = 2 * PI * R;
    var ex = '大圆半径 R = ' + R + '，直径 ' + (2 * R) + ' 被分成两段，每段 R，正好是两个小半圆的直径（半径 ' + (R / 2) + '）。' +
      '阴影 = 上半大圆 − 两个小半圆的上半 = πR² ÷ 2 − 2 × (π×(' + (R / 2) + ')² ÷ 2) = ' + cs_fmt(a13) + ' 平方厘米。' +
      (ask === 'perim' ? '阴影周长 = 大圆上半弧 πR + 两个小半圆弧 πR = 2πR = ' + cs_fmt(p13) + ' 厘米。' : '');
    return {
      q: '如图，大圆的半径是 ' + R + ' 厘米（直径被分成两段，每段 ' + R + ' 厘米），在这两段上各画了一个半圆（阴影为大圆上半部分减去这两个半圆）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a13 : p13, svg: svg, diff: 2, ask: ask, sig: 'T13|' + R + '|' + ask, explain: ex
    };
  }

  var S1 = [t1, t2, t3, t4];            // 基础
  var S2 = [t5, t6, t7, t8, t13];       // 进阶
  var S3 = [t9, t10, t11, t12];         // 提高

  // ===========================================================================
  //  跨会话去重：localStorage 签名环（约 20 场 = 400 个签名）
  // ===========================================================================
  var SEEN_KEY = 'math_circle_shade_seen_v1';
  var SEEN_CAP = 400;
  function loadSeen() {
    try { return JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem(SEEN_KEY) : null) || '[]') || []; }
    catch (e) { return []; }
  }
  function saveSeen(arr) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(SEEN_KEY, JSON.stringify(arr.slice(0, SEEN_CAP))); } catch (e) {}
  }

  // ===========================================================================
  //  主入口：返回 20 题（基础8 / 进阶6 / 提高6）
  // ===========================================================================
  function g_circle_shade() {
    var seen = loadSeen();
    var seenSet = {}; seen.forEach(function (s) { seenSet[s] = 1; });
    var out = [], outSig = {};

    // 按难度档独立凑足数量，保证「基础8 / 进阶6 / 提高6」且跨场去重
    function buildTier(pool, n) {
      var cands = [], local = {}, i, q, sg;
      for (i = 0; i < 400 && cands.length < n * 5; i++) {
        q = cs_pick(pool)();
        if (!q || !q.q || q.a == null) continue;
        sg = q.sig;
        if (local[sg] || outSig[sg]) continue;
        local[sg] = 1; cands.push(q);
      }
      var unseen = cands.filter(function (q) { return !seenSet[q.sig]; });
      var chosen = unseen.slice(0, n);
      if (chosen.length < n) {
        // 补齐时优先取「最久没练过」的（seen 环最新在前 → 反向取尾部），而不是刚练过的
        var relaxed = cands.filter(function (q) { return seenSet[q.sig]; });
        var pool2 = relaxed.slice().reverse();
        chosen = chosen.concat(pool2.slice(0, n - chosen.length));
      }
      chosen.forEach(function (q) { q._sig = q.sig; outSig[q.sig] = 1; out.push(q); });
    }

    buildTier(S1, 8);
    buildTier(S2, 6);
    buildTier(S3, 6);

    // 记录本场签名（最新在前），供下一场避开
    var fresh = out.map(function (q) { return q._sig; });
    saveSeen(fresh.concat(seen));

    // 组装为引擎认识的题目对象（填空 + 数字键盘）
    return out.map(function (q) {
      var ans = cs_fmt(q.a);
      return {
        type: 'fill',
        question: q.q,
        answer: ans,
        explain: q.explain,
        svg: q.svg,
        inputType: 'number',
        diff: q.diff,
        ask: q.ask,
        sig: q.sig,
        _circleShade: true
      };
    });
  }

  // 供测试/调试使用
  if (typeof window !== 'undefined') window.g_circle_shade = g_circle_shade;
  if (typeof module !== 'undefined' && module.exports) module.exports = { g_circle_shade: g_circle_shade };
})();
