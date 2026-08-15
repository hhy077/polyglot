/* ===== PolyGlot · Graded Course System ===== */
window.PG_COURSES = (function () {
  const U = window.PG_UTILS;
  const D = window.PG_DATA;
  const S = window.PG_STORE;

  let filterLang = null; // null = show all languages

  function render() {
    const view = document.getElementById('view');
    const u = S.getUser();

    // language filter chips
    const chips = `<button class="chip ${!filterLang ? 'active' : ''}" data-flang="">全部语言</button>` +
      Object.values(D.LANGS).map(l => `<button class="chip ${filterLang === l.code ? 'active' : ''}" data-flang="${l.code}">${l.flag} ${l.name}</button>`).join('');

    const langs = filterLang ? [D.LANGS[filterLang]] : Object.values(D.LANGS);

    const langBlocks = langs.map(L => {
      const lp = u ? (u.langProgress[L.code] || { level: 'A1', lessonsDone: {}, xp: 0 }) : null;
      const levels = D.LEVELS.map(lv => {
        const lessons = (D.COURSES[L.code][lv.id] || []);
        const done = lp ? lessons.filter(l => lp.lessonsDone[l.id]).length : 0;
        const pct = lessons.length ? Math.round(done / lessons.length * 100) : 0;
        const isCurrent = lp && lp.level === lv.id;
        return `
          <div class="card level-card" data-lang="${L.code}" data-level="${lv.id}">
            <div class="row" style="justify-content:space-between">
              <span class="lvl-tag level-badge-${lv.id}">${lv.id} · ${lv.name}</span>
              ${isCurrent ? '<span class="tag">学习中</span>' : ''}
            </div>
            <h3>${lv.id} ${lv.name}</h3>
            <p>${lv.desc}</p>
            <div class="progress-bar"><i style="width:${pct}%"></i></div>
            <div class="row mt16" style="justify-content:space-between">
              <span class="muted" style="font-size:12px">${done}/${lessons.length} 节 · ${pct}%</span>
              <span class="go">查看课程 →</span>
            </div>
          </div>`;
      }).join('');
      return `
        <div class="lang-block mt24">
          <div class="row" style="justify-content:space-between;align-items:center">
            <h2 class="section-title">${L.flag} ${L.name} <span class="muted" style="font-size:14px;font-weight:400">${L.native}</span></h2>
            ${u ? `<button class="btn btn-ghost btn-sm" data-setlang="${L.code}">设为当前</button>` : ''}
          </div>
          <div class="grid g3 mt16">${levels}</div>
        </div>`;
    }).join('');

    view.innerHTML = `
      <h2 class="section-title">分级课程体系</h2>
      <p class="section-sub">英语 / 日语 / 韩语 · 从 A1 入门到 C2 精通，6 级阶梯式进阶</p>
      <div class="card" style="padding:14px 18px;margin-bottom:8px">
        <div class="row">${chips}</div>
      </div>
      ${langBlocks}
      <div class="empty-state" style="padding:30px">
        <p class="muted" style="font-size:13px">每级包含单词记忆、语法练习、口语跟读、听力训练四大模块。点击任意级别开始学习。</p>
      </div>`;

    view.querySelectorAll('[data-flang]').forEach(c => c.onclick = () => { filterLang = c.dataset.flang || null; render(); });
    view.querySelectorAll('.level-card').forEach(c => c.onclick = () => {
      if (!PG_AUTH.requireAuth('courses')) return;
      S.setLang(c.dataset.lang);
      S.setLevel(c.dataset.lang, c.dataset.level);
      // jump into learning center, default to vocab module
      PG_LEARNING.setModule('vocab');
      PG_ROUTER.go('learning');
    });
    view.querySelectorAll('[data-setlang]').forEach(b => b.onclick = () => {
      S.setLang(b.dataset.setlang);
      U.toast('已切换当前语言', 'ok');
      render();
    });
  }

  return { render, setFilter: (l) => { filterLang = l; } };
})();
