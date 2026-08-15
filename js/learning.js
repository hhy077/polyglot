/* ===== PolyGlot · Interactive Learning Modules =====
 * Modules: vocab (单词记忆) / grammar (语法练习) / speaking (口语跟读) / listening (听力训练)
 */
window.PG_LEARNING = (function () {
  const U = window.PG_UTILS;
  const D = window.PG_DATA;
  const S = window.PG_STORE;

  let activeModule = 'vocab';
  let queue = [];       // lesson items for current level
  let idx = 0;
  let correctCount = 0;
  let attemptCount = 0;
  let studyStart = 0;

  // module renderers write into #moduleArea so the language/level selector stays
  function target() {
    return document.getElementById('moduleArea') || document.getElementById('view');
  }

  function currentLang() {
    const u = S.getUser();
    return u ? u.currentLang : 'en';
  }
  function currentLevel() {
    const u = S.getUser();
    if (!u) return 'A1';
    return (u.langProgress[u.currentLang] || {}).level || 'A1';
  }

  function buildQueue() {
    const lang = currentLang();
    const level = currentLevel();
    const lessons = (D.COURSES[lang] || {})[level] || [];
    queue = lessons.slice();
    idx = 0; correctCount = 0; attemptCount = 0; studyStart = Date.now();
  }

  // ---------- Vocabulary: matching game ----------
  function renderVocab() {
    const lang = currentLang();
    const level = currentLevel();
    const lesson = queue[idx];
    const item = lesson && lesson.vocab;
    const view = target();

    if (!item) {
      return renderDone();
    }
    // build a matching board: target word + 3 distractors, all matched to translations
    const bank = (D.VOCAB[lang][level] || []).filter(v => v.w !== item.w);
    const distractors = shuffle(bank).slice(0, 3);
    const opts = shuffle([item, ...distractors]);
    const leftCol = shuffle([item, ...distractors]);
    const rightCol = opts.map(o => ({ w: o.t, key: o.w }));

    view.innerHTML = `
      <h2 class="section-title">单词记忆 · ${D.LANGS[lang].flag} ${D.LANGS[lang].native}</h2>
      <p class="section-sub">将左侧单词与右侧中文释义配对 · ${level} · 第 ${idx + 1}/${queue.length} 题</p>
      <div class="module-tabs"></div>
      ${moduleTabsHTML('vocab')}
      <div class="quiz-box">
        <div class="quiz-q">🎯 匹配单词与释义</div>
        <p class="quiz-hint">点击左侧单词，再点击对应的中文。听读音请点击 🔊</p>
        <div class="match-grid mt16" id="matchBoard">
          <div class="match-col" id="leftCol">
            ${leftCol.map(o => `<div class="match-item" data-key="${U.esc(o.w)}" data-side="L">${U.esc(o.w)} <span style="font-size:12px;cursor:pointer" data-pron="${U.esc(o.w)}">🔊</span></div>`).join('')}
          </div>
          <div class="match-col" id="rightCol">
            ${rightCol.map(o => `<div class="match-item" data-key="${U.esc(o.w)}" data-side="R">${U.esc(o.w)}</div>`).join('')}
          </div>
        </div>
        <div class="quiz-footer">
          <span class="streak-pill">✅ 正确 ${correctCount}</span>
          <button class="btn btn-ghost btn-sm" id="skipBtn">跳过本题</button>
        </div>
      </div>`;

    let selL = null, selR = null;
    const board = document.getElementById('matchBoard');
    board.querySelectorAll('[data-pron]').forEach(el => {
      el.onclick = (e) => { e.stopPropagation(); U.speak(el.dataset.pron, D.LANGS[lang].voice); };
    });
    board.querySelectorAll('.match-item').forEach(el => {
      el.onclick = () => {
        if (el.classList.contains('matched')) return;
        el.classList.add('sel');
        if (el.dataset.side === 'L') {
          board.querySelectorAll('#leftCol .sel').forEach(x => { if (x !== el) x.classList.remove('sel'); });
          selL = el;
        } else {
          board.querySelectorAll('#rightCol .sel').forEach(x => { if (x !== el) x.classList.remove('sel'); });
          selR = el;
        }
        if (selL && selR) {
          attemptCount++;
          if (selL.dataset.key === selR.dataset.key) {
            selL.classList.add('matched'); selR.classList.add('matched');
            selL.classList.remove('sel'); selR.classList.remove('sel');
            correctCount++;
            if (selL.dataset.key === item.w) {
              // matched the target -> mastered
              S.addVocab(lang, item.w);
              U.toast('掌握新单词：' + item.w, 'ok');
              setTimeout(() => { idx++; saveIfComplete(); renderVocab(); }, 600);
            }
            selL = null; selR = null;
          } else {
            selL.classList.add('wrong'); selR.classList.add('wrong');
            setTimeout(() => { selL && selL.classList.remove('sel', 'wrong'); selR && selR.classList.remove('sel', 'wrong'); selL = null; selR = null; }, 500);
          }
        }
      };
    });
    document.getElementById('skipBtn').onclick = () => { idx++; renderVocab(); };
  }

  // ---------- Grammar: multiple choice ----------
  function renderGrammar() {
    const lang = currentLang();
    const lesson = queue[idx];
    const g = lesson && lesson.grammar;
    const view = target();
    if (!g) return renderDone();
    view.innerHTML = `
      <h2 class="section-title">语法练习 · ${D.LANGS[lang].flag} ${D.LANGS[lang].native}</h2>
      <p class="section-sub">选择正确答案 · 第 ${idx + 1}/${queue.length} 题</p>
      ${moduleTabsHTML('grammar')}
      <div class="quiz-box">
        <div class="quiz-q">📝 ${U.esc(g.q)}</div>
        <p class="quiz-hint">${U.esc(g.q2 || '')}</p>
        <div class="options" id="opts">
          ${g.opts.map((o, i) => `<button class="opt" data-i="${i}">${U.esc(o)}</button>`).join('')}
        </div>
        <div class="quiz-footer">
          <span class="streak-pill">✅ 正确 ${correctCount}/${attemptCount || 0}</span>
          <span class="muted" id="fb"></span>
        </div>
      </div>`;
    document.querySelectorAll('#opts .opt').forEach(btn => {
      btn.onclick = () => {
        attemptCount++;
        const i = +btn.dataset.i;
        document.querySelectorAll('#opts .opt').forEach(b => b.disabled = true);
        if (i === g.ans) {
          btn.classList.add('correct');
          correctCount++;
          document.getElementById('fb').innerHTML = '<span style="color:var(--ok)">回答正确！</span>';
          S.completeLesson(lang, currentLevel(), lesson.id, 20);
        } else {
          btn.classList.add('wrong');
          document.querySelectorAll('#opts .opt')[g.ans].classList.add('correct');
          document.getElementById('fb').innerHTML = '<span style="color:var(--danger)">再接再厉，正确答案已高亮</span>';
        }
        if (attemptCount === queue.length && correctCount === queue.length) S.recordPerfect();
        setTimeout(() => { idx++; renderGrammar(); }, 1100);
      };
    });
  }

  // ---------- Speaking: 跟读 with speech recognition ----------
  function renderSpeaking() {
    const lang = currentLang();
    const lesson = queue[idx];
    const s = lesson && lesson.speaking;
    const view = target();
    if (!s) return renderDone();
    view.innerHTML = `
      <h2 class="section-title">口语跟读 · ${D.LANGS[lang].flag} ${D.LANGS[lang].native}</h2>
      <p class="section-sub">听标准发音 → 跟读 → 自动评分 · 第 ${idx + 1}/${queue.length} 题</p>
      ${moduleTabsHTML('speaking')}
      <div class="quiz-box">
        <div class="speak-stage">
          <div class="speak-target">${U.esc(s)}</div>
          <div class="speak-rom">点击喇叭听标准发音，然后按下麦克风跟读</div>
          <button class="btn btn-ghost" id="playBtn">🔊 听发音</button>
          <button class="mic-btn" id="micBtn" title="按住或点击开始跟读">🎤</button>
          <div class="feedback" id="fb">等待跟读…</div>
        </div>
        <div class="quiz-footer">
          <span class="streak-pill">🎤 已跟读 ${S.getUser().speakCount} 次</span>
          <button class="btn btn-ghost btn-sm" id="nextBtn">下一句 →</button>
        </div>
      </div>`;
    document.getElementById('playBtn').onclick = () => U.speak(s, D.LANGS[lang].voice);
    const mic = document.getElementById('micBtn');
    mic.onclick = () => {
      mic.classList.add('rec');
      mic.textContent = '🔴';
      document.getElementById('fb').innerHTML = '<span style="color:var(--brand-2)">正在聆听… 请跟读</span>';
      U.recognize(D.LANGS[lang].voice, (text, conf) => {
        const sim = U.similarity(text, s);
        const score = Math.round(sim * 100);
        const color = score >= 80 ? 'var(--ok)' : (score >= 50 ? 'var(--warn)' : 'var(--danger)');
        let label = score >= 80 ? '太棒了！' : (score >= 50 ? '不错，继续练习' : '再试一次，注意发音');
        document.getElementById('fb').innerHTML = `
          <div>你说：<b>${U.esc(text)}</b></div>
          <div style="margin-top:6px">发音匹配度：<b style="color:${color}">${score}%</b> · ${label}</div>`;
        S.recordSpeak();
        if (score >= 80) { correctCount++; }
      }, (ok) => {
        mic.classList.remove('rec');
        mic.textContent = '🎤';
        if (!ok) document.getElementById('fb').innerHTML = '<span style="color:var(--muted)">未能识别语音，可再试一次</span>';
      });
    };
    document.getElementById('nextBtn').onclick = () => { S.completeLesson(lang, currentLevel(), lesson.id, 20); idx++; renderSpeaking(); };
    // auto play once
    setTimeout(() => U.speak(s, D.LANGS[lang].voice), 350);
  }

  // ---------- Listening: 听力训练 ----------
  function renderListening() {
    const lang = currentLang();
    const lesson = queue[idx];
    const li = lesson && lesson.listening;
    const view = target();
    if (!li) return renderDone();
    view.innerHTML = `
      <h2 class="section-title">听力训练 · ${D.LANGS[lang].flag} ${D.LANGS[lang].native}</h2>
      <p class="section-sub">听句子，选出你听到的内容 · 第 ${idx + 1}/${queue.length} 题</p>
      ${moduleTabsHTML('listening')}
      <div class="quiz-box">
        <div class="listen-audio">
          <button class="btn btn-primary" id="playListen">🔊 播放</button>
          <div class="wave">${'<i></i>'.repeat(10)}</div>
        </div>
        <div class="quiz-q">👂 你听到的是哪一句？</div>
        <div class="options" id="opts">
          ${shuffle(li.opts.map((o, i) => ({ o, i, correct: i === li.ans }))).map(x => `<button class="opt" data-i="${x.i}">${U.esc(x.o)}</button>`).join('')}
        </div>
        <div class="quiz-footer">
          <span class="streak-pill">✅ 正确 ${correctCount}</span>
          <span class="muted" id="fb"></span>
        </div>
      </div>`;
    const play = () => U.speak(li.text, D.LANGS[lang].voice);
    document.getElementById('playListen').onclick = play;
    setTimeout(play, 300);
    document.querySelectorAll('#opts .opt').forEach(btn => {
      btn.onclick = () => {
        attemptCount++;
        const i = +btn.dataset.i;
        document.querySelectorAll('#opts .opt').forEach(b => b.disabled = true);
        if (i === li.ans) {
          btn.classList.add('correct'); correctCount++;
          document.getElementById('fb').innerHTML = '<span style="color:var(--ok)">听对了！</span>';
          S.completeLesson(lang, currentLevel(), lesson.id, 20);
        } else {
          btn.classList.add('wrong');
          document.querySelectorAll('#opts .opt').forEach(b => { if (+b.dataset.i === li.ans) b.classList.add('correct'); });
          document.getElementById('fb').innerHTML = '<span style="color:var(--danger)">正确答案已高亮，可再听一次</span>';
        }
        if (attemptCount === queue.length && correctCount === queue.length) S.recordPerfect();
        setTimeout(() => { idx++; renderListening(); }, 1200);
      };
    });
  }

  function renderDone() {
    const minutes = Math.max(1, Math.round((Date.now() - studyStart) / 60000));
    S.addStudy(minutes);
    const newly = S.evalBadges();
    const u = S.getUser();
    let badgeHtml = '';
    if (newly.length) {
      badgeHtml = `<div class="card mt24" style="border-color:var(--warn)">
        <h3>🎉 解锁新成就！</h3>
        <div class="badges-grid mt16">
        ${newly.map(b => `<div class="badge"><span class="ico">${b.icon}</span><div class="nm">${U.esc(b.name)}</div><div class="desc">${U.esc(b.desc)}</div></div>`).join('')}
        </div></div>`;
    }
    const view = target();
    view.innerHTML = `
      <div class="empty-state">
        <div class="big">🎉</div>
        <h2 class="section-title">本组练习完成！</h2>
        <p class="section-sub">本轮正确 ${correctCount} 题 · 用时约 ${minutes} 分钟 · 累计 XP：${u.xp}</p>
        ${badgeHtml}
        <div class="row" style="justify-content:center;margin-top:24px">
          <button class="btn btn-primary" id="againBtn">再来一组</button>
          <button class="btn btn-ghost" data-route="progress">查看进度</button>
          <button class="btn btn-ghost" data-route="community">去社区</button>
        </div>
      </div>`;
    document.getElementById('againBtn').onclick = () => { buildQueue(); render(); };
    U.toast(`练习完成，+${minutes}分钟学习时长`, 'ok');
  }

  function moduleTabsHTML(active) {
    const tabs = [
      { id: 'vocab', label: '单词记忆', icon: '📚' },
      { id: 'grammar', label: '语法练习', icon: '📝' },
      { id: 'speaking', label: '口语跟读', icon: '🎤' },
      { id: 'listening', label: '听力训练', icon: '👂' }
    ];
    return `<div class="module-tabs">
      ${tabs.map(t => `<button class="mtab ${t.id === active ? 'active' : ''}" data-mod="${t.id}">${t.icon} ${t.label}</button>`).join('')}
    </div>`;
  }

  function bindTabs() {
    // delegated so it survives module re-renders
    const view = document.getElementById('view');
    if (view.__pgTabsBound) return;
    view.__pgTabsBound = true;
    view.addEventListener('click', (e) => {
      const t = e.target.closest('.mtab');
      if (!t) return;
      activeModule = t.dataset.mod;
      idx = 0; correctCount = 0; attemptCount = 0;
      buildQueue();
      render();
    });
  }

  function saveIfComplete() {
    const lang = currentLang();
    const lesson = queue[idx - 1] || queue[idx];
    if (lesson) S.completeLesson(lang, currentLevel(), lesson.id, 15);
  }

  function render() {
    if (!PG_AUTH.requireAuth('learning')) return;
    const u = S.getUser();
    if (!queue.length) buildQueue();
    const lang = currentLang();
    const level = currentLevel();

    // language + level selector
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 class="section-title">学习中心</h2>
      <p class="section-sub">选择语言与等级，开始沉浸式练习</p>
      <div class="card" style="padding:16px;margin-bottom:20px">
        <div class="row">
          <b style="font-size:13px;margin-right:6px">语言：</b>
          ${Object.values(D.LANGS).map(l => `<button class="chip ${l.code === lang ? 'active' : ''}" data-lang="${l.code}">${l.flag} ${l.name}</button>`).join('')}
          <b style="font-size:13px;margin:0 6px 0 18px">等级：</b>
          ${D.LEVELS.map(l => `<button class="chip ${l.id === level ? 'active' : ''}" data-level="${l.id}">${l.id}</button>`).join('')}
        </div>
      </div>
      <div id="moduleArea"></div>`;
    view.querySelectorAll('[data-lang]').forEach(c => c.onclick = () => { S.setLang(c.dataset.lang); queue = []; render(); });
    view.querySelectorAll('[data-level]').forEach(c => c.onclick = () => { S.setLevel(currentLang(), c.dataset.level); queue = []; render(); });

    const mod = activeModule;
    // render module into the real #view (the functions replace #view). So we save current selection and call renderers:
    if (mod === 'vocab') renderVocab();
    else if (mod === 'grammar') renderGrammar();
    else if (mod === 'speaking') renderSpeaking();
    else renderListening();

    bindTabs();
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { render, setModule: (m) => { activeModule = m; } };
})();
