// ============================================================
// 语文模块 (Chinese Module)
// 4-6年级 · 按知识板块组织 · 含阅读理解 · 纯文字（无语音无写作）
// 与数学/英语共享 localStorage['math_practice_data']，错题带 module:'语文'
// ============================================================
(function () {
  'use strict';

  // ---- 工具函数 ----
  function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function mkChoice(q, ans, opts) {
    const options = shuffle([ans, ...opts]);
    return { type: 'choice', question: q, options, answer: ans };
  }
  function mkFill(q, ans) {
    return { type: 'fill', question: q, answer: ans };
  }
  function mkJudge(q, ans) {
    return { type: 'judge', question: q, answer: ans ? '正确' : '错误', options: ['正确', '错误'] };
  }

  // ============================================================
  // 四年级 · 知识板块
  // ============================================================

  // ---- 拼音 ----
  function cn4_pinyin() {
    const items = [
      mkChoice('"骄傲"的"骄"正确读音是？', 'jiāo', ['jiáo', 'jiǎo', 'jiào']),
      mkChoice('下列哪个字的韵母是"ang"？', '帮', ['本', '百', '北']),
      mkChoice('"地区"的"区"正确读音是？', 'qū', ['qú', 'qǔ', 'qù']),
      mkChoice('下列哪组拼音的声调标注位置正确？', 'mài（卖）', ['màī（卖）', 'maì（卖）', 'māi（卖）']),
      mkFill('写出"旅"字的拼音：____', 'lǚ'),
      mkJudge('"披"和"批"的读音相同。', false),
      mkChoice('"庄稼"中"稼"的正确读音是？', 'jia', ['jià', 'jiǎ', 'jia']),
      mkFill('"善良"的"善"拼音是____', 'shàn'),
      mkJudge('整体认读音节"ye"不需要拼读，直接读。', true),
      mkChoice('下列哪个是整体认读音节？', 'yuan', ['yan', 'yun', 'yue']),
    ];
    return items[ri(0, items.length - 1)];
  }

  // ---- 易错字/形近字 ----
  function cn4_chars() {
    const items = [
      mkChoice('下列词语书写完全正确的是？', '蜿蜒', ['蜿蜓', '婉蜒', '婉蜓']),
      mkChoice('"墙上___满了爬山虎"，应填？', '爬', ['扒', '趴', '巴']),
      mkChoice('下列哪组是形近字？', '浇/饶/绕', ['好/妈/姐', '大/太/天', '人/入/八']),
      mkFill('"___然不同"中应填"截"还是"接"？____', '截'),
      mkJudge('"拔草"和"拨草"是同一个词的不同写法。', false),
      mkChoice('下列哪个字容易多写一笔？', '武（易多一撇）', ['王', '大', '人']),
      mkChoice('"___葬"中应填？', '埋', ['理', '狸', '里']),
      mkFill('"前___后继"中应填"仆"还是"扑"？____', '仆'),
      mkJudge('"即"和"既"是形近字，读音和意思都不同。', true),
      mkChoice('下列词语中没有错别字的是？', '美丽', ['美力', '美利', '美厉']),
    ];
    return items[ri(0, items.length - 1)];
  }

  // ---- 词语（近反义词、成语、量词） ----
  function cn4_words() {
    const syn = [
      ['美丽', '漂亮'], ['快乐', '高兴'], ['仔细', '认真'], ['简单', '容易'],
      ['寒冷', '冰冷'], ['勇敢', '英勇'], [' famous', '著名'],
    ];
    const ant = [
      ['高', '矮'], ['冷', '热'], ['快', '慢'], ['黑', '白'],
      ['安静', '嘈杂'], ['失败', '成功'], ['危险', '安全'],
    ];
    const idioms = [
      ['画蛇添足', '比喻做了多余的事'],
      ['亡羊补牢', '比喻出了问题以后想办法补救'],
      ['守株待兔', '比喻不主动努力，妄想得到意外的收获'],
      ['刻舟求剑', '比喻拘泥固执，不知变通'],
    ];
    const classifiers = ['一__书', '一__笔', '一__树', '一__船', '一__画', '一__歌'];
    const clsAns = ['本', '支', '棵', '条', '幅', '首'];

    const items = [
      mkChoice('"' + pick(syn)[0] + '"的近义词是？', pick(syn)[1], shuffle(pick(syn).slice().reverse().map((v, i) => v)).slice(0, 3)),
      mkChoice('"' + pick(ant)[0] + '"的反义词是？', pick(ant)[1], [' ' + pick(ant)[0], pick(syn)[1], pick(ant)[0]]),
    ];
    // Simplified version - just use pre-made questions
    return pick([
      mkChoice('"勇敢"的近义词是？', '英勇', ['害怕', '胆小', '退缩']),
      mkChoice('"安静"的反义词是？', '嘈杂', ['平静', '宁静', '安静']),
      mkChoice('"失败"的反义词是？', '成功', ['挫折', '错误', '失望']),
      mkChoice('"仔细"的近义词是？', '认真', ['马虎', '粗心', '随便']),
      mkChoice('"刻舟求剑"的意思是？', '比喻拘泥固执，不知变通', ['比喻非常勇敢', '比喻非常聪明', '比喻速度快']),
      mkChoice('"亡羊补牢"的意思是？', '比喻出了问题以后想办法补救', ['比喻羊丢了', '比喻修墙', '比喻养羊']),
      mkChoice('"守株待兔"的意思是？', '比喻不主动努力，妄想意外收获', ['比喻保护树木', '比喻看守兔子', '比喻种田']),
      mkFill('"一____书"中应填的量词是？', '本'),
      mkFill('"一____画"中应填的量词是？', '幅'),
      mkFill('"一____歌"中应填的量词是？', '首'),
      mkJudge('"画蛇添足"比喻做了多余的事。', true),
      mkJudge('"拔苗助长"比喻做事要有耐心。', false),
    ]);
  }

  // ---- 句子（修改病句、关联词、修辞） ----
  function cn4_sentences() {
    return pick([
      mkChoice('下列句子没有语病的是？', '我每天早上七点起床。', [
        '我每天早上七点起床了去上学。',
        '我每天早上七点起床和吃饭和上学。',
        '我每天早上七点起床了。',
      ]),
      mkChoice('"___你不去，___我不去。"应填？', '因为…所以…', ['虽然…但是…', '不但…而且…', '如果…就…']),
      mkChoice('下列哪个句子用了比喻？', '弯弯的月亮像一条小船。', [
        '月亮升起来了。',
        '我喜欢看月亮。',
        '月亮真亮啊！',
      ]),
      mkChoice('下列句子中，哪句是问句？', '你今天作业写完了吗？', [
        '今天的天气真好。',
        '快去写作业！',
        '我写完了作业。',
      ]),
      mkFill('"这个苹果___大___红"（填关联词）：____', '又…又…'),
      mkJudge('"太阳像个大火球"是拟人句。', false),
      mkJudge('"因为下雨，所以运动会取消了。"用了因果关系。', true),
      mkChoice('修改病句："我买了书和铅笔和橡皮和尺子。"正确改法是？', '我买了书、铅笔、橡皮和尺子。', [
        '我买了书和铅笔和橡皮和尺子。',
        '我买了书铅笔橡皮尺子。',
        '我买了书、和铅笔、和橡皮、和尺子。',
      ]),
      mkChoice('"小红___学习好，___乐于助人。"应填？', '不但…而且…', ['因为…所以…', '虽然…但是…', '只有…才…']),
      mkJudge('"风把大树吹倒了"改为"被"字句是"大树被风吹倒了"。', true),
    ]);
  }

  // ---- 标点符号 ----
  function cn4_punctuation() {
    return pick([
      mkChoice('"妈妈说___快去写作业___"应填？', '："！"', ['。！', '，！', '；！']),
      mkChoice('下列标点使用正确的是？', '今天天气真好啊！', ['今天天气真好啊。', '今天天气真好啊，', '今天天气真好啊？']),
      mkChoice('"你吃了吗___"应填？', '？', ['。', '！', '，']),
      mkFill('直接引用别人说的话，开头要用____号。', '冒'),
      mkJudge('句号表示一句话说完后的停顿。', true),
      mkJudge('逗号表示一句话中间的停顿。', true),
      mkChoice('下列哪句话的标点完全正确？', '老师说："同学们好！"', ['老师说：同学们好！', '老师说，同学们好！', '老师说"同学们好！"']),
      mkChoice('书名号的作用是？', '标明书籍、文章等名称', ['表示停顿', '表示疑问', '表示感叹']),
      mkFill('《西游记》外面的符号叫____号。', '书名'),
      mkJudge('省略号表示内容的省略。', true),
    ]);
  }

  // ---- 阅读理解（记叙文） ----
  function cn4_reading() {
    const passages = [
      {
        text: '春天来了，万物复苏。小草从地里探出头来，树枝上长出了嫩绿的新叶。花园里，桃花、杏花、梨花竞相开放，红的像火，粉的像霞，白的像雪。小鸟在枝头唱歌，蝴蝶在花丛中飞舞。小朋友们脱去厚厚的冬装，在草地上快乐地奔跑。',
        qs: [
          mkChoice('这段话主要描写的是哪个季节？', '春天', ['夏天', '秋天', '冬天']),
          mkChoice('"小草从地里探出头来"用了什么修辞手法？', '拟人', ['比喻', '夸张', '排比']),
          mkChoice('文中"红的像火，粉的像霞，白的像雪"描写的是？', '花', ['树叶', '云彩', '蝴蝶']),
          mkJudge('这段话写了春天的景色，表达了作者对春天的喜爱。', true),
        ],
      },
      {
        text: '放学后，小明看见一位老奶奶在马路边摔倒了。他连忙跑过去，把老奶奶扶起来，关心地问："奶奶，您没事吧？"老奶奶笑着说："没事，谢谢你，好孩子。"小明一直把老奶奶送到了家门口，才高高兴兴地回家去。',
        qs: [
          mkChoice('这段话主要写了一件什么事？', '小明扶起摔倒的老奶奶', ['小明放学回家', '老奶奶散步', '小明去老奶奶家玩']),
          mkChoice('从这段话可以看出小明是个怎样的孩子？', '乐于助人', ['贪玩', '胆小', '粗心']),
          mkJudge('小明把老奶奶送回家后才自己回家的。', true),
          mkFill('小明看到老奶奶摔倒后，____（填动词）过去扶起来。', '连忙跑'),
        ],
      },
    ];
    const p = pick(passages);
    return { ...pick(p.qs), passage: p.text };
  }

  // ============================================================
  // 五年级 · 知识板块
  // ============================================================

  // ---- 汉字（字形结构、部首、查字典） ----
  function cn5_chars() {
    return pick([
      mkChoice('"休"字的结构是？', '左右结构', ['上下结构', '半包围结构', '独体字']),
      mkChoice('"问"字用部首查字法，应查哪个部首？', '门', ['口', '日', '门']),
      mkChoice('下列哪个字是上下结构？', '音', ['明', '林', '回']),
      mkFill('"鼎"字共有____画。', '12'),
      mkChoice('用音序查字法查"慈"字，应先查字母？', 'C', ['D', 'Z', 'S']),
      mkJudge('"森"字是由三个"木"组成的品字结构。', true),
      mkChoice('"尘"字的部首是？', '小', ['土', '小', '一']),
      mkFill('用数笔画查字法，"凸"字有____画。', '5'),
      mkJudge('"明"是左右结构，左边是"日"，右边是"月"。', true),
      mkChoice('下列哪个字的部首查字法查"氵"？', '海', ['悔', '梅', '每']),
    ]);
  }

  // ---- 词语（搭配、感情色彩、关联词） ----
  function cn5_words() {
    return pick([
      mkChoice('下列词语搭配正确的是？', '提高水平', ['提高速度', '提高身体', '提高衣服']),
      mkChoice('"果断"的感情色彩是？', '褒义', ['贬义', '中性', '无所谓']),
      mkChoice('"武断"的感情色彩是？', '贬义', ['褒义', '中性', '无所谓']),
      mkChoice('下列哪个词是贬义词？', '阴谋', ['计划', '方案', '打算']),
      mkChoice('"___困难再大，___要完成任务。"应填？', '无论…都…', ['虽然…但是…', '不但…而且…', '因为…所以…']),
      mkJudge('"骄傲"既可以是褒义也可以是贬义。', true),
      mkChoice('下列词语搭配不正确的是？', '改善错误', ['改善生活', '改善关系', '改善条件']),
      mkFill('"____地跑"（填修饰词）：____', '飞快'),
      mkChoice('"坚强"和"顽固"的意思相近但感情色彩不同，这说明？', '词语有感情色彩', ['词语没有感情色彩', '词语没有近义词', '词语不能比较']),
      mkJudge('"因为…所以…"表示因果关系。', true),
    ]);
  }

  // ---- 句子（句型转换、扩句缩句、修辞） ----
  function cn5_sentences() {
    return pick([
      mkChoice('"他把窗户打破了"改为"被"字句是？', '窗户被他打破了。', ['他打破了窗户。', '窗户打破了他。', '窗户被打破了。']),
      mkChoice('缩句："美丽的蝴蝶在花丛中快乐地飞舞。"正确的是？', '蝴蝶飞舞。', ['美丽的蝴蝶飞舞。', '蝴蝶在飞舞。', '蝴蝶快乐地飞舞。']),
      mkChoice('扩句："小鸟唱歌。"扩句正确的是？', '可爱的小鸟在枝头欢快地唱歌。', ['小鸟唱歌了。', '小鸟和小鸟唱歌。', '唱歌的小鸟。']),
      mkChoice('下列句子用了比喻的是？', '秋天的枫叶像一团团火焰。', ['枫叶红了。', '枫叶真美啊！', '我喜欢枫叶。']),
      mkChoice('下列句子用了拟人的是？', '春风温柔地抚摸着大地。', ['春风吹过大地。', '春风像母亲的手。', '春风来了。']),
      mkJudge('"这件事不是你做的，就是我做的。"是选择句。', false),
      mkChoice('"小明说：\'我会努力的。\'"改为第三人称转述句？', '小明说他会努力的。', ['小明说我会在努力的。', '小明说他会在努力的。', '小明说我努力的。']),
      mkFill('"把句子改为反问句：\'我们应该保护环境。\'"改为：____', '难道我们不应该保护环境吗？'),
      mkJudge('"太阳升起"扩句后可以是"金色的太阳从东方缓缓升起"。', true),
      mkChoice('下列哪个不是修辞手法？', '关联', ['比喻', '拟人', '排比']),
    ]);
  }

  // ---- 标点与语法 ----
  function cn5_grammar() {
    return pick([
      mkChoice('下列句子标点正确的是？', '老师说："下课后到我办公室来。"', ['老师说：下课后到我办公室来。', '老师说，"下课后到我办公室来。"', '老师说：下课后到我办公室来。']),
      mkChoice('"啊，祖国！"中的"啊"表达了什么感情？', '赞叹', ['疑问', '命令', '陈述']),
      mkFill('冒号的作用是____。', '提示下文'),
      mkJudge('引号只用于引用别人说的话。', false),
      mkChoice('下列哪个句子是祈使句？', '请把门关上！', ['门关上了。', '门关上了吗？', '门是谁关的？']),
      mkJudge('省略号不仅可以表示省略，还可以表示说话断断续续。', true),
      mkChoice('"这本书是谁的？"这是哪种句子？', '疑问句', ['陈述句', '祈使句', '感叹句']),
      mkFill('破折号的作用之一是表示____。', '解释说明'),
      mkChoice('下列标点使用错误的是？', '我喜欢吃苹果、香蕉、和橘子。', ['我喜欢吃苹果、香蕉、橘子。', '我喜欢吃苹果、香蕉和橘子。', '我喜欢吃苹果，香蕉，橘子。']),
      mkJudge('顿号用于句子内部并列词语之间的停顿。', true),
    ]);
  }

  // ---- 阅读理解（说明文） ----
  function cn5_reading() {
    const passages = [
      {
        text: '鲸是海洋中的庞然大物。它虽然生活在水中，却不是鱼类，而是哺乳动物。鲸用肺呼吸，需要浮出水面换气。鲸分为两大类：一类是须鲸，没有牙齿，以小鱼小虾为食；另一类是齿鲸，有锋利的牙齿，以海豹、海鱼为食。最大的蓝鲸体长可达30米，体重可达150吨，是地球上现存最大的动物。',
        qs: [
          mkChoice('这段话主要介绍了鲸的什么？', '鲸的特点和分类', ['鲸的习性', '鲸的进化', '鲸的捕食']),
          mkChoice('鲸不属于鱼类的原因是？', '鲸是哺乳动物，用肺呼吸', ['鲸体型太大', '鲸没有鳞片', '鲸生活在海洋里']),
          mkChoice('鲸分为哪两大类？', '须鲸和齿鲸', ['蓝鲸和虎鲸', '大鲸和小鲸', '白鲸和抹香鲸']),
          mkJudge('蓝鲸是地球上现存最大的动物。', true),
        ],
      },
      {
        text: '仙人掌是一种耐旱植物，主要生长在沙漠地区。它的叶子退化成了刺，这样可以减少水分蒸发。仙人掌的茎肥厚多汁，能够储存大量水分。它的根系非常发达，能深入地下吸收水分。即使在长期干旱的条件下，仙人掌也能顽强地生存。仙人掌不仅能观赏，有些品种的果实还可以食用。',
        qs: [
          mkChoice('这段话主要介绍了仙人掌的什么？', '仙人掌的特点和用途', ['仙人掌的花', '仙人掌的种植', '仙人掌的价格']),
          mkChoice('仙人掌的叶子退化成刺的原因是？', '减少水分蒸发', ['美观', '防御敌人', '吸引昆虫']),
          mkChoice('仙人掌能在沙漠生存的关键是什么？', '茎能储水，根系发达', ['长得快', '有刺', '叶子少']),
          mkJudge('仙人掌只能观赏，不能食用。', false),
        ],
      },
    ];
    const p = pick(passages);
    return { ...pick(p.qs), passage: p.text };
  }

  // ---- 古诗文（古诗赏析、文言文入门） ----
  function cn5_poetry() {
    return pick([
      mkChoice('"停车坐爱枫林晚"中"坐"的意思是？', '因为', ['坐下', '乘坐', '座位']),
      mkChoice('"霜叶红于二月花"中"红于"的意思是？', '比……更红', ['比……更红', '红红的花', '红色的']),
      mkChoice('"独在异乡为异客"表达了诗人什么感情？', '思乡之情', ['快乐', '愤怒', '悲伤']),
      mkChoice('"春眠不觉晓"的作者是？', '孟浩然', ['李白', '杜甫', '王维']),
      mkFill('"举头望明月，低头思____"（填空）', '故乡'),
      mkJudge('"谁知盘中餐，粒粒皆辛苦"表达了对劳动人民的同情。', true),
      mkChoice('下列哪句不是描写春天的？', '孤舟蓑笠翁，独钓寒江雪。', ['春眠不觉晓，处处闻啼鸟。', '竹外桃花三两枝，春江水暖鸭先知。', '两个黄鹂鸣翠柳，一行白鹭上青天。']),
      mkFill('"但使龙城飞将在，不教胡马度____"（填空）', '阴山'),
      mkJudge('"欲穷千里目，更上一层楼"告诉我们站得高才能看得远。', true),
      mkChoice('"飞流直下三千尺"用了什么修辞？', '夸张', ['比喻', '拟人', '排比']),
    ]);
  }

  // ============================================================
  // 六年级 · 知识板块
  // ============================================================

  // ---- 词语（成语运用、俗语谚语） ----
  function cn6_words() {
    return pick([
      mkChoice('下列成语使用正确的是？', '他学习刻苦，终于水到渠成地考上了理想的中学。', ['他学习刻苦，终于画蛇添足地考上了中学。', '他学习刻苦，终于亡羊补牢地考上了中学。', '他学习刻苦，终于守株待兔地考上了中学。']),
      mkChoice('"三人行，必有我师"告诉我们？', '要虚心向别人学习', ['要和朋友一起走', '要当老师', '三个人一起走']),
      mkChoice('下列哪个是关于团结的谚语？', '众人拾柴火焰高', ['一箭双雕', '画蛇添足', '亡羊补牢']),
      mkChoice('"千里送鹅毛"的下一句是？', '礼轻情意重', ['物轻情意重', '人远情意近', '路远心意坚']),
      mkJudge('"塞翁失马"比喻坏事不一定就是坏事，可能变成好事。', true),
      mkChoice('下列成语意思相近的是？', '画蛇添足 和 多此一举', ['画蛇添足 和 锦上添花', '亡羊补牢 和 未雨绸缪', '守株待兔 和 奋发图强']),
      mkFill('"____ 不烂"（填俗语）：____', '巧舌'),
      mkChoice('下列哪个成语用来形容人多？', '人山人海', ['门可罗雀', '寥寥无几', '人迹罕至']),
      mkJudge('"世上无难事，只怕有心人"是说只要有决心，没有办不成的事。', true),
      mkChoice('"一日千里"形容的是？', '进步或发展非常快', ['走得远', '时间短', '距离长']),
    ]);
  }

  // ---- 句子（复句、修改病句） ----
  function cn6_sentences() {
    return pick([
      mkChoice('下列哪个是因果复句？', '因为下雨，所以比赛取消了。', ['虽然下雨，但比赛继续。', '不但下雨，而且刮风。', '如果下雨，比赛就取消。']),
      mkChoice('修改病句："通过这次活动，使我受到了教育。"正确改法是？', '这次活动使我受到了教育。', ['通过这次活动，我受到了教育。', '通过这次活动使我受到教育了。', '通过活动，使我受了教育。']),
      mkChoice('"不但…而且…"表示什么关系？', '递进', ['因果', '转折', '条件']),
      mkChoice('修改病句："我估计他这道题一定做对了。"错误类型是？', '前后矛盾', ['用词不当', '成分残缺', '语序不当']),
      mkFill('"虽然天气很冷，____同学们都按时到校。"（填关联词）', '但是'),
      mkJudge('"只有好好学习，才能取得好成绩"是条件复句。', true),
      mkChoice('下列句子无语病的是？', '我们必须养成勤俭节约的好习惯。', ['我们必须养成勤俭节约。', '我们必须养成勤俭节约的好作风和好习惯。', '我们必须养成和保持勤俭节约的好习惯。']),
      mkChoice('"既然…就…"表示什么关系？', '因果', ['递进', '转折', '假设']),
      mkJudge('"不但他学习好，而且品德好"和"他不但学习好，而且品德好"语序都可以。', false),
      mkChoice('修改病句："他的写作水平明显改善了。"应改为？', '他的写作水平明显提高了。', ['他的写作水平明显增加了。', '他的写作水平明显进步了。', '他的写作水平明显发展了。']),
    ]);
  }

  // ---- 修辞与表达 ----
  function cn6_rhetoric() {
    return pick([
      mkChoice('"飞流直下三千尺，疑是银河落九天"用了什么修辞？', '夸张和比喻', ['只有夸张', '只有比喻', '只有拟人']),
      mkChoice('"漓江的水真静啊，静得让你感觉不到它在流动"用了？', '排比和夸张', ['只有排比', '只有比喻', '只有拟人']),
      mkChoice('下列句子用了排比的是？', '这里的山，高大巍峨；这里的水，清澈见底；这里的树，郁郁葱葱。', ['这里很高。', '这里山高水清树多。', '这里有山有水有树。']),
      mkChoice('"春风又绿江南岸"中"绿"字的妙处是？', '化静为动，写出春天的生机', ['颜色好看', '押韵', '字少']),
      mkJudge('"蜡烛流泪了"是比喻句。', false),
      mkChoice('"桃花潭水深千尺，不及汪伦送我情"用了什么修辞？', '夸张和比喻', ['只有排比', '只有拟人', '只有对偶']),
      mkFill('"____ 的雨丝，像____ 的牛毛"（填比喻相关词）：____', '细密/细细'),
      mkJudge('反问句就是无疑而问，明知故问，用疑问的形式表达肯定的意思。', true),
      mkChoice('下列哪个不是常见的修辞手法？', '倒装', ['比喻', '拟人', '排比']),
      mkChoice('"盼望着，盼望着，东风来了，春天的脚步近了"用了？', '反复和拟人', ['只有反复', '只有拟人', '只有比喻']),
    ]);
  }

  // ---- 阅读理解（议论文/散文） ----
  function cn6_reading() {
    const passages = [
      {
        text: '读书有多种方法。鲁迅先生说过，读书要"眼到、口到、心到、手到"。眼到，就是要仔细看；口到，就是要朗读出声；心到，就是要用心思考；手到，就是要做笔记。这"四到"缺一不可。只看不想，等于不读；只读不记，等于白读。好的读书习惯，能让我们受益终身。',
        qs: [
          mkChoice('这段话的主要观点是？', '读书要做到"四到"', ['鲁迅爱读书', '读书有很多种', '读书要朗读']),
          mkChoice('"心到"的意思是？', '用心思考', ['用心记', '心里想', '心情好']),
          mkChoice('作者认为"只看不想"会怎样？', '等于不读', ['等于白读', '等于没看', '等于不记']),
          mkJudge('这段话的结构是总分总。', true),
        ],
      },
      {
        text: '成功需要坚持。爱迪生发明电灯，试验了上千种材料，失败了无数次，最终才找到了合适的灯丝。如果他中途放弃，就不会有电灯的发明。做事也是如此，遇到困难不退缩，才能取得最后的成功。正所谓"宝剑锋从磨砺出，梅花香自苦寒来"。',
        qs: [
          mkChoice('这段话的中心论点是？', '成功需要坚持', ['爱迪生发明电灯', '做事不能退缩', '宝剑和梅花']),
          mkChoice('文中举爱迪生的例子是为了？', '证明成功需要坚持', ['介绍电灯的发明过程', '说明失败是好事', '赞扬爱迪生']),
          mkChoice('"宝剑锋从磨砺出，梅花香自苦寒来"的意思是？', '成功需要经历磨炼', ['宝剑很锋利', '梅花很香', '冬天很冷']),
          mkJudge('这段话主要用了举例论证的方法。', true),
        ],
      },
    ];
    const p = pick(passages);
    return { ...pick(p.qs), passage: p.text };
  }

  // ---- 古诗文（古诗词鉴赏、文言文阅读） ----
  function cn6_poetry() {
    return pick([
      mkChoice('"但愿人长久，千里共婵娟"中"婵娟"指的是？', '月亮', ['美女', '花草', '星星']),
      mkChoice('"会当凌绝顶，一览众山小"表达了诗人怎样的胸怀？', '远大抱负和雄心壮志', ['害怕高山', '喜欢爬山', '看风景']),
      mkChoice('"粉骨碎身浑不怕，要留清白在人间"写的是什么？', '石灰', ['竹子', '梅花', '煤炭']),
      mkFill('"王师北定中原日，家祭无忘告乃____"（填空）', '翁'),
      mkJudge('"人生自古谁无死，留取丹心照汗青"表达了文天祥的爱国精神。', true),
      mkChoice('"不识庐山真面目，只缘身在此山中"蕴含的哲理是？', '当局者迷，旁观者清', ['山很高', '风景很美', '要爬山']),
      mkChoice('"醉卧沙场君莫笑，古来征战几人回"描写的是什么场景？', '边塞战争', ['田园生活', '送别朋友', '思念家乡']),
      mkFill('"春风又绿江南岸，明月何时照我____"（填空）', '还'),
      mkJudge('"落红不是无情物，化作春泥更护花"表达了奉献精神。', true),
      mkChoice('"采菊东篱下，悠然见南山"的作者是？', '陶渊明', ['李白', '杜甫', '王维']),
    ]);
  }

  // ---- 综合运用 ----
  function cn6_comprehensive() {
    return pick([
      mkChoice('口语交际：别人帮助了你，你应该说？', '谢谢', ['没关系', '不用谢', '再见']),
      mkChoice('下列哪种说法更得体？', '请问您贵姓？', ['你叫什么？', '说你的名字！', '你是谁？']),
      mkFill('请你给下面的新闻拟一个标题：\n"昨天下午，我市举行了中小学生运动会，来自全市50所学校的800名学生参加了比赛。"\n标题：____', '我市举行中小学生运动会'),
      mkJudge('在公共场合大声喧哗是文明的行为。', false),
      mkChoice('综合性学习：如果要了解家乡的变化，下列哪种方法不合适？', '只看自己的想象', ['采访老人', '查阅资料', '实地调查']),
      mkChoice('下面哪句话适合写在教室里作为座右铭？', '书山有路勤为径，学海无涯苦作舟。', ['今天不学习，明天没关系。', '作业太多了，不想写了。', '考试及格就行。']),
      mkFill('仿写句子："如果你是一滴水，你是否滋润了一寸土地？"仿写：如果你是一线阳光，你是否____？', '照亮了一分黑暗'),
      mkJudge('给别人提建议时，语气要委婉，态度要诚恳。', true),
      mkChoice('信息提取：阅读药品说明书，最重要的信息是？', '用法用量和注意事项', ['药品颜色', '包装大小', '生产厂家地址']),
      mkChoice('下面哪种行为体现了"诚信"？', '答应别人的事一定做到', ['考试偷看', '撒谎请假', '不承认错误']),
    ]);
  }

  // ============================================================
  // 知识库定义
  // ============================================================
  const CN_DATA = {
    4: [
      { name: '汉语拼音', type: 'basic', gen: cn4_pinyin },
      { name: '识字写字', type: 'basic', gen: cn4_chars },
      { name: '词语积累', type: 'basic', gen: cn4_words },
      { name: '句子训练', type: 'basic', gen: cn4_sentences },
      { name: '标点符号', type: 'basic', gen: cn4_punctuation },
      { name: '阅读理解', type: 'reading', gen: cn4_reading },
    ],
    5: [
      { name: '汉字结构', type: 'basic', gen: cn5_chars },
      { name: '词语运用', type: 'basic', gen: cn5_words },
      { name: '句子转换', type: 'basic', gen: cn5_sentences },
      { name: '标点与语法', type: 'basic', gen: cn5_grammar },
      { name: '阅读理解', type: 'reading', gen: cn5_reading },
      { name: '古诗文', type: 'poetry', gen: cn5_poetry },
    ],
    6: [
      { name: '成语与俗语', type: 'basic', gen: cn6_words },
      { name: '句子与病句', type: 'basic', gen: cn6_sentences },
      { name: '修辞与表达', type: 'basic', gen: cn6_rhetoric },
      { name: '阅读理解', type: 'reading', gen: cn6_reading },
      { name: '古诗文鉴赏', type: 'poetry', gen: cn6_poetry },
      { name: '综合运用', type: 'application', gen: cn6_comprehensive },
    ],
  };

  // ============================================================
  // 渲染引擎（自包含，不依赖数学模块的全局状态）
  // ============================================================
  let cnState = {
    grade: 4,
    unitIdx: 0,
    quiz: null,      // { questions, idx, score, userAnswers }
    tab: 'home',
  };

  // ---- DOM 辅助 ----
  function el(id) { return document.getElementById(id); }
  function cnBody() { return el('cnBody'); }

  function cnShowPage(pageId) {
    el('cnPageHome').classList.remove('active');
    el('cnPageQuiz').classList.remove('active');
    el('cnPageResult').classList.remove('active');
    el('cnPageWrong').classList.remove('active');
    const p = el(pageId);
    if (p) p.classList.add('active');
  }

  function cnGoHome() {
    cnShowPage('cnPageHome');
    el('cnBackBtn').style.display = 'none';
    cnRenderHome();
  }

  // ---- 首页渲染 ----
  function cnRenderHome() {
    const home = el('cnHomeContent');
    if (!home) return;
    let html = '<div class="welcome-banner"><h2>语文学习</h2><p>4-6年级 · 知识板块 · 阅读理解</p></div>';

    // 年级选择
    html += '<div class="section-title">选择年级</div>';
    html += '<div class="grade-grid">';
    [4, 5, 6].forEach(g => {
      const active = g === cnState.grade ? ' style="background:var(--primary);color:#fff;border-color:var(--primary)"' : '';
      html += '<button class="grade-btn' + (g === cnState.grade ? ' active' : '') + '" onclick="CN.selectGrade(' + g + ')"' + active + '>' + g + '年级</button>';
    });
    html += '</div>';

    // 知识板块
    const units = CN_DATA[cnState.grade] || [];
    html += '<div class="section-title">' + cnState.grade + '年级 · 知识板块</div>';
    html += '<div class="unit-list">';
    units.forEach((u, i) => {
      const icon = u.type === 'reading' ? '📖' : u.type === 'poetry' ? '📜' : u.type === 'application' ? '✏️' : '📝';
      html += '<div class="unit-item" onclick="CN.beginQuiz(' + i + ')">';
      html += '<div style="font-size:15px;font-weight:600">' + icon + ' ' + u.name + '</div>';
      html += '<div style="font-size:12px;color:var(--text-lighter);margin-top:2px">点击开始练习</div>';
      html += '</div>';
    });
    html += '</div>';

    home.innerHTML = html;
  }

  function cnSelectGrade(g) {
    cnState.grade = g;
    cnRenderHome();
  }

  // ---- 开始答题 ----
  function cnBeginQuiz(idx) {
    const units = CN_DATA[cnState.grade] || [];
    const unit = units[idx];
    if (!unit) return;
    cnState.unitIdx = idx;
    window.CN._lastUnitIdx = idx;

    // 生成 10 题
    const questions = [];
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      let q;
      let attempts = 0;
      do {
        q = unit.gen();
        attempts++;
      } while (seen.has(q.question) && attempts < 5);
      seen.add(q.question);
      if (!q.section) q.section = unit.name;
      if (!q.grade) q.grade = cnState.grade;
      questions.push(q);
    }

    cnState.quiz = { questions, idx: 0, score: 0, userAnswers: [] };
    el('cnBackBtn').style.display = 'block';
    el('cnBackBtn').onclick = cnGoHome;
    cnShowPage('cnPageQuiz');
    cnRenderQuestion();
  }

  // ---- 渲染题目 ----
  function cnRenderQuestion() {
    const q = cnState.quiz;
    const item = q.questions[q.idx];
    const total = q.questions.length;
    const progress = ((q.idx) / total * 100).toFixed(0);

    el('cnQuizProgress').textContent = '第 ' + (q.idx + 1) + ' / ' + total + ' 题';
    el('cnQuizScore').textContent = '\u2605 ' + q.score;
    el('cnProgressFill').style.width = progress + '%';

    let html = '';
    // 阅读理解段落
    if (item.passage) {
      html += '<div style="background:#F3EEE3;border:1px solid #ECEAE4;border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;line-height:1.8;max-height:160px;overflow-y:auto">' + item.passage + '</div>';
    }
    html += '<div style="font-size:16px;font-weight:600;margin-bottom:14px;line-height:1.6">' + item.question + '</div>';

    if (item.type === 'choice' || item.type === 'judge') {
      html += '<div class="option-group">';
      item.options.forEach((opt, i) => {
        const sel = q.userAnswers[q.idx] === opt;
        html += '<button class="option-btn' + (sel ? ' selected' : '') + '" onclick="CN.selectOption(' + i + ')" style="display:block;width:100%;text-align:left;margin-bottom:8px;padding:12px;border-radius:10px;font-size:15px;border:2px solid ' + (sel ? 'var(--primary)' : 'var(--border)') + ';background:' + (sel ? 'rgba(62,74,99,.06)' : '#fff') + '">';
        html += String.fromCharCode(65 + i) + '. ' + opt;
        html += '</button>';
      });
      html += '</div>';
    } else if (item.type === 'fill') {
      const val = q.userAnswers[q.idx] || '';
      html += '<input type="text" id="cnFillInput" value="' + (typeof val === 'string' ? val.replace(/"/g, '&quot;') : '') + '" placeholder="请输入答案" style="width:100%;padding:12px;font-size:16px;border:2px solid var(--border);border-radius:10px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'var(--primary)\'" onblur="this.style.borderColor=\'var(--border)\'" onkeydown="if(event.key===\'Enter\')CN.submit()">';
    }

    el('cnQuestionCard').innerHTML = html;

    // 按钮区
    let btnHtml = '<div id="cnFeedback" style="min-height:24px;margin-bottom:10px;font-size:14px"></div>';
    btnHtml += '<button class="btn btn-primary" id="cnSubmitBtn" onclick="CN.submit()" style="width:100%">提交答案</button>';
    el('cnQuizActions').innerHTML = btnHtml;
  }

  function cnSelectOption(i) {
    const q = cnState.quiz;
    const item = q.questions[q.idx];
    q.userAnswers[q.idx] = item.options[i];
    cnRenderQuestion();
  }

  // ---- 提交答案 ----
  function cnSubmit() {
    const q = cnState.quiz;
    const item = q.questions[q.idx];
    const userAns = q.userAnswers[q.idx];

    if (item.type === 'fill') {
      const input = el('cnFillInput');
      if (input) q.userAnswers[q.idx] = input.value.trim();
    }

    const ans = q.userAnswers[q.idx];
    if (!ans) {
      el('cnFeedback').innerHTML = '<span style="color:var(--warning)">请先作答</span>';
      return;
    }

    const correct = String(ans).trim() === String(item.answer).trim();
    el('cnSubmitBtn').style.display = 'none';

    // 标记选项对错
    if (item.type === 'choice' || item.type === 'judge') {
      const btns = el('cnQuestionCard').querySelectorAll('.option-btn');
      btns.forEach((b, i) => {
        if (item.options[i] === item.answer) {
          b.style.borderColor = 'var(--success)';
          b.style.background = 'rgba(78,140,110,.10)';
        } else if (item.options[i] === ans) {
          b.style.borderColor = 'var(--danger)';
          b.style.background = 'rgba(194,85,79,.10)';
        }
      });
    }

    if (correct) {
      q.score++;
      el('cnFeedback').innerHTML = '<span style="color:var(--success);font-weight:600">\u2714 回答正确！</span>';
    } else {
      el('cnFeedback').innerHTML = '<span style="color:var(--danger);font-weight:600">\u2718 答错了。</span> <span style="color:var(--text-light)">正确答案：' + item.answer + '</span>';
      // 加入错题库
      cnAddWrong(item, ans);
    }

    // 下一题或结束
    setTimeout(function () {
      q.idx++;
      if (q.idx >= q.questions.length) {
        cnShowResult();
      } else {
        cnRenderQuestion();
      }
    }, correct ? 600 : 1500);
  }

  // ---- 结果页 ----
  function cnShowResult() {
    const q = cnState.quiz;
    const total = q.questions.length;
    const score = q.score;
    const acc = Math.round(score / total * 100);
    const emoji = acc >= 90 ? '\uD83C\uDF89' : acc >= 70 ? '\uD83D\uDC4D' : acc >= 50 ? '\uD83D\uDCAA' : '\uD83D\uDCDD';
    const title = acc >= 90 ? '太棒了！' : acc >= 70 ? '做得不错！' : acc >= 50 ? '继续努力！' : '加油啊！';

    cnShowPage('cnPageResult');
    el('cnResultEmoji').textContent = emoji;
    el('cnResultTitle').textContent = title;
    el('cnResultScore').textContent = score;
    el('cnResultTotal').textContent = '/' + total;
    el('cnResultCorrect').textContent = score;
    el('cnResultWrong').textContent = total - score;
    el('cnResultAcc').textContent = acc + '%';

    const stars = acc >= 90 ? '\u2605\u2605\u2605' : acc >= 70 ? '\u2605\u2605\u2606' : '\u2605\u2606\u2606';
    el('cnResultStars').textContent = stars;

    // 记录历史
    cnRecordHistory(cnState.grade, CN_DATA[cnState.grade][cnState.unitIdx].name, score, total);
  }

  // ---- 错题库 ----
  function cnGetWrong() {
    const data = cnLoadData();
    return (data.wrong || []).filter(function (w) { return w.module === '\u8BED\u6587'; });
  }

  function cnAddWrong(question, userAnswer) {
    const data = cnLoadData();
    const existing = data.wrong.find(function (w) {
      return w.module === '\u8BED\u6587' && w.question && w.question.question === question.question;
    });
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastWrong = Date.now();
    } else {
      data.wrong.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        module: '\u8BED\u6587',
        question: question,
        userAnswer: userAnswer,
        unitName: question.section || CN_DATA[cnState.grade][cnState.unitIdx].name,
        grade: cnState.grade,
        time: Date.now(),
        count: 1
      });
    }
    cnSaveData(data);
  }

  function cnRemoveWrong(id) {
    const data = cnLoadData();
    data.wrong = data.wrong.filter(function (w) { return w.id !== id; });
    cnSaveData(data);
    cnRenderWrong();
  }

  function cnClearWrong() {
    const data = cnLoadData();
    data.wrong = (data.wrong || []).filter(function (w) { return w.module !== '\u8BED\u6587'; });
    cnSaveData(data);
    cnRenderWrong();
  }

  function cnRenderWrong() {
    const container = el('cnWrongList');
    if (!container) return;
    const wrongs = cnGetWrong();
    if (!wrongs.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-lighter);padding:40px 0">\u8FD8\u6CA1\u6709\u8BED\u6587\u9519\u9898\uFF0C\u7EE7\u7EED\u52AA\u529B\uFF01</div>';
      return;
    }
    let html = '';
    wrongs.forEach(function (w) {
      const q = w.question;
      html += '<div class="card" style="margin-bottom:10px;padding:12px">';
      html += '<div style="font-size:14px;font-weight:600;margin-bottom:6px">' + (q.passage ? '<span style="color:var(--gold)">[阅读]</span> ' : '') + q.question + '</div>';
      html += '<div style="font-size:13px;color:var(--danger)">你的答案：' + w.userAnswer + '</div>';
      html += '<div style="font-size:13px;color:var(--success)">正确答案：' + q.answer + '</div>';
      html += '<div style="font-size:11px;color:var(--text-lighter);margin-top:4px">' + (w.unitName || '') + ' · ' + (w.grade || '') + '\u5E74\u7EA7 · \u9519' + (w.count || 1) + '\u6B21</div>';
      html += '<button class="btn btn-outline" style="margin-top:8px;font-size:12px;padding:4px 12px" onclick="CN.removeWrong(\'' + w.id + '\')">\u5220\u9664</button>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ---- 错题重练 ----
  function cnStartWrongReview() {
    const wrongs = cnGetWrong();
    if (!wrongs.length) {
      alert('\u8FD8\u6CA1\u6709\u8BED\u6587\u9519\u9898\uFF01');
      return;
    }
    const questions = wrongs.map(function (w) { return w.question; });
    cnState.quiz = { questions: questions.slice(0, 10), idx: 0, score: 0, userAnswers: [] };
    el('cnBackBtn').style.display = 'block';
    el('cnBackBtn').onclick = function () { cnSwitchTab('wrong'); };
    cnShowPage('cnPageQuiz');
    cnRenderQuestion();
  }

  // ---- 历史记录 ----
  function cnLoadData() {
    try {
      return JSON.parse(localStorage.getItem('math_practice_data')) || { wrong: [], stats: {}, history: [] };
    } catch (e) {
      return { wrong: [], stats: {}, history: [] };
    }
  }
  function cnSaveData(data) {
    localStorage.setItem('math_practice_data', JSON.stringify(data));
  }
  function cnRecordHistory(grade, unitName, score, total) {
    const data = cnLoadData();
    if (!data.history) data.history = [];
    data.history.unshift({
      module: '\u8BED\u6587',
      grade: grade,
      unitName: unitName,
      score: score,
      total: total,
      accuracy: Math.round(score / total * 100),
      time: Date.now()
    });
    cnSaveData(data);
  }

  // ---- Tab 切换 ----
  function cnSwitchTab(tab) {
    cnState.tab = tab;
    // 更新底部导航
    var tabs = document.querySelectorAll('#chineseRoot .cn-bottom-nav .nav-tab');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    var activeTab = document.querySelector('#chineseRoot .cn-bottom-nav .nav-tab[data-tab="' + tab + '"]');
    if (activeTab) activeTab.classList.add('active');

    if (tab === 'home') {
      cnGoHome();
    } else if (tab === 'wrong') {
      cnShowPage('cnPageWrong');
      el('cnBackBtn').style.display = 'none';
      cnRenderWrong();
    }
  }

  // ---- 初始化 ----
  function cnInit() {
    cnRenderHome();
  }

  // ---- 暴露接口 ----
  window.CN = {
    _lastUnitIdx: 0,
    init: cnInit,
    selectGrade: cnSelectGrade,
    beginQuiz: cnBeginQuiz,
    selectOption: cnSelectOption,
    submit: cnSubmit,
    goHome: cnGoHome,
    switchTab: cnSwitchTab,
    startWrongReview: cnStartWrongReview,
    removeWrong: cnRemoveWrong,
    clearWrong: cnClearWrong,
  };
})();
