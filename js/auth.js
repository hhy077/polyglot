/* ===== PolyGlot · Auth & Shared Utils ===== */
window.PG_UTILS = (function () {
  function toast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) { return; }
    el.textContent = msg;
    el.className = 'toast show ' + (type || '');
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => { el.className = 'toast'; }, 2200);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---- speech synthesis (TTS) ----
  // Chrome loads voices asynchronously; cache them and refresh on voiceschanged
  let voicesCache = [];
  function refreshVoices() {
    if (!('speechSynthesis' in window)) return;
    const vs = window.speechSynthesis.getVoices();
    if (vs && vs.length) voicesCache = vs;
  }
  if ('speechSynthesis' in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  // Web Speech API TTS (text-to-speech) for listening & speaking models
  function speak(text, langVoice) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音播放，请使用 Chrome/Edge', 'err'); return; }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langVoice || 'en-US';
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    // try to pick a matching voice (case-insensitive, prefer exact match)
    const wanted = (langVoice || 'en-US').toLowerCase();
    const two = wanted.slice(0, 2);
    const voices = voicesCache.length ? voicesCache : (synth.getVoices() || []);
    const v = voices.find(x => (x.lang || '').toLowerCase() === wanted)
      || voices.find(x => (x.lang || '').toLowerCase().startsWith(two))
      || voices.find(x => (x.lang || '').toLowerCase().indexOf(two) === 0);
    if (v) u.voice = v;
    // Chrome/Edge bug: sometimes needs resume() after cancel() to start playing
    if (synth.paused) synth.resume();
    synth.speak(u);
    // ensure voices are loaded for the next call
    if (!voicesCache.length) setTimeout(refreshVoices, 300);
  }

  // Web Speech API recognition for 口语跟读 (best-effort; degrades gracefully)
  function recognize(langVoice, onResult, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('浏览器不支持语音识别，请使用 Chrome', 'err'); onEnd && onEnd(false); return; }
    const r = new SR();
    r.lang = langVoice || 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 3;
    let ok = false;
    r.onresult = (e) => {
      ok = true;
      const txt = e.results[0][0].transcript;
      onResult && onResult(txt, e.results[0][0].confidence || 0.5);
    };
    r.onerror = () => { ok = false; onEnd && onEnd(false); };
    r.onend = () => { onEnd && onEnd(ok); };
    r.start();
    return r;
  }

  // similarity 0..1 between two strings (for pronunciation scoring)
  function similarity(a, b) {
    a = (a || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    b = (b || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    const aa = a.split(/\s+/), bb = b.split(/\s+/);
    let hit = 0;
    bb.forEach(w => { if (aa.includes(w)) hit++; });
    const score = hit / Math.max(aa.length, bb.length);
    return Math.max(0, Math.min(1, score));
  }

  return { toast, esc, speak, recognize, similarity };
})();

window.PG_AUTH = (function () {
  const U = window.PG_UTILS;
  let mode = 'login';

  function open(tab) {
    mode = tab || 'login';
    const modal = document.getElementById('authModal');
    modal.classList.add('open');
    switchTab(mode);
  }
  function close() { document.getElementById('authModal').classList.remove('open'); }

  function switchTab(t) {
    mode = t;
    document.querySelectorAll('#authTabs .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.authTab === t);
    });
    document.getElementById('regExtra').hidden = (t !== 'register');
    document.getElementById('authSubmit').textContent = (t === 'register' ? '注册' : '登录');
    document.getElementById('authHint').textContent = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const username = (fd.get('username') || '').trim();
    const password = fd.get('password') || '';
    const hint = document.getElementById('authHint');

    if (!username || password.length < 6) {
      hint.textContent = '请填写用户名，且密码至少 6 位';
      hint.style.color = 'var(--danger)';
      return;
    }

    if (mode === 'register') {
      const profile = {
        username, password,
        nickname: (fd.get('nickname') || '').trim(),
        native: fd.get('native'),
        target: fd.get('target'),
        level: fd.get('level')
      };
      const res = PG_STORE.registerUser(profile);
      if (!res.ok) { hint.textContent = res.msg; hint.style.color = 'var(--danger)'; return; }
      PG_STORE.setCurrentUser(username);
      U.toast('注册成功，欢迎加入 PolyGlot！', 'ok');
      close();
      afterAuth();
    } else {
      const res = PG_STORE.loginUser(username, password);
      if (!res.ok) { hint.textContent = res.msg; hint.style.color = 'var(--danger)'; return; }
      PG_STORE.setCurrentUser(username);
      U.toast('登录成功，继续学习吧！', 'ok');
      close();
      afterAuth();
    }
  }

  function logout() {
    PG_STORE.logout();
    U.toast('已退出登录', 'ok');
    afterAuth();
  }

  function renderAuthArea() {
    const area = document.getElementById('authArea');
    const u = PG_STORE.getUser();
    if (u) {
      area.innerHTML = `
        <span class="row" style="gap:8px">
          <span class="streak-pill">🔥 ${u.streak}天</span>
          <span class="streak-pill" style="background:rgba(74,214,255,.18);color:var(--brand-2)">⚡ ${u.xp} XP</span>
        </span>
        <span class="row" style="gap:6px">
          <span class="avatar" style="width:30px;height:30px;font-size:13px">${U.esc((u.nickname||u.username).slice(0,1))}</span>
          <b style="font-size:13px">${U.esc(u.nickname || u.username)}</b>
        </span>
        <button class="btn btn-ghost btn-sm" id="logoutBtn">退出</button>`;
      document.getElementById('logoutBtn').onclick = logout;
    } else {
      area.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="loginBtn">登录</button>
        <button class="btn btn-primary btn-sm" id="registerBtn">免费注册</button>`;
      document.getElementById('loginBtn').onclick = () => open('login');
      document.getElementById('registerBtn').onclick = () => open('register');
    }
  }

  function afterAuth() {
    renderAuthArea();
    // re-render current view with new state
    if (window.PG_ROUTER && PG_ROUTER.current) PG_ROUTER.go(PG_ROUTER.current);
  }

  function requireAuth(redirect) {
    if (!PG_STORE.getUser()) {
      U.toast('请先登录', 'err');
      open('login');
      return false;
    }
    return true;
  }

  function init() {
    document.querySelectorAll('#authTabs .tab').forEach(el => {
      el.onclick = () => switchTab(el.dataset.authTab);
    });
    document.getElementById('authForm').onsubmit = handleSubmit;
    document.querySelector('#authModal .modal-close').onclick = close;
    document.getElementById('authModal').addEventListener('click', (e) => {
      if (e.target.id === 'authModal') close();
    });
    renderAuthArea();
  }

  return { init, open, close, renderAuthArea, requireAuth };
})();
