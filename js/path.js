/* ===== PolyGlot · Personalized Learning Path Recommendation =====
 * Rules-based engine that inspects the learner's profile and progress,
 * then suggests the next concrete steps across weak modules / new levels / languages.
 */
window.PG_PATH = (function () {
  const U = window.PG_UTILS;
  const D = window.PG_DATA;
  const S = window.PG_STORE;

  function analyze(u) {
    const steps = [];
    const order = D.LEVELS.map(l => l.id);

    Object.values(D.LANGS).forEach(L => {
      const lp = u.langProgress[L.code];
      if (!lp) return; // only languages the learner has started
      const lvlIdx = order.indexOf(lp.level);
      const lessons = (D.COURSES[L.code][lp.level] || []);
      const done = lessons.filter(l => lp.lessonsDone[l.id]).length;
      const pct = lessons.length ? done / lessons.length : 0;

      // 1) if current level not finished -> finish it module by module
      if (pct < 1) {
        steps.push({
          lang: L.code, level: lp.level, priority: 10,
          title: `完成 ${L.name} ${lp.level} 级别剩余课程`,
          desc: `还差 ${lessons.length - done} 节课完成 ${lp.level}（${D.LEVELS[lvlIdx].name}）。建议优先攻克单词与听力模块。`,
          module: 'vocab', route: 'learning', tag: '继续当前'
        });
        // detect weak module: lowest completion among the 4 types by sampling
        steps.push(...weakModuleSteps(L, lp.level, u));
      } else if (lvlIdx < order.length - 1) {
        // 2) level finished -> advance
        const nextLvl = order[lvlIdx + 1];
        steps.push({
          lang: L.code, level: nextLvl, priority: 9,
          title: `挑战 ${L.name} ${nextLvl} 级别`,
          desc: `恭喜完成 ${lp.level}！准备好进入 ${nextLvl}（${D.LEVELS[lvlIdx + 1].name}）了吗？从基础单词开始新一阶段。`,
          module: 'vocab', route: 'learning', tag: '进阶升级'
        });
      } else {
        steps.push({
          lang: L.code, level: 'C2', priority: 6,
          title: `${L.name} 已达精通，保持练习`,
          desc: `你已掌握 ${L.name} 最高级别，建议通过社区分享与高级口语跟读保持语感。`,
          module: 'speaking', route: 'community', tag: '保持'
        });
      }
    });

    // 3) recommend trying a new language if user only learns 1
    if (Object.keys(u.langProgress).length < Object.keys(D.LANGS).length) {
      const tried = Object.keys(u.langProgress);
      const next = Object.values(D.LANGS).find(L => !tried.includes(L.code));
      if (next) {
        steps.push({
          lang: next.code, level: 'A1', priority: 5,
          title: `拓展语言：试试 ${next.name}`,
          desc: `掌握多种语言能激活大脑！你已经学过 ${tried.length} 种语言，推荐从 ${next.flag} ${next.name} A1 入门开始第二/第三外语。`,
          module: 'vocab', route: 'learning', tag: '新语言'
        });
      }
    }

    // 4) speaking practice if speakCount low
    if (u.speakCount < 10) {
      steps.push({
        lang: u.currentLang, level: (u.langProgress[u.currentLang] || {}).level || 'A1', priority: 8,
        title: '加强口语跟读训练',
        desc: `你只完成了 ${u.speakCount} 次跟读。口语是语言输出的关键，建议每天跟读 5 句，利用麦克风实时评分快速提升发音。`,
        module: 'speaking', route: 'learning', tag: '补短板'
      });
    }

    // 5) daily streak maintenance
    if (u.streak < 7) {
      steps.push({
        lang: u.currentLang, level: '—', priority: 4,
        title: '养成连续学习习惯',
        desc: `当前连击 ${u.streak} 天。坚持 7 天即可解锁「一周不辍」徽章，每天 15 分钟即可保持。`,
        module: 'vocab', route: 'learning', tag: '习惯养成'
      });
    }

    return steps.sort((a, b) => b.priority - a.priority);
  }

  function weakModuleSteps(L, level, u) {
    // heuristic: base weakness on usage counters
    const out = [];
    if (u.speakCount < 5) out.push({ lang: L.code, level, priority: 7, title: `${L.name} 口语模块较弱`, desc: '跟读次数较少，建议进入口语跟读模块练习发音。', module: 'speaking', route: 'learning', tag: '补短板' });
    if (u.vocabMastered < 20) out.push({ lang: L.code, level, priority: 7, title: `${L.name} 词汇量待提升`, desc: '已掌握单词较少，建议在单词记忆模块多加练习，扩充词汇基础。', module: 'vocab', route: 'learning', tag: '补短板' });
    return out;
  }

  function render() {
    if (!PG_AUTH.requireAuth('path')) return;
    const view = document.getElementById('view');
    const u = S.getUser();
    S.evalBadges();
    const steps = analyze(u);

    // derive a 4-week roadmap
    const roadmap = ['基础巩固', '专项突破', '综合应用', '挑战进阶'];

    view.innerHTML = `
      <h2 class="section-title">个性化学习路径</h2>
      <p class="section-sub">基于你的学习数据与目标，智能推荐最适合的下一步</p>

      <div class="card" style="background:linear-gradient(135deg,rgba(124,92,255,.18),rgba(74,214,255,.1));border-color:var(--brand)">
        <div class="row" style="gap:16px;align-items:center">
          <span style="font-size:40px">🧭</span>
          <div style="flex:1">
            <h3 style="margin-bottom:4px">为你定制的 4 周学习路线</h3>
            <p style="color:var(--muted);font-size:13px">目标语言：<b style="color:var(--brand-2)">${D.LANGS[u.currentLang].flag} ${D.LANGS[u.currentLang].name}</b> · 当前等级 <b style="color:var(--brand-2)">${(u.langProgress[u.currentLang] || {}).level || 'A1'}</b> · 推荐节奏：每周 3–5 次，每次 20 分钟</p>
          </div>
        </div>
        <div class="grid g4 mt24">
          ${roadmap.map((r, i) => `<div style="text-align:center;padding:12px;background:rgba(255,255,255,.05);border-radius:12px">
            <div style="font-size:12px;color:var(--brand-2);font-weight:700">第 ${i + 1} 周</div>
            <div style="font-size:14px;font-weight:600;margin-top:4px">${r}</div>
          </div>`).join('')}
        </div>
      </div>

      <h3 class="section-title mt24" style="font-size:18px">🎯 推荐学习步骤</h3>
      <div class="path-flow">
        ${steps.map((s, i) => `
          <div class="path-node ${i === 0 ? 'recommended' : ''}">
            <div class="step-no">${i + 1}</div>
            <div class="step-body">
              <div class="row" style="justify-content:space-between">
                <h4>${U.esc(s.title)}</h4>
                <span class="tag">${U.esc(s.tag)}</span>
              </div>
              <p>${U.esc(s.desc)}</p>
              <div class="row mt16" style="gap:8px">
                ${s.level !== '—' ? `<span class="muted" style="font-size:12px">${D.LANGS[s.lang].flag} ${D.LANGS[s.lang].name} · ${s.level}</span>` : ''}
                <button class="btn btn-primary btn-sm" data-go="${s.route}" data-lang="${s.lang}" data-level="${s.level}" data-mod="${s.module}">开始 →</button>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card mt24">
        <h3>💡 学习小贴士</h3>
        <ul style="color:var(--muted);font-size:13px;line-height:2;margin-top:8px;padding-left:18px">
          <li>利用「碎片时间」：通勤、排队时背诵 5 个单词，日积月累。</li>
          <li>「影子跟读法」：边听标准发音边同步跟读，有效训练语流与节奏。</li>
          <li>每周回顾错题：重做语法与听力错题，巩固薄弱知识点。</li>
          <li>多语言联动：英语好的话，日语/韩语中的外来词更易记忆。</li>
        </ul>
      </div>`;

    view.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      S.setLang(b.dataset.lang);
      if (b.dataset.level && b.dataset.level !== '—') S.setLevel(b.dataset.lang, b.dataset.level);
      PG_LEARNING.setModule(b.dataset.mod || 'vocab');
      PG_ROUTER.go(b.dataset.go);
    });
  }

  return { render, analyze };
})();
