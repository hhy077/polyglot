/* ===== PolyGlot · Community + Achievements ===== */
window.PG_COMMUNITY = (function () {
  const U = window.PG_UTILS;
  const D = window.PG_DATA;
  const S = window.PG_STORE;

  const STORE_KEY = 'polyglot_posts_v1';
  function loadPosts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      return saved && saved.length ? saved : D.SEED_POSTS.slice();
    } catch { return D.SEED_POSTS.slice(); }
  }
  function savePosts(p) { localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

  function render() {
    if (!PG_AUTH.requireAuth('community')) return;
    const view = document.getElementById('view');
    const u = S.getUser();
    S.evalBadges();

    const posts = loadPosts();
    const badges = D.ACHIEVEMENTS;

    // leaderboard (mix current user with seeds + other stored users)
    const lb = buildLeaderboard(u);

    view.innerHTML = `
      <h2 class="section-title">学习社区</h2>
      <p class="section-sub">与全球语言学习者交流心得、互相激励</p>

      <div class="com-layout">
        <div>
          <div class="compose">
            <div class="row" style="align-items:center;gap:10px">
              <span class="avatar">${U.esc((u.nickname || u.username).slice(0, 1))}</span>
              <b style="font-size:14px">${U.esc(u.nickname || u.username)}</b>
              <select id="postLang" style="margin-left:auto;max-width:140px">
                ${Object.values(D.LANGS).map(L => `<option value="${L.code}">${L.flag} ${L.name}</option>`).join('')}
              </select>
            </div>
            <textarea id="postBody" placeholder="分享你的学习心得、提问或打卡…"></textarea>
            <div class="row" style="justify-content:space-between">
              <span class="muted" style="font-size:12px">发动态可获得 15 XP</span>
              <button class="btn btn-primary btn-sm" id="postBtn">发布</button>
            </div>
          </div>

          <div id="postList">
            ${posts.map((p, i) => renderPost(p, i)).join('')}
          </div>
        </div>

        <div>
          <div class="card">
            <h3>🏆 成就徽章</h3>
            <p class="muted" style="font-size:12px;margin-bottom:14px">已解锁 ${u.badges.length}/${badges.length}</p>
            <div class="badges-grid">
              ${badges.map(b => `
                <div class="badge ${u.badges.includes(b.id) ? '' : 'locked'}" title="${U.esc(b.desc)}">
                  <span class="ico">${b.icon}</span>
                  <div class="nm">${U.esc(b.name)}</div>
                  <div class="desc">${U.esc(b.desc)}</div>
                </div>`).join('')}
            </div>
          </div>

          <div class="card mt24">
            <h3>👑 学习排行榜</h3>
            <p class="muted" style="font-size:12px;margin-bottom:14px">本周 XP 排名</p>
            ${lb.map((r, i) => `
              <div class="lb-row ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''} ${r.me ? '' : ''}" style="${r.me ? 'border:1px solid var(--brand)' : ''}">
                <span class="lb-rank">${i + 1}</span>
                <span class="avatar" style="width:30px;height:30px;font-size:13px">${U.esc((r.name).slice(0, 1))}</span>
                <span style="font-size:13px">${U.esc(r.name)}${r.me ? ' <span class="tag" style="margin-left:6px">我</span>' : ''}</span>
                <span class="pts">${r.xp} XP</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

    document.getElementById('postBtn').onclick = () => {
      const body = document.getElementById('postBody').value.trim();
      const lang = document.getElementById('postLang').value;
      if (!body) { U.toast('请输入内容', 'err'); return; }
      const newPost = {
        user: u.nickname || u.username, avatar: (u.nickname || u.username).slice(0, 1),
        lang, when: '刚刚', body, likes: 0, comments: 0
      };
      posts.unshift(newPost);
      savePosts(posts);
      S.recordPost();
      const newly = S.evalBadges();
      U.toast(newly.length ? `发布成功 +15 XP，解锁成就：${newly[0].name}` : '发布成功 +15 XP', 'ok');
      render();
    };

    // like & comment handlers (delegated)
    view.querySelectorAll('[data-like]').forEach(el => el.onclick = () => {
      const i = +el.dataset.like;
      posts[i].likes++;
      savePosts(posts);
      el.querySelector('b').textContent = posts[i].likes;
    });
    view.querySelectorAll('[data-comment]').forEach(el => el.onclick = () => {
      const i = +el.dataset.comment;
      const c = prompt('发表评论：');
      if (c) { posts[i].comments++; savePosts(posts); el.querySelector('b').textContent = posts[i].comments; U.toast('评论成功', 'ok'); }
    });
  }

  function renderPost(p, i) {
    return `<div class="post">
      <div class="post-head">
        <span class="avatar">${U.esc(p.avatar || (p.user || 'U').slice(0, 1))}</span>
        <div>
          <b>${U.esc(p.user)}</b>
          <div class="when"><span class="tag">${D.LANGS[p.lang] ? D.LANGS[p.lang].flag + ' ' + D.LANGS[p.lang].name : ''}</span> · ${U.esc(p.when)}</div>
        </div>
      </div>
      <div class="post-body">${U.esc(p.body)}</div>
      <div class="post-actions">
        <span data-like="${i}">👍 <b>${p.likes}</b></span>
        <span data-comment="${i}">💬 <b>${p.comments}</b></span>
        <span>🔗 分享</span>
      </div>
    </div>`;
  }

  function buildLeaderboard(u) {
    const list = [
      { name: '小语', xp: 1820 },
      { name: 'Alex', xp: 1450 },
      { name: '桃子', xp: 1190 },
      { name: 'Mina', xp: 960 },
      { name: 'Kenji', xp: 720 }
    ];
    list.push({ name: u.nickname || u.username, xp: u.xp, me: true });
    return list.sort((a, b) => b.xp - a.xp).slice(0, 6);
  }

  return { render };
})();
