// ============================================================
// v83 · 初中「周末运行机制」引擎（大纲 v3 的落地实现）
// ------------------------------------------------------------
// 对应大纲：§2.1 测评类型（WD/RT）、§2.7 周末节奏、§2.8 进度对齐、
//           §2.9 家长反馈（周报 + 错题本 1/3/7/15 天间隔重现）
// 纯逻辑层：不碰 DOM，浏览器与 node vm 均可加载，便于离线自检。
//
// 数据落点：
//   进度   localStorage['jr_progress_v1']   { 学科key: {grade, term, idx, updated, auto} }
//   其余   复用 localStorage['math_practice_data'] 的 wrong / history
//          错题条目上追加 jrNext / jrStage / jrOk / jrKey / jrHard 字段
//
// 单元来源（统一入口 unitsOf）：
//   math    → KNOWLEDGE_BASE[grade][1|2]     （单元取题走 u.gen()）
//   chinese → window.CN.data[grade]          （u.pool()）
//   english → window.PEP.books[grade].units  （PEPQ.buildQuestions）
//   其余    → window.JR_SUBJ[subject][grade] （u.pool()）
// ============================================================
(function (root) {
  'use strict';

  var DAY = 86400000;
  var PKEY = 'jr_progress_v1';
  var DKEY = 'math_practice_data';
  var GAP = [1, 3, 7, 15];          // 错题重现间隔（天）
  var WEEK_BUDGET = 90;             // 每周总时长硬上限（分钟）

  // 学科注册表：k=内部键，n=展示名（也是错题本 module 名），
  // layer=分层（A 深度补 / B 常规补 / C 轻量补），bud=周末预算分钟，
  // wd=诊断测题量，rt=错题重练题量，ut=单元测试卷题量，big=期中/期末卷题量，
  // utMin / bigMin = 对应建议用时（分钟）
  var SUBJ = [
    { k: 'math', n: '数学', layer: 'A', bud: 30, wd: 12, rt: 8, ut: 18, big: 20, utMin: 45, bigMin: 60 },
    { k: 'english', n: '英语', layer: 'A', bud: 26, wd: 12, rt: 8, ut: 41, big: 41, utMin: 45, bigMin: 60 },
    { k: 'chinese', n: '语文', layer: 'B', bud: 18, wd: 12, rt: 8, ut: 22, big: 22, utMin: 60, bigMin: 75 },
    { k: 'physics', n: '物理', layer: 'B', bud: 18, wd: 13, rt: 8, ut: 23, big: 25, utMin: 45, bigMin: 60 },
    { k: 'chemistry', n: '化学', layer: 'B', bud: 16, wd: 13, rt: 8, ut: 24, big: 27, utMin: 45, bigMin: 60 },
    { k: 'moral', n: '道德与法治', layer: 'C', bud: 8, wd: 8, rt: 6, ut: 18, big: 19, utMin: 45, bigMin: 60 },
    { k: 'history', n: '历史', layer: 'C', bud: 8, wd: 8, rt: 6, ut: 18, big: 19, utMin: 45, bigMin: 60 },
    { k: 'geography', n: '地理', layer: 'C', bud: 8, wd: 8, rt: 6, ut: 18, big: 19, utMin: 45, bigMin: 60 },
    { k: 'biology', n: '生物', layer: 'C', bud: 8, wd: 8, rt: 6, ut: 18, big: 19, utMin: 45, bigMin: 60 }
  ];
  // 核心科按优先级排列：数学/英语（A 层）→ 物理/化学（B 层理科）→ 语文（B 层，可隔周）
  var CORE = ['math', 'english', 'physics', 'chemistry', 'chinese'];
  var C_LAYER = ['moral', 'history', 'geography', 'biology'];
  var GN = { 7: '七年级', 8: '八年级', 9: '九年级' };

  function meta(k) {
    for (var i = 0; i < SUBJ.length; i++) if (SUBJ[i].k === k) return SUBJ[i];
    return { k: k, n: k, layer: 'C', bud: 8, wd: 8, rt: 6, ut: 18, big: 19, utMin: 45, bigMin: 60 };
  }
  function modName(k) { return meta(k).n; }

  /* ---------------- 存储（node 环境自动降级到内存） ---------------- */
  var MEM = {};
  function rd(k) {
    try { var v = root.localStorage.getItem(k); return v === null ? (MEM[k] || null) : v; }
    catch (e) { return MEM[k] || null; }
  }
  function wr(k, v) {
    MEM[k] = v;
    try { root.localStorage.setItem(k, v); } catch (e) {}
  }
  function data() { try { return JSON.parse(rd(DKEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveData(d) { wr(DKEY, JSON.stringify(d)); }

  /* ---------------- 小工具 ---------------- */
  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function kb() {
    if (typeof KNOWLEDGE_BASE !== 'undefined' && KNOWLEDGE_BASE) return KNOWLEDGE_BASE;
    return root.KNOWLEDGE_BASE || null;
  }
  // 自然周：周一为界
  function weekRange(offset) {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var wd = (d.getDay() + 6) % 7;                     // 周一=0
    var s = d.getTime() - wd * DAY + (offset || 0) * 7 * DAY;
    return { start: s, end: s + 7 * DAY };
  }
  function weekNo() {
    var d = new Date();
    var onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - onejan) / DAY) + onejan.getDay() + 1) / 7);
  }

  /* ---------------- 单元源 ---------------- */
  function hasUnits(k, grade) { return unitsOf(k, grade).length > 0; }

  function unitsOf(k, grade, term) {
    var list = [];
    if (k === 'math') {
      var G = kb() ? kb()[grade] : null;
      if (G) {
        var a = (G[1] || []).concat(G[2] || []);
        list = a.slice();
      }
    } else if (k === 'chinese') {
      var C = (root.CN && root.CN.data) ? root.CN.data[grade] : null;
      if (Array.isArray(C)) list = C.slice();
    } else if (k === 'english') {
      var bs = (root.PEP && root.PEP.books) ? root.PEP.books : [];
      bs.forEach(function (b) {
        if (b.grade !== grade) return;
        (b.units || []).forEach(function (u) {
          list.push({
            id: u.id, name: u.title, zh: u.zh || '',
            term: b.sem === 1 ? '上' : '下',
            _bid: b.id, _uid: u.id,
            summary: [u.zh || '', u.grammar || ''].filter(function (x) { return x; })
          });
        });
      });
    } else {
      var S = (root.JR_SUBJ && root.JR_SUBJ[k]) ? root.JR_SUBJ[k][grade] : null;
      if (Array.isArray(S)) list = S.slice();
    }
    if (term) {
      var f = list.filter(function (u) { return u.term === term; });
      if (f.length) list = f;
    }
    return list;
  }

  /** 从单元取 n 道题（数学走 gen 反复抽样去重，其余走 pool，英语走 PEPQ） */
  function unitQs(k, u, n) {
    var out = [];
    if (!u) return out;
    if (k === 'english') {
      if (root.PEPQ && typeof root.PEPQ.buildQuestions === 'function' && u._bid) {
        try { out = root.PEPQ.buildQuestions(u._bid, u._uid, 2, n) || []; } catch (e) { out = []; }
      }
      return out;
    }
    var seen = {};
    function push(q) {
      if (!q || !q.question) return;
      var key = String(q.question) + '|' + String(q.answer);
      if (seen[key]) return;
      seen[key] = 1; out.push(q);
    }
    if (typeof u.pool === 'function') {
      try { var r = u.pool(); if (Array.isArray(r)) r.forEach(push); } catch (e) {}
    }
    if (out.length < n && typeof u.gen === 'function') {
      var guard = 0;
      while (out.length < n && guard++ < 800) {
        try {
          var g = u.gen();
          if (Array.isArray(g)) { g.forEach(push); }        // 池模式：gen 返回题数组
          else if (g) { push(g); }
        } catch (e) { break; }
      }
    }
    return out;
  }

  /* ---------------- 进度对齐（§2.8） ---------------- */
  function progAll() { try { return JSON.parse(rd(PKEY) || '{}') || {}; } catch (e) { return {}; } }
  function progOf(k) { return progAll()[k] || null; }
  function setProg(k, grade, term, idx) {
    var a = progAll();
    a[k] = { grade: grade, term: term, idx: idx, updated: Date.now(), auto: false };
    wr(PKEY, JSON.stringify(a));
    return a[k];
  }
  function clearProg(k) {
    var a = progAll();
    delete a[k];
    wr(PKEY, JSON.stringify(a));
  }
  /** 已学单元：上册前 idx 个，或 上册全部 + 下册前 idx 个 */
  function learnedUnits(k, grade) {
    var p = progOf(k);
    if (!p || !p.idx) return [];
    var all = unitsOf(k, p.grade || grade);
    var up = all.filter(function (u) { return u.term === '上'; });
    var lo = all.filter(function (u) { return u.term === '下'; });
    if (p.term === '上') return up.slice(0, p.idx);
    return up.concat(lo.slice(0, p.idx));
  }
  /**
   * 未设进度的学科给出推算值：上周进度 + 1 单元。
   * 只在进度存在但距今 > 10 天时给出建议，首次使用不臆断。
   */
  function progSuggest(k, grade) {
    var p = progOf(k);
    if (!p) return null;
    if (Date.now() - (p.updated || 0) < 10 * DAY) return null;
    var all = unitsOf(k, p.grade || grade, p.term);
    var nx = Math.min((p.idx || 0) + 1, all.length);
    if (nx === p.idx) return null;
    return { idx: nx, unitName: (all[nx - 1] && all[nx - 1].name) || '' };
  }

  /* ---------------- WD 周末诊断测（§2.1） ---------------- */
  function buildWD(k, grade) {
    var us = learnedUnits(k, grade);
    if (!us.length) return { questions: [], units: [], empty: 'noprog' };
    var n = meta(k).wd;
    var recent = us.slice(-3);                       // 最近学过的 3 个单元
    var per = Math.max(2, Math.ceil(n / recent.length));
    var qs = [];
    recent.forEach(function (u) {
      var got = unitQs(k, u, per + 3);
      shuffle(got).slice(0, per).forEach(function (q) {
        q._unit = u.name;
        qs.push(q);
      });
    });
    return { questions: shuffle(qs).slice(0, n), units: recent.map(function (u) { return u.name; }) };
  }

  /* ---------------- 难度反推（§2.3 · 不改题库） ----------------
   * 启发式：题型 + 题面长度 + 是否含图 / 含分数 / 多步运算。
   * L1 基础（识记 / 极短判断 / 纯算）、L2 提高（基础应用 / 短情境）、
   * L3 拓展（综合 / 含图 / 多步 / 长题干）。
   * 返回 1/2/3，clamp 到 [1,3]。同一题面同一难度（稳定）。
   * 题库未标 diff 时，buildExam 的 7:2:1 / 6:3:1 目标在 pool 不足某档时会自动从其他档补，
   * 实际比例由 buildExam 返回的 diffDist 字段给出，PC/手机端可见。
   */
  function inferDiff(q) {
    if (!q) return 2;
    if (q._diff) return q._diff;
    var t = q.type, d = 2;
    if (t === 'judge') d = 1;
    else if (t === 'fill') d = 2;
    else if (t === 'shape_choice') d = 3;
    else if (t === 'choice') d = (q.options && q.options.length === 2) ? 1 : 2;
    var stem = String(q.question || '');
    var len = stem.replace(/<[^>]*>/g, '').length;
    if (len > 0 && len < 15) d = Math.max(1, d - 1);
    else if (len > 50) d = Math.min(3, d + 1);
    if (q.svg) d = Math.min(3, d + 1);
    if (stem.indexOf('class="frac"') >= 0) d = Math.min(3, d + 1);
    if (q.steps && q.steps.length >= 3) d = Math.min(3, d + 1);
    if (d < 1) d = 1; if (d > 3) d = 3;
    return d;
  }
  /**
   * 难度洗牌：按 ratio（默认 UT 7:2:1，MT/FT 6:3:1）从三档抽题；
   * pool 中某档不足时，**实际抽取量 = min(目标, 实际可用)**，保证比例尽量贴近目标。
   * pool 完全无某档时，从其他档补齐。
   */
  function pickByDiff(pool, n, ratio) {
    var by = [[], [], []];
    pool.forEach(function (q) {
      var d = inferDiff(q) - 1;
      if (d < 0) d = 0; if (d > 2) d = 2;
      by[d].push(q);
    });
    // 实际比例（容忍 pool 偏斜）
    var total = pool.length || 1;
    var real = [by[0].length / total, by[1].length / total, by[2].length / total];
    var eff = ratio.map(function (r, i) { return Math.min(r, real[i]); });
    var sum = eff[0] + eff[1] + eff[2];
    if (sum > 0) eff = eff.map(function (x) { return x / sum; });

    [0, 1, 2].forEach(function (i) { shuffle(by[i]); });
    var out = [], remain = n, used = {};
    for (var i = 0; i < 3; i++) {
      var want = Math.round(n * eff[i]);
      if (i === 2) want = remain;                          // 最后一档兜底
      var batch = 0;
      by[i].forEach(function (q) {
        var k = String(q.question) + '|' + String(q.answer);
        if (batch < want && !used[k]) {
          out.push(q); used[k] = 1; batch++;
        }
      });
      remain = n - out.length;
    }
    if (out.length < n) {
      var rest = [];
      for (var i = 0; i < 3; i++) {
        by[i].forEach(function (q) {
          var k = String(q.question) + '|' + String(q.answer);
          if (!used[k]) { rest.push(q); used[k] = 1; }
        });
      }
      out = out.concat(shuffle(rest).slice(0, n - out.length));
    }
    return out.slice(0, n);
  }

  /* ---------------- UT / MT / FT 大卷（§2.1 / §2.2） ---------------- */
  var EXAM_NAME = { UT: '单元测试卷', MT: '期中复习卷', FT: '期末复习卷' };
  var RATIO = { UT: [0.7, 0.2, 0.1], MT: [0.6, 0.3, 0.1], FT: [0.6, 0.3, 0.1] };
  /**
   * 组大卷。范围严格限制在已学单元内：
   *   UT 指定单元（默认最后一个已学单元），MT 当前册已学的前一半，FT 全部已学单元。
   * 难度按 7:2:1 / 6:3:1 抽题（用 inferDiff 现场打标，不改题库）。
   */
  function buildExam(k, grade, type, unitIdx) {
    var us = learnedUnits(k, grade);
    if (!us.length) return { questions: [], units: [], empty: 'noprog' };
    var m = meta(k), target = [], n, mins;
    if (type === 'UT') {
      var all = unitsOf(k, grade);
      var u = (unitIdx != null && all[unitIdx]) ? all[unitIdx] : us[us.length - 1];
      target = [u]; n = m.ut; mins = m.utMin;
    } else if (type === 'MT') {
      var lastTerm = us[us.length - 1].term;
      var byTerm = us.filter(function (x) { return x.term === lastTerm; });
      target = byTerm.slice(0, Math.max(1, Math.ceil(byTerm.length / 2)));
      n = m.big; mins = m.bigMin;
    } else {
      target = us.slice(); n = m.big; mins = m.bigMin;
    }
    // 跨单元均衡抽题（多取些以保证难度洗牌够用）
    var per = Math.max(3, Math.ceil(n / target.length));
    var pool = [], seen = {};
    target.forEach(function (u) {
      var got = unitQs(k, u, per + 4);
      shuffle(got).forEach(function (q) {
        var key = String(q.question) + '|' + String(q.answer);
        if (seen[key]) return;
        seen[key] = 1;
        q._unit = u.name;
        q._diff = inferDiff(q);
        pool.push(q);
      });
    });
    var qs = pickByDiff(pool, n, RATIO[type] || RATIO.FT);
    var diffDist = { 1: 0, 2: 0, 3: 0 };
    qs.forEach(function (q) { diffDist[inferDiff(q)]++; });
    return {
      questions: qs, units: target.map(function (u) { return u.name; }),
      n: qs.length, minutes: mins, type: type, typeName: EXAM_NAME[type] || '复习卷',
      diffDist: diffDist, ratio: RATIO[type] || RATIO.FT
    };
  }

  /* ---------------- 提示卡（§2.3 针对学习能力一般的孩子） ---------------- */
  /**
   * level 1 = 思路方向（不给答案）；level 2 = 关键步骤 / 万能公式。
   * 素材取自单元自带字段：summary / fidx（数学是 {t,f} 对象，其余是 CN.formulas 索引）/ method。
   */
  function hint(u, level) {
    if (!u) return '';
    if (level === 1) return (u.summary && u.summary[0]) ? u.summary[0] : '';
    if (level === 2) {
      if (u.fidx && u.fidx.length) {
        var f = u.fidx[0];
        if (f && typeof f === 'object' && f.f) return f.t + '：' + f.f;
        if (typeof f === 'number' && root.CN && root.CN.formulas && root.CN.formulas[f]) {
          var fm = root.CN.formulas[f];
          return fm.t + '：' + fm.f;
        }
      }
      if (u.method && u.method.length && u.method[0].s) return u.method[0].s;
      return (u.summary && u.summary[1]) ? u.summary[1] : '';
    }
    return '';
  }

  /* ---------------- RT 错题重练（§2.9） ---------------- */
  function dueWrong(k, now) {
    now = now || Date.now();
    var d = data(), w = d.wrong || [], m = modName(k);
    return w.filter(function (x) {
      if (x.module !== m) return false;
      if (x.grade !== undefined && x.grade !== null && x.grade < 7) return false;  // 不动小学错题
      return (x.jrNext || 0) <= now;
    });
  }
  function buildRT(k) {
    var due = dueWrong(k);
    var n = meta(k).rt;
    return {
      questions: shuffle(due).slice(0, n).map(function (x) {
        var q = x.question || {};
        q._wid = x.id;
        q._unit = x.unitName || '';
        return q;
      }),
      total: due.length
    };
  }
  /** 答错：入错题本（或累加），重置间隔为 1 天；错 ≥3 次升级重点攻坚 */
  function noteWrong(q, k, unitName, grade, ua) {
    var d = data(); d.wrong = d.wrong || [];
    var m = modName(k);
    var key = String(q.question) + '|' + String(q.answer);
    var ex = null;
    for (var i = 0; i < d.wrong.length; i++) {
      var w = d.wrong[i];
      if (w.module !== m) continue;
      if (w.jrKey === key || (w.question && w.question.question === q.question)) { ex = w; break; }
    }
    var now = Date.now();
    if (!ex) {
      ex = {
        id: 'jr' + now + '_' + Math.random().toString(36).slice(2, 7),
        module: m, question: q, userAnswer: ua,
        unitName: unitName || '', grade: grade,
        time: now, count: 0, jrKey: key, jrStage: 0, jrOk: 0
      };
      d.wrong.push(ex);
    }
    ex.count = (ex.count || 0) + 1;
    ex.jrOk = 0;
    ex.jrStage = 0;
    ex.jrNext = now + GAP[0] * DAY;
    ex.jrHard = (ex.count || 0) >= 3;
    ex.lastWrong = now;
    ex.userAnswer = ua;
    if (unitName) ex.unitName = unitName;
    saveData(d);
    return ex.id;
  }
  /** 答对：连续 2 次做对 → 移出错题本；否则按 1/3/7/15 天推进 */
  function noteRight(id) {
    if (!id) return;
    var d = data(), w = d.wrong || [], ex = null;
    for (var i = 0; i < w.length; i++) if (w[i].id === id) { ex = w[i]; break; }
    if (!ex) return;
    ex.jrOk = (ex.jrOk || 0) + 1;
    ex.jrStage = Math.min((ex.jrStage || 0) + 1, GAP.length - 1);
    if (ex.jrOk >= 2) d.wrong = w.filter(function (x) { return x.id !== id; });
    else ex.jrNext = Date.now() + GAP[ex.jrStage] * DAY;
    saveData(d);
  }
  /** 错题本概览：待复习 / 已到期 / 重点攻坚 */
  function wrongStats(k) {
    var d = data(), w = d.wrong || [], now = Date.now();
    var m = k ? modName(k) : null;
    var o = { total: 0, due: 0, hard: 0 };
    w.forEach(function (x) {
      if (m && x.module !== m) return;
      if (x.grade !== undefined && x.grade !== null && x.grade < 7) return;
      o.total++;
      if ((x.jrNext || 0) <= now) o.due++;
      if (x.jrHard) o.hard++;
    });
    return o;
  }

  /* ---------------- 本周计划与预算（§1.2 / §2.7） ---------------- */
  /** 本周应做学科：核心科优先 + C 层每周轮换 2 科，累计不突破 90 分钟 */
  function weekPlan(grade) {
    var wk = weekNo();
    var out = [], used = 0;
    // ① 核心科：按优先级依次加入，超出 90 分钟上限的整科跳过（不砍题量）
    CORE.forEach(function (k) {
      if (!hasUnits(k, grade)) return;
      var m = meta(k);
      if (used + m.bud > WEEK_BUDGET) return;
      out.push({ k: k, n: m.n, layer: m.layer, bud: m.bud, wd: m.wd, rt: m.rt });
      used += m.bud;
    });
    // ② C 层：用剩余预算，每周轮换 2 科
    var C = C_LAYER.filter(function (k) { return hasUnits(k, grade); });
    if (C.length) {
      var pick = [C[wk % C.length]];
      var b = C[(wk + 1) % C.length];
      if (b !== pick[0]) pick.push(b);
      pick.forEach(function (k) {
        var m = meta(k);
        if (used + m.bud > WEEK_BUDGET) return;
        out.push({ k: k, n: m.n, layer: m.layer, bud: m.bud, wd: m.wd, rt: m.rt });
        used += m.bud;
      });
    }
    return { items: out, budget: WEEK_BUDGET, used: used };
  }
  /** 本周已用分钟（按 history 的 duration 累加） */
  function weekMinutes() {
    var r = weekRange(0), h = data().history || [], ms = 0;
    h.forEach(function (x) {
      if (x.time >= r.start && x.time < r.end) ms += (x.duration || 0);
    });
    return Math.round(ms / 60000);
  }

  /* ---------------- 周报（§2.9） ---------------- */
  function agg(list) {
    var o = {};
    list.forEach(function (x) {
      var m = x.module || '其他';
      o[m] = o[m] || { module: m, q: 0, right: 0, ms: 0, times: 0 };
      o[m].q += (x.total || 0);
      o[m].right += (x.score || 0);
      o[m].ms += (x.duration || 0);
      o[m].times += 1;
    });
    Object.keys(o).forEach(function (m) {
      o[m].rate = o[m].q ? Math.round(o[m].right / o[m].q * 100) : 0;
      o[m].min = Math.round(o[m].ms / 60000);
    });
    return o;
  }
  /**
   * 周报（§2.9）。
   * srcH / srcW 可选：家长端可传入云端同步下来的 history / wrong，
   * 不传则读本地 math_practice_data。
   */
  function weekReport(srcH, srcW) {
    var d = data(), h = srcH || (d.history || []), w = srcW || (d.wrong || []);
    var cur = weekRange(0), prev = weekRange(-1);
    var cList = h.filter(function (x) { return x.time >= cur.start && x.time < cur.end; });
    var pList = h.filter(function (x) { return x.time >= prev.start && x.time < prev.end; });
    var c = agg(cList), p = agg(pList);

    // 未掌握清单：错题按单元聚合，按错误次数排序
    var byUnit = {};
    w.forEach(function (x) {
      if (x.grade !== undefined && x.grade !== null && x.grade < 7) return;
      var key = (x.module || '') + '·' + (x.unitName || '未分类');
      byUnit[key] = byUnit[key] || { module: x.module || '', unit: x.unitName || '未分类', n: 0, hard: 0 };
      byUnit[key].n++;
      if (x.jrHard) byUnit[key].hard++;
    });
    var weak = Object.keys(byUnit).map(function (k) { return byUnit[k]; })
      .sort(function (a, b) { return (b.hard - a.hard) || (b.n - a.n); })
      .slice(0, 5);

    // 与上周对比
    var cmp = { better: [], worse: [], stuck: [] };
    Object.keys(c).forEach(function (m) {
      var now = c[m].rate, was = p[m] ? p[m].rate : null;
      if (was === null) return;
      if (now - was >= 10) cmp.better.push({ module: m, from: was, to: now });
      else if (was - now >= 10) cmp.worse.push({ module: m, from: was, to: now });
    });
    Object.keys(p).forEach(function (m) {
      if (!c[m] && p[m].rate < 60) cmp.stuck.push({ module: m, from: p[m].rate });
    });

    // 异常预警：连续 2 周 < 50%
    var alert = [];
    Object.keys(c).forEach(function (m) {
      if (c[m].rate < 50 && p[m] && p[m].rate < 50) alert.push({ lv: 'red', text: m + ' 连续两周正确率低于 50%（本周 ' + c[m].rate + '%，上周 ' + p[m].rate + '%）' });
    });
    weak.forEach(function (x) {
      if (x.hard >= 3) alert.push({ lv: 'orange', text: x.module + '·' + x.unit + ' 已连续 3 次以上出错，建议专题突破' });
    });

    var totalQ = 0, totalR = 0, totalMs = 0;
    cList.forEach(function (x) { totalQ += (x.total || 0); totalR += (x.score || 0); totalMs += (x.duration || 0); });

    return {
      range: { start: cur.start, end: cur.end },
      total: { q: totalQ, right: totalR, rate: totalQ ? Math.round(totalR / totalQ * 100) : 0, min: Math.round(totalMs / 60000), times: cList.length },
      byModule: c, prevByModule: p,
      weak: weak, cmp: cmp, alert: alert,
      budget: { used: Math.round(totalMs / 60000), cap: WEEK_BUDGET }
    };
  }

  /* ---------------- 历史写入 ---------------- */
  function addHistory(k, grade, unitName, right, total, ms) {
    var d = data(); d.history = d.history || [];
    d.history.push({
      module: modName(k), unitName: unitName || '', grade: grade,
      score: right, total: total, time: Date.now(), duration: ms || 0
    });
    if (d.history.length > 600) d.history = d.history.slice(-600);
    saveData(d);
  }

  root.JRF = {
    SUBJ: SUBJ, GN: GN, GAP: GAP, WEEK_BUDGET: WEEK_BUDGET,
    meta: meta, modName: modName,
    unitsOf: unitsOf, hasUnits: hasUnits, unitQs: unitQs,
    progAll: progAll, progOf: progOf, setProg: setProg, clearProg: clearProg,
    learnedUnits: learnedUnits, progSuggest: progSuggest,
    buildWD: buildWD, buildRT: buildRT, dueWrong: dueWrong,
    buildExam: buildExam, EXAM_NAME: EXAM_NAME,
    inferDiff: inferDiff, pickByDiff: pickByDiff, RATIO: RATIO,
    hint: hint,
    noteWrong: noteWrong, noteRight: noteRight, wrongStats: wrongStats,
    weekPlan: weekPlan, weekMinutes: weekMinutes, weekReport: weekReport,
    addHistory: addHistory, weekRange: weekRange
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
