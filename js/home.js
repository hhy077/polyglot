/* ===== PolyGlot · Home Page ===== */
window.PG_HOME = (function () {
  const U = window.PG_UTILS;
  const D = window.PG_DATA;
  const S = window.PG_STORE;

  function render() {
    const view = document.getElementById('view');
    const u = S.getUser();

    const langBubbles = Object.values(D.LANGS).map(L => {
      const lp = u ? (u.langProgress[L.code] || { xp: 0 }) : { xp: 0 };
      const total = D.LEVELS.reduce((s, lv) => s + ((D.COURSES[L.code][lv.id] || []).length), 0);
      const done = u ? (u.langProgress[L.code] ? Object.keys(u.langProgress[L.code].lessonsDone).length : 0) : 0;
      const pct = total ? Math.round(done / total * 100) : 0;
      return `<div class="lang-bubble">
        <span class="flag">${L.flag}</span>
        <div class="meta"><b>${L.name}</b><span>${L.native} · ${done}/${total} 课</span></div>
        <span class="pct">${pct}%</span>
      </div>`;
    }).join('');

    const features = [
      { icon: '📚', t: '分级课程体系', d: 'A1–C2 六级阶梯，英语/日语/韩语系统进阶', route: 'courses' },
      { icon: '🎯', t: '互动式学习', d: '单词记忆、语法练习、口语跟读、听力训练四大模块', route: 'learning' },
      { icon: '📊', t: '学习进度追踪', d: '热力图、连续打卡、能力雷达一目了然', route: 'progress' },
      { icon: '🧭', t: '个性化推荐', d: '基于学习数据智能推荐下一步学习路径', route: 'path' },
      { icon: '💬', t: '社区交流', d: '与全球语言学习者互助、打卡、分享心得', route: 'community' },
      { icon: '🏆', t: '成就激励', d: '解锁徽章、登顶排行榜，让学习充满动力', route: 'community' }
    ];

    view.innerHTML = `
      <section class="hero">
        <div>
          <h1>沉浸式多语种学习<br/>从 PolyGlot 开始</h1>
          <p>英语 · 日语 · 韩语，一站式沉浸式语言学习平台。涵盖分级课程、互动练习、口语跟读与听力训练，智能追踪进度、推荐学习路径，更有社区与成就系统激励你持续进步。</p>
          <div class="hero-actions">
            ${u
              ? `<button class="btn btn-primary" data-route="learning">继续学习 →</button>
                 <button class="btn btn-ghost" data-route="path">查看我的推荐</button>`
              : `<button class="btn btn-primary" id="startBtn">免费开始学习</button>
                 <button class="btn btn-ghost" data-route="courses">浏览课程</button>`}
          </div>
          <div class="row mt24" style="gap:24px">
            <div><b style="font-size:22px;color:var(--brand-2)">${Object.keys(D.LANGS).length}</b><span class="muted" style="font-size:13px"> 种语言</span></div>
            <div><b style="font-size:22px;color:var(--brand-2)">${D.LEVELS.length}</b><span class="muted" style="font-size:13px"> 个等级</span></div>
            <div><b style="font-size:22px;color:var(--brand-2)">4</b><span class="muted" style="font-size:13px"> 大互动模块</span></div>
            <div><b style="font-size:22px;color:var(--brand-2)">${D.ACHIEVEMENTS.length}</b><span class="muted" style="font-size:13px"> 枚成就徽章</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div style="font-size:13px;color:var(--muted)">我的语言学习</div>
          ${langBubbles}
        </div>
      </section>

      <h2 class="section-title mt24">平台能力</h2>
      <p class="section-sub">六大核心能力，打造完整学习闭环</p>
      <div class="grid g3">
        ${features.map(f => `<div class="card" data-route="${f.route}">
          <div style="font-size:30px;margin-bottom:10px">${f.icon}</div>
          <h3>${f.t}</h3>
          <p>${f.d}</p>
          <div class="row mt16"><span class="go" style="color:var(--brand-2);font-size:12px">了解更多 →</span></div>
        </div>`).join('')}
      </div>

      <h2 class="section-title mt24">语言课程一览</h2>
      <p class="section-sub">选择你感兴趣的语言，立即开启学习</p>
      <div class="grid g3">
        ${Object.values(D.LANGS).map(L => `
          <div class="card" data-langcard="${L.code}" style="cursor:pointer">
            <div style="font-size:40px">${L.flag}</div>
            <h3 style="margin-top:8px">${L.name} <span class="muted" style="font-size:13px">${L.native}</span></h3>
            <p>${D.LEVELS.length} 级课程 · 4 大互动模块 · 从入门到精通</p>
          </div>`).join('')}
      </div>`;
  }

  function bind() {
    const view = document.getElementById('view');
    if (view.__pgHomeBound) return;
    view.__pgHomeBound = true;
    view.addEventListener('click', (e) => {
      const sb = e.target.closest('#startBtn');
      if (sb) { PG_AUTH.open('register'); return; }
      const lc = e.target.closest('[data-langcard]');
      if (lc) {
        if (!PG_AUTH.requireAuth('home')) return;
        S.setLang(lc.dataset.langcard);
        PG_ROUTER.go('courses');
      }
    });
  }

  return { render, bind };
})();
