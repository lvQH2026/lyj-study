/* ======================================================================
   aixueGuide-en.js — 豆包爱学式讲题引导 · 英语（完形 / 阅读 / 语法 / 写作）
   数据挂到 window.__AXG_DATA.en，由 aixueGuide.js 聚合。
   ====================================================================== */
(function (w) {
  'use strict';
  var D = (w.__AXG_DATA = w.__AXG_DATA || {});
  D.en = {
    en_cloze: {
      topic: '完形填空',
      key: '完形四步法：①通读首尾，把握大意 ②瞻前顾后，看上下文逻辑 ③找逻辑词（but、so、because、however）④代入复读验证。\n重点：联系上下文语境，不要孤立看空格。',
      steps: [
        { title: '第一步：通读全文（首尾段），抓文章大意', formula: '先读懂故事大意：谁、在哪、发生什么事' },
        { title: '第二步：瞻前顾后——看空格前后的句子', formula: '例：He was hungry, ___ he ate a lot. → 前后是因果关系' },
        { title: '第三步：根据逻辑词选答案', formula: 'hungry（饿）→ 所以吃得多：填 so' },
        { title: '第四步：代入复读，检查上下文通顺', formula: 'He was hungry, so he ate a lot. ✓' }
      ],
      summary: '完形口诀：首尾定大意，前后看逻辑，逻辑词是线索，代入再复读。'
    },
    en_reading_detail: {
      topic: '阅读理解 · 细节题',
      key: '细节题三步：①圈出题干关键词（数字、人名、地名、时间、专有名词）②回原文定位 ③比对选项与原文（同义改写也算对）。\n警惕：选项与原文“一字不差”却断章取义的陷阱。',
      steps: [
        { title: '第一步：圈题干关键词', formula: '例：When did the story happen? → 关键词 when、时间' },
        { title: '第二步：回原文定位（找关键词所在句）', formula: '在原文找到含时间词的句子' },
        { title: '第三步：比对选项与原文', formula: '原文说 last Sunday → 选含 last Sunday 或同义改写的选项' },
        { title: '第四步：排除干扰项', formula: '不是原文内容的、张冠李戴的、以偏概全的排除' }
      ],
      summary: '细节题 = 关键词定位 + 原文比对。正确答案常是原文句子的同义改写。'
    },
    en_reading_main: {
      topic: '阅读理解 · 主旨大意题',
      key: '主旨题方法：①看首尾段（主题句常在段首段尾）②看高频词（反复出现的词是主题词）③看标题和首句。\n错误选项特征：以偏概全、范围过大、细节冒充主旨。',
      steps: [
        { title: '第一步：通读首段和尾段', formula: '主题句 80% 在首段或尾段' },
        { title: '第二步：找高频词', formula: '例：全文多次出现 pollution → 主题与污染有关' },
        { title: '第三步：概括主旨（谁 + 做了什么 / 是什么）', formula: '本文主要讲……（不要选只讲某一段的选项）' },
        { title: '第四步：排除细节项、夸大项', formula: '只提到一段内容的选项 → 以偏概全，排除' }
      ],
      summary: '主旨题看首尾 + 高频词；选项要能概括全文，只讲某段的“细节选项”要排除。'
    },
    en_reading_infer: {
      topic: '阅读理解 · 推理判断题',
      key: '推理题原则：①基于原文，不选原文原句（原文原句是事实不是推理）②排除绝对化选项（must、never、all 常错）③选“能推出”的，不选“可能对但原文没说”的。',
      steps: [
        { title: '第一步：划掉与原文原句完全相同的选项', formula: '推理题答案 ≠ 原文原句' },
        { title: '第二步：划掉绝对化选项', formula: '含 must、never、all、always 的选项多为过度推断' },
        { title: '第三步：结合上下文合理推断', formula: '从语气、因果、态度推“作者暗示什么”' },
        { title: '第四步：验证：选项能由原文“顺理成章”推出', formula: '每一步推断都能在原文找到依据 ✓' }
      ],
      summary: '推理题三不选：原文原句不选、绝对化不选、无依据的猜想不选。答案必须能从原文推出。'
    },
    en_reading_word: {
      topic: '阅读理解 · 词义猜测题',
      key: '猜词三法：①上下文（该词前后句解释）②转折/并列词（but 转折、and 并列）③构词法（前缀后缀：un- 表否定、re- 表再、-ful 表形容词）。',
      steps: [
        { title: '第一步：定位生词，读前后两句', formula: '例：The lake is so clear that we can see the bottom. 猜 clear' },
        { title: '第二步：找解释线索（逗号、破折号、is called、means）', formula: '“so…that we can see the bottom”→ 能看见底 → clear = 清澈的' },
        { title: '第三步：看逻辑词（but 表相反、and 表相近）', formula: '例：He is lazy, but his brother is diligent → diligent 与 lazy 相反 → 勤奋的' },
        { title: '第四步：代入验证', formula: '把猜的词义代回句子，通顺即正确 ✓' }
      ],
      summary: '猜词看前后文解释、看逻辑词（but/and）、看构词法；猜出的词义代回原句验证通顺。'
    },
    en_grammar: {
      topic: '语法选择',
      key: '语法题两步法：①判断考点（时态、语态、从句、冠词、介词、连词、名词复数等）②回忆规则选答案。\n时态信号词：now/at present → 现在进行时；yesterday/last…/ago → 一般过去时；tomorrow/next…/will → 一般将来时；already/just/ever → 现在完成时。',
      steps: [
        { title: '第一步：判断考点', formula: '例：He ___ to school yesterday. → 考点：时态' },
        { title: '第二步：找时间信号词', formula: 'yesterday → 一般过去时' },
        { title: '第三步：回忆动词过去式', formula: 'go → went' },
        { title: '第四步：选答案并验证主谓一致', formula: 'He went to school yesterday. ✓' }
      ],
      summary: '语法题先定考点再套规则；时态看信号词、语态看主语与动词关系、单复数看主谓一致。'
    },
    en_vocabulary: {
      topic: '词汇运用（词形转换 / 固定搭配）',
      key: '词形转换规则：①动词变名词（-tion、-ment）②形容词变副词（-ly）③名词变复数（-s/-es）④形容词比较级（-er/more）。\n高频固定搭配：be good at（擅长）、look forward to（期待）、be interested in（对…感兴趣）、give up（放弃）。',
      steps: [
        { title: '第一步：看空格在句中的成分', formula: '例：She sings ___ (beautiful). → 修饰动词 sings → 用副词' },
        { title: '第二步：套词形转换规则', formula: 'beautiful → beautifully（形容词变副词加 -ly）' },
        { title: '第三步：固定搭配直接记', formula: 'be interested in doing sth 对做某事感兴趣' },
        { title: '第四步：整句读一遍检查', formula: 'She sings beautifully. ✓' }
      ],
      summary: '先看成分（名词/动词/副词/形容词），再套转换规则；固定搭配靠积累，to 后注意是动词原形还是动名词。'
    },
    en_writing: {
      topic: '书面表达（写作）',
      key: '写作四步：①审题（文体、人称、时态、要点）②列要点（不漏不偏）③成文（三段式：开头点题 + 正文要点 + 结尾总结）④检查（时态、主谓一致、拼写、大小写）。\n万能开头：Nowadays… / I am glad to…；万能结尾：In a word… / I hope…',
      steps: [
        { title: '第一步：审题——文体、人称、时态、要点', formula: '例：写一封介绍自己爱好的信 → 第一人称、一般现在时' },
        { title: '第二步：列要点（把题目要求逐条列出）', formula: '①爱好是什么 ②为什么喜欢 ③带来的收获' },
        { title: '第三步：成文——三段式，用好连接词', formula: 'First… Second… Finally…（first、also、finally 让条理清晰）' },
        { title: '第四步：检查——时态、单复数、拼写、标点', formula: '读一遍：每句主谓一致、动词形式正确 ✓' }
      ],
      summary: '写作四步：审题（人称时态）→ 列要点 → 三段式成文（连接词）→ 检查。要点写全不跑题，句子通顺优先于华丽。'
    }
  };
})(window);
