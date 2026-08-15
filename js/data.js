/* ===== PolyGlot · Course Data =====
 * Languages: en (英语), ja (日语), ko (韩语)
 * Levels: A1 A2 B1 B2 C1 C2
 * Modules per lesson: vocab / grammar / speaking / listening
 */
window.PG_DATA = (function () {

  const LANGS = {
    en: { code: 'en', name: '英语', native: 'English', flag: '🇺🇸', voice: 'en-US', ttsRate: 0.9 },
    ja: { code: 'ja', name: '日语', native: '日本語', flag: '🇯🇵', voice: 'ja-JP', ttsRate: 0.85 },
    ko: { code: 'ko', name: '韩语', native: '한국어', flag: '🇰🇷', voice: 'ko-KR', ttsRate: 0.85 }
  };

  const LEVELS = [
    { id: 'A1', name: '入门', desc: '掌握基础日常问候与简单词汇' },
    { id: 'A2', name: '初级', desc: '能进行简单的日常对话与表达' },
    { id: 'B1', name: '中级', desc: '流畅讨论熟悉话题，理解文章主旨' },
    { id: 'B2', name: '中高级', desc: '能就抽象话题深入交流，表达观点' },
    { id: 'C1', name: '高级', desc: '理解长篇复杂文本，灵活运用语言' },
    { id: 'C2', name: '精通', desc: '接近母语水平，无障碍理解表达' }
  ];

  // ---- Vocabulary banks ----
  const VOCAB = {
    en: {
      A1: [
        { w: 'hello', t: '你好', rom: 'həˈloʊ' },
        { w: 'thank you', t: '谢谢', rom: 'θæŋk juː' },
        { w: 'water', t: '水', rom: 'ˈwɔːtər' },
        { w: 'book', t: '书', rom: 'bʊk' },
        { w: 'friend', t: '朋友', rom: 'frend' },
        { w: 'school', t: '学校', rom: 'skuːl' },
        { w: 'apple', t: '苹果', rom: 'ˈæpəl' },
        { w: 'morning', t: '早晨', rom: 'ˈmɔːrnɪŋ' }
      ],
      A2: [
        { w: 'neighbor', t: '邻居', rom: 'ˈneɪbər' },
        { w: 'weather', t: '天气', rom: 'ˈweðər' },
        { w: 'kitchen', t: '厨房', rom: 'ˈkɪtʃən' },
        { w: 'journey', t: '旅程', rom: 'ˈdʒɜːrni' },
        { w: 'remember', t: '记得', rom: 'rɪˈmɛmbər' },
        { w: 'holiday', t: '假期', rom: 'ˈhɑːlɪdeɪ' }
      ],
      B1: [
        { w: 'experience', t: '经验', rom: 'ɪkˈspɪriəns' },
        { w: 'opportunity', t: '机会', rom: 'ˌɑːpərˈtuːnəti' },
        { w: 'challenge', t: '挑战', rom: 'ˈtʃælɪndʒ' },
        { w: 'environment', t: '环境', rom: 'ɪnˈvaɪrənmənt' },
        { w: 'decision', t: '决定', rom: 'dɪˈsɪʒən' },
        { w: 'achievement', t: '成就', rom: 'əˈtʃiːvmənt' }
      ],
      B2: [
        { w: 'sophisticated', t: '复杂精密的', rom: 'səˈfɪstɪkeɪtɪd' },
        { w: 'comprehensive', t: '全面的', rom: 'ˌkɑːmprɪˈhensɪv' },
        { w: 'negotiate', t: '谈判', rom: 'nɪˈɡoʊʃieɪt' },
        { w: 'inevitable', t: '不可避免的', rom: 'ɪnˈevɪtəbl' }
      ],
      C1: [
        { w: 'meticulous', t: '一丝不苟的', rom: 'məˈtɪkjələs' },
        { w: 'pragmatic', t: '务实的', rom: 'præɡˈmætɪk' },
        { w: 'ambiguous', t: '模棱两可的', rom: 'æmˈbɪɡjuəs' }
      ],
      C2: [
        { w: 'ephemeral', t: '短暂的', rom: 'ɪˈfemərəl' },
        { w: 'ubiquitous', t: '无处不在的', rom: 'juːˈbɪkwɪtəs' }
      ]
    },
    ja: {
      A1: [
        { w: 'こんにちは', t: '你好', rom: 'konnichiwa' },
        { w: 'ありがとう', t: '谢谢', rom: 'arigatou' },
        { w: 'みず', t: '水', rom: 'mizu' },
        { w: 'ほん', t: '书', rom: 'hon' },
        { w: 'ともだち', t: '朋友', rom: 'tomodachi' },
        { w: 'がっこう', t: '学校', rom: 'gakkou' },
        { w: 'りんご', t: '苹果', rom: 'ringo' },
        { w: 'あさ', t: '早晨', rom: 'asa' }
      ],
      A2: [
        { w: 'てんき', t: '天气', rom: 'tenki' },
        { w: 'だいどころ', t: '厨房', rom: 'daidokoro' },
        { w: 'りょこう', t: '旅行', rom: 'ryokou' },
        { w: 'おぼえる', t: '记住', rom: 'oboeru' },
        { w: 'やすみ', t: '休息/假期', rom: 'yasumi' }
      ],
      B1: [
        { w: 'けいけん', t: '经验', rom: 'keiken' },
        { w: 'きかい', t: '机会', rom: 'kikai' },
        { w: 'ちょうせん', t: '挑战', rom: 'chousen' },
        { w: 'かんきょう', t: '环境', rom: 'kankyou' },
        { w: 'けってい', t: '决定', rom: 'kettei' }
      ],
      B2: [
        { w: '包括的(ほうかつてき)', t: '全面的', rom: 'houkatsuteki' },
        { w: '交渉(こうしょう)', t: '谈判', rom: 'koushou' },
        { w: '不可避(ふかひ)', t: '不可避免的', rom: 'fukahi' }
      ],
      C1: [
        { w: '曖昧(あいまい)', t: '模棱两可的', rom: 'aimai' },
        { w: '几帳面(きちょうめん)', t: '一丝不苟的', rom: 'kichoumen' }
      ],
      C2: [
        { w: '普遍的(ふへんてき)', t: '无处不在的', rom: 'fuhenteki' }
      ]
    },
    ko: {
      A1: [
        { w: '안녕하세요', t: '你好', rom: 'annyeonghaseyo' },
        { w: '감사합니다', t: '谢谢', rom: 'gamsahamnida' },
        { w: '물', t: '水', rom: 'mul' },
        { w: '책', t: '书', rom: 'chaek' },
        { w: '친구', t: '朋友', rom: 'chingu' },
        { w: '학교', t: '学校', rom: 'hakgyo' },
        { w: '사과', t: '苹果', rom: 'sagwa' },
        { w: '아침', t: '早晨', rom: 'achim' }
      ],
      A2: [
        { w: '날씨', t: '天气', rom: 'nalssi' },
        { w: '부엌', t: '厨房', rom: 'bueok' },
        { w: '여행', t: '旅行', rom: 'yeohaeng' },
        { w: '기억하다', t: '记住', rom: 'gieokhada' },
        { w: '휴가', t: '假期', rom: 'hyuga' }
      ],
      B1: [
        { w: '경험', t: '经验', rom: 'gyeongheom' },
        { w: '기회', t: '机会', rom: 'gihoe' },
        { w: '도전', t: '挑战', rom: 'dojeon' },
        { w: '환경', t: '环境', rom: 'hwangyeong' },
        { w: '결정', t: '决定', rom: 'gyeoljeong' }
      ],
      B2: [
        { w: '포괄적인', t: '全面的', rom: 'pogwaljeogin' },
        { w: '협상', t: '谈判', rom: 'hyeopsang' },
        { w: '불가피한', t: '不可避免的', rom: 'bulgapihan' }
      ],
      C1: [
        { w: '애매한', t: '模棱两可的', rom: 'aemaehan' },
        { w: '꼼꼼한', t: '一丝不苟的', rom: 'kkomkkomhan' }
      ],
      C2: [
        { w: '보편적인', t: '无处不在的', rom: 'bopyeonjeogin' }
      ]
    }
  };

  // ---- Grammar notes ----
  const GRAMMAR = {
    en: {
      A1: [
        { q: '选择正确句子（be 动词）', q2: '主语 I', opts: ['I am a student.', 'I is a student.', 'I are a student.', 'I be a student.'], ans: 0 },
        { q: '选择正确冠词', q2: '___ apple a day', opts: ['A', 'An', 'The', '—'], ans: 1 },
        { q: '选择正确物主代词', q2: 'This is ___ book. (我的)', opts: ['my', 'me', 'I', 'mine'], ans: 0 }
      ],
      A2: [
        { q: '选择正确过去式', q2: 'Yesterday I ___ to school.', opts: ['go', 'goed', 'went', 'gone'], ans: 2 },
        { q: '选择正确介词', q2: 'I was born ___ 2001.', opts: ['on', 'at', 'in', 'by'], ans: 2 }
      ],
      B1: [
        { q: '选择正确现在完成时', q2: 'She ___ here since 2010.', opts: ['lived', 'has lived', 'is living', 'lives'], ans: 1 },
        { q: '选择正确被动语态', q2: 'The letter ___ yesterday.', opts: ['sent', 'was sent', 'is sent', 'sending'], ans: 1 }
      ],
      B2: [
        { q: '虚拟语气', q2: 'If I ___ rich, I would travel.', opts: ['am', 'was', 'were', 'be'], ans: 2 }
      ],
      C1: [{ q: '倒装句', q2: 'Never ___ such a thing.', opts: ['I have seen', 'have I seen', 'I saw', 'did I see'], ans: 1 }],
      C2: [{ q: '强调句', q2: 'It was in 1990 ___ the company started.', opts: ['that', 'which', 'when', 'in which'], ans: 0 }]
    },
    ja: {
      A1: [
        { q: '选择正确助词（は/が）', q2: '私___学生です。', opts: ['は', 'が', 'を', 'に'], ans: 0 },
        { q: '选择正确丁宁语结尾', q2: 'これは本___。', opts: ['です', 'ます', 'だ', 'の'], ans: 0 },
        { q: '选择正确疑问词', q2: '___ですか？（这是什么）', opts: ['だれ', 'なに', 'どこ', 'いつ'], ans: 1 }
      ],
      A2: [
        { q: '选择正确过去式', q2: '昨日、学校に___。', opts: ['行きます', '行きました', '行く', '行って'], ans: 1 },
        { q: '选择正确助词（方向）', q2: '日本___行きます。', opts: ['で', 'に', 'を', 'が'], ans: 1 }
      ],
      B1: [
        { q: '选择正确可能形', q2: '日本語が___。', opts: ['話します', '話せます', '話させる', '話した'], ans: 1 },
        { q: '选择正确使役形', q2: '子供に___。', opts: ['勉強します', '勉強させます', '勉強できます', '勉強しました'], ans: 1 }
      ],
      B2: [{ q: '敬语选择', q2: '先生はもう___か。', opts: ['帰ります', 'お帰りになります', '帰られる', '帰って'], ans: 1 }],
      C1: [{ q: '选择正确条件形', q2: '雨なら、___。', opts: ['行きます', '行きません', '行った', '行こう'], ans: 1 }],
      C2: [{ q: '古典助动词', q2: '選択: べしの意味', opts: ['义务/应当', '过去', '否定', '疑问'], ans: 0 }]
    },
    ko: {
      A1: [
        { q: '选择正确主格助词', q2: '저___ 학생이에요. (我是学生)', opts: ['는', '가', '을', '에'], ans: 1 },
        { q: '选择正确终结词', q2: '이것은 책___.', opts: ['입니다', '습니다', '해요', '는다'], ans: 0 },
        { q: '选择正确疑问词', q2: '___예요? (这是什么)', opts: ['누구', '뭐', '어디', '언제'], ans: 1 }
      ],
      A2: [
        { q: '选择正确过去式', q2: '어제 학교에___.', opts: ['갑니다', '갔습니다', '가요', '가다'], ans: 1 },
        { q: '选择正确方向助词', q2: '한국___ 갑니다.', opts: ['에서', '에', '을', '가'], ans: 1 }
      ],
      B1: [
        { q: '选择正确能动词尾', q2: '한국어를___.', opts: ['합니다', '할 수 있습니다', '하게 합니다', '했습니다'], ans: 1 }
      ],
      B2: [{ q: '敬语选择', q2: '선생님께서 이미___.', opts: ['가십니다', '가셨습니다', '가요', '가'], ans: 1 }],
      C1: [{ q: '条件句', q2: '비가 오면___.', opts: ['갑니다', '안 갑니다', '갔어요', '가자'], ans: 1 }],
      C2: [{ q: '汉字词理解', q2: '選擇(선택)의 의미', opts: ['选择', '过去', '否定', '疑问'], ans: 0 }]
    }
  };

  // ---- Speaking (跟读) sentences ----
  const SPEAKING = {
    en: {
      A1: ['Hello, how are you?', 'My name is Tom.', 'I like apples.'],
      A2: ['What is the weather like today?', 'I went to the park yesterday.'],
      B1: ['I have been studying English for three years.', 'Could you tell me the way to the station?'],
      B2: ['I would appreciate it if you could consider my application.'],
      C1: ['Notwithstanding the challenges, the team delivered remarkable results.'],
      C2: ['The ephemeral nature of fashion underscores the ubiquity of change.']
    },
    ja: {
      A1: ['こんにちは、お元気ですか？', '私の名前は田中です。', 'りんごが好きです。'],
      A2: ['今日の天気はどうですか？', '昨日、公園に行きました。'],
      B1: ['日本語を3年間勉強しています。', '駅への道を教えてください。'],
      B2: ['ご応募をご検討いただけますと幸いです。'],
      C1: ['困難にもかかわらず、チームは素晴らしい成果を上げました。'],
      C2: ['流行の儚さは、変化の遍在性を物語っている。']
    },
    ko: {
      A1: ['안녕하세요, 잘 지내세요?', '제 이름은 김민수입니다.', '사과를 좋아합니다.'],
      A2: ['오늘 날씨가 어떤가요?', '어제 공원에 갔어요.'],
      B1: ['한국어를 3년째 배우고 있어요.', '역으로 가는 길을 알려주시겠어요?'],
      B2: ['제 지원을 검토해 주시면 감사하겠습니다.'],
      C1: ['어려움에도 불구하고 팀은 훌륭한 성과를 거두었습니다.'],
      C2: ['유행의 덧없음은 변화의 보편성을 말해줍니다.']
    }
  };

  // ---- Listening sentences (dictation / choice) ----
  const LISTENING = {
    en: {
      A1: [
        { text: 'I have a cat.', opts: ['I have a cat.', 'I have a car.', 'I have a cap.', 'I have a cup.'], ans: 0 },
        { text: 'She is my sister.', opts: ['She is my sister.', 'She is my teacher.', 'She is my mother.', 'She is my friend.'], ans: 0 }
      ],
      A2: [
        { text: 'The train arrives at noon.', opts: ['The train arrives at noon.', 'The bus arrives at noon.', 'The train leaves at noon.', 'The train arrives at night.'], ans: 0 }
      ],
      B1: [
        { text: 'They have already finished the project.', opts: ['They have already finished the project.', 'They are finishing the project.', 'They will finish the project.', 'They finished the project.'], ans: 0 }
      ],
      B2: [{ text: 'The committee will review the proposal next week.', opts: ['The committee will review the proposal next week.', 'The committee reviewed the proposal.', 'The committee rejects the proposal.', 'The committee submits the proposal.'], ans: 0 }],
      C1: [{ text: 'Notwithstanding the difficulties, we prevailed.', opts: ['Notwithstanding the difficulties, we prevailed.', 'Because of the difficulties, we failed.', 'Despite the difficulties, we struggled.', 'The difficulties were overwhelming.'], ans: 0 }],
      C2: [{ text: 'The ubiquity of smartphones has transformed communication.', opts: ['The ubiquity of smartphones has transformed communication.', 'Smartphones are rare and expensive.', 'Communication has remained unchanged.', 'Smartphones have no impact.'], ans: 0 }]
    },
    ja: {
      A1: [
        { text: '私は猫を飼っています。', opts: ['私は猫を飼っています。', '私は犬を飼っています。', '私は車を持っています。', '私は本を読みます。'], ans: 0 }
      ],
      A2: [{ text: '電車は昼に着きます。', opts: ['電車は昼に着きます。', 'バスは昼に着きます。', '電車は夜に着きます。', '電車は朝に出ます。'], ans: 0 }],
      B1: [{ text: '彼らはもうプロジェクトを終えました。', opts: ['彼らはもうプロジェクトを終えました。', '彼らはプロジェクトを終えるところです。', '彼らはプロジェクトを終えます。', '彼らはプロジェクトを終わらせた。'], ans: 0 }],
      B2: [{ text: '委員会は来週提案を審査します。', opts: ['委員会は来週提案を審査します。', '委員会は提案を審査しました。', '委員会は提案を却下します。', '委員会は提案を提出します。'], ans: 0 }],
      C1: [{ text: '困難にもかかわらず、私たちは勝ちました。', opts: ['困難にもかかわらず、私たちは勝ちました。', '困難のために負けました。', '困難だったが戦った。', '困難は圧倒的だった。'], ans: 0 }],
      C2: [{ text: 'スマホの普及がコミュニケーションを変えた。', opts: ['スマホの普及がコミュニケーションを変えた。', 'スマホは珍しく高価だ。', 'コミュニケーションは変わっていない。', 'スマホは影響がない。'], ans: 0 }]
    },
    ko: {
      A1: [{ text: '저는 고양이를 키워요.', opts: ['저는 고양이를 키워요.', '저는 강아지를 키워요.', '저는 차를 가지고 있어요.', '저는 책을 읽어요.'], ans: 0 }],
      A2: [{ text: '기차는 낮에 도착해요.', opts: ['기차는 낮에 도착해요.', '버스는 낮에 도착해요.', '기차는 밤에 도착해요.', '기차는 아침에 출발해요.'], ans: 0 }],
      B1: [{ text: '그들은 이미 프로젝트를 끝냈어요.', opts: ['그들은 이미 프로젝트를 끝냈어요.', '그들은 프로젝트를 끝내는 중이에요.', '그들은 프로젝트를 끝낼 거예요.', '그들은 프로젝트를 끝냈습니다.'], ans: 0 }],
      B2: [{ text: '위원회는 다음 주에 제안을 검토합니다.', opts: ['위원회는 다음 주에 제안을 검토합니다.', '위원회는 제안을 검토했습니다.', '위원회는 제안을 거절합니다.', '위원회는 제안을 제출합니다.'], ans: 0 }],
      C1: [{ text: '어려움에도 불구하고 우리가 이겼어요.', opts: ['어려움에도 불구하고 우리가 이겼어요.', '어려움 때문에 졌어요.', '어려웠지만 싸웠어요.', '어려움이 압도적이었어요.'], ans: 0 }],
      C2: [{ text: '스마트폰의 보편화가 소통을 바꿨어요.', opts: ['스마트폰의 보편화가 소통을 바꿨어요.', '스마트폰은 희귀하고 비싸요.', '소통은 변하지 않았어요.', '스마트폰은 영향이 없어요.'], ans: 0 }]
    }
  };

  // ---- Lesson plan generator: each level has lessons combining all 4 modules ----
  function buildLessons(lang) {
    const out = {};
    LEVELS.forEach(lv => {
      const v = (VOCAB[lang][lv.id] || []).slice();
      const g = (GRAMMAR[lang][lv.id] || []).slice();
      const s = (SPEAKING[lang][lv.id] || []).slice();
      const li = (LISTENING[lang][lv.id] || []).slice();
      const count = Math.max(v.length, g.length, s.length, li.length, 4);
      const lessons = [];
      for (let i = 0; i < count; i++) {
        lessons.push({
          id: `${lang}-${lv.id}-${i + 1}`,
          idx: i + 1,
          title: `${LANGS[lang].native} · ${lv.id} 第${i + 1}课`,
          vocab: v[i % Math.max(v.length, 1)] || null,
          grammar: g[i % Math.max(g.length, 1)] || null,
          speaking: s[i % Math.max(s.length, 1)] || null,
          listening: li[i % Math.max(li.length, 1)] || null
        });
      }
      out[lv.id] = lessons;
    });
    return out;
  }

  const COURSES = {};
  Object.keys(LANGS).forEach(l => { COURSES[l] = buildLessons(l); });

  // ---- Achievements ----
  const ACHIEVEMENTS = [
    { id: 'first_step', icon: '🌱', name: '初出茅庐', desc: '完成第一节课', check: s => s.completedLessons >= 1 },
    { id: 'streak3', icon: '🔥', name: '三日连击', desc: '连续学习3天', check: s => s.streak >= 3 },
    { id: 'streak7', icon: '⚡', name: '一周不辍', desc: '连续学习7天', check: s => s.streak >= 7 },
    { id: 'vocab50', icon: '📚', name: '词汇新星', desc: '掌握50个单词', check: s => s.vocabMastered >= 50 },
    { id: 'vocab200', icon: '📖', name: '词汇大师', desc: '掌握200个单词', check: s => s.vocabMastered >= 200 },
    { id: 'polyglot', icon: '🌍', name: '多语达人', desc: '学习2种以上语言', check: s => Object.keys(s.langProgress || {}).length >= 2 },
    { id: 'levelup', icon: '⭐', name: '更上一层', desc: '完成任意级别所有课程', check: s => s.levelCompleted },
    { id: 'social', icon: '💬', name: '社区之声', desc: '发表第一条动态', check: s => s.postsCount >= 1 },
    { id: 'speak20', icon: '🎤', name: '口语练习生', desc: '完成20次跟读', check: s => s.speakCount >= 20 },
    { id: 'perfect', icon: '💯', name: '完美主义者', desc: '获得10次满分练习', check: s => s.perfectRuns >= 10 },
    { id: 'marathon', icon: '🏃', name: '学习马拉松', desc: '累计学习10小时', check: s => s.totalMinutes >= 600 },
    { id: 'explorer', icon: '🧭', name: '探索先锋', desc: '完成全部3种语言体验', check: s => (s.langsTried || []).length >= 3 }
  ];

  // ---- Community seed posts ----
  const SEED_POSTS = [
    { user: '小语', avatar: '语', lang: 'ja', when: '2小时前', body: '今天终于搞懂了「は」和「が」的区别！は是主题，が是主语，记笔记记笔记 📝', likes: 24, comments: 5 },
    { user: 'Mina', avatar: 'M', lang: 'ko', when: '5小时前', body: '韩语发音规则也太多了吧… 连音、鼻音化、腭化… 大家都是怎么记的呀？', likes: 18, comments: 8 },
    { user: 'Alex', avatar: 'A', lang: 'en', when: '昨天', body: '坚持跟读一周，感觉口语明显流畅了！PolyGlot 的跟读功能真的好用 🎤', likes: 41, comments: 12 },
    { user: '桃子', avatar: '桃', lang: 'ja', when: '2天前', body: '推荐大家用「影子跟读法」练听力，先盲听再对照文本，效果翻倍！', likes: 33, comments: 7 }
  ];

  return { LANGS, LEVELS, VOCAB, GRAMMAR, SPEAKING, LISTENING, COURSES, ACHIEVEMENTS, SEED_POSTS };
})();
