/* ===== PolyGlot · Learning Progress Dashboard ===== */
window.PG_PROGRESS = (function () {
  const U = window.PG_UTILS;
  const D = window.PG_DATA;
  const S = window.PG_STORE;

  function render() {
    if (!PG_AUTH.requireAuth('progress')) return;
    const view = document.getElementById('view');
    const u = S.getUser();

    const langsLearned = Object.keys(u.langProgress || {});
    const overallPct = Math.min(100, Math.round(u.completedLessons * 3));

    // 7-day bar chart (study minutes)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toDateString();
      days.push({ label: ['日', '一', '二', '三', '四', '五', '六'][new Date(Date.now() - i * 86400000).getDay()], mins: u.activity[d] || 0 });
    }
    const maxM = Math.max(60, ...days.map(d => d.mins));

    // per-language ability bars
    const langAbility = Object.values(D.LANGS).map(L => {
      const lp = u.langProgress[L.code];
      let lvl = 0;
      if (lp) {
        const order = D.LEVELS.map(l => l.id);
        lvl = order.indexOf(lp.level) + 1;
        const lessons = (D.COURSES[L.code][lp.level] || []);
        const done = lessons.filter(l => lp.lessonsDone[l.id]).length;
        lvl = Math.min(6, lvl - 1 + (lessons.length ? done / lessons.length : 0));
      }
      return { L, ability: Math.round(lvl / 6 * 100), level: lp ? lp.level : '—' };
    });

    const nextBadge = D.ACHIEVEMENTS.find(a => !u.badges.includes(a.id));

    view.innerHTML = `
      <h2 class="section-title">学习进度</h2>
      <p class="section-sub">${U.esc(u.nickname || u.username)} 的学习仪表盘 · 连续打卡 ${u.streak} 天</p>

      <div class="stats-row">
        <div class="stat-card">
          <div class="num">${u.xp}</div>
          <div class="lbl">累计经验 XP</div>
        </div>
        <div class="stat-card">
          <div class="num">${u.streak} <span style="font-size:16px">🔥</span></div>
          <div class="lbl">连续学习天数</div>
        </div>
        <div class="stat-card">
          <div class="num">${u.vocabMastered}</div>
          <div class="lbl">已掌握单词</div>
        </div>
        <div class="stat-card">
          <div class="num">${Math.floor(u.totalMinutes / 60)}<span style="font-size:16px">h</span></div>
          <div class="lbl">累计学习时长</div>
        </div>
      </div>

      <div class="grid g2">
        <div class="card">
          <h3>📊 近 7 天学习时长</h3>
          <p class="muted" style="font-size:12px;margin-bottom:8px">坚持每日学习，保持连击 🔥</p>
          <div class="bar-chart">
            ${days.map(d => `<div class="bar" style="height:${Math.max(8, d.mins / maxM * 100)}%" title="${d.mins} 分钟"><span>${d.label}</span></div>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3>🎯 综合完成度</h3>
          <div class="ring">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="56" fill="none" stroke="var(--bg-soft)" stroke-width="12"/>
              <circle cx="65" cy="65" r="56" fill="none" stroke="url(#grad)" stroke-width="12" stroke-linecap="round"
                stroke-dasharray="${2 * Math.PI * 56}" stroke-dashoffset="${2 * Math.PI * 56 * (1 - overallPct / 100)}"/>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#4ad6ff"/></linearGradient></defs>
            </svg>
            <div class="pct">${overallPct}%</div>
          </div>
          <p class="muted" style="text-align:center;font-size:13px;margin-top:8px">已完成 ${u.completedLessons} 节课</p>
        </div>
      </div>

      <div class="grid g2 mt24">
        <div class="card">
          <h3>🈸 各语言能力</h3>
          <div style="margin-top:14px;display:flex;flex-direction:column;gap:14px">
            ${langAbility.map(a => `
              <div>
                <div class="row" style="justify-content:space-between;font-size:13px">
                  <span>${a.L.flag} ${a.L.name} <span class="muted">· ${a.level}</span></span>
                  <b>${a.ability}%</b>
                </div>
                <div class="progress-bar mt16" style="margin-top:6px"><i style="width:${a.ability}%"></i></div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3>🗓️ 近 14 天活跃</h3>
          <p class="muted" style="font-size:12px;margin-bottom:8px">颜色越深代表当日学习越久</p>
          <div class="heatmap">
            ${u.heatmap.map(l => `<div class="heat-cell ${l ? 'l' + l : ''}"></div>`).join('')}
          </div>
          <div class="row mt24" style="gap:14px;font-size:11px;color:var(--muted)">
            <span>少</span>
            <div class="heat-cell" style="width:12px;height:12px"></div>
            <div class="heat-cell l1" style="width:12px;height:12px"></div>
            <div class="heat-cell l2" style="width:12px;height:12px"></div>
            <div class="heat-cell l3" style="width:12px;height:12px"></div>
            <div class="heat-cell l4" style="width:12px;height:12px"></div>
            <span>多</span>
          </div>
          ${nextBadge ? `<div class="card mt24" style="background:var(--bg-soft);border-color:var(--line)">
            <div class="row" style="gap:10px;align-items:center">
              <span style="font-size:28px">${nextBadge.icon}</span>
              <div><b style="font-size:13px">下一个成就：${U.esc(nextBadge.name)}</b><div class="muted" style="font-size:12px">${U.esc(nextBadge.desc)}</div></div>
            </div></div>` : ''}
        </div>
      </div>

      <div class="row mt24" style="justify-content:center">
        <button class="btn btn-primary" data-route="learning">继续学习</button>
        <button class="btn btn-ghost" data-route="path">个性推荐</button>
      </div>`;

    S.evalBadges();
  }

  return { render };
})();
