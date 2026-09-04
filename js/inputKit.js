/* ============================================================
 * js/inputKit.js —— v84 零打字输入工具箱（window.InputKit）
 *
 * 背景（产品定位，2026-09-01 确立）：
 *   纸质同步练习/试卷承担「书写 + 计算过程」训练；
 *   本网站只负责「快速测出掌握情况」，孩子不会打字，
 *   因此任何题目都不允许「必须打字才能作答」。
 *
 * 本文件只做一件事：给填空题挂上「点选面板」，让孩子用手指点出答案。
 * 设计上刻意做到三点：
 *   ① 零侵入 —— 不改任何判分逻辑。面板只是往原输入框里写字符，
 *      readFillAnswer() / fillAnswerEquals() / PC.submit() 全部原样工作。
 *   ② 可降级 —— 若本文件未加载，render() 返回空串、输入框不带 readonly，
 *      孩子仍能正常打字，不存在「面板挂了就答不了题」。
 *   ③ 四端共用 —— 移动端数学 / 移动端语文 / 移动端英语 / PC 端 pc.js
 *      共用同一套面板与事件委托，不出现四份分叉实现。
 *
 * 用法（渲染层，两行）：
 *     html += (window.InputKit ? InputKit.render(item) : '');
 *     ...innerHTML = html;  if (window.InputKit) InputKit.bind(container);
 *   输入框上要带 class="ik-target"（多空题每个空都带）。
 *
 * 输入模式由答案形态自动推断（detect），题库层日后可写 item.input={mode:'int'}
 * 显式指定，显式优先。
 * ============================================================ */
