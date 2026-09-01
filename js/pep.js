// ============================================================
// v83 · PEP 小学英语教材同步库（人教版 PEP，三年级起点）
// ------------------------------------------------------------
// 建库口径（与《网站改版建议_v2.md》B4 一致，双轨）：
//   · 旧版 PEP（2013 版）三~五年级：共 6 册 × 6 单元 = 36 单元（补欠账）
//   · 2024 修订版 PEP 六年级上/下：六上 6 单元 + 六下 4 单元（同步新课）
// 孩子 2026 秋在广西北流市读六年级，秋季启用 2024 修订版六上，
// U1 标题已由家长核对课本目录确认为 "Amazing places"。
//
// 数据结构（勿改字段名，js/engPep.js 按此读）：
//   book  { id, grade, sem, edition:'old'|'new', name, label, units:[] }
//   unit  { id, no, title, zh, words:[{w,m,ipa}], sents:[{en,zh}], grammar }
//   · words 用于「选词填空 / 单词拼写 / 英译中」
//   · sents 用于「句型转换 / 补全句子」
//   · grammar 显示在单元首页，帮家长讲清考点
// ============================================================
window.PEP = {
  meta: {
    ver: 'pep-2024.1',
    built: '2026-09-01',
    note: '旧版三~五年级 + 2024 修订版六年级，双轨并行'
  },
  books: [
    /* ==================== 三年级上册（旧版 PEP） ==================== */
    {
      id: 'g3a', grade: 3, sem: 1, edition: 'old', name: '三年级上册', label: 'PEP 三上',
      units: [
        {
          id: 'g3a-u1', no: 1, title: 'Hello!', zh: '问候与自我介绍',
          words: [
            { w: 'hello', m: '你好', ipa: '/həˈləʊ/' }, { w: 'hi', m: '嗨；你好', ipa: '/haɪ/' },
            { w: 'name', m: '名字', ipa: '/neɪm/' }, { w: 'goodbye', m: '再见', ipa: '/ˌɡʊdˈbaɪ/' },
            { w: 'bye', m: '再见', ipa: '/baɪ/' }, { w: 'pencil', m: '铅笔', ipa: '/ˈpensl/' },
            { w: 'ruler', m: '尺子', ipa: '/ˈruːlə/' }, { w: 'eraser', m: '橡皮', ipa: '/ɪˈreɪzə/' },
            { w: 'crayon', m: '蜡笔', ipa: '/ˈkreɪən/' }, { w: 'bag', m: '书包', ipa: '/bæɡ/' },
            { w: 'pen', m: '钢笔', ipa: '/pen/' }, { w: 'book', m: '书', ipa: '/bʊk/' }
          ],
          sents: [
            { en: "Hello! I'm Wu Binbin.", zh: '你好！我是吴斌斌。' },
            { en: "What's your name?", zh: '你叫什么名字？' },
            { en: "My name's Sarah.", zh: '我的名字是萨拉。' },
            { en: "Goodbye! Bye, Miss White.", zh: '再见！再见，怀特小姐。' }
          ],
          grammar: '用 Hello / Hi 打招呼；用 I\'m + 姓名 或 My name\'s + 姓名 介绍自己；用 What\'s your name? 问对方姓名。'
        },
        {
          id: 'g3a-u2', no: 2, title: 'Colours', zh: '颜色',
          words: [
            { w: 'red', m: '红色', ipa: '/red/' }, { w: 'green', m: '绿色', ipa: '/ɡriːn/' },
            { w: 'yellow', m: '黄色', ipa: '/ˈjeləʊ/' }, { w: 'blue', m: '蓝色', ipa: '/bluː/' },
            { w: 'black', m: '黑色', ipa: '/blæk/' }, { w: 'white', m: '白色', ipa: '/waɪt/' },
            { w: 'orange', m: '橙色；橘子', ipa: '/ˈɒrɪndʒ/' }, { w: 'brown', m: '棕色', ipa: '/braʊn/' },
            { w: 'pink', m: '粉色', ipa: '/pɪŋk/' }, { w: 'purple', m: '紫色', ipa: '/ˈpɜːpl/' },
            { w: 'colour', m: '颜色', ipa: '/ˈkʌlə/' }, { w: 'see', m: '看见', ipa: '/siː/' }
          ],
          sents: [
            { en: 'I see red.', zh: '我看见红色。' },
            { en: 'Show me green.', zh: '给我看绿色。' },
            { en: 'What colour is it?', zh: '它是什么颜色？' },
            { en: "It's blue.", zh: '它是蓝色的。' }
          ],
          grammar: '用 What colour is it? 问颜色，It\'s + 颜色 回答；颜色词放在名词前：a red bag。'
        },
        {
          id: 'g3a-u3', no: 3, title: 'Look at me!', zh: '身体部位',
          words: [
            { w: 'face', m: '脸', ipa: '/feɪs/' }, { w: 'ear', m: '耳朵', ipa: '/ɪə/' },
            { w: 'eye', m: '眼睛', ipa: '/aɪ/' }, { w: 'nose', m: '鼻子', ipa: '/nəʊz/' },
            { w: 'mouth', m: '嘴', ipa: '/maʊθ/' }, { w: 'arm', m: '手臂', ipa: '/ɑːm/' },
            { w: 'hand', m: '手', ipa: '/hænd/' }, { w: 'head', m: '头', ipa: '/hed/' },
            { w: 'body', m: '身体', ipa: '/ˈbɒdi/' }, { w: 'leg', m: '腿', ipa: '/leɡ/' },
            { w: 'foot', m: '脚', ipa: '/fʊt/' }, { w: 'hair', m: '头发', ipa: '/heə/' }
          ],
          sents: [
            { en: 'Look at me!', zh: '看着我！' },
            { en: 'This is my head.', zh: '这是我的头。' },
            { en: 'Touch your nose.', zh: '摸摸你的鼻子。' },
            { en: 'Clap your hands.', zh: '拍拍你的手。' }
          ],
          grammar: 'This is my + 身体部位（这是我的……）；Touch / Clap / Close your + 部位（祈使句发指令）。'
        },
        {
          id: 'g3a-u4', no: 4, title: 'We love animals', zh: '动物',
          words: [
            { w: 'duck', m: '鸭子', ipa: '/dʌk/' }, { w: 'pig', m: '猪', ipa: '/pɪɡ/' },
            { w: 'cat', m: '猫', ipa: '/kæt/' }, { w: 'bear', m: '熊', ipa: '/beə/' },
            { w: 'dog', m: '狗', ipa: '/dɒɡ/' }, { w: 'elephant', m: '大象', ipa: '/ˈelɪfənt/' },
            { w: 'monkey', m: '猴子', ipa: '/ˈmʌŋki/' }, { w: 'bird', m: '鸟', ipa: '/bɜːd/' },
            { w: 'tiger', m: '老虎', ipa: '/ˈtaɪɡə/' }, { w: 'panda', m: '熊猫', ipa: '/ˈpændə/' },
            { w: 'zoo', m: '动物园', ipa: '/zuː/' }, { w: 'funny', m: '滑稽的', ipa: '/ˈfʌni/' }
          ],
          sents: [
            { en: "What's this?", zh: '这是什么？' },
            { en: "It's a duck.", zh: '它是一只鸭子。' },
            { en: 'Look! I have a rabbit.', zh: '看！我有一只兔子。' },
            { en: 'Cool! Super!', zh: '酷！太棒了！' }
          ],
          grammar: 'What\'s this? 问近处的单个物品，答 It\'s a/an + 名词；a 用于辅音开头词前，an 用于元音开头词前。'
        },
        {
          id: 'g3a-u5', no: 5, title: "Let's eat!", zh: '食物与饮料',
          words: [
            { w: 'bread', m: '面包', ipa: '/bred/' }, { w: 'juice', m: '果汁', ipa: '/dʒuːs/' },
            { w: 'egg', m: '蛋', ipa: '/eɡ/' }, { w: 'milk', m: '牛奶', ipa: '/mɪlk/' },
            { w: 'water', m: '水', ipa: '/ˈwɔːtə/' }, { w: 'cake', m: '蛋糕', ipa: '/keɪk/' },
            { w: 'fish', m: '鱼', ipa: '/fɪʃ/' }, { w: 'rice', m: '米饭', ipa: '/raɪs/' },
            { w: 'hamburger', m: '汉堡包', ipa: '/ˈhæmbɜːɡə/' }, { w: 'chicken', m: '鸡肉', ipa: '/ˈtʃɪkɪn/' },
            { w: 'noodles', m: '面条', ipa: '/ˈnuːdlz/' }, { w: 'please', m: '请', ipa: '/pliːz/' }
          ],
          sents: [
            { en: "I'd like some juice, please.", zh: '我想要一些果汁，谢谢。' },
            { en: 'Have some bread.', zh: '吃点面包吧。' },
            { en: 'Thank you. You are welcome.', zh: '谢谢。不客气。' },
            { en: 'Can I have some water?', zh: '我可以喝点水吗？' }
          ],
          grammar: 'I\'d like some + 食物（我想要……，比 I want 更礼貌）；Have some + 食物（请吃点……）。'
        },
        {
          id: 'g3a-u6', no: 6, title: 'Happy birthday!', zh: '数字与生日',
          words: [
            { w: 'one', m: '一', ipa: '/wʌn/' }, { w: 'two', m: '二', ipa: '/tuː/' },
            { w: 'three', m: '三', ipa: '/θriː/' }, { w: 'four', m: '四', ipa: '/fɔː/' },
            { w: 'five', m: '五', ipa: '/faɪv/' }, { w: 'six', m: '六', ipa: '/sɪks/' },
            { w: 'seven', m: '七', ipa: '/ˈsevn/' }, { w: 'eight', m: '八', ipa: '/eɪt/' },
            { w: 'nine', m: '九', ipa: '/naɪn/' }, { w: 'ten', m: '十', ipa: '/ten/' },
            { w: 'birthday', m: '生日', ipa: '/ˈbɜːθdeɪ/' }, { w: 'gift', m: '礼物', ipa: '/ɡɪft/' }
          ],
          sents: [
            { en: 'How old are you?', zh: '你几岁了？' },
            { en: "I'm nine years old.", zh: '我九岁了。' },
            { en: 'Happy birthday!', zh: '生日快乐！' },
            { en: 'How many plates?', zh: '多少个盘子？' }
          ],
          grammar: 'How old are you? 问年龄，答 I\'m + 数字 + years old；How many + 名词复数 问可数名词数量。'
        }
      ]
    },

    /* ==================== 三年级下册（旧版 PEP） ==================== */
    {
      id: 'g3b', grade: 3, sem: 2, edition: 'old', name: '三年级下册', label: 'PEP 三下',
      units: [
        {
          id: 'g3b-u1', no: 1, title: 'Welcome back to school!', zh: '国籍与介绍',
          words: [
            { w: 'boy', m: '男孩', ipa: '/bɔɪ/' }, { w: 'girl', m: '女孩', ipa: '/ɡɜːl/' },
            { w: 'teacher', m: '老师', ipa: '/ˈtiːtʃə/' }, { w: 'student', m: '学生', ipa: '/ˈstjuːdnt/' },
            { w: 'friend', m: '朋友', ipa: '/frend/' }, { w: 'today', m: '今天', ipa: '/təˈdeɪ/' },
            { w: 'new', m: '新的', ipa: '/njuː/' }, { w: 'China', m: '中国', ipa: '/ˈtʃaɪnə/' },
            { w: 'Canada', m: '加拿大', ipa: '/ˈkænədə/' }, { w: 'UK', m: '英国', ipa: '/ˌjuːˈkeɪ/' },
            { w: 'USA', m: '美国', ipa: '/ˌjuːesˈeɪ/' }, { w: 'from', m: '从；来自', ipa: '/frɒm/' }
          ],
          sents: [
            { en: 'Where are you from?', zh: '你来自哪里？' },
            { en: "I'm from the UK.", zh: '我来自英国。' },
            { en: 'We have a new friend today.', zh: '今天我们有一位新朋友。' },
            { en: 'This is Amy.', zh: '这是艾米。' }
          ],
          grammar: 'Where are you from? 问来自哪里，答 I\'m from + 国家；国家名首字母大写，the UK / the USA 要加 the。'
        },
        {
          id: 'g3b-u2', no: 2, title: 'My family', zh: '家庭成员',
          words: [
            { w: 'father', m: '爸爸', ipa: '/ˈfɑːðə/' }, { w: 'mother', m: '妈妈', ipa: '/ˈmʌðə/' },
            { w: 'dad', m: '爸爸（口语）', ipa: '/dæd/' }, { w: 'mum', m: '妈妈（口语）', ipa: '/mʌm/' },
            { w: 'man', m: '男人', ipa: '/mæn/' }, { w: 'woman', m: '女人', ipa: '/ˈwʊmən/' },
            { w: 'sister', m: '姐妹', ipa: '/ˈsɪstə/' }, { w: 'brother', m: '兄弟', ipa: '/ˈbrʌðə/' },
            { w: 'grandmother', m: '祖母；外祖母', ipa: '/ˈɡrænmʌðə/' }, { w: 'grandfather', m: '祖父；外祖父', ipa: '/ˈɡrænfɑːðə/' },
            { w: 'family', m: '家庭', ipa: '/ˈfæməli/' }, { w: 'who', m: '谁', ipa: '/huː/' }
          ],
          sents: [
            { en: "Who's that man?", zh: '那位男士是谁？' },
            { en: "He's my father.", zh: '他是我的爸爸。' },
            { en: "Who's that woman?", zh: '那位女士是谁？' },
            { en: 'This is my family.', zh: '这是我的家庭。' }
          ],
          grammar: 'Who\'s that + 人？ 问远处的人是谁，答 He\'s / She\'s my + 称呼；man 的复数是 men，woman 的复数是 women。'
        },
        {
          id: 'g3b-u3', no: 3, title: 'At the zoo', zh: '形容词与动物特征',
          words: [
            { w: 'tall', m: '高的', ipa: '/tɔːl/' }, { w: 'short', m: '矮的；短的', ipa: '/ʃɔːt/' },
            { w: 'long', m: '长的', ipa: '/lɒŋ/' }, { w: 'thin', m: '瘦的', ipa: '/θɪn/' },
            { w: 'fat', m: '胖的', ipa: '/fæt/' }, { w: 'small', m: '小的', ipa: '/smɔːl/' },
            { w: 'big', m: '大的', ipa: '/bɪɡ/' }, { w: 'giraffe', m: '长颈鹿', ipa: '/dʒəˈrɑːf/' },
            { w: 'deer', m: '鹿', ipa: '/dɪə/' }, { w: 'tail', m: '尾巴', ipa: '/teɪl/' },
            { w: 'children', m: '孩子们', ipa: '/ˈtʃɪldrən/' }, { w: 'so', m: '这么；如此', ipa: '/səʊ/' }
          ],
          sents: [
            { en: 'Look at that monkey.', zh: '看那只猴子。' },
            { en: "It's so tall!", zh: '它好高啊！' },
            { en: 'It has a long nose.', zh: '它有一个长鼻子。' },
            { en: 'It has a short tail.', zh: '它有一条短尾巴。' }
          ],
          grammar: '形容词放在 be 动词后（It\'s tall）或名词前（a tall giraffe）；It has a + 形容词 + 名词 描述动物特征。'
        },
        {
          id: 'g3b-u4', no: 4, title: 'Where is my car?', zh: '方位介词',
          words: [
            { w: 'on', m: '在……上面', ipa: '/ɒn/' }, { w: 'in', m: '在……里面', ipa: '/ɪn/' },
            { w: 'under', m: '在……下面', ipa: '/ˈʌndə/' }, { w: 'chair', m: '椅子', ipa: '/tʃeə/' },
            { w: 'desk', m: '书桌', ipa: '/desk/' }, { w: 'cap', m: '帽子', ipa: '/kæp/' },
            { w: 'ball', m: '球', ipa: '/bɔːl/' }, { w: 'boat', m: '小船', ipa: '/bəʊt/' },
            { w: 'map', m: '地图', ipa: '/mæp/' }, { w: 'car', m: '小汽车', ipa: '/kɑː/' },
            { w: 'toy', m: '玩具', ipa: '/tɔɪ/' }, { w: 'box', m: '盒子', ipa: '/bɒks/' }
          ],
          sents: [
            { en: 'Where is my car?', zh: '我的小汽车在哪里？' },
            { en: "It's under the chair.", zh: '它在椅子下面。' },
            { en: 'Is it in your bag?', zh: '它在你的包里吗？' },
            { en: 'Yes, it is.', zh: '是的，它在。' },
            { en: "No, it isn't.", zh: '不，它不在。' }
          ],
          grammar: 'Where is + 单数名词？ 问位置，答 It\'s + on/in/under + the + 物品；一般疑问句用 Yes, it is. / No, it isn\'t. 回答。'
        },
        {
          id: 'g3b-u5', no: 5, title: 'Do you like pears?', zh: '水果与喜好',
          words: [
            { w: 'pear', m: '梨', ipa: '/peə/' }, { w: 'apple', m: '苹果', ipa: '/ˈæpl/' },
            { w: 'orange', m: '橘子', ipa: '/ˈɒrɪndʒ/' }, { w: 'banana', m: '香蕉', ipa: '/bəˈnɑːnə/' },
            { w: 'watermelon', m: '西瓜', ipa: '/ˈwɔːtəmelən/' }, { w: 'strawberry', m: '草莓', ipa: '/ˈstrɔːbəri/' },
            { w: 'grape', m: '葡萄', ipa: '/ɡreɪp/' }, { w: 'fruit', m: '水果', ipa: '/fruːt/' },
            { w: 'buy', m: '买', ipa: '/baɪ/' }, { w: 'some', m: '一些', ipa: '/sʌm/' },
            { w: 'sorry', m: '抱歉', ipa: '/ˈsɒri/' }, { w: 'like', m: '喜欢', ipa: '/laɪk/' }
          ],
          sents: [
            { en: 'Do you like pears?', zh: '你喜欢梨吗？' },
            { en: 'Yes, I do.', zh: '是的，我喜欢。' },
            { en: "No, I don't.", zh: '不，我不喜欢。' },
            { en: "I don't like watermelons.", zh: '我不喜欢西瓜。' }
          ],
          grammar: 'Do you like + 复数名词？ 问喜好，答 Yes, I do. / No, I don\'t.；否定句在动词前加 don\'t。'
        },
        {
          id: 'g3b-u6', no: 6, title: 'How many?', zh: '数字 11-20',
          words: [
            { w: 'eleven', m: '十一', ipa: '/ɪˈlevn/' }, { w: 'twelve', m: '十二', ipa: '/twelv/' },
            { w: 'thirteen', m: '十三', ipa: '/ˌθɜːˈtiːn/' }, { w: 'fourteen', m: '十四', ipa: '/ˌfɔːˈtiːn/' },
            { w: 'fifteen', m: '十五', ipa: '/ˌfɪfˈtiːn/' }, { w: 'sixteen', m: '十六', ipa: '/ˌsɪksˈtiːn/' },
            { w: 'seventeen', m: '十七', ipa: '/ˌsevnˈtiːn/' }, { w: 'eighteen', m: '十八', ipa: '/ˌeɪˈtiːn/' },
            { w: 'nineteen', m: '十九', ipa: '/ˌnaɪnˈtiːn/' }, { w: 'twenty', m: '二十', ipa: '/ˈtwenti/' },
            { w: 'kite', m: '风筝', ipa: '/kaɪt/' }, { w: 'crayon', m: '蜡笔', ipa: '/ˈkreɪən/' }
          ],
          sents: [
            { en: 'How many kites do you see?', zh: '你看见多少只风筝？' },
            { en: 'I see twelve.', zh: '我看见十二只。' },
            { en: 'How many crayons do you have?', zh: '你有多少支蜡笔？' },
            { en: 'I have sixteen.', zh: '我有十六支。' }
          ],
          grammar: 'How many + 名词复数 + do you see/have? 问数量；13-19 都以 -teen 结尾，注意 thirteen / fifteen / eighteen 的拼写。'
        }
      ]
    }
    ,

    /* ==================== 四年级上册（旧版 PEP） ==================== */
    {
      id: 'g4a', grade: 4, sem: 1, edition: 'old', name: '四年级上册', label: 'PEP 四上',
      units: [
        {
          id: 'g4a-u1', no: 1, title: 'My classroom', zh: '教室与物品位置',
          words: [
            { w: 'classroom', m: '教室', ipa: '/ˈklɑːsruːm/' }, { w: 'window', m: '窗户', ipa: '/ˈwɪndəʊ/' },
            { w: 'blackboard', m: '黑板', ipa: '/ˈblækbɔːd/' }, { w: 'light', m: '灯', ipa: '/laɪt/' },
            { w: 'picture', m: '图画', ipa: '/ˈpɪktʃə/' }, { w: 'door', m: '门', ipa: '/dɔː/' },
            { w: 'computer', m: '计算机', ipa: '/kəmˈpjuːtə/' }, { w: 'fan', m: '风扇', ipa: '/fæn/' },
            { w: 'wall', m: '墙', ipa: '/wɔːl/' }, { w: 'floor', m: '地板；楼层', ipa: '/flɔː/' },
            { w: 'near', m: '在……附近', ipa: '/nɪə/' }, { w: 'clean', m: '打扫；干净的', ipa: '/kliːn/' }
          ],
          sents: [
            { en: 'We have a new classroom.', zh: '我们有一间新教室。' },
            { en: 'Let us go and see!', zh: '我们去看看吧！' },
            { en: 'Where is it?', zh: '它在哪里？' },
            { en: "It's near the window.", zh: '它在窗户附近。' }
          ],
          grammar: 'Where is + 单数名词？ 问位置；It\'s near/in/on + the + 地点 回答。Let\'s + 动词原形 表示提议。'
        },
        {
          id: 'g4a-u2', no: 2, title: 'My schoolbag', zh: '书包与文具',
          words: [
            { w: 'schoolbag', m: '书包', ipa: '/ˈskuːlbæɡ/' }, { w: 'notebook', m: '笔记本', ipa: '/ˈnəʊtbʊk/' },
            { w: 'storybook', m: '故事书', ipa: '/ˈstɔːribʊk/' }, { w: 'candy', m: '糖果', ipa: '/ˈkændi/' },
            { w: 'toy', m: '玩具', ipa: '/tɔɪ/' }, { w: 'key', m: '钥匙', ipa: '/kiː/' },
            { w: 'heavy', m: '重的', ipa: '/ˈhevi/' }, { w: 'cute', m: '可爱的', ipa: '/kjuːt/' },
            { w: 'lost', m: '丢失的', ipa: '/lɒst/' }, { w: 'maths', m: '数学', ipa: '/mæθs/' },
            { w: 'English', m: '英语', ipa: '/ˈɪŋɡlɪʃ/' }, { w: 'Chinese', m: '语文；中国的', ipa: '/ˌtʃaɪˈniːz/' }
          ],
          sents: [
            { en: "What's in your schoolbag?", zh: '你的书包里有什么？' },
            { en: 'An English book and three storybooks.', zh: '一本英语书和三本故事书。' },
            { en: "What colour is it? It's black and white.", zh: '它是什么颜色的？它是黑白相间的。' },
            { en: 'I have a new schoolbag.', zh: '我有一个新书包。' }
          ],
          grammar: 'What\'s in your + 物品？ 问里面有什么；a/an + 单数可数名词，复数名词前不加 a/an。'
        },
        {
          id: 'g4a-u3', no: 3, title: 'My friends', zh: '描述朋友外貌性格',
          words: [
            { w: 'strong', m: '强壮的', ipa: '/strɒŋ/' }, { w: 'friendly', m: '友好的', ipa: '/ˈfrendli/' },
            { w: 'quiet', m: '安静的', ipa: '/ˈkwaɪət/' }, { w: 'glasses', m: '眼镜', ipa: '/ˈɡlɑːsɪz/' },
            { w: 'shoe', m: '鞋', ipa: '/ʃuː/' }, { w: 'hat', m: '帽子', ipa: '/hæt/' },
            { w: 'hair', m: '头发', ipa: '/heə/' }, { w: 'his', m: '他的', ipa: '/hɪz/' },
            { w: 'her', m: '她的', ipa: '/hɜː/' }, { w: 'tall', m: '高的', ipa: '/tɔːl/' },
            { w: 'thin', m: '瘦的', ipa: '/θɪn/' }, { w: 'friend', m: '朋友', ipa: '/frend/' }
          ],
          sents: [
            { en: 'My friend has short hair.', zh: '我的朋友留着短发。' },
            { en: "He's tall and strong.", zh: '他又高又壮。' },
            { en: "What's his name? His name is Zhang Peng.", zh: '他叫什么名字？他叫张鹏。' },
            { en: 'She is quiet and friendly.', zh: '她文静又友好。' }
          ],
          grammar: 'has + 名词（He has short hair）；be + 形容词（He is tall）；his 他的 / her 她的，后面接名词。'
        },
        {
          id: 'g4a-u4', no: 4, title: 'My home', zh: '房间与家居',
          words: [
            { w: 'bedroom', m: '卧室', ipa: '/ˈbedruːm/' }, { w: 'living room', m: '客厅', ipa: '/ˈlɪvɪŋ ruːm/' },
            { w: 'study', m: '书房', ipa: '/ˈstʌdi/' }, { w: 'kitchen', m: '厨房', ipa: '/ˈkɪtʃɪn/' },
            { w: 'bathroom', m: '卫生间', ipa: '/ˈbɑːθruːm/' }, { w: 'phone', m: '电话', ipa: '/fəʊn/' },
            { w: 'table', m: '桌子', ipa: '/ˈteɪbl/' }, { w: 'bed', m: '床', ipa: '/bed/' },
            { w: 'sofa', m: '沙发', ipa: '/ˈsəʊfə/' }, { w: 'fridge', m: '冰箱', ipa: '/frɪdʒ/' },
            { w: 'home', m: '家', ipa: '/həʊm/' }, { w: 'room', m: '房间', ipa: '/ruːm/' }
          ],
          sents: [
            { en: 'Is she in the kitchen?', zh: '她在厨房里吗？' },
            { en: 'Yes, she is.', zh: '是的，她在。' },
            { en: 'Where are the keys?', zh: '钥匙在哪里？' },
            { en: "They're in the door.", zh: '它们在门上。' }
          ],
          grammar: 'Is she/he in the + 房间？ 问人在哪，答 Yes, she is. / No, she isn\'t.；复数用 Where are...? They\'re...'
        },
        {
          id: 'g4a-u5', no: 5, title: "Dinner's ready", zh: '餐具与用餐',
          words: [
            { w: 'beef', m: '牛肉', ipa: '/biːf/' }, { w: 'soup', m: '汤', ipa: '/suːp/' },
            { w: 'vegetable', m: '蔬菜', ipa: '/ˈvedʒtəbl/' }, { w: 'chopsticks', m: '筷子', ipa: '/ˈtʃɒpstɪks/' },
            { w: 'bowl', m: '碗', ipa: '/bəʊl/' }, { w: 'fork', m: '叉子', ipa: '/fɔːk/' },
            { w: 'knife', m: '刀', ipa: '/naɪf/' }, { w: 'spoon', m: '勺子', ipa: '/spuːn/' },
            { w: 'dinner', m: '晚餐', ipa: '/ˈdɪnə/' }, { w: 'ready', m: '准备好的', ipa: '/ˈredi/' },
            { w: 'pass', m: '传递', ipa: '/pɑːs/' }, { w: 'delicious', m: '美味的', ipa: '/dɪˈlɪʃəs/' }
          ],
          sents: [
            { en: 'What would you like for dinner?', zh: '晚餐你想吃什么？' },
            { en: "I'd like some soup and bread.", zh: '我想要一些汤和面包。' },
            { en: 'Help yourself.', zh: '请随便吃。' },
            { en: 'Pass me the knife, please.', zh: '请把刀递给我。' }
          ],
          grammar: 'What would you like? 是礼貌问法，答 I\'d like...（= I would like）；Help yourself. 用于招待客人。'
        },
        {
          id: 'g4a-u6', no: 6, title: 'Meet my family!', zh: '家庭成员与职业',
          words: [
            { w: 'parents', m: '父母', ipa: '/ˈpeərənts/' }, { w: 'uncle', m: '叔叔；舅舅', ipa: '/ˈʌŋkl/' },
            { w: 'aunt', m: '阿姨；姑姑', ipa: '/ɑːnt/' }, { w: 'cousin', m: '堂/表兄弟姐妹', ipa: '/ˈkʌzn/' },
            { w: 'doctor', m: '医生', ipa: '/ˈdɒktə/' }, { w: 'farmer', m: '农民', ipa: '/ˈfɑːmə/' },
            { w: 'nurse', m: '护士', ipa: '/nɜːs/' }, { w: 'driver', m: '司机', ipa: '/ˈdraɪvə/' },
            { w: 'job', m: '工作', ipa: '/dʒɒb/' }, { w: 'people', m: '人们', ipa: '/ˈpiːpl/' },
            { w: 'little', m: '小的', ipa: '/ˈlɪtl/' }, { w: 'football player', m: '足球运动员', ipa: '/ˈfʊtbɔːl ˈpleɪə/' }
          ],
          sents: [
            { en: 'How many people are there in your family?', zh: '你家有几口人？' },
            { en: 'There are three.', zh: '有三口人。' },
            { en: "What's your father's job?", zh: '你爸爸是做什么工作的？' },
            { en: "He's a doctor.", zh: '他是一名医生。' }
          ],
          grammar: 'How many + 复数名词 + are there? 问数量；What\'s + 某人的 + job? 问职业，答 He\'s/She\'s a + 职业。'
        }
      ]
    },

    /* ==================== 四年级下册（旧版 PEP） ==================== */
    {
      id: 'g4b', grade: 4, sem: 2, edition: 'old', name: '四年级下册', label: 'PEP 四下',
      units: [
        {
          id: 'g4b-u1', no: 1, title: 'My school', zh: '学校场所',
          words: [
            { w: 'playground', m: '操场', ipa: '/ˈpleɪɡraʊnd/' }, { w: 'garden', m: '花园', ipa: '/ˈɡɑːdn/' },
            { w: 'library', m: '图书馆', ipa: '/ˈlaɪbrəri/' }, { w: 'canteen', m: '食堂', ipa: '/kænˈtiːn/' },
            { w: 'office', m: '办公室', ipa: '/ˈɒfɪs/' }, { w: 'gym', m: '体育馆', ipa: '/dʒɪm/' },
            { w: 'art room', m: '美术教室', ipa: '/ɑːt ruːm/' }, { w: 'music room', m: '音乐教室', ipa: '/ˈmjuːzɪk ruːm/' },
            { w: 'floor', m: '楼层', ipa: '/flɔː/' }, { w: 'next to', m: '紧邻；在……旁边', ipa: '/nekst tuː/' },
            { w: 'homework', m: '家庭作业', ipa: '/ˈhəʊmwɜːk/' }, { w: 'forty', m: '四十', ipa: '/ˈfɔːti/' }
          ],
          sents: [
            { en: "Where's the library?", zh: '图书馆在哪里？' },
            { en: "It's on the first floor.", zh: '它在一楼。' },
            { en: "Is this the teachers' office?", zh: '这是教师办公室吗？' },
            { en: 'Do you have a library? Yes, we do.', zh: '你们有图书馆吗？是的，我们有。' }
          ],
          grammar: '表示楼层用 on the + 序数词 + floor（first 第一 / second 第二）；Do you have...? 答 Yes, we do. / No, we don\'t.'
        },
        {
          id: 'g4b-u2', no: 2, title: 'What time is it?', zh: '时间与作息',
          words: [
            { w: 'breakfast', m: '早餐', ipa: '/ˈbrekfəst/' }, { w: 'lunch', m: '午餐', ipa: '/lʌntʃ/' },
            { w: 'dinner', m: '晚餐', ipa: '/ˈdɪnə/' }, { w: "o'clock", m: '……点钟', ipa: '/əˈklɒk/' },
            { w: 'music class', m: '音乐课', ipa: '/ˈmjuːzɪk klɑːs/' }, { w: 'PE class', m: '体育课', ipa: '/ˌpiːˈiː klɑːs/' },
            { w: 'get up', m: '起床', ipa: '/ɡet ʌp/' }, { w: 'go to school', m: '去上学', ipa: '/ɡəʊ tuː skuːl/' },
            { w: 'go home', m: '回家', ipa: '/ɡəʊ həʊm/' }, { w: 'go to bed', m: '上床睡觉', ipa: '/ɡəʊ tuː bed/' },
            { w: 'now', m: '现在', ipa: '/naʊ/' }, { w: 'hurry', m: '匆忙', ipa: '/ˈhʌri/' }
          ],
          sents: [
            { en: 'What time is it?', zh: '几点了？' },
            { en: "It's six o'clock.", zh: '六点了。' },
            { en: "It's time for dinner.", zh: '该吃晚饭了。' },
            { en: "It's time to get up.", zh: '该起床了。' }
          ],
          grammar: 'What time is it? 问时间，答 It\'s + 数字 + o\'clock；It\'s time for + 名词 / It\'s time to + 动词原形。'
        },
        {
          id: 'g4b-u3', no: 3, title: 'Weather', zh: '天气',
          words: [
            { w: 'cold', m: '寒冷的', ipa: '/kəʊld/' }, { w: 'cool', m: '凉爽的', ipa: '/kuːl/' },
            { w: 'warm', m: '温暖的', ipa: '/wɔːm/' }, { w: 'hot', m: '炎热的', ipa: '/hɒt/' },
            { w: 'sunny', m: '晴朗的', ipa: '/ˈsʌni/' }, { w: 'windy', m: '有风的', ipa: '/ˈwɪndi/' },
            { w: 'cloudy', m: '多云的', ipa: '/ˈklaʊdi/' }, { w: 'snowy', m: '下雪的', ipa: '/ˈsnəʊi/' },
            { w: 'rainy', m: '下雨的', ipa: '/ˈreɪni/' }, { w: 'weather', m: '天气', ipa: '/ˈweðə/' },
            { w: 'degree', m: '度；度数', ipa: '/dɪˈɡriː/' }, { w: 'outside', m: '在外面', ipa: '/ˌaʊtˈsaɪd/' }
          ],
          sents: [
            { en: "What's the weather like in Beijing?", zh: '北京的天气怎么样？' },
            { en: "It's rainy.", zh: '有雨。' },
            { en: 'Is it cold? Yes, it is.', zh: '冷吗？是的，冷。' },
            { en: 'Can I go outside now?', zh: '我现在能出去吗？' }
          ],
          grammar: 'What\'s the weather like in + 地点？ 问天气；名词加 y 变形容词：sun→sunny, wind→windy, cloud→cloudy, rain→rainy, snow→snowy。'
        },
        {
          id: 'g4b-u4', no: 4, title: 'At the farm', zh: '农场与蔬菜',
          words: [
            { w: 'tomato', m: '西红柿', ipa: '/təˈmɑːtəʊ/' }, { w: 'potato', m: '土豆', ipa: '/pəˈteɪtəʊ/' },
            { w: 'green beans', m: '青豆', ipa: '/ɡriːn biːnz/' }, { w: 'carrot', m: '胡萝卜', ipa: '/ˈkærət/' },
            { w: 'horse', m: '马', ipa: '/hɔːs/' }, { w: 'cow', m: '奶牛', ipa: '/kaʊ/' },
            { w: 'sheep', m: '绵羊', ipa: '/ʃiːp/' }, { w: 'hen', m: '母鸡', ipa: '/hen/' },
            { w: 'goat', m: '山羊', ipa: '/ɡəʊt/' }, { w: 'farm', m: '农场', ipa: '/fɑːm/' },
            { w: 'these', m: '这些', ipa: '/ðiːz/' }, { w: 'those', m: '那些', ipa: '/ðəʊz/' }
          ],
          sents: [
            { en: 'What are these?', zh: '这些是什么？' },
            { en: "They're tomatoes.", zh: '它们是西红柿。' },
            { en: 'Are those sheep? Yes, they are.', zh: '那些是绵羊吗？是的。' },
            { en: 'How many horses do you have?', zh: '你有多少匹马？' }
          ],
          grammar: 'these（这些，近）/ those（那些，远）+ 复数名词；答语用 They\'re...；sheep 单复数同形，tomato/potato 复数加 es。'
        },
        {
          id: 'g4b-u5', no: 5, title: 'My clothes', zh: '衣物与所属',
          words: [
            { w: 'clothes', m: '衣服', ipa: '/kləʊðz/' }, { w: 'pants', m: '裤子', ipa: '/pænts/' },
            { w: 'dress', m: '连衣裙', ipa: '/dres/' }, { w: 'skirt', m: '短裙', ipa: '/skɜːt/' },
            { w: 'coat', m: '外套', ipa: '/kəʊt/' }, { w: 'sweater', m: '毛衣', ipa: '/ˈswetə/' },
            { w: 'sock', m: '袜子', ipa: '/sɒk/' }, { w: 'shorts', m: '短裤', ipa: '/ʃɔːts/' },
            { w: 'jacket', m: '夹克', ipa: '/ˈdʒækɪt/' }, { w: 'shirt', m: '衬衫', ipa: '/ʃɜːt/' },
            { w: 'whose', m: '谁的', ipa: '/huːz/' }, { w: 'mine', m: '我的', ipa: '/maɪn/' }
          ],
          sents: [
            { en: 'Whose coat is this?', zh: '这是谁的外套？' },
            { en: "It's mine.", zh: '它是我的。' },
            { en: 'Whose pants are those?', zh: '那是谁的裤子？' },
            { en: "They're your father's.", zh: '它们是你爸爸的。' }
          ],
          grammar: 'Whose + 名词 + is this/are those? 问所属；名词性物主代词 mine/yours/his/hers 后面不接名词，形容词性 my/your/his/her 后面要接名词。'
        },
        {
          id: 'g4b-u6', no: 6, title: 'Shopping', zh: '购物与价格',
          words: [
            { w: 'glove', m: '手套', ipa: '/ɡlʌv/' }, { w: 'scarf', m: '围巾', ipa: '/skɑːf/' },
            { w: 'umbrella', m: '雨伞', ipa: '/ʌmˈbrelə/' }, { w: 'sunglasses', m: '太阳镜', ipa: '/ˈsʌnɡlɑːsɪz/' },
            { w: 'pretty', m: '漂亮的', ipa: '/ˈprɪti/' }, { w: 'expensive', m: '昂贵的', ipa: '/ɪkˈspensɪv/' },
            { w: 'cheap', m: '便宜的', ipa: '/tʃiːp/' }, { w: 'size', m: '尺码', ipa: '/saɪz/' },
            { w: 'eighty', m: '八十', ipa: '/ˈeɪti/' }, { w: 'dollar', m: '美元', ipa: '/ˈdɒlə/' },
            { w: 'sale', m: '特价；促销', ipa: '/seɪl/' }, { w: 'try on', m: '试穿', ipa: '/traɪ ɒn/' }
          ],
          sents: [
            { en: 'Can I help you?', zh: '需要帮忙吗？' },
            { en: 'How much is this skirt?', zh: '这条短裙多少钱？' },
            { en: "It's eighty yuan.", zh: '八十元。' },
            { en: 'Can I try it on?', zh: '我可以试穿吗？' }
          ],
          grammar: 'How much is + 单数名词？ 问价格，答 It\'s + 数字 + yuan/dollar；expensive 与 cheap 是一对反义词。'
        }
      ]
    }
    ,

    /* ==================== 五年级上册（旧版 PEP） ==================== */
    {
      id: 'g5a', grade: 5, sem: 1, edition: 'old', name: '五年级上册', label: 'PEP 五上',
      units: [
        {
          id: 'g5a-u1', no: 1, title: "What's he like?", zh: '描述人的性格外貌',
          words: [
            { w: 'old', m: '年老的', ipa: '/əʊld/' }, { w: 'young', m: '年轻的', ipa: '/jʌŋ/' },
            { w: 'funny', m: '风趣的', ipa: '/ˈfʌni/' }, { w: 'kind', m: '和蔼的', ipa: '/kaɪnd/' },
            { w: 'strict', m: '严格的', ipa: '/strɪkt/' }, { w: 'polite', m: '有礼貌的', ipa: '/pəˈlaɪt/' },
            { w: 'hard-working', m: '工作努力的', ipa: '/ˌhɑːdˈwɜːkɪŋ/' }, { w: 'helpful', m: '有帮助的', ipa: '/ˈhelpfl/' },
            { w: 'clever', m: '聪明的', ipa: '/ˈklevə/' }, { w: 'shy', m: '害羞的', ipa: '/ʃaɪ/' },
            { w: 'university', m: '大学', ipa: '/ˌjuːnɪˈvɜːsəti/' }, { w: 'know', m: '知道；认识', ipa: '/nəʊ/' }
          ],
          sents: [
            { en: "What's he like?", zh: '他是个什么样的人？' },
            { en: "He's tall and strong.", zh: '他又高又壮。' },
            { en: 'Is he strict? Yes, he is.', zh: '他严格吗？是的，他严格。' },
            { en: "Who's your English teacher? Mr Carter.", zh: '谁是你的英语老师？卡特先生。' }
          ],
          grammar: 'What\'s + 某人 + like? 问性格或外貌；答语用 be + 形容词。'
        },
        {
          id: 'g5a-u2', no: 2, title: 'My week', zh: '星期与日常活动',
          words: [
            { w: 'Monday', m: '星期一', ipa: '/ˈmʌndeɪ/' }, { w: 'Tuesday', m: '星期二', ipa: '/ˈtjuːzdeɪ/' },
            { w: 'Wednesday', m: '星期三', ipa: '/ˈwenzdeɪ/' }, { w: 'Thursday', m: '星期四', ipa: '/ˈθɜːzdeɪ/' },
            { w: 'Friday', m: '星期五', ipa: '/ˈfraɪdeɪ/' }, { w: 'Saturday', m: '星期六', ipa: '/ˈsætədeɪ/' },
            { w: 'Sunday', m: '星期日', ipa: '/ˈsʌndeɪ/' }, { w: 'weekend', m: '周末', ipa: '/ˌwiːkˈend/' },
            { w: 'often', m: '经常', ipa: '/ˈɒfn/' }, { w: 'sometimes', m: '有时', ipa: '/ˈsʌmtaɪmz/' },
            { w: 'usually', m: '通常', ipa: '/ˈjuːʒuəli/' }, { w: 'wash', m: '洗', ipa: '/wɒʃ/' }
          ],
          sents: [
            { en: 'What do you do on Sundays?', zh: '你星期天做什么？' },
            { en: 'I often watch TV.', zh: '我经常看电视。' },
            { en: 'What day is it today?', zh: '今天星期几？' },
            { en: "It's Monday.", zh: '今天星期一。' }
          ],
          grammar: '星期前用介词 on（on Sundays）；频度副词 usually > often > sometimes 放行为动词前、be 动词后。'
        },
        {
          id: 'g5a-u3', no: 3, title: 'What would you like?', zh: '食物偏好',
          words: [
            { w: 'sandwich', m: '三明治', ipa: '/ˈsænwɪdʒ/' }, { w: 'salad', m: '沙拉', ipa: '/ˈsæləd/' },
            { w: 'ice cream', m: '冰淇淋', ipa: '/aɪs kriːm/' }, { w: 'tea', m: '茶', ipa: '/tiː/' },
            { w: 'fresh', m: '新鲜的', ipa: '/freʃ/' }, { w: 'healthy', m: '健康的', ipa: '/ˈhelθi/' },
            { w: 'delicious', m: '美味的', ipa: '/dɪˈlɪʃəs/' }, { w: 'hot', m: '辣的；热的', ipa: '/hɒt/' },
            { w: 'sweet', m: '甜的', ipa: '/swiːt/' }, { w: 'thirsty', m: '渴的', ipa: '/ˈθɜːsti/' },
            { w: 'favourite', m: '最喜爱的', ipa: '/ˈfeɪvərɪt/' }, { w: 'drink', m: '喝；饮料', ipa: '/drɪŋk/' }
          ],
          sents: [
            { en: 'What would you like to eat?', zh: '你想吃什么？' },
            { en: "I'd like a sandwich.", zh: '我想要一个三明治。' },
            { en: "What's your favourite food?", zh: '你最喜爱的食物是什么？' },
            { en: "Noodles. They're delicious.", zh: '面条。它们很美味。' }
          ],
          grammar: 'What would you like to eat/drink? 问想吃什么/喝什么；favourite 前用物主代词 my/your/his。'
        },
        {
          id: 'g5a-u4', no: 4, title: 'What can you do?', zh: '能力表达',
          words: [
            { w: 'sing', m: '唱歌', ipa: '/sɪŋ/' }, { w: 'dance', m: '跳舞', ipa: '/dɑːns/' },
            { w: 'draw', m: '画画', ipa: '/drɔː/' }, { w: 'cook', m: '烹饪', ipa: '/kʊk/' },
            { w: 'swim', m: '游泳', ipa: '/swɪm/' }, { w: 'speak', m: '说；讲', ipa: '/spiːk/' },
            { w: 'party', m: '聚会', ipa: '/ˈpɑːti/' }, { w: 'wonderful', m: '精彩的', ipa: '/ˈwʌndəfl/' },
            { w: 'also', m: '也', ipa: '/ˈɔːlsəʊ/' }, { w: 'next', m: '下一个的', ipa: '/nekst/' },
            { w: 'kung fu', m: '功夫', ipa: '/ˌkʌŋˈfuː/' }, { w: 'pipa', m: '琵琶', ipa: '/ˈpiːpə/' }
          ],
          sents: [
            { en: 'What can you do for the party?', zh: '你能为聚会做什么？' },
            { en: 'I can sing English songs.', zh: '我会唱英文歌。' },
            { en: 'Can you do any kung fu? Yes, I can.', zh: '你会功夫吗？是的，我会。' },
            { en: "I can't play the pipa.", zh: '我不会弹琵琶。' }
          ],
          grammar: '情态动词 can + 动词原形，否定 can\'t，疑问句把 can 提前；乐器前加 the，球类不加 the。'
        },
        {
          id: 'g5a-u5', no: 5, title: 'There is a big bed', zh: '家具与方位',
          words: [
            { w: 'clock', m: '时钟', ipa: '/klɒk/' }, { w: 'plant', m: '植物', ipa: '/plɑːnt/' },
            { w: 'bottle', m: '瓶子', ipa: '/ˈbɒtl/' }, { w: 'bike', m: '自行车', ipa: '/baɪk/' },
            { w: 'photo', m: '照片', ipa: '/ˈfəʊtəʊ/' }, { w: 'front', m: '前面', ipa: '/frʌnt/' },
            { w: 'between', m: '在……之间', ipa: '/bɪˈtwiːn/' }, { w: 'above', m: '在……上方', ipa: '/əˈbʌv/' },
            { w: 'beside', m: '在……旁边', ipa: '/bɪˈsaɪd/' }, { w: 'behind', m: '在……后面', ipa: '/bɪˈhaɪnd/' },
            { w: 'their', m: '他们的', ipa: '/ðeə/' }, { w: 'curtain', m: '窗帘', ipa: '/ˈkɜːtn/' }
          ],
          sents: [
            { en: 'There is a big bed.', zh: '有一张大床。' },
            { en: 'There are two end tables.', zh: '有两个床头柜。' },
            { en: "Where is the ball? It's under the table.", zh: '球在哪里？它在桌子下面。' },
            { en: 'The clock is on the wall.', zh: '钟在墙上。' }
          ],
          grammar: 'There is + 单数名词 / There are + 复数名词，表示"某处有某物"；their（他们的）与 there（那里）同音不同义。'
        },
        {
          id: 'g5a-u6', no: 6, title: 'In a nature park', zh: '自然公园景物',
          words: [
            { w: 'sky', m: '天空', ipa: '/skaɪ/' }, { w: 'cloud', m: '云', ipa: '/klaʊd/' },
            { w: 'mountain', m: '山', ipa: '/ˈmaʊntən/' }, { w: 'river', m: '河流', ipa: '/ˈrɪvə/' },
            { w: 'flower', m: '花', ipa: '/ˈflaʊə/' }, { w: 'grass', m: '草', ipa: '/ɡrɑːs/' },
            { w: 'lake', m: '湖', ipa: '/leɪk/' }, { w: 'forest', m: '森林', ipa: '/ˈfɒrɪst/' },
            { w: 'village', m: '村庄', ipa: '/ˈvɪlɪdʒ/' }, { w: 'city', m: '城市', ipa: '/ˈsɪti/' },
            { w: 'bridge', m: '桥', ipa: '/brɪdʒ/' }, { w: 'building', m: '建筑物', ipa: '/ˈbɪldɪŋ/' }
          ],
          sents: [
            { en: 'Is there a river in the park?', zh: '公园里有一条河吗？' },
            { en: 'Yes, there is.', zh: '是的，有。' },
            { en: 'Are there any tall buildings in the village?', zh: '村里有高楼吗？' },
            { en: "No, there aren't.", zh: '不，没有。' }
          ],
          grammar: 'There be 的疑问句把 is/are 提前；疑问句和否定句中常用 any 代替 some。'
        }
      ]
    },

    /* ==================== 五年级下册（旧版 PEP） ==================== */
    {
      id: 'g5b', grade: 5, sem: 2, edition: 'old', name: '五年级下册', label: 'PEP 五下',
      units: [
        {
          id: 'g5b-u1', no: 1, title: 'My day', zh: '作息与时间',
          words: [
            { w: 'exercise', m: '锻炼', ipa: '/ˈeksəsaɪz/' }, { w: 'evening', m: '傍晚；晚上', ipa: '/ˈiːvnɪŋ/' },
            { w: 'noon', m: '中午', ipa: '/nuːn/' }, { w: 'weekend', m: '周末', ipa: '/ˌwiːkˈend/' },
            { w: 'when', m: '什么时候', ipa: '/wen/' }, { w: 'usually', m: '通常', ipa: '/ˈjuːʒuəli/' },
            { w: 'breakfast', m: '早餐', ipa: '/ˈbrekfəst/' }, { w: 'class', m: '课；班级', ipa: '/klɑːs/' },
            { w: 'sports', m: '运动', ipa: '/spɔːts/' }, { w: 'often', m: '经常', ipa: '/ˈɒfn/' },
            { w: 'start', m: '开始', ipa: '/stɑːt/' }, { w: 'late', m: '迟的；晚的', ipa: '/leɪt/' }
          ],
          sents: [
            { en: 'When do you get up?', zh: '你什么时候起床？' },
            { en: 'I usually get up at six.', zh: '我通常六点起床。' },
            { en: 'What do you do on the weekend?', zh: '你周末做什么？' },
            { en: 'I often watch TV and play sports.', zh: '我经常看电视和做运动。' }
          ],
          grammar: '具体时刻前用 at（at six），上午下午晚上用 in（in the evening），具体某天用 on（on the weekend）。'
        },
        {
          id: 'g5b-u2', no: 2, title: 'My favourite season', zh: '季节',
          words: [
            { w: 'spring', m: '春天', ipa: '/sprɪŋ/' }, { w: 'summer', m: '夏天', ipa: '/ˈsʌmə/' },
            { w: 'autumn', m: '秋天', ipa: '/ˈɔːtəm/' }, { w: 'winter', m: '冬天', ipa: '/ˈwɪntə/' },
            { w: 'season', m: '季节', ipa: '/ˈsiːzn/' }, { w: 'best', m: '最；最好地', ipa: '/best/' },
            { w: 'which', m: '哪一个', ipa: '/wɪtʃ/' }, { w: 'why', m: '为什么', ipa: '/waɪ/' },
            { w: 'because', m: '因为', ipa: '/bɪˈkɒz/' }, { w: 'vacation', m: '假期', ipa: '/vəˈkeɪʃn/' },
            { w: 'snow', m: '雪；下雪', ipa: '/snəʊ/' }, { w: 'leaf', m: '叶子', ipa: '/liːf/' }
          ],
          sents: [
            { en: 'Which season do you like best?', zh: '你最喜欢哪个季节？' },
            { en: 'I like winter best.', zh: '我最喜欢冬天。' },
            { en: 'Why do you like summer?', zh: '你为什么喜欢夏天？' },
            { en: 'Because I can swim in the sea.', zh: '因为我可以在海里游泳。' }
          ],
          grammar: 'Which ... do you like best? 问最喜欢；Why 提问用 Because 回答；季节前用介词 in（in spring）。'
        },
        {
          id: 'g5b-u3', no: 3, title: 'My school calendar', zh: '月份与节日',
          words: [
            { w: 'January', m: '一月', ipa: '/ˈdʒænjuəri/' }, { w: 'February', m: '二月', ipa: '/ˈfebruəri/' },
            { w: 'March', m: '三月', ipa: '/mɑːtʃ/' }, { w: 'April', m: '四月', ipa: '/ˈeɪprəl/' },
            { w: 'May', m: '五月', ipa: '/meɪ/' }, { w: 'June', m: '六月', ipa: '/dʒuːn/' },
            { w: 'July', m: '七月', ipa: '/dʒuˈlaɪ/' }, { w: 'August', m: '八月', ipa: '/ˈɔːɡəst/' },
            { w: 'September', m: '九月', ipa: '/sepˈtembə/' }, { w: 'October', m: '十月', ipa: '/ɒkˈtəʊbə/' },
            { w: 'November', m: '十一月', ipa: '/nəʊˈvembə/' }, { w: 'December', m: '十二月', ipa: '/dɪˈsembə/' }
          ],
          sents: [
            { en: 'When is the party?', zh: '聚会在什么时候？' },
            { en: "It's in April.", zh: '在四月。' },
            { en: 'My birthday is in May.', zh: '我的生日在五月。' },
            { en: "What will you do for your mum on Mother's Day?", zh: '母亲节你会为妈妈做什么？' }
          ],
          grammar: '月份前用介词 in（in April）；on + 具体节日或日期（on Mother\'s Day）；月份名首字母必须大写。'
        },
        {
          id: 'g5b-u4', no: 4, title: 'When is Easter?', zh: '日期与序数词',
          words: [
            { w: 'Easter', m: '复活节', ipa: '/ˈiːstə/' }, { w: 'date', m: '日期', ipa: '/deɪt/' },
            { w: 'special', m: '特别的', ipa: '/ˈspeʃl/' }, { w: 'holiday', m: '假日', ipa: '/ˈhɒlədeɪ/' },
            { w: 'trip', m: '旅行', ipa: '/trɪp/' }, { w: 'contest', m: '比赛', ipa: '/ˈkɒntest/' },
            { w: 'meet', m: '集会；运动会', ipa: '/miːt/' }, { w: 'test', m: '测验', ipa: '/test/' },
            { w: 'fifth', m: '第五', ipa: '/fɪfθ/' }, { w: 'twelfth', m: '第十二', ipa: '/twelfθ/' },
            { w: 'twentieth', m: '第二十', ipa: '/ˈtwentiəθ/' }, { w: 'together', m: '一起', ipa: '/təˈɡeðə/' }
          ],
          sents: [
            { en: 'When is Easter?', zh: '复活节是什么时候？' },
            { en: "It's on April 5th.", zh: '在四月五日。' },
            { en: 'We will have an Easter party.', zh: '我们将举办复活节聚会。' },
            { en: 'There are some special days in June.', zh: '六月有一些特别的日子。' }
          ],
          grammar: '序数词：one→first, two→second, three→third, five→fifth, twelve→twelfth, twenty→twentieth；具体日期用 on + 月份 + 序数词。'
        },
        {
          id: 'g5b-u5', no: 5, title: 'Whose dog is it?', zh: '名词性物主代词',
          words: [
            { w: 'mine', m: '我的', ipa: '/maɪn/' }, { w: 'yours', m: '你的；你们的', ipa: '/jɔːz/' },
            { w: 'hers', m: '她的', ipa: '/hɜːz/' }, { w: 'ours', m: '我们的', ipa: '/ˈaʊəz/' },
            { w: 'theirs', m: '他们的', ipa: '/ðeəz/' }, { w: 'playing', m: '正在玩', ipa: '/ˈpleɪɪŋ/' },
            { w: 'jumping', m: '正在跳', ipa: '/ˈdʒʌmpɪŋ/' }, { w: 'eating', m: '正在吃', ipa: '/ˈiːtɪŋ/' },
            { w: 'drinking', m: '正在喝', ipa: '/ˈdrɪŋkɪŋ/' }, { w: 'sleeping', m: '正在睡觉', ipa: '/ˈsliːpɪŋ/' },
            { w: 'running', m: '正在跑', ipa: '/ˈrʌnɪŋ/' }, { w: 'climbing', m: '正在爬', ipa: '/ˈklaɪmɪŋ/' }
          ],
          sents: [
            { en: 'Whose dog is it?', zh: '这是谁的狗？' },
            { en: "It's mine.", zh: '它是我的。' },
            { en: "Whose picture is this? It's Zhang Peng's.", zh: '这是谁的画？是张鹏的。' },
            { en: 'The dog is playing.', zh: '这只狗正在玩。' }
          ],
          grammar: '名词性物主代词 mine/yours/his/hers/ours/theirs 后面不接名词；现在进行时 be + 动词-ing。'
        },
        {
          id: 'g5b-u6', no: 6, title: 'Work quietly!', zh: '公共规则与进行时',
          words: [
            { w: 'quietly', m: '安静地', ipa: '/ˈkwaɪətli/' }, { w: 'turn', m: '轮流；顺序', ipa: '/tɜːn/' },
            { w: 'keep', m: '保持', ipa: '/kiːp/' }, { w: 'clean', m: '干净的', ipa: '/kliːn/' },
            { w: 'right', m: '右边', ipa: '/raɪt/' }, { w: 'lunch', m: '午餐', ipa: '/lʌntʃ/' },
            { w: 'music', m: '音乐', ipa: '/ˈmjuːzɪk/' }, { w: 'listen', m: '听', ipa: '/ˈlɪsn/' },
            { w: 'reading', m: '正在读', ipa: '/ˈriːdɪŋ/' }, { w: 'having', m: '正在上（课）', ipa: '/ˈhævɪŋ/' },
            { w: 'exercises', m: '操；练习', ipa: '/ˈeksəsaɪzɪz/' }, { w: 'anything', m: '任何东西', ipa: '/ˈeniθɪŋ/' }
          ],
          sents: [
            { en: 'What are they doing?', zh: '他们正在做什么？' },
            { en: "They're eating lunch.", zh: '他们正在吃午饭。' },
            { en: 'Talk quietly, please.', zh: '请小声说话。' },
            { en: 'Keep your desk clean.', zh: '保持你的桌面干净。' }
          ],
          grammar: '祈使句用动词原形开头（Keep... / Talk...）；副词 quietly 修饰动词，形容词 quiet 修饰名词。'
        }
      ]
    }
    ,

    /* ==================== 六年级上册（2024 修订版 PEP · 孩子 2026 秋在用） ==================== */
    {
      id: 'g6a', grade: 6, sem: 1, edition: 'new', name: '六年级上册（2024 新版）', label: 'PEP 六上 · 新版',
      tip: '本册为 2024 修订版，单元主题与旧版完全不同，勿与旧版六上混用。',
      units: [
        {
          id: 'g6a-u1', no: 1, title: 'Amazing places', zh: '神奇的地方（旅行与地标）',
          words: [
            { w: 'landmark', m: '地标', ipa: '/ˈlændmɑːk/' }, { w: 'museum', m: '博物馆', ipa: '/mjuˈziːəm/' },
            { w: 'village', m: '村庄', ipa: '/ˈvɪlɪdʒ/' }, { w: 'island', m: '岛屿', ipa: '/ˈaɪlənd/' },
            { w: 'amazing', m: '令人惊叹的', ipa: '/əˈmeɪzɪŋ/' }, { w: 'special', m: '特别的', ipa: '/ˈspeʃl/' },
            { w: 'travel', m: '旅行', ipa: '/ˈtrævl/' }, { w: 'famous', m: '著名的', ipa: '/ˈfeɪməs/' },
            { w: 'went', m: '去（go 的过去式）', ipa: '/went/' }, { w: 'saw', m: '看见（see 的过去式）', ipa: '/sɔː/' },
            { w: 'took', m: '拍（照）；拿（take 的过去式）', ipa: '/tʊk/' }, { w: 'holiday', m: '假期', ipa: '/ˈhɒlədeɪ/' }
          ],
          sents: [
            { en: 'Where did you go on your holiday?', zh: '你假期去哪儿了？' },
            { en: "I went to Xi'an.", zh: '我去了西安。' },
            { en: 'What did you do there?', zh: '你在那儿做了什么？' },
            { en: 'I saw the Terracotta Army and took many pictures.', zh: '我看了兵马俑，拍了很多照片。' }
          ],
          grammar: '一般过去时：规则动词加 -ed，不规则要单独记——go→went, see→saw, take→took, eat→ate, ride→rode。疑问句用 did，后面的动词要还原成原形。'
        },
        {
          id: 'g6a-u2', no: 2, title: 'Getting together', zh: '欢聚一堂（节日与聚会）',
          words: [
            { w: 'festival', m: '节日', ipa: '/ˈfestɪvl/' }, { w: 'together', m: '一起', ipa: '/təˈɡeðə/' },
            { w: 'reunion', m: '团聚', ipa: '/ˌriːˈjuːniən/' }, { w: 'celebrate', m: '庆祝', ipa: '/ˈselɪbreɪt/' },
            { w: 'invite', m: '邀请', ipa: '/ɪnˈvaɪt/' }, { w: 'relative', m: '亲戚', ipa: '/ˈrelətɪv/' },
            { w: 'lantern', m: '灯笼', ipa: '/ˈlæntən/' }, { w: 'dumpling', m: '饺子', ipa: '/ˈdʌmplɪŋ/' },
            { w: 'mooncake', m: '月饼', ipa: '/ˈmuːnkeɪk/' }, { w: 'guest', m: '客人', ipa: '/ɡest/' },
            { w: 'will', m: '将要', ipa: '/wɪl/' }, { w: 'dinner', m: '晚餐；正餐', ipa: '/ˈdɪnə/' }
          ],
          sents: [
            { en: 'What will you do at the festival?', zh: '节日里你会做什么？' },
            { en: 'I will have a big dinner with my family.', zh: '我会和家人吃一顿丰盛的晚餐。' },
            { en: 'Will you come to my party? Yes, I will.', zh: '你会来我的聚会吗？是的，我会去。' },
            { en: 'We are going to celebrate the Spring Festival together.', zh: '我们打算一起庆祝春节。' }
          ],
          grammar: '一般将来时：will + 动词原形（临时决定）；be going to + 动词原形（已有计划）。一般疑问句把 will / be 提前。'
        },
        {
          id: 'g6a-u3', no: 3, title: 'Healthy life', zh: '健康生活（情态动词）',
          words: [
            { w: 'healthy', m: '健康的', ipa: '/ˈhelθi/' }, { w: 'lifestyle', m: '生活方式', ipa: '/ˈlaɪfstaɪl/' },
            { w: 'habit', m: '习惯', ipa: '/ˈhæbɪt/' }, { w: 'exercise', m: '锻炼', ipa: '/ˈeksəsaɪz/' },
            { w: 'fever', m: '发烧', ipa: '/ˈfiːvə/' }, { w: 'headache', m: '头痛', ipa: '/ˈhedeɪk/' },
            { w: 'toothache', m: '牙痛', ipa: '/ˈtuːθeɪk/' }, { w: 'enough', m: '足够的', ipa: '/ɪˈnʌf/' },
            { w: 'sugar', m: '糖', ipa: '/ˈʃʊɡə/' }, { w: 'sleep', m: '睡觉', ipa: '/sliːp/' },
            { w: 'should', m: '应该', ipa: '/ʃʊd/' }, { w: 'ill', m: '生病的', ipa: '/ɪl/' }
          ],
          sents: [
            { en: "What's the matter? I have a fever.", zh: '怎么了？我发烧了。' },
            { en: 'You should drink more water.', zh: '你应该多喝水。' },
            { en: "You shouldn't eat too much sugar.", zh: '你不应该吃太多糖。' },
            { en: 'We should exercise every day.', zh: '我们应该每天锻炼。' }
          ],
          grammar: 'should / shouldn\'t + 动词原形，用来提建议；看病的问法 What\'s the matter? 或 What\'s wrong?'
        },
        {
          id: 'g6a-u4', no: 4, title: 'Managing money well', zh: '合理理财（be going to）',
          words: [
            { w: 'money', m: '钱', ipa: '/ˈmʌni/' }, { w: 'save', m: '储蓄；节省', ipa: '/seɪv/' },
            { w: 'spend', m: '花费', ipa: '/spend/' }, { w: 'share', m: '分享', ipa: '/ʃeə/' },
            { w: 'budget', m: '预算', ipa: '/ˈbʌdʒɪt/' }, { w: 'plan', m: '计划', ipa: '/plæn/' },
            { w: 'price', m: '价格', ipa: '/praɪs/' }, { w: 'buy', m: '买', ipa: '/baɪ/' },
            { w: 'bank', m: '银行', ipa: '/bæŋk/' }, { w: 'expensive', m: '昂贵的', ipa: '/ɪkˈspensɪv/' },
            { w: 'pocket money', m: '零花钱', ipa: '/ˈpɒkɪt ˈmʌni/' }, { w: 'important', m: '重要的', ipa: '/ɪmˈpɔːtnt/' }
          ],
          sents: [
            { en: 'How do you spend your pocket money?', zh: '你怎么花你的零花钱？' },
            { en: 'I am going to save some money.', zh: '我打算存一些钱。' },
            { en: 'What are you going to buy?', zh: '你打算买什么？' },
            { en: "I'm going to buy a storybook.", zh: '我打算买一本故事书。' }
          ],
          grammar: 'be going to + 动词原形表示打算、计划；be 动词要随主语变成 am / is / are。'
        },
        {
          id: 'g6a-u5', no: 5, title: 'Exploring space', zh: '探索太空（there be 与客观真理）',
          words: [
            { w: 'space', m: '太空', ipa: '/speɪs/' }, { w: 'planet', m: '行星', ipa: '/ˈplænɪt/' },
            { w: 'earth', m: '地球', ipa: '/ɜːθ/' }, { w: 'moon', m: '月球', ipa: '/muːn/' },
            { w: 'star', m: '恒星；星星', ipa: '/stɑː/' }, { w: 'Mars', m: '火星', ipa: '/mɑːz/' },
            { w: 'astronaut', m: '宇航员', ipa: '/ˈæstrənɔːt/' }, { w: 'spaceship', m: '宇宙飞船', ipa: '/ˈspeɪsʃɪp/' },
            { w: 'universe', m: '宇宙', ipa: '/ˈjuːnɪvɜːs/' }, { w: 'rocket', m: '火箭', ipa: '/ˈrɒkɪt/' },
            { w: 'discover', m: '发现', ipa: '/dɪˈskʌvə/' }, { w: 'around', m: '围绕；大约', ipa: '/əˈraʊnd/' }
          ],
          sents: [
            { en: 'There are eight planets in the solar system.', zh: '太阳系有八颗行星。' },
            { en: 'The moon goes around the earth.', zh: '月球绕着地球转。' },
            { en: 'Yang Liwei went into space in 2003.', zh: '杨利伟在 2003 年进入了太空。' },
            { en: 'I want to be an astronaut.', zh: '我想成为一名宇航员。' }
          ],
          grammar: '客观真理、自然规律用一般现在时（不受过去时间影响）；There are + 复数名词 表示"有"。'
        },
        {
          id: 'g6a-u6', no: 6, title: 'Energy, nature and us', zh: '能源、自然与人类（祈使句）',
          words: [
            { w: 'energy', m: '能源', ipa: '/ˈenədʒi/' }, { w: 'nature', m: '自然', ipa: '/ˈneɪtʃə/' },
            { w: 'electricity', m: '电', ipa: '/ˌɪlekˈtrɪsəti/' }, { w: 'rubbish', m: '垃圾', ipa: '/ˈrʌbɪʃ/' },
            { w: 'recycle', m: '回收利用', ipa: '/ˌriːˈsaɪkl/' }, { w: 'pollution', m: '污染', ipa: '/pəˈluːʃn/' },
            { w: 'protect', m: '保护', ipa: '/prəˈtekt/' }, { w: 'environment', m: '环境', ipa: '/ɪnˈvaɪrənmənt/' },
            { w: 'waste', m: '浪费', ipa: '/weɪst/' }, { w: 'turn off', m: '关掉', ipa: '/tɜːn ɒf/' },
            { w: 'clean', m: '干净的', ipa: '/kliːn/' }, { w: 'plant', m: '种植；植物', ipa: '/plɑːnt/' }
          ],
          sents: [
            { en: 'Save water, please.', zh: '请节约用水。' },
            { en: "Don't waste electricity.", zh: '不要浪费电。' },
            { en: 'Turn off the lights when you leave.', zh: '离开时把灯关掉。' },
            { en: 'Let us plant more trees.', zh: '让我们种更多的树。' }
          ],
          grammar: '祈使句：肯定用动词原形开头；否定用 Don\'t + 动词原形；Let\'s + 动词原形表示提议。'
        }
      ]
    },

    /* ==================== 六年级下册（2024 修订版 PEP） ==================== */
    {
      id: 'g6b', grade: 6, sem: 2, edition: 'new', name: '六年级下册（2024 新版）', label: 'PEP 六下 · 新版',
      tip: '新版六下为 4 个单元 + Recycle，比旧版少 2 个单元。',
      units: [
        {
          id: 'g6b-u1', no: 1, title: 'How tall are you?', zh: '身高与比较（比较级）',
          words: [
            { w: 'taller', m: '更高的', ipa: '/ˈtɔːlə/' }, { w: 'shorter', m: '更矮的；更短的', ipa: '/ˈʃɔːtə/' },
            { w: 'older', m: '更年长的', ipa: '/ˈəʊldə/' }, { w: 'younger', m: '更年轻的', ipa: '/ˈjʌŋɡə/' },
            { w: 'stronger', m: '更强壮的', ipa: '/ˈstrɒŋɡə/' }, { w: 'heavier', m: '更重的', ipa: '/ˈheviə/' },
            { w: 'thinner', m: '更瘦的', ipa: '/ˈθɪnə/' }, { w: 'bigger', m: '更大的', ipa: '/ˈbɪɡə/' },
            { w: 'smaller', m: '更小的', ipa: '/ˈsmɔːlə/' }, { w: 'than', m: '比', ipa: '/ðæn/' },
            { w: 'centimetre', m: '厘米', ipa: '/ˈsentɪmiːtə/' }, { w: 'kilogram', m: '千克', ipa: '/ˈkɪləɡræm/' }
          ],
          sents: [
            { en: 'How tall are you?', zh: '你有多高？' },
            { en: "I'm 164 centimetres tall.", zh: '我身高 164 厘米。' },
            { en: "I'm taller than you.", zh: '我比你高。' },
            { en: 'You are 5 centimetres taller than me.', zh: '你比我高 5 厘米。' }
          ],
          grammar: '比较级：单音节形容词一般加 -er（tall→taller）；辅音+元音+辅音结尾要双写末尾字母（big→bigger）；辅音字母+y 结尾变 y 为 i 再加 -er（heavy→heavier）。比较对象用 than 连接。'
        },
        {
          id: 'g6b-u2', no: 2, title: 'Last weekend', zh: '上周末（一般过去时）',
          words: [
            { w: 'weekend', m: '周末', ipa: '/ˌwiːkˈend/' }, { w: 'was', m: '是（am/is 的过去式）', ipa: '/wɒz/' },
            { w: 'were', m: '是（are 的过去式）', ipa: '/wɜː/' }, { w: 'cleaned', m: '打扫（过去式）', ipa: '/kliːnd/' },
            { w: 'washed', m: '洗（过去式）', ipa: '/wɒʃt/' }, { w: 'visited', m: '拜访（过去式）', ipa: '/ˈvɪzɪtɪd/' },
            { w: 'watched', m: '观看（过去式）', ipa: '/wɒtʃt/' }, { w: 'stayed', m: '停留（过去式）', ipa: '/steɪd/' },
            { w: 'yesterday', m: '昨天', ipa: '/ˈjestədeɪ/' }, { w: 'busy', m: '忙碌的', ipa: '/ˈbɪzi/' },
            { w: 'did', m: '做（do 的过去式）', ipa: '/dɪd/' }, { w: 'read', m: '读（read 的过去式）', ipa: '/red/' }
          ],
          sents: [
            { en: 'What did you do last weekend?', zh: '上周末你做了什么？' },
            { en: 'I cleaned my room and washed my clothes.', zh: '我打扫了房间、洗了衣服。' },
            { en: 'How was your weekend? It was good.', zh: '你周末过得怎么样？很好。' },
            { en: 'Did you watch TV? Yes, I did.', zh: '你看电视了吗？是的，我看了。' }
          ],
          grammar: '规则动词过去式加 -ed，词尾已有 e 只加 -d（like→liked）；疑问句用 Did + 主语 + 动词原形，答 Yes, I did. / No, I didn\'t.'
        },
        {
          id: 'g6b-u3', no: 3, title: 'Where did you go?', zh: '假日旅行（不规则过去式）',
          words: [
            { w: 'camp', m: '营地；露营', ipa: '/kæmp/' }, { w: 'rode', m: '骑（ride 的过去式）', ipa: '/rəʊd/' },
            { w: 'ate', m: '吃（eat 的过去式）', ipa: '/et/' }, { w: 'bought', m: '买（buy 的过去式）', ipa: '/bɔːt/' },
            { w: 'gift', m: '礼物', ipa: '/ɡɪft/' }, { w: 'forest', m: '森林', ipa: '/ˈfɒrɪst/' },
            { w: 'lake', m: '湖', ipa: '/leɪk/' }, { w: 'hurt', m: '受伤', ipa: '/hɜːt/' },
            { w: 'picture', m: '照片', ipa: '/ˈpɪktʃə/' }, { w: 'delicious', m: '美味的', ipa: '/dɪˈlɪʃəs/' },
            { w: 'over', m: '在……期间', ipa: '/ˈəʊvə/' }, { w: 'countryside', m: '乡村', ipa: '/ˈkʌntrisaɪd/' }
          ],
          sents: [
            { en: 'Where did you go over your holiday?', zh: '假期你去哪儿了？' },
            { en: 'I went to a forest park.', zh: '我去了一个森林公园。' },
            { en: 'I rode a horse and took many pictures.', zh: '我骑了马，还拍了很多照片。' },
            { en: 'Did you buy any gifts? Yes, I bought some.', zh: '你买礼物了吗？是的，我买了一些。' }
          ],
          grammar: '不规则动词过去式要逐个记：go→went, ride→rode, eat→ate, buy→bought, take→took, see→saw, hurt→hurt（不变）。疑问句中用了 did，后面动词必须用原形。'
        },
        {
          id: 'g6b-u4', no: 4, title: 'Then and now', zh: '过去与现在（时态对比）',
          words: [
            { w: 'before', m: '以前', ipa: '/bɪˈfɔː/' }, { w: 'now', m: '现在', ipa: '/naʊ/' },
            { w: 'ago', m: '……以前', ipa: '/əˈɡəʊ/' }, { w: 'gym', m: '体育馆', ipa: '/dʒɪm/' },
            { w: 'grass', m: '草地', ipa: '/ɡrɑːs/' }, { w: 'internet', m: '互联网', ipa: '/ˈɪntənet/' },
            { w: 'change', m: '改变', ipa: '/tʃeɪndʒ/' }, { w: 'different', m: '不同的', ipa: '/ˈdɪfrənt/' },
            { w: 'could', m: '能（can 的过去式）', ipa: '/kʊd/' }, { w: 'dining hall', m: '食堂', ipa: '/ˈdaɪnɪŋ hɔːl/' },
            { w: 'dream', m: '梦；梦想', ipa: '/driːm/' }, { w: 'still', m: '仍然', ipa: '/stɪl/' }
          ],
          sents: [
            { en: 'There was no gym in my school before.', zh: '以前我学校没有体育馆。' },
            { en: 'Now there is a new one.', zh: '现在有一个新的。' },
            { en: "I couldn't ride a bike before. Now I can.", zh: '以前我不会骑自行车，现在会了。' },
            { en: 'Our school changed a lot.', zh: '我们学校变化很大。' }
          ],
          grammar: 'There was + 单数 / There were + 复数（过去有）；There is / There are（现在有）。could / couldn\'t 表示过去的能力，后面接动词原形。'
        }
      ]
    }

  ]
};
