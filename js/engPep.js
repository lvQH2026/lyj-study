// ============================================================
// v83 · PEP 教材同步练习引擎（B4 英语 PEP 双轨模块）
// ------------------------------------------------------------
// 读 js/pep.js 的教材库，按单元生成题目，支持三档难度与四种题型：
//   1 英译中（choice）  看英文选中文           —— 词汇认读
//   2 单词拼写（fill）  看中文 / 音标写单词     —— 词汇书写
//   3 选词填空（choice）句子里挖一个词四选一     —— 语境用词
//   4 句型转换（fill）  补全句子 / 连词成句      —— 句型结构
// 判分统一走 core.js 的 engAnswerEquals（题目带 judge:'eng'）：
// 忽略大小写、句末标点、撇号写法，避免孩子写对却判错的挫败感。
//
// 三条硬约束（来自《网站改版建议_v2.md》否决清单，勿破）：
//   · 不加回「选择题型」筛选器 —— 只选难度，题型由难度档自动配比
//   · 不加回「混合难度」第 0 档 —— 难度只有 1/2/3
//   · 双轨教材（旧版三~五年级 + 2024 修订版六年级）必须都保留
// ============================================================
(function () {
  'use strict';

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function shuf(arr) {
    const a = (arr || []).slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function icon(n, s) {
    try { return (typeof UI_ICON !== 'undefined' && UI_ICON.svg) ? UI_ICON.svg(n, s) : ''; }
    catch (e) { return ''; }
  }
  function loadD() {
    try { return JSON.parse(localStorage.getItem('math_practice_data')) || {}; } catch (e) { return {}; }
  }
  function saveD(d) { try { localStorage.setItem('math_practice_data', JSON.stringify(d)); } catch (e) {} }

  /* ---------------- 教材库访问 ---------------- */
  function books() { return (window.PEP && window.PEP.books) ? window.PEP.books : []; }
  function getBook(bid) { return books().find(function (b) { return b.id === bid; }) || null; }
  function getUnit(bid, uid) {
    const b = getBook(bid);
    if (!b) return null;
    return b.units.find(function (u) { return u.id === uid; }) || null;
  }
  function bookWords(book, excludeUnitId) {
    const out = [];
    (book.units || []).forEach(function (u) {
      if (excludeUnitId && u.id === excludeUnitId) return;
      (u.words || []).forEach(function (w) { out.push(w); });
    });
    return out;
  }
  // 取 n 个干扰项：从 pool 里按 key（'m' 取中文释义、'w' 取英文单词）取值
  function pickDistract(pool, correct, n, key) {
    const k = key || 'm';
    const seen = {}; const out = [];
    seen[String(correct)] = 1;
    shuf(pool).forEach(function (w) {
      if (out.length >= n) return;
      if (!w || !w[k]) return;
      if (seen[w[k]]) return;
      seen[w[k]] = 1; out.push(w[k]);
    });
    return out;
  }

  /* ============================================================
   * 题型一：英译中 / 中译英（choice）
   * dir='en2zh' 看英文选中文；dir='zh2en' 看中文选英文。
   * 双向都出，一来容量翻倍（每单元只有 12 个词，单向凑不满 20 题），
   * 二来小升初两种方向都考。
   * ============================================================ */
  function mkEn2Zh(unit, pool, dir, it) {
    if (!it) return null;
    if (dir === 'zh2en') {
      const dis = pickDistract(pool.length ? pool : (unit.words || []), it.w, 3, 'w');
      if (dis.length < 3) return null;
      return {
        type: 'choice', judge: 'eng', tag: '中译英',
        question: '选出「' + it.m + '」对应的英文单词',
        options: shuf([it.w].concat(dis)),
        answer: it.w,
        explain: it.m + ' → ' + it.w + (it.ipa ? '　' + it.ipa : '')
      };
    }
    const dis = pickDistract(pool.length ? pool : (unit.words || []), it.m, 3, 'm');
    if (dis.length < 3) return null;
    return {
      type: 'choice', judge: 'eng', tag: '英译中',
      question: '选出「' + it.w + '」的中文意思',
      options: shuf([it.m].concat(dis)),
      answer: it.m,
      explain: it.w + ' = ' + it.m + (it.ipa ? '　' + it.ipa : '')
    };
  }

  /* ============================================================
   * 题型二：单词拼写（fill）
   * 同一个词换不同提示形式就是不同的题，容量翻倍：
   *   diff 1  v0 首字母+字母数      v1 字母乱序
   *   diff 2  v0 只给中文          v1 音标（无音标退回首字母）
   *   diff 3  v0 音标              v1 中文+首字母
   * ============================================================ */
  function mkSpell(unit, diff, v, it) {
    if (!it) return null;
    const w = String(it.w);
    const bare = w.replace(/[^a-zA-Z]/g, '');
    let tip = '';
    if (diff === 1) {
      tip = (v === 1)
        ? '（把字母排好序：' + shuf(bare.split('')).join(' ') + '）'
        : '（首字母 ' + w.charAt(0) + '，共 ' + bare.length + ' 个字母）';
    } else if (diff === 2) {
      tip = (v === 1 && it.ipa) ? '（音标 ' + it.ipa + '）'
        : (v === 1 ? '（首字母 ' + w.charAt(0) + '）' : '');
    } else {
      tip = (v === 1) ? '（首字母 ' + w.charAt(0) + '）'
        : (it.ipa ? '（音标 ' + it.ipa + '）' : '（首字母 ' + w.charAt(0) + '）');
    }
    return {
      type: 'fill', judge: 'eng', tag: '单词拼写',
      question: '根据提示写出英文单词：' + it.m + tip,
      answer: w,
      explain: it.m + ' → ' + w + (it.ipa ? '　' + it.ipa : '')
    };
  }

  /* ============================================================
   * 句型素材：枚举「句子 × 句中可挖的单元词」的全部组合
   * 之前是随机撞一个组合，去重后很容易枯竭（一个单元只有 4 个句型），
   * 改成先枚举再用游标取，容量从 ~4 题涨到 ~10 题。
   * ============================================================ */
  function clozeCombos(unit) {
    const out = [];
    (unit.sents || []).forEach(function (s) {
      (unit.words || []).forEach(function (wd) {
        const w = String(wd.w);
        if (w.length < 3) return;                 // 太短的功能词挖掉没意义
        const re = new RegExp('\\b' + reEsc(w) + '\\b', 'i');
        if (re.test(s.en)) out.push({ sent: s, word: wd });
      });
    });
    return out;
  }
  function blankOf(c) {
    return c.sent.en.replace(new RegExp('\\b' + reEsc(c.word.w) + '\\b', 'i'), '______');
  }

  /* ============================================================
   * 题型三：选词填空（choice）
   * 挖掉句中真实出现的一个单元词，四选一。
   * diff 3 干扰项取自全册（跨单元），前两档只在本单元内取。
   * ============================================================ */
  function mkCloze(unit, pool, diff, c) {
    if (!c) return null;
    const en = blankOf(c);
    const disSrc = (diff >= 3 && pool && pool.length) ? pool : (unit.words || []);
    const dis = pickDistract(disSrc, c.word.w, 3, 'w');
    if (dis.length < 3) return null;
    return {
      type: 'choice', judge: 'eng', tag: '选词填空',
      question: '选词填空：' + en + (diff >= 3 ? '' : '　（' + c.sent.zh + '）'),
      options: shuf([c.word.w].concat(dis)),
      answer: c.word.w,
      explain: '完整句子：' + c.sent.en + '　' + c.sent.zh + '　【' + c.word.w + ' = ' + c.word.m + '】'
    };
  }

  /* ============================================================
   * 题型四：句型转换（fill）
   *   diff 1 / 2：补全句子 —— 挖掉句中的一个单元词，不给选项
   *   diff 3：连词成句 —— 把句子单词打乱，写出完整句子（小升初常见题型）
   * ------------------------------------------------------------
   * 说明：规划文档里这条叫「句型转换」。自动做陈述句→疑问句之类的
   * 机器改写风险很高（时态、助动词、动词还原到处是坑，容易出病句）。
   * 这里改成两种更稳、同样考句型的形式：补全句子考「句里缺哪一类词」，
   * 连词成句考「语序与句末标点」，都是答案唯一、机器判得准的题。
   * ============================================================ */
  function mkSent(unit, diff, item) {
    if (!item) return null;
    if (item.kind === 'scram') {
      const s = item.sent;
      const parts = shuf(s.en.split(/\s+/).filter(function (x) { return x; }));
      if (parts.length < 3) return null;
      return {
        type: 'fill', judge: 'eng', tag: '连词成句',
        question: '连词成句（注意首字母大写与句末标点）：' + parts.join(' / ') + '　（' + s.zh + '）',
        answer: s.en,
        explain: s.en + '　' + s.zh
      };
    }
    const c = item;
    const en = blankOf(c);
    const head = diff === 1 ? '补全句子（看中文提示）：' : '补全句子（首字母 ' + String(c.word.w).charAt(0) + '）：';
    return {
      type: 'fill', judge: 'eng', tag: '补全句子',
      question: head + en + (diff === 1 ? '　（' + c.sent.zh + '）' : ''),
      answer: c.word.w,
      explain: '完整句子：' + c.sent.en + '　' + c.sent.zh + '　【' + c.word.w + ' = ' + c.word.m + '】'
    };
  }

  /* ============================================================
   * 组卷：按难度配比生成 n 题（默认 20 题）
   * 只选难度，不选题型 —— 题型配比由难度档决定（否决清单硬约束）
   * ------------------------------------------------------------
   * 做法：每个题型先铺一排候选（词表 / 句型组合各打乱一遍），用游标
   * 顺序取，取到配比够为止。这样既不会撞重复题，也不会因为随机撞车
   * 而提前枯竭（第一版就是撞车导致大量单元只能出 14 题）。
   * ============================================================ */
  const MIX = {
    1: { word: 10, spell: 4, cloze: 0, sent: 6 },
    2: { word: 6, spell: 4, cloze: 6, sent: 4 },
    3: { word: 4, spell: 4, cloze: 6, sent: 6 }
  };
  function buildQuestions(bid, uid, diff, n) {
    diff = (diff === 2 || diff === 3) ? diff : 1;
    n = n || 20;
    const book = getBook(bid), unit = getUnit(bid, uid);
    if (!book || !unit) return [];
    const pool = bookWords(book, uid);
    const mix = MIX[diff];
    const list = [];
    const used = {};

    function push(q) {
      if (!q || !q.question) return false;
      const k = (q.tag || '') + '|' + q.question;
      if (used[k]) return false;
      used[k] = 1; list.push(q); return true;
    }
    // 铺候选：单词题两种方向、拼写两种提示变体，全部打乱
    const ws = shuf(unit.words || []);
    const wordCand = [];
    shuf(ws.map(function (w) { return { d: 'en2zh', w: w }; })
      .concat(ws.map(function (w) { return { d: 'zh2en', w: w }; })))
      .forEach(function (x) { wordCand.push(x); });
    const spellCand = [];
    shuf(ws.map(function (w) { return { v: 0, w: w }; })
      .concat(ws.map(function (w) { return { v: 1, w: w }; })))
      .forEach(function (x) { spellCand.push(x); });
    const combos = shuf(clozeCombos(unit));
    const sentCand = [];
    if (diff >= 3) {
      shuf(unit.sents || []).forEach(function (s) { sentCand.push({ kind: 'scram', sent: s }); });
    }
    combos.forEach(function (c) { sentCand.push(c); });

    // 游标取值
    let wi = 0, si = 0, ci = 0, ti = 0;
    function takeWord() {
      while (wi < wordCand.length) {
        const x = wordCand[wi++];
        if (push(mkEn2Zh(unit, pool, x.d, x.w))) return true;
      }
      return false;
    }
    function takeSpell() {
      while (si < spellCand.length) {
        const x = spellCand[si++];
        if (push(mkSpell(unit, diff, x.v, x.w))) return true;
      }
      return false;
    }
    function takeCloze() {
      while (ci < combos.length) {
        const c = combos[ci++];
        if (push(mkCloze(unit, pool, diff, c))) return true;
      }
      return false;
    }
    function takeSent() {
      while (ti < sentCand.length) {
        const it = sentCand[ti++];
        if (push(mkSent(unit, diff, it))) return true;
      }
      return false;
    }
    function fill(count, fn) {
      for (let k = 0; k < count; k++) { if (!fn()) return; }
    }
    fill(mix.word, takeWord);
    fill(mix.spell, takeSpell);
    fill(mix.cloze, takeCloze);
    fill(mix.sent, takeSent);
    // 某个题型容量不够（单元太小）：按 词→拼→句型→填空 的顺序补够 n 题
    let guard = 0;
    while (list.length < n && guard < n * 6) {
      guard++;
      if (takeWord()) continue;
      if (takeSpell()) continue;
      if (takeSent()) continue;
      if (takeCloze()) continue;
      break;                     // 四种题型全枯竭 —— 单元数据本身就不足
    }
    return shuf(list).slice(0, n);
  }

  /* ============================================================
   * 判分
   * ============================================================ */
  function judge(q, ua) {
    if (ua === undefined || ua === null || String(ua).trim() === '') return false;
    if (typeof engAnswerEquals === 'function') return engAnswerEquals(ua, q.answer);
    return String(ua).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
  }

  /* ============================================================
   * 记录：history + 错题 + 正确率 + 云端同步
   * ============================================================ */
  function recordHistory(book, unit, diff, score, total, wrongList) {
    const d = loadD();
    if (!d.history) d.history = [];
    const name = '英语 · ' + book.name + ' Unit ' + unit.no + ' · ' + unit.title;
    d.history.unshift({
      module: '英语',
      grade: book.grade,
      unitName: name,
      score: score,
      total: total,
      accuracy: Math.round(score / total * 100),
      diff: diff,
      time: Date.now(),
      wrong: Array.isArray(wrongList) ? wrongList : [],
      synced: false
    });
    if (d.history.length > 100) d.history = d.history.slice(0, 100);
    if (!d.stats) d.stats = {};
    if (!d.stats[book.grade]) d.stats[book.grade] = { totalDone: 0, totalCorrect: 0 };
    d.stats[book.grade].totalDone += total;
    d.stats[book.grade].totalCorrect += score;
    saveD(d);
  }
  function recordAccuracy(unitId, title, correct, total) {
    const d = loadD();
    if (!d.stats) d.stats = {};
    d.stats['eng_pep_' + unitId] = {
      title: title, correct: correct, total: total,
      acc: total ? Math.round(correct / total * 100) : 0,
      time: new Date().toLocaleString('zh-CN'),
      done: true, module: '英语'
    };
    saveD(d);
  }
  function addWrongUnit(q, ua, book, unit) {
    const d = loadD();
    if (!d.wrong) d.wrong = [];
    const qText = (q.tag ? '【' + q.tag + '】' : '') + q.question;
    const item = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      question: { question: qText, answer: q.answer, explain: q.explain },
      userAnswer: String(ua || ''),
      unitName: '英语 · ' + book.name + ' Unit ' + unit.no + ' · ' + unit.title,
      grade: book.grade,
      module: '英语',
      time: new Date().toLocaleString('zh-CN'),
      count: 1
    };
    const ex = d.wrong.find(function (w) {
      return w.module === '英语' && w.question && w.question.question === qText && w.question.answer === q.answer;
    });
    if (ex) { ex.count = (ex.count || 1) + 1; ex.lastWrong = Date.now(); }
    else d.wrong.push(item);
    saveD(d);
  }
  function syncCloud() {
    try { if (typeof syncAfterQuiz === 'function') syncAfterQuiz(); } catch (e) {}
  }

  /* ============================================================
   * 移动端答题状态与渲染
   * 复用 english.js 的 setView / viewStack / #engBody 容器
   * ============================================================ */
  const QS = { book: null, unit: null, diff: 1, list: [], idx: 0, results: [], startTime: 0, finished: false, confirmed: false };

  function wpClass(pct) {
    try { return (typeof wpCls === 'function') ? wpCls(pct) : ''; } catch (e) { return ''; }
  }
  function body() { return document.getElementById('engBody'); }
  function setV(title, render, showBack) {
    if (typeof setView === 'function') { setView(title, render, showBack); return; }
    const t = document.getElementById('engNavTitle'); if (t) t.textContent = title;
    const b = document.getElementById('engBackBtn'); if (b) b.style.display = showBack ? 'flex' : 'none';
    render();
  }
  function back() { if (typeof engGoBack === 'function') engGoBack(); }

  /* ---------------- 教材同步首页：册列表 ---------------- */
  function home() {
    if (typeof viewStack !== 'undefined') viewStack.length = 0;
    setV('英语 · 教材同步', function () {
      const bs = books();
      if (!bs.length) {
        body().innerHTML = '<div class="card"><div class="u-fs15">教材库未加载，请刷新页面重试。</div></div>';
        return;
      }
      let h = '<div class="card u-bg-grad u-c-white">'
        + '<div class="u-fs17 u-fw700">人教 PEP 教材同步</div>'
        + '<div class="u-fs13 u-op90 u-mt4">旧版三~五年级（补欠账）+ 2024 修订版六年级（同步新课）</div>'
        + '<div class="u-fs13 u-op90 u-mt4">' + bs.length + ' 册 · '
        + bs.reduce(function (s, b) { return s + b.units.length; }, 0) + ' 单元</div></div>';
      h += '<div class="muted-note u-tl u-m10-4-4">' + icon('info', 14)
        + ' 六年级用的是 2024 修订版，单元主题与旧版完全不同；三~五年级为旧版，用来补欠账。</div>';
      const olds = bs.filter(function (b) { return b.edition === 'old'; });
      const news = bs.filter(function (b) { return b.edition === 'new'; });
      function cardList(arr) {
        let x = '<div class="unit-list">';
        arr.forEach(function (b) {
          x += '<div class="unit-item" onclick="PEPQ.openBook(\'' + b.id + '\')">'
            + '<div class="unit-number">' + b.grade + (b.sem === 1 ? '上' : '下') + '</div>'
            + '<div class="unit-info"><div class="unit-name">' + esc(b.name)
            + (b.edition === 'new' ? ' <span class="pill u-c-gold">2024 新版</span>' : '')
            + '</div>'
            + '<div class="unit-meta">' + esc(b.label) + ' · ' + b.units.length + ' 个单元</div></div>'
            + '<div class="unit-arrow">&rsaquo;</div></div>';
        });
        return x + '</div>';
      }
      if (news.length) { h += '<div class="section-title">2024 修订版（六年级 · 同步新课）</div>' + cardList(news); }
      if (olds.length) { h += '<div class="section-title">旧版 PEP（三~五年级 · 补欠账）</div>' + cardList(olds); }
      h += '<div class="btn-row u-mt8">'
        + '<button class="btn-ghost u-f1" onclick="switchMain(\'phonics\')">' + icon('book', 16) + '返回自然拼读</button>'
        + '</div>';
      body().innerHTML = h;
    }, false);
  }

  /* ---------------- 册 → 单元列表 ---------------- */
  function openBook(bid) {
    const b = getBook(bid);
    if (!b) return;
    if (typeof viewStack !== 'undefined') viewStack.push({ title: '英语 · 教材同步', render: home });
    setV(b.name, function () {
      let h = '<div class="card">'
        + '<div class="u-fw700 u-fs18 u-c-primary">' + esc(b.name) + '</div>'
        + '<div class="unit-meta u-mt4">' + esc(b.label) + ' · 共 ' + b.units.length + ' 个单元</div>';
      if (b.tip) {
        h += '<div class="muted-note u-tl u-mt8">' + icon('info', 14) + ' ' + esc(b.tip) + '</div>';
      }
      h += '</div><div class="unit-list">';
      b.units.forEach(function (u) {
        const acc = readAcc(u.id);
        h += '<div class="unit-item" onclick="PEPQ.openUnit(\'' + b.id + '\',\'' + u.id + '\')">'
          + '<div class="unit-number">' + u.no + '</div>'
          + '<div class="unit-info"><div class="unit-name">' + esc(u.title) + '</div>'
          + '<div class="unit-meta">' + esc(u.zh) + ' · ' + (u.words || []).length + ' 词'
          + (acc ? ' · <span class="u-c-ok">正确率 ' + acc + '%</span>' : '') + '</div></div>'
          + '<div class="unit-arrow">&rsaquo;</div></div>';
      });
      h += '</div>';
      body().innerHTML = h;
    }, true);
  }
  function readAcc(uid) {
    const d = loadD();
    const s = (d.stats || {})['eng_pep_' + uid];
    return (s && typeof s.acc === 'number') ? s.acc : 0;
  }

  /* ---------------- 单元首页：词表 / 句型 / 语法 + 开始练习 ---------------- */
  function openUnit(bid, uid) {
    const b = getBook(bid), u = getUnit(bid, uid);
    if (!b || !u) return;
    if (typeof viewStack !== 'undefined') {
      viewStack.push({ title: b.name, render: function () { openBook(bid); } });
    }
    setV(u.title, function () {
      let h = '<div class="card">'
        + '<div class="u-fw700 u-fs17 u-c-primary">Unit ' + u.no + ' · ' + esc(u.title) + '</div>'
        + '<div class="unit-meta u-mt4">' + esc(b.label) + ' · ' + esc(u.zh) + '</div>'
        + '<div class="btn-row u-mt10">'
        + '<button class="btn-primary u-f1" onclick="PEPQ.startPractice(\'' + b.id + '\',\'' + u.id + '\')">'
        + icon('target', 16) + '开始练习</button></div></div>';

      h += '<div class="section-title">' + icon('book', 15) + ' 本单元单词（' + (u.words || []).length + '）</div>';
      h += '<div class="card"><div class="u-flex u-wrap" style="gap:6px">';
      (u.words || []).forEach(function (w) {
        h += '<span class="pill" onclick="speak(\'' + esc(w.w).replace(/&#39;/g, "\\'") + '\')">'
          + esc(w.w) + ' <span class="u-c-lighter">' + esc(w.m) + '</span></span>';
      });
      h += '</div><div class="muted-note u-tl u-mt6">点单词可听发音。</div></div>';

      h += '<div class="section-title">' + icon('list', 15) + ' 核心句型</div><div class="card">';
      (u.sents || []).forEach(function (s) {
        h += '<div class="u-mb8"><div class="u-fs14 u-fw600" onclick="speak(&quot;' + esc(s.en) + '&quot;)">'
          + esc(s.en) + '</div><div class="unit-meta">' + esc(s.zh) + '</div></div>';
      });
      h += '</div>';

      if (u.grammar) {
        h += '<div class="section-title">' + icon('bulb', 15) + ' 语法要点</div>'
          + '<div class="card"><div class="u-fs14 u-tl">' + esc(u.grammar) + '</div></div>';
      }
      body().innerHTML = h;
    }, true);
  }

  /* ---------------- 开始练习：难度弹层 → 答题 ---------------- */
  function startPractice(bid, uid, presetDiff) {
    const b = getBook(bid), u = getUnit(bid, uid);
    if (!b || !u) return;
    const run = function (diff) {
      const list = buildQuestions(bid, uid, diff, 20);
      if (!list.length) {
        body().innerHTML = '<div class="card"><div class="u-fs15">该单元题目生成失败，请换个单元试试。</div></div>';
        return;
      }
      QS.book = b; QS.unit = u; QS.diff = diff;
      QS.list = list; QS.idx = 0; QS.results = [];
      QS.startTime = Date.now(); QS.finished = false; QS.confirmed = false;
      renderQuiz();
    };
    if (typeof openPracticeSettings === 'function') {
      openPracticeSettings({
        title: 'Unit ' + u.no + ' · ' + u.title,
        note: '每次固定 20 题 · 题型按难度自动配比',
        okText: '开始练习',
        value: presetDiff || 1,
        onStart: run
      });
    } else {
      run(presetDiff || 1);
    }
  }

  /* ---------------- 答题渲染 ---------------- */
  function renderQuiz() {
    const q = QS.list[QS.idx];
    if (!q) { finish(); return; }
    const total = QS.list.length;
    const i = QS.idx;
    const res = QS.results[i];
    setV('Unit ' + QS.unit.no + ' 练习', function () {
      let h = '<div class="card">'
        + '<div class="u-flex u-between u-ac">'
        + '<div class="u-fs14 u-fw600">第 ' + (i + 1) + ' / ' + total + ' 题</div>'
        + '<span class="pill">' + esc(q.tag) + '</span></div>'
        + '<div class="progress-bar u-mt6"><div class="progress-bar-fill ' + wpClass((i + 1) / total * 100) + '"></div></div>'
        + '</div>';
      h += '<div class="card u-mt8"><div class="u-fs15 u-tl u-fw600">' + esc(q.question) + '</div>';
      if (q.type === 'choice') {
        h += '<div class="options-grid u-mt10">';
        const L = ['A', 'B', 'C', 'D'];
        (q.options || []).forEach(function (op, oi) {
          let cls = 'option-btn';
          if (res) {
            if (op === q.answer) cls += ' correct';
            else if (op === res.ua) cls += ' wrong';
          } else if (res === undefined && QS.pick === oi) cls += ' selected';
          h += '<button class="' + cls + '" onclick="PEPQ.pick(' + oi + ')">'
            + '<span class="option-label">' + L[oi] + '</span>'
            + '<span class="u-f1">' + esc(op) + '</span></button>';
        });
        h += '</div>';
      } else {
        const disabled = res ? ' disabled' : '';
        h += '<div class="u-mt10"><input id="pepFill" class="answer-input" type="text" '
          + 'autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="在这里写出答案" '
          + 'value="' + esc(res ? res.ua : '') + '"' + disabled + '></div>';
        if (!res) {
          h += '<div class="btn-row u-mt8"><button class="btn-primary u-f1" onclick="PEPQ.submitFill()">提交答案</button></div>';
        }
      }
      if (res) {
        h += '<div class="feedback show ' + (res.correct ? 'correct' : 'wrong') + '">'
          + (res.correct ? '✓ 答对了！' : '✗ 答错了。正确答案：' + esc(q.answer))
          + (q.explain ? '<div class="correct-answer">' + esc(q.explain) + '</div>' : '')
          + '</div>';
      }
      h += '</div>';
      h += '<div class="btn-row u-mt8">';
      if (i > 0) h += '<button class="btn-ghost u-f1" onclick="PEPQ.jump(' + (i - 1) + ')">上一题</button>';
      if (res) {
        if (i < total - 1) h += '<button class="btn-primary u-f1" onclick="PEPQ.jump(' + (i + 1) + ')">下一题</button>';
        else h += '<button class="btn-primary u-f1" onclick="PEPQ.finish()">交卷看成绩</button>';
      }
      h += '</div>';
      h += '<div class="btn-row u-mt8"><button class="btn-ghost u-f1" onclick="PEPQ.finish()">提前交卷</button></div>';
      body().innerHTML = h;
    }, true);
  }
  function pick(oi) {
    const i = QS.idx, q = QS.list[i];
    if (!q || QS.results[i]) return;
    const ua = q.options[oi];
    const ok = judge(q, ua);
    QS.results[i] = { ua: ua, correct: ok };
    renderQuiz();
  }
  function submitFill() {
    const i = QS.idx, q = QS.list[i];
    if (!q || QS.results[i]) return;
    const el = document.getElementById('pepFill');
    const ua = el ? el.value : '';
    if (String(ua).trim() === '') { try { if (el) el.focus(); } catch (e) {} return; }
    QS.results[i] = { ua: ua, correct: judge(q, ua) };
    renderQuiz();
  }
  function jump(i) {
    if (i < 0 || i >= QS.list.length) return;
    QS.idx = i;
    renderQuiz();
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  /* ---------------- 交卷：成绩页（第一段） ---------------- */
  function finish() {
    const total = QS.list.length;
    let score = 0;
    QS.results.forEach(function (r) { if (r && r.correct) score++; });
    QS.finished = true; QS.confirmed = false;
    const acc = total ? Math.round(score / total * 100) : 0;
    const dur = QS.startTime ? Math.round((Date.now() - QS.startTime) / 1000) : 0;

    // 错题入库 + 正确率 + 历史
    const wrongItems = [];
    QS.list.forEach(function (q, i) {
      const r = QS.results[i];
      if (r && !r.correct) {
        addWrongUnit(q, r.ua, QS.book, QS.unit);
        wrongItems.push({ question: q.question, answer: q.answer, userAnswer: r.ua });
      }
    });
    if (total > 0) {
      recordAccuracy(QS.unit.id, QS.book.name + ' Unit ' + QS.unit.no + ' · ' + QS.unit.title, score, total);
      recordHistory(QS.book, QS.unit, QS.diff, score, total, wrongItems);
      syncCloud();
    }

    let lv = { label: '需努力', cls: 'bad', stars: '' };
    try { if (typeof getGradeLevel === 'function') lv = getGradeLevel(acc) || lv; } catch (e) {}
    let comment = '';
    try {
      if (typeof generateTeacherComment === 'function') {
        comment = generateTeacherComment(score, total, acc, wrongItems, QS.book.grade, false);
      }
    } catch (e) { comment = ''; }

    setV('练习成绩', function () {
      let h = '<div class="result-card">'
        + '<div class="result-title">' + lv.label + (lv.stars ? ' ' + lv.stars : '') + '</div>'
        + '<div class="result-score">' + score + '<span class="total"> / ' + total + '</span></div>'
        + '<div class="u-fs15 u-fw600">' + esc(QS.book.label) + ' Unit ' + QS.unit.no + ' · ' + esc(QS.unit.title) + '</div>'
        + '<div class="unit-meta u-mt6">正确率 ' + acc + '%'
        + (dur ? ' · 用时 ' + fmtDur(dur) : '') + '</div>'
        + '<div class="u-mt8 u-fs14">答对 ' + score + ' 题，答错 ' + (total - score) + ' 题</div>';
      if (comment) h += '<div class="teacher-comment u-mt10">' + comment + '</div>';
      h += '<div class="btn-row u-mt10">'
        + '<button class="btn-primary u-f1" onclick="PEPQ.confirmScore()">确认成绩</button></div>'
        + '<div class="btn-row u-mt8">'
        + '<button class="btn-ghost u-f1" onclick="PEPQ.startPractice(\'' + QS.book.id + '\',\'' + QS.unit.id + '\',' + QS.diff + ')">'
        + icon('refresh', 16) + '再练一次</button>'
        + '<button class="btn-ghost u-f1" onclick="PEPQ.openUnit(\'' + QS.book.id + '\',\'' + QS.unit.id + '\')">返回单元</button>'
        + '</div></div>';
      body().innerHTML = h;
      try { window.scrollTo(0, 0); } catch (e) {}
    }, true);
  }
  function fmtDur(sec) {
    try { if (typeof formatDuration === 'function') return formatDuration(sec); } catch (e) {}
    sec = sec || 1;
    const m = Math.floor(sec / 60), s = sec % 60;
    return m ? (m + ' 分 ' + s + ' 秒') : (s + ' 秒');
  }

  /* ---------------- 答案与解析（第二段） ---------------- */
  function confirmScore() {
    QS.confirmed = true;
    const total = QS.list.length;
    let score = 0;
    QS.results.forEach(function (r) { if (r && r.correct) score++; });
    setV('答案与解析', function () {
      let h = '<div class="card">'
        + '<div class="u-fw700 u-fs16">' + esc(QS.book.label) + ' Unit ' + QS.unit.no + '</div>'
        + '<div class="unit-meta u-mt4">得分 ' + score + ' / ' + total
        + ' · 正确率 ' + (total ? Math.round(score / total * 100) : 0) + '%</div></div>';
      h += '<div class="section-title">逐题解析</div>';
      QS.list.forEach(function (q, i) {
        const r = QS.results[i] || { ua: '', correct: false };
        h += '<div class="m-answer-item ' + (r.correct ? 'ok' : 'bad') + '">'
          + '<div class="u-fs13 u-c-lighter">第 ' + (i + 1) + ' 题 · ' + esc(q.tag) + '</div>'
          + '<div class="u-fs14 u-tl u-mt4">' + esc(q.question) + '</div>'
          + '<div class="u-fs13 u-mt4">你的答案：<b class="' + (r.correct ? 'u-c-ok' : 'u-c-bad') + '">'
          + esc(r.ua || '（未作答）') + '</b>　正确答案：<b class="u-c-ok">' + esc(q.answer) + '</b></div>'
          + (q.explain ? '<div class="unit-meta u-tl u-mt4">' + esc(q.explain) + '</div>' : '')
          + '</div>';
      });
      h += '<div class="btn-row u-mt10">'
        + '<button class="btn-primary u-f1" onclick="PEPQ.startPractice(\'' + QS.book.id + '\',\'' + QS.unit.id + '\',' + QS.diff + ')">再练一次</button>'
        + '<button class="btn-ghost u-f1" onclick="PEPQ.openBook(\'' + QS.book.id + '\')">返回单元列表</button></div>';
      body().innerHTML = h;
      try { window.scrollTo(0, 0); } catch (e) {}
    }, true);
  }

  /* ============================================================
   * 对外接口
   * ============================================================ */
  window.PEPQ = {
    meta: function () { return (window.PEP && window.PEP.meta) || {}; },
    books: books,
    getBook: getBook,
    getUnit: getUnit,
    buildQuestions: buildQuestions,
    judge: judge,
    // 移动端视图
    home: home,
    openBook: openBook,
    openUnit: openUnit,
    startPractice: startPractice,
    pick: pick,
    submitFill: submitFill,
    jump: jump,
    finish: finish,
    confirmScore: confirmScore,
    // 调试/测试用
    _state: QS
  };
  window.pepHome = home;
})();
