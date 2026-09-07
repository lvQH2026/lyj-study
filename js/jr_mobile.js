// ============================================================
// v83 · 手机端 初中模块（7–9 年级全学科 + 周末运行机制）
// ------------------------------------------------------------
// 数据来源：
//   单元   window.JRF.unitsOf(subject, grade)  —— 统一入口，见 js/jr_flow.js
//          （数学=KNOWLEDGE_BASE，语文=CN.data，英语=PEP.books，其余=JR_SUBJ）
//   配图   window.JRFIG（题面 svg 片段）
//   机制   window.JRF：本周任务 / 进度对齐 / 错题 1-3-7-15 天间隔 / 周报
// 容器 #jrRoot 写在 index.html，模块按钮与样式由本文件注入。
// 错题写入 localStorage['math_practice_data']，module 用学科中文名（与 pc.js 一致）。
// 依赖：core.js（looseNumericEquals / App.switchModule）
// ============================================================
window.JRM = (function () {
  'use strict';

  var SUBJ = (window.JRF && window.JRF.SUBJ) ? window.JRF.SUBJ : [];
  var GN = { 7: '七年级', 8: '八年级', 9: '九年级' };
  var PER = 12;   // 单元练习每次 12 题

  var S = {
    subj: 'math', grade: 7, term: '上', unit: null,
    qs: [], i: 0, right: 0, wrong: [], t0: 0,
    mode: 'unit',        // unit | WD | RT | UT | MT | FT
    modeName: '',        // 展示名（「周末诊断测」「单元测试卷」…）
    wids: {},            // 题号 → 错题本 id（RT 模式）
    srcUnits: [],        // 本卷题目来源单元（用于提示卡与插基础题）
    streakOk: 0, streakNo: 0, inserted: 0,   // 动态升降台阶
    answered: false, timer: null, gave: false // 提示卡
  };
  var KEY = 'math_practice_data';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function F() { return window.JRF; }
  function subjMeta(k) {
    for (var i = 0; i < SUBJ.length; i++) if (SUBJ[i].k === k) return SUBJ[i];
    return { k: k, n: k, layer: 'C', bud: 8, wd: 8, rt: 6 };
  }
  function subjName(k) { return subjMeta(k || S.subj).n; }

  /* ---------------- 数据 ---------------- */
  function unitsOf(k, g, term) { return F() ? F().unitsOf(k, g, term) : []; }
  function gradesOf(k) {
    var out = [];
    [7, 8, 9].forEach(function (g) { if (unitsOf(k, g).length) out.push(g); });
    return out;
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function addWrong(q, ua) {
    if (F() && F().noteWrong) {
      return F().noteWrong(q, S.subj, S.unit ? S.unit.name : (q._unit || ''), S.grade, ua);
    }
    var d = load(); d.wrong = d.wrong || [];
    d.wrong.push({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      module: subjName(), question: q, userAnswer: ua,
      unitName: S.unit ? S.unit.name : '', grade: S.grade, time: Date.now(), count: 1
    });
    save(d);
    return null;
  }
  function addHistory(ms) {
    if (F() && F().addHistory) {
      F().addHistory(S.subj, S.grade, (S.unit ? S.unit.name : S.modeName), S.right, S.qs.length, ms);
      return;
    }
    var d = load(); d.history = d.history || [];
    d.history.push({
      module: subjName(), unitName: S.unit ? S.unit.name : '', grade: S.grade,
      score: S.right, total: S.qs.length, time: Date.now(), duration: ms
    });
    save(d);
  }

  /* ---------------- 判分（与 pc.js pcJudge 同口径） ---------------- */
  function judge(q, ua) {
    if (ua === undefined || ua === null || String(ua).trim() === '') return false;
    if (q && q.judge === 'eng' && window.PEPQ && typeof window.PEPQ.judge === 'function') {
      try { return !!window.PEPQ.judge(q, ua); } catch (e) {}
    }
    var a = q.answer;
    if (String(ua).trim() === String(a).trim()) return true;
    if (typeof looseNumericEquals === 'function' && looseNumericEquals(ua, a)) return true;
    var up = String(ua).split(/[,，、\/]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    var ap = String(a).split(/[,，、\/]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    if (up.length > 1 && up.length === ap.length) {
      return up.every(function (v, i) {
        if (v === ap[i]) return true;
        return typeof looseNumericEquals === 'function' ? looseNumericEquals(v, ap[i]) : false;
      });
    }
    return false;
  }

  /* ---------------- 页面渲染 ---------------- */
  function show(pageId) {
    var root = $('jrRoot');
    if (!root) return;
    var ps = root.querySelectorAll('.page');
    for (var i = 0; i < ps.length; i++) ps[i].classList.remove('active');
    var p = $(pageId);
    if (p) p.classList.add('active');
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  function chips(host, items, cur, onPick) {
    if (!host) return;
    var h = '';
    items.forEach(function (it) {
      h += '<button class="jr-chip' + (String(it.v) === String(cur) ? ' on' : '') + '" data-v="' + esc(it.v) + '">' + esc(it.t) + '</button>';
    });
    host.innerHTML = h;
    Array.prototype.forEach.call(host.querySelectorAll('.jr-chip'), function (b) {
      b.onclick = function () { onPick(b.getAttribute('data-v')); };
    });
  }

  /* ============ 首页：本周任务 ============ */
  function goHome() {
    if (!F()) { show('jrPageHome'); return; }
    show('jrPageHome');
    var plan = F().weekPlan(S.grade);
    var used = F().weekMinutes();
    var cap = F().WEEK_BUDGET;
    var pct = Math.min(100, Math.round(used / cap * 100));

    var h = '<div class="jr-budget"><div class="jr-budget-top">' +
      '<span>本周已用 <b>' + used + '</b> / ' + cap + ' 分钟</span>' +
      '<span class="jr-budget-pct">' + pct + '%</span></div>' +
      '<div class="jr-bar"><i style="width:' + pct + '%"></i></div></div>';

    h += '<div class="jr-sec">本周任务（按顺序做，做完即可）</div>';
    if (!plan.items.length) {
      h += '<div class="jr-empty">该年级暂无可用单元</div>';
    } else {
      plan.items.forEach(function (it) {
        var p = F().progOf(it.k);
        var due = F().dueWrong(it.k).length;
        var ws = F().wrongStats(it.k);
        var progTxt = p ? ('已学至 ' + (p.term || '上') + '册第 ' + p.idx + ' 单元') : '未设进度';
        h += '<div class="jr-task">' +
          '<div class="jr-task-l"><div class="jr-task-n">' + esc(it.n) +
          '<em class="jr-layer">' + it.layer + '层</em></div>' +
          '<div class="jr-task-m">' + esc(progTxt) + ' · 错题 ' + ws.total + '（待复习 ' + ws.due + '）</div></div>' +
          '<div class="jr-task-r">' +
          '<button class="jr-mini" data-wd="' + it.k + '">诊断测 ' + it.wd + ' 题</button>' +
          (due ? '<button class="jr-mini gold" data-rt="' + it.k + '">错题重练 ' + Math.min(due, it.rt) + ' 题</button>' : '') +
          '</div></div>';
      });
    }

    h += '<button class="btn jr-block" id="jrGoPick">按单元练习</button>' +
      '<button class="btn jr-block" id="jrGoProg">设置本周进度</button>' +
      '<button class="btn jr-block" id="jrGoReport">查看本周周报</button>' +
      '<div class="jr-tip">周末按上面的顺序做，做完为止。系统会按 1 / 3 / 7 / 15 天把错题推回来，' +
      '连续做对 2 次的题才会移出错题本。</div>';

    $('jrPlan').innerHTML = h;
    $('jrGoPick').onclick = goPick;
    $('jrGoProg').onclick = goProg;
    $('jrGoReport').onclick = goReport;
    Array.prototype.forEach.call($('jrPlan').querySelectorAll('[data-wd]'), function (b) {
      b.onclick = function () { startWD(b.getAttribute('data-wd')); };
    });
    Array.prototype.forEach.call($('jrPlan').querySelectorAll('[data-rt]'), function (b) {
      b.onclick = function () { startRT(b.getAttribute('data-rt')); };
    });
  }

  /* ============ 选学科 → 单元列表 ============ */
  function goPick() {
    show('jrPagePick');
    var gs = gradesOf(S.subj);
    if (!gs.length) { S.subj = 'math'; gs = gradesOf('math'); }
    if (gs.indexOf(S.grade) < 0) S.grade = gs[0] || 7;
    chips($('jrSubj'), SUBJ.map(function (s) { return { v: s.k, t: s.n }; }), S.subj, function (v) {
      S.subj = v; S.grade = (gradesOf(v)[0] || 7); S.unit = null; goPick();
    });
    chips($('jrGrade'), gs.map(function (g) { return { v: String(g), t: GN[g] }; }), String(S.grade), function (v) {
      S.grade = parseInt(v, 10); S.unit = null; goPick();
    });
    chips($('jrTerm'), [{ v: '上', t: '上册' }, { v: '下', t: '下册' }], S.term, function (v) {
      S.term = v; S.unit = null; goPick();
    });
    var us = unitsOf(S.subj, S.grade, S.term);
    var m = F() ? F().meta(S.subj) : null;
    $('jrTip').innerHTML = '「' + esc(subjName()) + ' · ' + esc(GN[S.grade]) + S.term + '册」共 ' + us.length +
      ' 个单元，每单元一次练习 ' + PER + ' 题。大卷只出「已学至」范围内的题。';
    var uT = $('jrGoUT'), mT = $('jrGoMT'), fT = $('jrGoFT');
    if (uT) {
      uT.textContent = '单元测试卷（' + (m ? m.ut : 18) + ' 题 · 约 ' + (m ? m.utMin : 45) + ' 分钟）';
      uT.onclick = function () { toUnits('UT'); };
    }
    if (mT) {
      mT.textContent = '期中复习卷（' + (m ? m.big : 19) + ' 题 · 约 ' + (m ? m.bigMin : 60) + ' 分钟）';
      mT.onclick = function () { startExam(S.subj, 'MT'); };
    }
    if (fT) {
      fT.textContent = '期末复习卷（' + (m ? m.big : 19) + ' 题 · 约 ' + (m ? m.bigMin : 60) + ' 分钟）';
      fT.onclick = function () { startExam(S.subj, 'FT'); };
    }
  }

  function toUnits(examType) {
    var us = unitsOf(S.subj, S.grade, S.term);
    S.examType = examType || null;
    $('jrUnitsTitle').textContent = subjName() + ' · ' + GN[S.grade] + S.term + '册' +
      (examType ? '（选一个单元出「' + (F() ? (F().EXAM_NAME[examType] || '卷') : '卷') + '」）' : '');
    var h = '';
    us.forEach(function (u, idx) {
      h += '<button class="jr-unit" data-i="' + idx + '">' +
        '<span class="jr-unit-name">' + esc(u.name) + '</span>' +
        '<span class="jr-unit-go">' + (examType ? '出卷 ›' : '开始 ›') + '</span></button>';
    });
    if (!us.length) h = '<div class="jr-empty">该册暂无单元</div>';
    $('jrUnitList').innerHTML = h;
    Array.prototype.forEach.call($('jrUnitList').querySelectorAll('.jr-unit'), function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute('data-i'), 10);
        if (examType) startExam(S.subj, examType, i);
        else startUnit(us[i]);
      };
    });
    show('jrPageUnits');
  }

  /* ============ 本周进度设置 ============ */
  function goProg() {
    show('jrPageProg');
    chips($('jrProgGrade'), [7, 8, 9].map(function (g) { return { v: String(g), t: GN[g] }; }), String(S.grade), function (v) {
      S.grade = parseInt(v, 10); goProg();
    });
    var h = '';
    SUBJ.forEach(function (s) {
      if (!unitsOf(s.k, S.grade).length) return;
      var p = (F() && F().progOf) ? F().progOf(s.k) : null;
      var term = p ? (p.term || '上') : '上';
      var idx = p ? (p.idx || 0) : 0;
      var us = unitsOf(s.k, S.grade, term);
      h += '<div class="jr-prow"><span class="jr-pname">' + esc(s.n) + '</span>' +
        '<select class="jr-sel" data-k="' + s.k + '" data-f="term">' +
        '<option value="上"' + (term === '上' ? ' selected' : '') + '>上册</option>' +
        '<option value="下"' + (term === '下' ? ' selected' : '') + '>下册</option></select>' +
        '<select class="jr-sel wide" data-k="' + s.k + '" data-f="idx">' +
        '<option value="0">未开始</option>';
      us.forEach(function (u, i) {
        h += '<option value="' + (i + 1) + '"' + (idx === i + 1 ? ' selected' : '') + '>' +
          esc(String(i + 1) + '. ' + (u.name || '')) + '</option>';
      });
      h += '</select></div>';
      var sg = (F() && F().progSuggest) ? F().progSuggest(s.k, S.grade) : null;
      if (sg) h += '<div class="jr-phint">建议更新为：第 ' + sg.idx + ' 单元' + (sg.unitName ? '（' + esc(sg.unitName) + '）' : '') + '</div>';
    });
    $('jrProgList').innerHTML = h || '<div class="jr-empty">该年级暂无单元</div>';
    Array.prototype.forEach.call($('jrProgList').querySelectorAll('.jr-sel'), function (sel) {
      sel.onchange = function () {
        var k = sel.getAttribute('data-k');
        var row = $('jrProgList');
        var t = row.querySelector('select[data-k="' + k + '"][data-f="term"]');
        var x = row.querySelector('select[data-k="' + k + '"][data-f="idx"]');
        if (F() && F().setProg) F().setProg(k, S.grade, t ? t.value : '上', x ? parseInt(x.value, 10) : 0);
        if (sel.getAttribute('data-f') === 'term') goProg();
      };
    });
  }

  /* ============ 周报 ============ */
  function goReport() {
    show('jrPageReport');
    if (!F() || !F().weekReport) { $('jrReport').innerHTML = '<div class="jr-empty">周报模块未加载</div>'; return; }
    var r = F().weekReport();
    var h = '<div class="jr-rbox"><div class="jr-rtitle">本周概况</div>' +
      '<div class="jr-rrow"><span>练习次数</span><b>' + r.total.times + ' 次</b></div>' +
      '<div class="jr-rrow"><span>题目总数</span><b>' + r.total.q + ' 题</b></div>' +
      '<div class="jr-rrow"><span>正确率</span><b>' + r.total.rate + '%</b></div>' +
      '<div class="jr-rrow"><span>用时</span><b>' + r.total.min + ' / ' + r.budget.cap + ' 分钟</b></div></div>';

    if (r.alert.length) {
      h += '<div class="jr-rbox warn"><div class="jr-rtitle">异常预警</div>';
      r.alert.forEach(function (a) {
        h += '<div class="jr-alert ' + a.lv + '">' + esc(a.text) + '</div>';
      });
      h += '</div>';
    }

    h += '<div class="jr-rbox"><div class="jr-rtitle">未掌握清单（前 5）</div>';
    if (!r.weak.length) h += '<div class="jr-empty">本周没有新增薄弱点</div>';
    else r.weak.forEach(function (x, i) {
      h += '<div class="jr-rrow"><span>' + (i + 1) + '. ' + esc(x.module + '·' + x.unit) + '</span>' +
        '<b>' + x.n + ' 错' + (x.hard ? '（重点攻坚 ' + x.hard + '）' : '') + '</b></div>';
    });
    h += '</div>';

    var cmp = r.cmp;
    if (cmp.better.length || cmp.worse.length || cmp.stuck.length) {
      h += '<div class="jr-rbox"><div class="jr-rtitle">与上周对比</div>';
      cmp.better.forEach(function (x) { h += '<div class="jr-rrow ok"><span>' + esc(x.module) + ' 进步</span><b>' + x.from + '% → ' + x.to + '%</b></div>'; });
      cmp.worse.forEach(function (x) { h += '<div class="jr-rrow bad"><span>' + esc(x.module) + ' 退步</span><b>' + x.from + '% → ' + x.to + '%</b></div>'; });
      cmp.stuck.forEach(function (x) { h += '<div class="jr-rrow warn2"><span>' + esc(x.module) + ' 本周未练习</span><b>上周 ' + x.from + '%</b></div>'; });
      h += '</div>';
    }

    var ms = Object.keys(r.byModule);
    if (ms.length) {
      h += '<div class="jr-rbox"><div class="jr-rtitle">各科明细</div>';
      ms.forEach(function (m) {
        var x = r.byModule[m];
        h += '<div class="jr-rrow"><span>' + esc(m) + '</span><b>' + x.rate + '% · ' + x.q + ' 题 · ' + x.min + ' 分钟</b></div>';
      });
      h += '</div>';
    }
    $('jrReport').innerHTML = h;
  }

  /* ============ 组卷与答题 ============ */
  function keyOf(q) { return String(q.question) + '|' + String(q.answer); }

  function startUnit(u) {
    if (!u) return;
    S.unit = u; S.mode = 'unit'; S.modeName = u.name;
    var qs = [];
    try { qs = (typeof u.pool === 'function') ? (u.pool() || []) : []; } catch (e) { qs = []; }
    if (!qs.length && F()) qs = F().unitQs(S.subj, u, PER);
    if (!qs.length) { alert('该单元暂无题目'); return; }
    S.srcUnits = [u];
    S.qs = shuffle(qs).slice(0, Math.min(PER, qs.length));
    begin();
  }

  /* UT / MT / FT 大卷（范围严格限制在已学单元内） */
  function startExam(k, type, unitIdx) {
    if (!F()) return;
    S.subj = k; S.unit = null; S.mode = type;
    var r = F().buildExam(k, S.grade, type, unitIdx);
    if (!r.questions.length) {
      alert(r.empty === 'noprog' ? '请先在「设置本周进度」里勾选' + subjName(k) + '学到第几单元' : '已学范围内暂无足够题目');
      goProg();
      return;
    }
    S.modeName = r.typeName + '（' + r.n + ' 题 · 约 ' + r.minutes + ' 分钟）';
    S.diffDist = r.diffDist;
    S.diffRatio = r.ratio;
    S.srcUnits = [];
    var all = unitsOf(k, S.grade);
    (r.units || []).forEach(function (nm) {
      for (var i = 0; i < all.length; i++) if (all[i].name === nm) { S.srcUnits.push(all[i]); break; }
    });
    S.qs = r.questions;
    begin();
  }

  function startWD(k) {
    if (!F()) return;
    S.subj = k; S.unit = null; S.mode = 'WD'; S.modeName = '周末诊断测';
    var r = F().buildWD(k, S.grade);
    if (!r.questions.length) {
      alert(r.empty === 'noprog' ? '请先在「设置本周进度」里勾选' + subjName(k) + '学到第几单元' : '该学科暂无可用题目');
      goProg();
      return;
    }
    S.qs = r.questions;
    S.srcUnits = F().learnedUnits(k, S.grade).slice(-3);
    begin();
  }

  function startRT(k) {
    if (!F()) return;
    S.subj = k; S.unit = null; S.mode = 'RT'; S.modeName = '错题重练';
    var r = F().buildRT(k);
    if (!r.questions.length) { alert('暂无到期错题'); return; }
    S.qs = r.questions;
    S.srcUnits = [];
    begin();
  }

  function begin() {
    S.i = 0; S.right = 0; S.wrong = []; S.wids = {}; S.t0 = Date.now();
    S.streakOk = 0; S.streakNo = 0; S.inserted = 0;
    show('jrPageQuiz');
    renderQ();
  }

  function renderQ() {
    var q = S.qs[S.i];
    $('jrProg').textContent = '第 ' + (S.i + 1) + ' / ' + S.qs.length + ' 题';
    $('jrScore').textContent = '✓ ' + S.right;
    $('jrQuizTitle').textContent = subjName() + ' · ' + S.modeName;
    var h = '';
    if (q.svg) h += '<div class="jr-fig"><svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">' + q.svg + '</svg></div>';
    if (q._unit && S.mode !== 'unit') h += '<div class="jr-qfrom">' + esc(q._unit) + '</div>';
    h += '<div class="jr-q">' + esc(q.question) + '</div>';
    if (q.type === 'judge') {
      h += '<div class="jr-opts">' +
        '<button class="jr-opt" data-v="正确">正确</button>' +
        '<button class="jr-opt" data-v="错误">错误</button></div>';
    } else if (q.options && q.options.length) {
      h += '<div class="jr-opts">' + q.options.map(function (o) {
        return '<button class="jr-opt" data-v="' + esc(o) + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else {
      h += '<div class="jr-fill"><input id="jrInput" type="text" autocomplete="off" placeholder="在这里输入答案">' +
        '<button class="jr-sub" id="jrSub">提交</button></div>';
    }
    $('jrQCard').innerHTML = h;
    $('jrFb').innerHTML = '';
    $('jrNextBtn').style.display = 'none';
    S.answered = false; S.gave = false;
    // 提示卡：卡住 60 秒自动给一级提示（思路方向，不给答案）
    clearTimeout(S.timer);
    S.timer = setTimeout(function () { if (!S.answered) showHint(1); }, 60000);

    Array.prototype.forEach.call($('jrQCard').querySelectorAll('.jr-opt'), function (b) {
      b.onclick = function () { answer(b.getAttribute('data-v')); };
    });
    var sub = $('jrSub');
    if (sub) {
      sub.onclick = function () { var inp = $('jrInput'); answer(inp ? inp.value : ''); };
      var inp = $('jrInput');
      if (inp) inp.onkeydown = function (e) { if (e.key === 'Enter') answer(inp.value); };
    }
  }

  /* ---------------- 提示卡（§2.3） ---------------- */
  function unitOfName(nm) {
    if (!nm) return S.unit;
    for (var i = 0; i < S.srcUnits.length; i++) if (S.srcUnits[i].name === nm) return S.srcUnits[i];
    return S.unit;
  }
  function showHint(level) {
    var q = S.qs[S.i];
    var u = unitOfName(q ? q._unit : '');
    var t = (F() && F().hint) ? F().hint(u, level) : '';
    if (!t) t = level === 1
      ? '先回想本单元最基本的概念，再看选项里有没有能直接排除的。'
      : (u && u.summary && u.summary[1]) ? u.summary[1] : '把题目里的已知条件逐条列出来，再套本单元的方法。';
    var h = '<div class="jr-hint"><b>' + (level === 1 ? '提示一 · 思路方向' : '提示二 · 关键步骤') + '</b>' +
      esc(t) + '</div>';
    if (level === 1) h += '<button class="jr-hintbtn" id="jrHint2">再给一点提示</button>';
    h += '<button class="jr-hintbtn" id="jrGiveUp">直接看答案</button>';
    $('jrFb').innerHTML = h;
    var b2 = $('jrHint2');
    if (b2) b2.onclick = function () { showHint(2); };
    var bg = $('jrGiveUp');
    if (bg) bg.onclick = giveUp;
  }
  /** 直接看答案：本题算未掌握，入错题本（间隔重现会把题目再推回来） */
  function giveUp() {
    var q = S.qs[S.i];
    S.answered = true; clearTimeout(S.timer);
    var id = addWrong(q, '');
    if (id) S.wids[S.i] = id;
    S.wrong.push({ q: q, ua: '' });
    S.streakNo++; S.streakOk = 0;
    $('jrFb').innerHTML = '<div class="jr-fb no">正确答案：' + esc(q.answer) + '</div>' +
      '<div class="jr-tipq">本题已收入错题本，之后会按 1/3/7/15 天再推给你。</div>';
    var btn = $('jrNextBtn');
    btn.style.display = 'block';
    btn.textContent = (S.i + 1 >= S.qs.length) ? '查看结果' : '下一题';
  }

  /* ---------------- 动态升降台阶（§2.3） ---------------- */
  /** 找一道更基础的题：判断题优先，其次题干最短，且本卷没出过 */
  function easierQ() {
    var done = {};
    S.qs.forEach(function (q) { done[keyOf(q)] = 1; });
    var cand = [];
    S.srcUnits.forEach(function (u) {
      var all = F() ? F().unitQs(S.subj, u, 40) : [];
      all.forEach(function (q) { if (!done[keyOf(q)]) cand.push(q); });
    });
    if (!cand.length) return null;
    cand.sort(function (a, b) {
      var sa = (a.type === 'judge' ? -1000 : 0) + String(a.question).length;
      var sb = (b.type === 'judge' ? -1000 : 0) + String(b.question).length;
      return sa - sb;
    });
    return cand[0];
  }

  function answer(ua) {
    var q = S.qs[S.i];
    S.answered = true; clearTimeout(S.timer);
    var ok = judge(q, ua);
    if (ok) {
      S.right++; S.streakOk++; S.streakNo = 0;
      if (q._wid && F() && F().noteRight) F().noteRight(q._wid);   // 错题重练答对 → 推进间隔
    } else {
      var id = addWrong(q, ua);
      if (id) S.wids[S.i] = id;
      S.wrong.push({ q: q, ua: ua });
      S.streakNo++; S.streakOk = 0;
    }
    var fb = '<div class="jr-fb ' + (ok ? 'ok' : 'no') + '">' +
      (ok ? '✓ 正确' : '✗ 不正确，正确答案：' + esc(q.answer)) + '</div>';
    var sum = (S.unit && S.unit.summary && S.unit.summary.length) ? S.unit.summary[0] : '';
    if (!sum && q._unit) {
      var us = unitsOf(S.subj, S.grade);
      for (var i = 0; i < us.length; i++) if (us[i].name === q._unit && us[i].summary && us[i].summary.length) { sum = us[i].summary[0]; break; }
    }
    if (sum) fb += '<div class="jr-tipq">本单元要点：' + esc(sum) + '</div>';
    if (!ok) {
      fb += '<button class="jr-hintbtn" id="jrHint1">看提示</button>';
      // 连错 2 道 → 立即插一道更基础的同类题，把台阶降下来
      if (S.streakNo >= 2 && S.inserted < 2) {
        var eq = easierQ();
        if (eq) {
          S.qs.splice(S.i + 1, 0, eq);
          S.inserted++; S.streakNo = 0;
          fb += '<div class="jr-tipq">先做一道更基础的题，做完再继续。</div>';
        }
      }
    }
    $('jrFb').innerHTML = fb;
    var hb = $('jrHint1');
    if (hb) hb.onclick = function () { showHint(1); };
    Array.prototype.forEach.call($('jrQCard').querySelectorAll('.jr-opt'), function (b) {
      b.disabled = true;
      if (b.getAttribute('data-v') === String(q.answer)) b.classList.add('right');
      else if (b.getAttribute('data-v') === String(ua)) b.classList.add('wrong');
    });
    var btn = $('jrNextBtn');
    btn.style.display = 'block';
    btn.textContent = (S.i + 1 >= S.qs.length) ? '查看结果' : '下一题';
  }

  function next() {
    if (S.i + 1 >= S.qs.length) { finish(); return; }
    // 连对 3 道 → 把同单元的下一题挪到末尾，降低同类型出现频率
    if (S.streakOk >= 3 && S.i + 2 < S.qs.length) {
      var cur = S.qs[S.i]._unit, nx = S.qs[S.i + 1];
      if (nx && nx._unit === cur) {
        var hasOther = false;
        for (var j = S.i + 2; j < S.qs.length; j++) if (S.qs[j]._unit !== cur) { hasOther = true; break; }
        if (hasOther) { S.qs.splice(S.i + 1, 1); S.qs.push(nx); }
      }
    }
    S.i++;
    renderQ();
  }

  function finish() {
    var ms = Date.now() - S.t0;
    addHistory(ms);
    var total = S.qs.length;
    var rate = total ? Math.round(S.right / total * 100) : 0;
    var h = '<div class="jr-score">' + S.right + ' / ' + total + '</div>' +
      '<div class="jr-rate">正确率 ' + rate + '%　用时 ' + Math.max(1, Math.round(ms / 60000)) + ' 分钟</div>';
    if (S.wrong.length) {
      h += '<div class="jr-sub2">错题（已收入错题本，会按 1/3/7/15 天推回）</div>';
      S.wrong.forEach(function (w) {
        h += '<div class="jr-wrong"><div class="jr-wq">' + esc(w.q.question) + '</div>' +
          '<div class="jr-wa">正确：' + esc(w.q.answer) +
          (w.ua ? '　你的答案：' + esc(w.ua) : '') + '</div></div>';
      });
    } else {
      h += '<div class="jr-sub2">全部答对，很棒！</div>';
    }
    if (S.mode === 'WD' && rate < 60) {
      h += '<div class="jr-advice">正确率低于 60%，建议本周再针对薄弱单元做一次「按单元练习」。</div>';
    }
    if ((S.mode === 'UT' || S.mode === 'MT' || S.mode === 'FT') && S.diffDist) {
      var d1 = S.diffDist[1] || 0, d2 = S.diffDist[2] || 0, d3 = S.diffDist[3] || 0;
      var t1 = Math.round((S.diffRatio && S.diffRatio[0] || 0) * 100);
      var t2 = Math.round((S.diffRatio && S.diffRatio[1] || 0) * 100);
      var t3 = Math.round((S.diffRatio && S.diffRatio[2] || 0) * 100);
      h += '<div class="jr-advice">难度分布 L1:L2:L3 = ' + d1 + ':' + d2 + ':' + d3 +
        '（目标 ' + t1 + ':' + t2 + ':' + t3 + '，基础/提高/拓展）</div>';
    }
    $('jrResult').innerHTML = h;
    show('jrPageResult');
  }

  /* ---------------- 注入：模块按钮 + 样式 ---------------- */
  function inject() {
    var sw = $('moduleSwitch');
    if (sw && !sw.querySelector('[data-mod="jr"]')) {
      var b = document.createElement('button');
      b.className = 'mod-btn';
      b.setAttribute('data-mod', 'jr');
      b.textContent = '初中';
      b.onclick = function () { window.App && App.switchModule('jr'); };
      sw.appendChild(b);
    }
    if (!document.getElementById('jrStyle')) {
      var st = document.createElement('style');
      st.id = 'jrStyle';
      st.textContent = [
        '.jr-wrap{max-width:520px;margin:0 auto;padding:14px 14px 60px}',
        '.jr-title{font-size:17px;font-weight:700;color:#3E4A63;margin:6px 0 14px}',
        '.jr-sec{font-size:13px;color:#8a8f9a;margin:14px 0 8px}',
        '.jr-chips{display:flex;flex-wrap:wrap;gap:8px}',
        '.jr-chip{border:1px solid #E0DCD2;background:#fff;color:#3E4A63;border-radius:16px;',
        'padding:8px 14px;font-size:14px;min-height:40px;cursor:pointer}',
        '.jr-chip.on{background:#3E4A63;color:#fff;border-color:#3E4A63}',
        '.jr-block{display:block;width:100%;margin-top:12px}',
        '.jr-tip{margin-top:14px;font-size:13px;color:#8a8f9a;line-height:1.7}',
        '.jr-back{background:none;border:none;color:#B4945A;font-size:14px;padding:6px 0;cursor:pointer}',
        // 预算条
        '.jr-budget{background:#fff;border:1px solid #E7E4DC;border-radius:12px;padding:12px 14px}',
        '.jr-budget-top{display:flex;justify-content:space-between;font-size:14px;color:#3E4A63}',
        '.jr-budget-pct{color:#B4945A;font-weight:700}',
        '.jr-bar{height:8px;background:#F0EDE6;border-radius:6px;margin-top:8px;overflow:hidden}',
        '.jr-bar i{display:block;height:100%;background:#B4945A;border-radius:6px}',
        // 任务卡
        '.jr-task{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;',
        'border:1px solid #E7E4DC;border-radius:12px;padding:12px;margin-bottom:10px}',
        '.jr-task-n{font-size:15px;font-weight:600;color:#3E4A63}',
        '.jr-layer{font-style:normal;font-size:11px;color:#B4945A;border:1px solid #E3D5B8;',
        'border-radius:8px;padding:1px 6px;margin-left:6px}',
        '.jr-task-m{font-size:12px;color:#8a8f9a;margin-top:4px;line-height:1.5}',
        '.jr-task-r{display:flex;flex-direction:column;gap:6px;flex-shrink:0}',
        '.jr-mini{border:1px solid #3E4A63;background:#3E4A63;color:#fff;border-radius:9px;',
        'padding:8px 12px;font-size:13px;min-height:40px;cursor:pointer;white-space:nowrap}',
        '.jr-mini.gold{background:#fff;color:#B4945A;border-color:#C9B48B}',
        // 进度设置
        '.jr-prow{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E7E4DC;',
        'border-radius:10px;padding:10px 12px;margin-bottom:8px}',
        '.jr-pname{font-size:14px;color:#3E4A63;width:76px;flex-shrink:0}',
        '.jr-sel{border:1px solid #E0DCD2;border-radius:8px;padding:8px;font-size:14px;min-height:40px;',
        'background:#fff;color:#3E4A63}',
        '.jr-sel.wide{flex:1;min-width:0}',
        '.jr-phint{font-size:12px;color:#B4945A;margin:-4px 0 10px 8px}',
        // 周报
        '.jr-rbox{background:#fff;border:1px solid #E7E4DC;border-radius:12px;padding:12px 14px;margin-bottom:12px}',
        '.jr-rbox.warn{border-color:#E8C9A0}',
        '.jr-rtitle{font-size:14px;font-weight:700;color:#3E4A63;margin-bottom:8px}',
        '.jr-rrow{display:flex;justify-content:space-between;gap:10px;font-size:14px;color:#5b6273;',
        'padding:6px 0;border-top:1px solid #F4F2EC}',
        '.jr-rrow:first-of-type{border-top:none}',
        '.jr-rrow b{color:#3E4A63}',
        '.jr-rrow.ok b{color:#4E8C5A}.jr-rrow.bad b{color:#C0392B}.jr-rrow.warn2 b{color:#C77B2A}',
        '.jr-alert{font-size:13px;line-height:1.6;padding:8px 10px;border-radius:8px;margin-bottom:6px}',
        '.jr-alert.red{background:#fdf1f1;color:#C0392B}',
        '.jr-alert.orange{background:#fdf6ec;color:#C77B2A}',
        // 单元与答题
        '.jr-unit{display:flex;align-items:center;justify-content:space-between;width:100%;',
        'background:#fff;border:1px solid #E7E4DC;border-radius:10px;padding:14px;margin-bottom:10px;',
        'font-size:15px;color:#3E4A63;min-height:52px;cursor:pointer;text-align:left}',
        '.jr-unit-go{color:#B4945A;font-size:13px}',
        '.jr-empty{padding:30px;text-align:center;color:#8a8f9a;font-size:14px}',
        '.jr-quiz-top{display:flex;justify-content:space-between;font-size:13px;color:#8a8f9a;margin-bottom:10px}',
        '.jr-qfrom{font-size:12px;color:#B4945A;margin-bottom:8px}',
        '.jr-fig{background:#FCFBF8;border:1px solid #EFECE4;border-radius:10px;padding:8px;margin-bottom:12px}',
        '.jr-fig svg{width:100%;height:auto;display:block}',
        '.jr-qcard{background:#fff;border:1px solid #E7E4DC;border-radius:12px;padding:16px}',
        '.jr-q{font-size:16px;line-height:1.7;color:#3E4A63;font-weight:500}',
        '.jr-opts{margin-top:14px;display:flex;flex-direction:column;gap:10px}',
        '.jr-opt{background:#fff;border:1px solid #E0DCD2;border-radius:10px;padding:13px 14px;',
        'font-size:15px;color:#3E4A63;text-align:left;min-height:48px;cursor:pointer}',
        '.jr-opt.right{border-color:#4E8C5A;background:#f0f7f2}',
        '.jr-opt.wrong{border-color:#C0392B;background:#fdf1f1}',
        '.jr-fill{margin-top:14px;display:flex;gap:8px}',
        '.jr-fill input{flex:1;border:1px solid #E0DCD2;border-radius:10px;padding:12px;font-size:16px;min-height:48px}',
        '.jr-sub{border:none;background:#3E4A63;color:#fff;border-radius:10px;padding:0 18px;font-size:15px;min-height:48px;cursor:pointer}',
        '.jr-fb{margin-top:12px;font-size:15px;font-weight:600}',
        '.jr-fb.ok{color:#4E8C5A}.jr-fb.no{color:#C0392B}',
        '.jr-tipq{margin-top:6px;font-size:13px;color:#8a8f9a;font-weight:400;line-height:1.7}',
        '.jr-score{font-size:34px;font-weight:700;color:#3E4A63;text-align:center;margin:16px 0 4px}',
        '.jr-rate{text-align:center;color:#B4945A;font-size:15px;margin-bottom:18px}',
        '.jr-sub2{font-size:14px;font-weight:600;color:#3E4A63;margin:16px 0 8px}',
        // 提示卡与动态台阶
        '.jr-hint{background:#FBF8F1;border:1px dashed #D9C9A6;border-radius:10px;padding:10px 12px;',
        'margin-top:12px;font-size:13px;line-height:1.7;color:#6b6250}',
        '.jr-hint b{display:block;color:#B4945A;margin-bottom:4px;font-size:13px}',
        '.jr-hintbtn{margin-top:8px;margin-right:8px;background:#fff;border:1px solid #C9B48B;color:#B4945A;',
        'border-radius:9px;padding:8px 14px;font-size:13px;min-height:40px;cursor:pointer}',
        '.jr-advice{background:#fdf6ec;color:#C77B2A;font-size:13px;line-height:1.7;',
        'border-radius:10px;padding:10px 12px;margin-top:10px}',
        '.jr-wrong{background:#fff;border:1px solid #E7E4DC;border-radius:10px;padding:12px;margin-bottom:10px}',
        '.jr-wq{font-size:14px;line-height:1.6;color:#3E4A63}',
        '.jr-wa{font-size:13px;color:#8a8f9a;margin-top:6px;line-height:1.6}'
      ].join('');
      document.head.appendChild(st);
    }
  }

  function boot() {
    inject();
    if (window.App && typeof App.switchModule === 'function' && location.search.indexOf('module=jr') >= 0) {
      App.switchModule('jr');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return {
    goHome: goHome, goPick: goPick, goProg: goProg, goReport: goReport,
    toUnits: toUnits, next: next, startUnit: startUnit,
    startWD: startWD, startRT: startRT, startExam: startExam,
    showHint: showHint, giveUp: giveUp, state: S
  };
})();
