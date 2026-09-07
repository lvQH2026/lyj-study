// ============================================================
// v83 · 初中物理 / 化学 参数化配图库（SVG，viewBox 0 0 120 100）
// ------------------------------------------------------------
// 只返回 SVG 内部元素（不含 <svg> 标签），由 pc.js 的 pc-q-svg 包裹渲染。
// 配色：主线 #3E4A63（黛蓝）、强调 #B4945A（香槟金）、填充 rgba(180,148,90,0.16)
// 红线：图中不得直接写出题目答案（求什么标 ? ）
// ============================================================
window.JRFIG = (function () {
  'use strict';
  var L = '#3E4A63', A = '#B4945A', F = 'rgba(180,148,90,0.16)';
  function ln(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (o.c || L) + '" stroke-width="' + (o.w || 1) + '"' +
      (o.d ? ' stroke-dasharray="' + o.d + '"' : '') +
      (o.a ? ' marker-end="url(#jrf-ar)"' : '') + '/>';
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.s || 5.5) + '" fill="' + (o.c || L) +
      '" text-anchor="' + (o.an || 'middle') + '">' + s + '</text>';
  }
  function rect(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" fill="' + (o.f || 'none') + '" stroke="' + (o.c || L) + '" stroke-width="' + (o.w || 1) + '"' +
      (o.rx ? ' rx="' + o.rx + '"' : '') + '/>';
  }
  function cir(cx, cy, r, o) {
    o = o || {};
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (o.f || 'none') +
      '" stroke="' + (o.c || L) + '" stroke-width="' + (o.w || 1) + '"' +
      (o.d ? ' stroke-dasharray="' + o.d + '"' : '') + '/>';
  }
  function path(d, o) {
    o = o || {};
    return '<path d="' + d + '" fill="' + (o.f || 'none') + '" stroke="' + (o.c || L) +
      '" stroke-width="' + (o.w || 1) + '"' + (o.d ? ' stroke-dasharray="' + o.d + '"' : '') + '/>';
  }
  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var dx = x2 - x1, dy = y2 - y1, m = Math.sqrt(dx * dx + dy * dy) || 1;
    var hx = x2 - dx / m * 3.2, hy = y2 - dy / m * 3.2;
    var px = -dy / m * 1.8, py = dx / m * 1.8;
    return ln(x1, y1, hx, hy, o) +
      path('M' + x2 + ' ' + y2 + ' L' + (hx + px) + ' ' + (hy + py) + ' L' + (hx - px) + ' ' + (hy - py) + ' Z',
        { f: o.c || L, c: o.c || L, w: 0.4 });
  }
  function tri(x, y, r, dir) {
    // 实心小三角箭头
    if (dir === 'u') return path('M' + x + ' ' + (y - r) + ' L' + (x + r * 0.8) + ' ' + (y + r * 0.7) + ' L' + (x - r * 0.8) + ' ' + (y + r * 0.7) + ' Z', { f: L, c: L, w: 0.3 });
    if (dir === 'd') return path('M' + x + ' ' + (y + r) + ' L' + (x + r * 0.8) + ' ' + (y - r * 0.7) + ' L' + (x - r * 0.8) + ' ' + (y - r * 0.7) + ' Z', { f: L, c: L, w: 0.3 });
    if (dir === 'l') return path('M' + (x - r) + ' ' + y + ' L' + (x + r * 0.7) + ' ' + (y - r * 0.8) + ' L' + (x + r * 0.7) + ' ' + (y + r * 0.8) + ' Z', { f: L, c: L, w: 0.3 });
    return path('M' + (x + r) + ' ' + y + ' L' + (x - r * 0.7) + ' ' + (y - r * 0.8) + ' L' + (x - r * 0.7) + ' ' + (y + r * 0.8) + ' Z', { f: L, c: L, w: 0.3 });
  }
  var F_ = {};
  /* ---------- 测量工具 ---------- */
  // 刻度尺：物体左端对齐 0，右端在 v（单位 cm，0-10）
  F_.ruler = function (v) {
    var s = rect(8, 52, 104, 12, { f: '#fff', c: L });
    for (var i = 0; i <= 10; i++) {
      var x = 12 + i * 9.6;
      s += ln(x, 52, x, 52 + (i % 5 === 0 ? 5 : 3), { w: 0.6 });
      if (i % 5 === 0) s += T(x, 71, String(i), { s: 4.5 });
    }
    s += rect(12, 40, v * 9.6, 11, { f: F, c: A, w: 1.1 });
    s += T(64, 34, '物体', { s: 5, c: A });
    s += arrow(12 + v * 9.6, 40, 12 + v * 9.6, 35, { c: A, w: 0.7 });
    return s;
  };
  // 温度计：示数 v ℃（-20~100）
  F_.thermo = function (v) {
    var y0 = 14, y1 = 82, t = (100 - v) / 120;
    var ty = y0 + (y1 - y0) * t;
    var s = rect(56, 12, 9, 72, { f: '#fff', c: L, rx: 4.5 });
    s += cir(60.5, 88, 8, { f: A, c: L });
    s += rect(58.5, ty, 4, 82 - ty, { f: A, c: A, w: 0 });
    for (var i = 0; i <= 6; i++) {
      var y = y0 + (y1 - y0) * i / 6;
      s += ln(56, y, 62, y, { w: 0.5 });
      s += ln(65, y, 68, y, { w: 0.5 });
    }
    s += T(78, y0 + 2, '100', { s: 4, an: 'start' });
    s += T(78, (y0 + y1) / 2 + 2, '40', { s: 4, an: 'start' });
    s += T(78, y1 + 2, '-20', { s: 4, an: 'start' });
    s += T(40, 50, '℃', { s: 6, c: A });
    return s;
  };
  // 量筒：液面在 v mL（0-100）
  F_.cyl = function (v) {
    var top = 18, bot = 82, h = (bot - top) * (1 - v / 100);
    var s = path('M48 ' + top + ' L48 ' + (bot - 4) + ' Q48 ' + bot + ' 53 ' + bot + ' L67 ' + bot + ' Q72 ' + bot + ' 72 ' + (bot - 4) + ' L72 ' + top, { f: '#fff', c: L });
    s += rect(48, top + h, 24, bot - top - h, { f: F, c: 'none', w: 0 });
    s += path('M48 ' + (top + h) + ' L72 ' + (top + h), { c: A, w: 1.2 });
    s += path('M48 ' + (top + h) + ' L48 ' + (bot - 4) + ' Q48 ' + bot + ' 53 ' + bot + ' L67 ' + bot + ' Q72 ' + bot + ' 72 ' + (bot - 4) + ' L72 ' + (top + h) + ' Z', { f: F, c: 'none', w: 0 });
    for (var i = 0; i <= 5; i++) {
      var y = top + (bot - top) * i / 5;
      s += ln(48, y, 54, y, { w: 0.5 });
    }
    s += T(84, 26, 'mL', { s: 5, c: A });
    s += T(30, 45, '视线', { s: 4.5, c: A }) + ln(38, 43.5, 46, 43.5, { c: A, w: 0.6, d: '2,1.5' });
    return s;
  };
  /* ---------- 光学 ---------- */
  F_.pinhole = function () {
    var s = ln(16, 74, 34, 74, { w: 1 });                      // 烛台
    s += rect(20, 52, 8, 22, { f: F, c: L });                   // 蜡烛
    s += path('M24 52 Q24 44 24 40 Q24 46 24 52 Z', { f: A, c: A, w: 0.4 }); // 火焰
    s += ln(56, 18, 56, 82, { w: 1.4 });                        // 带小孔的屏
    s += cir(56, 50, 1.4, { f: '#fff', c: L, w: 0.6 });
    s += ln(92, 18, 92, 82, { w: 1.4 });                        // 光屏
    s += arrow(24, 44, 56, 50, { c: A, w: 0.7 });
    s += arrow(56, 50, 92, 66, { c: A, w: 0.7 });
    s += arrow(24, 70, 56, 50, { c: A, w: 0.7, d: '2,1.5' });
    s += arrow(56, 50, 92, 56, { w: 0.7, d: '2,1.5' });
    s += T(24, 86, '烛焰', { s: 4.5 }) + T(56, 90, '小孔', { s: 4.5 }) + T(92, 90, '光屏', { s: 4.5 });
    s += T(92, 78, '倒立', { s: 4, c: A });
    return s;
  };
  // 平面镜反射：入射角 i 度
  F_.reflect = function (i) {
    var ox = 60, oy = 66, r = 46, rad = i * Math.PI / 180;
    var ix = ox - r * Math.sin(rad), iy = oy - r * Math.cos(rad);
    var rx = ox + r * Math.sin(rad), ry = oy - r * Math.cos(rad);
    var s = ln(14, oy, 106, oy, { w: 1.6 });
    for (var k = 0; k < 16; k++) s += ln(16 + k * 6, oy, 12 + k * 6, oy + 5, { w: 0.5 });
    s += ln(ox, oy - 40, ox, oy + 12, { c: A, d: '3,2', w: 0.7 });
    s += T(ox + 5, oy - 38, '法线', { s: 4.2, c: A, an: 'start' });
    s += arrow(ix, iy, ox, oy, { c: L, w: 1 });
    s += arrow(ox, oy, rx, ry, { c: L, w: 1 });
    s += path('M' + ox + ' ' + (oy - 18) + ' A18 18 0 0 ' + (i > 0 ? 1 : 0) + ' ' + (ox + 18 * Math.sin(rad)) + ' ' + (oy - 18 * Math.cos(rad)), { c: A, w: 0.7 });
    s += T(ox - 12, oy - 22, 'i', { s: 5, c: A });
    s += T(ox + 12, oy - 22, 'r', { s: 5, c: A });
    s += T(ox, oy + 16, '平面镜', { s: 4.5 });
    return s;
  };
  // 平面镜成像（物像对称）
  F_.mirrorImg = function () {
    var s = ln(60, 14, 60, 76, { w: 1.6 });
    for (var k = 0; k < 12; k++) s += ln(60, 18 + k * 5, 55, 22 + k * 5, { w: 0.5 });
    s += ln(20, 76, 100, 76, { w: 0.8, d: '4,2' });
    s += arrow(38, 62, 38, 32, { c: L, w: 1.2 });
    s += T(38, 28, '物', { s: 4.8, c: L });
    s += arrow(82, 62, 82, 32, { c: A, w: 1, d: '3,2' });
    s += T(82, 28, '像', { s: 4.8, c: A });
    s += ln(38, 62, 82, 62, { c: A, d: '2,2', w: 0.5 });
    s += T(38, 86, '物距', { s: 4.2 }) + T(82, 86, '像距', { s: 4.2, c: A });
    s += T(60, 10, '平面镜', { s: 4.5 });
    return s;
  };
  // 光的折射（空气→水，折射角小于入射角）
  F_.refract = function () {
    var s = rect(10, 52, 100, 34, { f: F, c: 'none', w: 0 });
    s += ln(10, 52, 110, 52, { w: 1.2 });
    s += ln(60, 14, 60, 86, { c: A, d: '3,2', w: 0.7 });
    s += arrow(26, 20, 60, 52, { c: L, w: 1 });
    s += arrow(60, 52, 92, 80, { c: L, w: 1 });
    s += T(30, 24, '空气', { s: 4.8 });
    s += T(96, 74, '水', { s: 4.8 });
    s += T(48, 40, 'i', { s: 5, c: A }) + T(70, 70, 'r', { s: 5, c: A });
    s += T(60, 12, '法线', { s: 4, c: A });
    return s;
  };
  // 凸透镜三条特殊光线
  F_.lensRays = function () {
    var s = ln(10, 52, 110, 52, { w: 0.8, d: '4,2' });
    s += path('M60 26 Q54 52 60 78 Q66 52 60 26 Z', { f: F, c: L, w: 1 });
    s += arrow(26, 34, 60, 32, { c: A, w: 0.8 });
    s += arrow(60, 32, 94, 52, { c: A, w: 0.8 });
    s += arrow(26, 34, 96, 46, { c: A, w: 0.8 });
    s += arrow(38, 52, 60, 44, { c: A, w: 0.8 });
    s += arrow(60, 44, 94, 52, { c: A, w: 0.8 });
    s += ln(26, 34, 26, 52, { w: 1.2 });
    s += T(26, 58, '物', { s: 4.5 });
    s += cir(38, 52, 1.4, { f: A, c: A, w: 0 });
    s += cir(94, 52, 1.4, { f: A, c: A, w: 0 });
    s += T(38, 60, 'F', { s: 4.5, c: A }) + T(94, 60, 'F', { s: 4.5, c: A });
    return s;
  };
  // 凸透镜成像规律 k:1 u>2f  2 u=2f  3 f<u<2f  4 u<f
  F_.lensImg = function (k) {
    var s = ln(8, 52, 112, 52, { w: 0.8, d: '4,2' });
    s += path('M60 26 Q54 52 60 78 Q66 52 60 26 Z', { f: F, c: L, w: 1 });
    var ox = 26, oh = 16;
    var ix, ih, dash;
    if (k === 1) { ix = 92; ih = 8; dash = false; }
    else if (k === 2) { ix = 92; ih = 16; dash = false; }
    else if (k === 3) { ix = 98; ih = 24; dash = false; }
    else { ix = 38; ih = 26; dash = true; }
    s += arrow(ox, 52, ox, 52 - oh, { c: L, w: 1.2 });
    s += T(ox, 32, '物', { s: 4.5 });
    s += arrow(ix, 52, ix, 52 - ih, { c: A, w: 1.1, d: dash ? '3,2' : null });
    s += T(ix, 52 - ih - 5, dash ? '虚像' : '实像', { s: 4.5, c: A });
    s += cir(38, 52, 1.3, { f: A, c: A, w: 0 }) + cir(92, 52, 1.3, { f: A, c: A, w: 0 });
    s += T(38, 60, 'F', { s: 4, c: A }) + T(92, 60, 'F', { s: 4, c: A });
    return s;
  };
  // 视力矫正 t:'near' 近视（凹透镜） / 'far' 远视（凸透镜）
  F_.eyeFix = function (t) {
    var s = path('M30 50 Q48 30 66 50 Q48 70 30 50 Z', { f: F, c: L, w: 1 });
    s += cir(48, 50, 4, { f: 'none', c: L, w: 0.8 });
    s += ln(8, 50, 30, 50, { w: 0.8, d: '3,2' });
    if (t === 'near') {
      s += path('M76 32 Q82 50 76 68 Q70 50 76 32 Z', { f: F, c: A, w: 1 });
      s += T(76, 78, '凹透镜', { s: 4.2, c: A });
      s += arrow(8, 42, 30, 46, { c: A, w: 0.7 }) + arrow(30, 46, 48, 50, { c: A, w: 0.7 });
      s += T(44, 22, '像成在视网膜前', { s: 4, c: A, an: 'start' });
    } else {
      s += path('M76 32 Q70 50 76 68 Q82 50 76 32 Z', { f: F, c: A, w: 1 });
      s += T(76, 78, '凸透镜', { s: 4.2, c: A });
      s += arrow(8, 42, 30, 46, { c: A, w: 0.7 }) + arrow(30, 46, 48, 50, { c: A, w: 0.7 });
      s += T(44, 22, '像成在视网膜后', { s: 4, c: A, an: 'start' });
    }
    return s;
  };
  /* ---------- 力学 ---------- */
  F_.force = function () {
    var s = rect(46, 48, 28, 18, { f: F, c: L });
    s += cir(60, 57, 2, { f: L, c: L, w: 0 });
    s += arrow(60, 57, 92, 57, { c: A, w: 1.2 });
    s += T(96, 59, 'F', { s: 5.5, c: A });
    s += ln(10, 66, 110, 66, { w: 0.8 });
    s += T(60, 82, '作用点', { s: 4.2 }) + T(60, 40, '力的示意图', { s: 4.2, c: A });
    return s;
  };
  F_.twoForce = function () {
    var s = rect(46, 42, 28, 18, { f: F, c: L });
    s += arrow(46, 51, 16, 51, { c: A, w: 1.1 });
    s += arrow(74, 51, 104, 51, { c: A, w: 1.1 });
    s += T(14, 48, 'F₁', { s: 5, c: A }) + T(106, 48, 'F₂', { s: 5, c: A });
    s += ln(10, 68, 110, 68, { w: 0.8 });
    s += T(60, 82, '静止（二力平衡）', { s: 4.5, c: A });
    return s;
  };
  F_.lever = function () {
    var s = ln(18, 40, 100, 62, { w: 1.6 });
    s += path('M52 68 L58 68 L55 52 Z', { f: L, c: L, w: 0.4 });
    s += T(55, 80, '支点 O', { s: 4.5, c: A });
    s += rect(84, 58, 16, 10, { f: F, c: L });
    s += arrow(92, 58, 92, 30, { c: A, w: 1.1 });
    s += T(92, 26, 'F₁', { s: 5, c: A });
    s += arrow(30, 46, 30, 20, { c: A, w: 1.1 });
    s += T(30, 16, 'F₂', { s: 5, c: A });
    s += ln(30, 44, 92, 60, { c: A, d: '2,2', w: 0.6 });
    return s;
  };
  // 滑轮 t:1 定滑轮 2 动滑轮 3 滑轮组
  F_.pulley = function (t) {
    var s = '';
    if (t === 1) {
      s += ln(60, 20, 60, 34, { w: 1 });
      s += cir(60, 42, 10, { f: 'none', c: L, w: 1.2 });
      s += cir(60, 42, 2, { f: L, c: L, w: 0 });
      s += ln(50, 42, 50, 62, { w: 0.8 }) + ln(70, 42, 70, 72, { w: 0.8 });
      s += rect(46, 62, 8, 10, { f: F, c: L });
      s += arrow(70, 42, 70, 72, { c: A, w: 1 });
      s += T(78, 58, 'F', { s: 5, c: A });
      s += T(60, 84, '定滑轮：不省力，可改变力的方向', { s: 4, c: A });
    } else if (t === 2) {
      s += cir(60, 40, 10, { f: 'none', c: L, w: 1.2 });
      s += cir(60, 40, 2, { f: L, c: L, w: 0 });
      s += rect(46, 50, 28, 12, { f: F, c: L });
      s += ln(60, 30, 60, 16, { w: 0.8 });
      s += arrow(60, 16, 60, 30, { c: A, w: 1 });
      s += T(60, 12, 'F', { s: 5, c: A });
      s += ln(50, 40, 40, 22, { w: 0.8 });
      s += T(30, 18, '固定端', { s: 4 });
      s += T(60, 84, '动滑轮：省一半力，不改变方向', { s: 4, c: A });
    } else {
      s += ln(40, 20, 40, 30, { w: 1 }) + cir(40, 38, 8, { f: 'none', c: L, w: 1.1 });
      s += cir(40, 38, 1.6, { f: L, c: L, w: 0 });
      s += cir(70, 52, 8, { f: 'none', c: L, w: 1.1 });
      s += cir(70, 52, 1.6, { f: L, c: L, w: 0 });
      s += rect(56, 60, 28, 12, { f: F, c: L });
      s += ln(32, 40, 32, 60, { w: 0.8 });
      s += ln(48, 40, 78, 44, { w: 0.8 });
      s += ln(78, 52, 78, 60, { w: 0.8 });
      s += arrow(32, 38, 32, 76, { c: A, w: 1 });
      s += T(26, 70, 'F', { s: 5, c: A });
      s += T(70, 90, '滑轮组：n 段绳承担物重', { s: 4, c: A });
    }
    return s;
  };
  F_.press = function () {
    var s = rect(16, 62, 88, 16, { f: F, c: L });
    s += ln(16, 62, 104, 62, { w: 0.8, d: '2,2' });
    s += rect(30, 44, 24, 18, { f: F, c: L });
    s += rect(66, 48, 16, 14, { f: F, c: L });
    s += arrow(42, 44, 42, 30, { c: A, w: 1 });
    s += T(42, 26, 'F', { s: 5, c: A });
    s += T(42, 90, '受力面积大', { s: 4.2 }) + T(74, 90, '面积小', { s: 4.2, c: A });
    s += T(60, 12, 'p = F / S', { s: 5.5, c: A });
    return s;
  };
  F_.liquidP = function () {
    var s = path('M24 24 L24 76 L96 76 L96 24', { f: F, c: L, w: 1.2 });
    s += ln(24, 24, 96, 24, { c: A, w: 0.8, d: '3,2' });
    s += cir(96, 40, 1.6, { f: L, c: L, w: 0 }) + cir(96, 58, 1.6, { f: L, c: L, w: 0 });
    s += arrow(96, 40, 116, 52, { c: A, w: 0.7 });
    s += arrow(96, 58, 116, 74, { c: A, w: 1 });
    s += T(60, 18, '同种液体：深度越深，压强越大', { s: 4, c: A });
    s += T(30, 44, 'h₁', { s: 4.2 }) + T(30, 62, 'h₂', { s: 4.2 });
    return s;
  };
  F_.toricelli = function () {
    var s = rect(30, 62, 60, 18, { f: F, c: L });
    s += path('M30 62 L90 62', { c: L, w: 1 });
    s += rect(56, 16, 8, 56, { f: '#fff', c: L });
    s += rect(56, 16, 8, 26, { f: F, c: 'none', w: 0 });
    s += ln(56, 42, 64, 42, { c: A, w: 0.8 });
    s += arrow(66, 42, 66, 62, { c: A, w: 0.7 });
    s += T(78, 54, '？ mm', { s: 4.5, c: A });
    s += T(20, 44, '真空', { s: 4.2 });
    s += T(60, 92, '测大气压值的实验', { s: 4.2, c: A });
    return s;
  };
  F_.comm = function () {
    var s = path('M34 24 L34 66 Q34 80 48 80 L72 80 Q86 80 86 66 L86 24', { f: 'none', c: L, w: 1.2 });
    s += path('M34 52 L86 52', { c: A, w: 0.8 });
    s += rect(34, 52, 52, 28, { f: F, c: 'none', w: 0 });
    s += T(60, 46, '液面相平', { s: 4.5, c: A });
    s += T(60, 94, '连通器', { s: 4.5 });
    return s;
  };
  F_.buoy = function () {
    var s = ln(60, 10, 60, 26, { w: 1 });
    s += rect(52, 26, 16, 10, { f: 'none', c: L });
    s += ln(56, 30, 64, 30, { w: 0.6 }) + ln(56, 33, 64, 33, { w: 0.6 });
    s += ln(60, 36, 60, 42, { w: 0.8 });
    s += rect(50, 42, 20, 16, { f: F, c: L });
    s += path('M20 46 L20 80 L100 80 L100 46', { f: 'none', c: L, w: 1.2 });
    s += ln(20, 46, 100, 46, { c: A, w: 0.8, d: '3,2' });
    s += arrow(60, 42, 60, 30, { c: A, w: 0.8 });
    s += T(76, 40, 'F浮', { s: 4.5, c: A });
    s += arrow(60, 58, 60, 70, { c: A, w: 0.8 });
    s += T(76, 68, 'G', { s: 4.5, c: A });
    s += T(60, 92, '称重法：F浮 = G − F拉', { s: 4.2, c: A });
    return s;
  };
  F_.floatState = function (t) {
    var s = path('M18 40 L18 82 L102 82 L102 40', { f: F, c: L, w: 1.2 });
    s += ln(18, 40, 102, 40, { c: A, w: 0.8, d: '3,2' });
    var cy = t === 1 ? 46 : (t === 2 ? 58 : 70);
    s += cir(60, cy, 12, { f: '#fff', c: L, w: 1.1 });
    s += arrow(60, cy, 60, cy - 22, { c: A, w: 0.9 });
    s += T(76, cy - 18, 'F浮', { s: 4.5, c: A });
    s += arrow(60, cy, 60, cy + 22, { c: A, w: 0.9 });
    s += T(76, cy + 24, 'G', { s: 4.5, c: A });
    s += T(60, 96, t === 1 ? '上浮' : (t === 2 ? '悬浮' : '下沉'), { s: 5, c: A });
    return s;
  };
  /* ---------- 电学 ---------- */
  function cell(x, y, o) { // 电池（长线正极）
    var s = ln(x - 8, y, x + 8, y, { w: 0.9 });
    if (o !== 'short') s += ln(x - 4, y + 5, x + 4, y + 5, { w: 1.6 });
    return s;
  }
  function lamp(x, y) {
    return cir(x, y, 6, { f: F, c: L, w: 1 }) + path('M' + (x - 6) + ' ' + y + ' L' + (x + 6) + ' ' + y, { c: L, w: 0.5 }) +
      path('M' + (x - 3) + ' ' + (y - 4) + ' L' + (x + 3) + ' ' + (y + 4) + ' M' + (x + 3) + ' ' + (y - 4) + ' L' + (x - 3) + ' ' + (y + 4), { c: L, w: 0.5 });
  }
  function sw(x, y) {
    return cir(x - 5, y, 1.4, { f: L, c: L, w: 0 }) + cir(x + 5, y, 1.4, { f: L, c: L, w: 0 }) +
      ln(x - 5, y, x + 4, y - 4, { w: 1 });
  }
  function meterC(x, y, t) {
    var s = cir(x, y, 7, { f: '#fff', c: L, w: 1 });
    s += T(x, y + 2.5, t, { s: 6 });
    return s;
  }
  function res(x, y) { // 定值电阻
    return rect(x - 8, y - 4, 16, 8, { f: '#fff', c: L, w: 1 });
  }
  F_.cirSeries = function () {
    var s = '';
    s += ln(20, 30, 20, 70, { w: 0.9 }) + ln(100, 30, 100, 70, { w: 0.9 });
    s += ln(20, 30, 34, 30, { w: 0.9 }) + cell(42, 30) + ln(50, 30, 58, 30, { w: 0.9 });
    s += lamp(66, 30) + ln(72, 30, 84, 30, { w: 0.9 });
    s += lamp(92, 30) + ln(98, 30, 100, 30, { w: 0.9 });
    s += ln(20, 70, 100, 70, { w: 0.9 });
    s += sw(60, 70);
    s += T(60, 92, '串联：电流只有一条路径', { s: 4.2, c: A });
    return s;
  };
  F_.cirParallel = function () {
    var s = '';
    s += ln(20, 30, 20, 70, { w: 0.9 }) + ln(100, 30, 100, 70, { w: 0.9 });
    s += ln(20, 30, 34, 30, { w: 0.9 }) + cell(42, 30) + ln(50, 30, 56, 30, { w: 0.9 });
    s += sw(62, 30) + ln(68, 30, 76, 30, { w: 0.9 });
    s += ln(76, 30, 76, 48, { w: 0.9 }) + lamp(76, 56) + ln(76, 64, 76, 70, { w: 0.9 });
    s += ln(92, 30, 92, 48, { w: 0.9 }) + lamp(92, 56) + ln(92, 64, 92, 70, { w: 0.9 });
    s += ln(76, 30, 100, 30, { w: 0.9 });
    s += ln(20, 70, 100, 70, { w: 0.9 });
    s += T(60, 92, '并联：各支路互不影响', { s: 4.2, c: A });
    return s;
  };
  F_.meter = function (type, v) {
    var s = cir(60, 46, 30, { f: '#fff', c: L, w: 1.2 });
    var max = type === 'A' ? 0.6 : 3;
    for (var i = 0; i <= 6; i++) {
      var ang = (-120 + i * 40) * Math.PI / 180;
      var x1 = 60 + 25 * Math.sin(ang), y1 = 46 - 25 * Math.cos(ang);
      var x2 = 60 + 20 * Math.sin(ang), y2 = 46 - 20 * Math.cos(ang);
      s += ln(x1, y1, x2, y2, { w: 0.8 });
      var tx = 60 + 15 * Math.sin(ang), ty = 46 - 15 * Math.cos(ang) + 2;
      s += T(tx, ty, String((max * i / 6).toFixed(max < 1 ? 1 : 0)), { s: 4 });
    }
    var a2 = (-120 + (v / max) * 240) * Math.PI / 180;
    s += arrow(60, 46, 60 + 20 * Math.sin(a2), 46 - 20 * Math.cos(a2), { c: A, w: 1 });
    s += cir(60, 46, 2, { f: L, c: L, w: 0 });
    s += T(60, 86, type === 'A' ? '电流表（A）' : '电压表（V）', { s: 5, c: A });
    return s;
  };
  F_.rheostat = function () {
    var s = rect(24, 40, 72, 8, { f: '#fff', c: L, w: 1 });
    for (var i = 0; i < 12; i++) s += ln(28 + i * 6, 40, 28 + i * 6, 48, { w: 0.4 });
    s += path('M40 32 L64 32 L64 40', { c: A, w: 1.4 });
    s += tri(52, 30, 4, 'd');
    s += ln(20, 44, 24, 44, { w: 0.9 }) + ln(96, 44, 100, 44, { w: 0.9 });
    s += T(52, 24, '滑片 P', { s: 4.5, c: A });
    s += T(60, 62, '接线柱怎么接？', { s: 4.2 });
    s += T(60, 90, '闭合前滑片置于？处', { s: 4, c: A });
    return s;
  };
  F_.ohm = function () {
    var s = ln(18, 26, 18, 74, { w: 0.9 }) + ln(102, 26, 102, 74, { w: 0.9 });
    s += ln(18, 26, 30, 26, { w: 0.9 }) + cell(38, 26) + ln(46, 26, 54, 26, { w: 0.9 });
    s += sw(60, 26) + ln(66, 26, 74, 26, { w: 0.9 });
    s += meterC(82, 26, 'A') + ln(89, 26, 102, 26, { w: 0.9 });
    s += res(60, 74) + ln(18, 74, 52, 74, { w: 0.9 }) + ln(68, 74, 102, 74, { w: 0.9 });
    s += ln(40, 26, 40, 58, { c: A, w: 0.7, d: '3,2' }) + ln(40, 58, 40, 74, { c: A, w: 0.7, d: '3,2' });
    s += meterC(40, 62, 'V');
    s += T(60, 92, '伏安法测未知电阻', { s: 4.5, c: A });
    return s;
  };
  F_.home = function () {
    var s = ln(12, 24, 108, 24, { w: 0.9 }) + ln(12, 76, 108, 76, { w: 0.9 });
    s += T(8, 26, '火线', { s: 4, c: A, an: 'start' }) + T(8, 78, '零线', { s: 4, an: 'start' });
    s += rect(26, 20, 14, 8, { f: '#fff', c: L, w: 0.9 }) + T(33, 40, '电能表', { s: 3.8 });
    s += ln(40, 24, 52, 24, { w: 0.9 }) + sw(58, 24) + ln(64, 24, 78, 24, { w: 0.9 });
    s += ln(78, 24, 78, 40, { w: 0.9 }) + lamp(78, 46) + ln(78, 52, 78, 76, { w: 0.9 });
    s += ln(92, 24, 92, 40, { w: 0.9 });
    s += rect(86, 40, 12, 10, { f: '#fff', c: L, w: 0.9 });
    s += cir(89, 43, 0.8, { f: L, c: L, w: 0 }) + cir(95, 43, 0.8, { f: L, c: L, w: 0 }) + cir(92, 47.5, 0.8, { f: L, c: L, w: 0 });
    s += ln(92, 50, 92, 76, { w: 0.9 });
    s += T(92, 62, '三孔', { s: 3.8 });
    s += T(60, 92, '开关必须接在火线上', { s: 4.2, c: A });
    return s;
  };
  F_.solenoid = function () {
    var s = '';
    for (var i = 0; i < 7; i++) {
      s += path('M' + (40 + i * 7) + ' 44 A5 8 0 1 1 ' + (40 + i * 7) + ' 60', { c: L, w: 1 });
    }
    s += ln(20, 34, 40, 34, { w: 0.9 }) + ln(20, 34, 20, 70, { w: 0.9 });
    s += cell(26, 70) + ln(34, 70, 40, 70, { w: 0.9 });
    s += ln(40, 70, 38, 70, { w: 0.9 });
    s += ln(89, 44, 100, 44, { w: 0.9 }) + ln(100, 44, 100, 70, { w: 0.9 }) + ln(100, 70, 89, 70, { w: 0.9 });
    s += ln(89, 70, 82, 70, { w: 0.9 });
    s += T(60, 22, 'N', { s: 5, c: A }) + T(106, 52, 'S', { s: 5, c: A });
    s += T(60, 90, '安培定则判定极性', { s: 4.2, c: A });
    return s;
  };
  F_.induction = function () {
    var s = path('M34 26 L34 74 L52 74 L52 26', { f: 'none', c: L, w: 1.2 });
    s += T(30, 32, 'N', { s: 5, c: A }) + T(56, 32, 'S', { s: 5, c: A });
    for (var i = 0; i < 4; i++) s += arrow(40 + i * 6, 34, 40 + i * 6, 66, { c: A, w: 0.6 });
    s += ln(58, 50, 92, 50, { w: 1.4 });
    s += T(75, 44, '导体', { s: 4.2 });
    s += arrow(75, 50, 75, 38, { c: A, w: 0.9 });
    s += T(75, 32, 'v', { s: 5, c: A });
    s += meterC(75, 76, 'G');
    s += ln(75, 50, 75, 60, { w: 0.7, d: '2,2' });
    s += T(60, 94, '切割磁感线会产生电流', { s: 4, c: A });
    return s;
  };
  F_.engine = function (k) {
    var s = rect(48, 26, 26, 46, { f: '#fff', c: L, w: 1.1 });
    s += ln(48, 30, 74, 30, { w: 0.8 });
    s += rect(56, 20, 10, 8, { f: 'none', c: L, w: 0.9 });
    s += ln(52, 52, 52, 44, { w: 1.2 }) + ln(52, 44, 70, 44, { w: 1.2 }) + ln(70, 44, 70, 52, { w: 1.2 });
    s += ln(58, 52, 58, 60, { w: 1 }) + ln(66, 52, 66, 60, { w: 1 });
    s += cir(62, 62, 5, { f: L, c: L, w: 0 });
    var ty = k === 1 ? 58 : (k === 2 ? 48 : (k === 3 ? 42 : 58));
    s += rect(52, ty, 20, 4, { f: A, c: A, w: 0 });
    if (k === 1) { s += tri(52, 24, 3, 'u'); s += T(88, 40, '进气门开', { s: 4, c: A, an: 'start' }); }
    if (k === 2) { s += T(88, 40, '两门关闭', { s: 4, c: A, an: 'start' }); }
    if (k === 3) { s += path('M62 34 l3 6 l-6 0 Z', { f: A, c: A, w: 0 }); s += T(88, 40, '？冲程', { s: 4, c: A, an: 'start' }); }
    if (k === 4) { s += tri(66, 24, 3, 'u'); s += T(88, 40, '排气门开', { s: 4, c: A, an: 'start' }); }
    s += T(34, 50, '活塞', { s: 4.2 });
    return s;
  };
  /* ---------- 地理 ---------- */
  // 等高线地形部位 k:1 山峰 2 山脊 3 山谷 4 鞍部 5 陡崖（图中不给结论文字）
  F_.contour = function (k) {
    var s = '';
    function ring(cx, cy, r, lab) {
      var p = '';
      for (var a = 0; a < 24; a++) {
        var t = a / 24 * Math.PI * 2;
        var rr = r * (1 + 0.06 * Math.sin(t * 3));
        p += (a ? ' L' : 'M') + (cx + rr * Math.cos(t)).toFixed(1) + ' ' + (cy + rr * Math.sin(t) * 0.62).toFixed(1);
      }
      return path(p + ' Z', { c: L, w: 0.9 }) + T(cx + r + 3, cy, lab, { s: 4, an: 'start' });
    }
    if (k === 1) {
      s += ring(52, 50, 8, '300') + ring(52, 50, 18, '200') + ring(52, 50, 30, '100');
    } else if (k === 2 || k === 3) {
      var d = k === 2 ? -1 : 1;   // 山脊向低处凸，山谷向高处凸
      for (var i = 0; i < 4; i++) {
        var y = 28 + i * 15, amp = 12 * d;
        s += path('M14 ' + y + ' Q40 ' + (y + amp) + ' 60 ' + y + ' Q80 ' + (y - amp) + ' 106 ' + y, { c: L, w: 0.9 });
        s += T(8, y + 2, String(400 - i * 100), { s: 4, an: 'start' });
      }
      s += T(60, 92, '数值自下而上增大', { s: 3.6, c: A });
    } else if (k === 4) {
      s += ring(34, 44, 14, '300') + ring(34, 44, 24, '200');
      s += ring(88, 58, 14, '300') + ring(88, 58, 24, '200');
      s += cir(61, 51, 3, { f: A, c: A, w: 0 });
    } else {
      for (var j = 0; j < 3; j++) {
        s += ln(34 - j, 34 + j * 2, 34 - j, 66 - j * 2, { w: 0.9 });
        s += ln(86 + j, 34 + j * 2, 86 + j, 66 - j * 2, { w: 0.9 });
      }
      s += path('M34 34 Q60 44 86 34', { c: L, w: 0.9 });
      s += path('M34 66 Q60 76 86 66', { c: L, w: 0.9 });
      s += T(60, 92, '此处等高线有什么特点？', { s: 3.6, c: A });
    }
    return s;
  };
  // 气温曲线 + 降水柱状 k:1 热带雨林 2 热带沙漠 3 地中海 4 温带海洋性 5 温带季风
  F_.climate = function (k) {
    var T0 = { 1: [26, 27, 27, 27, 27, 26, 26, 26, 26, 26, 26, 26],
      2: [20, 23, 27, 32, 36, 38, 38, 37, 34, 29, 24, 20],
      3: [8, 10, 13, 16, 20, 25, 28, 28, 24, 18, 13, 9],
      4: [5, 5, 7, 9, 12, 15, 17, 17, 14, 11, 7, 5],
      5: [-4, -1, 6, 14, 20, 25, 27, 26, 20, 13, 4, -3] };
    var P0 = { 1: [250, 220, 240, 250, 260, 240, 230, 220, 240, 260, 250, 240],
      2: [2, 1, 2, 1, 1, 0, 0, 1, 2, 3, 4, 3],
      3: [80, 70, 55, 40, 25, 10, 2, 3, 20, 60, 85, 90],
      4: [70, 60, 65, 60, 65, 60, 70, 70, 65, 75, 70, 75],
      5: [10, 12, 20, 35, 55, 90, 220, 180, 70, 35, 18, 10] };
    var t = T0[k] || T0[1], p = P0[k] || P0[1];
    var x0 = 24, x1 = 100, yT = 20, yB = 62, yP = 84;
    var s = ln(x0 - 2, yT, x0 - 2, yB, { w: 0.9 }) + ln(x0 - 2, yB, x1, yB, { w: 0.9 });
    s += ln(x1, yB, x1, yP, { w: 0.9 }) + ln(x0 - 2, yP, x1, yP, { w: 0.9 });
    s += T(14, 24, '气温', { s: 4 }) + T(14, 30, '℃', { s: 4 });
    s += T(110, 46, '降水', { s: 4, an: 'start' });
    s += T(110, 52, 'mm', { s: 4, an: 'start' });
    var pts = [], i;
    for (i = 0; i < 12; i++) {
      var x = x0 + (x1 - x0) * (i + 0.5) / 12;
      var y = yB - (t[i] + 10) / 40 * (yB - yT);
      pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
      var h = Math.min(p[i] / 260 * (yP - yB), yP - yB - 2);
      s += rect((x - 2.6).toFixed(1), (yP - h).toFixed(1), 5.2, h.toFixed(1), { f: F, c: L, w: 0.5 });
    }
    s += path('M' + pts.join(' L'), { c: A, w: 1.3 });
    for (i = 0; i < 12; i += 3) {
      var mx = x0 + (x1 - x0) * (i + 0.5) / 12;
      s += T(mx, yP + 7, String(i + 1), { s: 3.6 });
    }
    s += T(62, 96, '月', { s: 3.6 });
    return s;
  };
  // 太阳直射点 k:1 北回归线 2 赤道 3 南回归线（不写结论，只画位置）
  F_.sunPoint = function (k) {
    var s = cir(58, 48, 26, { f: '#fff', c: L, w: 1.1 });
    var rad = 23.5 * Math.PI / 180;
    var ay = 48 - 32 * Math.cos(rad), ax = 58 + 32 * Math.sin(rad);
    s += ln(58 - 32 * Math.sin(rad), 48 + 32 * Math.cos(rad), ax, ay, { w: 1.1 });
    s += T(ax + 2, ay - 1, '地轴', { s: 3.6, c: A, an: 'start' });
    s += ln(58 - 26, 48, 58 + 26, 48, { c: L, w: 0.9 });
    s += T(88, 50, '赤道', { s: 3.6, an: 'start' });
    var dy = k === 1 ? -10.4 : (k === 3 ? 10.4 : 0);
    var dr = Math.sqrt(26 * 26 - dy * dy);
    s += ln(58 - dr, 48 + dy, 58 + dr, 48 + dy, { c: A, d: '3,2', w: 0.8 });
    for (var i = -1; i <= 1; i++) {
      var y = 48 + dy + i * 9;
      var r2 = Math.sqrt(Math.max(26 * 26 - (y - 48) * (y - 48), 1));
      s += arrow(4, y, 58 - r2, y, { c: A, w: 0.8 });
    }
    s += cir(58 + dr, 48 + dy, 2.4, { f: A, c: A, w: 0 });
    s += T(58 + dr + 6, 48 + dy - 4, '直射点', { s: 3.8, c: A, an: 'start' });
    s += T(60, 94, '读图判断太阳直射哪条纬线', { s: 3.6, c: A });
    return s;
  };
  // 地球五带（用 A-E 编号，不直接给名称）
  F_.fiveZones = function () {
    var s = cir(60, 50, 30, { f: '#fff', c: L, w: 1.1 });
    [0, -10.4, 10.4, -21, 21].forEach(function (dy) {
      var r = Math.sqrt(30 * 30 - dy * dy);
      s += ln(60 - r, 50 + dy, 60 + r, 50 + dy, { c: A, d: '3,2', w: 0.8 });
    });
    s += T(100, 18, 'A', { s: 5, c: A }) + T(100, 38, 'B', { s: 5, c: A }) +
      T(100, 52, 'C', { s: 5, c: A }) + T(100, 66, 'D', { s: 5, c: A }) + T(100, 86, 'E', { s: 5, c: A });
    s += ln(94, 20, 88, 26, { c: A, w: 0.6 }) + ln(94, 62, 88, 62, { c: A, w: 0.6 });
    s += T(60, 94, 'A～E 中哪个有太阳直射？哪个有极昼极夜？', { s: 3.4, c: A });
    return s;
  };
  // 中国地势三级阶梯（剖面示意）
  F_.cnStep = function () {
    var s = path('M10 76 L10 62 L36 62 L36 48 L64 48 L64 34 L110 34 L110 76 Z', { f: F, c: L, w: 1.1 });
    s += ln(10, 76, 110, 76, { w: 1 });
    s += T(23, 58, 'Ⅰ', { s: 5, c: A }) + T(50, 44, 'Ⅱ', { s: 5, c: A }) + T(87, 30, 'Ⅲ', { s: 5, c: A });
    s += ln(6, 60, 6, 30, { w: 0.8 }) + tri(6, 28, 3.4, 'u') + T(8, 24, '海拔', { s: 3.6, an: 'start' });
    s += T(16, 86, '西', { s: 4.5, c: A }) + T(104, 86, '东', { s: 4.5, c: A });
    s += arrow(20, 90, 100, 90, { c: A, w: 0.8 });
    return s;
  };
  // 板块运动：张裂 / 碰撞
  F_.plate = function (k) {
    var s = '';
    if (k === 1) {
      s += path('M10 30 L54 30 L54 70 L10 70 Z', { f: F, c: L, w: 1.1 });
      s += path('M66 30 L110 30 L110 70 L66 70 Z', { f: F, c: L, w: 1.1 });
      s += arrow(52, 50, 36, 50, { c: A, w: 1.1 });
      s += arrow(68, 50, 84, 50, { c: A, w: 1.1 });
      s += T(60, 22, '张裂', { s: 4.5, c: A });
      s += T(60, 88, '张裂处常形成裂谷或海洋', { s: 3.6, c: A });
    } else {
      s += path('M6 30 L56 30 L56 70 L6 70 Z', { f: F, c: L, w: 1.1 });
      s += path('M64 30 L114 30 L114 70 L64 70 Z', { f: F, c: L, w: 1.1 });
      s += arrow(50, 50, 62, 50, { c: A, w: 1.1 });
      s += arrow(70, 50, 58, 50, { c: A, w: 1.1 });
      s += T(60, 22, '碰撞挤压', { s: 4.5, c: A });
      s += T(60, 88, '碰撞处常形成山脉', { s: 3.6, c: A });
    }
    return s;
  };
  /* ---------- 生物 ---------- */
  // 细胞结构 t:1 动物细胞 2 植物细胞
  F_.cell = function (t) {
    var s = '';
    if (t === 2) {
      s += rect(14, 18, 92, 66, { f: '#fff', c: L, w: 1.6, rx: 8 });
      s += rect(18, 22, 84, 58, { f: F, c: L, w: 0.9, rx: 6 });
      s += cir(42, 48, 10, { f: '#fff', c: L, w: 1 });
      s += cir(42, 48, 4, { f: A, c: A, w: 0 });
      s += T(42, 68, '①', { s: 4.6, c: A });
      [[64, 34], [82, 44], [68, 64]].forEach(function (p) {
        s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="8" ry="5" fill="' + F + '" stroke="' + A + '" stroke-width="0.9"/>';
        s += ln(p[0] - 5, p[1] - 2, p[0] + 3, p[1] - 2, { c: A, w: 0.5 });
        s += ln(p[0] - 5, p[1] + 2, p[0] + 3, p[1] + 2, { c: A, w: 0.5 });
      });
      s += T(74, 30, '②', { s: 4.4, c: A });
      s += '<ellipse cx="88" cy="66" rx="14" ry="12" fill="none" stroke="' + L + '" stroke-width="1"/>';
      s += T(88, 84, '③', { s: 4.4, c: A });
      s += T(30, 26, '④', { s: 4.4, c: A });
      s += T(60, 96, '植物细胞', { s: 4.2, c: A });
    } else {
      s += '<ellipse cx="60" cy="50" rx="44" ry="34" fill="' + F + '" stroke="' + L + '" stroke-width="1.4"/>';
      s += cir(50, 46, 10, { f: '#fff', c: L, w: 1 });
      s += cir(50, 46, 4, { f: A, c: A, w: 0 });
      s += T(50, 66, '①', { s: 4.6, c: A });
      [[78, 38], [76, 62]].forEach(function (p) {
        s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="7" ry="4.5" fill="none" stroke="' + A + '" stroke-width="0.9"/>';
        s += path('M' + (p[0] - 5) + ' ' + p[1] + ' q2.5 -3 5 0 q2.5 3 5 0', { c: A, w: 0.5 });
      });
      s += T(78, 30, '②', { s: 4.4, c: A });
      s += T(24, 30, '③', { s: 4.4, c: A });
      s += T(60, 96, '动物细胞', { s: 4.2, c: A });
    }
    return s;
  };
  // 显微镜结构
  F_.micro = function () {
    var s = path('M46 88 L74 88 L70 80 L50 80 Z', { f: '#fff', c: L, w: 1.1 });   // 镜座
    s += ln(60, 80, 60, 40, { w: 1.2 });                                          // 镜臂
    s += ln(60, 40, 46, 40, { w: 1.2 }) + rect(42, 30, 8, 12, { f: '#fff', c: L, w: 1 }); // 镜筒+目镜
    s += T(38, 28, '①', { s: 4.4, c: A, an: 'end' });
    s += rect(46, 52, 30, 5, { f: '#fff', c: L, w: 1 });                          // 载物台
    s += T(84, 55, '②', { s: 4.4, c: A, an: 'start' });
    s += cir(61, 52, 1.6, { f: L, c: L, w: 0 });
    s += path('M52 58 L52 66 M70 58 L70 66', { c: L, w: 0.9 });
    s += T(88, 64, '③', { s: 4.2, c: A, an: 'start' });
    s += rect(48, 68, 24, 6, { f: '#fff', c: L, w: 1 });                          // 反光镜
    s += T(84, 72, '④', { s: 4.2, c: A, an: 'start' });
    s += path('M56 44 L60 40 L64 44', { c: L, w: 1 });
    s += rect(54, 44, 12, 6, { f: '#fff', c: L, w: 0.9 });                        // 转换器
    s += path('M57 50 L57 56 M63 50 L63 56', { c: L, w: 1 });
    s += T(30, 60, '⑤', { s: 4.4, c: A, an: 'end' });
    s += cir(80, 44, 4, { f: '#fff', c: L, w: 0.9 });                              // 准焦螺旋
    s += T(92, 42, '⑥', { s: 4.2, c: A, an: 'start' });
    return s;
  };
  // 菜豆种子结构
  F_.seed = function () {
    var s = path('M30 30 Q30 18 58 18 Q86 18 86 30 Q86 74 58 78 Q30 74 30 30 Z', { f: '#fff', c: L, w: 1.2 });
    s += path('M58 20 L58 76', { c: L, w: 0.8, d: '3,2' });
    s += path('M42 30 Q34 40 38 56 L44 54 Q42 40 46 32 Z', { f: F, c: L, w: 0.8 });
    s += T(36, 44, '①', { s: 4.4, c: A, an: 'end' });
    s += path('M74 30 Q82 40 78 56 L72 54 Q74 40 70 32 Z', { f: F, c: L, w: 0.8 });
    s += T(80, 44, '①', { s: 4.4, c: A, an: 'start' });
    s += path('M56 34 L60 34 L60 52 L56 52 Z', { f: A, c: A, w: 0 });
    s += T(60, 30, '②', { s: 4.2, c: A });
    s += path('M54 52 L62 52 L62 58 L54 58 Z', { f: '#fff', c: A, w: 0.8 });
    s += T(70, 57, '③', { s: 4.2, c: A, an: 'start' });
    s += path('M56 58 Q52 66 54 72 L60 72 Q58 66 60 58 Z', { f: '#fff', c: A, w: 0.8 });
    s += T(46, 70, '④', { s: 4.2, c: A, an: 'end' });
    s += T(58, 92, '⑤ 种皮', { s: 3.4 });
    return s;
  };
  // 花的结构
  F_.flower = function () {
    var s = ln(60, 92, 60, 74, { w: 1 });                                   // 花柄
    s += path('M52 74 Q60 70 68 74 Z', { f: F, c: L, w: 0.9 });             // 花托
    for (var i = 0; i < 5; i++) {                                            // 花瓣
      var a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      s += '<ellipse cx="' + (60 + 16 * Math.cos(a)).toFixed(1) + '" cy="' + (46 + 16 * Math.sin(a)).toFixed(1) +
        '" rx="9" ry="13" fill="' + F + '" stroke="' + L + '" stroke-width="0.9" transform="rotate(' +
        (i * 72) + ' ' + (60 + 16 * Math.cos(a)).toFixed(1) + ' ' + (46 + 16 * Math.sin(a)).toFixed(1) + ')"/>';
    }
    s += T(94, 30, '①', { s: 4.2, c: A, an: 'start' });
    s += cir(60, 46, 6, { f: '#fff', c: L, w: 1 });
    s += ln(60, 40, 60, 26, { c: A, w: 1.1 });                                // 花柱
    s += path('M56 24 Q60 20 64 24 Z', { f: A, c: A, w: 0.6 });               // 柱头
    s += T(70, 22, '②', { s: 4.2, c: A, an: 'start' });
    s += path('M52 44 L48 30 M68 44 L72 30', { c: L, w: 1 });                  // 花丝
    s += rect(45, 26, 6, 5, { f: '#fff', c: L, w: 0.9 });
    s += rect(69, 26, 6, 5, { f: '#fff', c: L, w: 0.9 });
    s += T(38, 24, '③', { s: 4.2, c: A, an: 'end' });
    s += T(84, 36, '④', { s: 4.2, c: A, an: 'start' });
    s += path('M54 50 Q60 58 66 50', { c: A, w: 0.9 });
    s += T(60, 62, '⑤', { s: 4.2, c: A });
    s += T(60, 96, '花的结构', { s: 3.4, c: A });
    return s;
  };
  // 心脏结构
  F_.heart = function () {
    var s = path('M40 26 Q58 18 76 26 Q86 40 78 62 Q66 80 58 82 Q44 76 38 58 Q32 38 40 26 Z', { f: '#fff', c: L, w: 1.3 });
    s += ln(58, 24, 58, 80, { c: L, w: 1 });
    s += ln(40, 46, 76, 46, { c: L, w: 1 });
    s += T(48, 36, '①', { s: 4.4, c: A });
    s += T(48, 60, '②', { s: 4.4, c: A });
    s += T(68, 36, '③', { s: 4.4, c: A });
    s += T(68, 60, '④', { s: 4.4, c: A });
    s += path('M50 26 Q50 12 40 12', { c: L, w: 2 });
    s += T(34, 10, '上、下腔静脉', { s: 3.2, an: 'end' });
    s += path('M66 26 Q66 10 78 10', { c: L, w: 2 });
    s += T(84, 8, '肺静脉', { s: 3.2, an: 'start' });
    s += path('M48 78 Q44 88 34 88', { c: A, w: 2.4 });
    s += T(30, 92, '肺动脉', { s: 3.2, an: 'end' });
    s += path('M70 78 Q74 90 88 90', { c: A, w: 3 });
    s += T(92, 94, '主动脉', { s: 3.2, an: 'start' });
    return s;
  };
  // 反射弧
  F_.reflex = function () {
    var s = '';
    var box = [[12, 40, '感受器'], [34, 40, '传入神经'], [58, 40, '神经中枢'], [82, 24, '传出神经'], [82, 62, '效应器']];
    box.forEach(function (b) {
      s += rect(b[0], b[1], 20, 12, { f: F, c: L, w: 0.9, rx: 2 });
      s += T(b[0] + 10, b[1] + 8.5, b[2], { s: 3.2 });
    });
    s += arrow(32, 46, 34, 46, { c: A, w: 0.9 });
    s += arrow(54, 46, 58, 46, { c: A, w: 0.9 });
    s += arrow(78, 44, 84, 32, { c: A, w: 0.9 });
    s += arrow(78, 48, 84, 62, { c: A, w: 0.9 });
    s += ln(12, 46, 6, 46, { w: 1 }) + T(6, 40, '刺激', { s: 3.2, c: A });
    s += T(56, 88, '反射的结构基础', { s: 3.6, c: A });
    return s;
  };
  // 遗传图解（杂合子自交）
  F_.genetic = function () {
    var s = rect(22, 16, 76, 68, { f: '#fff', c: L, w: 1 });
    s += ln(22, 34, 98, 34, { w: 0.9 }) + ln(22, 62, 98, 62, { w: 0.9 });
    s += ln(48, 16, 48, 84, { w: 0.9 }) + ln(73, 16, 73, 84, { w: 0.9 });
    s += T(35, 30, '♂\\♀', { s: 3.4 });
    s += T(60, 29, 'A', { s: 5, c: A }) + T(85, 29, 'a', { s: 5, c: A });
    s += T(35, 50, 'A', { s: 5, c: A }) + T(35, 78, 'a', { s: 5, c: A });
    s += T(60, 53, 'AA', { s: 4.6 }) + T(85, 53, 'Aa', { s: 4.6 });
    s += T(60, 81, 'Aa', { s: 4.6 }) + T(85, 81, 'aa', { s: 4.6, c: A });
    s += T(60, 94, '子代基因型', { s: 3.4, c: A });
    return s;
  };
  // 食物链
  F_.foodChain = function () {
    var s = cir(16, 16, 6, { f: A, c: A, w: 0 });
    s += path('M20 20 L28 28 M24 18 L30 22', { c: A, w: 0.8 });
    s += path('M28 62 q4 -22 8 -30 q4 8 8 30 Z', { f: F, c: L, w: 0.9 });
    s += T(32, 68, '草', { s: 3.8 });
    s += arrow(42, 50, 56, 42, { c: A, w: 1 });
    s += '<ellipse cx="66" cy="40" rx="10" ry="7" fill="' + F + '" stroke="' + L + '" stroke-width="0.9"/>';
    s += path('M63 33 l-2 -6 l4 2 M69 33 l2 -6 l-4 2', { c: L, w: 0.8 });
    s += T(66, 54, '兔', { s: 3.8 });
    s += arrow(78, 38, 92, 30, { c: A, w: 1 });
    s += path('M98 26 q-8 -6 -12 0 q-4 6 0 10 q4 4 8 0 Z', { f: F, c: L, w: 0.9 });
    s += T(100, 44, '狐', { s: 3.8 });
    s += T(60, 88, '箭头指向捕食者', { s: 3.6, c: A });
    return s;
  };
  // 肾单位与尿的形成
  F_.nephron = function () {
    var s = path('M22 30 L46 30', { c: L, w: 1.6 });
    s += cir(52, 36, 9, { f: '#fff', c: L, w: 1 });
    s += path('M46 30 q-6 6 0 12', { c: A, w: 1.4 });
    s += T(30, 24, '③', { s: 4.2, c: A });
    s += path('M58 42 L72 42 Q84 42 84 52 Q84 62 72 62 L58 62', { c: L, w: 1.6 });
    s += T(78, 38, '②', { s: 4.4, c: A });
    s += path('M58 30 L46 30', { c: L, w: 1.2 });
    s += T(30, 48, '④', { s: 4.2, c: A });
    s += arrow(20, 36, 44, 36, { c: A, w: 0.9 });
    s += T(14, 30, '滤过', { s: 3.2, c: A });
    s += arrow(56, 72, 56, 62, { c: A, w: 0.9 });
    s += T(56, 80, '重吸收', { s: 3.2, c: A });
    s += T(52, 20, '①', { s: 4.4, c: A });
    s += T(60, 94, '肾单位', { s: 3.6, c: A });
    return s;
  };
  // 细菌 / 病毒 t:1 细菌 2 病毒
  F_.bactVirus = function (t) {
    var s = '';
    if (t === 1) {
      s += path('M26 36 q18 -14 36 0 q18 14 36 0 q-18 14 -36 0 q-18 -14 -36 0 Z', { f: F, c: L, w: 1.1 });
      s += path('M32 40 q14 8 28 0 q14 -8 28 0', { c: L, w: 0.7, d: '2,2' });
      s += T(60, 30, '③', { s: 4.2, c: A });
      s += path('M46 44 q8 6 16 0', { c: A, w: 1.2 });
      s += T(60, 56, '①', { s: 4.4, c: A });
      s += path('M26 36 q-8 -4 -12 -10', { c: L, w: 1 });
      s += T(10, 20, '②', { s: 4.2, c: A, an: 'start' });
      s += T(60, 74, '细菌（无成形细胞核）', { s: 3.6, c: A });
    } else {
      s += path('M60 18 L84 30 L84 58 L60 70 L36 58 L36 30 Z', { f: '#fff', c: L, w: 1.2 });
      s += path('M46 36 q10 -8 20 0 q-6 10 -20 0 Z', { f: A, c: A, w: 0.6 });
      s += path('M50 48 q10 8 18 2', { c: A, w: 1.2 });
      s += T(60, 78, '①', { s: 4.4, c: A });
      s += T(60, 88, '②', { s: 4.4, c: A });
      s += T(94, 44, '病毒', { s: 4, c: A, an: 'start' });
    }
    return s;
  };
  // 生态系统组成（生产者/消费者/分解者 + 非生物）
  F_.ecosys = function () {
    var s = cir(20, 18, 7, { f: A, c: A, w: 0 });
    s += path('M16 24 L24 24', { c: A, w: 0.8 });
    s += T(30, 20, '阳光', { s: 3.2, c: A, an: 'start' });
    s += path('M40 60 q4 -20 8 -26 q4 6 8 26 Z', { f: F, c: L, w: 1 });
    s += T(48, 68, '生产者', { s: 3.4 });
    s += '<ellipse cx="74" cy="56" rx="8" ry="6" fill="' + F + '" stroke="' + L + '" stroke-width="0.9"/>';
    s += T(74, 68, '消费者', { s: 3.4 });
    s += arrow(56, 54, 66, 56, { c: A, w: 0.9 });
    s += rect(38, 78, 20, 10, { f: '#fff', c: L, w: 0.9 });
    s += cir(44, 83, 2, { f: L, c: L, w: 0 }) + cir(50, 83, 2, { f: L, c: L, w: 0 });
    s += T(66, 86, '分解者', { s: 3.4 });
    s += path('M56 62 L58 78', { c: A, w: 0.8, d: '2,2' });
    s += T(98, 30, '非生物部分', { s: 3.2, an: 'start' });
    return s;
  };
  // 人体循环（体循环 / 肺循环）
  F_.circul = function () {
    var s = '<ellipse cx="34" cy="46" rx="16" ry="20" fill="' + F + '" stroke="' + L + '" stroke-width="1"/>';
    s += T(34, 24, '肺', { s: 3.6 });
    s += '<ellipse cx="88" cy="46" rx="14" ry="18" fill="' + F + '" stroke="' + L + '" stroke-width="1"/>';
    s += T(88, 24, '全身', { s: 3.6 });
    s += T(88, 31, '毛细血管', { s: 3 });
    s += cir(60, 46, 12, { f: '#fff', c: L, w: 1.1 });
    s += T(60, 48, '心脏', { s: 3.4, c: A });
    s += path('M46 38 Q34 26 22 34', { c: A, w: 1.4 });
    s += path('M22 54 Q34 66 46 56', { c: L, w: 1.4 });
    s += T(24, 74, '肺循环', { s: 3.2, c: A });
    s += path('M74 38 Q88 26 102 34', { c: A, w: 1.4 });
    s += path('M102 54 Q88 66 74 56', { c: L, w: 1.4 });
    s += T(96, 74, '体循环', { s: 3.2 });
    return s;
  };
  /* ---------- 历史 ---------- */
  // 朝代 / 事件时间轴（按顺序排列，供判断先后）
  F_.axis = function (items) {
    items = items || ['①', '②', '③', '④', '⑤'];
    var s = ln(10, 52, 110, 52, { w: 1.2 });
    s += tri(110, 52, 4, 'r');
    var n = items.length, step = 96 / n;
    items.forEach(function (it, i) {
      var x = 12 + step * (i + 0.5);
      s += cir(x, 52, 2.2, { f: A, c: A, w: 0 });
      s += ln(x, 55, x, 62, { w: 0.7 });
      s += T(x, 70, it, { s: 4 });
    });
    s += T(60, 84, '时间先后（左→右）', { s: 3.6, c: A });
    return s;
  };
  // 方位 / 路线图：given 名称数组按顺序连成路线
  F_.route = function (items) {
    items = items || ['A', 'B', 'C', 'D'];
    var s = '';
    var pos = [[20, 26], [86, 30], [30, 62], [92, 68], [56, 46]];
    items.forEach(function (it, i) {
      var p = pos[i % pos.length];
      s += cir(p[0], p[1], 2.6, { f: A, c: A, w: 0 });
      s += T(p[0], p[1] - 6, it, { s: 3.8 });
      if (i > 0) {
        var q = pos[(i - 1) % pos.length];
        s += arrow(q[0], q[1], p[0], p[1], { c: L, w: 0.9, d: '3,2' });
      }
    });
    return s;
  };
  // 文明发源地（大河流域）
  F_.civil = function () {
    var s = rect(10, 20, 100, 60, { f: '#fff', c: L, w: 1 });
    s += path('M14 62 Q34 44 52 60 Q70 76 106 52', { c: A, w: 1.6 });
    s += T(30, 38, '①', { s: 4.2, c: A });
    s += path('M20 34 Q40 26 62 40', { c: L, w: 1.2 });
    s += T(52, 30, '②', { s: 4.2, c: A });
    s += path('M64 30 Q80 40 96 34', { c: L, w: 1.2 });
    s += T(80, 28, '③', { s: 4.2, c: A });
    s += path('M88 66 Q96 58 104 62', { c: L, w: 1.2 });
    s += T(94, 74, '④', { s: 4.2, c: A });
    s += T(60, 90, '大河流域示意', { s: 3.4, c: A });
    return s;
  };
  // 战争 / 形势箭头图（from -> to）
  F_.warArrow = function () {
    var s = rect(10, 18, 100, 64, { f: '#fff', c: L, w: 0.9 });
    s += cir(34, 40, 8, { f: F, c: L, w: 1 });
    s += T(34, 56, 'A', { s: 4 });
    s += cir(86, 58, 8, { f: F, c: L, w: 1 });
    s += T(86, 74, 'B', { s: 4 });
    s += arrow(44, 44, 76, 55, { c: A, w: 1.6 });
    s += T(60, 34, '进军方向', { s: 3.4, c: A });
    s += T(60, 92, '读图判断形势与路线', { s: 3.2, c: A });
    return s;
  };
  /* ---------- 道德与法治 ---------- */
  // 个人—集体—国家 同心关系
  F_.ring = function () {
    var s = cir(60, 50, 34, { f: 'none', c: L, w: 1.1 });
    s += cir(60, 50, 24, { f: 'none', c: L, w: 1.1 });
    s += cir(60, 50, 13, { f: F, c: L, w: 1.1 });
    s += T(60, 53, '个人', { s: 3.8, c: A });
    s += T(60, 30, '集体', { s: 3.6 });
    s += T(60, 12, '国家 / 社会', { s: 3.6 });
    s += T(60, 96, '个人离不开集体，集体离不开国家', { s: 3.2, c: A });
    return s;
  };
  // 规则 / 法律层级金字塔
  F_.pyramid = function () {
    var s = path('M60 16 L96 40 L24 40 Z', { f: F, c: L, w: 1 });
    s += path('M50 44 L100 44 L104 68 L46 68 Z', { f: '#fff', c: L, w: 1 });
    s += path('M40 72 L106 72 L110 92 L36 92 Z', { f: F, c: L, w: 1 });
    s += T(60, 34, '最高', { s: 3.6, c: A });
    s += T(76, 60, '次之', { s: 3.4 });
    s += T(74, 86, '基础', { s: 3.4 });
    s += T(14, 40, '效力', { s: 3.2, an: 'start' });
    return s;
  };
  // 权利与义务天平
  F_.rightScale = function () {
    var s = ln(60, 82, 60, 44, { w: 1.2 });
    s += path('M60 82 L52 92 L68 92 Z', { f: L, c: L, w: 0.4 });
    s += ln(22, 44, 98, 44, { w: 1.6 });
    s += cir(60, 44, 2, { f: L, c: L, w: 0 });
    s += ln(30, 44, 30, 56, { w: 0.7 }) + path('M18 56 L42 56', { c: L, w: 1.2 }) + path('M20 56 Q30 66 40 56', { c: L, w: 1 });
    s += ln(90, 44, 90, 56, { w: 0.7 }) + path('M78 56 L102 56', { c: L, w: 1.2 }) + path('M80 56 Q90 66 100 56', { c: L, w: 1 });
    s += T(30, 74, '权利', { s: 4, c: A });
    s += T(90, 74, '义务', { s: 4, c: A });
    s += T(60, 20, '相统一', { s: 3.8, c: A });
    return s;
  };
  // 成长 / 发展折线（趋势示意）
  F_.trend = function () {
    var s = ln(18, 84, 106, 84, { w: 1 }) + ln(18, 84, 18, 20, { w: 1 });
    s += path('M20 76 L40 66 L58 70 L78 44 L104 26', { c: A, w: 1.4 });
    [40, 58, 78, 104].forEach(function (x, i) {
      s += cir(x, [66, 70, 44, 26][i], 1.8, { f: A, c: A, w: 0 });
    });
    s += T(112, 88, '时间', { s: 3.2, an: 'end' });
    s += T(60, 96, '读图判断变化趋势', { s: 3.2, c: A });
    return s;
  };
  /* ---------- 补充：天平 / 电动机 / 还原装置 ---------- */
  F_.balance = function () {
    var s = ln(60, 78, 60, 48, { w: 1.2 });           // 立柱
    s += path('M60 78 L52 90 L68 90 Z', { f: L, c: L, w: 0.4 });
    s += ln(24, 46, 96, 46, { w: 1.6 });              // 横梁
    s += cir(60, 46, 2, { f: L, c: L, w: 0 });
    s += ln(60, 44, 60, 34, { w: 0.8 }) + T(60, 30, '指针', { s: 4, c: A });
    s += ln(30, 46, 30, 56, { w: 0.7 }) + path('M20 56 L40 56', { c: L, w: 1.2 }) + path('M22 56 Q30 64 38 56', { c: L, w: 1 });
    s += ln(90, 46, 90, 56, { w: 0.7 }) + path('M80 56 L100 56', { c: L, w: 1.2 }) + path('M82 56 Q90 64 98 56', { c: L, w: 1 });
    s += rect(24, 48, 12, 8, { f: F, c: A, w: 0.9 });   // 左：物体
    s += T(30, 44, '物', { s: 4.2, c: A });
    s += rect(84, 50, 6, 6, { f: '#fff', c: L, w: 0.9 }) + rect(92, 52, 5, 4, { f: '#fff', c: L, w: 0.9 });
    s += T(90, 44, '砝码', { s: 4.2 });
    s += T(60, 96, '左物右码', { s: 4.5, c: A });
    return s;
  };
  F_.motor = function () {
    var s = rect(20, 30, 12, 40, { f: F, c: L, w: 1 });
    s += T(26, 26, 'N', { s: 5, c: A });
    s += rect(88, 30, 12, 40, { f: F, c: L, w: 1 });
    s += T(94, 26, 'S', { s: 5, c: A });
    for (var i = 0; i < 3; i++) s += arrow(36, 38 + i * 10, 86, 38 + i * 10, { c: A, w: 0.6 });
    s += rect(50, 38, 24, 24, { f: '#fff', c: L, w: 1.4 });
    s += T(62, 54, '线圈', { s: 4.2, c: A });
    s += ln(50, 50, 40, 50, { w: 1 }) + ln(74, 50, 84, 50, { w: 1 });
    s += cir(40, 50, 2.4, { f: '#fff', c: L, w: 1 }) + cir(84, 50, 2.4, { f: '#fff', c: L, w: 1 });
    s += path('M40 47.6 L43 47.6 M40 52.4 L43 52.4 M84 47.6 L81 47.6 M84 52.4 L81 52.4', { c: L, w: 0.8 });
    s += ln(40, 52.4, 40, 76, { w: 0.9 }) + ln(84, 52.4, 84, 76, { w: 0.9 });
    s += cell(62, 76) + ln(54, 76, 40, 76, { w: 0.9 }) + ln(70, 76, 84, 76, { w: 0.9 });
    s += T(62, 90, '线圈为什么会转动？', { s: 3.8, c: A });
    return s;
  };
  F_.reduceCuO = function () {
    var s = ln(26, 88, 26, 30, { w: 1.4 }) + ln(26, 30, 70, 30, { w: 1.4 });
    s += rect(34, 32, 16, 40, { f: '#fff', c: L, w: 1 });
    s += path('M34 64 Q42 72 50 64', { c: L, w: 1 });
    s += rect(35, 54, 14, 8, { f: F, c: 'none', w: 0 });
    s += T(42, 50, 'C+CuO', { s: 3.6, c: A });
    s += path('M50 36 L50 30 L70 30 L70 60', { c: L, w: 1 });
    s += ln(70, 60, 70, 66, { w: 1 });
    s += path('M60 66 L60 84 Q60 90 66 90 L84 90 Q90 90 90 84 L90 66', { f: '#fff', c: L, w: 1.1 });
    s += rect(60, 78, 30, 12, { f: F, c: 'none', w: 0 });
    s += T(75, 74, '澄清石灰水', { s: 3.6, c: A });
    s += path('M30 76 L30 84', { c: A, w: 0.8 });
    s += path('M26 80 Q30 86 34 80 L34 78 L26 78 Z', { f: A, c: A, w: 0 });
    s += T(42, 96, '黑色粉末变红，石灰水变浑浊', { s: 3.6, c: A });
    return s;
  };
  /* ---------- 化学 ---------- */
  F_.chemTube = function () {
    var s = ln(30, 88, 30, 34, { w: 1.4 }) + ln(30, 34, 92, 34, { w: 1.4 });
    s += rect(56, 30, 16, 40, { f: '#fff', c: L, w: 1 });
    s += path('M56 62 Q64 70 72 62', { c: L, w: 1 });
    s += rect(56, 50, 16, 12, { f: F, c: 'none', w: 0 });
    s += path('M56 50 L72 50', { c: A, w: 0.8 });
    s += path('M50 70 L58 78 L66 70 Z', { f: 'none', c: L, w: 1 });
    s += path('M56 78 Q64 84 72 78 L72 76 L56 76 Z', { f: A, c: A, w: 0 });
    s += ln(60, 82, 60, 88, { w: 0.8 }) + ln(68, 82, 68, 88, { w: 0.8 });
    s += T(64, 94, '酒精灯（用外焰加热）', { s: 4, c: A });
    s += T(30, 28, '铁架台', { s: 4 });
    return s;
  };
  F_.chemFilter = function () {
    var s = path('M48 26 L84 26 L70 50 L62 50 Z', { f: '#fff', c: L, w: 1 });
    s += path('M52 30 L80 30 L69 46 L63 46 Z', { f: F, c: 'none', w: 0 });
    s += ln(66, 50, 66, 62, { w: 0.8 });
    s += path('M40 62 L40 82 Q40 88 46 88 L74 88 Q80 88 80 82 L80 62', { f: '#fff', c: L, w: 1 });
    s += rect(40, 74, 40, 12, { f: F, c: 'none', w: 0 });
    s += ln(40, 74, 80, 74, { c: A, w: 0.8 });
    s += ln(92, 20, 60, 40, { w: 1.4 });
    s += T(96, 18, '玻璃棒', { s: 4, an: 'start' });
    s += T(60, 96, '一贴二低三靠', { s: 4.2, c: A });
    return s;
  };
  F_.electrolysis = function () {
    var s = rect(34, 30, 52, 44, { f: '#fff', c: L, w: 1.2 });
    s += rect(34, 40, 52, 34, { f: F, c: 'none', w: 0 });
    s += ln(34, 40, 86, 40, { c: A, w: 0.8 });
    s += rect(46, 58, 12, 16, { f: '#fff', c: L, w: 0.9 });
    s += rect(70, 44, 12, 30, { f: '#fff', c: L, w: 0.9 });
    s += ln(58, 18, 58, 46, { w: 0.8 }) + ln(58, 18, 46, 18, { w: 0.8 }) + rect(42, 16, 8, 5, { f: L, c: L, w: 0 });
    s += ln(70, 18, 70, 30, { w: 0.8 }) + ln(70, 18, 82, 18, { w: 0.8 }) + rect(78, 16, 8, 5, { f: A, c: A, w: 0 });
    s += T(38, 14, '−', { s: 8, c: A }) + T(92, 14, '+', { s: 8, c: A });
    s += T(46, 82, 'H₂', { s: 4.5, c: A }) + T(76, 82, 'O₂', { s: 4.5, c: A });
    s += T(60, 96, '氢氧体积比 2 : 1', { s: 4.2, c: A });
    return s;
  };
  F_.atom = function (p, shells) {
    var s = cir(60, 50, 12, { f: F, c: L, w: 1 });
    s += T(60, 53, '+' + p, { s: 5.5, c: A });
    shells = shells || [2, 8];
    shells.forEach(function (n, idx) {
      var r = 22 + idx * 12;
      s += cir(60, 50, r, { c: A, d: '2,2', w: 0.6 });
      for (var i = 0; i < n; i++) {
        var a = (2 * Math.PI * i) / n - Math.PI / 2 + idx * 0.4;
        s += cir(60 + r * Math.cos(a), 50 + r * Math.sin(a), 1.8, { f: A, c: A, w: 0 });
      }
    });
    s += T(60, 92, '核电荷数 = ？ = ？', { s: 3.8, c: A });
    return s;
  };
  F_.solubility = function () {
    var s = ln(20, 84, 108, 84, { w: 1 }) + ln(20, 84, 20, 20, { w: 1 });
    s += T(14, 88, '0', { s: 4 }) + T(108, 92, '温度/℃', { s: 4, an: 'end' });
    s += T(10, 24, 'S/g', { s: 4, an: 'start' });
    s += path('M20 76 C50 60 70 34 106 26', { c: L, w: 1.2 });
    s += path('M20 68 C50 62 70 66 106 70', { c: A, w: 1.2 });
    s += T(92, 22, '甲', { s: 4.5, c: L }) + T(96, 74, '乙', { s: 4.5, c: A });
    s += T(60, 96, '溶解度曲线', { s: 4.2, c: A });
    return s;
  };
  F_.phScale = function (v) {
    var s = '';
    var cols = ['#C0392B', '#D9662F', '#E39A3C', '#C9B23A', '#8FA84B', '#4E8C5A', '#3E7C8C', '#3E4A63', '#5B4B7A', '#7A3B5B'];
    for (var i = 0; i <= 10; i += 2) {
      s += rect(14 + i * 9, 42, 18, 16, { f: cols[i / 2], c: L, w: 0.5 });
      s += T(23 + i * 9, 68, String(i + 2 > 10 ? 10 + (i - 8) : i + 2), { s: 4 });
    }
    s += T(14, 38, '酸性强', { s: 4, an: 'start' }) + T(106, 38, '碱性强', { s: 4, an: 'end' });
    var px = 14 + (v > 0 ? (Math.min(v, 14) / 14) * 90 : 0);
    s += tri(px, 36, 4, 'd');
    s += T(60, 86, 'pH 试纸（不可润湿）', { s: 4.2, c: A });
    return s;
  };
  F_.o2Device = function () {
    var s = ln(26, 88, 26, 30, { w: 1.4 }) + ln(26, 30, 96, 30, { w: 1.4 });
    s += path('M44 34 L60 34 L58 62 Q58 70 51 70 L53 34', { f: '#fff', c: L, w: 1 });
    s += rect(44, 34, 16, 42, { f: '#fff', c: L, w: 1 });
    s += rect(46, 56, 12, 18, { f: F, c: 'none', w: 0 });
    s += ln(60, 40, 76, 40, { w: 1 });
    s += path('M76 40 L76 76', { c: L, w: 1 });
    s += rect(66, 62, 40, 18, { f: '#fff', c: L, w: 1 });
    s += rect(66, 68, 40, 12, { f: F, c: 'none', w: 0 });
    s += path('M50 74 L50 84', { c: A, w: 0.8 });
    s += path('M46 78 Q50 84 54 78 L54 76 L46 76 Z', { f: A, c: A, w: 0 });
    s += T(45, 28, '试管口朝？', { s: 3.8, c: A });
    s += T(86, 58, '水槽', { s: 4 });
    s += T(60, 96, '排水法收集（气体不易溶于水）', { s: 4, c: A });
    return s;
  };
  F_.dilute = function () {
    var s = path('M44 34 L44 78 Q44 86 52 86 L68 86 Q76 86 76 78 L76 34', { f: '#fff', c: L, w: 1.2 });
    s += rect(44, 60, 32, 24, { f: F, c: 'none', w: 0 });
    s += ln(44, 60, 76, 60, { c: A, w: 0.8 });
    s += path('M58 20 L58 50', { c: L, w: 1.6 });
    s += T(58, 16, '浓硫酸', { s: 4.2, c: A });
    s += arrow(58, 50, 58, 60, { c: A, w: 1.2 });
    s += path('M64 26 Q72 34 68 44', { c: L, w: 1.2 });
    s += tri(66, 46, 3.5, 'd');
    s += T(96, 44, '玻璃棒', { s: 4, an: 'start' }) + T(96, 52, '不断搅拌', { s: 4, c: A, an: 'start' });
    s += T(60, 96, '酸入水，沿壁慢慢加', { s: 4.2, c: A });
    return s;
  };
  F_.molecule = function (t) {
    var s = '';
    function ball(x, y, r, c, lb) {
      return cir(x, y, r, { f: c, c: L, w: 0.8 }) + (lb ? T(x, y + 2, lb, { s: 4.2 }) : '');
    }
    if (t === 'water') {
      s += ball(60, 44, 9, F) + ball(44, 62, 6, A) + ball(76, 62, 6, A);
      s += T(60, 46, 'O', { s: 5, c: A }) + T(44, 64, 'H', { s: 4 }) + T(76, 64, 'H', { s: 4 });
      s += T(60, 88, 'H₂O', { s: 5.5, c: A });
    } else {
      s += ball(60, 50, 8, F) + ball(36, 50, 6, A) + ball(84, 50, 6, A);
      s += T(60, 52, 'C', { s: 5, c: A }) + T(36, 52, 'O', { s: 4 }) + T(84, 52, 'O', { s: 4 });
      s += T(60, 88, 'CO₂', { s: 5.5, c: A });
    }
    return s;
  };
  return F_;
})();