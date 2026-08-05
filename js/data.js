// 英语模块数据层（自然拼读 + 国际音标），由 english.html 抽取，独立维护
window.ENG_DATA = {
  phonics: {
    title: '自然拼读 Phonics',
    levels: [
      { no:'Level 1', name:'字母本音', desc:'26 个英文字母的本音学习', lessons: [
        { id:'pa1', sym:'A a', title:'A a 的本音', sub:'字母本音', tip:'A 的本音：短音 /æ/（如 apple），字母名读 /eɪ/。听示范，跟读字母名与短音，再读下面的单词。', words:[
          {w:'ant',m:'蚂蚁'},{w:'apple',m:'苹果'},{w:'arm',m:'手臂'},{w:'art',m:'艺术'},{w:'ax',m:'斧'},{w:'add',m:'加'},{w:'ago',m:'以前'},{w:'ask',m:'问'},{w:'and',m:'和'},{w:'am',m:'是'},{w:'at',m:'在'},{w:'all',m:'全部'},{w:'an',m:'一个'},{w:'as',m:'作为'},{w:'air',m:'空气'},{w:'aim',m:'目标'},{w:'age',m:'年龄'},{w:'ape',m:'猿'},{w:'aid',m:'帮助'},{w:'ace',m:'王牌'} ] },
        { id:'pa2', sym:'B b', title:'B b 的本音', sub:'字母本音', tip:'B 的本音 /b/：双唇轻碰再打开，如 bag。', words:[
          {w:'bag',m:'包'},{w:'bed',m:'床'},{w:'big',m:'大'},{w:'book',m:'书'},{w:'box',m:'盒子'},{w:'bus',m:'巴士'},{w:'boy',m:'男孩'},{w:'ball',m:'球'},{w:'bat',m:'蝙蝠'},{w:'bad',m:'坏'},{w:'bug',m:'虫'},{w:'by',m:'由'},{w:'bee',m:'蜜蜂'},{w:'bear',m:'熊'},{w:'bird',m:'鸟'},{w:'blue',m:'蓝'},{w:'boat',m:'船'},{w:'bone',m:'骨头'},{w:'bell',m:'铃'},{w:'bun',m:'面包'} ] },
        { id:'pa3', sym:'C c', title:'C c 的本音', sub:'字母本音', tip:'C 的本音 /k/：在 a/o/u 前发硬音（cat）；在 e/i/y 前读 /s/（city）。', words:[
          {w:'cat',m:'猫'},{w:'car',m:'车'},{w:'cup',m:'杯子'},{w:'cap',m:'帽子'},{w:'cow',m:'牛'},{w:'cake',m:'蛋糕'},{w:'can',m:'能'},{w:'city',m:'城市'},{w:'cut',m:'切'},{w:'cob',m:'玉米穗'},{w:'cub',m:'幼兽'},{w:'cod',m:'鳕鱼'},{w:'cot',m:'小床'},{w:'cab',m:'出租车'},{w:'cloud',m:'云'},{w:'clay',m:'黏土'},{w:'clip',m:'夹'},{w:'club',m:'俱乐部'},{w:'crab',m:'螃蟹'},{w:'crack',m:'裂'} ] },
        { id:'pa4', sym:'D d', title:'D d 的本音', sub:'字母本音', tip:'D 的本音 /d/：舌尖顶上颚，如 dog。', words:[
          {w:'dog',m:'狗'},{w:'day',m:'天'},{w:'door',m:'门'},{w:'duck',m:'鸭'},{w:'desk',m:'书桌'},{w:'dig',m:'挖'},{w:'dot',m:'点'},{w:'doll',m:'娃娃'},{w:'dad',m:'爸爸'},{w:'do',m:'做'},{w:'dip',m:'蘸'},{w:'den',m:'兽穴'},{w:'dart',m:'飞镖'},{w:'disk',m:'圆盘'},{w:'dock',m:'码头'},{w:'dune',m:'沙丘'},{w:'dawn',m:'黎明'},{w:'date',m:'日期'},{w:'dove',m:'鸽子'},{w:'drum',m:'鼓'} ] },
        { id:'pa5', sym:'E e', title:'E e 的本音', sub:'字母本音', tip:'E 的本音：短音 /e/（如 egg），字母名读 /iː/。', words:[
          {w:'egg',m:'蛋'},{w:'elephant',m:'象'},{w:'end',m:'结束'},{w:'enter',m:'进入'},{w:'east',m:'东'},{w:'edge',m:'边缘'},{w:'else',m:'其他'},{w:'even',m:'甚至'},{w:'ever',m:'曾经'},{w:'echo',m:'回声'},{w:'exit',m:'出口'},{w:'ear',m:'耳朵'},{w:'eat',m:'吃'},{w:'ease',m:'轻松'},{w:'elbow',m:'肘'},{w:'edit',m:'编辑'},{w:'eel',m:'鳗'},{w:'estate',m:'庄园'},{w:'empty',m:'空'},{w:'earn',m:'赚'} ] },
        { id:'pa6', sym:'F f', title:'F f 的本音', sub:'字母本音', tip:'F 的本音 /f/：上齿轻咬下唇，如 fish。', words:[
          {w:'fish',m:'鱼'},{w:'fan',m:'风扇'},{w:'fox',m:'狐狸'},{w:'fat',m:'胖'},{w:'five',m:'五'},{w:'four',m:'四'},{w:'fun',m:'乐趣'},{w:'far',m:'远'},{w:'fall',m:'落'},{w:'fog',m:'雾'},{w:'fig',m:'无花果'},{w:'fit',m:'适合'},{w:'fin',m:'鳍'},{w:'fir',m:'冷杉'},{w:'flag',m:'旗'},{w:'flat',m:'平'},{w:'flee',m:'逃'},{w:'fly',m:'飞'},{w:'food',m:'食物'},{w:'farm',m:'农场'} ] },
        { id:'pa7', sym:'G g', title:'G g 的本音', sub:'字母本音', tip:'G 的本音 /g/：在 a/o/u 前发硬音（goat）；在 e/i/y 前读 /dʒ/（gem）。', words:[
          {w:'goat',m:'山羊'},{w:'go',m:'去'},{w:'gun',m:'枪'},{w:'gap',m:'缝隙'},{w:'gas',m:'气'},{w:'game',m:'游戏'},{w:'girl',m:'女孩'},{w:'gift',m:'礼物'},{w:'god',m:'神'},{w:'gold',m:'金'},{w:'golf',m:'高尔夫'},{w:'good',m:'好'},{w:'grab',m:'抓'},{w:'grape',m:'葡萄'},{w:'grass',m:'草'},{w:'gray',m:'灰'},{w:'green',m:'绿'},{w:'grow',m:'生长'},{w:'guard',m:'守卫'},{w:'guide',m:'向导'} ] },
        { id:'pa8', sym:'H h', title:'H h 的本音', sub:'字母本音', tip:'H 的本音 /h/：轻轻呵气，如 hen。', words:[
          {w:'hat',m:'帽子'},{w:'hen',m:'母鸡'},{w:'hot',m:'热'},{w:'hand',m:'手'},{w:'house',m:'房子'},{w:'horse',m:'马'},{w:'hair',m:'头发'},{w:'ham',m:'火腿'},{w:'hill',m:'山'},{w:'hut',m:'小屋'},{w:'hurt',m:'伤'},{w:'hunt',m:'猎'},{w:'hint',m:'暗示'},{w:'hug',m:'拥抱'},{w:'huge',m:'巨大'},{w:'hard',m:'硬'},{w:'heart',m:'心'},{w:'head',m:'头'},{w:'hold',m:'握'},{w:'hope',m:'希望'} ] },
        { id:'pa9', sym:'I i', title:'I i 的本音', sub:'字母本音', tip:'I 的本音：短音 /ɪ/（如 ink），字母名读 /aɪ/。', words:[
          {w:'ink',m:'墨水'},{w:'ice',m:'冰'},{w:'ill',m:'病'},{w:'in',m:'在…里'},{w:'it',m:'它'},{w:'if',m:'如果'},{w:'is',m:'是'},{w:'iron',m:'铁'},{w:'idea',m:'主意'},{w:'inch',m:'英寸'},{w:'into',m:'进入'},{w:'item',m:'项目'},{w:'issue',m:'问题'},{w:'image',m:'图像'},{w:'index',m:'索引'},{w:'idle',m:'闲'},{w:'invite',m:'邀请'},{w:'island',m:'岛'},{w:'impact',m:'影响'},{w:'insect',m:'昆虫'} ] },
        { id:'pa10', sym:'J j', title:'J j 的本音', sub:'字母本音', tip:'J 的本音 /dʒ/：舌面抬起，如 jam。', words:[
          {w:'jam',m:'果酱'},{w:'jet',m:'喷气'},{w:'job',m:'工作'},{w:'jug',m:'水壶'},{w:'jump',m:'跳'},{w:'joy',m:'欢乐'},{w:'joke',m:'玩笑'},{w:'just',m:'刚'},{w:'jar',m:'罐'},{w:'jaw',m:'颚'},{w:'jazz',m:'爵士'},{w:'jewel',m:'珠宝'},{w:'join',m:'加入'},{w:'juice',m:'果汁'},{w:'jade',m:'玉'},{w:'jeep',m:'吉普'},{w:'jog',m:'慢跑'},{w:'jolly',m:'快乐'},{w:'judge',m:'法官'},{w:'jungle',m:'丛林'} ] },
        { id:'pa11', sym:'K k', title:'K k 的本音', sub:'字母本音', tip:'K 的本音 /k/：舌根顶软腭，如 key。', words:[
          {w:'key',m:'钥匙'},{w:'king',m:'国王'},{w:'kite',m:'风筝'},{w:'kid',m:'小孩'},{w:'kit',m:'工具包'},{w:'kiss',m:'吻'},{w:'keep',m:'保持'},{w:'kick',m:'踢'},{w:'kind',m:'善良'},{w:'kill',m:'杀'},{w:'keg',m:'小桶'},{w:'koala',m:'考拉'},{w:'knee',m:'膝盖'},{w:'knit',m:'织'},{w:'knot',m:'结'},{w:'know',m:'知道'},{w:'kiwi',m:'猕猴桃'},{w:'kayak',m:'皮划艇'},{w:'keel',m:'龙骨'},{w:'karma',m:'因果'} ] },
        { id:'pa12', sym:'L l', title:'L l 的本音', sub:'字母本音', tip:'L 的本音 /l/：舌尖顶上颚，如 leg。', words:[
          {w:'leg',m:'腿'},{w:'lip',m:'嘴唇'},{w:'log',m:'原木'},{w:'lamp',m:'灯'},{w:'leaf',m:'叶'},{w:'lion',m:'狮'},{w:'lock',m:'锁'},{w:'lake',m:'湖'},{w:'light',m:'光'},{w:'line',m:'线'},{w:'list',m:'清单'},{w:'look',m:'看'},{w:'love',m:'爱'},{w:'long',m:'长'},{w:'luck',m:'运气'},{w:'lot',m:'很多'},{w:'loud',m:'响'},{w:'low',m:'低'},{w:'lab',m:'实验室'},{w:'lift',m:'提升'} ] },
        { id:'pa13', sym:'M m', title:'M m 的本音', sub:'字母本音', tip:'M 的本音 /m/：双唇闭合鼻音，如 man。', words:[
          {w:'man',m:'男人'},{w:'map',m:'地图'},{w:'mat',m:'垫'},{w:'mud',m:'泥'},{w:'milk',m:'牛奶'},{w:'moon',m:'月'},{w:'mug',m:'杯子'},{w:'mouse',m:'鼠'},{w:'monkey',m:'猴'},{w:'mother',m:'妈妈'},{w:'music',m:'音乐'},{w:'mix',m:'混合'},{w:'miss',m:'错过'},{w:'match',m:'比赛'},{w:'mail',m:'邮件'},{w:'meal',m:'餐'},{w:'meat',m:'肉'},{w:'melt',m:'融化'},{w:'mine',m:'我的'},{w:'mint',m:'薄荷'} ] },
        { id:'pa14', sym:'N n', title:'N n 的本音', sub:'字母本音', tip:'N 的本音 /n/：舌尖顶上颚鼻音，如 net。', words:[
          {w:'net',m:'网'},{w:'nut',m:'坚果'},{w:'nap',m:'小睡'},{w:'nose',m:'鼻子'},{w:'nest',m:'巢'},{w:'name',m:'名字'},{w:'night',m:'夜'},{w:'nine',m:'九'},{w:'navy',m:'海军'},{w:'neck',m:'脖子'},{w:'nail',m:'指甲'},{w:'news',m:'新闻'},{w:'nice',m:'好'},{w:'noodle',m:'面条'},{w:'note',m:'笔记'},{w:'nurse',m:'护士'},{w:'need',m:'需要'},{w:'near',m:'近'},{w:'neat',m:'整洁'},{w:'noon',m:'中午'} ] },
        { id:'pa15', sym:'O o', title:'O o 的本音', sub:'字母本音', tip:'O 的本音：短音 /ɒ/（如 ox），字母名读 /əʊ/。', words:[
          {w:'ox',m:'公牛'},{w:'orange',m:'橙'},{w:'owl',m:'猫头鹰'},{w:'on',m:'在…上'},{w:'off',m:'离开'},{w:'oil',m:'油'},{w:'open',m:'开'},{w:'odd',m:'奇怪'},{w:'oak',m:'橡树'},{w:'oar',m:'桨'},{w:'oath',m:'誓言'},{w:'obey',m:'服从'},{w:'ocean',m:'海洋'},{w:'octopus',m:'章鱼'},{w:'offer',m:'提供'},{w:'olive',m:'橄榄'},{w:'omelet',m:'煎蛋'},{w:'onion',m:'洋葱'},{w:'opera',m:'歌剧'},{w:'orbit',m:'轨道'} ] },
        { id:'pa16', sym:'P p', title:'P p 的本音', sub:'字母本音', tip:'P 的本音 /p/：双唇爆破，如 pen。', words:[
          {w:'pen',m:'钢笔'},{w:'pig',m:'猪'},{w:'pot',m:'锅'},{w:'pan',m:'平底锅'},{w:'pet',m:'宠物'},{w:'pin',m:'别针'},{w:'park',m:'公园'},{w:'pear',m:'梨'},{w:'pea',m:'豌豆'},{w:'pack',m:'包'},{w:'pad',m:'垫'},{w:'page',m:'页'},{w:'palm',m:'棕榈'},{w:'pat',m:'轻拍'},{w:'paw',m:'爪'},{w:'peace',m:'和平'},{w:'peach',m:'桃'},{w:'peak',m:'峰'},{w:'pill',m:'药丸'},{w:'pie',m:'派'} ] },
        { id:'pa17', sym:'Q q', title:'Q q 的本音', sub:'字母本音', tip:'Q 常与 u 搭档发 /kw/，如 queen。', words:[
          {w:'quack',m:'嘎嘎'},{w:'queen',m:'女王'},{w:'quick',m:'快'},{w:'quiet',m:'安静'},{w:'quiz',m:'测验'},{w:'quilt',m:'被子'},{w:'quit',m:'退出'},{w:'quote',m:'引用'},{w:'quest',m:'探索'},{w:'question',m:'问题'},{w:'quart',m:'夸脱'},{w:'quiver',m:'颤抖'},{w:'quake',m:'地震'},{w:'quay',m:'码头'},{w:'queue',m:'队列'},{w:'quench',m:'止渴'},{w:'quokka',m:'短尾矮袋鼠'},{w:'quail',m:'鹌鹑'},{w:'quip',m:'俏皮话'},{w:'quarrel',m:'吵架'} ] },
        { id:'pa18', sym:'R r', title:'R r 的本音', sub:'字母本音', tip:'R 的本音 /r/：卷舌音，如 rat。', words:[
          {w:'rat',m:'老鼠'},{w:'red',m:'红'},{w:'run',m:'跑'},{w:'rug',m:'地毯'},{w:'rain',m:'雨'},{w:'ring',m:'戒指'},{w:'rose',m:'玫瑰'},{w:'rock',m:'岩石'},{w:'road',m:'路'},{w:'rope',m:'绳'},{w:'rib',m:'肋骨'},{w:'rim',m:'边缘'},{w:'rip',m:'撕'},{w:'risk',m:'风险'},{w:'rich',m:'富'},{w:'ride',m:'骑'},{w:'ripe',m:'熟'},{w:'roar',m:'吼'},{w:'robin',m:'知更鸟'},{w:'robot',m:'机器人'} ] },
        { id:'pa19', sym:'S s', title:'S s 的本音', sub:'字母本音', tip:'S 的本音 /s/：清摩擦丝丝声，如 sun。', words:[
          {w:'sun',m:'太阳'},{w:'sea',m:'海'},{w:'sit',m:'坐'},{w:'six',m:'六'},{w:'sock',m:'袜'},{w:'soap',m:'肥皂'},{w:'seal',m:'海豹'},{w:'seed',m:'种子'},{w:'ship',m:'船'},{w:'shoe',m:'鞋'},{w:'shop',m:'店'},{w:'star',m:'星'},{w:'stop',m:'停'},{w:'sand',m:'沙'},{w:'sad',m:'伤心'},{w:'safe',m:'安全'},{w:'sail',m:'帆'},{w:'salt',m:'盐'},{w:'same',m:'相同'},{w:'sing',m:'唱'} ] },
        { id:'pa20', sym:'T t', title:'T t 的本音', sub:'字母本音', tip:'T 的本音 /t/：舌尖顶上颚，如 ten。', words:[
          {w:'ten',m:'十'},{w:'top',m:'顶'},{w:'toy',m:'玩具'},{w:'tap',m:'轻敲'},{w:'tag',m:'标签'},{w:'tail',m:'尾'},{w:'talk',m:'说'},{w:'tank',m:'坦克'},{w:'tape',m:'胶带'},{w:'task',m:'任务'},{w:'tea',m:'茶'},{w:'team',m:'队'},{w:'tear',m:'撕'},{w:'tent',m:'帐篷'},{w:'test',m:'测试'},{w:'text',m:'文本'},{w:'tie',m:'领带'},{w:'tiger',m:'虎'},{w:'time',m:'时间'},{w:'tip',m:'尖端'} ] },
        { id:'pa21', sym:'U u', title:'U u 的本音', sub:'字母本音', tip:'U 的本音：短音 /ʌ/（如 up），字母名读 /juː/。', words:[
          {w:'up',m:'向上'},{w:'us',m:'我们'},{w:'under',m:'在…下'},{w:'uncle',m:'叔叔'},{w:'ugly',m:'丑'},{w:'unit',m:'单元'},{w:'use',m:'用'},{w:'undo',m:'撤销'},{w:'uniform',m:'制服'},{w:'unicorn',m:'独角兽'},{w:'union',m:'联盟'},{w:'unique',m:'独特'},{w:'universe',m:'宇宙'},{w:'urban',m:'城市'},{w:'urge',m:'敦促'},{w:'urgent',m:'紧急'},{w:'usage',m:'用法'},{w:'upset',m:'心烦'},{w:'utter',m:'说'},{w:'ulcer',m:'溃疡'} ] },
        { id:'pa22', sym:'V v', title:'V v 的本音', sub:'字母本音', tip:'V 的本音 /v/：上齿轻咬下唇振动，如 van。', words:[
          {w:'van',m:'货车'},{w:'vet',m:'兽医'},{w:'very',m:'非常'},{w:'vest',m:'背心'},{w:'vast',m:'巨大'},{w:'vine',m:'藤'},{w:'visa',m:'签证'},{w:'voice',m:'声音'},{w:'vote',m:'投票'},{w:'vow',m:'誓言'},{w:'vacuum',m:'真空'},{w:'valley',m:'谷'},{w:'value',m:'价值'},{w:'vapor',m:'蒸汽'},{w:'vault',m:'金库'},{w:'vegan',m:'素食者'},{w:'velvet',m:'天鹅绒'},{w:'vent',m:'通风口'},{w:'violet',m:'紫罗兰'},{w:'violin',m:'小提琴'} ] },
        { id:'pa23', sym:'W w', title:'W w 的本音', sub:'字母本音', tip:'W 的本音 /w/：圆唇半元音，如 water。', words:[
          {w:'water',m:'水'},{w:'web',m:'网'},{w:'wet',m:'湿'},{w:'win',m:'赢'},{w:'wax',m:'蜡'},{w:'wing',m:'翼'},{w:'wind',m:'风'},{w:'wolf',m:'狼'},{w:'wood',m:'木'},{w:'worm',m:'虫'},{w:'well',m:'好'},{w:'west',m:'西'},{w:'will',m:'将'},{w:'wish',m:'希望'},{w:'wash',m:'洗'},{w:'wave',m:'波'},{w:'wag',m:'摇'},{w:'wall',m:'墙'},{w:'want',m:'想'},{w:'warm',m:'暖'} ] },
        { id:'pa24', sym:'X x', title:'X x 的本音', sub:'字母本音', tip:'X 的本音 /ks/（如 box）；词首发 /z/（xylophone）。', words:[
          {w:'box',m:'盒子'},{w:'fox',m:'狐狸'},{w:'six',m:'六'},{w:'ox',m:'公牛'},{w:'mix',m:'混合'},{w:'fix',m:'修'},{w:'tax',m:'税'},{w:'axe',m:'斧'},{w:'exit',m:'出口'},{w:'exam',m:'考试'},{w:'extra',m:'额外'},{w:'xray',m:'X光'},{w:'xylophone',m:'木琴'},{w:'xerox',m:'复印'},{w:'relax',m:'放松'},{w:'flax',m:'亚麻'},{w:'ax',m:'斧'},{w:'oxen',m:'公牛(复)'},{w:'mixing',m:'混合(动)'},{w:'fixer',m:'修理工'} ] },
        { id:'pa25', sym:'Y y', title:'Y y 的本音', sub:'字母本音', tip:'Y 的本音 /j/：词首发半元音（yes）；字母名读 /waɪ/。', words:[
          {w:'yes',m:'是'},{w:'you',m:'你'},{w:'yam',m:'山药'},{w:'yard',m:'院子'},{w:'yarn',m:'纱'},{w:'yawn',m:'哈欠'},{w:'year',m:'年'},{w:'yellow',m:'黄'},{w:'yell',m:'喊'},{w:'yet',m:'还'},{w:'yummy',m:'美味'},{w:'yoke',m:'轭'},{w:'yolk',m:'蛋黄'},{w:'young',m:'年轻'},{w:'yoyo',m:'悠悠球'},{w:'yield',m:'屈服'},{w:'yacht',m:'游艇'},{w:'yeast',m:'酵母'},{w:'yule',m:'圣诞'},{w:'yip',m:'汪'} ] },
        { id:'pa26', sym:'Z z', title:'Z z 的本音', sub:'字母本音', tip:'Z 的本音 /z/：浊摩擦声，如 zoo。', words:[
          {w:'zoo',m:'动物园'},{w:'zip',m:'拉链'},{w:'zero',m:'零'},{w:'zap',m:'电击'},{w:'zebra',m:'斑马'},{w:'zest',m:'热情'},{w:'zinc',m:'锌'},{w:'zone',m:'区域'},{w:'zoom',m:'缩放'},{w:'zany',m:'滑稽'},{w:'zeal',m:'热情'},{w:'zen',m:'禅'},{w:'zipper',m:'拉链'},{w:'zombie',m:'僵尸'},{w:'zodiac',m:'黄道'},{w:'zucchini',m:'西葫芦'},{w:'zealot',m:'狂热者'},{w:'zing',m:'活力'},{w:'zigzag',m:'之字'},{w:'zonal',m:'带状的'} ] }
      ] },
      { no:'Level 2', name:'CVC 短元音', desc:'CVC 结构单词拼读练习', lessons: [
        { id:'pb1', sym:'-at', title:'-at 家族', sub:'短 a 词族', tip:'结尾 -at：a 发 /æ/，t 发 /t/。换首字母就能拼出很多词。', words:[
          {w:'cat',m:'猫'},{w:'hat',m:'帽子'},{w:'bat',m:'蝙蝠'},{w:'mat',m:'垫子'},{w:'rat',m:'老鼠'},{w:'sat',m:'坐'},{w:'pat',m:'轻拍'},{w:'fat',m:'胖'},{w:'vat',m:'大桶'},{w:'flat',m:'平坦'},{w:'chat',m:'聊天'},{w:'flap',m:'拍打'},{w:'slap',m:'拍'},{w:'brat',m:'顽童'},{w:'spat',m:'小吵'},{w:'that',m:'那'},{w:'gnat',m:'小虫'},{w:'scat',m:'散开'},{w:'plat',m:'层'},{w:'splat',m:'啪'} ] },
        { id:'pb2', sym:'-an', title:'-an 家族', sub:'短 a 词族', tip:'-an 发 /æn/。注意 n 的鼻音结尾。', words:[
          {w:'can',m:'能'},{w:'man',m:'男人'},{w:'fan',m:'风扇'},{w:'pan',m:'平底锅'},{w:'ran',m:'跑'},{w:'tan',m:'棕'},{w:'van',m:'货车'},{w:'ban',m:'禁止'},{w:'plan',m:'计划'},{w:'clan',m:'氏族'},{w:'scan',m:'扫描'},{w:'bran',m:'麸'},{w:'span',m:'跨度'},{w:'than',m:'比'},{w:'stan',m:'站'},{w:'jan',m:'一月'},{w:'cyan',m:'青'},{w:'an',m:'在'},{w:'dan',m:'丹'},{w:'fan',m:'风扇'} ] },
        { id:'pb3', sym:'-ap', title:'-ap 家族', sub:'短 a 词族', tip:'-ap 发 /æp/。注意 p 的爆破结尾。', words:[
          {w:'cap',m:'帽子'},{w:'map',m:'地图'},{w:'nap',m:'小睡'},{w:'sap',m:'树液'},{w:'tap',m:'轻敲'},{w:'lap',m:'膝盖'},{w:'rap',m:'说唱'},{w:'gap',m:'缝隙'},{w:'zap',m:'电击'},{w:'clap',m:'拍手'},{w:'slap',m:'拍'},{w:'trap',m:'陷阱'},{w:'snap',m:'折断'},{w:'wrap',m:'包裹'},{w:'flap',m:'拍打'},{w:'strap',m:'带'},{w:'scrap',m:'碎片'},{w:'yap',m:'汪'},{w:'chap',m:'家伙'},{w:'pap',m:'浆'} ] },
        { id:'pb4', sym:'-et', title:'-et 家族', sub:'短 e 词族', tip:'-et 发 /et/。e 短音要短促。', words:[
          {w:'bet',m:'打赌'},{w:'let',m:'让'},{w:'met',m:'遇见'},{w:'net',m:'网'},{w:'pet',m:'宠物'},{w:'set',m:'放'},{w:'wet',m:'湿'},{w:'jet',m:'喷气'},{w:'vet',m:'兽医'},{w:'yet',m:'还'},{w:'get',m:'得到'},{w:'fret',m:'烦躁'},{w:'kept',m:'保持'},{w:'wept',m:'哭泣'},{w:'debt',m:'债'},{w:'belt',m:'腰带'},{w:'felt',m:'感觉'},{w:'melt',m:'融化'},{w:'pelt',m:'投掷'},{w:'net',m:'网'} ] },
        { id:'pb5', sym:'-en', title:'-en 家族', sub:'短 e 词族', tip:'-en 发 /en/。', words:[
          {w:'ten',m:'十'},{w:'pen',m:'钢笔'},{w:'hen',m:'母鸡'},{w:'men',m:'男人'},{w:'den',m:'兽穴'},{w:'ben',m:'本'},{w:'fen',m:'沼'},{w:'ken',m:'知道'},{w:'when',m:'当'},{w:'then',m:'然后'},{w:'glen',m:'峡谷'},{w:'yen',m:'日元'},{w:'zen',m:'禅'},{w:'tendon',m:'腱'},{w:'kitten',m:'小猫'},{w:'mitten',m:'连指手套'},{w:'given',m:'给'},{w:'even',m:'甚至'},{w:'seven',m:'七'},{w:'len',m:'伦'} ] },
        { id:'pb6', sym:'-ig', title:'-ig 家族', sub:'短 i 词族', tip:'-ig 发 /ɪg/。i 是短衣音。', words:[
          {w:'big',m:'大'},{w:'dig',m:'挖'},{w:'fig',m:'无花果'},{w:'pig',m:'猪'},{w:'wig',m:'假发'},{w:'rig',m:'钻塔'},{w:'jig',m:'吉格'},{w:'zig',m:'之字'},{w:'twig',m:'小枝'},{w:'skin',m:'皮肤'},{w:'spin',m:'旋转'},{w:'grin',m:'咧嘴'},{w:'chin',m:'下巴'},{w:'thin',m:'瘦'},{w:'win',m:'赢'},{w:'pin',m:'别针'},{w:'fin',m:'鳍'},{w:'bin',m:'箱'},{w:'tin',m:'罐头'},{w:'din',m:'喧闹'} ] },
        { id:'pb7', sym:'-og', title:'-og 家族', sub:'短 a 词族', tip:'-og 发 /ɒg/。o 短奥。', words:[
          {w:'dog',m:'狗'},{w:'log',m:'原木'},{w:'fog',m:'雾'},{w:'hog',m:'猪'},{w:'jog',m:'慢跑'},{w:'bog',m:'泥沼'},{w:'cog',m:'齿轮'},{w:'frog',m:'青蛙'},{w:'smog',m:'烟'},{w:'blog',m:'博客'},{w:'clog',m:'阻塞'},{w:'flog',m:'鞭打'},{w:'slog',m:'苦干'},{w:'tog',m:'外套'},{w:'nog',m:'木块'},{w:'fog',m:'雾'},{w:'log',m:'原木'},{w:'dog',m:'狗'},{w:'bog',m:'泥沼'},{w:'cog',m:'齿轮'} ] },
        { id:'pb8', sym:'-ug', title:'-ug 家族', sub:'短 u 词族', tip:'-ug 发 /ʌg/。u 短阿。', words:[
          {w:'bug',m:'小虫'},{w:'dug',m:'挖(过)'},{w:'hug',m:'拥抱'},{w:'jug',m:'水壶'},{w:'mug',m:'杯子'},{w:'rug',m:'地毯'},{w:'tug',m:'拖'},{w:'pug',m:'哈巴狗'},{w:'slug',m:'鼻涕虫'},{w:'plug',m:'插头'},{w:'snug',m:'温暖'},{w:'drug',m:'药'},{w:'chug',m:'咔嚓'},{w:'thug',m:'暴徒'},{w:'mug',m:'杯子'},{w:'rug',m:'地毯'},{w:'bug',m:'小虫'},{w:'tug',m:'拖'},{w:'hug',m:'拥抱'},{w:'jug',m:'水壶'} ] }
      ]},
      { no:'Level 3', name:'辅音组合', desc:'高频辅音字母组合拼读', lessons: [
        { id:'pc1', sym:'sh', title:'sh 组合', sub:'辅音组合', tip:'sh 发 /ʃ/ 清摩擦“诗”，如 she、fish。', words:[
          {w:'ship',m:'船'},{w:'shop',m:'店'},{w:'shut',m:'关'},{w:'fish',m:'鱼'},{w:'dish',m:'盘'},{w:'cash',m:'现金'},{w:'bash',m:'猛击'},{w:'rush',m:'冲'},{w:'push',m:'推'},{w:'bush',m:'灌木'},{w:'hash',m:'哈希'},{w:'mash',m:'捣碎'},{w:'hush',m:'安静'},{w:'wish',m:'希望'},{w:'wash',m:'洗'},{w:'dash',m:'冲'},{w:'flash',m:'闪'},{w:'crash',m:'撞'},{w:'smash',m:'粉碎'},{w:'trash',m:'垃圾'} ] },
        { id:'pc2', sym:'ch', title:'ch 组合', sub:'辅音组合', tip:'ch 发 /tʃ/ 清破擦“吃”，如 chair、much。', words:[
          {w:'chip',m:'薯片'},{w:'chop',m:'砍'},{w:'chat',m:'聊天'},{w:'chin',m:'下巴'},{w:'rich',m:'富'},{w:'much',m:'多'},{w:'such',m:'这样'},{w:'lunch',m:'午餐'},{w:'bench',m:'长椅'},{w:'catch',m:'抓'},{w:'watch',m:'表'},{w:'match',m:'比赛'},{w:'pinch',m:'捏'},{w:'punch',m:'拳'},{w:'ranch',m:'牧场'},{w:'witch',m:'女巫'},{w:'fetch',m:'取'},{w:'teach',m:'教'},{w:'reach',m:'到达'},{w:'peach',m:'桃'} ] },
        { id:'pc3', sym:'th', title:'th 组合', sub:'辅音组合', tip:'th 发 /θ/（清咬舌，如 think）或 /ð/（浊咬舌，如 this）。', words:[
          {w:'this',m:'这'},{w:'that',m:'那'},{w:'them',m:'他们'},{w:'then',m:'然后'},{w:'thin',m:'瘦'},{w:'thick',m:'厚'},{w:'math',m:'数学'},{w:'bath',m:'澡'},{w:'path',m:'路'},{w:'with',m:'和'},{w:'both',m:'都'},{w:'moth',m:'蛾'},{w:'cloth',m:'布'},{w:'broth',m:'汤'},{w:'tooth',m:'牙'},{w:'smooth',m:'顺'},{w:'three',m:'三'},{w:'thank',m:'谢'},{w:'think',m:'想'},{w:'thumb',m:'拇指'} ] },
        { id:'pc4', sym:'ph', title:'ph 组合', sub:'辅音组合', tip:'ph 发 /f/，如 phone、photo。', words:[
          {w:'phone',m:'电话'},{w:'photo',m:'照片'},{w:'phrase',m:'短语'},{w:'phonic',m:'语音'},{w:'graph',m:'图'},{w:'dolphin',m:'海豚'},{w:'elephant',m:'象'},{w:'alphabet',m:'字母表'},{w:'physics',m:'物理'},{w:'orphan',m:'孤儿'},{w:'triumph',m:'胜利'},{w:'paragraph',m:'段落'},{w:'nephew',m:'侄'},{w:'phantom',m:'幻影'},{w:'phlox',m:'福禄考'},{w:'sapphire',m:'蓝宝石'},{w:'geographer',m:'地理学家'},{w:'morph',m:'变形'},{w:'trophy',m:'奖杯'},{w:'photosynthesis',m:'光合作用'} ] },
        { id:'pc5', sym:'wh', title:'wh 组合', sub:'辅音组合', tip:'wh 常发 /w/，如 what、when（在 o 前发 /h/，如 who）。', words:[
          {w:'what',m:'什么'},{w:'when',m:'何时'},{w:'where',m:'何地'},{w:'which',m:'哪个'},{w:'white',m:'白'},{w:'wheel',m:'轮'},{w:'whale',m:'鲸'},{w:'wheat',m:'小麦'},{w:'whirl',m:'旋转'},{w:'whip',m:'鞭'},{w:'whine',m:'哀鸣'},{w:'whack',m:'重击'},{w:'whisk',m:'打蛋'},{w:'who',m:'谁'},{w:'whole',m:'整个'},{w:'whom',m:'谁'},{w:'whose',m:'谁的'},{w:'why',m:'为何'},{w:'while',m:'当'},{w:'whim',m:'念头'} ] },
        { id:'pc6', sym:'bl', title:'bl 组合', sub:'辅音连缀', tip:'bl 发 /bl/，如 blue、black。两个音快速连读。', words:[
          {w:'black',m:'黑'},{w:'blue',m:'蓝'},{w:'block',m:'块'},{w:'blow',m:'吹'},{w:'blank',m:'空白'},{w:'blink',m:'眨'},{w:'blend',m:'混合'},{w:'bless',m:'祝福'},{w:'bloom',m:'花'},{w:'blast',m:'爆炸'},{w:'blind',m:'盲'},{w:'blush',m:'脸红'},{w:'blip',m:'哔'},{w:'blond',m:'金发'},{w:'blaze',m:'火焰'},{w:'bleak',m:'荒凉'},{w:'bleed',m:'流血'},{w:'brick',m:'砖'},{w:'blade',m:'刀刃'},{w:'blot',m:'污点'} ] },
        { id:'pc7', sym:'cl', title:'cl 组合', sub:'辅音连缀', tip:'cl 发 /kl/，如 clap、clean。', words:[
          {w:'clap',m:'拍'},{w:'clip',m:'夹'},{w:'clock',m:'钟'},{w:'close',m:'关'},{w:'clay',m:'黏土'},{w:'clown',m:'小丑'},{w:'clean',m:'干净'},{w:'class',m:'班'},{w:'cliff',m:'悬崖'},{w:'click',m:'点击'},{w:'clamp',m:'夹'},{w:'clasp',m:'扣'},{w:'claw',m:'爪'},{w:'cleat',m:'楔'},{w:'cluck',m:'咯咯'},{w:'clump',m:'丛'},{w:'clash',m:'冲突'},{w:'clad',m:'穿衣'},{w:'clam',m:'蛤'},{w:'clop',m:'得得'} ] },
        { id:'pc8', sym:'fl', title:'fl 组合', sub:'辅音连缀', tip:'fl 发 /fl/，如 flag、fly。', words:[
          {w:'flag',m:'旗'},{w:'flat',m:'平'},{w:'flip',m:'翻'},{w:'float',m:'浮'},{w:'flow',m:'流'},{w:'flower',m:'花'},{w:'fly',m:'飞'},{w:'flame',m:'火焰'},{w:'flash',m:'闪'},{w:'flee',m:'逃'},{w:'flesh',m:'肉'},{w:'fling',m:'扔'},{w:'flop',m:'扑'},{w:'fluff',m:'绒'},{w:'flute',m:'笛'},{w:'flaw',m:'瑕疵'},{w:'fleece',m:'羊毛'},{w:'flock',m:'群'},{w:'flood',m:'洪'},{w:'flume',m:'水槽'} ] },
        { id:'pc9', sym:'st', title:'st 组合', sub:'辅音连缀', tip:'st 发 /st/，如 star、stop。', words:[
          {w:'star',m:'星'},{w:'stop',m:'停'},{w:'step',m:'步'},{w:'stone',m:'石'},{w:'stick',m:'棍'},{w:'story',m:'故事'},{w:'stand',m:'站'},{w:'stem',m:'茎'},{w:'sting',m:'刺'},{w:'stamp',m:'邮票'},{w:'stiff',m:'僵'},{w:'still',m:'仍'},{w:'stock',m:'股'},{w:'storm',m:'暴'},{w:'stool',m:'凳'},{w:'stork',m:'鹳'},{w:'strap',m:'带'},{w:'stub',m:'残端'},{w:'stud',m:'钉'},{w:'stun',m:'惊'} ] },
        { id:'pc10', sym:'sp', title:'sp 组合', sub:'辅音连缀', tip:'sp 发 /sp/，如 spin、spot。', words:[
          {w:'spin',m:'旋转'},{w:'spot',m:'点'},{w:'spell',m:'拼'},{w:'spider',m:'蜘蛛'},{w:'spade',m:'铲'},{w:'speak',m:'说'},{w:'speed',m:'速度'},{w:'spoon',m:'勺'},{w:'sport',m:'运动'},{w:'space',m:'空间'},{w:'spark',m:'火花'},{w:'spill',m:'洒'},{w:'spit',m:'吐'},{w:'sprat',m:'小鲱'},{w:'spray',m:'喷'},{w:'spry',m:'轻快'},{w:'spud',m:'薯'},{w:'spurn',m:'拒绝'},{w:'spout',m:'喷'},{w:'spank',m:'打'} ] }
      ]},
      { no:'Level 4', name:'元音组合', desc:'高频元音字母组合拼读', lessons: [
        { id:'pd1', sym:'ai / ay', title:'ai / ay', sub:'长 a 组合', tip:'ai 在词中（rain），ay 在词尾（day），都发 /eɪ/ 长 a。', words:[
          {w:'rain',m:'雨'},{w:'tail',m:'尾'},{w:'mail',m:'邮件'},{w:'sail',m:'帆'},{w:'pain',m:'痛'},{w:'wait',m:'等'},{w:'train',m:'火车'},{w:'brain',m:'脑'},{w:'chain',m:'链'},{w:'main',m:'主要'},{w:'paid',m:'付'},{w:'aid',m:'帮助'},{w:'day',m:'天'},{w:'play',m:'玩'},{w:'say',m:'说'},{w:'way',m:'路'},{w:'may',m:'可能'},{w:'pay',m:'付'},{w:'stay',m:'留'},{w:'gray',m:'灰'} ] },
        { id:'pd2', sym:'ee / ea', title:'ee / ea', sub:'长 e 组合', tip:'ee 和 ea 常发长 e /iː/，如 see、eat。', words:[
          {w:'see',m:'看'},{w:'tree',m:'树'},{w:'bee',m:'蜂'},{w:'feet',m:'脚'},{w:'meet',m:'遇'},{w:'seed',m:'种子'},{w:'green',m:'绿'},{w:'three',m:'三'},{w:'need',m:'需'},{w:'keep',m:'保'},{w:'eat',m:'吃'},{w:'meat',m:'肉'},{w:'sea',m:'海'},{w:'tea',m:'茶'},{w:'read',m:'读'},{w:'leaf',m:'叶'},{w:'meal',m:'餐'},{w:'seal',m:'海豹'},{w:'heat',m:'热'},{w:'beach',m:'海滩'} ] },
        { id:'pd3', sym:'oa / ow', title:'oa / ow', sub:'长 o 组合', tip:'oa 在词中（boat），ow 在词尾（show），都发 /əʊ/ 长 o。', words:[
          {w:'boat',m:'船'},{w:'coat',m:'外套'},{w:'goat',m:'山羊'},{w:'road',m:'路'},{w:'toast',m:'吐司'},{w:'foam',m:'泡'},{w:'load',m:'载'},{w:'oat',m:'燕麦'},{w:'crow',m:'鸦'},{w:'snow',m:'雪'},{w:'grow',m:'长'},{w:'blow',m:'吹'},{w:'flow',m:'流'},{w:'glow',m:'发光'},{w:'show',m:'展示'},{w:'low',m:'低'},{w:'bowl',m:'碗'},{w:'know',m:'知'},{w:'own',m:'拥有'},{w:'throw',m:'扔'} ] },
        { id:'pd4', sym:'oo', title:'oo 组合', sub:'长/短 oo', tip:'oo 可发长 /uː/（food）或短 /ʊ/（book），注意区分。', words:[
          {w:'book',m:'书'},{w:'cook',m:'煮'},{w:'look',m:'看'},{w:'hook',m:'钩'},{w:'took',m:'拿'},{w:'foot',m:'脚'},{w:'wood',m:'木'},{w:'wool',m:'毛'},{w:'good',m:'好'},{w:'room',m:'房'},{w:'boot',m:'靴'},{w:'moon',m:'月'},{w:'soon',m:'快'},{w:'zoo',m:'动物园'},{w:'food',m:'食'},{w:'roof',m:'顶'},{w:'root',m:'根'},{w:'loop',m:'环'},{w:'scoop',m:'勺'},{w:'spoon',m:'勺'} ] },
        { id:'pd5', sym:'ou / ow', title:'ou / ow', sub:'双元音', tip:'ou/ow 常发 /aʊ/，如 out、cow。', words:[
          {w:'house',m:'房'},{w:'mouse',m:'鼠'},{w:'out',m:'出'},{w:'shout',m:'喊'},{w:'loud',m:'响'},{w:'cloud',m:'云'},{w:'round',m:'圆'},{w:'sound',m:'声'},{w:'count',m:'数'},{w:'found',m:'找'},{w:'cow',m:'牛'},{w:'how',m:'如何'},{w:'now',m:'现在'},{w:'brown',m:'棕'},{w:'down',m:'下'},{w:'town',m:'镇'},{w:'crown',m:'冠'},{w:'owl',m:'鸮'},{w:'bow',m:'弓'},{w:'vow',m:'誓'} ] },
        { id:'pd6', sym:'oi / oy', title:'oi / oy', sub:'双元音', tip:'oi 在词中（boy 用 oy 在词尾），都发 /ɔɪ/。', words:[
          {w:'boy',m:'男孩'},{w:'toy',m:'玩具'},{w:'joy',m:'欢乐'},{w:'coin',m:'币'},{w:'point',m:'点'},{w:'noise',m:'噪'},{w:'voice',m:'声'},{w:'join',m:'加入'},{w:'boil',m:'煮'},{w:'soil',m:'土'},{w:'oil',m:'油'},{w:'coy',m:'害羞'},{w:'soy',m:'酱油'},{w:'royal',m:'皇家'},{w:'loyal',m:'忠诚'},{w:'choice',m:'选择'},{w:'spoil',m:'宠'},{w:'coil',m:'卷'},{w:'foil',m:'箔'},{w:'hoist',m:'升'} ] },
        { id:'pd7', sym:'igh', title:'igh 组合', sub:'长 i 组合', tip:'igh 发 /aɪ/ 长 i，如 light、night。', words:[
          {w:'light',m:'光'},{w:'night',m:'夜'},{w:'right',m:'右'},{w:'high',m:'高'},{w:'bright',m:'亮'},{w:'flight',m:'航班'},{w:'sight',m:'视'},{w:'tight',m:'紧'},{w:'fight',m:'战'},{w:'might',m:'可能'},{w:'fright',m:'惊'},{w:'knight',m:'骑士'},{w:'slight',m:'轻'},{w:'blight',m:'枯萎'},{w:'plight',m:'困境'},{w:'alight',m:'点亮'},{w:'thigh',m:'大腿'},{w:'wright',m:'工匠'},{w:'sight',m:'视'},{w:'light',m:'光'} ] },
        { id:'pd8', sym:'ew', title:'ew 组合', sub:'长 u 组合', tip:'ew 常发 /juː/ 或 /uː/，如 new、flew。', words:[
          {w:'new',m:'新'},{w:'few',m:'少'},{w:'dew',m:'露'},{w:'crew',m:'队'},{w:'flew',m:'飞'},{w:'chew',m:'嚼'},{w:'view',m:'视'},{w:'knew',m:'知'},{w:'threw',m:'扔'},{w:'grew',m:'长'},{w:'drew',m:'画'},{w:'screw',m:'螺丝'},{w:'shrew',m:'泼妇'},{w:'stew',m:'炖'},{w:'brew',m:'酿'},{w:'clew',m:'线团'},{w:'mew',m:'喵'},{w:'pew',m:'长椅'},{w:'spew',m:'喷'},{w:'renew',m:'更新'} ] }
      ]}
    ]
  },
  ipa: {
    title: '国际音标 IPA',
    lessons: [
      { id:'i1', title:'认识音标', sub:'导学', tip:'音标是记录发音的符号。英语共 44 个音素：20 个元音 + 24 个辅音。斜杠 / / 表示“音”，不是字母。', phonemes:[
        {sym:'/iː/',tip:'长衣音，嘴角向两边拉，如 bee'},{sym:'/æ/',tip:'张大嘴的短 a，如 cat'},{sym:'/ʃ/',tip:'清辅音“诗”，如 she'},{sym:'/ŋ/',tip:'鼻音“昂”，如 sing'} ] },
      { id:'i2', title:'单元音 (1)', sub:'6 个', tip:'前元音与中元音：发音时舌头位置固定不动。', phonemes:[
        {sym:'/iː/',tip:'长衣音，如 see'},{sym:'/ɪ/',tip:'短衣音，如 sit'},{sym:'/e/',tip:'短埃音，如 bed'},{sym:'/æ/',tip:'大嘴短 a，如 cat'},{sym:'/ʌ/',tip:'短阿音，如 cup'},{sym:'/ɑː/',tip:'长阿音，如 car'} ] },
      { id:'i3', title:'单元音 (2)', sub:'6 个', tip:'后元音：舌头靠后。', phonemes:[
        {sym:'/ɒ/',tip:'短奥音，如 hot'},{sym:'/ɔː/',tip:'长奥音，如 door'},{sym:'/ʊ/',tip:'短乌音，如 book'},{sym:'/uː/',tip:'长乌音，如 food'},{sym:'/ə/',tip:'轻中央音“呃”，如 about'},{sym:'/ɜː/',tip:'长饿音，如 bird'} ] },
      { id:'i4', title:'双元音', sub:'8 个', tip:'两个元音滑动组成，前重后轻。', phonemes:[
        {sym:'/eɪ/',tip:'ei，如 day'},{sym:'/aɪ/',tip:'ai，如 eye'},{sym:'/ɔɪ/',tip:'oi，如 boy'},{sym:'/aʊ/',tip:'ao，如 out'},{sym:'/əʊ/',tip:'ou，如 go'},{sym:'/ɪə/',tip:'ia，如 ear'},{sym:'/eə/',tip:'ea，如 air'},{sym:'/ʊə/',tip:'ua，如 sure'} ] },
      { id:'i5', title:'爆破 + 摩擦 (1)', sub:'8 个辅音', tip:'爆破音气流冲破阻碍；摩擦音气流摩擦而出。', phonemes:[
        {sym:'/p/',tip:'清爆破，如 pen'},{sym:'/b/',tip:'浊爆破，如 bad'},{sym:'/t/',tip:'清爆破，如 tea'},{sym:'/d/',tip:'浊爆破，如 dog'},{sym:'/k/',tip:'清爆破，如 cat'},{sym:'/ɡ/',tip:'浊爆破，如 bag'},{sym:'/f/',tip:'清摩擦，如 fan'},{sym:'/v/',tip:'浊摩擦，如 van'} ] },
      { id:'i6', title:'爆破 + 摩擦 (2)', sub:'9 个辅音', tip:'注意咬舌音 θ/ð 与破擦音 tʃ/dʒ。', phonemes:[
        {sym:'/θ/',tip:'清咬舌，如 think'},{sym:'/ð/',tip:'浊咬舌，如 this'},{sym:'/s/',tip:'清摩擦，如 sun'},{sym:'/z/',tip:'浊摩擦，如 zoo'},{sym:'/ʃ/',tip:'清摩擦“诗”，如 she'},{sym:'/ʒ/',tip:'浊摩擦，如 vision'},{sym:'/h/',tip:'清呵气，如 hat'},{sym:'/tʃ/',tip:'清破擦“吃”，如 chair'},{sym:'/dʒ/',tip:'浊破擦“知”，如 jump'} ] },
      { id:'i7', title:'鼻音 + 其他辅音', sub:'7 个辅音', tip:'鼻音气流从鼻子出；边音与半元音流畅通过。', phonemes:[
        {sym:'/m/',tip:'双唇鼻音，如 man'},{sym:'/n/',tip:'舌尖鼻音，如 no'},{sym:'/ŋ/',tip:'后鼻音，如 sing'},{sym:'/l/',tip:'舌边音，如 leg'},{sym:'/r/',tip:'浊卷舌，如 red'},{sym:'/w/',tip:'半元音，如 we'},{sym:'/j/',tip:'半元音“耶”，如 yes'} ] },
      { id:'i8', title:'综合闯关', sub:'44 音素回顾', tip:'把单元音、双元音、辅音混在一起听辨，巩固记忆。', phonemes:[
        {sym:'/iː/',tip:'长衣，如 bee'},{sym:'/eɪ/',tip:'ei，如 day'},{sym:'/aɪ/',tip:'ai，如 eye'},{sym:'/aʊ/',tip:'ao，如 out'},{sym:'/ʃ/',tip:'诗，如 she'},{sym:'/tʃ/',tip:'吃，如 chair'},{sym:'/ŋ/',tip:'昂，如 sing'},{sym:'/θ/',tip:'咬舌，如 think'} ] }
    ]
  }
};
