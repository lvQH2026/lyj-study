/* ======================================================================
   吕泳冀学习站 · 电脑端工作台逻辑 (pc.html)
   复用现有数据/逻辑层：loadData/saveData/recordHistory 等价物、KNOWLEDGE_BASE、
   generateExamPaper、CN.data、ENG_DATA、getRecentHistory/pushRecentHistory。
   所有记录与错题统一以 module 标记写入同一份 math_practice_data，手机与 PC 互通。
   ====================================================================== */
(function () {
  'use strict';

  const C = window.APP_CONFIG || {};
  const useCloud = !!(C.USE_CLOUD && C.LEARNING_ID && C.LEARNING_PW);
  const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  /* ---------------- 导航图标（线性 SVG，跟随文字色） ---------------- */
  const ICONS = {
    math:      '<rect x="4" y="3" width="16" height="18" rx="2.5"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="15" x2="12" y2="15.01"/><line x1="16" y1="15" x2="16" y2="15.01"/>',
    chinese:   '<path d="M5 4a2 2 0 0 1 2-2h6v17H7a2 2 0 0 0-2 2V4z"/><path d="M19 4a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2V4z"/>',
    english:   '<path d="M5 18 L12 5 L19 18"/><line x1="8" y1="13.5" x2="16" y2="13.5"/>',
    home:      '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    units:     '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    exam:      '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 13l1.8 1.8 3.2-3.4"/>',
    wrong:     '<path d="M12 3l9.5 16.5H2.5z"/><line x1="12" y1="9.5" x2="12" y2="14"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    stats:     '<line x1="6" y1="20" x2="6" y2="12"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="18" y1="20" x2="18" y2="9"/><line x1="3.5" y1="20.5" x2="20.5" y2="20.5"/>',
    dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="13.5" y="12" width="7.5" height="9" rx="1.5"/><rect x="3" y="16" width="7.5" height="5" rx="1.5"/>',
    recent:    '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
    wrongdetail: '<line x1="8" y1="7" x2="20" y2="7"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="17" x2="20" y2="17"/><path d="M3.2 6.8l.9 1 1.9-2"/><path d="M3.2 11.8l.9 1 1.9-2"/>'
  };
  function icon(name) {
    const inner = ICONS[name] || ICONS.home;
    return '<svg class="pc-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function navItem(cls, label, oncl, ic) {
    return '<button class="pc-nav-item ' + cls + '" onclick="' + oncl + '">' + icon(ic) + '<span>' + label + '</span></button>';
  }

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  // v69：选项可能是字符串，也可能是 {label,value} 对象（旧生成器遗留），统一取文本
  function optText(o) {
    if (o && typeof o === 'object') return String(o.value == null ? (o.label == null ? '' : o.label) : o.value);
    return String(o == null ? '' : o);
  }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function fmtDate(ts) { if (!ts) return ''; const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); }
  let toastTimer = null;
  function toast(msg) {
    let t = $('pcToast');
    if (!t) { t = document.createElement('div'); t.id = 'pcToast'; t.className = 'pc-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function modOf(s) { return s === 'math' ? '数学' : s === 'chinese' ? '语文' : '英语'; }
  function subjName(s) { return s === 'math' ? '数学' : s === 'chinese' ? '语文' : '英语'; }

  /* ---------------- 苏格拉底引导式提示 ----------------
   * 答错不直接给答案，先按知识点给 2-3 步引导问题，让学生自己想到答案。
   * 最后再展示正确答案 + 解析。覆盖小学数学常见概念、语文阅读、英语词汇。
   * 提示全部是「提问式」，不出现具体答案选项的判断。
   */
  const CONCEPT_HINTS = {
    circle: [
      '在圆里，半径 r 是从圆心到圆周的距离，直径 d 是穿过圆心、两端都在圆周上的线段。想一想：一条直径里包含了几条半径？',
      '把半径代入具体数字试一下：如果 r = 5 cm，d 应该是多少？如果 d = 12 cm，r 又是多少？',
      '用字母写关系式时，d 和 r 哪一个是另一个的 2 倍？把它们的关系列成一个等式。'
    ],
    circleArea: [
      '圆面积的公式是 S = π r²，其中 r 是半径，π ≈ 3.14。想一想：r 变大一点，面积会怎么变？',
      '把题目里的半径代入公式 S = π r² 算一算，记得先算 r² 再乘 π。',
      '比较各选项的单位与数量级，排除明显不合理的那一个，再算其余。'
    ],
    circlePerim: [
      '圆的周长公式是 C = 2πr 或 C = πd。想一想：题目给的是半径还是直径？',
      '把已知量代入 C = 2πr 或 C = πd（π ≈ 3.14）算一算，注意保留单位。',
      '检查各选项的数量级，排除明显过小或过大的那一个。'
    ],
    triangleAngle: [
      '任意三角形的内角和都是 180°。已知两个角，怎么求第三个角？',
      '把已知两个角加起来，再用 180° 减去它们的和。',
      '验证一下：算出的第三个角加上前两个角，是否等于 180°。'
    ],
    triangleArea: [
      '三角形面积的公式是 S = 底 × 高 ÷ 2。想一想：题目中哪条是底、哪条是对应的高？',
      '把底和高代入 S = 底 × 高 ÷ 2，注意除以 2 不要漏掉。',
      '单位要统一（cm 与 m 不能直接相加），最后带上面积单位。'
    ],
    rect: [
      '长方形面积 = 长 × 宽，周长 = (长 + 宽) × 2。先判断题目问的是面积还是周长。',
      '把已知的长和宽代入对应公式，注意周长要乘 2。',
      '比较各选项的单位与数值，排除明显量级不对的那一个。'
    ],
    square: [
      '正方形面积 = 边长 × 边长，周长 = 边长 × 4。判断题目问的是哪一个。',
      '把边长代入对应公式，平方别算错。',
      '如果边长带单位，最后结果也要带相同的面积或长度单位。'
    ],
    parallel: [
      '平行四边形面积 = 底 × 高（高是对应底的垂线段，不是斜边）。',
      '梯形面积 = (上底 + 下底) × 高 ÷ 2，注意「高」是上下底之间的垂直距离。',
      '比较各选项的单位与数值，先排除明显不对的。'
    ],
    fraction: [
      '分数比较大小：分母相同比分子，分子相同比分母，或先通分再比较。',
      '分数加减要先通分（分母变成最小公倍数），再按同分母加减。',
      '分数乘整数：分子乘整数，分母不变；能约分的先约分，结果要化成最简分数。'
    ],
    decimal: [
      '小数加减：小数点对齐（数位对齐），再按整数加减法计算。',
      '小数乘小数：先按整数乘法算，再看两个因数一共有几位小数，从右往左点上小数点。',
      '比较两个小数大小：先比整数部分，再比十分位、百分位……'
    ],
    percent: [
      '求一个数的百分之几：用「这个数 × 百分率」。',
      '已知部分量和对应的百分率，求总量：用「部分量 ÷ 百分率」。',
      '百分数要化成小数或分数再参与计算（如 25% = 0.25 = 1/4）。'
    ],
    ratio: [
      '比的意义：a:b 表示 a 是 b 的多少倍。化简比要前项后项同除以最大公因数。',
      '按比分配：先求总份数，再算每份是多少，最后乘各自对应的份数。',
      '比和分数、除法的关系：a:b = a/b = a ÷ b（b ≠ 0）。'
    ],
    equation: [
      '解方程的核心是「等式两边同时加减、乘除同一个数，等式仍成立」。',
      '先把含未知数的项移到等号一边，常数项移到另一边，再化简。',
      '求出的未知数代回原方程，检验左右两边是否相等。'
    ],
    travel: [
      '路程 = 速度 × 时间；时间 = 路程 ÷ 速度；速度 = 路程 ÷ 时间。先判断已知哪两个量。',
      '单位要统一：km/h 与 m/s 不能直接混用，先换算成相同单位。',
      '把已知量代入公式，算出要求的量，并检查单位是否正确。'
    ],
    work: [
      '工程问题：把工作总量看作「1」，工作效率 = 1/单独完成时间。',
      '合作时，总效率 = 各效率之和，合作时间 = 1 ÷ 总效率。',
      '注意「同时开工」还是「先后开工」，条件不同，列式不同。'
    ],
    average: [
      '平均数 = 总数量 ÷ 总份数（不是「中间那个数」）。',
      '已知平均数和一个数，求另一个数：先求总数，再减去已知数。',
      '平均数会受极端数据影响（最大、最小），判断题目是否「去掉最高最低再求」。'
    ],
    factor: [
      '因数与倍数是相互的：a 是 b 的因数 ⇔ b 是 a 的倍数。',
      '找最大公因数：可列举所有因数找最大，或用短除法。最小公倍数同理（用公倍数找最小）。',
      '判断质数：只有 1 和它本身两个因数；判断合数：除了 1 和它本身还有其他因数；1 既不是质数也不是合数。'
    ],
    negative: [
      '数轴上，0 右边的数是正数，左边的是负数；离 0 越远，绝对值越大。',
      '比较负数大小：数值（绝对值）大的反而更小，例如 -3 < -1。',
      '负数运算：同号相加取相同符号并把绝对值相加；异号相减取绝对值大的符号并用大减小。'
    ],
    position: [
      '确定位置：先看「列」再看「行」，用数对 (列, 行) 表示。',
      '方向题：先判东、南、西、北（地图上通常是上北下南、左西右东），再走格数。',
      '相对方向：左西右东、前北后南，看清题目的「前」「后」「左」「右」是相对于谁。'
    ],
    cylinder: [
      '圆柱体积 = 底面积 × 高 = π r² h；侧面积 = 底面周长 × 高 = 2π r h。',
      '圆锥体积 = 1/3 × 底面积 × 高，是同底等高圆柱体积的 1/3。',
      '表面积 = 侧面积 + 2 个底面积，注意单位统一（长度用 cm，面积用 cm²）。'
    ],
    unit: [
      '长度单位：1 m = 100 cm = 1000 mm；1 km = 1000 m。',
      '面积单位：1 m² = 10000 cm²；1 公顷 = 10000 m²；1 km² = 100 公顷。',
      '单位换算：高级单位 ↔ 低级单位，乘或除以进率，注意小数点位置。'
    ],
    tree: [
      '植树问题关键：两端都种、一端种一端不种、两端都不种，间隔数与棵数的关系不同。',
      '两端都种：棵数 = 间隔数 + 1；两端都不种：棵数 = 间隔数 - 1；一端种一端不种：棵数 = 间隔数。',
      '先把「间隔数」算出来（总长 ÷ 间距），再判断属于哪种情况。'
    ],
    chicken: [
      '鸡兔同笼：假设全是鸡，先算出「腿差」；每多 1 只兔，腿就多 2 条。',
      '兔的只数 = (总腿数 - 2×总头数) ÷ 2；鸡的只数 = 总头数 - 兔的只数。',
      '也可以假设全是兔，思路类似，用「腿差」反推。'
    ],
    defect: [
      '找次品：用天平称，最优策略是把待测物品尽量「三等分」。',
      '称一次能找出次品的范围：最多 3 个（1 正 1 反 1 待测）；称两次最多 9 个；称 t 次最多 3^t 个。',
      '先想清楚「最坏情况」要称几次，再倒推最多能从多少个里找出次品。'
    ],
    pigeon: [
      '鸽巢原理：把 n+1 个物体放进 n 个抽屉，至少有一个抽屉里有 2 个或更多。',
      '要证明「至少有几个」，先算「最多能放多少还不满足」，再加 1。',
      '把题目里的物体和抽屉对应起来，找准「抽屉数」和「物体数」。'
    ],
    time: [
      '时间单位换算：1 时 = 60 分 = 3600 秒；1 分 = 60 秒。',
      '求经过时间：结束时间 - 开始时间，注意「跨小时」或「跨分钟」时借位。',
      '比较时间大小：先比「时」，再比「分」，最后比「秒」。'
    ],
    chart: [
      '条形统计图：看最高的条和最低的条，差距就是「最大-最小」。',
      '折线统计图：看趋势（上升、下降、平稳），关键看「陡」的程度。',
      '扇形统计图：整个圆表示总量（100%），扇形角度 = 该部分占总量的百分比 × 360°。'
    ],
    passage: [
      '先把短文读一遍，圈出每段的「中心句」（通常在段首或段尾）。',
      '带着问题回原文找「原话」或「同义改写」，不要凭印象选。',
      '排除法：先划掉明显和原文矛盾的选项，再在剩下的里选最贴切的。'
    ]
  };
  function detectConcept(text) {
    const t = text || '';
    if (/直径|半径|圆心|圆周率/.test(t)) return 'circle';
    if (/(圆面积|圆的面积|半径.{0,4}面积)/.test(t)) return 'circleArea';
    if (/(圆周长|圆的周长|周长.*圆)/.test(t)) return 'circlePerim';
    if (/(三角形|三角).*内角|内角.*三角/.test(t)) return 'triangleAngle';
    if (/(三角形|三角).*面积|面积.*三角/.test(t)) return 'triangleArea';
    if (/长方形/.test(t)) return 'rect';
    if (/正方形/.test(t)) return 'square';
    if (/平行四边形|梯形/.test(t)) return 'parallel';
    if (/分数|约分|通分/.test(t)) return 'fraction';
    if (/小数|点[.,，]/.test(t) && !/点[.,，].*(几|多|多少)/.test(t)) return 'decimal';
    if (/百分|%|折扣|成数/.test(t)) return 'percent';
    if (/比[的例]|化简比|按比|比值/.test(t)) return 'ratio';
    if (/方程|未知数|解.{0,3}程|求x|求y/.test(t)) return 'equation';
    if (/速度|路程|时间/.test(t) && /千米|米\/|km\/|小时|分钟/.test(t)) return 'travel';
    if (/工程|单独完成|合作|工作效率/.test(t)) return 'work';
    if (/平均数|平均分/.test(t)) return 'average';
    if (/因数|倍数|质数|合数|最大公因|最小公倍/.test(t)) return 'factor';
    if (/负数|数轴/.test(t)) return 'negative';
    if (/方向|位置|数对|第.列|第.行|东|南|西|北/.test(t)) return 'position';
    if (/圆柱|圆锥/.test(t)) return 'cylinder';
    if (/单位换算|公顷|平方千米|平方分米|平方厘米|进率/.test(t)) return 'unit';
    if (/植树|间隔|两端/.test(t)) return 'tree';
    if (/鸡兔/.test(t)) return 'chicken';
    if (/次品|砝码|天平.*称/.test(t)) return 'defect';
    if (/鸽巢|抽屉/.test(t)) return 'pigeon';
    if (/时分秒|时.*分.*秒|几时|几时几分/.test(t)) return 'time';
    if (/条形|折线|扇形|统计图/.test(t)) return 'chart';
    if (/阅读|短文|文段|段落|文章|作者|中心思想/.test(t)) return 'passage';
    return null;
  }
  function genericHints(item) {
    const opts = (item.options || []).map(function (o) { return optText(o); });
    const optCount = opts.length;
    const optionTip = optCount >= 2
      ? ('先看选项之间的「关键差异」（单位、量级、符号、运算顺序等），把明显和题意不符的划掉，再比较剩下的。')
      : ('把一个简单、特殊的数代进去试算一下，看哪个答案符合规律。');
    return [
      '先把题目里的「已知条件」和「要解决的问题」分开写清楚。想清楚它到底在问什么。',
      '回忆这一类题最常用的公式、定义或运算法则，题目里的哪个词让你想到它？',
      optionTip
    ];
  }
  function makeSocraticHints(item) {
    const text = ((item && item.question) || '') + ' ' + ((item && item.explain) || '');
    const concept = detectConcept(text);
    if (concept && CONCEPT_HINTS[concept]) return CONCEPT_HINTS[concept].slice();
    return genericHints(item);
  }

  /* ---------------- 数据层（与手机端同库，带 module 标记） ---------------- */
  function pcLoad() { return (typeof loadData === 'function') ? loadData() : { history: [], wrong: [] }; }
  function pcSave(d) { if (typeof saveData === 'function') saveData(d); }
  function pcRecord(grade, unitName, score, total, wrong, module) {
    const d = pcLoad(); d.history = d.history || [];
    d.history.unshift({
      module: module, grade: grade, unitName: unitName, score: score, total: total,
      accuracy: total ? Math.round(score / total * 100) : 0, time: Date.now(), wrong: wrong || [], synced: false
    });
    if (d.history.length > 50) d.history = d.history.slice(0, 50);
    d.stats = d.stats || {};
    if (!d.stats[grade]) d.stats[grade] = { totalDone: 0, totalCorrect: 0 };
    d.stats[grade].totalDone += total; d.stats[grade].totalCorrect += score;
    pcSave(d);
  }
  function pcAddWrong(q, ua, unitName, grade, module) {
    const d = pcLoad(); d.wrong = d.wrong || [];
    const ex = d.wrong.find(function (w) { return (!w.module || w.module === module) && w.question && w.question.question === q.question && w.question.answer === q.answer; });
    if (ex) { ex.count = (ex.count || 1) + 1; ex.lastWrong = Date.now(); }
    else d.wrong.push({ id: Date.now() + '_' + Math.random().toString(36).slice(2, 8), module: module, question: q, userAnswer: ua, unitName: unitName, grade: grade, time: Date.now(), count: 1 });
    pcSave(d);
  }
  function pcJudge(q, ua) {
    if (ua === undefined || ua === null || ua === '') return false;
    const a = q.answer;
    if (String(ua) === String(a)) return true;
    if (!isNaN(parseFloat(ua)) && !isNaN(parseFloat(a)) && parseFloat(ua) === parseFloat(a)) return true;
    // v69：多空填空题，按逗号/顿号/斜杠逐空比对（容忍中文标点与空格）
    const up = String(ua).split(/[,，、\/]+/).map(s => s.trim()).filter(s => s !== '');
    const ap = String(a).split(/[,，、\/]+/).map(s => s.trim()).filter(s => s !== '');
    if (up.length > 1 && up.length === ap.length) {
      return up.every(function (v, i) {
        return v === ap[i] || (!isNaN(parseFloat(v)) && !isNaN(parseFloat(ap[i])) && parseFloat(v) === parseFloat(ap[i]));
      });
    }
    return false;
  }

  async function loadRecords() {
    let records = [];
    if (useCloud) {
      try {
        const r = await getRecentHistory(C.LEARNING_ID, C.LEARNING_PW);
        if (r && r.ok) records = records.concat(r.recent || []);
      } catch (e) { /* ignore */ }
    }
    records = records.concat(pcLoad().history || []);
    const seen = new Set(); const out = [];
    records.forEach(function (r) {
      const k = (r.time || 0) + '|' + (r.unitName || '') + '|' + (r.score || 0) + '|' + (r.module || '');
      if (seen.has(k)) return; seen.add(k); out.push(r);
    });
    out.sort(function (a, b) { return (b.time || 0) - (a.time || 0); });
    return out;
  }

  /* ---------------- 全局状态 ---------------- */
  const S = { role: 'student', subject: 'math', grade: 6, semester: 1, view: 'home', quiz: null, activeQuiz: false, examType: 'unit', examUnitIdx: 0, studyIdx: 0 };
  const PC = {};

  /* ---------------- 导航 / 顶栏 ---------------- */
  function renderNav() {
    const nav = $('pcNav'); let h = '';
    if (S.role === 'student') {
      h += '<div class="pc-nav-group-label">学科</div>';
      [['math', '数学', 'PC.setSubject(\'math\')'], ['chinese', '语文', 'PC.setSubject(\'chinese\')'], ['english', '英语', 'PC.setSubject(\'english\')']].forEach(function (p) {
        h += navItem(S.subject === p[0] ? 'active' : '', p[1], p[2], p[0]);
      });
      h += '<div class="pc-nav-group-label">学习</div>';
      [['home', '首页', 'PC.go(\'home\')', 'home'], ['units', '单元练习', 'PC.go(\'units\')', 'units'], ['exam', '考试中心', 'PC.go(\'exam\')', 'exam'], ['wrong', '错题库', 'PC.go(\'wrong\')', 'wrong'], ['stats', '学习统计', 'PC.go(\'stats\')', 'stats']].forEach(function (p) {
        h += navItem(S.view === p[0] ? 'active' : '', p[1], p[2], p[3]);
      });
    } else {
      [['dashboard', '数据看板', 'PC.go(\'dashboard\')', 'dashboard'], ['recent', '最近练习', 'PC.go(\'recent\')', 'recent'], ['wrongdetail', '逐题错题', 'PC.go(\'wrongdetail\')', 'wrongdetail']].forEach(function (p) {
        h += navItem(S.view === p[0] ? 'active' : '', p[1], p[2], p[3]);
      });
    }
    nav.innerHTML = h;
  }
  function renderCrumb() {
    let c = S.role === 'student' ? ('学生 · ' + subjName(S.subject)) : '家长 · 数据看板';
    if (S.role === 'student' && S.view === 'units') c += ' · ' + S.grade + '年级 · ' + (S.semester === 1 ? '上册' : '下册');
    if (S.role === 'student' && S.view === 'exam') c += ' · 考试中心';
    if (S.role === 'student' && S.view === 'study') c += ' · ' + S.grade + '年级 · 同步学习';
    $('pcCrumb').textContent = c;
  }
  function setSyncChip(kind, text) {
    const el = $('pcSyncChip'); if (!el) return;
    el.className = 'pc-sync-chip' + (kind && kind !== 'ok' ? ' ' + kind : '');
    el.textContent = text;
  }
  function updateFootId() { const el = $('pcFootId'); if (el) el.textContent = useCloud ? ('ID: ' + C.LEARNING_ID) : '未启用云端'; }
  // v78：页脚版本号改为读取 sw.js 实际 CACHE，杜绝手写版本号滞后
  function updateFootVer() {
    if (typeof readShellVersion !== 'function') return;
    readShellVersion(function (v) { const el = $('pcFootVer'); if (el) el.textContent = v; });
  }

  function renderContent() {
    renderCrumb();
    const c = $('pcContent');
    if (S.role === 'parent') {
      if (S.view === 'dashboard') renderDashboard(c);
      else if (S.view === 'recent') renderRecent(c);
      else if (S.view === 'wrongdetail') renderWrongDetail(c);
    } else {
      if (S.view === 'home') renderHome(c);
      else if (S.view === 'units') renderUnits(c);
      else if (S.view === 'study') renderStudy(c);
      else if (S.view === 'exam') renderExam(c);
      else if (S.view === 'wrong') renderWrongBank(c);
      else if (S.view === 'stats') renderStats(c);
    }
    if (!S.activeQuiz && S.role === 'student') mountHero(c);
  }
  function heroUnitsCount() {
    if (S.subject === 'english') return (window.ENG_DATA && ENG_DATA.phonics && ENG_DATA.phonics.levels) ? ENG_DATA.phonics.levels.length : 0;
    if (S.subject === 'math') return (KNOWLEDGE_BASE[S.grade] && KNOWLEDGE_BASE[S.grade][S.semester]) ? KNOWLEDGE_BASE[S.grade][S.semester].length : 0;
    return (window.CN && CN.data[S.grade]) ? CN.data[S.grade].length : 0;
  }
  function buildHero() {
    const isP = S.role === 'parent';
    let cls, title, sub, badge;
    if (isP) {
      cls = 'pc-hero-parent'; badge = '家长端';
      const m = { dashboard: ['家庭学习看板', '孩子各科目的练习、正确率与薄弱点一目了然'],
                  recent: ['最近练习', '全部练习记录，按时间倒序排列'],
                  wrongdetail: ['逐题错题', '查看每道题的作答与正确答案对比'] }[S.view] || ['数据看板', ''];
      title = m[0]; sub = m[1];
    } else {
      const sj = subjName(S.subject); cls = 'pc-hero-' + S.subject; badge = sj;
      const maps = {
        home: [sj + ' · 学习首页', '选择年级开始练习，做错的题会自动同步给家长'],
        units: [S.grade + '年级 · 同步练习', (S.subject === 'english' ? '按 Level 选择练习' : ('共 ' + heroUnitsCount() + ' 个单元，点击「学习」看知识点与动图，或「练习」直接答题'))],
        study: ['同步学习 · ' + (getStudyUnit() ? (getStudyUnit().name || '') : ''), '知识点总结 · 万能公式 · 万能答题方法 · 交互动图'],
        exam: ['考试中心', '选择类型、年级与册别，一键生成试卷'],
        wrong: ['错题库', '重练薄弱点，巩固知识点'],
        stats: ['学习统计', '查看正确率、练习趋势与连续学习天数']
      };
      const m = maps[S.view] || [sj + ' · 学习', ''];
      title = m[0]; sub = m[1];
    }
    return '<div class="pc-page-hero ' + cls + '"><div><div class="ph-title">' + esc(title) + '</div>' + (sub ? '<div class="ph-sub">' + esc(sub) + '</div>' : '') + '</div><span class="ph-badge">' + esc(badge) + '</span></div>';
  }
  function mountHero(c) { if (!c) return; c.insertAdjacentHTML('afterbegin', buildHero()); }

  PC.setSubject = function (k) { S.activeQuiz = false; S.subject = k; S.view = 'home'; renderNav(); renderContent(); };
  PC.go = function (v) { S.activeQuiz = false; S.view = v; renderNav(); renderContent(); };
  // 返回：退出当前练习，回到进入练习前的页面（单元列表 / 考试中心 / 错题库 / 首页 / 同步学习）
  PC.back = function () {
    const v = (S.quiz && S.quiz.fromView) || S.view || 'home';
    S.activeQuiz = false; S.quiz = null;
    PC.go(v === 'study' ? 'study' : v);
  };
  PC.pickGrade = function (g) { S.activeQuiz = false; S.grade = g; S.view = 'units'; renderNav(); renderContent(); };
  PC.refresh = function () { renderContent(); toast('已刷新'); };
  PC.merge = async function () {
    if (!useCloud) { toast('未启用云端'); return; }
    setSyncChip('loading', '补传中');
    try {
      if (typeof pushRecentHistory === 'function') await pushRecentHistory();
      setSyncChip('ok', '已同步'); toast('已合并补传云端');
      if (S.role === 'parent') renderContent();
    } catch (e) { setSyncChip('err', '补传失败'); toast('补传失败：' + ((e && e.message) || e)); }
  };

  /* ---------------- 学生 · 首页 ---------------- */
  function renderHome(c) {
    let h = '';
    h += '<div class="pc-section-title">选择年级</div><div class="pc-grade-grid">';
    for (let g = 1; g <= 6; g++) h += '<div class="pc-grade" onclick="PC.pickGrade(' + g + ')">' + g + '年级</div>';
    h += '</div>';
    if (S.subject === 'math') {
      h += '<div class="pc-section-title">快速练习</div><div class="pc-row"><button class="pc-btn primary" onclick="PC.startMathQuick(\'basic\')">基础运算</button><button class="pc-btn primary" onclick="PC.startMathQuick(\'mixed\')">综合练习</button></div>';
    }
    h += '<div class="pc-section-title">最近练习（本机）</div>';
    h += recentListHtml(pcLoad().history.filter(function (r) { return r.module === modOf(S.subject); }).slice(0, 8));
    c.innerHTML = h;
  }

  /* ---------------- 学生 · 单元列表 ---------------- */
  function renderUnits(c) {
    let h = '';
    if (S.subject !== 'english') {
      h += '<div class="pc-row"><span class="lab">' + S.grade + '年级</span><div class="pc-seg" id="semSeg">';
      h += '<button data-s="1" class="' + (S.semester === 1 ? 'active' : '') + '">上册</button><button data-s="2" class="' + (S.semester === 2 ? 'active' : '') + '">下册</button>';
      h += '</div></div>';
    }
    let units;
    if (S.subject === 'math') units = (KNOWLEDGE_BASE[S.grade] && KNOWLEDGE_BASE[S.grade][S.semester]) || [];
    else if (S.subject === 'chinese') units = (window.CN && CN.data[S.grade]) || [];
    else units = (window.ENG_DATA && ENG_DATA.phonics && ENG_DATA.phonics.levels) || [];

    h += '<div class="pc-section-title">' + esc(subjName(S.subject)) + ' · ' + S.grade + '年级' + (S.subject === 'english' ? '' : ' · ' + (S.semester === 1 ? '上册' : '下册')) + '</div>';
    h += '<div class="pc-unit-list">';
    units.forEach(function (u, i) {
      const name = S.subject === 'english' ? (u.name || ('Level ' + (i + 1))) : (u.name || ('第' + (i + 1) + '单元'));
      const meta = S.subject === 'math' ? (u.type || '') : S.subject === 'chinese' ? (u.group || '') : ((u.lessons ? u.lessons.length : 0) + ' 课');
      const tag = (S.subject === 'math' && u.name && u.name.indexOf('专项') >= 0) ? '<span class="u-tag">专项</span>' : '';
      h += '<div class="pc-unit"><div class="u-name">' + esc(name) + '</div><div class="u-meta">' + esc(meta) + '</div>' + tag +
        '<div class="pc-unit-actions">' +
        '<button class="pc-btn primary sm" onclick="PC.goStudy(' + i + ')">学习</button>' +
        '<button class="pc-btn ghost sm" onclick="PC.startUnit(' + i + ')">练习</button>' +
        '</div></div>';
    });
    h += '</div>';
    c.innerHTML = h;
    const seg = $('semSeg');
    if (seg) bindSeg('semSeg', function (s) { S.semester = +s; renderContent(); });
  }
  PC.startUnit = function (i) {
    if (S.subject === 'math') PC.startMathUnit(i);
    else if (S.subject === 'chinese') PC.startCnUnit(i);
    else startEngUnit(i);
  };

  /* ---------------- 学生 · 同步学习（知识点总结 / 万能公式 / 万能答题方法 / 交互动图） ---------------- */
  function getStudyUnit() {
    const i = S.studyIdx;
    if (S.subject === 'math') return (KNOWLEDGE_BASE[S.grade] && KNOWLEDGE_BASE[S.grade][S.semester] && KNOWLEDGE_BASE[S.grade][S.semester][i]) || null;
    if (S.subject === 'chinese') return (window.CN && CN.data[S.grade] && CN.data[S.grade][i]) || null;
    if (S.subject === 'english') return (window.ENG_DATA && ENG_DATA.phonics && ENG_DATA.phonics.levels && ENG_DATA.phonics.levels[i]) || null;
    return null;
  }
  PC.goStudy = function (i) { S.activeQuiz = false; S.studyIdx = (i == null ? 0 : i); S.view = 'study'; renderNav(); renderContent(); };

  function renderStudy(c) {
    const u = getStudyUnit();
    if (!u) { c.innerHTML = '<div class="pc-empty">未找到该单元的学习内容</div>'; return; }
    const subj = S.subject;
    let h = '';
    h += '<div class="pc-study-bar"><button class="pc-btn ghost sm" onclick="PC.go(\'units\')">← 返回单元列表</button></div>';

    // 知识点总结
    h += '<div class="pc-section-title">知识点总结</div>';
    if (u.summary && u.summary.length) {
      h += '<div class="pc-kp-card"><div class="kp-label">核心要点</div>';
      u.summary.forEach(function (s, idx) {
        h += '<div class="kp-line"><span class="kp-no">' + (idx + 1) + '</span><span>' + esc(s) + '</span></div>';
      });
      h += '</div>';
    } else {
      h += '<div class="pc-empty">本单元暂无知识点总结</div>';
    }

    // 万能公式 / 万能答题公式
    if (subj === 'math' && u.fidx && u.fidx.length) {
      h += '<div class="pc-section-title">万能公式</div><div class="pc-kp-formulas">';
      u.fidx.forEach(function (f) {
        h += '<div class="pc-formula-card"><div class="pf-t">' + esc(f.t) + '</div><div class="pf-f">' + esc(f.f) + '</div>' + (f.warn ? '<div class="pf-warn">'+UI_ICON.svg('warn',13)+' ' + esc(f.warn) + '</div>' : '') + '</div>';
      });
      h += '</div>';
    }
    if (subj === 'chinese' && u.fidx && u.fidx.length) {
      h += '<div class="pc-section-title">万能答题公式</div><div class="pc-kp-formulas">';
      u.fidx.forEach(function (idx) {
        const fm = (window.CN && window.CN.formulas) ? window.CN.formulas[idx] : null;
        if (!fm) return;
        h += '<div class="pc-formula-card"><div class="pf-t">' + esc(fm.t) + '</div><div class="pf-f">' + esc(fm.f) + '</div></div>';
      });
      h += '</div>';
    }

    // 万能答题方法（数学）
    if (subj === 'math' && u.method && u.method.length) {
      h += '<div class="pc-section-title">万能答题方法</div><div class="pc-method-card">';
      u.method.forEach(function (m) {
        h += '<div class="pm-line"><div class="pm-t">' + esc(m.t) + '</div><div class="pm-s">' + esc(m.s) + '</div></div>';
      });
      h += '</div>';
    }

    // 课文清单（语文）
    if (subj === 'chinese' && u.lessons && u.lessons.length) {
      h += '<div class="pc-section-title">本单元课文</div><div class="pc-lesson-list">';
      u.lessons.forEach(function (ls) { h += '<span class="pc-lesson">' + esc(ls) + '</span>'; });
      h += '</div>';
    }

    // 词汇知识点（英语）
    if (subj === 'english') {
      h += '<div class="pc-section-title">本关词汇</div><div class="pc-vocab">';
      (u.lessons || []).forEach(function (ls) {
        h += '<div class="pc-vocab-lesson"><div class="vl-name">' + esc(ls.name || ls) + '</div><div class="pc-vocab-words">';
        (ls.words || []).forEach(function (wd) { h += '<span class="pc-vocab-w">' + esc(wd.w) + ' <i>' + esc(wd.m) + '</i></span>'; });
        h += '</div></div>';
      });
      h += '</div>';
    }

    // 静态方法图（数学 introImg）
    if (subj === 'math' && u.introImg) {
      h += '<div class="pc-section-title">方法导引</div><img class="pc-study-img" src="' + u.introImg + '" alt="方法图"/>';
    }

    // 交互动图（数学，复用 diagram.js 引擎，与手机端同源）
    if (subj === 'math') {
      h += '<div class="pc-section-title">交互动图（动手试一试）</div>';
      const diags = (typeof getUnitDiagrams === 'function') ? getUnitDiagrams(u, S.grade, S.semester) : [];
      if (!diags.length && !u.interactiveIntro) h += '<div class="pc-empty">本单元暂无交互动图</div>';
      diags.slice(0, 3).forEach(function (d, di) {
        h += '<div class="diag-card" data-di="' + di + '"><div class="diag-card-title">' + esc(d.title) + '</div><div class="diag-card-body"></div><div class="diag-card-hint">' + esc(d.hint || '拖动图形，观察变化') + '</div></div>';
      });
      if (u.interactiveIntro && typeof renderShapeExplore === 'function') h += '<div class="diag-card" data-di="int"><div class="diag-card-title">动手探索</div><div class="diag-card-body"></div><div class="diag-card-hint">拖动滑块，看图形怎么变</div></div>';
    }

    h += '<div class="pc-study-actions"><button class="pc-btn primary" onclick="PC.startUnit(' + S.studyIdx + ')">开始练习</button><button class="pc-btn gold" onclick="PC.go(\'exam\')">去考试</button></div>';
    c.innerHTML = h;

    // 动图需在 DOM 写入后挂载（与手机端 showUnitDiagrams 同款调用）
    if (subj === 'math') {
      const diags = (typeof getUnitDiagrams === 'function') ? getUnitDiagrams(u, S.grade, S.semester) : [];
      c.querySelectorAll('[data-di]').forEach(function (card) {
        const di = card.getAttribute('data-di');
        const body = card.querySelector('.diag-card-body');
        if (!body) return;
        try {
          if (di === 'int') { if (typeof renderShapeExplore === 'function') renderShapeExplore(body); }
          else { const d = diags[+di]; if (d && d.fn) d.fn(body, d.opts || {}); }
        } catch (e) { body.innerHTML = '<div class="pc-empty">动图加载失败</div>'; }
      });
    }
  }

  /* ---------------- 学生 · 考试中心 ---------------- */
  function renderExam(c) {
    let h = '<div class="pc-card"><div class="pc-section-title u-mt0">考试设置（' + esc(subjName(S.subject)) + '）</div>';
    h += '<div class="pc-row"><span class="lab">类型</span><div class="pc-seg" id="examType">';
    [['unit', '单元考'], ['month', '月考'], ['mid', '期中'], ['final', '期末']].forEach(function (p, i) {
      h += '<button data-t="' + p[0] + '" class="' + (i === 0 ? 'active' : '') + '">' + p[1] + '</button>';
    });
    h += '</div></div>';
    h += '<div class="pc-row"><span class="lab">年级</span><div class="pc-seg" id="examGrade">';
    for (let g = 1; g <= 6; g++) h += '<button data-g="' + g + '" class="' + (g === S.grade ? 'active' : '') + '">' + g + '年级</button>';
    h += '</div></div>';
    if (S.subject !== 'english') {
      h += '<div class="pc-row"><span class="lab">册别</span><div class="pc-seg" id="examSem">';
      h += '<button data-s="1" class="' + (S.semester === 1 ? 'active' : '') + '">上册</button><button data-s="2" class="' + (S.semester === 2 ? 'active' : '') + '">下册</button>';
      h += '</div></div>';
    }
    h += '<div id="examExtra"></div>';
    h += '<button class="pc-btn gold" onclick="PC.runExam()">开始考试</button></div>';
    c.innerHTML = h;
    bindSeg('examType', function (t) { S.examType = t; renderExamExtra(); });
    bindSeg('examGrade', function (g) { S.grade = +g; renderExamExtra(); });
    bindSeg('examSem', function (s) { S.semester = +s; });
    renderExamExtra();
  }
  function renderExamExtra() {
    const box = $('examExtra'); if (!box) return;
    if (S.examType !== 'unit') { box.innerHTML = ''; return; }
    let list;
    if (S.subject === 'math') list = (KNOWLEDGE_BASE[S.grade] && KNOWLEDGE_BASE[S.grade][S.semester]) || [];
    else if (S.subject === 'chinese') list = (window.CN && CN.data[S.grade]) || [];
    else { box.innerHTML = '<div class="pc-hint">英语单元练习请在「单元练习」中选择对应 Level。</div>'; return; }
    let h = '<div class="pc-row"><span class="lab">单元</span><div class="pc-seg" id="examUnit">';
    list.forEach(function (u, i) {
      const nm = (u.name || ('第' + (i + 1) + '单元')).replace(/^(四年级|五年级|六年级).*?·/, '').slice(0, 8);
      h += '<button data-u="' + i + '" class="' + (i === 0 ? 'active' : '') + '">' + esc(nm) + '</button>';
    });
    h += '</div></div>';
    box.innerHTML = h;
    bindSeg('examUnit', function (u) { S.examUnitIdx = +u; });
  }
  PC.runExam = function () {
    const t = S.examType || 'unit';
    if (S.subject === 'math') {
      if (t === 'unit') PC.startMathUnit(S.examUnitIdx || 0);
      else startMathExam(t);
    } else if (S.subject === 'chinese') {
      if (t === 'unit') PC.startCnUnit(S.examUnitIdx || 0);
      else startCnExam(t);
    } else { toast('英语暂只支持单元练习'); }
  };

  /* ---------------- 学生 · 错题 / 统计 ---------------- */
  function renderWrongBank(c) {
    const mod = modOf(S.subject);
    const bank = (typeof getAllWrongBank === 'function' ? getAllWrongBank() : pcLoad().wrong).filter(function (w) { return !w.module || w.module === mod; });
    let h = '<div class="pc-card"><div class="pc-section-title u-mt0">' + esc(subjName(S.subject)) + '错题库（' + bank.length + '）</div>';
    h += '<div class="pc-row"><button class="pc-btn primary" onclick="PC.startWrongReview()">开始错题重练</button><button class="pc-btn ghost" onclick="PC.clearWrong()">清空错题库</button></div>';
    if (!bank.length) h += '<div class="pc-empty">暂无错题</div>';
    else {
      h += '<div class="pc-list">';
      bank.slice(0, 30).forEach(function (w) {
        const q = w.question || w;
        // v81：解析讲解回填。PC 端原来只列出题干和错次，看不到答案也没有讲解。
        const hit = (typeof findUnitByName === 'function' && w.grade && w.unitName)
          ? findUnitByName(w.grade, w.unitName) : null;
        let steps = q.steps;
        if (!steps || !steps.length || (steps.length === 1 && /^答案：/.test(String(steps[0])))) {
          steps = (typeof generateSteps === 'function') ? generateSteps(q, hit && hit.unit) : [];
        }
        const ua = w.userAnswer === undefined || w.userAnswer === '' ? '未作答' : w.userAnswer;
        h += '<div class="pc-wrong-item">';
        h += '<div class="pc-wrong-head"><span class="lr-name">' + esc(q.question || '') + '</span>'
          + '<span class="lr-meta">' + esc(w.unitName || '') + ' · 答错 ' + (w.count || 1) + ' 次</span></div>';
        h += '<div class="pc-wrong-ans">你的答案：<b class="bad">' + esc(String(ua)) + '</b>'
          + '　正确答案：<b class="ok">' + esc(String(q.answer === undefined ? '' : q.answer)) + '</b></div>';
        if (q.explain) h += '<div class="pc-wrong-explain">解析：' + esc(q.explain) + '</div>';
        if (steps && steps.length) {
          h += '<details class="pc-wrong-steps" open><summary>分步讲解（' + steps.length + ' 步）</summary><ol>';
          steps.forEach(function (s) { h += '<li>' + esc(String(s)) + '</li>'; });
          h += '</ol></details>';
        }
        h += '</div>';
      });
      h += '</div>';
    }
    h += '</div>';
    c.innerHTML = h;
  }
  PC.startWrongReview = function () {
    const mod = modOf(S.subject);
    const bank = (typeof getAllWrongBank === 'function' ? getAllWrongBank() : pcLoad().wrong).filter(function (w) { return !w.module || w.module === mod; });
    if (!bank.length) { toast('错题库是空的'); return; }
    const qs = shuffle(bank).slice(0, Math.min(30, bank.length)).map(function (w) { return w.question; });
    beginQuiz(qs, 'wrong', mod + '错题重练', mod, S.grade, false, function () { PC.startWrongReview(); });
  };
  PC.clearWrong = function () {
    if (!confirm('确定清空' + subjName(S.subject) + '错题库？')) return;
    const d = pcLoad(); d.wrong = (d.wrong || []).filter(function (w) { return w.module && w.module !== modOf(S.subject); });
    pcSave(d); toast('已清空'); renderContent();
  };
  function renderStats(c) {
    const mod = modOf(S.subject);
    const hist = pcLoad().history.filter(function (r) { return r.module === mod; });
    const st = computeStats(hist);
    let h = '<div class="pc-grid pc-metrics">';
    h += metric('练习次数', st.count, 'c-blue') + metric('平均正确率', st.avg + '%', 'c-green') + metric('薄弱单元', st.weak.length, 'c-red') + metric('连续学习', st.cont + '天', 'c-gold');
    h += '</div><div class="pc-grid pc-two u-mt16"><div class="pc-card"><h3>各单元正确率</h3>' + unitBars(st.units) + '</div><div class="pc-card"><h3>最近练习</h3>' + recentListHtml(hist.slice(0, 8)) + '</div></div>';
    c.innerHTML = h;
  }

  /* ---------------- 题目生成（复用生成器） ---------------- */
  PC.startMathQuick = function (mode) {
    const gen = mode === 'basic' ? (typeof quickBasicGen === 'function' ? quickBasicGen : null) : (typeof quickMixedGen === 'function' ? quickMixedGen : null);
    if (!gen) { toast('生成器不可用'); return; }
    const n = (typeof QUIZ_LENGTH === 'number') ? QUIZ_LENGTH : 30;
    const qs = []; for (let i = 0; i < n; i++) qs.push(gen());
    beginQuiz(qs, 'quick', mode === 'basic' ? '基础运算' : '综合练习', '数学', S.grade, false, function () { PC.startMathQuick(mode); });
  };
  // v73：PC 端单元练习与移动端同构——先弹「练习设置」选难度，再固定抽 30 题，
  // 复用 math.js 的 buildUnitQuizQuestions（反复 gen() 凑题，绝不出现重复题）。
  PC.startMathUnit = function (idx) {
    if (typeof openPracticeSettings !== 'function') { startMathUnitWithDiff(idx, 0); return; }
    let unit = null;
    try { unit = KNOWLEDGE_BASE[S.grade][S.semester][idx]; } catch (e) { unit = null; }
    openPracticeSettings({
      title: '练习设置',
      note: (unit && unit.name ? unit.name + ' · ' : '') + '每次固定 30 题',
      okText: '开始练习',
      onStart: function (diff) { startMathUnitWithDiff(idx, diff); },
    });
  };
  function startMathUnitWithDiff(idx, diff) {
    const unit = KNOWLEDGE_BASE[S.grade][S.semester][idx];
    let qs;
    if (unit.paper) { let arr = unit.gen(); qs = Array.isArray(arr) ? arr : [arr]; }
    else if (typeof buildUnitQuizQuestions === 'function') {
      qs = buildUnitQuizQuestions(unit, diff || 1, (typeof UNIT_QUIZ_LENGTH === 'number') ? UNIT_QUIZ_LENGTH : 30);
    } else {
      const first = unit.gen();
      if (Array.isArray(first)) qs = first;
      else {
        const cand = [first];
        const N = (typeof UNIT_QUIZ_LENGTH === 'number') ? UNIT_QUIZ_LENGTH * 3 : 60;
        for (let i = 1; i < N; i++) { const g = unit.gen(); if (Array.isArray(g)) cand.push.apply(cand, g); else cand.push(g); }
        qs = shuffle(cand).slice(0, (typeof UNIT_QUIZ_LENGTH === 'number') ? UNIT_QUIZ_LENGTH : 20);
      }
    }
    if (!qs || !qs.length) { toast('该单元暂无题目'); return; }
    beginQuiz(qs, 'unit', unit.name, '数学', S.grade, false, function () { startMathUnitWithDiff(idx, diff); });
  }
  function startMathUnit(idx) { startMathUnitWithDiff(idx, 1); }
  function startMathExam(type) {
    if (typeof examState === 'undefined' || typeof generateExamPaper !== 'function') { toast('考试功能不可用'); return; }
    examState.grade = S.grade; examState.semester = S.semester; examState.type = type;
    if (type === 'unit') examState.unitIdx = S.examUnitIdx || 0;
    if (type === 'month') examState.month = 2;
    const paper = generateExamPaper();
    if (!paper || !paper.questions || !paper.questions.length) { toast('组卷失败，换个范围试试'); return; }
    beginQuiz(paper.questions, 'exam', paper.title, '数学', S.grade, true, function () { startMathExam(type); }, paper.badge);
  }
  // v73：语文单元练习同样先弹「练习设置」选难度；选题复用 chinese.js 的 cnSamplePool，
  // 保证 PC 端与移动端拿到的是同一批题、同一套难度分层口径。
  PC.startCnUnit = function (idx) {
    const units = (window.CN && CN.data[S.grade]) || [];
    const u = units[idx];
    if (!u || !u.pool) { toast('该单元暂无题目'); return; }
    if (typeof openPracticeSettings !== 'function') { startCnUnitWithDiff(idx, 0); return; }
    openPracticeSettings({
      title: '练习设置',
      note: u.name + ' · 每次固定 30 题',
      okText: '开始练习',
      onStart: function (diff) { startCnUnitWithDiff(idx, diff); },
    });
  };
  function startCnUnitWithDiff(idx, diff) {
    const units = (window.CN && CN.data[S.grade]) || [];
    const u = units[idx];
    if (!u || !u.pool) { toast('该单元暂无题目'); return; }
    let qs = (window.CN && typeof CN.samplePool === 'function')
      ? CN.samplePool(u, 30, diff || 1)
      : shuffle(u.pool()).slice(0, 20);
    if (!qs || !qs.length) { toast('该单元暂无题目'); return; }
    beginQuiz(qs, 'unit', u.name, '语文', S.grade, false, function () { startCnUnitWithDiff(idx, diff); });
  }
  function startCnUnit(idx) { startCnUnitWithDiff(idx, 1); }
  function startCnExam(kind) {
    const units = (window.CN && CN.data[S.grade]) || [];
    const term = S.semester === 1 ? '上' : '下';
    let tb = units.filter(function (u) { return u.group === '课本' && u.term === term; });
    if (!tb.length) tb = units;
    const scope = (kind === 'mid') ? tb.slice(0, Math.ceil(tb.length / 2)) : tb;
    let all = [];
    scope.forEach(function (u) { (u.pool() || []).forEach(function (q) { all.push(q); }); });
    const qs = shuffle(all).slice(0, 24);
    const title = CN_NUM[S.grade] + '年级语文 ' + (S.semester === 1 ? '上册' : '下册') + (kind === 'mid' ? '期中测试' : '期末测试');
    beginQuiz(qs, 'exam', title, '语文', S.grade, true, function () { startCnExam(kind); });
  }
  function startEngUnit(levelIdx) {
    const lv = (window.ENG_DATA && ENG_DATA.phonics && ENG_DATA.phonics.levels[levelIdx]);
    if (!lv) { toast('该 Level 暂无内容'); return; }
    let items = [];
    (lv.lessons || []).forEach(function (ls) { (ls.words || []).forEach(function (w) { items.push({ w: w.w, m: w.m }); }); });
    const picked = shuffle(items).slice(0, 20);
    const qs = picked.map(function (it) {
      const others = shuffle(items.filter(function (x) { return x.m !== it.m; })).slice(0, 3).map(function (x) { return x.m; });
      return { type: 'choice', question: '选出「' + it.w + '」的中文意思', options: shuffle([it.m].concat(others)), answer: it.m, _word: it.w };
    });
    beginQuiz(qs, 'unit', lv.name, '英语', S.grade, false, function () { startEngUnit(levelIdx); });
  }

  /* ---------------- 答题引擎 ---------------- */
  function beginQuiz(questions, mode, title, module, grade, isExam, restart, badge) {
    S.activeQuiz = true;
    let totalScore = 0;
    questions.forEach(function (q) {
      if (typeof q.score !== 'number' || q.score <= 0) q.score = 1;
      totalScore += q.score;
      q._origIndex = q._origIndex == null ? 0 : q._origIndex;
    });
    S.quiz = { questions: questions, idx: 0, score: 0, totalScore: totalScore, startTime: Date.now(), wrongList: [], userAnswers: [], results: [], mode: mode, title: title, module: module, grade: grade, isExam: isExam, restart: restart || null, fromView: S.view || 'home', badge: badge || null };
    renderQuiz();
  }
  function renderQuiz() {
    const q = S.quiz; const c = $('pcContent'); const total = q.questions.length; const i = q.idx; const item = q.questions[i];
    const res = q.results[i];
    const inHint = !!(res && !res.correct && !res.revealed);

    let h = '<div class="pc-quiz-wrap">';
    h += '<div class="pc-quiz-head"><div class="pc-quiz-title"><button class="pc-quiz-back" onclick="PC.back()" title="返回上一页">←</button>' + esc(q.title) + '</div><div class="pc-quiz-progress">第 ' + (i + 1) + ' / ' + total + ' 题</div></div>';
    if (q.badge) h += '<div class="pc-quiz-badge">' + esc(q.badge) + '</div>';
    h += '<div class="pc-progress-track"><div class="pc-progress-fill ' + wpCls(total ? i / total * 100 : 0) + '"></div></div>';
    // v73.2：题号导航（全部题号可点击跳转，不强制顺序）
    h += '<div class="pc-quiz-nav" id="pcQuizNav">';
    for (let ni = 0; ni < total; ni++) {
      const nr = q.results[ni];
      let nc = 'pc-qn';
      if (ni === i) nc += ' current';
      if (nr && nr.correct) nc += ' ok';
      else if (nr && !nr.correct) nc += ' bad';
      h += '<button class="' + nc + '" onclick="PC.jump(' + ni + ')">' + (ni + 1) + '</button>';
    }
    h += '</div>';
    h += '<div class="pc-q-card" id="pcQCard">';
    if (item.passage) h += '<div class="pc-passage">' + item.passage + '</div>';
    if (item.paperSection) h += '<div class="pc-section-banner">' + esc(item.paperSection) + '</div>';
    h += '<div class="pc-q-text">' + esc(item.question) + '</div>';
    if (item.svg) h += '<div class="pc-q-svg"><svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">' + item.svg + '</svg></div>';
    if (item.type === 'choice' || item.type === 'judge') {
      h += '<div class="pc-options" id="pcOpts">';
      (item.options || []).forEach(function (opt, oi) {
        const txt = optText(opt);
        const sel = q.userAnswers[i] === txt;
        h += '<button class="pc-opt ' + (sel ? 'sel' : '') + '" onclick="PC.choose(' + oi + ')"><span class="pc-opt-key">' + String.fromCharCode(65 + oi) + '</span><span class="pc-opt-txt">' + esc(txt) + '</span></button>';
      });
      h += '</div>';
    } else {
      // v69：多空填空题逐空渲染输入框（旧版只有 1 个框，孩子根本没法作答）
      const nb = (typeof countFillBlanks === 'function') ? countFillBlanks(item) : 0;
      if (nb >= 2) {
        const parts = String(q.userAnswers[i] || '').split(/[,，、\/]+/);
        h += '<div class="pc-multi-blank">';
        for (let bi = 0; bi < nb; bi++) {
          h += '<span class="pc-mb-item"><span class="pc-mb-no">' + (bi + 1) + '</span>' +
            '<input class="pc-fill pc-fill-multi" placeholder="第' + (bi + 1) + '空" value="' + esc((parts[bi] || '').trim()) + '" onkeydown="if(event.key===\'Enter\')PC.submit()"></span>';
        }
        h += '</div>';
        h += '<div class="pc-mb-tip">共 ' + nb + ' 个空，请按顺序分别填写</div>';
      } else {
        h += '<input class="pc-fill" id="pcFill" placeholder="请输入答案" value="' + esc(q.userAnswers[i] || '') + '" onkeydown="if(event.key===\'Enter\')PC.submit()">';
      }
    }
    h += '</div>';

    // 苏格拉底引导：答错不直接给答案，按知识点给 2-3 条提问式提示。
    if (inHint) {
      const hintIdx = Math.min(res.hintStep || 0, res.hints.length - 1);
      const hintText = res.hints[hintIdx] || '';
      h += '<div class="pc-socratic show">';
      h += '<div class="ps-head"><span class="ps-tag">思考提示</span><span class="ps-step">第 ' + (hintIdx + 1) + ' / ' + res.hints.length + ' 条</span></div>';
      h += '<div class="ps-text">' + esc(hintText) + '</div>';
      h += '<div class="ps-tip">先想一想再改答案；实在想不出可以点「看答案」揭晓。</div>';
      h += '</div>';
    } else if (res) {
      h += '<div class="pc-feedback show ' + (res.correct ? 'ok' : 'bad') + '">';
      h += res.correct ? '✓ 回答正确' : (res.revealed ? '✗ 已揭晓答案' : '✗ 回答错误');
      h += '<span class="fb-ans">　正确答案：' + esc(item.answer) + '</span>';
      if (item.explain) h += '<span class="fb-exp">解析：' + esc(item.explain) + '</span>';
      h += '</div>';
    }

    h += '<div class="pc-quiz-actions">';
    if (i > 0) h += '<button class="pc-btn ghost" onclick="PC.prev()">上一题</button>';

    if (inHint) {
      h += '<button class="pc-btn ghost" onclick="PC.revealAnswer()">看答案</button>';
      if (res.hintStep < res.hints.length - 1) h += '<button class="pc-btn" onclick="PC.hint()">下一条提示</button>';
      h += '<button class="pc-btn primary" onclick="PC.submit()">再试一次</button>';
    } else if (!res) {
      h += '<button class="pc-btn primary" onclick="PC.submit()">' + (i === total - 1 ? '提交并查看' : '提交本题') + '</button>';
    } else {
      if (i < total - 1) h += '<button class="pc-btn primary" onclick="PC.next()">下一题</button>';
      if (i === total - 1) h += '<button class="pc-btn gold" onclick="PC.finish()">查看成绩</button>';
    }

    h += '</div></div>';
    c.innerHTML = h;

    // 只有在「已揭晓 / 已正确」时才在选项上打 correct/wrong；提示中不显示答案位置。
    if (res && !inHint && (item.type === 'choice' || item.type === 'judge')) {
      const opts = $('pcOpts').children;
      for (let k = 0; k < opts.length; k++) {
        const keyEl = opts[k].querySelector ? opts[k].querySelector('.pc-opt-txt') : null;
        const txt = (keyEl ? keyEl.textContent : (opts[k].textContent || '')).replace(/^[A-Z]\.\s*/, '');
        if (txt === String(item.answer)) opts[k].classList.add('correct');
      }
      if (!res.correct) {
        const ua = q.userAnswers[i];
        for (let k = 0; k < opts.length; k++) {
          const keyEl = opts[k].querySelector ? opts[k].querySelector('.pc-opt-txt') : null;
          const txt = (keyEl ? keyEl.textContent : (opts[k].textContent || '')).replace(/^[A-Z]\.\s*/, '');
          if (txt === String(ua)) opts[k].classList.add('wrong');
        }
      }
    }
  }
  PC.choose = function (oi) {
    const q = S.quiz; const item = q.questions[q.idx];
    q.userAnswers[q.idx] = optText(item.options[oi]);
    const opts = $('pcOpts').children;
    for (let k = 0; k < opts.length; k++) opts[k].classList.toggle('sel', k === oi);
  };
  PC.submit = function () {
    const q = S.quiz; const i = q.idx; const item = q.questions[i];
    const prev = q.results[i];
    // 如果上一轮已经正确或已揭晓答案，提交按钮不响应（已显示「下一题」）。
    if (prev && (prev.correct || prev.revealed)) return;

    let ua;
    if (item.type === 'choice' || item.type === 'judge') {
      ua = q.userAnswers[i]; if (ua === undefined) { toast('请先选择答案'); return; }
    } else {
      const multi = document.querySelectorAll('.pc-fill-multi');
      if (multi && multi.length) {
        const parts = []; multi.forEach(function (el) { parts.push(String(el.value || '').trim()); });
        ua = parts.every(function (p) { return p === ''; }) ? '' : parts.join(',');
      } else {
        const inp = $('pcFill'); ua = inp ? inp.value.trim() : '';
      }
      if (ua === '') { toast('请输入答案'); return; }
    }

    const correct = pcJudge(item, ua);
    if (prev && !prev.correct && !prev.revealed) {
      // 第二次及以后提交：要么答对，要么换一条提示。
      if (correct) {
        q.results[i] = { correct: true, ua: ua, revealed: true };
        q.score += (item.score || 1);
        q.userAnswers[i] = ua;
        renderQuiz();
      } else {
        // 仍未答对：更新最近答案，并把提示推进到下一条；用完提示仍可再试 / 看答案。
        prev.ua = ua;
        prev.hintStep = Math.min((prev.hintStep || 0) + 1, prev.hints.length - 1);
        q.userAnswers[i] = ua;
        renderQuiz();
      }
      return;
    }

    // 首次提交
    if (correct) {
      q.score += (item.score || 1);
      q.correctCount++;
      q.results[i] = { correct: true, ua: ua, revealed: true };
      q.userAnswers[i] = ua;
      renderQuiz();
    } else {
      if (q.isExam) {
        // 考试模式（考试中心）：不进入苏格拉底引导，答错直接揭晓答案并记入错题，让用户继续往后做。
        q.results[i] = { correct: false, ua: ua, revealed: true, hints: [], hintStep: 0 };
        q.userAnswers[i] = ua;
        const exist = q.wrongList.find(function (w) { return w.q === item; });
        if (!exist) q.wrongList.push({ q: item, ua: ua });
        renderQuiz();
      } else {
        // 答错：不直接给答案，进入「苏格拉底引导」——先给第一条提示，让用户继续想。
        q.results[i] = {
          correct: false,
          ua: ua,
          revealed: false,
          hints: makeSocraticHints(item),
          hintStep: 0
        };
        q.userAnswers[i] = ua;
        renderQuiz();
      }
    }
  };
  // 再要一条提示
  PC.hint = function () {
    const q = S.quiz; const i = q.idx; const res = q.results[i];
    if (!res || res.correct || res.revealed) return;
    if (res.hintStep >= res.hints.length - 1) { toast('已经是最后一条提示了'); return; }
    res.hintStep++;
    renderQuiz();
  };
  // 揭晓正确答案（同时记入错题本）
  PC.revealAnswer = function () {
    const q = S.quiz; const i = q.idx; const item = q.questions[i];
    const res = q.results[i];
    if (!res || res.revealed || res.correct) return;
    res.revealed = true;
    res.correct = false;
    // 仅记一次错题（避免同一题反复「看答案」重复入库）
    const exist = q.wrongList.find(function (w) { return w.q === item; });
    if (!exist) q.wrongList.push({ q: item, ua: q.userAnswers[i] });
    renderQuiz();
  };
  PC.prev = function () { if (S.quiz.idx > 0) { S.quiz.idx--; renderQuiz(); } };
  PC.next = function () { if (S.quiz.idx < S.quiz.questions.length - 1) { S.quiz.idx++; renderQuiz(); } };
  PC.jump = function (i) { if (S.quiz && i >= 0 && i < S.quiz.questions.length) { S.quiz.idx = i; renderQuiz(); } };
  PC.finish = function () { finishQuiz(); };
  PC.retry = function () { if (S.quiz && S.quiz.restart) S.quiz.restart(); else PC.go('home'); };
  PC.printPaper = function () { window.print(); };

  function finishQuiz() {
    const q = S.quiz;
    const total = q.questions.length;
    // 把未作答的题目统一记为「已揭晓 / 错误」，避免明细缺项
    for (let i = 0; i < total; i++) {
      if (!q.results[i]) {
        q.results[i] = { correct: false, ua: '', revealed: true, hints: [], hintStep: 0 };
        q.userAnswers[i] = '';
      }
    }
    // 入库：错题 + 学习记录
    q.wrongList.forEach(function (e) { pcAddWrong(e.q, e.ua, q.title, q.grade, q.module); });
    const correctCount = q.results.filter(function (r) { return r.correct; }).length;
    pcRecord(q.grade, q.title, correctCount, total, q.wrongList.map(function (e) { return { question: e.q, userAnswer: e.ua }; }), q.module);
    if (useCloud && typeof syncAfterQuiz === 'function') { try { syncAfterQuiz(); } catch (e) { } }

    // 切换到批改成绩页（第一步）
    renderScorePage();
  }

  function renderScorePage() {
    const q = S.quiz;
    const total = q.questions.length;
    const correctCount = q.results.filter(function (r) { return r.correct; }).length;
    const wrongCount = total - correctCount;
    const totalScore = q.totalScore || total;
    const score = Math.min(q.score || 0, totalScore);
    const acc = totalScore ? Math.round(score / totalScore * 100) : 0;
    const level = getGradeLevel(acc);
    const timeUsed = formatDuration(Date.now() - (q.startTime || Date.now()));
    const comment = generateTeacherComment(score, totalScore, acc, q.wrongList, q.grade, q.isExam);

    let detail = '';
    q.questions.forEach(function (item, i) {
      const r = q.results[i];
      const isCorrect = r && r.correct;
      const qscore = item.score || 1;
      const got = isCorrect ? qscore : 0;
      detail += '<div class="pc-score-row' + (isCorrect ? ' ok' : ' bad') + '">';
      detail += '<span class="pc-sr-no">第' + (i + 1) + '题</span>';
      detail += '<span class="pc-sr-type">' + questionTypeLabel(item.type) + '</span>';
      detail += '<span class="pc-sr-mark">' + (isCorrect ? svgHandwrittenCheck(true) : svgHandwrittenCheck(false)) + '</span>';
      detail += '<span class="pc-sr-score">' + got.toFixed(qscore % 1 === 0 ? 0 : 1) + '/' + qscore.toFixed(qscore % 1 === 0 ? 0 : 1) + '分</span>';
      detail += '</div>';
    });

    let h = '<div class="pc-grade-sheet">';
    h += '<div class="pc-teacher-header">';
    h += '<div class="pc-teacher-score">得分：<span>' + score.toFixed(totalScore % 1 === 0 && score % 1 === 0 ? 0 : 1) + '</span><span class="pc-teacher-total">/' + totalScore + '</span></div>';
    h += '<div class="pc-teacher-level ' + level.cls + '">等级：' + level.label + '</div>';
    h += '</div>';
    h += '<div class="pc-teacher-stars">' + level.stars + '</div>';
    h += '<div class="pc-result-stats">';
    h += '<div class="rs"><div class="n good">' + correctCount + '</div><div class="l">答对</div></div>';
    h += '<div class="rs"><div class="n bad">' + wrongCount + '</div><div class="l">答错</div></div>';
    h += '<div class="rs"><div class="n">' + acc + '%</div><div class="l">正确率</div></div>';
    h += '<div class="rs"><div class="n">' + esc(timeUsed) + '</div><div class="l">用时</div></div>';
    h += '</div>';
    h += '<div class="pc-teacher-comment"><span class="pc-tc-tag">老师批语</span>' + esc(comment) + '</div>';
    h += '<div class="pc-teacher-detail">';
    h += '<div class="pc-detail-title">各题得分明细</div>';
    h += '<div class="pc-detail-list">' + detail + '</div>';
    h += '</div>';
    h += '<button class="pc-btn primary pc-confirm-btn" onclick="PC.confirmScore()">✅ 确认成绩</button>';
    h += '</div>';
    $('pcContent').innerHTML = h;
  }

  PC.confirmScore = function () {
    renderAnswerKeyPage();
  };

  function renderAnswerKeyPage() {
    const q = S.quiz;
    const total = q.questions.length;
    let h = '<div class="pc-answer-key">';
    h += '<div class="pc-result-title">答案与解析</div>';
    // 按大题分组
    let secs = {};
    q.questions.forEach(function (item, i) {
      const key = item.sectionTitle || item.paperSection || '题目';
      if (!secs[key]) secs[key] = [];
      secs[key].push({ item: item, i: i });
    });
    Object.keys(secs).forEach(function (title) {
      h += '<div class="pc-answer-section">' + esc(title) + '</div>';
      secs[title].forEach(function (o) {
        const item = o.item, i = o.i;
        const r = q.results[i];
        const isCorrect = r && r.correct;
        const ua = (r && r.ua !== undefined) ? r.ua : (q.userAnswers[i] || '');
        h += '<div class="pc-answer-item ' + (isCorrect ? 'ok' : 'bad') + '">';
        h += '<div class="pc-ai-head">';
        h += '<span class="pc-ai-no">第' + (i + 1) + '题</span>';
        h += '<span class="pc-ai-type">' + questionTypeLabel(item.type) + '</span>';
        h += '<span class="pc-ai-mark">' + (isCorrect ? svgHandwrittenCheck(true) : svgHandwrittenCheck(false)) + '</span>';
        h += '</div>';
        if (item.passage) h += '<div class="pc-passage">' + item.passage + '</div>';
        h += '<div class="pc-ai-stem">' + esc(item.question) + '</div>';
        if (item.svg) h += '<div class="pc-q-svg"><svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">' + item.svg + '</svg></div>';
        if (item.options && item.options.length) {
          h += '<div class="pc-ai-opts">';
          item.options.forEach(function (opt, idx) {
            const txt = optText(opt);
            let cls = '';
            if (txt === String(item.answer)) cls = ' correct';
            else if (txt === String(ua) && !isCorrect) cls = ' wrong';
            h += '<div class="pc-ai-opt' + cls + '">' + String.fromCharCode(65 + idx) + '. ' + esc(txt) + '</div>';
          });
          h += '</div>';
        }
        h += '<div class="pc-ai-ans-row">';
        h += '<span>你的答案：<b class="' + (isCorrect ? 'ok' : 'bad') + '">' + (ua !== '' ? esc(ua) : '未作答') + '</b></span>';
        h += '<span>正确答案：<b class="ok">' + esc(item.answer) + '</b></span>';
        h += '</div>';
        if (item.explain) h += '<div class="pc-ai-explain"><b>解析：</b>' + esc(item.explain) + '</div>';
        if (item.steps && item.steps.length) {
          h += '<div class="pc-ai-steps"><b>步骤：</b>' + item.steps.map(function (s, idx) { return '<span>' + (idx + 1) + '. ' + esc(s) + '</span>'; }).join('') + '</div>';
        }
        h += '</div>';
      });
    });
    h += '<div class="pc-row u-jc u-g12 u-mt18">';
    h += '<button class="pc-btn primary" onclick="PC.retry()">重新考试</button>';
    h += '<button class="pc-btn ghost" onclick="PC.back()">返回单元学习</button>';
    if (q.isExam) h += '<button class="pc-btn ghost" onclick="PC.printPaper()">打印试卷</button>';
    h += '</div>';
    h += '</div>';
    $('pcContent').innerHTML = h;
  }

  /* ---------------- 家长端 ---------------- */
  async function renderDashboard(c) {
    c.innerHTML = '<div class="pc-loading">正在同步家庭学习数据…</div>';
    setSyncChip('loading', '同步中');
    const records = await loadRecords();
    if (!records.length) {
      c.innerHTML = '<div class="pc-card"><div class="pc-empty">暂无学习记录。在手机端完成练习并同步后，这里会显示孩子的学习情况。</div></div>';
      setSyncChip('ok', '已同步'); mountHero(c); return;
    }
    setSyncChip('ok', '已同步');
    const st = computeStats(records);
    let h = '<div class="pc-grid pc-metrics">';
    h += metric('练习次数', st.count, 'c-blue') + metric('平均正确率', st.avg + '%', 'c-green') + metric('薄弱单元', st.weak.length, 'c-red') + metric('连续学习', st.cont + '天', 'c-gold');
    h += '</div>';
    h += '<div class="pc-grid pc-two u-mt16">';
    h += '<div class="pc-card"><h3>每日练习量（近14天）</h3>' + svgTrend(st.trend) + '</div>';
    h += '<div class="pc-card"><h3>各单元正确率</h3>' + unitBars(st.units) + '</div>';
    h += '</div>';
    h += '<div class="pc-grid pc-two u-mt16">';
    h += '<div class="pc-card"><h3>薄弱点</h3>' + (st.weak.length ? st.weak.map(function (u) { return '<span class="pc-chip">' + esc(u.name) + '（' + u.acc + '%）</span>'; }).join('') : '<div class="pc-empty">暂无明显薄弱点</div>') + '</div>';
    h += '<div class="pc-card"><h3>最近练习</h3>' + recentListHtml(records.slice(0, 8)) + '</div>';
    h += '</div>';
    c.innerHTML = h; mountHero(c);
  }
  async function renderRecent(c) {
    const records = await loadRecords();
    c.innerHTML = '<div class="pc-card"><h3>最近练习（全部 ' + records.length + ' 条）</h3>' + recentListHtml(records) + '</div>';
    mountHero(c);
  }
  async function renderWrongDetail(c) {
    c.innerHTML = '<div class="pc-loading">加载中…</div>';
    const records = await loadRecords();
    let items = [];
    records.forEach(function (r) { (r.wrong || []).forEach(function (w) { items.push({ unitName: r.unitName, grade: r.grade, module: r.module, w: w }); }); });
    if (!items.length) { c.innerHTML = '<div class="pc-empty">暂无逐题错题记录。</div>'; return; }
    let h = '<div class="pc-card"><h3>逐题错题（共 ' + items.length + ' 道）</h3>';
    items.slice(0, 40).forEach(function (it) {
      const raw = it.w;
      const q = (raw && raw.question && raw.question.question) ? raw.question : raw;
      const ua = (raw && raw.userAnswer != null) ? raw.userAnswer : '—';
      h += '<div class="pc-wrong-item"><div class="pc-wrong-meta">' + esc(it.unitName || '') + (it.grade ? ' · ' + it.grade + '年级' : '') + (it.module ? ' · ' + it.module : '') + '</div>';
      if (q.passage) h += '<div class="pc-passage">' + q.passage + '</div>';
      h += '<div class="pc-wrong-stem">' + esc(q.question) + '</div>';
      if (q.svg) h += '<div class="pc-wrong-svg"><svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">' + q.svg + '</svg></div>';
      h += '<div class="pc-wrong-ans">你的答案：<span class="me">' + esc(ua) + '</span>　正确答案：<span class="ok">' + esc(q.answer) + '</span></div>';
      if (q.explain) h += '<div class="pc-wrong-explain">解析：' + esc(q.explain) + '</div>';
      h += '</div>';
    });
    h += '</div>';
    c.innerHTML = h; mountHero(c);
  }

  /* ---------------- 统计与图表 ---------------- */
  function computeStats(records) {
    const valid = records.filter(function (r) { return r.total > 0; });
    const avg = valid.length ? Math.round(valid.reduce(function (s, r) { return s + (r.accuracy != null ? r.accuracy : Math.round(r.score / r.total * 100)); }, 0) / valid.length) : 0;
    const umap = {};
    valid.forEach(function (r) {
      const k = r.unitName || '未命名'; if (!umap[k]) umap[k] = { s: 0, n: 0 };
      umap[k].s += (r.accuracy != null ? r.accuracy : Math.round(r.score / r.total * 100)); umap[k].n++;
    });
    const units = Object.keys(umap).map(function (k) { return { name: k, acc: Math.round(umap[k].s / umap[k].n), n: umap[k].n }; }).sort(function (a, b) { return a.acc - b.acc; });
    const weak = units.filter(function (u) { return u.acc < 70; });
    const days = {}; const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); days[d.toISOString().slice(0, 10)] = 0; }
    records.forEach(function (r) { if (!r.time) return; const ds = new Date(r.time); ds.setHours(0, 0, 0, 0); const key = ds.toISOString().slice(0, 10); if (key in days) days[key]++; });
    const trend = Object.keys(days).map(function (k) { return { date: k, count: days[k] }; });
    const daySet = new Set(records.filter(function (r) { return r.time; }).map(function (r) { const d = new Date(r.time); d.setHours(0, 0, 0, 0); return d.toISOString().slice(0, 10); }));
    let cont = 0; const cur = new Date(today);
    while (daySet.has(cur.toISOString().slice(0, 10))) { cont++; cur.setDate(cur.getDate() - 1); }
    return { avg: avg, units: units, weak: weak, trend: trend, cont: cont, count: records.length };
  }
  function svgTrend(trend) {
    const W = 600, H = 160, pad = 26; const max = Math.max(1, Math.max.apply(null, trend.map(function (t) { return t.count; })));
    const n = trend.length; const x = function (i) { return pad + i * (W - 2 * pad) / (n - 1 || 1); };
    const y = function (v) { return H - pad - (v / max) * (H - 2 * pad); };
    const pts = trend.map(function (t, i) { return x(i).toFixed(1) + ',' + y(t.count).toFixed(1); }).join(' ');
    const dots = trend.map(function (t, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(t.count).toFixed(1) + '" r="3" fill="#3E4A63"/>'; }).join('');
    const labels = trend.map(function (t, i) { return i % 2 === 0 ? '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" font-size="10" fill="#9AA0AB" text-anchor="middle">' + t.date.slice(5) + '</text>' : ''; }).join('');
    return '<svg class="pc-trend-svg" viewBox="0 0 ' + W + ' ' + H + '"><polyline points="' + pts + '" fill="none" stroke="#B4945A" stroke-width="2.5"/>' + dots + labels + '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" stroke="#E7E4DC"/></svg>';
  }
  function unitBars(units) {
    if (!units.length) return '<div class="pc-empty">暂无单元数据</div>';
    return units.map(function (u) {
      // v82：配色按正确率三档取值，收敛成 .bar-hi/.bar-mid/.bar-lo 语义类（css/pc.css）
      const barCls = u.acc >= 80 ? 'bar-hi' : u.acc >= 60 ? 'bar-mid' : 'bar-lo';
      return '<div class="pc-bar-row"><span class="bl">' + esc(u.name) + '</span><div class="pc-bar-track"><div class="pc-bar-fill ' + barCls + ' ' + wpCls(u.acc) + '"></div></div><span class="pc-bar-val">' + u.acc + '%</span></div>';
    }).join('');
  }
  function recentListHtml(records) {
    if (!records || !records.length) return '<div class="pc-empty">暂无记录</div>';
    return '<div class="pc-list">' + records.map(function (r) {
      const acc = r.accuracy != null ? r.accuracy : Math.round(r.score / r.total * 100);
      const cl = acc >= 80 ? 'good' : acc >= 60 ? 'mid' : 'bad';
      const mod = r.module === '数学' ? '数学' : r.module === '语文' ? '语文' : r.module === '英语' ? '英语' : '';
      return '<div class="pc-list-row"><div class="lr-left"><span class="lr-name">' + esc(r.unitName || '练习') + '</span>' + (mod ? '<span class="pc-mod-tag">' + mod + '</span>' : '') + '</div><div class="u-tr"><div class="lr-meta">' + fmtDate(r.time) + '</div><div class="pc-score-pill ' + cl + '">' + acc + '分</div></div></div>';
    }).join('') + '</div>';
  }
  function metric(label, num, cls) { return '<div class="pc-card pc-metric ' + cls + '"><div class="m-label">' + label + '</div><div class="m-num">' + num + '</div></div>'; }

  function bindSeg(id, cb) {
    const el = $(id); if (!el) return;
    el.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { el.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); cb(b.dataset.t || b.dataset.g || b.dataset.s || b.dataset.u); };
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    document.querySelectorAll('#pcRoleToggle button').forEach(function (b) {
      b.onclick = function () { S.role = b.dataset.role; S.view = S.role === 'student' ? 'home' : 'dashboard'; renderNav(); renderContent(); };
    });
    $('pcRefreshBtn').onclick = PC.refresh;
    $('pcMergeBtn').onclick = PC.merge;
    updateFootId();
    updateFootVer();
    setSyncChip('ok', '本地');
    renderNav(); renderContent();
  }
  window.PC = PC;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
