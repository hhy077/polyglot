// ===== 星际防线 · 全局配置（平衡参数集中管理） =====
window.CFG = {
  canvas: { w: 480, h: 720 },

  player: {
    speed: 280,
    maxHp: 3,          // 命
    maxShield: 3,      // 护盾
    fireRate: 0.16,    // 秒/发
    maxLevel: 5,       // 火力等级
    invincible: 1.6,   // 受击无敌时间
    radius: 14,
    skill: { energyPerKill: 8, energyPerHit: 4, max: 100, duration: 4, cooldown: 8 }
  },

  bullets: {
    mySpeed: 560, enemySpeed: 210,
    myRadius: 3, enemyRadius: 4,
    crit: 0.12, critMult: 2
  },

  enemy: {
    small: { hp: 1,  score: 100, speed: 150, radius: 12, color: '#4be3ff' },
    mid:   { hp: 4,  score: 300, speed: 90,  radius: 20, color: '#ffd54a', fire: true },
    ram:   { hp: 2,  score: 150, speed: 230, radius: 14, color: '#ff5c8a', ram: true },
    elite: { hp: 12, score: 800, speed: 55,  radius: 26, color: '#b98cff', fire: true }
  },

  combo: { maxMult: 10, resetTime: 2.5 },

  boss: {
    stages: 3,
    patterns: ['fan', 'ring', 'spiral', 'random', 'aim'],
    rageHpPct: 0.25
  },

  bombsStart: 1,
  levels: 3,
  // 每关波次总数（拉长单局时长）
  levelWaves: [8, 10, 12],
  endlessWaves: 8,      // 无尽模式每波敌人数量
  endlessBossEvery: 6,  // 无尽模式每 N 波随机出现一个玩梗BOSS

  // ==== 成长升级系统（攻击/生命/防御/速度） ====
  upgrade: {
    cap: 20,                       // 每项最高等级
    attack:  { baseCost: 50,  costMult: 1.30, dmg: 0.10 },   // 每级 +10% 伤害
    hp:      { baseCost: 40,  costMult: 1.28, add: 1 },      // 每级 +1 命
    defense: { baseCost: 45,  costMult: 1.30, add: 1 },      // 每级 +1 护盾
    speed:   { baseCost: 30,  costMult: 1.26, mult: 0.04 }   // 每级 +4% 移速
  },
  coins: {
    small: 5, mid: 15, ram: 8, elite: 40, boss: 300, coinPickup: 50
  }
};

// ==== 嘲讽语料（集中管理，可替换） ====
window.TAUNTS = {
  bossEnter: [
    '哈！就凭这艘小破船？', '入侵者，欢迎来到我的星域！', '侦察兵报告，你不足为惧。'
  ],
  bossStage2: ['有点意思…让你见识真本事！', '第一阶段只是热身罢了！', '加速！我看你能躲多久！'],
  bossStage3: ['不可能！你竟然还没坠落！', '尽全力了！来体会绝望吧！'],
  bossRage: ['啊啊啊！我要你死！', '狂暴模式启动——躲不开的！', '这、这不可能……去死！'],
  eliteEnter: ['精英小队，肃清目标！', '杂鱼，趴下！', '别挡我的路！'],

  // ---- 鸡哥（第一关 BOSS · 唱跳Rap篮球梗） ----
  jigeEnter: [
    '全民制作人们，大家好！', '个人练习生鸡哥，请多指教！',
    '练习时长——两年半！', '只因你太美~ baby~'
  ],
  jigeStage2: ['你干嘛~！', '哎哟！', '唱、跳、Rap、篮球！', '律师函已经在路上了！'],
  jigeStage3: ['食不食油饼？！', '你干嘛——！！！', '我的篮球呢？！'],
  jigeRage: ['你干嘛！！！', '食不食油饼！！！', '律师函警告！！！'],

  // ---- 雨姐（第二关 BOSS · 大东北梗） ----
  yujieEnter: [
    '老妹儿，来啦？', '大东北~我的家乡~', '咱这旮沓可太热闹了！', '上炕唠会儿？'
  ],
  yujieStage2: ['上酸菜！', '这泼天的富贵来喽！', '炖它！', '粉条管够！'],
  yujieStage3: ['哎妈呀！你还挺能耐！', '老妹儿你别跑啊！', '咱家酸菜可不是白腌的！'],
  yujieRage: ['哎妈呀！气死我了！', '雨姐可不惯着你！', '老铁们，抄家伙！']
};

// ==== Boss 歌曲滚动歌词（Boss 战期间飘字） ====
window.LYRICS = {
  jitn: ['只因你太美~ baby~', '只因你实在是太美~', '你干嘛~！', '唱、跳、Rap、篮球！', '练习时长两年半~', '全民制作人们大家好~', '食不食油饼~'],
  dbd: ['大东北~我的家乡~', '山连着山~水连着水~', '哎妈呀~', '酸菜炖粉条~', '老妹儿~来啦~', '咱这旮沓贼拉热闹~', '这泼天的富贵~']
};

// ==== 关卡信息（战役模式三幕） ====
window.LEVEL_INFO = [
  { name: '练习生星域', sub: '警报：检测到唱跳Rap篮球生物' },
  { name: '黑土星域', sub: '警报：大碴子味酸雾浓度超标' },
  { name: '复仇星域', sub: '警报：双BOSS联手，务必小心！' }
];

// ==== Boss 定义（每关差异化，theme 对应玩梗 BGM） ====
window.BOSS_DEFS = [
  { name: '「练习生」鸡哥',   hp: 320, color: '#ff9f43', theme: 'jitn', patterns: ['basketball', 'rap', 'fan'] },
  { name: '「黑土」雨姐',     hp: 430, color: '#ff5c8a', theme: 'dbd',  patterns: ['cabbage', 'noodle', 'ring'] },
  { name: '「复仇」双BOSS',   hp: 0,   color: '#b98cff', theme: 'both', patterns: [] }
];
