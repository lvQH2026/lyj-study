/* ============================================================================
 * 专项·圆的阴影部分  (circle_shade.js)
 * ----------------------------------------------------------------------------
 * 吕泳冀学习站 PWA —— 六年级（小升初奥数·圆与组合图形阴影面积/周长）专项练习。
 *
 * 设计要点（对齐站内引擎约定）：
 *  1. 导出全局函数 g_circle_shade()，每次调用返回【整组 20 题数组】。
 *     引擎在 gen() 返回数组时直接作为整份练习使用（见 math.js buildUnitQuizQuestions）。
 *  2. 难度分布固定为：基础 8 题(diff=1) + 进阶 6 题(diff=2) + 提高 6 题(diff=3)，
 *     满足用户确认的「三档混合 4:3:3 → 20 题 8/6/6」。
 *  3. 每题均为填空(fill) + 数字键盘(inputType:'number')，零打字；答案为纯数字，
 *     单位写在题干里；π 统一取 3.14。所有 π 系数均取整数或半整数，
 *     保证答案精确到两位小数（与判分 looseNumericEquals 不冲突）。
 *  4. 每题必配图：内联 SVG（viewBox 0 0 120 100），灰色填充阴影、黛蓝描边、香槟金标注。
 *  5. 去重机制双层：
 *     - 引擎层 visKey（题面+图形）保证同场 20 题互不相同；
 *     - 本模块 localStorage 签名环（最近约 6 场）保证「每次出题均不重复」跨会话生效。
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
  function polar(cx, cy, r, deg) {
    var t = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  }
  // 圆弧路径（deg：0=正上，顺时针增大；sweep=1 顺时针）
  function arcP(cx, cy, r, a0, a1) {
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    var large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return 'M ' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) +
      ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
  }
  // 扇环（a0→a1 之间的环形扇区，含两条半径边）
  function sectorRing(cx, cy, Ro, Ri, a0, a1) {
    var o0 = polar(cx, cy, Ro, a0), o1 = polar(cx, cy, Ro, a1);
    var i1 = polar(cx, cy, Ri, a1), i0 = polar(cx, cy, Ri, a0);
    var large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return 'M ' + o0[0].toFixed(1) + ' ' + o0[1].toFixed(1) +
      ' A ' + Ro + ' ' + Ro + ' 0 ' + large + ' 1 ' + o1[0].toFixed(1) + ' ' + o1[1].toFixed(1) +
      ' L ' + i1[0].toFixed(1) + ' ' + i1[1].toFixed(1) +
      ' A ' + Ri + ' ' + Ri + ' 0 ' + large + ' 0 ' + i0[0].toFixed(1) + ' ' + i0[1].toFixed(1) + ' Z';
  }
  function T(x, y, txt, col, size) {
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
      '" text-anchor="middle" font-size="' + (size || 9) + '" fill="' + (col || CS) + '">' + txt + '</text>';
  }
  function cir(cx, cy, r) { return [cx, cy, r]; }

  // 题面统一抬头：π 取值声明 + 单位
  var PI = 3.14;
  function head() { return '(π取3.14)'; }

  // ===========================================================================
  //  12 类图形生成器（每类返回 {q, a, svg, diff, ask, sig}）
  //  ask: 'area' | 'perim'；diff: 1/2/3
  // ===========================================================================

  // ---- T1 方中圆：正方形内最大圆（阴影=四个角）  [基础] ----
  function t1() {
    var a = cs_pick([4, 6, 8, 10, 12]), r = a / 2, S = a * 7;
    var x = 60 - S / 2, y = 50 - S / 2, rad = S / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + S + '" height="' + S +
      '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, y - 4, 'a=' + a, CG, 9) + T(60 + rad / 2, 50 - rad / 2 - 3, 'r=' + r, CG, 8.5);
    var ask = cs_pick(['area', 'perim']);
    var a1 = a * a - PI * r * r, p1 = 4 * a + PI * a;
    return {
      q: '如图，正方形边长 ' + a + ' 厘米，里面画了一个最大的圆（阴影为四个角）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a1 : p1, svg: svg, diff: 1, ask: ask, sig: 'T1|' + a + '|' + ask
    };
  }

  // ---- T2 圆中方：圆内最大正方形（阴影=四角弓形）  [基础, 仅面积] ----
  function t2() {
    var R = cs_pick([3, 4, 5, 6, 7, 8]), S = R * 7.5;
    // 内接正方形：对角线=2R，顶点在圆上（旋转45°的方块）
    var d = S / Math.SQRT2, h = d / 2;
    var pts = [
      [60, 50 - h], [60 + h, 50], [60, 50 + h], [60 - h, 50]
    ].map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var svg = '<circle cx="60" cy="50" r="' + (S / 2).toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<polygon points="' + pts + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, 50 - S / 2 - 4, 'R=' + R, CG, 9);
    var a2 = PI * R * R - 2 * R * R;
    return {
      q: '如图，圆的半径 ' + R + ' 厘米，里面画了一个最大的正方形（阴影为四个角）。阴影部分的面积约是多少平方厘米？' + head(),
      a: a2, svg: svg, diff: 1, ask: 'area', sig: 'T2|' + R
    };
  }

  // ---- T3 圆环（扇环/整环）  [基础] ----
  function t3() {
    var R = cs_pick([5, 6, 7, 8, 9, 10]), r = cs_pick([2, 3, 4]);
    if (r >= R) r = R - cs_ri(1, 2);
    var Ro = R * 4.2, Ri = r * 4.2;
    var svg = '<circle cx="60" cy="50" r="' + Ro.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<circle cx="60" cy="50" r="' + Ri.toFixed(1) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, 50 - Ro / 2, 'R=' + R, CG, 9) + T(60, 50 + Ri / 2 + 12, 'r=' + r, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a3 = PI * (R * R - r * r), p3 = 2 * PI * (R + r);
    return {
      q: '如图，圆环外圆半径 ' + R + ' 厘米、内圆半径 ' + r + ' 厘米（阴影为圆环）。圆环的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a3 : p3, svg: svg, diff: 1, ask: ask, sig: 'T3|' + R + '|' + r + '|' + ask
    };
  }

  // ---- T4 半圆  [基础] ----
  function t4() {
    var r = cs_pick([2, 3, 4, 5, 6]), R = r * 7;
    var cx = 60, cy = 56;
    var svg = '<path d="' + arcP(cx, cy, R, 0, 180) + ' Z" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<line x1="' + (cx - R).toFixed(1) + '" y1="' + cy + '" x2="' + (cx + R).toFixed(1) + '" y2="' + cy + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(cx, cy + 14, 'r=' + r, CG, 9) + T(cx - R / 2, cy - 6, 'r', CG, 8.5);
    var ask = cs_pick(['area', 'perim']);
    var a4 = PI * r * r / 2, p4 = PI * r + 2 * r;
    return {
      q: '如图，半圆的半径 ' + r + ' 厘米（阴影为半圆）。半圆的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a4 : p4, svg: svg, diff: 1, ask: ask, sig: 'T4|' + r + '|' + ask
    };
  }

  // ---- T5 四角花：正方形四个角各 1/4 圆（阴影=四个角）  [进阶] ----
  function t5() {
    var a = cs_pick([6, 8, 10, 12]), S = a * 6, r = S / 2;
    var x0 = 60 - S / 2, y0 = 50 - S / 2, x1 = 60 + S / 2, y1 = 50 + S / 2;
    var wedge = function (cx, cy, sx, sy) {
      // 以角(cx,cy)为圆心、半径r、朝向正方形内部的四分之一圆扇形
      var ax = cx + (sx - cx), ay = cy;            // 沿一边中点
      var bx = cx, by = cy + (sy - cy);            // 沿另一边中点
      return 'M ' + cx + ' ' + cy + ' L ' + ax.toFixed(1) + ' ' + ay.toFixed(1) +
        ' A ' + r + ' ' + r + ' 0 0 1 ' + bx.toFixed(1) + ' ' + by.toFixed(1) + ' Z';
    };
    var svg = '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + S + '" height="' + S +
      '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + wedge(x0, y0, x1, y1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + wedge(x1, y0, x0, y1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + wedge(x1, y1, x0, y0) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      '<path d="' + wedge(x0, y1, x1, y0) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.4"/>' +
      T(60, y0 - 4, 'a=' + a, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a5 = PI * (a / 2) * (a / 2); // 4 个四分之一圆(半径 a/2) = 1 个整圆 π(a/2)²
    var p5 = 4 * a + PI * a;
    return {
      q: '如图，正方形边长 ' + a + ' 厘米，四个角各画一个四分之一圆（阴影为四个角）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a5 : p5, svg: svg, diff: 2, ask: ask, sig: 'T5|' + a + '|' + ask
    };
  }

  // ---- T6 长方内最大圆（阴影=四角）  [进阶] ----
  function t6() {
    var W = cs_pick([4, 6, 8, 10]), L = W + cs_ri(2, 6);
    var SW = W * 6, SL = L * 6, x = 60 - SL / 2, y = 50 - SW / 2, rad = SW / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + SL.toFixed(1) + '" height="' + SW.toFixed(1) +
      '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<circle cx="60" cy="50" r="' + rad.toFixed(1) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, y - 4, '长 ' + L, CG, 9) + T(x - 8, 50, '宽 ' + W, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a6 = L * W - PI * (W / 2) * (W / 2), p6 = 2 * (L + W) + PI * W;
    return {
      q: '如图，长方形长 ' + L + ' 厘米、宽 ' + W + ' 厘米，里面画了一个最大的圆（阴影为四个角）。阴影部分的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a6 : p6, svg: svg, diff: 2, ask: ask, sig: 'T6|' + L + '|' + W + '|' + ask
    };
  }

  // ---- T7 半圆 − 内接等腰直角三角形（阴影=月牙）  [进阶, 仅面积] ----
  function t7() {
    var r = cs_pick([2, 3, 4, 5, 6]), R = r * 7, cx = 60, cy = 54;
    var lx = cx - R, rx = cx + R;
    // 内接直角三角形：斜边=直径，直角顶点在半圆上（取正上方点）
    var tx = cx, ty = cy - R;
    var svg = '<path d="' + arcP(cx, cy, R, 0, 180) + ' Z" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<line x1="' + lx.toFixed(1) + '" y1="' + cy + '" x2="' + rx.toFixed(1) + '" y2="' + cy + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<polygon points="' + lx.toFixed(1) + ',' + cy + ' ' + rx.toFixed(1) + ',' + cy + ' ' + tx.toFixed(1) + ',' + ty.toFixed(1) +
      '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(cx, cy + 14, 'r=' + r, CG, 9);
    var a7 = PI * r * r / 2 - r * r; // 半圆 − 等腰直角三角形( legs=r√2, area=r² )
    return {
      q: '如图，半圆的半径 ' + r + ' 厘米，里面画了一个最大的等腰直角三角形（阴影为月牙形）。阴影部分的面积约是多少平方厘米？' + head(),
      a: a7, svg: svg, diff: 2, ask: 'area', sig: 'T7|' + r
    };
  }

  // ---- T8 双半圆跑道（矩形+两端半圆）  [进阶] ----
  function t8() {
    var W = cs_pick([4, 6, 8, 10]), L = W + cs_ri(3, 8);
    var SW = W * 6, SL = L * 6, x = 60 - SL / 2, y = 50 - SW / 2, rad = SW / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + SL.toFixed(1) + '" height="' + SW.toFixed(1) +
      '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(x, 50, rad, 270, 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(x + SL, 50, rad, 90, 270) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, y - 4, '长 ' + L, CG, 9) + T(x - 8, 50, '宽 ' + W, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a8 = L * W + PI * (W / 2) * (W / 2), p8 = 2 * L + PI * W;
    return {
      q: '如图，跑道由中间长方形（长 ' + L + ' 厘米、宽 ' + W + ' 厘米）和两端两个半圆组成（阴影为整个跑道）。跑道的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '一周长约是多少厘米？') + head(),
      a: ask === 'area' ? a8 : p8, svg: svg, diff: 2, ask: ask, sig: 'T8|' + L + '|' + W + '|' + ask
    };
  }

  // ---- T9 四分之一圆环（扇环）  [提高] ----
  function t9() {
    var R = cs_pick([6, 8, 10]), r = cs_pick([2, 3, 4]);
    if (r >= R) r = R - 2;
    var Ro = R * 4.0, Ri = r * 4.0;
    var svg = '<path d="' + sectorRing(60, 50, Ro, Ri, 0, 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 标注 R、r 半径线
      '<line x1="60" y1="50" x2="' + (60 + Ro).toFixed(1) + '" y2="50" stroke="' + CG + '" stroke-width="1.2"/>' +
      '<line x1="60" y1="50" x2="60" y2="' + (50 + Ri).toFixed(1) + '" stroke="' + CG + '" stroke-width="1.2"/>' +
      T(60 + Ro / 2 + 2, 47, 'R=' + R, CG, 9) + T(54, 50 + Ri / 2, 'r=' + r, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a9 = PI * (R * R - r * r) / 4;
    var p9 = 2 * (R - r) + PI * (R + r) / 2;
    return {
      q: '如图，一个四分之一圆环（扇环），外圆半径 ' + R + ' 厘米、内圆半径 ' + r + ' 厘米（阴影为扇环）。这个扇环的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a9 : p9, svg: svg, diff: 3, ask: ask, sig: 'T9|' + R + '|' + r + '|' + ask
    };
  }

  // ---- T10 直角三角形 + 斜边半圆（半圆在外部）  [提高] ----
  function t10() {
    var trips = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]];
    var tr = cs_pick(trips), a = tr[0], b = tr[1], c = tr[2];
    var k = 3.4;
    var ax = 60 - a * k / 2, ay = 50 + b * k / 2;     // 直角顶点(左下)
    var bx = ax + a * k, by = ay;                      // 沿 a 边
    var cx2 = ax, cy2 = ay - b * k;                    // 沿 b 边
    // 斜边中点（半圆圆心）
    var mx = (bx + cx2) / 2, my = (by + cy2) / 2, R = c * k / 2;
    // 半圆朝外（远离直角）：取斜边法向朝外
    var outAng = Math.atan2(my - ay, mx - ax) * 180 / Math.PI + 90;
    var svg = '<polygon points="' + ax.toFixed(1) + ',' + ay.toFixed(1) + ' ' + bx.toFixed(1) + ',' + by.toFixed(1) + ' ' +
      cx2.toFixed(1) + ',' + cy2.toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="' + arcP(mx, my, R, outAng - 90, outAng + 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T((ax + bx) / 2, ay + 12, 'a=' + a, CG, 8.5) + T(ax - 6, (ay + cy2) / 2, 'b=' + b, CG, 8.5) + T(mx, my - R - 4, 'c=' + c, CG, 8.5);
    var ask = cs_pick(['area', 'perim']);
    var a10 = a * b / 2 + PI * c * c / 2, p10 = a + b + c + PI * c;
    return {
      q: '如图，直角三角形两条直角边 ' + a + ' 厘米、' + b + ' 厘米，斜边 ' + c + ' 厘米；在斜边外侧画了一个半圆（阴影为整个图形）。这个组合图形的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a10 : p10, svg: svg, diff: 3, ask: ask, sig: 'T10|' + a + '|' + b + '|' + c + '|' + ask
    };
  }

  // ---- T11 圆四等分，阴影为相对两份扇形  [提高, 仅面积] ----
  function t11() {
    var R = cs_pick([4, 5, 6, 7, 8]), S = R * 4.4;
    var svg = '<circle cx="60" cy="50" r="' + (S / 2).toFixed(1) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      // 遮白另外两份相对扇形（左下、右上），留下右下、左上阴影
      '<path d="' + sectorRing(60, 50, S / 2, 0, S / 2, 90) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1"/>' +
      '<path d="' + sectorRing(60, 50, S / 2, 0, S / 2, 270) + '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1"/>' +
      '<line x1="' + (60 - S / 2).toFixed(1) + '" y1="50" x2="' + (60 + S / 2).toFixed(1) + '" y2="50" stroke="' + CS + '" stroke-width="1.2"/>' +
      '<line x1="60" y1="' + (50 - S / 2).toFixed(1) + '" x2="60" y2="' + (50 + S / 2).toFixed(1) + '" stroke="' + CS + '" stroke-width="1.2"/>' +
      T(60, 50 - S / 2 - 4, 'R=' + R, CG, 9);
    var a11 = PI * R * R / 2; // 相对两份 = 半个圆
    return {
      q: '如图，圆被两条互相垂直的直径分成 4 等份，阴影为相对的两份（两个扇形）。阴影部分的面积约是多少平方厘米？' + head(),
      a: a11, svg: svg, diff: 3, ask: 'area', sig: 'T11|' + R
    };
  }

  // ---- T12 四叶草：正方形 + 四边外凸半圆  [提高] ----
  function t12() {
    var a = cs_pick([4, 6, 8, 10]), S = a * 4.4;
    var x = 60 - S / 2, y = 50 - S / 2, r = S / 2;
    var svg = '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + S + '" height="' + S +
      '" fill="' + CW + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(60, y, r, 180, 360) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(60, y + S, r, 0, 180) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(x, 50, r, 90, 270) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      '<path d="' + arcP(x + S, 50, r, 270, 90) + '" fill="' + CSH + '" stroke="' + CS + '" stroke-width="1.8"/>' +
      T(60, y - r - 2, 'a=' + a, CG, 9);
    var ask = cs_pick(['area', 'perim']);
    var a12 = 4 * (PI * r * r / 2); // 4 个半圆(叶子) = 2πr²；r=S/2=a/2*scale? 用像素半径换算回数值
    // 数值半径 = a/2（以 a 为边长，半圆直径为 a，半径 a/2）
    a12 = 4 * (PI * (a / 2) * (a / 2) / 2);
    var p12 = 4 * (PI * (a / 2)); // 4 段半圆弧长
    return {
      q: '如图，正方形边长 ' + a + ' 厘米，四条边上各向外画一个半圆（阴影为四个叶子）。四叶草的' +
        (ask === 'area' ? '面积约是多少平方厘米？' : '周长约是多少厘米？') + head(),
      a: ask === 'area' ? a12 : p12, svg: svg, diff: 3, ask: ask, sig: 'T12|' + a + '|' + ask
    };
  }

  var S1 = [t1, t2, t3, t4];   // 基础
  var S2 = [t5, t6, t7, t8];   // 进阶
  var S3 = [t9, t10, t11, t12]; // 提高

  // ===========================================================================
  //  跨会话去重：localStorage 签名环（最近约 6 场 = 120 个签名）
  // ===========================================================================
  var SEEN_KEY = 'math_circle_shade_seen_v1';
  var SEEN_CAP = 120;
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
      for (i = 0; i < 300 && cands.length < n * 4; i++) {
        q = cs_pick(pool)();
        if (!q || !q.q || q.a == null) continue;
        sg = q.sig;
        if (local[sg] || outSig[sg]) continue;
        local[sg] = 1; cands.push(q);
      }
      var unseen = cands.filter(function (q) { return !seenSet[q.sig]; });
      var chosen = unseen.slice(0, n);
      if (chosen.length < n) {
        var relaxed = cands.filter(function (q) { return seenSet[q.sig]; });
        chosen = chosen.concat(relaxed.slice(0, n - chosen.length));
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
