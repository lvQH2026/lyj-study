/* ======================================================================
   aixueGuide.js — 豆包爱学式讲题引导 · 框架
   聚合 __AXG_DATA.* 数据，提供：
   - detectConceptJunior(text)：按题干关键词识别知识点（初中 + 小学）
   - makeAixueGuide(item)：返回引导对象 {topic,key,steps,summary}（未识别走兜底）
   - guideHtml(guide)：生成讲题卡片 HTML（PC 端与手机端共用）
   加载顺序：必须在各 aixueGuide-*.js 之后、使用方（pc.js / 答题引擎）之前。
   ====================================================================== */
(function (w) {
  'use strict';

  var DATA = w.__AXG_DATA || {};
  var CONCEPT_GUIDE = {};
  Object.keys(DATA).forEach(function (k) {
    var g = DATA[k];
    if (!g) return;
    Object.keys(g).forEach(function (key) { CONCEPT_GUIDE[key] = g[key]; });
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------------- 知识点检测（初中优先，再小学） ---------------- */
  function detectConceptJunior(text) {
    const t = text || '';

    /* ===== 数学 · 七年级上 ===== */
    if (/简便运算|简便计算|简便方法|乘法交换|乘法结合|乘法分配|凑整/.test(t)) return 'rational_multiply_simple';
    if (/数轴|相反数|绝对值/.test(t)) return 'rational_basic';
    if (/有理数.*(加|减|混合)/.test(t)) return 'rational_add_sub';
    if (/有理数.*(乘|除)/.test(t)) return 'rational_multiply_div';
    if (/乘方|幂/.test(t) && /有理数|计算/.test(t)) return 'rational_power';
    if (/混合运算|有理数计算|有理数.*运算/.test(t)) return 'rational_mixed';
    if (/单项式|多项式|整式.*(加减|合并同类项)|合并同类项/.test(t)) return 'algebraic_expression';
    if (/一元一次方程|解方程|求x|未知数/.test(t)) return 'equation_linear';
    if (/方程.*应用|列方程|行程问题|工程问题|利润问题|配套问题/.test(t)) return 'equation_application';
    if (/线段|中点|余角|补角|角平分线|几何图形/.test(t)) return 'geometry_basic';

    /* ===== 数学 · 七年级下 ===== */
    if (/相交线|平行线|同位角|内错角|同旁内角/.test(t)) return 'parallel_lines';
    if (/平方根|立方根|无理数|实数/.test(t)) return 'real_number';
        if (/二次函数|抛物线|顶点|对称轴|开口/.test(t)) return 'quadratic_function';
    if (/平面直角坐标系|象限|坐标/.test(t)) return 'coordinate_system';
    if (/二元一次方程|方程组|代入消元|加减消元|消元/.test(t)) return 'equation_system';
        if (/方程组.*应用|列方程组/.test(t)) return 'equation_system_app';
    if (/不等式组|不等式的解集|解不等式/.test(t)) return 'inequality';
    if (/不等式.*应用|方案.*(最|至少|最多)|至少|不超过/.test(t)) return 'inequality_app';
    if (/统计|频数|频率|直方图|抽样调查|普查/.test(t)) return 'statistics';

    /* ===== 数学 · 八年级上 ===== */
    if (/三角形.*(内角|外角|三边|面积)/.test(t)) return 'triangle_basic';
    if (/全等|SSS|SAS|ASA|AAS|HL/.test(t)) return 'triangle_congruent';
    if (/轴对称|等腰三角形|等边三角形|垂直平分线/.test(t)) return 'axis_symmetry';
    if (/幂的运算|同底数幂|整式乘法|单项式乘/.test(t)) return 'polynomial_multiply';
    if (/平方差|完全平方|乘法公式/.test(t)) return 'multiplication_formula';
    if (/因式分解|提公因式|十字相乘/.test(t)) return 'factorization';

    /* ===== 数学 · 八年级下 ===== */
    if (/分式方程|分式运算|约分|通分/.test(t)) return 'fraction_expression';
    if (/二次根式|根号|最简二次根式/.test(t)) return 'radical';
    if (/勾股定理|直角三角形|斜边/.test(t)) return 'pythagorean';
    if (/平行四边形|矩形|菱形|正方形|中位线/.test(t)) return 'quadrilateral';
    if (/一次函数|正比例函数|待定系数法/.test(t)) return 'linear_function';
    if (/平均数|中位数|众数|方差/.test(t)) return 'data_analysis';

    /* ===== 数学 · 九年级 ===== */
    if (/一元二次方程|配方法|判别式|b²-4ac/.test(t)) return 'quadratic_equation';
    if (/旋转|中心对称/.test(t)) return 'rotation';
    if (/圆.*面积|面积.*圆/.test(t)) return 'circleArea';
    if (/圆.*周长|周长.*圆/.test(t)) return 'circlePerim';
    if (/圆(?!的(面积|周长))|圆心|圆周角|切线|弧长|扇形|垂径/.test(t)) return 'circle_junior';
        if (/遗传|变异|基因|DNA|染色体|性状|显性|隐性/.test(t)) return 'bio_genetics';
    if (/概率|随机事件|树状图|列表法/.test(t)) return 'probability';
    if (/相似三角形|相似比|位似/.test(t)) return 'similar_triangle';
    if (/三角函数|sin|cos|tan|解直角/.test(t)) return 'trigonometry';
    if (/三视图|投影|视图/.test(t)) return 'projection';

    /* ===== 语文 ===== */
    if (/概括.*(内容|段意|主要)|主要内容|段意/.test(t)) return 'cn_summary';
    if (/赏析|品味|表达效果|妙处|好处|为什么.*(这样写|这样用)|这句话.*(作用|效果)|句段.*作用/.test(t)) return 'cn_appreciation';
    if (/(标题|题目).*(作用|含义|妙处)/.test(t)) return 'cn_title';
    if (/环境描写|景物描写|环境.*作用/.test(t)) return 'cn_environment';
    if (/人物形象|性格|品质/.test(t)) return 'cn_character';
    if (/说明方法|举例子|列数字|作比较|打比方|分类别|下定义/.test(t)) return 'cn_exposition_method';
    if (/说明顺序|时间顺序|空间顺序|逻辑顺序|能否删去|准确性/.test(t)) return 'cn_exposition_order';
    if (/论点|论据|论证方法|举例论证|道理论证|对比论证|比喻论证/.test(t)) return 'cn_argument';
    if (/文言|实词|虚词|翻译|一词多义/.test(t)) return 'cn_classical';
    if (/古诗|诗词|意象|意境|鉴赏|炼字|《[^》]{2,14}》的?(作者|出处|选自|含义)|词牌名/.test(t)) return 'cn_poetry';
    if (/名著|人物形象.*情节|作品.*作者/.test(t)) return 'cn_classic';
    if (/作文|写作|立意|选材|书面表达/.test(t)) return 'cn_writing';

    /* ===== 英语 ===== */
    if (/完形|填空.*(上下文|逻辑)/.test(t)) return 'en_cloze';
    if (/阅读.*细节|细节理解/.test(t)) return 'en_reading_detail';
    if (/阅读.*(主旨|大意|标题)/.test(t)) return 'en_reading_main';
    if (/阅读.*(推理|推断|判断)/.test(t)) return 'en_reading_infer';
    if (/词义猜测|猜测.*词义|划线词/.test(t)) return 'en_reading_word';
    if (/yesterday|tomorrow|时态|语态|从句|冠词|介词|连词|语法|动词.*(过去式|现在时|将来时)|主谓一致/.test(t)) return 'en_grammar';
    if (/词形转换|固定搭配|词汇运用/.test(t)) return 'en_vocabulary';
    if (/作文|写作|书面表达|书信|通知|演讲稿/.test(t)) return 'en_writing';

    /* ===== 物理 ===== */
    if (/声|音调|响度|音色|超声波|次声波|噪声/.test(t)) return 'phy_sound';
    if (/光|反射|折射|平面镜|凸透镜|凹透镜|焦距|成像/.test(t)) return 'phy_light';
    if (/物态变化|熔化|凝固|汽化|液化|升华|凝华|沸点|熔点/.test(t)) return 'phy_state';
    if (/质量与密度|密度|天平|量筒/.test(t)) return 'phy_density';
    if (/运动|速度|参照物|匀速|变速|惯性/.test(t)) return 'phy_motion';
    if (/重力|弹力|摩擦力|二力平衡|力的示意图/.test(t)) return 'phy_force';
    if (/压强|液体压强|大气压|浮力|阿基米德|浮沉/.test(t)) return 'phy_pressure';
        if (/电功率|焦耳定律|额定|电能/.test(t)) return 'phy_electric_power';
    if (/功|功率|机械效率|杠杆|滑轮|斜面|动能|势能/.test(t)) return 'phy_work';
    if (/欧姆定律|电流|电压|电阻|串联|并联|电流表|电压表/.test(t)) return 'phy_electric_basic';
    if (/电与磁|磁场|磁感线|电磁铁|电磁感应|发电机|电动机/.test(t)) return 'phy_magnetism';
    if (/实验题|实验探究|实验方案/.test(t)) return 'phy_experiment';

    /* ===== 化学 ===== */
    if (/物理变化|化学变化|物理性质|化学性质/.test(t)) return 'chem_basic';
        if (/化学方程式|配平|质量守恒|根据方程式计算/.test(t)) return 'chem_equation';
    if (/空气|氧气|氮气|稀有气体|燃烧.*氧/.test(t)) return 'chem_air';
    if (/分子|原子|离子|元素周期表|化合价|化学式/.test(t)) return 'chem_structure';
    if (/碳|二氧化碳|一氧化碳|金刚石|石墨|温室效应/.test(t)) return 'chem_carbon';
    if (/燃料|燃烧条件|灭火|化石燃料|新能源/.test(t)) return 'chem_fuel';
    if (/金属活动性|置换反应|合金|生锈|冶炼/.test(t)) return 'chem_metal';
    if (/溶液|溶解度|溶质|溶剂|饱和|溶质质量分数|结晶/.test(t)) return 'chem_solution';
    if (/酸|碱|盐|pH|中和反应|复分解反应|化肥/.test(t)) return 'chem_acid_base_salt';
    if (/化学与生活|营养素|糖类|蛋白质|油脂|维生素|合成材料|塑料/.test(t)) return 'chem_life';

    /* ===== 道法 ===== */
    if (/评析|辨析|评价|判断.*正确/.test(t)) return 'moral_evaluate';
    if (/怎么做|如何|措施|建议|启示.*做/.test(t)) return 'moral_how';
    if (/为什么|原因|意义|重要性|作用/.test(t)) return 'moral_why';
    if (/道法|法治|道德与法治|宪法|国情|国策|战略|核心价值|中国梦|材料(体现|说明|反映|表明)/.test(t)) return 'moral_what';

    /* ===== 历史 ===== */
    if (/论述|论证|观点|史论结合/.test(t)) return 'his_argument';
    if (/启示|认识|看法|借鉴/.test(t)) return 'his_inspiration';
    if (/影响|意义|作用|后果|评价/.test(t)) return 'his_impact';
    if (/原因|背景|条件|为什么/.test(t)) return 'his_reason';
    if (/概括|归纳|指出|有哪些/.test(t)) return 'his_summary';

    /* ===== 地理 ===== */
    if (/地理位置|经纬度|半球|海陆位置/.test(t)) return 'geo_location';
    if (/气候|气温|降水|季风/.test(t)) return 'geo_climate';
    if (/地形|地势|山脉|平原|高原|盆地|丘陵/.test(t)) return 'geo_terrain';
    if (/河流|水文|流量|汛期|含沙量|结冰期|水系/.test(t)) return 'geo_river';
    if (/农业|种植业|畜牧业|农作物|区位.*(自然|社会)/.test(t)) return 'geo_agriculture';
    if (/工业|工业区|工业区位|矿产|资源/.test(t)) return 'geo_industry';
    if (/人口|城市|交通|聚落/.test(t)) return 'geo_population';
    if (/区域综合|区域发展|可持续发展/.test(t)) return 'geo_region';

    /* ===== 生物 ===== */
    if (/细胞膜|细胞质|细胞核|线粒体|叶绿体|液泡|细胞分裂|细胞分化/.test(t)) return 'bio_cell';
    if (/光合作用|呼吸作用|蒸腾作用|有机物|二氧化碳.*氧气/.test(t)) return 'bio_photosynthesis';
    if (/消化|吸收|循环|呼吸系统|泌尿|神经|内分泌|运动系统/.test(t)) return 'bio_human';
    if (/生态系统|食物链|食物网|生产者|消费者|分解者|生物圈/.test(t)) return 'bio_ecology';
    if (/探究|变量|对照|假设|结论|单一变量/.test(t)) return 'bio_experiment';
    if (/图表|曲线图|坐标图/.test(t)) return 'bio_graph';

    /* ===== 小学（复用旧 CONCEPT_HINTS 概念） ===== */
    if (/直径|半径|圆心|圆周率/.test(t)) return 'circle';
    if (/(圆面积|圆的面积)/.test(t)) return 'circleArea';
    if (/(圆周长|圆的周长|周长.*圆)/.test(t)) return 'circlePerim';
    if (/(三角形|三角).*内角/.test(t)) return 'triangleAngle';
    if (/(三角形|三角).*面积/.test(t)) return 'triangleArea';
    if (/长方形/.test(t)) return 'rect';
    if (/正方形/.test(t)) return 'square';
    if (/平行四边形|梯形/.test(t)) return 'parallel';
    if (/分数|约分|通分/.test(t)) return 'fraction';
    if (/小数/.test(t)) return 'decimal';
    if (/百分|%|折扣|成数/.test(t)) return 'percent';
    if (/比[的例]|化简比|按比|比值/.test(t)) return 'ratio';
    if (/方程|未知数|解.{0,3}程|求x/.test(t)) return 'equation';
    if (/速度|路程|时间/.test(t) && /千米|米|km|小时|分钟/.test(t)) return 'travel';
    if (/工程|单独完成|合作|工作效率/.test(t)) return 'work';
    if (/平均数|平均分/.test(t)) return 'average';
    if (/因数|倍数|质数|合数|最大公因|最小公倍/.test(t)) return 'factor';
    if (/负数|数轴/.test(t)) return 'negative';
    if (/方向|位置|数对|第.列|第.行|东|南|西|北/.test(t)) return 'position';
    if (/圆柱|圆锥/.test(t)) return 'cylinder';
    if (/单位换算|公顷|平方千米|进率/.test(t)) return 'unit';
    if (/植树|间隔|两端/.test(t)) return 'tree';
    if (/鸡兔/.test(t)) return 'chicken';
    if (/次品|砝码|天平.*称/.test(t)) return 'defect';
    if (/鸽巢|抽屉/.test(t)) return 'pigeon';
    if (/时分秒|几时|几时几分/.test(t)) return 'time';
    if (/条形|折线|扇形|统计图/.test(t)) return 'chart';
    if (/阅读|短文|文段|段落|文章|中心思想/.test(t)) return 'passage';

    return null;
  }

  /* ---------------- 兜底通用引导 ---------------- */
  function genericAixueGuide(item) {
    const isChoice = (item && (item.type === 'choice' || item.type === 'judge'));
    return {
      topic: isChoice ? '选择题通用解法' : '解答题通用解法',
      key: '解题通用步骤：① 仔细读题，圈出关键词和已知条件；② 判断题型，回忆对应的公式、定理或方法；③ 列式 / 推理，逐步计算；④ 检验结果是否合理。',
      steps: [
        { title: '第一步：读题圈关键词', formula: '把题目中的已知条件、单位、问题要求圈出来，明确“求什么”。' },
        { title: '第二步：判断题型，回忆方法', formula: '这道题属于哪一类？对应的公式 / 定理 / 解题模板是什么？' },
        { title: '第三步：列式 / 推理，逐步计算', formula: isChoice ? '用排除法先划掉明显错误的选项，再在剩下的选项中比较选择。' : '按步骤列式计算，每一步写清楚，不要跳步。' },
        { title: '第四步：检验结果', formula: '把结果代回题目检验，确认单位正确、数量级合理、符合题意。' }
      ],
      summary: '通用方法：先审题（圈关键词）→ 再定方法（回忆公式）→ 后计算（分步不跳步）→ 最后检验（代回验证）。基础题按这四步走，基本不会错。'
    };
  }

  /* ---------------- 入口：生成引导对象 ---------------- */
  function makeAixueGuide(item, extraText) {
    // extraText 一般传单元名（如「整式的加减」），算式类题干不含知识点关键词时靠它识别。
    const text = ((item && item.question) || '') + ' ' + ((item && item.explain) || '') + ' ' + (extraText || '');
    const concept = detectConceptJunior(text);
    if (concept && CONCEPT_GUIDE[concept]) return CONCEPT_GUIDE[concept];
    return genericAixueGuide(item);
  }

  /* ---------------- 卡片 HTML 生成（PC / 手机共用类名 .aixue-card） ---------------- */
  // 将文本中的斜杠分数转为上下堆叠竖式 HTML（与豆包爱学一致）
  function fracToHtml(text) {
    // 1. 带括号的分数：(分子)/(分母)，如 (3×5)/(2×2)
    text = text.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>');
    // 2. 简单分数：数字/数字，含负号、小数，如 3/2、-1/2、15/4
    text = text.replace(/(?<![\w/])(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>');
    return text;
  }

  function guideHtml(guide) {
    const g = guide || {};
    let h = '<div class="aixue-card show">';
    h += '<div class="ax-topic">题型：' + esc(g.topic || '综合题') + '</div>';
    if (g.key) {
      h += '<div class="ax-key"><div class="ax-key-title">💡 解题关键</div><div class="ax-key-text">' + fracToHtml(esc(g.key).replace(/\n/g, '<br>')) + '</div></div>';
    }
    if (g.steps && g.steps.length) {
      h += '<div class="ax-steps">';
      g.steps.forEach(function (s, si) {
        h += '<div class="ax-step"><div class="ax-step-title">' + esc(s.title || ('第' + (si + 1) + '步')) + '</div>';
        if (s.formula) h += '<div class="ax-step-formula">' + fracToHtml(esc(s.formula).replace(/\n/g, '<br>')) + '</div>';
        h += '</div>';
      });
      h += '</div>';
    }
    if (g.summary) h += '<div class="ax-summary">' + fracToHtml(esc(g.summary)) + '</div>';
    h += '</div>';
    return h;
  }

  /* ---------------- AI 加载态 HTML ---------------- */
  function loadingHtml() {
    return '<div class="aixue-card show ai-loading">' +
      '<div class="ax-loading-spinner"></div>' +
      '<div class="ax-loading-text">AI 老师正在为你讲解这道题…</div>' +
      '</div>';
  }

  /* ---------------- 导出 ---------------- */
  w.AixueGuide = {
    CONCEPT_GUIDE: CONCEPT_GUIDE,
    detectConceptJunior: detectConceptJunior,
    genericAixueGuide: genericAixueGuide,
    makeAixueGuide: makeAixueGuide,
    guideHtml: guideHtml,
    loadingHtml: loadingHtml
  };
})(window);
