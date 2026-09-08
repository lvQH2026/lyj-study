// ============================================================
// v83 · PEP 初中英语教材同步库（人教版 Go for it! 2024 修订版）
// ------------------------------------------------------------
// 建库口径：
//   · 孩子 2027.9 升七年级，届时七、八、九年级均已启用 2024 修订版新教材
//   · 七上 = 3 个 Starter Unit + 7 个正式单元；七下 = 8 个单元
//   · 目录已核：人教社官网电子课本 / 教师教学用书目录
// 数据结构与 js/pep.js 完全一致（勿改字段名，js/engPep.js 按此读）：
//   book  { id, grade, sem, edition, name, label, units:[] }
//   unit  { id, no, title, zh, words:[{w,m,ipa}], sents:[{en,zh}], grammar }
// 接入：在 js/pep.js 之后、js/engPep.js 之前加载；本文件只 push，不改 pep.js
// ============================================================
(function () {
  if (!window.PEP || !Array.isArray(window.PEP.books)) return;

  const JUNIOR = [
    /* ==================== 七年级上册（2024 修订版） ==================== */
    {
      id: 'g7a', grade: 7, sem: 1, edition: 'new', name: '七年级上册', label: '七上（2024新版）',
      units: [
        {
          id: 'g7a-s1', no: 1, title: 'Starter Unit 1 Hello!', zh: '问候与自我介绍',
          words: [
            { w: 'hello', m: '你好', ipa: '/həˈləʊ/' }, { w: 'hi', m: '嗨；你好', ipa: '/haɪ/' },
            { w: 'morning', m: '早晨；上午', ipa: '/ˈmɔːnɪŋ/' }, { w: 'afternoon', m: '下午', ipa: '/ˌɑːftəˈnuːn/' },
            { w: 'evening', m: '傍晚；晚上', ipa: '/ˈiːvnɪŋ/' }, { w: 'good', m: '好的', ipa: '/ɡʊd/' },
            { w: 'name', m: '名字', ipa: '/neɪm/' }, { w: 'nice', m: '令人愉快的；好的', ipa: '/naɪs/' },
            { w: 'meet', m: '遇见；结识', ipa: '/miːt/' }, { w: 'too', m: '也；太', ipa: '/tuː/' },
            { w: 'fine', m: '健康的；好的', ipa: '/faɪn/' }, { w: 'thanks', m: '谢谢', ipa: '/θæŋks/' },
            { w: 'Ms', m: '女士（婚姻状况不明）', ipa: '/mɪz/' }, { w: 'Mr', m: '先生', ipa: '/ˈmɪstə(r)/' },
            { w: 'your', m: '你的；你们的', ipa: '/jɔː(r)/' }, { w: 'my', m: '我的', ipa: '/maɪ/' }
          ],
          sents: [
            { en: "Good morning, class!", zh: '同学们，早上好！' },
            { en: "What's your name?", zh: '你叫什么名字？' },
            { en: "My name is Helen. / I'm Helen.", zh: '我叫海伦。' },
            { en: "Nice to meet you! — Nice to meet you, too.", zh: '很高兴认识你！——我也是。' },
            { en: "How are you? — I'm fine, thank you.", zh: '你好吗？——我很好，谢谢。' }
          ],
          grammar: '打招呼用 Good morning / afternoon / evening；介绍自己用 I\'m + 姓名 或 My name is + 姓名；问对方姓名用 What\'s your name?'
        },
        {
          id: 'g7a-s2', no: 2, title: 'Starter Unit 2 Keep Tidy!', zh: '保持整洁',
          words: [
            { w: 'keep', m: '保持', ipa: '/kiːp/' }, { w: 'tidy', m: '整洁的', ipa: '/ˈtaɪdi/' },
            { w: 'room', m: '房间', ipa: '/ruːm/' }, { w: 'schoolbag', m: '书包', ipa: '/ˈskuːlbæɡ/' },
            { w: 'desk', m: '书桌', ipa: '/desk/' }, { w: 'chair', m: '椅子', ipa: '/tʃeə(r)/' },
            { w: 'pencil', m: '铅笔', ipa: '/ˈpensl/' }, { w: 'ruler', m: '尺子', ipa: '/ˈruːlə(r)/' },
            { w: 'eraser', m: '橡皮', ipa: '/ɪˈreɪzə(r)/' }, { w: 'bottle', m: '瓶子', ipa: '/ˈbɒtl/' },
            { w: 'in', m: '在……里', ipa: '/ɪn/' }, { w: 'on', m: '在……上', ipa: '/ɒn/' },
            { w: 'under', m: '在……下', ipa: '/ˈʌndə(r)/' }, { w: 'where', m: '在哪里', ipa: '/weə(r)/' },
            { w: 'put', m: '放；放置', ipa: '/pʊt/' }, { w: 'thing', m: '东西；物品', ipa: '/θɪŋ/' }
          ],
          sents: [
            { en: "Keep your room tidy!", zh: '保持你的房间整洁！' },
            { en: "Where is my schoolbag?", zh: '我的书包在哪里？' },
            { en: "It's on the desk. / It's under the chair.", zh: '它在书桌上。／它在椅子下。' },
            { en: "Put your books in your schoolbag.", zh: '把你的书放进书包里。' },
            { en: "Is it in your pencil box? — Yes, it is.", zh: '它在你的铅笔盒里吗？——是的。' }
          ],
          grammar: '祈使句 Keep...! / Put...in... 表示命令或建议；问位置用 Where is/are...?；方位介词 in / on / under'
        },
        {
          id: 'g7a-s3', no: 3, title: 'Starter Unit 3 Welcome!', zh: '欢迎（农场动物）',
          words: [
            { w: 'welcome', m: '欢迎', ipa: '/ˈwelkəm/' }, { w: 'farm', m: '农场', ipa: '/fɑːm/' },
            { w: 'yard', m: '院子', ipa: '/jɑːd/' }, { w: 'cow', m: '奶牛', ipa: '/kaʊ/' },
            { w: 'duck', m: '鸭子', ipa: '/dʌk/' }, { w: 'goose', m: '鹅', ipa: '/ɡuːs/' },
            { w: 'chicken', m: '鸡；小鸡', ipa: '/ˈtʃɪkɪn/' }, { w: 'rabbit', m: '兔子', ipa: '/ˈræbɪt/' },
            { w: 'horse', m: '马', ipa: '/hɔːs/' }, { w: 'sheep', m: '绵羊', ipa: '/ʃiːp/' },
            { w: 'pig', m: '猪', ipa: '/pɪɡ/' }, { w: 'dog', m: '狗', ipa: '/dɒɡ/' },
            { w: 'cat', m: '猫', ipa: '/kæt/' }, { w: 'these', m: '这些', ipa: '/ðiːz/' },
            { w: 'those', m: '那些', ipa: '/ðəʊz/' }, { w: 'count', m: '数；计数', ipa: '/kaʊnt/' }
          ],
          sents: [
            { en: "Welcome to my farm!", zh: '欢迎来到我的农场！' },
            { en: "What are these? — They're ducks.", zh: '这些是什么？——它们是鸭子。' },
            { en: "How many cows do you have?", zh: '你有多少头奶牛？' },
            { en: "This is a horse. That is a sheep.", zh: '这是一匹马。那是一只绵羊。' },
            { en: "Look at those rabbits! They're so cute.", zh: '看那些兔子！它们真可爱。' }
          ],
          grammar: '指示代词 this（这个）/ that（那个）/ these（这些）/ those（那些）；问数量用 How many + 复数名词'
        },
        {
          id: 'g7a-u1', no: 4, title: 'Unit 1 You and Me', zh: '你和我（交友与个人信息）',
          words: [
            { w: 'friend', m: '朋友', ipa: '/frend/' }, { w: 'classmate', m: '同班同学', ipa: '/ˈklɑːsmeɪt/' },
            { w: 'grade', m: '年级', ipa: '/ɡreɪd/' }, { w: 'class', m: '班级；课', ipa: '/klɑːs/' },
            { w: 'country', m: '国家', ipa: '/ˈkʌntri/' }, { w: 'city', m: '城市', ipa: '/ˈsɪti/' },
            { w: 'live', m: '居住', ipa: '/lɪv/' }, { w: 'speak', m: '说；讲', ipa: '/spiːk/' },
            { w: 'Chinese', m: '中国的；中文', ipa: '/ˌtʃaɪˈniːz/' }, { w: 'English', m: '英国的；英语', ipa: '/ˈɪŋɡlɪʃ/' },
            { w: 'same', m: '相同的', ipa: '/seɪm/' }, { w: 'different', m: '不同的', ipa: '/ˈdɪfrənt/' },
            { w: 'hobby', m: '爱好', ipa: '/ˈhɒbi/' }, { w: 'both', m: '两个都', ipa: '/bəʊθ/' },
            { w: 'music', m: '音乐', ipa: '/ˈmjuːzɪk/' }, { w: 'dance', m: '跳舞', ipa: '/dɑːns/' },
            { w: 'swim', m: '游泳', ipa: '/swɪm/' }, { w: 'read', m: '读；阅读', ipa: '/riːd/' }
          ],
          sents: [
            { en: "Where are you from? — I'm from China.", zh: '你来自哪里？——我来自中国。' },
            { en: "How old are you? — I'm 13 years old.", zh: '你多大了？——我 13 岁。' },
            { en: "What class are you in? — I'm in Class 3, Grade 7.", zh: '你在哪个班？——我在七年级三班。' },
            { en: "We are in the same class.", zh: '我们在同一个班。' },
            { en: "My hobby is reading. What about you?", zh: '我的爱好是读书。你呢？' }
          ],
          grammar: '一般现在时中 be 动词的用法：I 用 am，he/she/it 用 is，you/we/they 用 are；特殊疑问句 what / where / how old'
        },
        {
          id: 'g7a-u2', no: 5, title: "Unit 2 We're Family!", zh: '我们是一家人（家庭成员）',
          words: [
            { w: 'family', m: '家庭', ipa: '/ˈfæməli/' }, { w: 'father', m: '父亲', ipa: '/ˈfɑːðə(r)/' },
            { w: 'mother', m: '母亲', ipa: '/ˈmʌðə(r)/' }, { w: 'parent', m: '父母（之一）', ipa: '/ˈpeərənt/' },
            { w: 'grandfather', m: '祖父；外祖父', ipa: '/ˈɡrænfɑːðə(r)/' }, { w: 'grandmother', m: '祖母；外祖母', ipa: '/ˈɡrænmʌðə(r)/' },
            { w: 'brother', m: '兄弟', ipa: '/ˈbrʌðə(r)/' }, { w: 'sister', m: '姐妹', ipa: '/ˈsɪstə(r)/' },
            { w: 'uncle', m: '叔叔；舅舅', ipa: '/ˈʌŋkl/' }, { w: 'aunt', m: '阿姨；姑姑', ipa: '/ɑːnt/' },
            { w: 'cousin', m: '堂/表兄弟姐妹', ipa: '/ˈkʌzn/' }, { w: 'son', m: '儿子', ipa: '/sʌn/' },
            { w: 'daughter', m: '女儿', ipa: '/ˈdɔːtə(r)/' }, { w: 'who', m: '谁', ipa: '/huː/' },
            { w: 'they', m: '他们；她们', ipa: '/ðeɪ/' }, { w: 'photo', m: '照片', ipa: '/ˈfəʊtəʊ/' }
          ],
          sents: [
            { en: "This is my father. These are my parents.", zh: '这是我父亲。这是我的父母。' },
            { en: "Who's she? — She's my sister.", zh: '她是谁？——她是我姐姐。' },
            { en: "Is this your brother? — Yes, he is. / No, he isn't.", zh: '这是你哥哥吗？——是的。／不是。' },
            { en: "We're family.", zh: '我们是一家人。' },
            { en: "Here is a photo of my family.", zh: '这是一张我的全家福。' }
          ],
          grammar: '指示代词单复数：this/that → these/those；be 动词复数 are；who 引导的特殊疑问句；一般疑问句的简略回答'
        },
        {
          id: 'g7a-u3', no: 6, title: 'Unit 3 My School', zh: '我的学校（校园与方位）',
          words: [
            { w: 'school', m: '学校', ipa: '/skuːl/' }, { w: 'classroom', m: '教室', ipa: '/ˈklɑːsruːm/' },
            { w: 'library', m: '图书馆', ipa: '/ˈlaɪbrəri/' }, { w: 'playground', m: '操场', ipa: '/ˈpleɪɡraʊnd/' },
            { w: 'office', m: '办公室', ipa: '/ˈɒfɪs/' }, { w: 'building', m: '建筑物；楼房', ipa: '/ˈbɪldɪŋ/' },
            { w: 'hall', m: '大厅；礼堂', ipa: '/hɔːl/' }, { w: 'gym', m: '体育馆', ipa: '/dʒɪm/' },
            { w: 'lab', m: '实验室', ipa: '/læb/' }, { w: 'floor', m: '楼层；地板', ipa: '/flɔː(r)/' },
            { w: 'between', m: '在……之间', ipa: '/bɪˈtwiːn/' }, { w: 'behind', m: '在……后面', ipa: '/bɪˈhaɪnd/' },
            { w: 'front', m: '前面', ipa: '/frʌnt/' }, { w: 'near', m: '在……附近', ipa: '/nɪə(r)/' },
            { w: 'favourite', m: '特别喜爱的', ipa: '/ˈfeɪvərɪt/' }, { w: 'place', m: '地方', ipa: '/pleɪs/' }
          ],
          sents: [
            { en: "What's your school like? — It's big and beautiful.", zh: '你的学校是什么样的？——又大又漂亮。' },
            { en: "Where is the library? — It's next to the classroom building.", zh: '图书馆在哪里？——在教学楼旁边。' },
            { en: "There is a big playground in our school.", zh: '我们学校有一个大操场。' },
            { en: "My favourite place is the library.", zh: '我最喜欢的地方是图书馆。' },
            { en: "The dining hall is between the gym and the lab.", zh: '食堂在体育馆和实验室之间。' }
          ],
          grammar: 'There be 句型表示「某处有某物」；方位介词 next to / between / behind / in front of / near；What\'s ... like? 问特征'
        },
        {
          id: 'g7a-u4', no: 7, title: 'Unit 4 My Favourite Subject', zh: '我最喜欢的学科',
          words: [
            { w: 'subject', m: '学科；科目', ipa: '/ˈsʌbdʒɪkt/' }, { w: 'maths', m: '数学', ipa: '/mæθs/' },
            { w: 'history', m: '历史', ipa: '/ˈhɪstri/' }, { w: 'geography', m: '地理', ipa: '/dʒiˈɒɡrəfi/' },
            { w: 'biology', m: '生物', ipa: '/baɪˈɒlədʒi/' }, { w: 'physics', m: '物理', ipa: '/ˈfɪzɪks/' },
            { w: 'art', m: '美术', ipa: '/ɑːt/' }, { w: 'science', m: '科学', ipa: '/ˈsaɪəns/' },
            { w: 'because', m: '因为', ipa: '/bɪˈkɒz/' }, { w: 'interesting', m: '有趣的', ipa: '/ˈɪntrəstɪŋ/' },
            { w: 'difficult', m: '困难的', ipa: '/ˈdɪfɪkəlt/' }, { w: 'easy', m: '容易的', ipa: '/ˈiːzi/' },
            { w: 'useful', m: '有用的', ipa: '/ˈjuːsfl/' }, { w: 'boring', m: '无聊的', ipa: '/ˈbɔːrɪŋ/' },
            { w: 'lesson', m: '课', ipa: '/ˈlesn/' }, { w: 'Monday', m: '星期一', ipa: '/ˈmʌndeɪ/' }
          ],
          sents: [
            { en: "What's your favourite subject? — My favourite subject is English.", zh: '你最喜欢什么学科？——我最喜欢英语。' },
            { en: "Why do you like it? — Because it's interesting.", zh: '你为什么喜欢它？——因为它很有趣。' },
            { en: "We have maths on Monday.", zh: '我们星期一有数学课。' },
            { en: "I think history is useful but a little difficult.", zh: '我认为历史有用但有点难。' },
            { en: "Who is your English teacher?", zh: '谁是你的英语老师？' }
          ],
          grammar: 'why 提问用 because 回答；连词 and（并列）／but（转折）／because（原因）；学科与星期表达'
        },
        {
          id: 'g7a-u5', no: 8, title: 'Unit 5 Fun Clubs', zh: '有趣的社团（能力与爱好）',
          words: [
            { w: 'club', m: '俱乐部；社团', ipa: '/klʌb/' }, { w: 'join', m: '加入', ipa: '/dʒɔɪn/' },
            { w: 'chess', m: '国际象棋', ipa: '/tʃes/' }, { w: 'drama', m: '戏剧', ipa: '/ˈdrɑːmə/' },
            { w: 'sing', m: '唱歌', ipa: '/sɪŋ/' }, { w: 'paint', m: '画画；涂色', ipa: '/peɪnt/' },
            { w: 'guitar', m: '吉他', ipa: '/ɡɪˈtɑː(r)/' }, { w: 'football', m: '足球', ipa: '/ˈfʊtbɔːl/' },
            { w: 'basketball', m: '篮球', ipa: '/ˈbɑːskɪtbɔːl/' }, { w: 'can', m: '能；会', ipa: '/kæn/' },
            { w: 'choose', m: '选择', ipa: '/tʃuːz/' }, { w: 'activity', m: '活动', ipa: '/ækˈtɪvəti/' },
            { w: 'member', m: '成员', ipa: '/ˈmembə(r)/' }, { w: 'meeting', m: '会议；聚会', ipa: '/ˈmiːtɪŋ/' },
            { w: 'also', m: '也', ipa: '/ˈɔːlsəʊ/' }, { w: 'play', m: '玩；踢（球）；演奏', ipa: '/pleɪ/' }
          ],
          sents: [
            { en: "What club do you want to join? — I want to join the art club.", zh: '你想加入什么社团？——我想加入美术社。' },
            { en: "Can you play chess? — Yes, I can. / No, I can't.", zh: '你会下棋吗？——是的，我会。／不，我不会。' },
            { en: "I can play the guitar, but I can't sing.", zh: '我会弹吉他，但我不会唱歌。' },
            { en: "Let's join the music club!", zh: '我们加入音乐社吧！' },
            { en: "She can dance and she can also paint.", zh: '她会跳舞，也会画画。' }
          ],
          grammar: '情态动词 can 表能力：肯定 can + 动词原形，否定 can\'t，疑问句把 can 提前；and / but 连接并列句'
        },
        {
          id: 'g7a-u6', no: 9, title: 'Unit 6 A Day in the Life', zh: '日常生活（作息与频率）',
          words: [
            { w: 'get up', m: '起床', ipa: '/ɡet ʌp/' }, { w: 'dress', m: '穿衣服', ipa: '/dres/' },
            { w: 'brush', m: '刷', ipa: '/brʌʃ/' }, { w: 'teeth', m: '牙齿（复数）', ipa: '/tiːθ/' },
            { w: 'breakfast', m: '早餐', ipa: '/ˈbrekfəst/' }, { w: 'lunch', m: '午餐', ipa: '/lʌntʃ/' },
            { w: 'dinner', m: '晚餐', ipa: '/ˈdɪnə(r)/' }, { w: 'homework', m: '家庭作业', ipa: '/ˈhəʊmwɜːk/' },
            { w: 'routine', m: '日常惯例', ipa: '/ruːˈtiːn/' }, { w: 'usually', m: '通常', ipa: '/ˈjuːʒuəli/' },
            { w: 'always', m: '总是', ipa: '/ˈɔːlweɪz/' }, { w: 'often', m: '经常', ipa: '/ˈɒfn/' },
            { w: 'sometimes', m: '有时', ipa: '/ˈsʌmtaɪmz/' }, { w: 'never', m: '从不', ipa: '/ˈnevə(r)/' },
            { w: "o'clock", m: '……点钟', ipa: '/əˈklɒk/' }, { w: 'half', m: '一半', ipa: '/hɑːf/' },
            { w: 'past', m: '过（几点）', ipa: '/pɑːst/' }, { w: 'quarter', m: '一刻钟', ipa: '/ˈkwɔːtə(r)/' }
          ],
          sents: [
            { en: "What time do you usually get up? — I usually get up at seven o'clock.", zh: '你通常几点起床？——我通常七点起床。' },
            { en: "I brush my teeth and then have breakfast.", zh: '我刷牙然后吃早饭。' },
            { en: "When do you go to bed? — At about ten.", zh: '你什么时候睡觉？——大约十点。' },
            { en: "He often does his homework after dinner.", zh: '他经常晚饭后做作业。' },
            { en: "How do you spend your school day?", zh: '你怎样度过上学的日子？' }
          ],
          grammar: '一般现在时（第三人称单数动词加 -s/-es）；频度副词 always > usually > often > sometimes > never；时间表达 at + 钟点'
        },
        {
          id: 'g7a-u7', no: 10, title: 'Unit 7 Happy Birthday!', zh: '生日快乐（日期与庆祝）',
          words: [
            { w: 'birthday', m: '生日', ipa: '/ˈbɜːθdeɪ/' }, { w: 'party', m: '聚会', ipa: '/ˈpɑːti/' },
            { w: 'cake', m: '蛋糕', ipa: '/keɪk/' }, { w: 'candle', m: '蜡烛', ipa: '/ˈkændl/' },
            { w: 'gift', m: '礼物', ipa: '/ɡɪft/' }, { w: 'present', m: '礼物', ipa: '/ˈpreznt/' },
            { w: 'card', m: '卡片', ipa: '/kɑːd/' }, { w: 'celebrate', m: '庆祝', ipa: '/ˈselɪbreɪt/' },
            { w: 'invite', m: '邀请', ipa: '/ɪnˈvaɪt/' }, { w: 'wish', m: '愿望；祝愿', ipa: '/wɪʃ/' },
            { w: 'blow', m: '吹', ipa: '/bləʊ/' }, { w: 'month', m: '月份', ipa: '/mʌnθ/' },
            { w: 'January', m: '一月', ipa: '/ˈdʒænjuəri/' }, { w: 'May', m: '五月', ipa: '/meɪ/' },
            { w: 'December', m: '十二月', ipa: '/dɪˈsembə(r)/' }, { w: 'date', m: '日期', ipa: '/deɪt/' }
          ],
          sents: [
            { en: "When is your birthday? — It's on 5th May.", zh: '你的生日是什么时候？——5 月 5 日。' },
            { en: "How do you celebrate your birthday?", zh: '你怎样庆祝生日？' },
            { en: "Happy birthday to you!", zh: '祝你生日快乐！' },
            { en: "I want to have a birthday party.", zh: '我想办一个生日聚会。' },
            { en: "I make a wish and blow out the candles.", zh: '我许个愿然后吹灭蜡烛。' }
          ],
          grammar: 'when 问时间；日期表达用 on + 月份 + 序数词（on 5th May）；序数词 first / second / third...；want to do sth.'
        }
      ]
    },

    /* ==================== 七年级下册（2025 春启用） ==================== */
    {
      id: 'g7b', grade: 7, sem: 2, edition: 'new', name: '七年级下册', label: '七下（新版）',
      units: [
        {
          id: 'g7b-u1', no: 1, title: 'Unit 1 Animal Friends', zh: '动物朋友',
          words: [
            { w: 'animal', m: '动物', ipa: '/ˈænɪml/' }, { w: 'panda', m: '熊猫', ipa: '/ˈpændə/' },
            { w: 'tiger', m: '老虎', ipa: '/ˈtaɪɡə(r)/' }, { w: 'lion', m: '狮子', ipa: '/ˈlaɪən/' },
            { w: 'elephant', m: '大象', ipa: '/ˈelɪfənt/' }, { w: 'giraffe', m: '长颈鹿', ipa: '/dʒəˈrɑːf/' },
            { w: 'monkey', m: '猴子', ipa: '/ˈmʌŋki/' }, { w: 'koala', m: '考拉', ipa: '/kəʊˈɑːlə/' },
            { w: 'dolphin', m: '海豚', ipa: '/ˈdɒlfɪn/' }, { w: 'whale', m: '鲸', ipa: '/weɪl/' },
            { w: 'shark', m: '鲨鱼', ipa: '/ʃɑːk/' }, { w: 'bear', m: '熊', ipa: '/beə(r)/' },
            { w: 'wolf', m: '狼', ipa: '/wʊlf/' }, { w: 'fox', m: '狐狸', ipa: '/fɒks/' },
            { w: 'zoo', m: '动物园', ipa: '/zuː/' }, { w: 'cute', m: '可爱的', ipa: '/kjuːt/' },
            { w: 'scary', m: '吓人的', ipa: '/ˈskeəri/' }, { w: 'smart', m: '聪明的', ipa: '/smɑːt/' }
          ],
          sents: [
            { en: "Why do you like pandas? — Because they're cute.", zh: '你为什么喜欢熊猫？——因为它们很可爱。' },
            { en: "Where are lions from? — They're from Africa.", zh: '狮子来自哪里？——它们来自非洲。' },
            { en: "What animals do you like?", zh: '你喜欢什么动物？' },
            { en: "Let's see the elephants first.", zh: '我们先看大象吧。' },
            { en: "Dolphins are smart and friendly.", zh: '海豚聪明又友好。' }
          ],
          grammar: 'what / where / why 引导的特殊疑问句；形容词作表语（be + adj.）；可数名词复数变化'
        },
        {
          id: 'g7b-u2', no: 2, title: 'Unit 2 No Rules, No Order', zh: '无规矩不成方圆',
          words: [
            { w: 'rule', m: '规则', ipa: '/ruːl/' }, { w: 'order', m: '秩序', ipa: '/ˈɔːdə(r)/' },
            { w: 'follow', m: '遵守', ipa: '/ˈfɒləʊ/' }, { w: 'break', m: '违反；打破', ipa: '/breɪk/' },
            { w: 'quiet', m: '安静的', ipa: '/ˈkwaɪət/' }, { w: 'loud', m: '大声的', ipa: '/laʊd/' },
            { w: 'hallway', m: '走廊', ipa: '/ˈhɔːlweɪ/' }, { w: 'uniform', m: '校服', ipa: '/ˈjuːnɪfɔːm/' },
            { w: 'arrive', m: '到达', ipa: '/əˈraɪv/' }, { w: 'late', m: '迟的；晚的', ipa: '/leɪt/' },
            { w: 'listen', m: '听', ipa: '/ˈlɪsn/' }, { w: 'fight', m: '打架', ipa: '/faɪt/' },
            { w: 'wear', m: '穿；戴', ipa: '/weə(r)/' }, { w: 'must', m: '必须', ipa: '/mʌst/' },
            { w: 'have to', m: '不得不；必须', ipa: '/hæv tuː/' }, { w: 'polite', m: '有礼貌的', ipa: '/pəˈlaɪt/' }
          ],
          sents: [
            { en: "What are the rules? — We must be quiet in the library.", zh: '有什么规则？——我们在图书馆必须安静。' },
            { en: "Don't eat in class.", zh: '不要在课堂上吃东西。' },
            { en: "Can we wear hats at school? — No, we can't.", zh: '我们在学校能戴帽子吗？——不，不能。' },
            { en: "You have to wear a uniform.", zh: '你必须穿校服。' },
            { en: "Don't run in the hallways.", zh: '不要在走廊里跑。' }
          ],
          grammar: '祈使句：肯定用动词原形开头，否定用 Don\'t + 动词原形；情态动词 can / have to / must 的用法与区别'
        },
        {
          id: 'g7b-u3', no: 3, title: 'Unit 3 Keep Fit', zh: '保持健康（运动与频率）',
          words: [
            { w: 'exercise', m: '锻炼', ipa: '/ˈeksəsaɪz/' }, { w: 'sport', m: '运动', ipa: '/spɔːt/' },
            { w: 'run', m: '跑', ipa: '/rʌn/' }, { w: 'jog', m: '慢跑', ipa: '/dʒɒɡ/' },
            { w: 'badminton', m: '羽毛球', ipa: '/ˈbædmɪntən/' }, { w: 'tennis', m: '网球', ipa: '/ˈtenɪs/' },
            { w: 'fit', m: '健康的', ipa: '/fɪt/' }, { w: 'healthy', m: '健康的', ipa: '/ˈhelθi/' },
            { w: 'strong', m: '强壮的', ipa: '/strɒŋ/' }, { w: 'habit', m: '习惯', ipa: '/ˈhæbɪt/' },
            { w: 'once', m: '一次', ipa: '/wʌns/' }, { w: 'twice', m: '两次', ipa: '/twaɪs/' },
            { w: 'week', m: '周；星期', ipa: '/wiːk/' }, { w: 'mine', m: '我的（名词性）', ipa: '/maɪn/' },
            { w: 'yours', m: '你的（名词性）', ipa: '/jɔːz/' }, { w: 'theirs', m: '他们的（名词性）', ipa: '/ðeəz/' }
          ],
          sents: [
            { en: "How often do you exercise? — I exercise twice a week.", zh: '你多久锻炼一次？——我一周锻炼两次。' },
            { en: "Whose basketball is this? — It's mine.", zh: '这是谁的篮球？——是我的。' },
            { en: "Running is good for us.", zh: '跑步对我们有好处。' },
            { en: "Let's play badminton after school.", zh: '放学后我们打羽毛球吧。' },
            { en: "Is this yours or hers?", zh: '这是你的还是她的？' }
          ],
          grammar: '名词性物主代词 mine / yours / his / hers / ours / theirs（后面不接名词）；频度副词与 how often；once / twice a week'
        },
        {
          id: 'g7b-u4', no: 4, title: 'Unit 4 Eat Well', zh: '吃得健康（食物与数量）',
          words: [
            { w: 'food', m: '食物', ipa: '/fuːd/' }, { w: 'rice', m: '米饭', ipa: '/raɪs/' },
            { w: 'noodle', m: '面条', ipa: '/ˈnuːdl/' }, { w: 'bread', m: '面包', ipa: '/bred/' },
            { w: 'egg', m: '鸡蛋', ipa: '/eɡ/' }, { w: 'milk', m: '牛奶', ipa: '/mɪlk/' },
            { w: 'juice', m: '果汁', ipa: '/dʒuːs/' }, { w: 'vegetable', m: '蔬菜', ipa: '/ˈvedʒtəbl/' },
            { w: 'fruit', m: '水果', ipa: '/fruːt/' }, { w: 'beef', m: '牛肉', ipa: '/biːf/' },
            { w: 'fish', m: '鱼；鱼肉', ipa: '/fɪʃ/' }, { w: 'soup', m: '汤', ipa: '/suːp/' },
            { w: 'salad', m: '沙拉', ipa: '/ˈsæləd/' }, { w: 'sweet', m: '甜的；糖果', ipa: '/swiːt/' },
            { w: 'delicious', m: '美味的', ipa: '/dɪˈlɪʃəs/' }, { w: 'menu', m: '菜单', ipa: '/ˈmenjuː/' }
          ],
          sents: [
            { en: "What would you like to eat? — I'd like some noodles.", zh: '你想吃什么？——我想要一些面条。' },
            { en: "Do you like vegetables or fruit? — I like fruit.", zh: '你喜欢蔬菜还是水果？——我喜欢水果。' },
            { en: "How much milk do you drink every day?", zh: '你每天喝多少牛奶？' },
            { en: "Eating vegetables is good for your health.", zh: '吃蔬菜对你的健康有好处。' },
            { en: "How many eggs do we need?", zh: '我们需要多少个鸡蛋？' }
          ],
          grammar: '选择疑问句：用 or 连接两个选项，不能用 yes/no 回答；可数名词与不可数名词；how many + 可数复数 / how much + 不可数'
        },
        {
          id: 'g7b-u5', no: 5, title: 'Unit 5 Here and Now', zh: '此时此刻（现在进行时 1）',
          words: [
            { w: 'now', m: '现在', ipa: '/naʊ/' }, { w: 'moment', m: '片刻；此刻', ipa: '/ˈməʊmənt/' },
            { w: 'write', m: '写', ipa: '/raɪt/' }, { w: 'draw', m: '画', ipa: '/drɔː/' },
            { w: 'cook', m: '做饭', ipa: '/kʊk/' }, { w: 'clean', m: '打扫；清洁的', ipa: '/kliːn/' },
            { w: 'wash', m: '洗', ipa: '/wɒʃ/' }, { w: 'study', m: '学习', ipa: '/ˈstʌdi/' },
            { w: 'talk', m: '谈话', ipa: '/tɔːk/' }, { w: 'phone', m: '电话；打电话', ipa: '/fəʊn/' },
            { w: 'watch', m: '观看', ipa: '/wɒtʃ/' }, { w: 'busy', m: '忙碌的', ipa: '/ˈbɪzi/' },
            { w: 'free', m: '空闲的；免费的', ipa: '/friː/' }, { w: 'wait', m: '等待', ipa: '/weɪt/' },
            { w: 'right', m: '正好；右边', ipa: '/raɪt/' }, { w: 'group', m: '组；群', ipa: '/ɡruːp/' }
          ],
          sents: [
            { en: "What are you doing right now? — I'm doing my homework.", zh: '你现在在做什么？——我在做作业。' },
            { en: "Are you watching TV? — Yes, I am. / No, I'm not.", zh: '你在看电视吗？——是的。／不是。' },
            { en: "He is playing basketball now.", zh: '他现在正在打篮球。' },
            { en: "Let's go and see what they are doing.", zh: '我们去看看他们在做什么。' },
            { en: "Sorry, I'm busy at the moment.", zh: '抱歉，我这会儿很忙。' }
          ],
          grammar: '现在进行时（1）：am/is/are + 动词-ing，表示此刻正在发生；一般疑问句把 be 提前；动词-ing 的构成规则'
        },
        {
          id: 'g7b-u6', no: 6, title: 'Unit 6 Rain or Shine', zh: '阴晴雨雪（天气与现在进行时 2）',
          words: [
            { w: 'weather', m: '天气', ipa: '/ˈweðə(r)/' }, { w: 'rain', m: '雨；下雨', ipa: '/reɪn/' },
            { w: 'rainy', m: '下雨的', ipa: '/ˈreɪni/' }, { w: 'snow', m: '雪；下雪', ipa: '/snəʊ/' },
            { w: 'snowy', m: '下雪的', ipa: '/ˈsnəʊi/' }, { w: 'wind', m: '风', ipa: '/wɪnd/' },
            { w: 'windy', m: '有风的', ipa: '/ˈwɪndi/' }, { w: 'cloud', m: '云', ipa: '/klaʊd/' },
            { w: 'cloudy', m: '多云的', ipa: '/ˈklaʊdi/' }, { w: 'sunny', m: '晴朗的', ipa: '/ˈsʌni/' },
            { w: 'hot', m: '热的', ipa: '/hɒt/' }, { w: 'cold', m: '冷的', ipa: '/kəʊld/' },
            { w: 'warm', m: '温暖的', ipa: '/wɔːm/' }, { w: 'cool', m: '凉爽的', ipa: '/kuːl/' },
            { w: 'temperature', m: '温度', ipa: '/ˈtemprətʃə(r)/' }, { w: 'umbrella', m: '雨伞', ipa: '/ʌmˈbrelə/' }
          ],
          sents: [
            { en: "What's the weather like? — It's rainy and cold.", zh: '天气怎么样？——下雨而且冷。' },
            { en: "How's the weather in Beijing? — It's sunny.", zh: '北京天气如何？——晴天。' },
            { en: "It's raining outside.", zh: '外面正在下雨。' },
            { en: "Take an umbrella with you.", zh: '带把伞。' },
            { en: "It's snowing heavily now.", zh: '现在雪下得很大。' }
          ],
          grammar: '现在进行时（2）：描述当前天气与正在进行的动作；天气表达 It\'s + 形容词 / It\'s + 动词-ing；What\'s ... like? 与 How\'s ...?'
        },
        {
          id: 'g7b-u7', no: 7, title: 'Unit 7 A Day to Remember', zh: '难忘的一天（一般过去时 1）',
          words: [
            { w: 'remember', m: '记得', ipa: '/rɪˈmembə(r)/' }, { w: 'forget', m: '忘记', ipa: '/fəˈɡet/' },
            { w: 'trip', m: '旅行', ipa: '/trɪp/' }, { w: 'visit', m: '参观；拜访', ipa: '/ˈvɪzɪt/' },
            { w: 'museum', m: '博物馆', ipa: '/mjuˈziːəm/' }, { w: 'mountain', m: '山', ipa: '/ˈmaʊntən/' },
            { w: 'beach', m: '海滩', ipa: '/biːtʃ/' }, { w: 'camp', m: '营地；露营', ipa: '/kæmp/' },
            { w: 'yesterday', m: '昨天', ipa: '/ˈjestədeɪ/' }, { w: 'ago', m: '以前', ipa: '/əˈɡəʊ/' },
            { w: 'was', m: '是（am/is 过去式）', ipa: '/wɒz/' }, { w: 'were', m: '是（are 过去式）', ipa: '/wɜː(r)/' },
            { w: 'went', m: '去（go 过去式）', ipa: '/went/' }, { w: 'saw', m: '看见（see 过去式）', ipa: '/sɔː/' },
            { w: 'wonderful', m: '精彩的', ipa: '/ˈwʌndəfl/' }, { w: 'special', m: '特别的', ipa: '/ˈspeʃl/' }
          ],
          sents: [
            { en: "How was your school trip? — It was wonderful.", zh: '你的学校旅行怎么样？——很棒。' },
            { en: "What did you do last weekend? — I visited a museum.", zh: '上周末你做了什么？——我参观了一个博物馆。' },
            { en: "Where did you go? — We went to the beach.", zh: '你们去哪儿了？——我们去了海滩。' },
            { en: "I had a great time.", zh: '我玩得很开心。' },
            { en: "We saw many interesting things there.", zh: '我们在那儿看到很多有趣的东西。' }
          ],
          grammar: '一般过去时（1）：be 动词过去式 was / were；规则动词加 -ed，不规则动词需记忆（go→went, see→saw, have→had）；yesterday / last... 等过去时间状语'
        },
        {
          id: 'g7b-u8', no: 8, title: 'Unit 8 Once upon a Time', zh: '从前（故事与一般过去时 2）',
          words: [
            { w: 'story', m: '故事', ipa: '/ˈstɔːri/' }, { w: 'once', m: '曾经；一次', ipa: '/wʌns/' },
            { w: 'king', m: '国王', ipa: '/kɪŋ/' }, { w: 'queen', m: '王后', ipa: '/kwiːn/' },
            { w: 'prince', m: '王子', ipa: '/prɪns/' }, { w: 'princess', m: '公主', ipa: '/ˌprɪnˈses/' },
            { w: 'forest', m: '森林', ipa: '/ˈfɒrɪst/' }, { w: 'village', m: '村庄', ipa: '/ˈvɪlɪdʒ/' },
            { w: 'magic', m: '魔法', ipa: '/ˈmædʒɪk/' }, { w: 'brave', m: '勇敢的', ipa: '/breɪv/' },
            { w: 'clever', m: '聪明的', ipa: '/ˈklevə(r)/' }, { w: 'foolish', m: '愚蠢的', ipa: '/ˈfuːlɪʃ/' },
            { w: 'giant', m: '巨人', ipa: '/ˈdʒaɪənt/' }, { w: 'lost', m: '迷路的；丢失的', ipa: '/lɒst/' },
            { w: 'found', m: '找到（find 过去式）', ipa: '/faʊnd/' }, { w: 'ending', m: '结局', ipa: '/ˈendɪŋ/' }
          ],
          sents: [
            { en: "Once upon a time, there was a brave boy.", zh: '从前，有一个勇敢的男孩。' },
            { en: "What happened next? — The wolf came and ate the sheep.", zh: '接下来发生了什么？——狼来了并吃掉了羊。' },
            { en: "What can you learn from the story?", zh: '你从这个故事中学到了什么？' },
            { en: "The story has a happy ending.", zh: '这个故事有个圆满的结局。' },
            { en: "He was lost in the forest, but a kind man helped him.", zh: '他在森林里迷路了，但一个好心人帮了他。' }
          ],
          grammar: '一般过去时（2）：故事叙述常用 Once upon a time / Then / Finally；there was / there were；不规则动词过去式（come→came, eat→ate, find→found, lose→lost）'
        }
      ]
    }
  ];

  JUNIOR.forEach(b => window.PEP.books.push(b));

  // 更新 meta 标注（不影响小学双轨）
  try {
    const m = window.PEP.meta || {};
    m.junior = 'pep-junior-2024.1（七上 3+7、七下 8 单元，人教 Go for it! 2024 修订版）';
    window.PEP.meta = m;
  } catch (e) { }
})();
