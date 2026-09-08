// ============================================================
// v83 · PEP 初中英语教材同步库 · 八年级（人教版 Go for it! 新版）
// ------------------------------------------------------------
// 目录已核（2026-09）：
//   八上 = 2025 秋启用新版，10 单元精简为 8 单元，词汇 468→570
//     U1 Happy Holiday / U2 Home Sweet Home / U3 Same or Different?
//     U4 Amazing Plants and Animals / U5 What a Delicious Meal!
//     U6 Plan for Yourself / U7 When Tomorrow Comes / U8 Let's Communicate!
//   八下 = 2026 秋启用新版，8 单元
//     U1 Time to Relax / U2 Stay Healthy / U3 Growing Up / U4 The Wonders of Nature
//     U5 Nature's Temper / U6 Crossing Cultures / U7 A Good Read / U8 Making a Difference
// 数据结构与 js/pep.js 完全一致（js/engPep.js 按此读，勿改字段名）：
//   book { id, grade, sem, edition, name, label, units:[] }
//   unit { id, no, title, zh, words:[{w,m,ipa}], sents:[{en,zh}], grammar }
// 加载序：js/pep.js → js/pep_junior.js → 本文件 → js/engPep.js
// ============================================================
(function () {
  if (!window.PEP || !Array.isArray(window.PEP.books)) return;

  const JR8 = [
    /* ==================== 八年级上册（2025 秋新版） ==================== */
    {
      id: 'g8a', grade: 8, sem: 1, edition: 'new', name: '八年级上册', label: '八上（2025新版）',
      units: [
        {
          id: 'g8a-u1', no: 1, title: 'Unit 1 Happy Holiday', zh: '快乐的假期',
          words: [
            { w: 'holiday', m: '假期；假日', ipa: '/ˈhɒlədeɪ/' }, { w: 'vacation', m: '假期', ipa: '/vəˈkeɪʃn/' },
            { w: 'trip', m: '旅行；旅程', ipa: '/trɪp/' }, { w: 'journey', m: '旅程；历程', ipa: '/ˈdʒɜːni/' },
            { w: 'beach', m: '海滩；沙滩', ipa: '/biːtʃ/' }, { w: 'mountain', m: '高山；山岳', ipa: '/ˈmaʊntən/' },
            { w: 'museum', m: '博物馆', ipa: '/mjuˈziːəm/' }, { w: 'camp', m: '营地；露营', ipa: '/kæmp/' },
            { w: 'experience', m: '经历；体验', ipa: '/ɪkˈspɪəriəns/' }, { w: 'wonderful', m: '精彩的；极好的', ipa: '/ˈwʌndəfl/' },
            { w: 'fantastic', m: '极好的；了不起的', ipa: '/fænˈtæstɪk/' }, { w: 'ancient', m: '古代的；古老的', ipa: '/ˈeɪnʃənt/' },
            { w: 'local', m: '当地的；本地的', ipa: '/ˈləʊkl/' }, { w: 'guide', m: '导游；向导', ipa: '/ɡaɪd/' },
            { w: 'relax', m: '放松；休息', ipa: '/rɪˈlæks/' }, { w: 'explore', m: '探索；探险', ipa: '/ɪkˈsplɔː(r)/' },
            { w: 'anywhere', m: '任何地方', ipa: '/ˈeniweə(r)/' }, { w: 'someone', m: '某人；有人', ipa: '/ˈsʌmwʌn/' }
          ],
          sents: [
            { en: "Where did you go on vacation?", zh: '你去哪里度假了？' },
            { en: "I went to the mountains with my family.", zh: '我和家人去了山里。' },
            { en: "Did you do anything special? — Yes, I did something interesting.", zh: '你做了什么特别的事吗？——是的，我做了些有趣的事。' },
            { en: "How was your holiday? — It was wonderful.", zh: '你的假期怎么样？——棒极了。' },
            { en: "We had a fantastic time and learned a lot.", zh: '我们玩得非常开心，也学到了很多。' }
          ],
          grammar: '一般过去时（复习与提升）：规则动词 +ed / 不规则动词（go→went, do→did, have→had, take→took）；不定代词 someone / anyone / something / anything / nothing，形容词修饰不定代词要后置（something interesting）'
        },
        {
          id: 'g8a-u2', no: 2, title: 'Unit 2 Home Sweet Home', zh: '温馨的家',
          words: [
            { w: 'chore', m: '家务活；杂务', ipa: '/tʃɔː(r)/' }, { w: 'housework', m: '家务劳动', ipa: '/ˈhaʊswɜːk/' },
            { w: 'sweep', m: '扫；打扫', ipa: '/swiːp/' }, { w: 'floor', m: '地板；地面', ipa: '/flɔː(r)/' },
            { w: 'rubbish', m: '垃圾；废弃物', ipa: '/ˈrʌbɪʃ/' }, { w: 'tidy', m: '整理；整洁的', ipa: '/ˈtaɪdi/' },
            { w: 'cook', m: '做饭；厨师', ipa: '/kʊk/' }, { w: 'wash', m: '洗；洗涤', ipa: '/wɒʃ/' },
            { w: 'fold', m: '折叠；对折', ipa: '/fəʊld/' }, { w: 'comfortable', m: '舒适的；舒服的', ipa: '/ˈkʌmftəbl/' },
            { w: 'cozy', m: '温暖舒适的', ipa: '/ˈkəʊzi/' }, { w: 'neighbour', m: '邻居', ipa: '/ˈneɪbə(r)/' },
            { w: 'responsible', m: '有责任的；负责的', ipa: '/rɪˈspɒnsəbl/' }, { w: 'share', m: '分享；分担', ipa: '/ʃeə(r)/' },
            { w: 'helpful', m: '有帮助的；乐于助人的', ipa: '/ˈhelpfl/' }, { w: 'allow', m: '允许；准许', ipa: '/əˈlaʊ/' },
            { w: 'polite', m: '有礼貌的', ipa: '/pəˈlaɪt/' }, { w: 'request', m: '请求；要求', ipa: '/rɪˈkwest/' }
          ],
          sents: [
            { en: "Could you please sweep the floor?", zh: '请你扫一下地好吗？' },
            { en: "Sure, I can do that right away.", zh: '当然，我马上就做。' },
            { en: "Can I help you with the housework?", zh: '我能帮你做家务吗？' },
            { en: "Everyone in my family shares the chores.", zh: '我家每个人都分担家务。' },
            { en: "Doing chores makes me feel responsible.", zh: '做家务让我感到有责任感。' }
          ],
          grammar: '情态动词 can / could 表请求：Could you please + 动词原形？比 Can you...? 更礼貌；肯定回答 Sure / Of course / No problem；否定 Sorry, I can\'t. I have to...；make + 宾语 + 形容词（make me happy）'
        },
        {
          id: 'g8a-u3', no: 3, title: 'Unit 3 Same or Different?', zh: '相同还是不同',
          words: [
            { w: 'outgoing', m: '外向的；友好的', ipa: '/ˈaʊtɡəʊɪŋ/' }, { w: 'serious', m: '严肃的；认真的', ipa: '/ˈsɪəriəs/' },
            { w: 'quiet', m: '安静的；文静的', ipa: '/ˈkwaɪət/' }, { w: 'hard-working', m: '勤劳的；努力的', ipa: '/ˌhɑːd ˈwɜːkɪŋ/' },
            { w: 'talented', m: '有才能的；有天赋的', ipa: '/ˈtæləntɪd/' }, { w: 'confident', m: '自信的', ipa: '/ˈkɒnfɪdənt/' },
            { w: 'patient', m: '有耐心的', ipa: '/ˈpeɪʃnt/' }, { w: 'similar', m: '相似的；类似的', ipa: '/ˈsɪmələ(r)/' },
            { w: 'different', m: '不同的', ipa: '/ˈdɪfrənt/' }, { w: 'compare', m: '比较；对比', ipa: '/kəmˈpeə(r)/' },
            { w: 'personality', m: '性格；个性', ipa: '/ˌpɜːsəˈnæləti/' }, { w: 'hobby', m: '业余爱好', ipa: '/ˈhɒbi/' },
            { w: 'than', m: '比（用于比较）', ipa: '/ðæn/' }, { w: 'both', m: '两个都', ipa: '/bəʊθ/' },
            { w: 'however', m: '然而；不过', ipa: '/haʊˈevə(r)/' }, { w: 'although', m: '虽然；尽管', ipa: '/ɔːlˈðəʊ/' },
            { w: 'respect', m: '尊重；尊敬', ipa: '/rɪˈspekt/' }, { w: 'difference', m: '差别；差异', ipa: '/ˈdɪfrəns/' }
          ],
          sents: [
            { en: "I'm more outgoing than my sister.", zh: '我比我姐姐更外向。' },
            { en: "She is the most hard-working student in our class.", zh: '她是我们班最勤奋的学生。' },
            { en: "We are similar in some ways, but different in others.", zh: '我们在某些方面相似，但在其他方面不同。' },
            { en: "Although we are different, we respect each other.", zh: '虽然我们不同，但我们互相尊重。' },
            { en: "My best friend is as patient as my mother.", zh: '我最好的朋友和我妈妈一样有耐心。' }
          ],
          grammar: '形容词/副词比较级与最高级：单音节 +er/+est（tall→taller→tallest）；多音节 more/most（outgoing→more outgoing→the most outgoing）；不规则 good→better→best, bad→worse→worst；同级比较 as + 原级 + as；比较级 + than'
        },
        {
          id: 'g8a-u4', no: 4, title: 'Unit 4 Amazing Plants and Animals', zh: '神奇的动植物',
          words: [
            { w: 'amazing', m: '令人惊奇的', ipa: '/əˈmeɪzɪŋ/' }, { w: 'plant', m: '植物；种植', ipa: '/plɑːnt/' },
            { w: 'bamboo', m: '竹子', ipa: '/ˌbæmˈbuː/' }, { w: 'cactus', m: '仙人掌', ipa: '/ˈkæktəs/' },
            { w: 'sunflower', m: '向日葵', ipa: '/ˈsʌnflaʊə(r)/' }, { w: 'forest', m: '森林', ipa: '/ˈfɒrɪst/' },
            { w: 'ocean', m: '海洋', ipa: '/ˈəʊʃn/' }, { w: 'wildlife', m: '野生动植物', ipa: '/ˈwaɪldlaɪf/' },
            { w: 'panda', m: '熊猫', ipa: '/ˈpændə/' }, { w: 'elephant', m: '大象', ipa: '/ˈelɪfənt/' },
            { w: 'whale', m: '鲸', ipa: '/weɪl/' }, { w: 'survive', m: '生存；存活', ipa: '/səˈvaɪv/' },
            { w: 'protect', m: '保护', ipa: '/prəˈtekt/' }, { w: 'environment', m: '环境', ipa: '/ɪnˈvaɪrənmənt/' },
            { w: 'energy', m: '能量；能源', ipa: '/ˈenədʒi/' }, { w: 'grow', m: '生长；种植', ipa: '/ɡrəʊ/' },
            { w: 'alive', m: '活着的；有活力的', ipa: '/əˈlaɪv/' }, { w: 'nature', m: '大自然；自然界', ipa: '/ˈneɪtʃə(r)/' }
          ],
          sents: [
            { en: "Bamboo is one of the most amazing plants in the world.", zh: '竹子是世界上最神奇的植物之一。' },
            { en: "The blue whale is the largest animal on earth.", zh: '蓝鲸是地球上最大的动物。' },
            { en: "Plants can survive in very dry places.", zh: '植物能在非常干燥的地方存活。' },
            { en: "We should protect wild animals and their environment.", zh: '我们应该保护野生动物和它们的环境。' },
            { en: "Which animal do you think is the most interesting?", zh: '你认为哪种动物最有趣？' }
          ],
          grammar: '最高级拓展：the + 最高级 + in/of 短语（the tallest in our class）；one of the + 最高级 + 复数名词（one of the most amazing plants）；大数字读法（hundred / thousand / million / billion）'
        },
        {
          id: 'g8a-u5', no: 5, title: 'Unit 5 What a Delicious Meal!', zh: '多美味的一餐！',
          words: [
            { w: 'delicious', m: '美味的；可口的', ipa: '/dɪˈlɪʃəs/' }, { w: 'tasty', m: '好吃的；可口的', ipa: '/ˈteɪsti/' },
            { w: 'recipe', m: '食谱；烹饪法', ipa: '/ˈresəpi/' }, { w: 'ingredient', m: '原料；配料', ipa: '/ɪnˈɡriːdiənt/' },
            { w: 'boil', m: '煮沸；沸腾', ipa: '/bɔɪl/' }, { w: 'fry', m: '油炸；煎炒', ipa: '/fraɪ/' },
            { w: 'bake', m: '烘焙；烤', ipa: '/beɪk/' }, { w: 'stir', m: '搅拌', ipa: '/stɜː(r)/' },
            { w: 'pour', m: '倒；倾倒', ipa: '/pɔː(r)/' }, { w: 'chop', m: '切碎；剁', ipa: '/tʃɒp/' },
            { w: 'finally', m: '最后；终于', ipa: '/ˈfaɪnəli/' }, { w: 'firstly', m: '第一；首先', ipa: '/ˈfɜːstli/' },
            { w: 'then', m: '然后；接着', ipa: '/ðen/' }, { w: 'next', m: '接下来；下一个', ipa: '/nekst/' },
            { w: 'after that', m: '在那之后', ipa: '/ˈɑːftə ðæt/' }, { w: 'taste', m: '品尝；味道', ipa: '/teɪst/' },
            { w: 'flavour', m: '味道；风味', ipa: '/ˈfleɪvə(r)/' }, { w: 'dish', m: '菜肴；盘子', ipa: '/dɪʃ/' }
          ],
          sents: [
            { en: "What a delicious meal it is!", zh: '多么美味的一餐啊！' },
            { en: "First, wash the vegetables. Then, chop them.", zh: '首先洗菜。然后把它们切碎。' },
            { en: "How do you make a banana milk shake?", zh: '你怎么做香蕉奶昔？' },
            { en: "Finally, pour the milk into the blender and turn it on.", zh: '最后把牛奶倒进搅拌机并打开开关。' },
            { en: "How tasty the soup is!", zh: '这汤多好喝啊！' }
          ],
          grammar: '感叹句：What + (a/an) + 形容词 + 名词 (+ 主语 + 谓语)!（What a delicious meal!）；How + 形容词/副词 (+ 主语 + 谓语)!（How tasty the soup is!）；顺序副词 first → then → next → after that → finally 描述步骤'
        },
        {
          id: 'g8a-u6', no: 6, title: 'Unit 6 Plan for Yourself', zh: '为自己规划',
          words: [
            { w: 'plan', m: '计划；打算', ipa: '/plæn/' }, { w: 'future', m: '将来；未来', ipa: '/ˈfjuːtʃə(r)/' },
            { w: 'dream', m: '梦想；梦', ipa: '/driːm/' }, { w: 'goal', m: '目标；球门', ipa: '/ɡəʊl/' },
            { w: 'improve', m: '改进；提高', ipa: '/ɪmˈpruːv/' }, { w: 'practice', m: '练习；实践', ipa: '/ˈpræktɪs/' },
            { w: 'engineer', m: '工程师', ipa: '/ˌendʒɪˈnɪə(r)/' }, { w: 'scientist', m: '科学家', ipa: '/ˈsaɪəntɪst/' },
            { w: 'pilot', m: '飞行员', ipa: '/ˈpaɪlət/' }, { w: 'designer', m: '设计师', ipa: '/dɪˈzaɪnə(r)/' },
            { w: 'decision', m: '决定；抉择', ipa: '/dɪˈsɪʒn/' }, { w: 'effort', m: '努力；尽力', ipa: '/ˈefət/' },
            { w: 'university', m: '大学', ipa: '/ˌjuːnɪˈvɜːsəti/' }, { w: 'subject', m: '科目；主题', ipa: '/ˈsʌbdʒɪkt/' },
            { w: 'grow up', m: '长大；成长', ipa: '/ɡrəʊ ʌp/' }, { w: 'achieve', m: '实现；达到', ipa: '/əˈtʃiːv/' },
            { w: 'courage', m: '勇气；胆量', ipa: '/ˈkʌrɪdʒ/' }, { w: 'success', m: '成功；成就', ipa: '/səkˈses/' }
          ],
          sents: [
            { en: "What are you going to be when you grow up?", zh: '你长大后打算做什么？' },
            { en: "I'm going to be a scientist.", zh: '我打算成为一名科学家。' },
            { en: "How are you going to do that? — I'm going to study hard.", zh: '你打算怎么做？——我打算努力学习。' },
            { en: "She is going to take maths lessons next term.", zh: '她下学期打算上数学课。' },
            { en: "If you make a plan and work hard, you will achieve your goal.", zh: '如果你制定计划并努力，你就会实现目标。' }
          ],
          grammar: '一般将来时 be going to：主语 + am/is/are going to + 动词原形，表打算、计划或有迹象要发生；与 will 的区别：be going to 强调事先计划，will 强调临时刻决定或客观预测'
        },
        {
          id: 'g8a-u7', no: 7, title: 'Unit 7 When Tomorrow Comes', zh: '当明天来临',
          words: [
            { w: 'tomorrow', m: '明天；未来', ipa: '/təˈmɒrəʊ/' }, { w: 'predict', m: '预测；预言', ipa: '/prɪˈdɪkt/' },
            { w: 'prediction', m: '预测；预言', ipa: '/prɪˈdɪkʃn/' }, { w: 'robot', m: '机器人', ipa: '/ˈrəʊbɒt/' },
            { w: 'technology', m: '科技；技术', ipa: '/tekˈnɒlədʒi/' }, { w: 'planet', m: '行星', ipa: '/ˈplænɪt/' },
            { w: 'space', m: '太空；空间', ipa: '/speɪs/' }, { w: 'pollution', m: '污染', ipa: '/pəˈluːʃn/' },
            { w: 'climate', m: '气候', ipa: '/ˈklaɪmət/' }, { w: 'energy', m: '能源；能量', ipa: '/ˈenədʒi/' },
            { w: 'probably', m: '大概；很可能', ipa: '/ˈprɒbəbli/' }, { w: 'impossible', m: '不可能的', ipa: '/ɪmˈpɒsəbl/' },
            { w: 'possible', m: '可能的', ipa: '/ˈpɒsəbl/' }, { w: 'invent', m: '发明；创造', ipa: '/ɪnˈvent/' },
            { w: 'discover', m: '发现', ipa: '/dɪˈskʌvə(r)/' }, { w: 'medicine', m: '药；医学', ipa: '/ˈmedsn/' },
            { w: 'online', m: '在线的；联网的', ipa: '/ˌɒnˈlaɪn/' }, { w: 'century', m: '世纪；百年', ipa: '/ˈsentʃəri/' }
          ],
          sents: [
            { en: "Will people have robots in their homes?", zh: '人们家里会有机器人吗？' },
            { en: "Yes, they will. / No, they won't.", zh: '是的，会有。／不，不会有。' },
            { en: "There will be less pollution in the future.", zh: '将来污染会更少。' },
            { en: "Kids probably won't go to school in 100 years.", zh: '100 年后孩子们可能不去学校上学。' },
            { en: "What will the world be like in the next century?", zh: '下个世纪世界会是什么样子？' }
          ],
          grammar: '一般将来时 will：主语 + will + 动词原形（否定 won\'t，疑问 Will...?）；there will be 句型；more / less / fewer 修饰名词（more + 可数/不可数，less + 不可数，fewer + 可数复数）'
        },
        {
          id: 'g8a-u8', no: 8, title: "Unit 8 Let's Communicate!", zh: '让我们交流',
          words: [
            { w: 'communicate', m: '交流；沟通', ipa: '/kəˈmjuːnɪkeɪt/' }, { w: 'message', m: '消息；信息', ipa: '/ˈmesɪdʒ/' },
            { w: 'explain', m: '解释；说明', ipa: '/ɪkˈspleɪn/' }, { w: 'apologize', m: '道歉', ipa: '/əˈpɒlədʒaɪz/' },
            { w: 'suggest', m: '建议；提议', ipa: '/səˈdʒest/' }, { w: 'advise', m: '劝告；建议', ipa: '/ədˈvaɪz/' },
            { w: 'opinion', m: '意见；看法', ipa: '/əˈpɪnjən/' }, { w: 'discussion', m: '讨论', ipa: '/dɪˈskʌʃn/' },
            { w: 'listener', m: '倾听者；听众', ipa: '/ˈlɪsənə(r)/' }, { w: 'express', m: '表达；表示', ipa: '/ɪkˈspres/' },
            { w: 'confused', m: '困惑的；糊涂的', ipa: '/kənˈfjuːzd/' }, { w: 'clearly', m: '清楚地；明白地', ipa: '/ˈklɪəli/' },
            { w: 'politely', m: '礼貌地', ipa: '/pəˈlaɪtli/' }, { w: 'interrupt', m: '打断；插嘴', ipa: '/ˌɪntəˈrʌpt/' },
            { w: 'understand', m: '理解；明白', ipa: '/ˌʌndəˈstænd/' }, { w: 'reply', m: '回答；回复', ipa: '/rɪˈplaɪ/' },
            { w: 'trust', m: '信任；信赖', ipa: '/trʌst/' }, { w: 'conversation', m: '交谈；会话', ipa: '/ˌkɒnvəˈseɪʃn/' }
          ],
          sents: [
            { en: "Could you explain that again, please?", zh: '请你再解释一遍好吗？' },
            { en: "I'm sorry, I don't quite understand.", zh: '抱歉，我不太明白。' },
            { en: "What do you mean by that?", zh: '你那样说是什么意思？' },
            { en: "In my opinion, we should listen more and speak less.", zh: '在我看来，我们应该多听少说。' },
            { en: "Good communication helps us understand each other better.", zh: '良好的沟通帮助我们更好地互相理解。' }
          ],
          grammar: '交际功能与宾语从句初步：礼貌请求 Could you (please)...? / Would you mind...?；宾语从句用陈述语序（Could you tell me what you mean? 而非 what do you mean）；提建议 Why not...? / How about...? / Let\'s...'
        }
      ]
    },

    /* ==================== 八年级下册（2026 秋新版） ==================== */
    {
      id: 'g8b', grade: 8, sem: 2, edition: 'new', name: '八年级下册', label: '八下（2026新版）',
      units: [
        {
          id: 'g8b-u1', no: 1, title: 'Unit 1 Time to Relax', zh: '放松时光',
          words: [
            { w: 'relax', m: '放松；休息', ipa: '/rɪˈlæks/' }, { w: 'pressure', m: '压力', ipa: '/ˈpreʃə(r)/' },
            { w: 'stress', m: '压力；紧张', ipa: '/stres/' }, { w: 'hobby', m: '业余爱好', ipa: '/ˈhɒbi/' },
            { w: 'concert', m: '音乐会', ipa: '/ˈkɒnsət/' }, { w: 'movie', m: '电影', ipa: '/ˈmuːvi/' },
            { w: 'cycle', m: '骑自行车', ipa: '/ˈsaɪkl/' }, { w: 'jog', m: '慢跑', ipa: '/dʒɒɡ/' },
            { w: 'peaceful', m: '平静的；安宁的', ipa: '/ˈpiːsfl/' }, { w: 'boring', m: '无聊的；乏味的', ipa: '/ˈbɔːrɪŋ/' },
            { w: 'already', m: '已经', ipa: '/ɔːlˈredi/' }, { w: 'yet', m: '还；尚未（用于否定/疑问）', ipa: '/jet/' },
            { w: 'ever', m: '曾经', ipa: '/ˈevə(r)/' }, { w: 'never', m: '从未；从不', ipa: '/ˈnevə(r)/' },
            { w: 'since', m: '自从；既然', ipa: '/sɪns/' }, { w: 'for', m: '长达（接时间段）', ipa: '/fɔː(r)/' },
            { w: 'mood', m: '心情；情绪', ipa: '/muːd/' }, { w: 'balance', m: '平衡；均衡', ipa: '/ˈbæləns/' }
          ],
          sents: [
            { en: "Have you ever been to a concert?", zh: '你去过音乐会吗？' },
            { en: "Yes, I have. / No, I haven't.", zh: '是的，去过。／不，没去过。' },
            { en: "I have already finished my homework.", zh: '我已经做完作业了。' },
            { en: "She hasn't tried cycling yet.", zh: '她还没试过骑自行车。' },
            { en: "We have known each other for three years.", zh: '我们认识三年了。' }
          ],
          grammar: '现在完成时（1）：have/has + 过去分词；already 用于肯定句，yet 用于否定句和疑问句；ever / never；for + 时间段 / since + 时间点；与一般过去时的区别——现在完成时强调对现在的影响'
        },
        {
          id: 'g8b-u2', no: 2, title: 'Unit 2 Stay Healthy', zh: '保持健康',
          words: [
            { w: 'healthy', m: '健康的', ipa: '/ˈhelθi/' }, { w: 'illness', m: '疾病', ipa: '/ˈɪlnəs/' },
            { w: 'fever', m: '发烧；发热', ipa: '/ˈfiːvə(r)/' }, { w: 'headache', m: '头痛', ipa: '/ˈhedeɪk/' },
            { w: 'toothache', m: '牙痛', ipa: '/ˈtuːθeɪk/' }, { w: 'stomachache', m: '胃痛；腹痛', ipa: '/ˈstʌməkeɪk/' },
            { w: 'cough', m: '咳嗽', ipa: '/kɒf/' }, { w: 'medicine', m: '药；药物', ipa: '/ˈmedsn/' },
            { w: 'rest', m: '休息', ipa: '/rest/' }, { w: 'exercise', m: '锻炼；练习', ipa: '/ˈeksəsaɪz/' },
            { w: 'diet', m: '饮食；日常食物', ipa: '/ˈdaɪət/' }, { w: 'sleep', m: '睡眠；睡觉', ipa: '/sliːp/' },
            { w: 'habit', m: '习惯', ipa: '/ˈhæbɪt/' }, { w: 'should', m: '应该', ipa: '/ʃʊd/' },
            { w: 'advice', m: '建议；劝告（不可数）', ipa: '/ədˈvaɪs/' }, { w: 'enough', m: '足够的', ipa: '/ɪˈnʌf/' },
            { w: 'junk food', m: '垃圾食品', ipa: '/ˈdʒʌŋk fuːd/' }, { w: 'recover', m: '康复；恢复', ipa: '/rɪˈkʌvə(r)/' }
          ],
          sents: [
            { en: "What's the matter with you? — I have a headache.", zh: '你怎么了？——我头痛。' },
            { en: "You should drink more water and have a good rest.", zh: '你应该多喝水并好好休息。' },
            { en: "Should I take some medicine? — Yes, you should.", zh: '我应该吃点药吗？——是的，应该。' },
            { en: "Eating too much junk food is bad for your health.", zh: '吃太多垃圾食品对健康有害。' },
            { en: "It's important to get enough sleep every day.", zh: '每天获得充足睡眠很重要。' }
          ],
          grammar: '情态动词 should 表建议：should + 动词原形（否定 shouldn\'t）；询问身体 What\'s the matter (with...)? / What\'s wrong?；病症表达 have a + 病症名词（have a fever / have a cold）；动名词作主语（Eating too much is bad for...）'
        },
        {
          id: 'g8b-u3', no: 3, title: 'Unit 3 Growing Up', zh: '成长',
          words: [
            { w: 'grow', m: '成长；生长', ipa: '/ɡrəʊ/' }, { w: 'childhood', m: '童年', ipa: '/ˈtʃaɪldhʊd/' },
            { w: 'teenager', m: '青少年（13-19岁）', ipa: '/ˈtiːneɪdʒə(r)/' }, { w: 'adult', m: '成年人', ipa: '/ˈædʌlt/' },
            { w: 'change', m: '改变；变化', ipa: '/tʃeɪndʒ/' }, { w: 'shy', m: '害羞的', ipa: '/ʃaɪ/' },
            { w: 'brave', m: '勇敢的', ipa: '/breɪv/' }, { w: 'independent', m: '独立的', ipa: '/ˌɪndɪˈpendənt/' },
            { w: 'responsible', m: '有责任的', ipa: '/rɪˈspɒnsəbl/' }, { w: 'memory', m: '记忆；回忆', ipa: '/ˈmeməri/' },
            { w: 'used to', m: '过去常常', ipa: '/ˈjuːst tə/' }, { w: 'hobby', m: '业余爱好', ipa: '/ˈhɒbi/' },
            { w: 'challenge', m: '挑战', ipa: '/ˈtʃælɪndʒ/' }, { w: 'overcome', m: '克服；战胜', ipa: '/ˌəʊvəˈkʌm/' },
            { w: 'proud', m: '自豪的；骄傲的', ipa: '/praʊd/' }, { w: 'height', m: '身高；高度', ipa: '/haɪt/' },
            { w: 'appear', m: '出现；显得', ipa: '/əˈpɪə(r)/' }, { w: 'realize', m: '意识到；实现', ipa: '/ˈriːəlaɪz/' }
          ],
          sents: [
            { en: "I used to be short, but now I'm tall.", zh: '我过去很矮，但现在我很高。' },
            { en: "She didn't use to like reading.", zh: '她过去不喜欢阅读。' },
            { en: "Did you use to be shy? — Yes, I did.", zh: '你过去害羞吗？——是的。' },
            { en: "Growing up means learning to be responsible.", zh: '成长意味着学会负责任。' },
            { en: "My parents are proud of me.", zh: '我父母为我感到骄傲。' }
          ],
          grammar: 'used to + 动词原形：表过去经常或过去的习惯/状态（现在已不如此）；否定 didn\'t use to；疑问 Did...use to...?；注意 be used to doing（习惯于）与 used to do 的区别'
        },
        {
          id: 'g8b-u4', no: 4, title: 'Unit 4 The Wonders of Nature', zh: '自然奇观',
          words: [
            { w: 'wonder', m: '奇观；奇迹', ipa: '/ˈwʌndə(r)/' }, { w: 'waterfall', m: '瀑布', ipa: '/ˈwɔːtəfɔːl/' },
            { w: 'canyon', m: '峡谷', ipa: '/ˈkænjən/' }, { w: 'desert', m: '沙漠', ipa: '/ˈdezət/' },
            { w: 'cave', m: '洞穴；山洞', ipa: '/keɪv/' }, { w: 'island', m: '岛屿', ipa: '/ˈaɪlənd/' },
            { w: 'lake', m: '湖；湖泊', ipa: '/leɪk/' }, { w: 'peak', m: '山峰；顶点', ipa: '/piːk/' },
            { w: 'deep', m: '深的', ipa: '/diːp/' }, { w: 'wide', m: '宽的', ipa: '/waɪd/' },
            { w: 'high', m: '高的', ipa: '/haɪ/' }, { w: 'length', m: '长度', ipa: '/leŋθ/' },
            { w: 'height', m: '高度', ipa: '/haɪt/' }, { w: 'depth', m: '深度', ipa: '/depθ/' },
            { w: 'million', m: '百万', ipa: '/ˈmɪljən/' }, { w: 'thousand', m: '千', ipa: '/ˈθaʊznd/' },
            { w: 'natural', m: '自然的；天然的', ipa: '/ˈnætʃrəl/' }, { w: 'scenery', m: '风景；景色', ipa: '/ˈsiːnəri/' }
          ],
          sents: [
            { en: "The waterfall is about 80 metres high.", zh: '这个瀑布大约 80 米高。' },
            { en: "How deep is the lake? — It's over 100 metres deep.", zh: '这个湖有多深？——超过 100 米深。' },
            { en: "This canyon is one of the greatest natural wonders.", zh: '这个峡谷是最伟大的自然奇观之一。' },
            { en: "The mountain is much higher than that hill.", zh: '这座山比那座小山高得多。' },
            { en: "Millions of tourists visit this place every year.", zh: '每年有数百万游客参观这个地方。' }
          ],
          grammar: '度量表达：数词 + 单位 + 形容词（80 metres high / 100 metres deep）；提问 How high / deep / wide / long / far is...?；大数字与比较级修饰语 much / far / a lot / even + 比较级（much higher）'
        },
        {
          id: 'g8b-u5', no: 5, title: "Unit 5 Nature's Temper", zh: '大自然的脾气',
          words: [
            { w: 'disaster', m: '灾难；灾祸', ipa: '/dɪˈzɑːstə(r)/' }, { w: 'earthquake', m: '地震', ipa: '/ˈɜːθkweɪk/' },
            { w: 'flood', m: '洪水；水灾', ipa: '/flʌd/' }, { w: 'storm', m: '暴风雨', ipa: '/stɔːm/' },
            { w: 'typhoon', m: '台风', ipa: '/taɪˈfuːn/' }, { w: 'drought', m: '干旱；旱灾', ipa: '/draʊt/' },
            { w: 'lightning', m: '闪电', ipa: '/ˈlaɪtnɪŋ/' }, { w: 'thunder', m: '雷；雷声', ipa: '/ˈθʌndə(r)/' },
            { w: 'escape', m: '逃脱；逃离', ipa: '/ɪˈskeɪp/' }, { w: 'rescue', m: '营救；救援', ipa: '/ˈreskjuː/' },
            { w: 'damage', m: '破坏；损害', ipa: '/ˈdæmɪdʒ/' }, { w: 'shelter', m: '避难所；庇护', ipa: '/ˈʃeltə(r)/' },
            { w: 'warn', m: '警告；提醒', ipa: '/wɔːn/' }, { w: 'suddenly', m: '突然地', ipa: '/ˈsʌdənli/' },
            { w: 'while', m: '当……的时候', ipa: '/waɪl/' }, { w: 'hide', m: '躲藏；隐藏', ipa: '/haɪd/' },
            { w: 'brave', m: '勇敢的', ipa: '/breɪv/' }, { w: 'safety', m: '安全', ipa: '/ˈseɪfti/' }
          ],
          sents: [
            { en: "What were you doing when the earthquake happened?", zh: '地震发生时你在做什么？' },
            { en: "I was doing my homework at that time.", zh: '那时我正在做作业。' },
            { en: "While we were having class, it began to rain heavily.", zh: '我们正在上课时，下起了大雨。' },
            { en: "The typhoon damaged many houses.", zh: '台风损坏了许多房屋。' },
            { en: "Stay calm and follow the safety rules.", zh: '保持冷静并遵守安全规则。' }
          ],
          grammar: '过去进行时：was/were + 动词-ing，表过去某时刻正在进行的动作；when + 一般过去时 / while + 过去进行时；when 表"这时突然"，while 强调两个动作同时进行'
        },
        {
          id: 'g8b-u6', no: 6, title: 'Unit 6 Crossing Cultures', zh: '跨越文化',
          words: [
            { w: 'culture', m: '文化', ipa: '/ˈkʌltʃə(r)/' }, { w: 'custom', m: '习俗；风俗', ipa: '/ˈkʌstəm/' },
            { w: 'tradition', m: '传统', ipa: '/trəˈdɪʃn/' }, { w: 'greet', m: '问候；打招呼', ipa: '/ɡriːt/' },
            { w: 'bow', m: '鞠躬', ipa: '/baʊ/' }, { w: 'polite', m: '礼貌的', ipa: '/pəˈlaɪt/' },
            { w: 'impolite', m: '不礼貌的', ipa: '/ˌɪmpəˈlaɪt/' }, { w: 'foreign', m: '外国的', ipa: '/ˈfɒrən/' },
            { w: 'abroad', m: '在国外；到国外', ipa: '/əˈbrɔːd/' }, { w: 'gesture', m: '手势；姿态', ipa: '/ˈdʒestʃə(r)/' },
            { w: 'festival', m: '节日', ipa: '/ˈfestɪvl/' }, { w: 'celebrate', m: '庆祝', ipa: '/ˈselɪbreɪt/' },
            { w: 'respect', m: '尊重', ipa: '/rɪˈspekt/' }, { w: 'misunderstand', m: '误解；误会', ipa: '/ˌmɪsʌndəˈstænd/' },
            { w: 'similarity', m: '相似点', ipa: '/ˌsɪməˈlærəti/' }, { w: 'curious', m: '好奇的', ipa: '/ˈkjʊəriəs/' },
            { w: 'whether', m: '是否', ipa: '/ˈweðə(r)/' }, { w: 'exchange', m: '交换；交流', ipa: '/ɪksˈtʃeɪndʒ/' }
          ],
          sents: [
            { en: "Do you know where he comes from?", zh: '你知道他来自哪里吗？' },
            { en: "I wonder whether it is polite to bow in Japan.", zh: '我想知道在日本鞠躬是否礼貌。' },
            { en: "Could you tell me how people celebrate the festival?", zh: '你能告诉我人们怎么庆祝这个节日吗？' },
            { en: "Different cultures have different customs.", zh: '不同的文化有不同的习俗。' },
            { en: "When in Rome, do as the Romans do.", zh: '入乡随俗。' }
          ],
          grammar: '宾语从句（1）：that / whether(if) / 特殊疑问词引导；从句一律用陈述语序（where he comes from，不是 where does he come from）；主句过去时时从句时态要相应后退（时态一致）'
        },
        {
          id: 'g8b-u7', no: 7, title: 'Unit 7 A Good Read', zh: '一本好书',
          words: [
            { w: 'novel', m: '小说', ipa: '/ˈnɒvl/' }, { w: 'fiction', m: '小说；虚构作品', ipa: '/ˈfɪkʃn/' },
            { w: 'character', m: '人物；角色', ipa: '/ˈkærəktə(r)/' }, { w: 'plot', m: '情节', ipa: '/plɒt/' },
            { w: 'author', m: '作者', ipa: '/ˈɔːθə(r)/' }, { w: 'chapter', m: '章节', ipa: '/ˈtʃæptə(r)/' },
            { w: 'classic', m: '经典作品；经典的', ipa: '/ˈklæsɪk/' }, { w: 'review', m: '评论；复习', ipa: '/rɪˈvjuː/' },
            { w: 'recommend', m: '推荐；介绍', ipa: '/ˌrekəˈmend/' }, { w: 'imagine', m: '想象', ipa: '/ɪˈmædʒɪn/' },
            { w: 'touching', m: '感人的', ipa: '/ˈtʌtʃɪŋ/' }, { w: 'boring', m: '无聊的', ipa: '/ˈbɔːrɪŋ/' },
            { w: 'attractive', m: '吸引人的', ipa: '/əˈtræktɪv/' }, { w: 'wisdom', m: '智慧', ipa: '/ˈwɪzdəm/' },
            { w: 'librarian', m: '图书管理员', ipa: '/laɪˈbreəriən/' }, { w: 'borrow', m: '借入', ipa: '/ˈbɒrəʊ/' },
            { w: 'lend', m: '借出', ipa: '/lend/' }, { w: 'impress', m: '使印象深刻', ipa: '/ɪmˈpres/' }
          ],
          sents: [
            { en: "Have you read Journey to the West yet?", zh: '你读过《西游记》了吗？' },
            { en: "Yes, I have already read it twice.", zh: '读过，我已经读过两遍了。' },
            { en: "What do you think of the book?", zh: '你觉得这本书怎么样？' },
            { en: "It's so touching that I want to read it again.", zh: '它太感人了，我想再读一遍。' },
            { en: "Can you recommend a good book to me?", zh: '你能给我推荐一本好书吗？' }
          ],
          grammar: '现在完成时（2）与阅读表达：already / yet / just / ever / never / twice 等副词位置（助动词 have 之后、过去分词之前）；have been to（去过已回）与 have gone to（去了未回）的区别'
        },
        {
          id: 'g8b-u8', no: 8, title: 'Unit 8 Making a Difference', zh: '有所作为',
          words: [
            { w: 'volunteer', m: '志愿者；自愿做', ipa: '/ˌvɒlənˈtɪə(r)/' }, { w: 'charity', m: '慈善；慈善机构', ipa: '/ˈtʃærəti/' },
            { w: 'donate', m: '捐赠；捐献', ipa: '/dəʊˈneɪt/' }, { w: 'support', m: '支持；支撑', ipa: '/səˈpɔːt/' },
            { w: 'effort', m: '努力', ipa: '/ˈefət/' }, { w: 'difference', m: '差别；影响', ipa: '/ˈdɪfrəns/' },
            { w: 'community', m: '社区；团体', ipa: '/kəˈmjuːnəti/' }, { w: 'neighbourhood', m: '街区；邻里', ipa: '/ˈneɪbəhʊd/' },
            { w: 'homeless', m: '无家可归的', ipa: '/ˈhəʊmləs/' }, { w: 'elderly', m: '年老的；老年人', ipa: '/ˈeldəli/' },
            { w: 'disabled', m: '残疾的', ipa: '/dɪsˈeɪbld/' }, { w: 'project', m: '项目；工程', ipa: '/ˈprɒdʒekt/' },
            { w: 'purpose', m: '目的；意图', ipa: '/ˈpɜːpəs/' }, { w: 'inspire', m: '激励；鼓舞', ipa: '/ɪnˈspaɪə(r)/' },
            { w: 'organize', m: '组织；筹备', ipa: '/ˈɔːɡənaɪz/' }, { w: 'worth', m: '值得；价值', ipa: '/wɜːθ/' },
            { w: 'kindness', m: '善良；仁慈', ipa: '/ˈkaɪndnəs/' }, { w: 'who', m: '（引导定语从句）谁；……的人', ipa: '/huː/' }
          ],
          sents: [
            { en: "She is the girl who helped the old man.", zh: '她就是帮助那位老人的女孩。' },
            { en: "I want to be a volunteer who helps others.", zh: '我想成为一名帮助他人的志愿者。' },
            { en: "The book that I borrowed is very useful.", zh: '我借的那本书很有用。' },
            { en: "Even small acts of kindness can make a difference.", zh: '即使小小的善举也能带来改变。' },
            { en: "It is worth spending time helping people in need.", zh: '花时间帮助有需要的人是值得的。' }
          ],
          grammar: '定语从句（初步）：who 指人、which/that 指物；从句紧跟在被修饰的名词（先行词）之后；that 在从句中作宾语时可省略（The book I borrowed...）；It is worth doing 值得做……'
        }
      ]
    }
  ];

  JR8.forEach(b => window.PEP.books.push(b));
})();
