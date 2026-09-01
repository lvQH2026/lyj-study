// ===== 家长端 · AI 学习分析引擎（纯前端，零外部依赖）=====
// 数据源：
//  ① 本机模式：localStorage['math_practice_data'].history（含 module/unitName/accuracy/time/wrong 明细，全量能力）
//  ② 远程模式：get_child_stats RPC（云端聚合 units/weak/trend/wrong30，降级能力）
// 分析能力：学科趋势（折线/柱状）、错题归因、风险预测、提升方案、报告导出/分享
(function () {
  'use strict';

  // ============ 基础工具 ============
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function weekOf(ts) {
    const d = new Date(ts);
    const day = (d.getDay() + 6) % 7; // 周一=0
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(monday.getMonth() + 1) + '/' + p(monday.getDate());
  }

  // 学科识别：module 字段优先，其次按单元名关键词推断
  function subjectOf(unitName, module) {
    if (module === '\u8BED\u6587') return '\u8BED\u6587';
    if (module === '\u82F1\u8BED') return '\u82F1\u8BED';
    const n = String(unitName || '');
    if (n.indexOf('\u8BED\u6587') >= 0) return '\u8BED\u6587';
    if (n.indexOf('\u82F1\u8BED') >= 0) return '\u82F1\u8BED';
    return '\u6570\u5B66';
  }
  const SUBJ_COLOR = { '\u6570\u5B66': '#3E4A63', '\u8BED\u6587': '#B4945A', '\u82F1\u8BED': '#5E8B7E' };
  const SUBJ_ORDER = ['\u6570\u5B66', '\u8BED\u6587', '\u82F1\u8BED'];

  // ---- v82：取值有限的运行期分支 → 语义类后缀（配色定义在 css/style.css）----
  // 以前这些颜色是直接拼进 style 属性的（'' + c + ''、'' + c + '33' 这种 8 位
  // 十六进制拼接），既读不出含义，改配色还得翻 JS。现在 JS 只负责判档位。
  const SUBJ_CLS = { '\u6570\u5B66': 's-math', '\u8BED\u6587': 's-cn', '\u82F1\u8BED': 's-en' };
  const subjCls = s => SUBJ_CLS[s] || 's-ink';
  const riskLvl = lv => (lv === 'high' || lv === 'mid' || lv === 'good' ? lv : 'tip');

  // ============ 数据标准化 ============
  // 输入：本机 history 数组；输出：记录数组 [{ts, date, subject, unit, accuracy, total, wrong[]}]
  function normalize(history) {
    const out = [];
    (history || []).forEach(function (h) {
      if (!h || h.accuracy == null || !h.total) return;
      out.push({
        ts: h.time || 0,
        date: fmtDate(h.time || Date.now()),
        subject: subjectOf(h.unitName, h.module),
        unit: h.unitName || '\u672A\u77E5\u5355\u5143',
        accuracy: h.accuracy,
        total: h.total || 0,
        correct: h.score != null ? h.score : Math.round(h.accuracy / 100 * (h.total || 0)),
        wrong: Array.isArray(h.wrong) ? h.wrong : []
      });
    });
    out.sort(function (a, b) { return a.ts - b.ts; }); // 时间升序
    return out;
  }

  // ============ 趋势 ============
  // period: 'week' 最近7天按天 / 'month' 最近30天按周 / 'term' 最近120天按周
  function bucketize(dataset, period) {
    const now = Date.now();
    const day = 86400000;
    const conf = {
      week: { span: 7 * day, unit: 'day' },
      month: { span: 30 * day, unit: 'week' },
      term: { span: 120 * day, unit: 'week' }
    }[period] || { span: 30 * day, unit: 'week' };

    const buckets = [];
    const recs = dataset.filter(function (r) { return r.ts >= now - conf.span; });
    if (conf.unit === 'day') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now - (6 - i) * day);
        const key = fmtDate(d.getTime());
        buckets.push({ key: key, label: (d.getMonth() + 1) + '/' + d.getDate(), list: [] });
      }
      recs.forEach(function (r) {
        const b = buckets.find(function (x) { return x.key === r.date; });
        if (b) b.list.push(r);
      });
    } else {
      // 按周分桶
      const span = conf.span / day;
      const n = Math.ceil(span / 7);
      for (let i = 0; i < n; i++) {
        const end = new Date(now - (n - 1 - i) * 7 * day);
        const start = new Date(now - (n - i) * 7 * day);
        buckets.push({ key: end.getTime(), label: weekOf(end.getTime()), list: [] });
        recs.forEach(function (r) {
          if (r.ts >= start.getTime() && r.ts < end.getTime()) {
            buckets[buckets.length - 1].list.push(r);
          }
        });
      }
    }
    // 计算每桶加权正确率与题量（无数据桶记 null，图里留空）
    return buckets.map(function (b) {
      let c = 0, t = 0;
      b.list.forEach(function (r) { c += r.correct; t += r.total; });
      return {
        label: b.label,
        accuracy: t > 0 ? Math.round(c / t * 100) : null,
        count: t,
        hasData: b.list.length > 0
      };
    });
  }

  // 最小二乘斜率（对非空点），返回 {dir, slopeText, pct}
  function slopeOf(points) {
    const pts = [];
    points.forEach(function (p, i) {
      if (p.accuracy != null) pts.push({ x: i, y: p.accuracy });
    });
    if (pts.length < 2) return { dir: 'flat', slopeText: '\u6570\u636E\u4E0D\u8DB3', pct: 0 };
    const n = pts.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    const denom = n * sxx - sx * sx;
    const slope = denom ? (n * sxy - sx * sy) / denom : 0;
    const span = pts[n - 1].x - pts[0].x || 1;
    const pct = Math.round(slope * span);
    let dir = 'flat';
    if (pct >= 5) dir = 'up';
    else if (pct <= -5) dir = 'down';
    const dirText = dir === 'up' ? '\u7A33\u6B65\u63D0\u5347' : dir === 'down' ? '\u6709\u6240\u4E0B\u6ED1' : '\u57FA\u672C\u5E73\u7A33';
    const arrow = dir === 'up' ? '\u2197' : dir === 'down' ? '\u2198' : '\u2192';
    return { dir: dir, slopeText: arrow + ' ' + dirText + (Math.abs(pct) >= 5 ? '\uFF08\u53D8\u5316\u7EA6 ' + (pct > 0 ? '+' : '') + pct + '%\uFF09' : ''), pct: pct };
  }

  // ============ 错题归因 ============
  function attribute(dataset) {
    const byUnit = {};
    dataset.forEach(function (r) {
      r.wrong.forEach(function (w) {
        const u = w.unitName || r.unit;
        if (!byUnit[u]) byUnit[u] = { unit: u, subject: subjectOf(u), count: 0, types: {} };
        byUnit[u].count++;
        let ty = '\u5176\u4ED6';
        if (w.question) {
          if (w.question.tag === 'read') ty = '\u9605\u8BFB\u7406\u89E3';
          else if (w.question.tag === 'acc') ty = '\u79EF\u7D2F\u4E0E\u8FD0\u7528';
          else if (w.question.type === 'fill') ty = '\u586B\u7A7A\u9898';
          else if (w.question.type === 'judge') ty = '\u5224\u65AD\u9898';
          else if (w.question.type === 'choice' || w.question.options) ty = '\u9009\u62E9\u9898';
          else if (w.question.section) ty = w.question.section;
        }
        byUnit[u].types[ty] = (byUnit[u].types[ty] || 0) + 1;
      });
    });
    const list = Object.keys(byUnit).map(function (k) {
      const it = byUnit[k];
      const topType = Object.keys(it.types).sort(function (a, b) { return it.types[b] - it.types[a]; })[0];
      const unitAcc = unitAccuracy(dataset, k);
      let suggestion;
      if (unitAcc != null && unitAcc < 60) {
        suggestion = '\u5148\u91CD\u770B\u77E5\u8BC6\u8BB2\u89E3\u4E0E\u65B9\u6CD5\u5F15\u5BFC\uFF0C\u518D\u5B8C\u6210 3 \u6B21\u4E13\u9879\u7EC3\u4E60\u5E76\u91CD\u505A\u9519\u9898\u3002';
      } else if (unitAcc != null && unitAcc < 80) {
        suggestion = '\u5B8C\u6210 2 \u6B21\u4E13\u9879\u7EC3\u4E60\uFF0C\u91CD\u70B9\u590D\u7EC3\u300C' + esc(topType || '\u9519\u9898') + '\u300D\u3002';
      } else {
        suggestion = '\u4FDD\u6301\u8282\u594F\uFF0C\u6BCF\u5468 1 \u6B21\u590D\u4E60\u4EE5\u9632\u9057\u5FD8\u3002';
      }
      return {
        unit: k,
        subject: it.subject,
        count: it.count,
        topType: topType,
        acc: unitAcc,
        suggestion: suggestion
      };
    });
    list.sort(function (a, b) { return b.count - a.count; });
    return list.slice(0, 5);
  }

  function unitAccuracy(dataset, unit) {
    let c = 0, t = 0;
    dataset.forEach(function (r) { if (r.unit === unit) { c += r.correct; t += r.total; } });
    return t > 0 ? Math.round(c / t * 100) : null;
  }

  // ============ 风险预测 ============
  function risks(dataset) {
    const out = [];
    const now = Date.now();
    const day = 86400000;

    // 1. 连续下滑（分学科检测：各科最近 3 次，任一学科连续下降即预警）
    const bySubj = {};
    dataset.forEach(function (r) {
      if (!bySubj[r.subject]) bySubj[r.subject] = [];
      bySubj[r.subject].push(r);
    });
    Object.keys(bySubj).forEach(function (s) {
      const recent = bySubj[s].slice(-3);
      if (recent.length < 3) return;
      const accs = recent.map(function (r) { return r.accuracy; });
      if (accs[2] < accs[1] && accs[1] < accs[0]) {
        out.push({ level: 'high', title: s + '\u6210\u7EE9\u8FDE\u7EED\u4E0B\u6ED1', desc: '\u6700\u8FD1 3 \u6B21\u7EC3\u4E60\u6210\u7EE9\u9012\u51CF\uFF08' + accs[0] + '% \u2192 ' + accs[1] + '% \u2192 ' + accs[2] + '%\uFF09\uFF0C\u5EFA\u8BAE\u672C\u5468\u505C\u4E0B\u65B0\u8BFE\uFF0C\u5148\u5DE9\u56FA\u4EE5\u5F80\u9519\u9898\u518D\u91CD\u65B0\u5F00\u59CB\u3002' });
      }
    });
    // 2. 近期低分（最近一次）
    if (dataset.length) {
      const last = dataset[dataset.length - 1];
      if (last.accuracy < 60) {
        out.push({ level: 'mid', title: '\u8FD1\u671F\u72B6\u6001\u4E0D\u4F73', desc: '\u6700\u8FD1\u4E00\u6B21\u7EC3\u4E60\uFF08' + esc(last.subject) + '\u00B7' + esc(last.unit) + '\uFF09\u6B63\u786E\u7387\u4EC5 ' + last.accuracy + '%\uFF0C\u53EF\u80FD\u5B58\u5728\u65B0\u77E5\u8BC6\u70B9\u672A\u638C\u63E1\uFF0C\u5EFA\u8BAE\u5148\u56DE\u770B\u8BE5\u5355\u5143\u65B9\u6CD5\u5F15\u5BFC\u3002' });
      }
    }
    // 3. 薄弱集中
    const attr = attribute(dataset);
    if (attr.length) {
      const totalWrong = attr.reduce(function (s, a) { return s + a.count; }, 0);
      if (totalWrong > 0 && attr[0].count / totalWrong >= 0.4) {
        out.push({ level: 'mid', title: '\u8584\u5F31\u70B9\u8FC7\u4E8E\u96C6\u4E2D', desc: '\u9519\u9898\u4E2D ' + Math.round(attr[0].count / totalWrong * 100) + '% \u96C6\u4E2D\u5728\u300C' + esc(attr[0].unit) + '\u300D\uFF0C\u5EFA\u8BAE\u8FD1\u671F\u91CD\u70B9\u653B\u5173\u8BE5\u5355\u5143\u3002' });
      }
    }
    // 4. 练习量下降
    const last14 = dataset.filter(function (r) { return r.ts >= now - 14 * day; });
    const prev14 = dataset.filter(function (r) { return r.ts >= now - 28 * day && r.ts < now - 14 * day; });
    if (prev14.length >= 4 && last14.length < prev14.length / 2) {
      out.push({ level: 'low', title: '\u7EC3\u4E60\u9891\u7387\u4E0B\u964D', desc: '\u8FD1 14 \u5929\u7EC3\u4E60 ' + last14.length + ' \u6B21\uFF0C\u4E0D\u53CA\u524D 14 \u5929\u7684\u4E00\u534A\uFF0C\u5EFA\u8BAE\u4FDD\u6301\u6BCF\u65E5\u4E00\u7EC3\u7684\u8282\u594F\u3002' });
    }
    // 5. 状态良好
    if (!out.length) {
      out.push({ level: 'good', title: '\u5F53\u524D\u65E0\u660E\u663E\u98CE\u9669', desc: '\u8FD1\u671F\u6210\u7EE9\u7A33\u5B9A\uFF0C\u7EE7\u7EED\u4FDD\u6301\u5F53\u524D\u5B66\u4E60\u8282\u594F\u5373\u53EF\u3002\u5EFA\u8BAE\u6BCF\u5468\u5B8C\u6210 1-2 \u6B21\u7EFC\u5408\u7EC3\u4E60\u3002' });
    }
    return out;
  }

  // ============ 提升方案 ============
  function planOf(dataset, attr, riskList) {
    const focus = attr.slice(0, 3).map(function (a) { return a.unit; });
    const highRisk = riskList.some(function (r) { return r.level === 'high'; });
    const weekly = [];
    if (focus.length) {
      weekly.push('\u672C\u5468\u91CD\u70B9\u653B\u5173\uFF1A' + focus.map(function (u, i) { return (i + 1) + '.' + u; }).join('\u3001'));
    }
    weekly.push(highRisk
      ? '\u5148\u505C\u65B0\u5355\u5143\uFF0C\u7528 2 \u5929\u5B8C\u6210\u9519\u9898\u91CD\u7EC3\uFF0C\u6210\u7EE9\u56DE\u5347\u540E\u518D\u5F00\u65B0\u8BFE\u3002'
      : '\u6BCF\u5929\u4FDD\u6301 30 \u5206\u949F\u7EC3\u4E60\uFF0C\u53EF\u7528\u300C\u968F\u673A\u7EC3\u4E60 30 \u9898\u300D\u4FDD\u6301\u624B\u611F\u3002');
    const daily = [];
    daily.push('\u5468\u4E00\u4E09\u4E94\uFF1A\u4E13\u9879\u7EC3\u4E60\uFF08\u4ECE\u8584\u5F31\u5355\u5143\u5F00\u59CB\uFF09');
    daily.push('\u5468\u4E8C\u56DB\uFF1A\u9519\u9898\u91CD\u7EC3\uFF08\u9519\u9898\u5E93\u201C\u91CD\u7EC3\u201D\u5165\u53E3\uFF09');
    daily.push('\u5468\u672B\uFF1A\u6A21\u62DF\u8003\u8BD5\u4E00\u6B21\uFF08\u5355\u5143\u6216\u671F\u4E2D\u5377\uFF09\uFF0C\u9A8C\u8BC1\u672C\u5468\u6548\u679C');
    return { weekly: weekly, daily: daily, focus: focus };
  }

  // ============ SVG 图表 ============
  // 折线图（正确率走势）
  function renderLineSvg(points, width) {
    const W = width || 640, H = 200, PL = 34, PR = 12, PT = 18, PB = 34;
    const iw = W - PL - PR, ih = H - PT - PB;
    const has = points.filter(function (p) { return p.accuracy != null; });
    if (!has.length) return '<div class="u-p24 u-tc u-c-mute u-fs13">\u8BE5\u65F6\u95F4\u8303\u56F4\u5185\u8FD8\u6CA1\u6709\u7EC3\u4E60\u8BB0\u5F55</div>';
    const maxY = 100, minY = Math.max(0, Math.min.apply(null, has.map(function (p) { return p.accuracy; })) - 10);
    const y = function (v) { return PT + ih - (v - minY) / (maxY - minY) * ih; };
    const x = function (i) { return PL + (points.length <= 1 ? iw / 2 : i / (points.length - 1) * iw); };

    let g = '';
    // 网格
    [0, 25, 50, 75, 100].forEach(function (v) {
      const gy = y(v);
      if (gy < PT || gy > PT + ih) return;
      g += '<line x1="' + PL + '" y1="' + gy + '" x2="' + (W - PR) + '" y2="' + gy + '" stroke="#ECEAE4" stroke-width="1"/>';
      g += '<text x="' + (PL - 6) + '" y="' + (gy + 5) + '" font-size="15" fill="#7A8398" text-anchor="end">' + v + '</text>';
    });
    // 面积
    let area = '', line = '', dots = '', labels = '';
    const pts = [];
    points.forEach(function (p, i) { if (p.accuracy != null) pts.push([x(i), y(p.accuracy), p]); });
    if (pts.length >= 2) {
      area = 'M' + pts[0][0] + ',' + (PT + ih) + ' L' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L') + ' L' + pts[pts.length - 1][0] + ',' + (PT + ih) + ' Z';
      line = 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L');
    }
    pts.forEach(function (p) {
      dots += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="#B4945A" stroke="#fff" stroke-width="1.5"/>';
      if (p[2].accuracy != null) {
        dots += '<text x="' + p[0] + '" y="' + (p[1] - 9) + '" font-size="14" fill="#3E4A63" text-anchor="middle" font-weight="700">' + p[2].accuracy + '</text>';
      }
    });
    points.forEach(function (p, i) {
      labels += '<text x="' + x(i) + '" y="' + (H - 11) + '" font-size="15" fill="#5A6478" text-anchor="middle">' + p.label + '</text>';
    });
    return '<svg class="u-w100 u-hauto u-block" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="\u6210\u7EE9\u8D70\u52BF\u56FE">'
      + '<defs><linearGradient id="aiArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B4945A" stop-opacity=".28"/><stop offset="100%" stop-color="#B4945A" stop-opacity=".02"/></linearGradient></defs>'
      + g
      + (area ? '<path d="' + area + '" fill="url(#aiArea)"/>' : '')
      + (line ? '<path d="' + line + '" fill="none" stroke="#B4945A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' : '')
      + dots + labels + '</svg>';
  }

  // 柱状图（各单元正确率）
  function renderBarSvg(units, width) {
    const list = (units || []).slice(0, 8);
    if (!list.length) return '<div class="u-p24 u-tc u-c-mute u-fs13">\u8FD8\u6CA1\u6709\u5355\u5143\u7EC3\u4E60\u8BB0\u5F55</div>';
    const W = width || 640, H = 220, PL = 8, PR = 8, PT = 22, PB = 58;
    const iw = W - PL - PR, ih = H - PT - PB;
    const bw = Math.min(46, iw / list.length * 0.62);
    const gap = (iw - bw * list.length) / (list.length + 1);
    let rects = '', labels = '';
    list.forEach(function (u, i) {
      const v = Math.max(0, Math.min(100, u.accuracy || 0));
      const h = v / 100 * ih;
      const cx = PL + gap + i * (bw + gap);
      const color = v >= 80 ? '#B4945A' : v >= 60 ? '#3E4A63' : '#cf1322';
      rects += '<rect x="' + cx + '" y="' + (PT + ih - h) + '" width="' + bw + '" height="' + Math.max(h, 2) + '" rx="5" fill="' + color + '" opacity=".92"/>';
      rects += '<text x="' + (cx + bw / 2) + '" y="' + (PT + ih - h - 7) + '" font-size="15" fill="' + color + '" text-anchor="middle" font-weight="700">' + v + '%</text>';
      // 学科色点
      const sc = SUBJ_COLOR[subjectOf(u.unit)] || '#3E4A63';
      rects += '<circle cx="' + (cx + bw / 2) + '" y="' + (H - 40) + '" r="3" fill="' + sc + '"/>';
      // 单元名（截断换行）
      const name = String(u.unit || '').length > 7 ? String(u.unit).slice(0, 7) + '\u2026' : (u.unit || '');
      labels += '<text transform="rotate(-30 ' + (cx + bw / 2) + ' ' + (H - 18) + ')" x="' + (cx + bw / 2) + '" y="' + (H - 18) + '" font-size="15" fill="#5A6478" text-anchor="middle">' + esc(name) + '</text>';
    });
    return '<svg class="u-w100 u-hauto u-block" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="\u5355\u5143\u6B63\u786E\u7387\u56FE">'
      + '<line x1="' + PL + '" y1="' + (PT + ih) + '" x2="' + (W - PR) + '" y2="' + (PT + ih) + '" stroke="#ECEAE4" stroke-width="1"/>'
      + rects + labels + '</svg>';
  }

  // ============ 报告导出 / 分享 ============
  // 云模式无逐次历史时，用 cloudStats 聚合生成报告
  function cloudAttribution(cloudStats) {
    const weak = (cloudStats && cloudStats.weak) || [];
    return weak.map(function (w) {
      return {
        unit: w.unit,
        subject: subjectOf(w.unit),
        count: Math.max(1, Math.round(w.count * (100 - (w.accuracy || 0)) / 10)),
        topType: '',
        acc: w.accuracy,
        suggestion: w.accuracy < 60
          ? '\u5148\u91CD\u770B\u77E5\u8BC6\u8BB2\u89E3\uFF0C\u518D\u5B8C\u6210 3 \u6B21\u4E13\u9879\u7EC3\u4E60\u3002'
          : '\u5B8C\u6210 2 \u6B21\u4E13\u9879\u7EC3\u4E60\u5E76\u91CD\u505A\u9519\u9898\u3002'
      };
    });
  }

  function cloudRisks(cloudStats) {
    const out = [];
    const weak = (cloudStats && cloudStats.weak) || [];
    if (weak.length && weak[0].accuracy < 60) {
      out.push({ level: 'high', title: '\u8584\u5F31\u5355\u5143\u5F85\u7A81\u7834', desc: '\u300C' + esc(weak[0].unit) + '\u300D\u5E73\u5747\u6B63\u786E\u7387\u4EC5 ' + weak[0].accuracy + '%\uFF0C\u5EFA\u8BAE\u8FD1\u671F\u91CD\u70B9\u653B\u5173\u3002' });
    }
    if (cloudStats && cloudStats.total && cloudStats.avg < 70) {
      out.push({ level: 'mid', title: '\u603B\u4F53\u6B63\u786E\u7387\u504F\u4F4E', desc: '\u5168\u90E8\u7EC3\u4E60\u5E73\u5747\u6B63\u786E\u7387 ' + cloudStats.avg + '%\uFF0C\u9700\u6301\u7EED\u5DE9\u56FA\u57FA\u7840\u3002' });
    }
    if (!out.length) {
      out.push({ level: 'good', title: '\u5F53\u524D\u65E0\u660E\u663E\u98CE\u9669', desc: '\u5404\u5355\u5143\u6574\u4F53\u8868\u73B0\u7A33\u5B9A\uFF0C\u7EE7\u7EED\u4FDD\u6301\u5F53\u524D\u8282\u594F\u3002' });
    }
    return out;
  }

  function buildReport(dataset, mode, periodLabel, cloudStats) {
    const isCloud = mode === 'cloud' || !dataset.length;
    const period = periodLabel || '\u5168\u90E8\u5386\u53F2';
    const series = bucketize(dataset, 'term');
    const sl = slopeOf(series);
    const attr = isCloud ? cloudAttribution(cloudStats) : attribute(dataset);
    const riskList = isCloud ? cloudRisks(cloudStats) : risks(dataset);
    const plan = planOf(dataset, attr, riskList);
    const total = isCloud ? (cloudStats ? cloudStats.total : 0) : dataset.length;
    const avg = isCloud ? (cloudStats ? cloudStats.avg : 0) : (dataset.length ? Math.round(dataset.reduce(function (s, r) { return s + r.accuracy; }, 0) / dataset.length) : 0);
    let bySubj = {};
    SUBJ_ORDER.forEach(function (s) { bySubj[s] = { c: 0, t: 0 }; });
    if (isCloud && cloudStats && Array.isArray(cloudStats.units)) {
      cloudStats.units.forEach(function (u) {
        const s = subjectOf(u.unit);
        bySubj[s].t += Math.max(1, u.count * 10);
        bySubj[s].c += Math.round(Math.max(1, u.count * 10) * (u.accuracy || 0) / 100);
      });
    } else {
      dataset.forEach(function (r) { bySubj[r.subject].c += r.correct; bySubj[r.subject].t += r.total; });
    }
    const slText = isCloud ? '' : '\uFF0C\u8D8B\u52BF\uFF1A<b>' + esc(sl.slopeText) + '</b>';

    let h = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>\u5B66\u4E60\u5206\u6790\u62A5\u544A</title></head><body class="u-ff u-c-ink u-xw720 u-m0a u-p24 u-bg-paper u-lh17">';
    h += '<div class="u-tc u-p28-0-10 u-bb-double"><div class="u-fs22 u-fw800 u-ls4">\u5B66\u4E60\u5206\u6790\u62A5\u544A</div><div class="u-fs12 u-c-mute u-mt6">\u751F\u6210\u65F6\u95F4\uFF1A' + new Date().toLocaleString('zh-CN') + ' \u00B7 \u7EDF\u8BA1\u8303\u56F4\uFF1A' + period + ' \u00B7 \u5171 ' + total + ' \u6B21\u7EC3\u4E60</div></div>';

    h += '<h3 class="u-bl-gold4 u-pl10 u-m22-0-10">\u4E00\u3001\u5B66\u79D1\u6210\u7EE9\u6982\u89C8</h3>';
    h += '<table class="u-w100 u-collapse u-fs13"><tr class="u-bg-ink u-c-white"><th class="u-p8">\u5B66\u79D1</th><th>\u7EC3\u4E60\u9898\u91CF</th><th>\u5E73\u5747\u6B63\u786E\u7387</th></tr>';
    SUBJ_ORDER.forEach(function (s) {
      if (!bySubj[s].t) return;
      h += '<tr class="u-bdb-mist"><td class="u-p8 u-tc">' + s + '</td><td class="u-tc">\u7EA6 ' + bySubj[s].t + ' \u9898</td><td class="u-tc u-fw700">' + Math.round(bySubj[s].c / bySubj[s].t * 100) + '%</td></tr>';
    });
    h += '</table><p class="u-fs13 u-c-slate">\u603B\u4F53\u5E73\u5747\u6B63\u786E\u7387\uFF1A<b>' + avg + '%</b>' + slText + '\u3002</p>';

    h += '<h3 class="u-bl-gold4 u-pl10 u-m22-0-10">\u4E8C\u3001\u8584\u5F31\u77E5\u8BC6\u70B9\u5F52\u56E0</h3>';
    if (!attr.length) h += '<p class="u-fs13 u-c-mute">\u6682\u65E0\u9519\u9898\u8BB0\u5F55\uFF0C\u7EE7\u7EED\u4FDD\u6301\u3002</p>';
    attr.forEach(function (a, i) {
      h += '<p class="u-fs13 u-m6-0"><b>' + (i + 1) + '. ' + esc(a.unit) + '</b>\uFF08' + esc(a.subject) + '\uFF0C\u9519\u9898 ' + a.count + ' \u9898' + (a.acc != null ? '\uFF0C\u5355\u5143\u6B63\u786E\u7387 ' + a.acc + '%' : '') + '\uFF09<br><span class="u-c-slate">\u5EFA\u8BAE\uFF1A' + esc(a.suggestion) + '</span></p>';
    });

    h += '<h3 class="u-bl-gold4 u-pl10 u-m22-0-10">\u4E09\u3001\u98CE\u9669\u63D0\u793A</h3>';
    riskList.forEach(function (r) {
      const lvl = riskLvl(r.level);
      h += '<p class="u-fs13 u-m6-0"><b class="rk-t-' + lvl + '">\u25CF ' + esc(r.title) + '</b>\uFF1A' + esc(r.desc) + '</p>';
    });

    h += '<h3 class="u-bl-gold4 u-pl10 u-m22-0-10">\u56DB\u3001\u4E2A\u6027\u5316\u63D0\u5347\u65B9\u6848</h3>';
    h += '<p class="u-fs13"><b>\u672C\u5468\u76EE\u6807\uFF1A</b></p><ul class="u-fs13">' + plan.weekly.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    h += '<p class="u-fs13"><b>\u6BCF\u65E5\u5B89\u6392\uFF1A</b></p><ul class="u-fs13">' + plan.daily.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';

    h += '<div class="u-mt26 u-pt12 u-bdt-mist u-fs11 u-c-mute u-tc">\u672C\u62A5\u544A\u7531\u5B66\u4E60\u7AD9\u81EA\u52A8\u751F\u6210\uFF0C\u4EC5\u4F9B\u5BB6\u957F\u4E0E\u8001\u5E08\u53C2\u8003\u3002</div>';
    h += '</body></html>';
    return h;
  }

  function shareTextOf(dataset, periodLabel, cloudStats) {
    const isCloud = !dataset.length;
    const sl = slopeOf(bucketize(dataset, 'term'));
    const attr = isCloud ? cloudAttribution(cloudStats) : attribute(dataset);
    const riskList = isCloud ? cloudRisks(cloudStats) : risks(dataset);
    const lines = ['\u3010\u5B66\u4E60\u5206\u6790\u62A5\u544A\u3011' + (periodLabel ? '\uFF08' + periodLabel + '\uFF09' : '')];
    lines.push('\u7EC3\u4E60 ' + (isCloud ? (cloudStats ? cloudStats.total : 0) : dataset.length) + ' \u6B21\uFF0C' + (isCloud ? '\u5E73\u5747\u6B63\u786E\u7387 ' + (cloudStats ? cloudStats.avg : 0) + '%' : '\u8D8B\u52BF\uFF1A' + sl.slopeText.replace(/[↗↘→]/g, '')) + '\u3002');
    if (attr.length) lines.push('\u8584\u5F31\u70B9\uFF1A' + attr.slice(0, 3).map(function (a) { return a.unit; }).join('\u3001') + '\u3002');
    riskList.slice(0, 2).forEach(function (r) { lines.push('\u98CE\u9669\u63D0\u793A\uFF1A' + r.title + '\u3002'); });
    return lines.join('\n');
  }

  // ============ 分析版块 HTML（家长页嵌入） ============
  // opts: { dataset, mode: 'local'|'cloud', cloudStats, period: 'week'|'month'|'term' }
  function renderBlock(opts) {
    const dataset = opts.dataset || [];
    const mode = opts.mode || 'local';
    const period = opts.period || 'term';
    const cloudStats = opts.cloudStats || null;
    const containerId = 'aiBlock_' + Math.random().toString(36).slice(2, 7);

    // 云模式使用 units 聚合做柱状图数据（无逐次历史）
    const cloudUnits = cloudStats && Array.isArray(cloudStats.units) ? cloudStats.units : null;

    function innerHtml(p) {
      const series = bucketize(dataset, p);
      const sl = slopeOf(series);
      const isCloudMode = mode === 'cloud';
      const attr = isCloudMode ? cloudAttribution(cloudStats) : attribute(dataset);
      const riskList = isCloudMode ? cloudRisks(cloudStats) : risks(dataset);
      const plan = planOf(dataset, attr, riskList);
      const subjSummary = {};
      SUBJ_ORDER.forEach(function (s) { subjSummary[s] = { c: 0, t: 0 }; });
      dataset.forEach(function (r) { subjSummary[r.subject].c += r.correct; subjSummary[r.subject].t += r.total; });
      const hasSubj = SUBJ_ORDER.filter(function (s) { return subjSummary[s].t > 0; });
      const avg = dataset.length ? Math.round(dataset.reduce(function (s, r) { return s + r.accuracy; }, 0) / dataset.length) : 0;

      let h = '';
      // 标题 + 时间筛选 + 导出/分享
      h += '<div class="u-flex u-ac u-between u-wrap u-g8 u-m14-0-10">';
      h += '<div class="u-flex u-ac u-g6"><span class="u-inlblk u-w4 u-h18 u-bg-gold u-r2"></span><span class="u-fs16 u-fw800 u-ls1">AI \u5B66\u4E60\u5206\u6790</span></div>';
      h += '<div class="u-flex u-g6 u-wrap">';
      if (mode === 'local' && dataset.length) {
        [['week', '\u8FD1\u5468'], ['month', '\u8FD1\u6708'], ['term', '\u8FD1\u5B66\u671F']].forEach(function (x) {
          h += '<button class="sl-opt' + (p === x[0] ? ' on' : '') + '" onclick="AI_ANALYSIS.setPeriod(\'' + containerId + '\',\'' + x[0] + '\')" data-p="' + x[0] + '">' + x[1] + '</button>';
        });
      }
      h += '<button class="u-p6-12 u-r16 u-bd-soft u-bg-w u-c-slate u-fs12 u-fw600 u-cp" onclick="AI_ANALYSIS.exportReport(\'' + containerId + '\')">\u5BFC\u51FA\u62A5\u544A</button>';
      h += '<button class="u-p6-12 u-r16 u-bd-soft u-bg-w u-c-slate u-fs12 u-fw600 u-cp" onclick="AI_ANALYSIS.shareReport(\'' + containerId + '\')">\u5206\u4EAB\u7ED9\u8001\u5E08</button>';
      h += '</div></div>';

      // 空态
      if (!dataset.length && !cloudUnits) {
        return h + '<div class="u-p28-16 u-tc u-c-mute u-fs13 u-lh18">\u5C1A\u65E0\u8DB3\u591F\u7684\u5B66\u4E60\u6570\u636E\u3002<br>\u5B69\u5B50\u5B8C\u6210\u51E0\u6B21\u7EC3\u4E60\u540E\uFF0C\u8FD9\u91CC\u4F1A\u81EA\u52A8\u751F\u6210\u8D8B\u52BF\u3001\u5F52\u56E0\u4E0E\u98CE\u9669\u5206\u6790\u3002</div>';
      }

      // 1. 成绩走势卡片
      h += '<div class="card u-mb12"><div class="section-title">\u6210\u7EE9\u8D70\u52BF</div>';
      if (mode === 'local') {
        h += renderLineSvg(series, 640);
        const subjChips = hasSubj.map(function (s) {
          return '<span class="u-iflex u-ac u-g5 u-fs11 u-c-slate"><span class="sdot sdot8 ' + subjCls(s) + '"></span>' + s + ' ' + Math.round(subjSummary[s].c / subjSummary[s].t * 100) + '%</span>';
        }).join('&nbsp;&nbsp;');
        h += '<div class="u-mt8 u-flex u-between u-wrap u-g6 u-fs12">';
        h += '<span class="u-c-slate">' + subjChips + '</span>';
        h += '<span class="u-fw700 trend-' + sl.dir + '">' + sl.slopeText + '</span></div>';
      } else if (cloudUnits) {
        // 远程模式：单元正确率柱状图 + 题量趋势说明
        h += renderBarSvg(cloudUnits, 640);
        if (opts.cloudStats && Array.isArray(opts.cloudStats.trend) && opts.cloudStats.trend.length) {
          const t = opts.cloudStats.trend;
          const last = t[t.length - 1];
          h += '<div class="u-mt8 u-fs12 u-c-slate">\u5171\u8BB0\u5F55 ' + opts.cloudStats.trend.length + ' \u4E2A\u7EC3\u4E60\u65E5\uFF0C\u6700\u8FD1\u7EC3\u4E60\u65E5 ' + esc(last.date) + '\uFF08' + last.count + ' \u9898\uFF09\u3002\u67F1\u5B50\u4E3A\u5404\u5355\u5143\u5E73\u5747\u6B63\u786E\u7387\uFF0C\u7EA2\u8272\u4E3A\u9700\u91CD\u70B9\u5173\u6CE8\u5355\u5143\u3002</div>';
        }
      }
      h += '</div>';

      // 2. 错题归因卡片
      h += '<div class="card u-mb12"><div class="section-title">\u9519\u9898\u5F52\u56E0\u4E0E\u5EFA\u8BAE</div>';
      if (!attr.length) {
        h += '<div class="pp-dim">\u6682\u65E0\u9519\u9898\u8BB0\u5F55\uFF0C\u8868\u73B0\u4E0D\u9519\u3002</div>';
      } else {
        attr.forEach(function (a, i) {
          const barW = Math.min(100, Math.round(a.count / attr[0].count * 100));
          h += '<div class="u-mb12">';
          h += '<div class="u-flex u-ac u-g6 u-fs13 u-fw700 u-c-ink">';
          h += '<span class="sdot sdot6 ' + subjCls(a.subject) + '"></span>';
          h += esc(a.unit) + ' <span class="u-fw400 u-c-mute u-fs11">' + esc(a.subject) + ' \u00B7 \u9519\u9898 ' + a.count + ' \u9898' + (a.acc != null ? ' \u00B7 \u6B63\u786E\u7387 ' + a.acc + '%' : '') + '</span></div>';
          h += '<div class="u-h6 u-bg-border u-r3 u-m5-0 u-ovh"><div class="u-h100 u-r3 ' + subjCls(a.subject) + ' ' + wpCls(barW) + '"></div></div>';
          h += '<div class="u-fs12 u-c-slate u-lh16">\u4E3B\u8981\u5931\u5206\u9898\u578B\uFF1A' + esc(a.topType) + '\u3002\u5EFA\u8BAE\uFF1A' + esc(a.suggestion) + '</div>';
          h += '</div>';
        });
      }
      h += '</div>';

      // 3. 风险预测卡片
      h += '<div class="card u-mb12"><div class="section-title">\u98CE\u9669\u9884\u6D4B</div>';
      riskList.forEach(function (r) {
        const lvl = riskLvl(r.level);
        const tag = r.level === 'high' ? '\u9AD8\u98CE\u9669' : r.level === 'mid' ? '\u4E2D\u98CE\u9669' : r.level === 'good' ? '\u72B6\u6001\u826F\u597D' : '\u63D0\u793A';
        h += '<div class="rk-card rk-card-' + lvl + ' u-mb8">';
        h += '<span class="rk-tag rk-tag-' + lvl + '">' + tag + '</span>';
        h += '<div class="u-fs125 u-c-ink u-lh165"><b>' + esc(r.title) + '</b><br><span class="u-c-slate">' + esc(r.desc) + '</span></div></div>';
      });
      h += '</div>';

      // 4. 提升方案卡片
      h += '<div class="card u-mb12 u-bg-cream u-bd-sand"><div class="section-title u-c-gold2">\u4E2A\u6027\u5316\u63D0\u5347\u65B9\u6848</div>';
      h += '<div class="u-fs125 u-c-ink u-lh18">';
      h += '<div class="u-mb8 u-fw700 u-c-gold2">\u672C\u5468\u76EE\u6807</div>';
      plan.weekly.forEach(function (x) { h += '<div>\u00B7 ' + esc(x) + '</div>'; });
      h += '<div class="u-m10-0-8 u-fw700 u-c-gold2">\u6BCF\u65E5\u5B89\u6392</div>';
      plan.daily.forEach(function (x) { h += '<div>\u00B7 ' + esc(x) + '</div>'; });
      h += '</div></div>';

      h += '<div class="u-fs11 u-c-slate3 u-tc u-m10-0-4">\u5206\u6790\u57FA\u4E8E\u5B69\u5B50\u5B9E\u9645\u7EC3\u4E60\u6570\u636E\u81EA\u52A8\u751F\u6210\uFF0C\u4EC5\u4F9B\u53C2\u8003</div>';
      return h;
    }

    return {
      id: containerId,
      mode: mode,
      period: period,
      html: function (p) { return innerHtml(p || period); },
      dataset: dataset,
      cloudStats: cloudStats
    };
  }

  // ============ 导出与分享（按钮回调） ============
  function downloadReport(containerId) {
    const el = document.getElementById(containerId);
    if (!el || !el._aiData) return;
    const d = el._aiData;
    const label = d.period === 'week' ? '\u8FD1\u5468' : d.period === 'month' ? '\u8FD1\u6708' : d.period === 'term' ? '\u8FD1\u5B66\u671F' : '\u5168\u90E8';
    const html = buildReport(d.dataset, d.mode, label, d.cloudStats);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    const p = function (n) { return (n < 10 ? '0' : '') + n; };
    const dd = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = '\u5B66\u4E60\u5206\u6790\u62A5\u544A_' + dd.getFullYear() + p(dd.getMonth() + 1) + p(dd.getDate()) + '.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
  }

  function shareReport(containerId) {
    const el = document.getElementById(containerId);
    if (!el || !el._aiData) return;
    const d = el._aiData;
    const label = d.period === 'week' ? '\u8FD1\u5468' : d.period === 'month' ? '\u8FD1\u6708' : d.period === 'term' ? '\u8FD1\u5B66\u671F' : '\u5168\u90E8';
    const text = shareTextOf(d.dataset, label, d.cloudStats);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        alert('\u62A5\u544A\u6458\u8981\u5DF2\u590D\u5236\uFF0C\u53EF\u76F4\u63A5\u7C98\u8D34\u7ED9\u8001\u5E08\u3002\n\n' + text);
      }).catch(function () { alert(text); });
    } else {
      alert(text);
    }
  }

  // ============ 暴露接口 ============
  window.AI_ANALYSIS = {
    normalize: normalize,
    bucketize: bucketize,
    slopeOf: slopeOf,
    attribute: attribute,
    risks: risks,
    planOf: planOf,
    subjectOf: subjectOf,
    renderLineSvg: renderLineSvg,
    renderBarSvg: renderBarSvg,
    buildReport: buildReport,
    shareTextOf: shareTextOf,
    renderBlock: renderBlock,
    // 渲染到指定容器
    mount: function (container, opts) {
      const b = renderBlock(opts);
      container.innerHTML = '<div id="' + b.id + '">' + b.html() + '</div>';
      document.getElementById(b.id)._aiData = { dataset: b.dataset, mode: b.mode, period: b.period, cloudStats: b.cloudStats };
    },
    setPeriod: function (containerId, p) {
      const el = document.getElementById(containerId);
      if (!el || !el._aiData) return;
      el._aiData.period = p;
      const b = renderBlock({ dataset: el._aiData.dataset, mode: el._aiData.mode, cloudStats: el._aiData.cloudStats, period: p });
      el.innerHTML = b.html(p);
    },
    exportReport: downloadReport,
    shareReport: shareReport
  };
})();
