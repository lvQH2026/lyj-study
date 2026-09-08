// ============================================================
// v83 · PEP 初中英语教材同步库 · 九年级（人教版 Go for it! 2024 修订版）
// ------------------------------------------------------------
// 九年级为「全一册」共 14 单元（2024 修订版沿用，文化内容本土化调整）。
// 按实际教学进度拆为两册，便于按学期组卷：
//   g9a（九上）= Unit 1 ~ Unit 10
//   g9b（九下）= Unit 11 ~ Unit 14
// 数据结构与 js/pep.js 完全一致（js/engPep.js 按此读，勿改字段名）：
//   book { id, grade, sem, edition, name, label, units:[] }
//   unit { id, no, title, zh, words:[{w,m,ipa}], sents:[{en,zh}], grammar }
// 加载序：js/pep.js → js/pep_junior.js → js/pep_junior8.js → 本文件 → js/engPep.js
// ============================================================
(function () {
  if (!window.PEP || !Array.isArray(window.PEP.books)) return;

  const JR9 = [
    /* ==================== 九年级上册（全一册 Unit 1-10） ==================== */
    {
      id: 'g9a', grade: 9, sem: 1, edition: 'new', name: '九年级（Unit 1-10）', label: '九上（全一册 U1-10）',
      units: [
        {
          id: 'g9a-u1', no: 1, title: 'Unit 1 How can we become good learners?', zh: '怎样成为优秀的学习者',
          words: [
            { w: 'textbook', m: '教科书；课本', ipa: '/ˈtekstbʊk/' }, { w: 'vocabulary', m: '词汇；词汇量', ipa: '/vəˈkæbjələri/' },
            { w: 'grammar', m: '语法', ipa: '/ˈɡræmə(r)/' }, { w: 'pronunciation', m: '发音', ipa: '/prəˌnʌnsiˈeɪʃn/' },
            { w: 'sentence', m: '句子', ipa: '/ˈsentəns/' }, { w: 'expression', m: '表达；表情', ipa: '/ɪkˈspreʃn/' },
            { w: 'review', m: '复习；回顾', ipa: '/rɪˈvjuː/' }, { w: 'note', m: '笔记；便条', ipa: '/nəʊt/' },
            { w: 'method', m: '方法；办法', ipa: '/ˈmeθəd/' }, { w: 'skill', m: '技能；技巧', ipa: '/skɪl/' },
            { w: 'patient', m: '有耐心的', ipa: '/ˈpeɪʃnt/' }, { w: 'active', m: '积极的；活跃的', ipa: '/ˈæktɪv/' },
            { w: 'improve', m: '改进；提高', ipa: '/ɪmˈpruːv/' }, { w: 'memorize', m: '记忆；记住', ipa: '/ˈmeməraɪz/' },
            { w: 'understand', m: '理解；明白', ipa: '/ˌʌndəˈstænd/' }, { w: 'aloud', m: '出声地；大声地', ipa: '/əˈlaʊd/' },
            { w: 'practice', m: '练习；实践', ipa: '/ˈpræktɪs/' }, { w: 'discover', m: '发现', ipa: '/dɪˈskʌvə(r)/' }
          ],
          sents: [
            { en: "How do you study for a test?", zh: '你怎样为考试而学习？' },
            { en: "I study by working with friends.", zh: '我通过和朋友一起学习。' },
            { en: "What about reading aloud to practice pronunciation?", zh: '大声朗读来练习发音怎么样？' },
            { en: "It's too hard to understand spoken English.", zh: '英语口语太难听懂了。' },
            { en: "The more you read, the faster you will be.", zh: '你读得越多，速度就会越快。' }
          ],
          grammar: 'by + 动词-ing 表方式手段（by listening to tapes）；What/How about + 动词-ing 提建议；too...to... 太……而不能；the + 比较级, the + 比较级 越……越……'
        },
        {
          id: 'g9a-u2', no: 2, title: 'Unit 2 I think that mooncakes are delicious!', zh: '传统节日',
          words: [
            { w: 'mooncake', m: '月饼', ipa: '/ˈmuːnkeɪk/' }, { w: 'lantern', m: '灯笼', ipa: '/ˈlæntən/' },
            { w: 'festival', m: '节日', ipa: '/ˈfestɪvl/' }, { w: 'tradition', m: '传统', ipa: '/trəˈdɪʃn/' },
            { w: 'relative', m: '亲戚；亲属', ipa: '/ˈrelətɪv/' }, { w: 'reunion', m: '团聚；重聚', ipa: '/ˌriːˈjuːniən/' },
            { w: 'celebrate', m: '庆祝', ipa: '/ˈselɪbreɪt/' }, { w: 'admire', m: '欣赏；仰慕', ipa: '/ədˈmaɪə(r)/' },
            { w: 'custom', m: '习俗；风俗', ipa: '/ˈkʌstəm/' }, { w: 'dumpling', m: '饺子；汤团', ipa: '/ˈdʌmplɪŋ/' },
            { w: 'couplet', m: '对联', ipa: '/ˈkʌplət/' }, { w: 'firework', m: '烟花；烟火', ipa: '/ˈfaɪəwɜːk/' },
            { w: 'legend', m: '传说；传奇', ipa: '/ˈledʒənd/' }, { w: 'symbol', m: '象征；符号', ipa: '/ˈsɪmbl/' },
            { w: 'lay', m: '放置；产（卵）', ipa: '/leɪ/' }, { w: 'spread', m: '传播；展开', ipa: '/spred/' },
            { w: 'lunar', m: '阴历的；月亮的', ipa: '/ˈluːnə(r)/' }, { w: 'gather', m: '聚集；集合', ipa: '/ˈɡæðə(r)/' }
          ],
          sents: [
            { en: "I think that mooncakes are delicious!", zh: '我觉得月饼很好吃！' },
            { en: "I wonder whether they will come back next year.", zh: '我想知道他们明年是否会回来。' },
            { en: "What do you like best about the Spring Festival?", zh: '关于春节你最喜欢什么？' },
            { en: "The Mid-Autumn Festival is a time for family reunion.", zh: '中秋节是家人团聚的时刻。' },
            { en: "People admire the full moon and eat mooncakes.", zh: '人们赏满月、吃月饼。' }
          ],
          grammar: '宾语从句（that / whether / if）：that 引导陈述句（口语中常省略）；whether / if 引导一般疑问句（是否）；从句必须用陈述语序；主句 I think 变否定时要否定转移为 I don\'t think...'
        },
        {
          id: 'g9a-u3', no: 3, title: 'Unit 3 Could you please tell me where the restrooms are?', zh: '礼貌问路',
          words: [
            { w: 'restroom', m: '洗手间；公共卫生间', ipa: '/ˈrestruːm/' }, { w: 'direction', m: '方向；方位', ipa: '/dəˈrekʃn/' },
            { w: 'corner', m: '角落；拐角', ipa: '/ˈkɔːnə(r)/' }, { w: 'block', m: '街区；块', ipa: '/blɒk/' },
            { w: 'address', m: '地址；住址', ipa: '/əˈdres/' }, { w: 'postcard', m: '明信片', ipa: '/ˈpəʊstkɑːd/' },
            { w: 'stamp', m: '邮票', ipa: '/stæmp/' }, { w: 'bookstore', m: '书店', ipa: '/ˈbʊkstɔː(r)/' },
            { w: 'museum', m: '博物馆', ipa: '/mjuˈziːəm/' }, { w: 'square', m: '广场；正方形', ipa: '/skweə(r)/' },
            { w: 'east', m: '东；向东', ipa: '/iːst/' }, { w: 'opposite', m: '在……对面；相反的', ipa: '/ˈɒpəzɪt/' },
            { w: 'straight', m: '笔直地；直的', ipa: '/streɪt/' }, { w: 'politely', m: '礼貌地', ipa: '/pəˈlaɪtli/' },
            { w: 'request', m: '请求；要求', ipa: '/rɪˈkwest/' }, { w: 'wonder', m: '想知道；奇迹', ipa: '/ˈwʌndə(r)/' },
            { w: 'suggest', m: '建议；暗示', ipa: '/səˈdʒest/' }, { w: 'convenient', m: '方便的；便利的', ipa: '/kənˈviːniənt/' }
          ],
          sents: [
            { en: "Could you please tell me where the restrooms are?", zh: '请问你能告诉我洗手间在哪里吗？' },
            { en: "Go along this street and turn left at the second corner.", zh: '沿这条街走，在第二个路口左转。' },
            { en: "Do you know when the bookstore closes today?", zh: '你知道书店今天什么时候关门吗？' },
            { en: "It's just opposite the bank. You can't miss it.", zh: '它就在银行对面，你不会错过的。' },
            { en: "It's important to know how to ask for help politely.", zh: '懂得如何礼貌地求助很重要。' }
          ],
          grammar: '宾语从句（特殊疑问词引导）：疑问词 what / where / when / how / which 引导，从句用陈述语序；Could you please tell me...? 比 Where is...? 更礼貌；疑问词 + 不定式简化（how to get there）'
        },
        {
          id: 'g9a-u4', no: 4, title: 'Unit 4 I used to be afraid of the dark.', zh: '过去与现在',
          words: [
            { w: 'used to', m: '过去常常', ipa: '/ˈjuːst tə/' }, { w: 'humorous', m: '幽默的', ipa: '/ˈhjuːmərəs/' },
            { w: 'silent', m: '沉默的；无声的', ipa: '/ˈsaɪlənt/' }, { w: 'helpful', m: '有帮助的', ipa: '/ˈhelpfl/' },
            { w: 'score', m: '得分；分数', ipa: '/skɔː(r)/' }, { w: 'background', m: '背景', ipa: '/ˈbækɡraʊnd/' },
            { w: 'interview', m: '面试；采访', ipa: '/ˈɪntəvjuː/' }, { w: 'shyness', m: '害羞；腼腆', ipa: '/ˈʃaɪnəs/' },
            { w: 'crowd', m: '人群；拥挤', ipa: '/kraʊd/' }, { w: 'guard', m: '守卫；保卫', ipa: '/ɡɑːd/' },
            { w: 'private', m: '私人的；私密的', ipa: '/ˈpraɪvət/' }, { w: 'require', m: '需要；要求', ipa: '/rɪˈkwaɪə(r)/' },
            { w: 'influence', m: '影响', ipa: '/ˈɪnfluəns/' }, { w: 'absent', m: '缺席的；不在的', ipa: '/ˈæbsənt/' },
            { w: 'fail', m: '失败；不及格', ipa: '/feɪl/' }, { w: 'examination', m: '考试；检查', ipa: '/ɪɡˌzæmɪˈneɪʃn/' },
            { w: 'exactly', m: '确切地；正是', ipa: '/ɪɡˈzæktli/' }, { w: 'deal with', m: '处理；应对', ipa: '/diːl wɪð/' }
          ],
          sents: [
            { en: "I used to be afraid of the dark.", zh: '我过去怕黑。' },
            { en: "You used to be short, didn't you?", zh: '你过去很矮，是吧？' },
            { en: "She didn't use to wear glasses.", zh: '她过去不戴眼镜。' },
            { en: "People sure change.", zh: '人确实会变。' },
            { en: "It has been three years since we last met.", zh: '我们上次见面已经三年了。' }
          ],
          grammar: 'used to 综合与反意疑问句：used to + 动词原形表过去习惯（现在已改变）；否定 didn\'t use to / used not to；反意疑问句前肯后否（didn\'t you?）；It has been + 时间段 + since 从句'
        },
        {
          id: 'g9a-u5', no: 5, title: 'Unit 5 What are the shirts made of?', zh: '产品与产地',
          words: [
            { w: 'material', m: '材料；原料', ipa: '/məˈtɪəriəl/' }, { w: 'cotton', m: '棉；棉花', ipa: '/ˈkɒtn/' },
            { w: 'silk', m: '丝绸', ipa: '/sɪlk/' }, { w: 'wood', m: '木头；木材', ipa: '/wʊd/' },
            { w: 'steel', m: '钢；钢铁', ipa: '/stiːl/' }, { w: 'glass', m: '玻璃；玻璃杯', ipa: '/ɡlɑːs/' },
            { w: 'plastic', m: '塑料；塑料的', ipa: '/ˈplæstɪk/' }, { w: 'produce', m: '生产；制造', ipa: '/prəˈdjuːs/' },
            { w: 'product', m: '产品；制品', ipa: '/ˈprɒdʌkt/' }, { w: 'process', m: '过程；加工', ipa: '/ˈprəʊses/' },
            { w: 'brand', m: '品牌；牌子', ipa: '/brænd/' }, { w: 'local', m: '当地的；本地的', ipa: '/ˈləʊkl/' },
            { w: 'surface', m: '表面；表层', ipa: '/ˈsɜːfɪs/' }, { w: 'handbag', m: '手提包', ipa: '/ˈhændbæɡ/' },
            { w: 'chopstick', m: '筷子', ipa: '/ˈtʃɒpstɪk/' }, { w: 'fork', m: '叉子', ipa: '/fɔːk/' },
            { w: 'widely', m: '广泛地', ipa: '/ˈwaɪdli/' }, { w: 'be made of', m: '由……制成（看得出原料）', ipa: '/meɪd ɒv/' }
          ],
          sents: [
            { en: "What are the shirts made of? — They are made of cotton.", zh: '这些衬衫是什么做的？——它们是棉质的。' },
            { en: "Where is tea produced in China?", zh: '中国哪里产茶？' },
            { en: "The paper is made from wood.", zh: '纸是由木头制成的。' },
            { en: "These products are made in China.", zh: '这些产品是中国制造的。' },
            { en: "Tea is widely drunk all over the world.", zh: '世界各地都广泛饮茶。' }
          ],
          grammar: '被动语态（一般现在时）：am/is/are + 过去分词；be made of（看得出原料）/ be made from（看不出原料）/ be made in + 地点 / be made by + 人；主动变被动：宾语提前作主语 + be + 过去分词 + (by 短语)'
        },
        {
          id: 'g9a-u6', no: 6, title: 'Unit 6 When was it invented?', zh: '发明与创造',
          words: [
            { w: 'invent', m: '发明；创造', ipa: '/ɪnˈvent/' }, { w: 'invention', m: '发明物', ipa: '/ɪnˈvenʃn/' },
            { w: 'inventor', m: '发明家', ipa: '/ɪnˈventə(r)/' }, { w: 'discover', m: '发现', ipa: '/dɪˈskʌvə(r)/' },
            { w: 'discovery', m: '发现', ipa: '/dɪˈskʌvəri/' }, { w: 'accident', m: '事故；意外', ipa: '/ˈæksɪdənt/' },
            { w: 'century', m: '世纪', ipa: '/ˈsentʃəri/' }, { w: 'ancient', m: '古代的', ipa: '/ˈeɪnʃənt/' },
            { w: 'electricity', m: '电；电力', ipa: '/ɪˌlekˈtrɪsəti/' }, { w: 'battery', m: '电池', ipa: '/ˈbætri/' },
            { w: 'bulb', m: '灯泡', ipa: '/bʌlb/' }, { w: 'zipper', m: '拉链', ipa: '/ˈzɪpə(r)/' },
            { w: 'popularity', m: '普及；受欢迎', ipa: '/ˌpɒpjuˈlærəti/' }, { w: 'purpose', m: '目的；用途', ipa: '/ˈpɜːpəs/' },
            { w: 'mention', m: '提到；说起', ipa: '/ˈmenʃn/' }, { w: 'translate', m: '翻译', ipa: '/trænzˈleɪt/' },
            { w: 'create', m: '创造；创作', ipa: '/kriˈeɪt/' }, { w: 'by accident', m: '偶然地；意外地', ipa: '/baɪ ˈæksɪdənt/' }
          ],
          sents: [
            { en: "When was the telephone invented?", zh: '电话是什么时候发明的？' },
            { en: "It was invented in 1876.", zh: '它是 1876 年发明的。' },
            { en: "Who was it invented by? — It was invented by Bell.", zh: '它是谁发明的？——是贝尔发明的。' },
            { en: "Tea was discovered by accident.", zh: '茶是偶然被发现的。' },
            { en: "What is it used for? — It is used for keeping food cold.", zh: '它是用来做什么的？——用来给食物保鲜。' }
          ],
          grammar: '被动语态（一般过去时）：was/were + 过去分词；被动特殊疑问句 When / Who / What + was/were + 主语 + 过去分词；be used for + 动词-ing / be used to do 被用来……'
        },
        {
          id: 'g9a-u7', no: 7, title: 'Unit 7 Teenagers should be allowed to choose their own clothes.', zh: '青少年的选择',
          words: [
            { w: 'allow', m: '允许；准许', ipa: '/əˈlaʊ/' }, { w: 'teenager', m: '青少年', ipa: '/ˈtiːneɪdʒə(r)/' },
            { w: 'choose', m: '选择；挑选', ipa: '/tʃuːz/' }, { w: 'choice', m: '选择；抉择', ipa: '/tʃɔɪs/' },
            { w: 'license', m: '执照；许可证', ipa: '/ˈlaɪsns/' }, { w: 'safety', m: '安全', ipa: '/ˈseɪfti/' },
            { w: 'earring', m: '耳环；耳饰', ipa: '/ˈɪərɪŋ/' }, { w: 'part-time', m: '兼职的', ipa: '/ˌpɑːt ˈtaɪm/' },
            { w: 'pierce', m: '刺穿；穿孔', ipa: '/pɪəs/' }, { w: 'serious', m: '严肃的；认真的', ipa: '/ˈsɪəriəs/' },
            { w: 'strict', m: '严格的；严厉的', ipa: '/strɪkt/' }, { w: 'rule', m: '规则；规定', ipa: '/ruːl/' },
            { w: 'support', m: '支持；支撑', ipa: '/səˈpɔːt/' }, { w: 'achieve', m: '实现；达成', ipa: '/əˈtʃiːv/' },
            { w: 'opinion', m: '观点；看法', ipa: '/əˈpɪnjən/' }, { w: 'independent', m: '独立的', ipa: '/ˌɪndɪˈpendənt/' },
            { w: 'responsible', m: '负责任的', ipa: '/rɪˈspɒnsəbl/' }, { w: 'be strict with', m: '对……要求严格', ipa: '/strɪkt wɪð/' }
          ],
          sents: [
            { en: "Teenagers should be allowed to choose their own clothes.", zh: '应该允许青少年自己选衣服。' },
            { en: "Sixteen-year-olds shouldn't be allowed to drive.", zh: '不应该允许 16 岁的孩子开车。' },
            { en: "Do you think we may be allowed to take photos?", zh: '你认为会允许我们拍照吗？' },
            { en: "I think I should be allowed to make my own decisions.", zh: '我认为应该允许我自己做决定。' },
            { en: "Parents should not be too strict with teenagers.", zh: '父母不应该对青少年太严厉。' }
          ],
          grammar: '含情态动词的被动语态：情态动词 + be + 过去分词（should be allowed / must be done / can be finished）；否定：情态动词 + not + be + 过去分词；疑问：情态动词提前'
        },
        {
          id: 'g9a-u8', no: 8, title: 'Unit 8 It must belong to Carla.', zh: '推理与判断',
          words: [
            { w: 'belong', m: '属于', ipa: '/bɪˈlɒŋ/' }, { w: 'whose', m: '谁的', ipa: '/huːz/' },
            { w: 'attend', m: '参加；出席', ipa: '/əˈtend/' }, { w: 'valuable', m: '贵重的；有价值的', ipa: '/ˈvæljuəbl/' },
            { w: 'picnic', m: '野餐', ipa: '/ˈpɪknɪk/' }, { w: 'rabbit', m: '兔子', ipa: '/ˈræbɪt/' },
            { w: 'noise', m: '噪音；响声', ipa: '/nɔɪz/' }, { w: 'policeman', m: '警察', ipa: '/pəˈliːsmən/' },
            { w: 'wolf', m: '狼', ipa: '/wʊlf/' }, { w: 'laboratory', m: '实验室', ipa: '/ləˈbɒrətri/' },
            { w: 'outdoors', m: '在户外', ipa: '/ˌaʊtˈdɔːz/' }, { w: 'coat', m: '外套；大衣', ipa: '/kəʊt/' },
            { w: 'sleepy', m: '困倦的；瞌睡的', ipa: '/ˈsliːpi/' }, { w: 'land', m: '着陆；土地', ipa: '/lænd/' },
            { w: 'express', m: '表达；表示', ipa: '/ɪkˈspres/' }, { w: 'mystery', m: '谜；神秘的事', ipa: '/ˈmɪstri/' },
            { w: 'receive', m: '收到；接到', ipa: '/rɪˈsiːv/' }, { w: 'must', m: '一定；肯定（表推测）', ipa: '/mʌst/' }
          ],
          sents: [
            { en: "Whose book is this? — It must be Carla's.", zh: '这是谁的书？——一定是卡拉的。' },
            { en: "It could be Mei's. She likes reading.", zh: '可能是梅的，她喜欢读书。' },
            { en: "It can't be Tom's. He never reads novels.", zh: '不可能是汤姆的，他从不读小说。' },
            { en: "The book must belong to Carla.", zh: '这本书一定属于卡拉。' },
            { en: "There must be something strange happening.", zh: '一定有什么奇怪的事在发生。' }
          ],
          grammar: '情态动词表推测：must（一定，肯定推测，用于肯定句）；could / might / may（可能，可能性较小）；can\'t（不可能，否定推测）；belong to + 宾格（不用被动、不用所有格）'
        },
        {
          id: 'g9a-u9', no: 9, title: 'Unit 9 I like music that I can dance to.', zh: '音乐与喜好',
          words: [
            { w: 'prefer', m: '更喜欢；宁愿', ipa: '/prɪˈfɜː(r)/' }, { w: 'lyric', m: '歌词', ipa: '/ˈlɪrɪk/' },
            { w: 'smooth', m: '悦耳的；平滑的', ipa: '/smuːð/' }, { w: 'electronic', m: '电子的', ipa: '/ɪˌlekˈtrɒnɪk/' },
            { w: 'suppose', m: '认为；假设', ipa: '/səˈpəʊz/' }, { w: 'director', m: '导演；主任', ipa: '/dəˈrektə(r)/' },
            { w: 'documentary', m: '纪录片', ipa: '/ˌdɒkjuˈmentri/' }, { w: 'drama', m: '戏剧；剧本', ipa: '/ˈdrɑːmə/' },
            { w: 'plenty', m: '大量；充足', ipa: '/ˈplenti/' }, { w: 'dialogue', m: '对话；对白', ipa: '/ˈdaɪəlɒɡ/' },
            { w: 'ending', m: '结局；结尾', ipa: '/ˈendɪŋ/' }, { w: 'sadness', m: '悲伤；悲痛', ipa: '/ˈsædnəs/' },
            { w: 'pain', m: '痛苦；疼痛', ipa: '/peɪn/' }, { w: 'reflect', m: '反映；反射', ipa: '/rɪˈflekt/' },
            { w: 'perform', m: '表演；演出', ipa: '/pəˈfɔːm/' }, { w: 'musician', m: '音乐家', ipa: '/mjuˈzɪʃn/' },
            { w: 'which', m: '（引导定语从句）哪一个', ipa: '/wɪtʃ/' }, { w: 'down', m: '沮丧的；向下', ipa: '/daʊn/' }
          ],
          sents: [
            { en: "I like music that I can dance to.", zh: '我喜欢能跟着跳舞的音乐。' },
            { en: "She prefers singers who write their own lyrics.", zh: '她更喜欢自己写词的歌手。' },
            { en: "The movie which we saw yesterday was moving.", zh: '我们昨天看的那部电影很感人。' },
            { en: "I prefer reading books to watching TV.", zh: '比起看电视，我更喜欢读书。' },
            { en: "What kind of music do you like?", zh: '你喜欢哪种音乐？' }
          ],
          grammar: '定语从句（that / which / who）：先行词指物用 that / which，指人用 that / who；that 作宾语时可省略；只能用 that 的情况（先行词被最高级、序数词、all / everything 等修饰）'
        },
        {
          id: 'g9a-u10', no: 10, title: "Unit 10 You're supposed to shake hands.", zh: '礼仪与习俗',
          words: [
            { w: 'suppose', m: '认为；应该', ipa: '/səˈpəʊz/' }, { w: 'shake', m: '摇动；握手', ipa: '/ʃeɪk/' },
            { w: 'bow', m: '鞠躬', ipa: '/baʊ/' }, { w: 'kiss', m: '亲吻', ipa: '/kɪs/' },
            { w: 'greet', m: '问候；打招呼', ipa: '/ɡriːt/' }, { w: 'custom', m: '习俗；风俗', ipa: '/ˈkʌstəm/' },
            { w: 'manner', m: '礼貌；方式', ipa: '/ˈmænə(r)/' }, { w: 'relaxed', m: '放松的；自在的', ipa: '/rɪˈlækst/' },
            { w: 'value', m: '重视；价值', ipa: '/ˈvæljuː/' }, { w: 'effort', m: '努力', ipa: '/ˈefət/' },
            { w: 'passport', m: '护照', ipa: '/ˈpɑːspɔːt/' }, { w: 'chalk', m: '粉笔', ipa: '/tʃɔːk/' },
            { w: 'behave', m: '表现；举止', ipa: '/bɪˈheɪv/' }, { w: 'polite', m: '礼貌的', ipa: '/pəˈlaɪt/' },
            { w: 'impolite', m: '不礼貌的', ipa: '/ˌɪmpəˈlaɪt/' }, { w: 'embarrassed', m: '尴尬的', ipa: '/ɪmˈbærəst/' },
            { w: 'expect', m: '期待；预料', ipa: '/ɪkˈspekt/' }, { w: 'host', m: '主人；主持人', ipa: '/həʊst/' }
          ],
          sents: [
            { en: "You are supposed to shake hands in China.", zh: '在中国你应该握手。' },
            { en: "You are not supposed to kiss on the face.", zh: '你不应该亲吻脸颊。' },
            { en: "It's polite to bow when you meet Japanese people.", zh: '见到日本人时鞠躬是有礼貌的。' },
            { en: "It's impolite to keep others waiting.", zh: '让别人等着是不礼貌的。' },
            { en: "I was embarrassed because I didn't know the custom.", zh: '我很尴尬，因为我不知道这个习俗。' }
          ],
          grammar: 'be supposed to + 动词原形：应该 / 被期望（= should）；否定 be not supposed to（不应该）；It is + 形容词 + to do 句式（It is polite to bow）；be expected to do 与 be supposed to do 近义'
        }
      ]
    },

    /* ==================== 九年级下册（全一册 Unit 11-14） ==================== */
    {
      id: 'g9b', grade: 9, sem: 2, edition: 'new', name: '九年级（Unit 11-14）', label: '九下（全一册 U11-14）',
      units: [
        {
          id: 'g9b-u11', no: 11, title: 'Unit 11 Sad movies make me cry.', zh: '情感与影响',
          words: [
            { w: 'sad', m: '伤心的；难过的', ipa: '/sæd/' }, { w: 'mad', m: '生气的；疯狂的', ipa: '/mæd/' },
            { w: 'nervous', m: '紧张的', ipa: '/ˈnɜːvəs/' }, { w: 'uncomfortable', m: '不舒服的', ipa: '/ʌnˈkʌmftəbl/' },
            { w: 'friendship', m: '友谊；友情', ipa: '/ˈfrendʃɪp/' }, { w: 'power', m: '权力；力量', ipa: '/ˈpaʊə(r)/' },
            { w: 'wealth', m: '财富', ipa: '/welθ/' }, { w: 'fame', m: '名声；声誉', ipa: '/feɪm/' },
            { w: 'palace', m: '宫殿', ipa: '/ˈpæləs/' }, { w: 'king', m: '国王', ipa: '/kɪŋ/' },
            { w: 'queen', m: '王后；女王', ipa: '/kwiːn/' }, { w: 'examine', m: '检查；检验', ipa: '/ɪɡˈzæmɪn/' },
            { w: 'drive', m: '迫使；驾驶', ipa: '/draɪv/' }, { w: 'rather', m: '相当；宁愿', ipa: '/ˈrɑːðə(r)/' },
            { w: 'lately', m: '最近；近来', ipa: '/ˈleɪtli/' }, { w: 'besides', m: '此外；而且', ipa: '/bɪˈsaɪdz/' },
            { w: 'weight', m: '重量；体重', ipa: '/weɪt/' }, { w: 'courage', m: '勇气；胆量', ipa: '/ˈkʌrɪdʒ/' }
          ],
          sents: [
            { en: "Sad movies make me cry.", zh: '悲伤的电影让我哭。' },
            { en: "Loud music makes me nervous.", zh: '吵闹的音乐让我紧张。' },
            { en: "Waiting for her made me angry.", zh: '等她让我生气。' },
            { en: "I would rather stay at home than go out.", zh: '我宁愿待在家里也不愿出去。' },
            { en: "The more I get to know him, the more I like him.", zh: '我越了解他，就越喜欢他。' }
          ],
          grammar: 'make + 宾语 + 宾补：make sb + 形容词（make me sad）；make sb + 动词原形（make me laugh）；would rather do...than do... 宁愿……也不……；the + 比较级, the + 比较级 越……越……'
        },
        {
          id: 'g9b-u12', no: 12, title: 'Unit 12 Life is full of the unexpected.', zh: '生活中的意外',
          words: [
            { w: 'unexpected', m: '出乎意料的', ipa: '/ˌʌnɪkˈspektɪd/' }, { w: 'backpack', m: '背包', ipa: '/ˈbækpæk/' },
            { w: 'oversleep', m: '睡过头', ipa: '/ˌəʊvəˈsliːp/' }, { w: 'block', m: '街区', ipa: '/blɒk/' },
            { w: 'airport', m: '机场', ipa: '/ˈeəpɔːt/' }, { w: 'till', m: '直到；到……为止', ipa: '/tɪl/' },
            { w: 'alive', m: '活着的；有生气的', ipa: '/əˈlaɪv/' }, { w: 'above', m: '在……上面', ipa: '/əˈbʌv/' },
            { w: 'burn', m: '燃烧；烧焦', ipa: '/bɜːn/' }, { w: 'west', m: '西；向西', ipa: '/west/' },
            { w: 'cream', m: '奶油；乳霜', ipa: '/kriːm/' }, { w: 'pie', m: '馅饼；派', ipa: '/paɪ/' },
            { w: 'announce', m: '宣布；宣告', ipa: '/əˈnaʊns/' }, { w: 'hoax', m: '骗局；恶作剧', ipa: '/həʊks/' },
            { w: 'discovery', m: '发现', ipa: '/dɪˈskʌvəri/' }, { w: 'cancel', m: '取消；撤销', ipa: '/ˈkænsl/' },
            { w: 'embarrassed', m: '尴尬的；窘迫的', ipa: '/ɪmˈbærəst/' }, { w: 'by the time', m: '到……时候为止', ipa: '/baɪ ðə taɪm/' }
          ],
          sents: [
            { en: "By the time I got up, my brother had already left.", zh: '我起床时，我哥哥已经离开了。' },
            { en: "When I got to school, I realized I had left my backpack at home.", zh: '到学校时我意识到我把书包落在家里了。' },
            { en: "Life is full of the unexpected.", zh: '生活充满了意外。' },
            { en: "The movie had been on for ten minutes when we arrived.", zh: '我们到达时电影已经开演十分钟了。' },
            { en: "I had never been late for school before yesterday.", zh: '昨天之前我上学从未迟到过。' }
          ],
          grammar: '过去完成时：had + 过去分词，表"过去的过去"；常与 by the time / when / before / after 引导的从句连用；与一般过去时配合——先发生的动作用过去完成时，后发生的用一般过去时'
        },
        {
          id: 'g9b-u13', no: 13, title: "Unit 13 We're trying to save the earth!", zh: '保护地球',
          words: [
            { w: 'environment', m: '环境', ipa: '/ɪnˈvaɪrənmənt/' }, { w: 'pollution', m: '污染', ipa: '/pəˈluːʃn/' },
            { w: 'protect', m: '保护', ipa: '/prəˈtekt/' }, { w: 'recycle', m: '回收利用', ipa: '/ˌriːˈsaɪkl/' },
            { w: 'waste', m: '浪费；废弃物', ipa: '/weɪst/' }, { w: 'plastic', m: '塑料', ipa: '/ˈplæstɪk/' },
            { w: 'coal', m: '煤', ipa: '/kəʊl/' }, { w: 'oil', m: '石油；油', ipa: '/ɔɪl/' },
            { w: 'energy', m: '能源；能量', ipa: '/ˈenədʒi/' }, { w: 'solar', m: '太阳的；太阳能的', ipa: '/ˈsəʊlə(r)/' },
            { w: 'harmful', m: '有害的', ipa: '/ˈhɑːmfl/' }, { w: 'serious', m: '严重的；严肃的', ipa: '/ˈsɪəriəs/' },
            { w: 'reduce', m: '减少；降低', ipa: '/rɪˈdjuːs/' }, { w: 'reuse', m: '重复使用', ipa: '/ˌriːˈjuːz/' },
            { w: 'litter', m: '垃圾；乱扔', ipa: '/ˈlɪtə(r)/' }, { w: 'law', m: '法律；法规', ipa: '/lɔː/' },
            { w: 'government', m: '政府', ipa: '/ˈɡʌvənmənt/' }, { w: 'endangered', m: '濒危的', ipa: '/ɪnˈdeɪndʒəd/' }
          ],
          sents: [
            { en: "We are trying to save the earth.", zh: '我们正在努力拯救地球。' },
            { en: "The river used to be clean, but now it is badly polluted.", zh: '这条河过去很干净，但现在污染严重。' },
            { en: "Everyone should play a part in protecting the environment.", zh: '每个人都应该参与保护环境。' },
            { en: "We should turn off the lights when we leave a room.", zh: '我们离开房间时应该关灯。' },
            { en: "Many endangered animals are in danger now.", zh: '许多濒危动物现在处于危险中。' }
          ],
          grammar: '时态综合运用：现在进行时（are trying）、一般过去时与 used to 对比、情态动词 should / must；被动语态复习（is polluted / should be protected）；play a part in + 动词-ing 参与……'
        },
        {
          id: 'g9b-u14', no: 14, title: 'Unit 14 I remember meeting all of you in Grade 7.', zh: '毕业回忆',
          words: [
            { w: 'graduate', m: '毕业', ipa: '/ˈɡrædʒueɪt/' }, { w: 'ceremony', m: '典礼；仪式', ipa: '/ˈserəməni/' },
            { w: 'memory', m: '记忆；回忆', ipa: '/ˈmeməri/' }, { w: 'textbook', m: '课本', ipa: '/ˈtekstbʊk/' },
            { w: 'level', m: '水平；级别', ipa: '/ˈlevl/' }, { w: 'degree', m: '学位；程度', ipa: '/dɪˈɡriː/' },
            { w: 'manager', m: '经理；管理者', ipa: '/ˈmænɪdʒə(r)/' }, { w: 'task', m: '任务；工作', ipa: '/tɑːsk/' },
            { w: 'overcome', m: '克服；战胜', ipa: '/ˌəʊvəˈkʌm/' }, { w: 'caring', m: '关心他人的', ipa: '/ˈkeərɪŋ/' },
            { w: 'senior', m: '级别高的；毕业年级的', ipa: '/ˈsiːniə(r)/' }, { w: 'thirsty', m: '口渴的；渴望的', ipa: '/ˈθɜːsti/' },
            { w: 'thankful', m: '感谢的；感激的', ipa: '/ˈθæŋkfl/' }, { w: 'separate', m: '分开；分离的', ipa: '/ˈseprət/' },
            { w: 'wing', m: '翅膀；翼', ipa: '/wɪŋ/' }, { w: 'ahead', m: '向前面；提前', ipa: '/əˈhed/' },
            { w: 'along with', m: '连同；与……一起', ipa: '/əˈlɒŋ wɪð/' }, { w: 'look back at', m: '回首；回顾', ipa: '/lʊk bæk æt/' }
          ],
          sents: [
            { en: "I remember meeting all of you in Grade 7.", zh: '我记得在七年级时与你们所有人相遇。' },
            { en: "I have learned a lot during the past three years.", zh: '在过去三年里我学到了很多。' },
            { en: "Thank you for helping me with my English.", zh: '谢谢你帮我学英语。' },
            { en: "I look forward to going to senior high school.", zh: '我期待着上高中。' },
            { en: "Never fail to be thankful to your teachers.", zh: '永远别忘了感恩你的老师。' }
          ],
          grammar: '动名词与不定式：remember / forget doing（记得/忘记做过）vs remember / forget to do（记得/忘记要去做）；look forward to + 动词-ing；Thank you for + 动词-ing；现在完成时 + during / in the past + 时间段'
        }
      ]
    }
  ];

  JR9.forEach(b => window.PEP.books.push(b));
})();
