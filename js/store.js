/* ===== PolyGlot · State Store (localStorage) ===== */
window.PG_STORE = (function () {
  const KEY = 'polyglot_state_v1';
  const USERS_KEY = 'polyglot_users_v1';

  function defaultState() {
    return {
      currentUser: null,
      // per-user data lives in users[username]
    };
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || defaultState(); }
    catch { return defaultState(); }
  }
  function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }

  let state = load();

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  function defaultUserData() {
    return {
      username: '',
      nickname: '',
      native: 'zh',
      target: 'en',
      level: 'A1',
      createdAt: Date.now(),
      streak: 1,
      lastStudyDate: new Date().toDateString(),
      // lang -> { level, lessonsDone: {lessonId:true}, xp }
      langProgress: {},
      // current selected language
      currentLang: 'en',
      // mastered vocab set (keyed by "lang:word")
      vocabMastered: 0,
      vocabSet: [],
      // stats
      completedLessons: 0,
      speakCount: 0,
      perfectRuns: 0,
      totalMinutes: 0,
      postsCount: 0,
      langsTried: [],
      levelCompleted: false,
      xp: 0,
      // daily activity: date -> minutes
      activity: {},
      // last 14 days heatmap (array of 0-4)
      heatmap: new Array(14).fill(0),
      // unlocked achievements
      badges: []
    };
  }

  function getUsers() { return loadUsers(); }

  function registerUser(profile) {
    const users = loadUsers();
    if (users[profile.username]) {
      return { ok: false, msg: '该用户名已被注册' };
    }
    const data = defaultUserData();
    Object.assign(data, profile);
    data.nickname = profile.nickname || profile.username;
    data.langProgress[profile.target] = { level: profile.level, lessonsDone: {}, xp: 0 };
    data.langsTried = [profile.target];
    users[profile.username] = data;
    saveUsers(users);
    return { ok: true, user: data };
  }

  function loginUser(username, password) {
    const users = loadUsers();
    const u = users[username];
    if (!u) return { ok: false, msg: '用户不存在，请先注册' };
    if (u.password !== password) return { ok: false, msg: '密码不正确' };
    // streak logic
    const today = new Date().toDateString();
    if (u.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      u.streak = (u.lastStudyDate === yesterday) ? (u.streak + 1) : 1;
      u.lastStudyDate = today;
      users[username] = u; saveUsers(users);
    }
    return { ok: true, user: u };
  }

  function getUser() {
    if (!state.currentUser) return null;
    const users = loadUsers();
    return users[state.currentUser] || null;
  }

  function updateUser(updater) {
    if (!state.currentUser) return null;
    const users = loadUsers();
    const u = users[state.currentUser];
    if (!u) return null;
    updater(u);
    users[state.currentUser] = u;
    saveUsers(users);
    return u;
  }

  function setCurrentUser(username) {
    state.currentUser = username;
    save(state);
  }
  function logout() {
    state.currentUser = null;
    save(state);
  }

  // record study minutes + activity heatmap
  function addStudy(minutes) {
    return updateUser(u => {
      u.totalMinutes += minutes;
      const today = new Date().toDateString();
      u.activity[today] = (u.activity[today] || 0) + minutes;
      // update heatmap (last 14 days)
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toDateString();
        const m = u.activity[d] || 0;
        let lvl = 0;
        if (m >= 60) lvl = 4; else if (m >= 30) lvl = 3; else if (m >= 15) lvl = 2; else if (m > 0) lvl = 1;
        days.push(lvl);
      }
      u.heatmap = days;
    });
  }

  // mark a lesson complete
  function completeLesson(lang, level, lessonId, xp) {
    return updateUser(u => {
      if (!u.langProgress[lang]) u.langProgress[lang] = { level, lessonsDone: {}, xp: 0 };
      const lp = u.langProgress[lang];
      if (!lp.lessonsDone[lessonId]) {
        lp.lessonsDone[lessonId] = true;
        u.completedLessons += 1;
        u.xp += xp || 20;
        lp.xp += xp || 20;
      }
      if (!u.langsTried.includes(lang)) u.langsTried.push(lang);
      // check level completion
      const lessons = (window.PG_DATA.COURSES[lang] || {})[level] || [];
      if (lessons.length && lessons.every(l => lp.lessonsDone[l.id])) {
        u.levelCompleted = true;
      }
    });
  }

  function addVocab(lang, word) {
    const key = lang + ':' + word;
    return updateUser(u => {
      if (!u.vocabSet.includes(key)) {
        u.vocabSet.push(key);
        u.vocabMastered = u.vocabSet.length;
        u.xp += 5;
      }
    });
  }

  function recordSpeak() { return updateUser(u => { u.speakCount += 1; u.xp += 8; }); }
  function recordPerfect() { return updateUser(u => { u.perfectRuns += 1; u.xp += 10; }); }
  function recordPost() { return updateUser(u => { u.postsCount += 1; u.xp += 15; }); }

  function setLang(lang) {
    return updateUser(u => {
      u.currentLang = lang;
      if (!u.langProgress[lang]) u.langProgress[lang] = { level: 'A1', lessonsDone: {}, xp: 0 };
      if (!u.langsTried.includes(lang)) u.langsTried.push(lang);
    });
  }
  function setLevel(lang, level) {
    return updateUser(u => {
      if (!u.langProgress[lang]) u.langProgress[lang] = { level, lessonsDone: {}, xp: 0 };
      u.langProgress[lang].level = level;
    });
  }

  // compute unlocked badges
  function evalBadges() {
    const u = getUser(); if (!u) return [];
    const newly = [];
    window.PG_DATA.ACHIEVEMENTS.forEach(a => {
      if (!u.badges.includes(a.id) && a.check(u)) {
        u.badges.push(a.id);
        newly.push(a);
      }
    });
    if (newly.length) {
      updateUser(x => { x.badges = u.badges; });
    }
    return newly;
  }

  return {
    state, getUsers, registerUser, loginUser, getUser, updateUser,
    setCurrentUser, logout, addStudy, completeLesson, addVocab,
    recordSpeak, recordPerfect, recordPost, setLang, setLevel, evalBadges
  };
})();