(function (global) {
  'use strict';

  var MODE = {
    NONE: 'none',    // 不需要面板（选择题/判断题，或答案形态无法点选）
    INT: 'int',      // 纯整数      例：25
    NUM: 'num',      // 小数        例：3.14
    FRAC: 'frac',    // 分数        例：3/4
    EXPR: 'expr',    // 算式        例：2+3×4
    WORD: 'word',    // 逐空词卡（P3 接入）：候选词点选
    TOKENS: 'tokens' // 词块拼句（P2 接入）：乱序词块点选拼句子
  };

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function trim(s) { return String(s == null ? '' : s).trim(); }
  function closest(el, sel) {
    if (!el) return null;
    if (el.closest) return el.closest(sel);
    var p = el;
    while (p && p.nodeType === 1) {
      if (p.matches && p.matches(sel)) return p;
      p = p.parentNode;
    }
    return null;
  }

  /* ---------------- 答案形态判定 ----------------
   * 只判「这一个空」的答案串，不做题面正则（题面千变万化，正则必漏）。
   * 返回 int/num/frac/expr/cn/en/other/''。
   */
  function shapeOf(s) {
    s = trim(s);
    if (!s) return '';
    // 负号/纯整数：注意先判整数再判小数，避免 25 被小数分支吞掉
    if (/^-?\d+$/.test(s)) return 'int';
    if (/^-?\d*\.\d+$/.test(s)) return 'num';
    // 分数 3/4、-3/4；带分数「1又3/4」单独留给 WORD，不做点选
    if (/^-?\d+\s*\/\s*-?\d+$/.test(s)) return 'frac';
    // 算式：只含数字与运算符（含 × ÷ x X * / . ( ) 空格）
    if (/[\d]/.test(s) && /^[\d\s+\-*×÷xX\/\.\(\)（）%]+$/.test(s)) return 'expr';
    if (/[\u4e00-\u9fa5]/.test(s)) return 'cn';
    if (/^[A-Za-z][A-Za-z0-9\s'’\-]*$/.test(s)) return 'en';
    return 'other';
  }

  /* 多空拆分：只在答案含中文逗号/顿号/半角逗号时才拆。
   * 不能按 / 拆 —— 「3/4」是分数不是两个空。 */
  function splitAnswer(raw) {
    var s = trim(raw);
    if (!s) return [];
    if (/[,，、]/.test(s)) {
      return s.split(/[,，、]+/).map(trim).filter(function (x) { return x !== ''; });
    }
    return [s];
  }

  /* ---------------- 输入模式推断 ---------------- */
  function detect(item) {
    if (!item) return MODE.NONE;

    // ① 题库层显式元信息最优先（P2/P3 起题库会写死 input:{mode:'choice'|'tokens'|...}）
    var meta = item.input;
    if (meta && meta.mode) return meta.mode;

    // ② 只有填空题才需要面板。判断题/选择题/图形题一律不挂。
    var isFill = (item.type === 'fill') || item.forceFill;
    if (!isFill) return MODE.NONE;

    // ③ 英语连词成句 / 补全句子：走词块拼句
    if (item.tag === '连词成句' || item.tag === '补全句子') return MODE.TOKENS;

    // ④ 按答案形态推断；多空时逐空判，形态不一致就放弃（保留原生输入更安全）
    var parts = splitAnswer(item.answer);
    if (!parts.length) return MODE.NONE;
    var first = shapeOf(parts[0]);
    for (var i = 1; i < parts.length; i++) {
      if (shapeOf(parts[i]) !== first) return MODE.NONE;
    }
    if (first === 'int') return MODE.INT;
    if (first === 'num') return MODE.NUM;
    if (first === 'frac') return MODE.FRAC;
    if (first === 'expr') return MODE.EXPR;
    // cn / en / other：点选词卡需要候选池，交给 P1（语文看拼音写词语）
    // P2（英语单词拼写）P3（数学概念题）在题库层改造成选择题，此处不挂面板。
    return MODE.NONE;
  }

  /* ---------------- 键盘布局 ----------------
   * 5 列网格。数字键键高 52px / 字号 20px（移动端单手点选不误触）。
   * 分层设计：默认只出 0-9，数学填空 85% 是纯整数，3-4 次点击即可答完。
   */
  var LAYOUTS = {
    int: [
      ['1', '2', '3', '4', '5'],
      ['6', '7', '8', '9', '0'],
      // v84：负数答案（如 6下「负数」单元计算题）也能点选；'-' 与数字同列，不影响正数作答
      ['-', { t: '← 删除', a: 'back', s: 2 }, { t: '清空', a: 'clear', s: 2 }]
    ],
    num: [
      ['1', '2', '3', '4', '5'],
      ['6', '7', '8', '9', '0'],
      ['.', { t: '← 删除', a: 'back', s: 2 }, { t: '清空', a: 'clear', s: 2 }]
    ],
    frac: [
      ['1', '2', '3', '4', '5'],
      ['6', '7', '8', '9', '0'],
      ['/', { t: '← 删除', a: 'back', s: 2 }, { t: '清空', a: 'clear', s: 2 }]
    ],
    expr: [
      ['1', '2', '3', '4', '5'],
      ['6', '7', '8', '9', '0'],
      ['+', '-', '×', '÷', '.'],
      ['(', ')', { t: '←', a: 'back' }, { t: '清空', a: 'clear', s: 2 }]
    ]
  };

  function keyHtml(k) {
    var o = (typeof k === 'string') ? { t: k, v: k } : k;
    var span = o.s ? ' style="grid-column:span ' + o.s + '"' : '';
    var act = o.a
      ? ' data-ik-act="' + o.a + '"'
      : ' data-ik-act="ch" data-ik-v="' + esc(o.v != null ? o.v : o.t) + '"';
    return '<button type="button" class="ik-key' + (o.a ? ' ik-fn' : '') + '"' + act + span + '>' + esc(o.t) + '</button>';
  }

  /* ---------------- v96: 分数上下叠放输入 ----------------
   * 孩子不需要理解"/"符号，直接点分子和分母数字。
   * 界面：上下叠放分数预览（分子/分数线/分母）+ 数字键盘 + 分子/分母切换
   * 逻辑：先填分子，分子填1位后自动跳分母；点"分子"/"分母"可手动切换
   * 输入框值实时更新为"分子/分母"格式 */
  function fracHtml(item) {
    var ans = String((item && item.answer) || '');
    var h = '<div class="ik ik-fracpad" data-ik-mode="frac">';
    // 分数预览区
    h += '<div class="ik-frac-preview">';
    h += '<div class="ik-frac-num" data-ik-role="num-display">?</div>';
    h += '<div class="ik-frac-line"></div>';
    h += '<div class="ik-frac-den" data-ik-role="den-display">?</div>';
    h += '</div>';
    // 当前输入位置提示
    h += '<div class="ik-frac-hint">当前输入：<span data-ik-role="cur-pos">分子</span></div>';
    // 数字键盘
    h += '<div class="ik-grid ik-frac-keys">';
    var nums = ['1','2','3','4','5','6','7','8','9','0'];
    for (var i = 0; i < nums.length; i++) {
      h += '<button type="button" class="ik-key ik-frac-num-key" data-ik-act="fracnum" data-ik-v="' + nums[i] + '">' + nums[i] + '</button>';
    }
    h += '</div>';
    // 功能键：分子/分母切换、删除、清空
    h += '<div class="ik-frac-actions">';
    h += '<button type="button" class="ik-key ik-frac-switch" data-ik-act="fracpos" data-ik-v="num">分子</button>';
    h += '<button type="button" class="ik-key ik-frac-switch" data-ik-act="fracpos" data-ik-v="den">分母</button>';
    h += '<button type="button" class="ik-key" data-ik-act="fracback">← 删除</button>';
    h += '<button type="button" class="ik-key" data-ik-act="fracclear">清空</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function numpadHtml(mode) {
    var rows = LAYOUTS[mode];
    if (!rows) return '';
    var h = '<div class="ik ik-numpad" data-ik-mode="' + mode + '"><div class="ik-grid">';
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) h += keyHtml(rows[r][c]);
    }
    return h + '</div></div>';
  }

  /* ---------------- 逐空词卡（P3 接入） ----------------
   * 候选词来自 item.input.cands（题库层给）或 item.cands。
   * 没有候选池就不渲染 —— 凭空造选项等于让孩子瞎猜。 */
  function wordHtml(item) {
    var cands = (item.input && item.input.cands) || item.cands || [];
    if (!cands || !cands.length) return '';
    var h = '<div class="ik ik-wordpad" data-ik-mode="word"><div class="ik-words">';
    for (var i = 0; i < cands.length; i++) {
      h += '<button type="button" class="ik-key ik-word" data-ik-act="ch" data-ik-v="' + esc(cands[i]) + '">' + esc(cands[i]) + '</button>';
    }
    return h + '</div></div>';
  }

  /* ---------------- 词块拼句（P2 接入） ----------------
   * 铁律：必须乱序。若按答案顺序展示词块，孩子照抄即可，零考核价值。
   * 乱序结果缓存在 item._ikTok，避免 PC 端重渲染时顺序跳变。 */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function tokensHtml(item) {
    var toks = (item.input && item.input.tokens) || item.tokens || [];
    if (!toks || !toks.length) return '';
    if (!item._ikTok) item._ikTok = shuffle(toks);
    var h = '<div class="ik ik-tokenpad" data-ik-mode="tokens">';
    h += '<div class="ik-sel" data-ik-role="sel"><span class="ik-sel-ph">点下面的词块，按顺序拼成句子</span></div>';
    h += '<div class="ik-tokens">';
    for (var i = 0; i < item._ikTok.length; i++) {
      h += '<button type="button" class="ik-tok" data-ik-act="tok" data-ik-i="' + i + '">' + esc(item._ikTok[i]) + '</button>';
    }
    return h + '</div></div>';
  }

  /* ============================================================
   * v84 · P3：数学概念/短语/多空填空题 → 零打字化
   * ------------------------------------------------------------
   * 触发场景：数学题库里有一大类填空题答案是「概念词 / 判断词 / 短语」
   * （如 直线/线段/射线、锐角/直角、对/错、能/不能、东/南/西/北、
   *  「4个十和6个一」「9点整」「顶点,边」），这些 InputKit 的数字键盘
   *   点不出来，孩子只能打字 —— 违反「任何题不许必须打字」铁律。
   *
   * 这里统一在「渲染前」把这类题改写成可点选形态：
   *   · 判断/方向/方法等「封闭小集合」答案 → 选择题（选项=该封闭集）
   *   · 单概念词 / 短语               → 选择题（干扰项取自「同单元兄弟题答案」，
   *                                     同源同类，杜绝一眼假；不足再补模式变换/通用概念池）
   *   · 多空概念题（顶点,边）         → 保留填空，但加「逐空词卡」候选池，
   *                                     孩子点词作答，不打字。
   *
   * 设计要点：
   *   ① 零侵入：只给题加 type/options/input，判分逻辑（ua===answer / fillAnswerEquals）
   *      原样工作，选择题答案仍是原 answer 串。
   *   ② 幂等：改写后打 _ikNorm 标记，重复调用直接返回，跨端（移动/PC）一致。
   *   ③ 同源优先：干扰项第一来源是「本次测验里同一单元的其他概念题答案」，
   *      保证考点一致；只有同单元兄弟不足时才退到模式变换 / 通用概念池。
   * ============================================================ */

  // 封闭小集合（答案 ∈ 集合 → 选项 = 集合），保证同源、零一眼假
  var BINARY = {
    '对': ['对', '错'], '错': ['对', '错'],
    '能': ['能', '不能'], '不能': ['能', '不能'],
    '是': ['是', '不是'], '不是': ['是', '不是'],
    '真': ['真', '假'], '假': ['真', '假'],
    '相同': ['相同', '不同'], '不同': ['相同', '不同'],
    '相等': ['相等', '不相等'], '不相等': ['相等', '不相等'],
    '稳定': ['稳定', '不稳定'], '不稳定': ['稳定', '不稳定'],
    '相邻': ['相邻', '不相邻'], '不相邻': ['相邻', '不相邻'],
    '冲突': ['冲突', '不冲突'], '不冲突': ['冲突', '不冲突'],
    '变': ['变', '不变'], '不变': ['变', '不变'],
    '大': ['大', '小'], '小': ['大', '小'],
    '大月': ['大月', '小月'], '小月': ['大月', '小月'],
    '开放': ['开放', '封闭'], '封闭': ['开放', '封闭'],
    '相交': ['相交', '平行'], '平行': ['相交', '平行'],
    '垂直': ['垂直', '平行'],
    '轴对称': ['轴对称', '中心对称'], '中心对称': ['轴对称', '中心对称'],
    '平移': ['平移', '旋转'], '旋转': ['平移', '旋转'],
    '放大': ['放大', '缩小'], '缩小': ['放大', '缩小']
  };
  var ANGLE5 = ['锐', '直', '钝', '平', '周'];   // 单字角类（"它是（ ）角"→钝）
  var METHOD4 = ['乘法', '除法', '加法', '减法'];
  var OP4 = ['乘', '除', '加', '减'];
  var DIR4 = ['东', '南', '西', '北'];
  var POS4 = ['上', '下', '左', '右'];

  // 通用概念兜底池（仅在同单元兄弟 + 模式变换都凑不够 3 个干扰项时启用）。
  // 以几何/概念术语为主，尽量同源，避免与低频答案严重违和。
  var GLOBAL_CONCEPT_POOL = [
    '锐角', '直角', '钝角', '平角', '周角', '直线', '线段', '射线',
    '顶点', '边', '平行', '垂直', '对称轴', '周长', '面积', '体积',
    '整数', '小数', '分数', '分子', '分母', '奇数', '偶数', '质数', '合数',
    '因数', '倍数', '周长', '表面积', '质量', '长度', '高度', '底'
  ];

  function closedSetFor(a) {
    if (BINARY[a]) return BINARY[a].slice();
    if (ANGLE5.indexOf(a) >= 0) return ANGLE5.slice();
    if (METHOD4.indexOf(a) >= 0) return METHOD4.slice();
    if (OP4.indexOf(a) >= 0) return OP4.slice();
    if (DIR4.indexOf(a) >= 0) return DIR4.slice();
    if (POS4.indexOf(a) >= 0) return POS4.slice();
    return null;
  }

  // 是否可作为「同源概念干扰项候选」的答案：含中文的概念/短语/数的组成/时间/计数均可
  function isConceptAnswer(x) {
    var a = String(x == null ? '' : x).trim();
    if (!a) return false;
    if (!/[一-龥]/.test(a)) return false;              // 必须含中文（纯数/算式不是概念干扰项）
    return a.length >= 1 && a.length <= 10;
  }

  // 从本次测验的兄弟题里收集同单元/同类型的概念答案（排除自身与本题答案）
  function siblingConcepts(item, allItems, n) {
    var uName = item._unitName, uType = item._unitType;
    var pool = (allItems || []).filter(function (x) {
      return x && x !== item && isConceptAnswer(x.answer);
    });
    var byUnit = uName ? pool.filter(function (x) { return x._unitName === uName; }) : [];
    var byType = (!uName && uType) ? pool.filter(function (x) { return x._unitType === uType; }) : [];
    var src = byUnit.length >= 2 ? byUnit : (byType.length >= 2 ? byType : pool);
    var others = src.filter(function (x) {
      return String(x.answer).trim() !== String(item.answer).trim();
    });
    return shuffle(others).slice(0, n).map(function (x) { return String(x.answer).trim(); });
  }

  // 模式变换干扰项：针对「数的组成 / 时间 / 计数」等可程序化派生的短语答案
  function transformDistractors(a) {
    var out = [];
    // 数的组成：a个十和b个一 / a个十 / a个一（多派生几个候选，确保回文数也有≥3个不同干扰项）
    var m = a.match(/^(\d+)个(十|百|千)(和(\d+)个(一|十))?$/);
    if (m) {
      var big = +m[1], unit = m[2], small = m[4] ? +m[4] : null, sunit = m[5] || null;
      var cands = [];
      if (small != null) {
        cands.push(small + '个' + unit + '和' + big + '个' + sunit);                 // 交换
        cands.push(big + '个百和' + small + '个' + sunit);                           // 十位升一级
        cands.push((big + 1) + '个' + unit + '和' + small + '个' + sunit);           // 十位 +1
        cands.push(big + '个' + unit + '和' + (small + 1) + '个' + sunit);           // 个位 +1
        cands.push((big - 1 > 0 ? big - 1 : big + 1) + '个' + unit + '和' + small + '个' + sunit); // 十位 -1
      } else {
        cands.push(big + '个百', big + '个一', big + '个千', (big + 1) + '个十');
      }
      return cands.filter(function (x) { return x && x !== a; });
    }
    // 时间：a点整/半/一刻/三刻
    var t = a.match(/^(\d+)点(整|半|一刻|三刻)$/);
    if (t) {
      var h = +t[1], spec = t[2];
      var specs = ['整', '半', '一刻', '三刻'].filter(function (s) { return s !== spec; });
      out.push(h + '点' + specs[0]);
      out.push(h + '点' + specs[1]);
      out.push(((h % 12) + 1) + '点' + spec);
    }
    // 计数：a个数 / a个面 / a个顶点 ……
    var c = a.match(/^(\d+)(个(数|面|顶点|条|个))$/);
    if (c) {
      var num = +c[1], tail = c[2];
      out.push((num + 1) + tail);
      out.push((num - 1 > 0 ? num - 1 : num + 2) + tail);
      out.push((num + 2) + tail);
    }
    return out.filter(function (x) { return x && x !== a; });
  }

  function buildChoices(item, a, allItems) {
    var opts = [];
    opts = opts.concat(siblingConcepts(item, allItems, 6));
    opts = opts.concat(transformDistractors(a));
    opts = opts.concat(GLOBAL_CONCEPT_POOL);
    // 去重、排除正确答案、截到 5 个候选，再取前 3 个作干扰项
    var seen = {};
    opts = opts.filter(function (o) {
      if (!o || o === a) return false;
      if (seen[o]) return false; seen[o] = 1; return true;
    }).slice(0, 5);
    var distract = opts.slice(0, 3);
    if (distract.length < 3) return null;   // 理论上 GLOBAL 池兜底，不会到这
    return shuffle([a].concat(distract));
  }

  function convertToChoice(item, choices) {
    if (!choices || choices.length < 2) return;
    var cs = choices.slice();
    // v85：渲染层只排 A~D 四个位置。封闭集合里角类 ANGLE5=[锐,直,钝,平,周] 有 5 项，
    // 旧版原样塞进 options，答题页靠 fromCharCode 兜出个「E」，而打印视图与错题本导出
    // 用的是写死的 labels=['A','B','C','D']，第 5 项直接打成「undefined. 锐」。
    // 这里统一裁到 4 项：正确答案必留，其余随机留 3 个干扰项。
    if (cs.length > 4) {
      var ans = String(item.answer == null ? '' : item.answer).trim();
      var rest = shuffle(cs.filter(function (x) { return String(x).trim() !== ans; })).slice(0, 3);
      cs = shuffle([ans].concat(rest));
    }
    item.options = cs;
    item.type = 'choice';
    item._ikNorm = true;
    if (item.answerIdx !== undefined) delete item.answerIdx;
  }

  // 主入口：把一道「需要打字的概念/短语/多空填空」改写成可点选形态。
  // 返回改写后的题（原对象就地修改），无改写则返回原对象。
  function normalizeConceptFill(item, allItems) {
    if (!item) return item;
    if (item._ikNorm) return item;
    // 已选择题 / 判断题 / 图形选择题 / 强制数字填空（数字键盘已覆盖）：不动
    if (item.type === 'choice' || item.type === 'shape_choice' || item.judge) return item;
    // v85 P0：forceFill 是考试组卷「把这题塞进填空题区」的标记。旧版无条件早退，
    // 于是「在计数器上拨出61…」（答案「6个十和1个一」）在考试里被渲染成纯输入框——
    // 数字键盘覆盖不到中文答案，detect 返回 none，孩子不会打字直接丢分（违反零打字铁律）。
    // 现在：数字/小数/分数/算式答案键盘能覆盖 → 保留 forceFill；
    //       中文概念答案 → 撤销 forceFill，继续往下走封闭集合/词卡/选择题改写。
    if (item.forceFill) {
      var fa = String(item.answer == null ? '' : item.answer).trim();
      var fsh = shapeOf(fa);
      if (fsh === 'int' || fsh === 'num' || fsh === 'frac' || fsh === 'expr') return item;
      if (!/[一-龥]/.test(fa)) return item;
      item.forceFill = false;
    }
    if (item.input && item.input.mode) return item;
    var a = String(item.answer == null ? '' : item.answer).trim();
    if (!a) return item;
    // 数/小数/分数/算式 → InputKit 数字键盘已覆盖，不动
    var sh = shapeOf(a);
    if (sh === 'int' || sh === 'num' || sh === 'frac' || sh === 'expr') return item;

    // ① 封闭小集合（判断/方向/方法/角类）
    var closed = closedSetFor(a);
    if (closed) { convertToChoice(item, shuffle(uniqArr(closed))); return item; }

    // ② 多空概念题（顶点,边）→ 逐空词卡，不拆成选择
    if (/[,，、]/.test(a)) {
      var parts = a.split(/[,，、]+/).map(trim).filter(function (x) { return x !== ''; });
      if (parts.length >= 2 && parts.every(function (p) { return p.length <= 4 && /[一-龥]/.test(p); })) {
        var blanks = (typeof countFillBlanks === 'function') ? countFillBlanks(item) : parts.length;
        if (!blanks || blanks === parts.length) {
          var cands = uniqArr(parts.concat(siblingConcepts(item, allItems, 6)));
          item.input = { mode: 'word', cands: cands };
          item._ikNorm = true;
          return item;
        }
      }
      // 多空但形态不匹配 → 退化为选择题（干扰项同源）
      var ch = buildChoices(item, a, allItems);
      if (ch) convertToChoice(item, ch);
      return item;
    }

    // ③ 单概念词 / 短语 → 选择题
    var choices = buildChoices(item, a, allItems);
    if (choices) convertToChoice(item, choices);
    return item;
  }

  function uniqArr(arr) {
    var s = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] == null) continue;
      if (s[arr[i]]) continue; s[arr[i]] = 1; out.push(arr[i]);
    }
    return out;
  }

  /* ---------------- 对外：渲染 ----------------
   * opts.locked = true → 面板置灰不可点（本题已判分/已揭晓，防止改答案与成绩不一致） */
  function render(item, opts) {
    if (!item) return '';
    var mode = detect(item);
    if (mode === MODE.NONE) return '';
    var h = '';
    if (mode === MODE.WORD) h = wordHtml(item);
    else if (mode === MODE.TOKENS) h = tokensHtml(item);
    else if (mode === MODE.FRAC) h = fracHtml(item);  // v96: 分数上下叠放输入
    else h = numpadHtml(mode);
    if (h && opts && opts.locked) h = h.replace('<div class="ik ', '<div class="ik locked ');
    return h;
  }

  /* ---------------- 作用域：面板 ↔ 输入框配对 ----------------
   * 面板本身不带 id（四端结构各不相同），改为从面板向上找最近的
   * 「含 .ik-target 的祖先容器」，在该容器内取输入框。
   * 这样同页面出现多个面板也不会互相串。 */
  function targetsOf(el) {
    var p = el ? el.parentNode : null, i = 0;
    while (p && i < 8) {
      if (p.querySelectorAll) {
        var t = p.querySelectorAll('.ik-target');
        if (t && t.length) return t;
      }
      p = p.parentNode; i++;
    }
    return document.querySelectorAll('.ik-target');
  }

  function activeOf(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].classList && list[i].classList.contains('ik-active')) return list[i];
    }
    return list[0] || null;
  }

  function setActive(el) {
    var list = targetsOf(el);
    for (var i = 0; i < list.length; i++) {
      if (list[i].classList) list[i].classList.toggle('ik-active', list[i] === el);
    }
  }

  function fire(el) {
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {
      try {
        var ev = document.createEvent('Event');
        ev.initEvent('input', true, true);
        el.dispatchEvent(ev);
      } catch (e2) {}
    }
  }

  function insert(el, ch) {
    // readOnly 只挡用户键盘，不挡 JS 写 value —— 这里正是要写。
    // disabled 才是「已交卷锁定」，必须拒绝。
    if (!el || el.disabled) return;
    var v = String(el.value || '');
    if (v.length >= 40) return;
    el.value = v + ch;
    fire(el);
  }
  function backspace(el) {
    if (!el || el.disabled) return;
    el.value = String(el.value || '').slice(0, -1);
    fire(el);
  }
  function clearOne(el) {
    if (!el || el.disabled) return;
    el.value = '';
    fire(el);
  }

  /* ---------------- 事件委托（全局只装一次） ---------------- */
  var installed = false;

  function onClick(e) {
    var t = e.target;
    if (!t || t.nodeType !== 1) return;

    // 词块移除（已选区里的 ×）
    var del = closest(t, '.ik-sel-item');
    if (del) {
      var pad = closest(del, '.ik-tokenpad');
      if (pad) removeToken(pad, del.getAttribute('data-ik-i'));
      return;
    }

    // 面板按键
    var key = closest(t, '.ik-key, .ik-tok');
    if (key) {
      e.preventDefault();
      handleKey(key);
      return;
    }

    // 点击输入框 → 切换当前空（多空题）
    var inp = closest(t, '.ik-target');
    if (inp) { setActive(inp); return; }
  }

  function handleKey(key) {
    var act = key.getAttribute('data-ik-act');
    var list = targetsOf(key);
    var target = activeOf(list);
    if (!target) return;

    if (act === 'ch') { insert(target, key.getAttribute('data-ik-v')); return; }
    if (act === 'back') { backspace(target); return; }
    if (act === 'clear') { clearOne(target); return; }
    if (act === 'tok') { pushToken(key, target); return; }
    // v96: 分数输入处理
    if (act === 'fracnum') { fracInput(key, target, 'num'); return; }
    if (act === 'fracpos') { fracSwitch(key, target, key.getAttribute('data-ik-v')); return; }
    if (act === 'fracback') { fracBackspace(target); return; }
    if (act === 'fracclear') { fracClear(target); return; }
  }

  // v96: 分数输入——点数字时填当前位置（分子/分母），填完自动跳下一个
  function fracInput(key, target, pos) {
    var pad = closest(key, '.ik-fracpad');
    if (!pad) return;
    var cur = pad._fracPos || 'num';  // 当前输入位置：num/den
    var num = pad._fracNum || '';
    var den = pad._fracDen || '';
    var v = key.getAttribute('data-ik-v');
    if (cur === 'num') {
      num = (num + v).slice(-2);  // 分子最多2位
      pad._fracNum = num;
      // v97: 不自动跳分母，孩子手动点"分母"按钮切换（支持两位数分子如16/15）
    } else {
      den = (den + v).slice(-2);  // 分母最多2位
      pad._fracDen = den;
    }
    fracUpdate(pad, target);
  }

  // v96: 切换分子/分母输入位置
  function fracSwitch(key, target, pos) {
    var pad = closest(key, '.ik-fracpad');
    if (!pad) return;
    pad._fracPos = pos;
    fracUpdate(pad, target);
  }

  // v96: 分数删除——删除当前位置最后一位，当前位置空了跳上一个
  function fracBackspace(target) {
    var pad = target ? closest(target, '.ik-fracpad') : null;
    if (!pad) {
      var active = document.activeElement;
      pad = active ? closest(active, '.ik-fracpad') : null;
    }
    if (!pad) return;
    var cur = pad._fracPos || 'num';
    var num = pad._fracNum || '';
    var den = pad._fracDen || '';
    if (cur === 'den' && den) {
      den = den.slice(0, -1);
      pad._fracDen = den;
      if (!den) pad._fracPos = 'num';
    } else if (cur === 'num' && num) {
      num = num.slice(0, -1);
      pad._fracNum = num;
    } else if (cur === 'den' && !den && num) {
      pad._fracPos = 'num';
    }
    fracUpdate(pad, target);
  }

  // v96: 分数清空
  function fracClear(target) {
    var pad = target ? closest(target, '.ik-fracpad') : null;
    if (!pad) {
      var active = document.activeElement;
      pad = active ? closest(active, '.ik-fracpad') : null;
    }
    if (!pad) return;
    pad._fracNum = '';
    pad._fracDen = '';
    pad._fracPos = 'num';
    fracUpdate(pad, target);
  }

  // v96: 更新分数预览和输入框值
  function fracUpdate(pad, target) {
    var num = pad._fracNum || '';
    var den = pad._fracDen || '';
    var cur = pad._fracPos || 'num';
    // 更新预览
    var numEl = pad.querySelector('[data-ik-role="num-display"]');
    var denEl = pad.querySelector('[data-ik-role="den-display"]');
    var posEl = pad.querySelector('[data-ik-role="cur-pos"]');
    if (numEl) numEl.textContent = num || '?';
    if (denEl) denEl.textContent = den || '?';
    if (posEl) posEl.textContent = cur === 'num' ? '分子' : '分母';
    // 高亮当前位置
    if (numEl) numEl.classList.toggle('ik-frac-active', cur === 'num');
    if (denEl) denEl.classList.toggle('ik-frac-active', cur === 'den');
    // v97: 分子已输入但还在分子位置时，高亮分母按钮提示切换
    var denBtn = pad.querySelector('[data-ik-act="fracpos"][data-ik-v="den"]');
    if (denBtn) {
      denBtn.classList.toggle('ik-frac-hint', cur === 'num' && num.length > 0);
    }
    // 更新输入框值为"分子/分母"格式
    if (target && num && den) {
      target.value = num + '/' + den;
      fire(target);
    } else if (target) {
      target.value = '';
      fire(target);
    }
  }

  /* 词块拼句：把词块追加到当前空，并把按钮标记为已用 */
  function pushToken(key, target) {
    var pad = closest(key, '.ik-tokenpad');
    var i = key.getAttribute('data-ik-i');
    key.classList.add('used');
    var v = String(target.value || '');
    target.value = v ? (v + ' ' + key.textContent) : key.textContent;
    fire(target);
    renderSel(pad, target);
  }

  function removeToken(pad, i) {
    var target = activeOf(targetsOf(pad));
    if (!target) return;
    // 已选词存在 data-ik-picked 里（保证可撤销）
    var picked = pad._picked || [];
    var idx = picked.indexOf(i);
    if (idx >= 0) picked.splice(idx, 1);
    pad._picked = picked;
    var btns = pad.querySelectorAll('.ik-tok');
    for (var k = 0; k < btns.length; k++) {
      btns[k].classList.toggle('used', picked.indexOf(btns[k].getAttribute('data-ik-i')) >= 0);
    }
    target.value = picked.map(function (n) {
      for (var m = 0; m < btns.length; m++) {
        if (btns[m].getAttribute('data-ik-i') === n) return btns[m].textContent;
      }
      return '';
    }).join(' ');
    fire(target);
    renderSel(pad, target);
  }

  function renderSel(pad, target) {
    var sel = pad ? pad.querySelector('[data-ik-role="sel"]') : null;
    if (!sel) return;
    var words = String(target.value || '').split(/\s+/).filter(function (x) { return x; });
    if (!words.length) {
      sel.innerHTML = '<span class="ik-sel-ph">点下面的词块，按顺序拼成句子</span>';
      return;
    }
    var h = '';
    for (var i = 0; i < words.length; i++) {
      h += '<span class="ik-sel-item">' + esc(words[i]) + '<span class="ik-x">×</span></span>';
    }
    sel.innerHTML = h;
  }

  /* ---------------- 对外：绑定 ----------------
   * 渲染层写完 innerHTML 后同步调用。做两件事：
   *   ① 把带 data-ik-ro 的输入框设为只读（防手机软键盘弹出，也防孩子手输全角符号）
   *   ② 给当前作用域的第一个空加 ik-active 高亮
   * 若本文件未加载，输入框不会带 readonly —— 这是刻意的降级设计。
   */
  function bind(root) {
    var scope = root || document;
    var list = scope.querySelectorAll ? scope.querySelectorAll('[data-ik-ro]') : [];
    for (var i = 0; i < list.length; i++) {
      list[i].readOnly = true;
      try { list[i].setAttribute('inputmode', 'none'); } catch (e) {}
      if (list[i].classList) list[i].classList.add('ik-target');
    }
    // 面板渲染后：给作用域内第一个空位加高亮（多空题默认落在第 1 空）
    var panels = scope.querySelectorAll ? scope.querySelectorAll('.ik') : [];
    for (var p = 0; p < panels.length; p++) {
      var ts = targetsOf(panels[p]);
      var has = false;
      for (var k = 0; k < ts.length; k++) {
        if (ts[k].classList && ts[k].classList.contains('ik-active')) { has = true; break; }
      }
      if (!has && ts.length && ts[0].classList) ts[0].classList.add('ik-active');
    }
  }

  function install() {
    if (installed) return;
    installed = true;
    document.addEventListener('click', onClick, false);
  }

  var InputKit = {
    MODE: MODE,
    detect: detect,
    shapeOf: shapeOf,
    render: render,
    bind: bind,
    normalizeConceptFill: normalizeConceptFill,   // v84 P3：数学概念/短语/多空填空 → 零打字
    /* 便捷：渲染 + 绑定一步到位（部分渲染层用 innerHTML 后拿不到容器时可用） */
    mount: function (item, container) {
      var h = render(item);
      if (h && container) container.insertAdjacentHTML('beforeend', h);
      bind(container || document);
      return h;
    }
  };

  global.InputKit = InputKit;
  if (document.addEventListener) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install, false);
    } else {
      install();
    }
  }

  // v96: 分数上下叠放输入组件CSS
  (function() {
    var css = '.ik-fracpad{padding:12px;background:#f8f9fa;border-radius:10px;margin-top:8px;}' +
      '.ik-frac-preview{display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:8px;min-height:70px;}' +
      '.ik-frac-num,.ik-frac-den{font-size:24px;font-weight:700;color:#333;min-width:30px;text-align:center;line-height:1.3;padding:2px 8px;}' +
      '.ik-frac-num{border-bottom:2.5px solid #333;}' +
      '.ik-frac-active{color:#e74c3c;background:#fff0f0;border-radius:4px;}' +
      '.ik-frac-hint{text-align:center;font-size:12px;color:#888;margin-bottom:8px;}' +
      '.ik-frac-keys{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px;}' +
      '.ik-frac-num-key{font-size:18px;font-weight:600;padding:10px 0;background:#fff;border:1px solid #ddd;border-radius:6px;cursor:pointer;}' +
      '.ik-frac-num-key:active{background:#e8f4fd;}' +
      '.ik-frac-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}' +
      '.ik-frac-switch{font-size:13px;padding:8px 0;background:#fff;border:1px solid #ddd;border-radius:6px;cursor:pointer;}' +
      '.ik-frac-switch:active{background:#e8f4fd;}' +
      '.ik-frac-switch.ik-frac-hint{background:#fff3cd;border-color:#ffc107;color:#856404;font-weight:700;animation:ik-frac-pulse 1s infinite;}' +
      '@keyframes ik-frac-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,193,7,0.4);}50%{box-shadow:0 0 0 6px rgba(255,193,7,0);}}';
    var style = document.createElement('style');
    style.id = 'ik-frac-style-v96';
    style.textContent = css;
    if (document.head) document.head.appendChild(style);
  })();

})(window);
