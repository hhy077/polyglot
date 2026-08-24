// ===== Web Audio 程序化音效 + 背景音乐 + 玩梗 Boss 战 BGM =====
window.SFX = (function () {
  let ctx = null, master = null, musicGain = null, memeGain = null, muted = false, musicTimer = null;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.06;
      musicGain.connect(master);
      memeGain = ctx.createGain();
      memeGain.gain.value = 0.6;      // 玩梗BGM显著高于常规BGM，保证存在感
      memeGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, freqEnd, delay) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
    // 完成后断开节点，避免高频音效时 AudioNode 堆积导致卡死
    o.onended = () => { try { g.disconnect(); o.disconnect(); } catch (e) {} };
  }

  // 带目标输出与起始时间的音符（玩梗 BGM 调度用）
  function toneAt(freq, when, dur, type, vol, freqEnd, dest) {
    if (!ctx) return;
    const t = Math.max(when, ctx.currentTime);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.02);
    o.onended = () => { try { g.disconnect(); o.disconnect(); } catch (e) {} };
  }

  function noise(dur, vol, delay) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1200;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
    src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) {} };
  }

  // 射击音效节流：技能开启时发射频率极高，避免大量创建音效节点导致卡死
  let lastShoot = 0;
  const fx = {
    shoot()    { const now = ctx ? ctx.currentTime : 0; if (now - lastShoot < 0.1) return; lastShoot = now; tone(880, 0.06, 'square', 0.08, 200); },
    hit()      { tone(220, 0.05, 'sawtooth', 0.12, 120); },
    explode()  { noise(0.35, 0.5); tone(120, 0.3, 'sawtooth', 0.25, 40); },
    bigExplode(){ noise(0.7, 0.7); tone(90, 0.6, 'sawtooth', 0.35, 30); tone(60,0.8,'square',0.2,25,0.05); },
    pickup()   { tone(660, 0.08, 'sine', 0.2, 990); tone(990, 0.1, 'sine', 0.2, 1320, 0.07); },
    power()    { tone(440,0.1,'square',0.2,660); tone(660,0.1,'square',0.2,880,0.08); tone(880,0.15,'square',0.2,1320,0.16); },
    bomb()     { noise(0.8, 0.8); tone(200,0.5,'sawtooth',0.3,40); },
    skill()    { tone(300,0.4,'sawtooth',0.3,900); noise(0.5,0.4); },
    hurt()     { tone(160,0.2,'sawtooth',0.3,60); },
    gameover() { tone(880,0.3,'square',0.25,440,0); tone(440,0.3,'square',0.25,220,0.3); tone(220,0.6,'square',0.25,110,0.6); },
    levelup()  { tone(523,0.12,'square',0.2,523); tone(659,0.12,'square',0.2,659,0.12); tone(784,0.2,'square',0.22,784,0.24); },
    taunt()    { tone(140,0.25,'sawtooth',0.2,90); tone(70,0.3,'sawtooth',0.2,50,0.1); },
    shieldHit(){ tone(500,0.15,'triangle',0.2,200); }
  };

  // 极简无限背景音乐（Bassline + 节拍）
  function startMusic() {
    if (!ctx || musicTimer) return;
    const bass = [55, 55, 65.4, 49];
    let step = 0;
    musicTimer = setInterval(() => {
      if (muted) return;
      const f = bass[step % 4];
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g); g.connect(musicGain);
      o.start(t); o.stop(t + 0.45);
      if (step % 2 === 0) tone(1200, 0.04, 'square', 0.25, 900);
      step++;
    }, 240);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  // ================= 玩梗 Boss 战 BGM =================
  // 音名转频率：nf('A4')
  function nf(name) {
    const m = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const oct = +name.slice(-1);
    const key = name.slice(0, -1);
    return 440 * Math.pow(2, (m[key] + (oct - 4) * 12 - 9) / 12);
  }

  // 「鸡你太美」· 流行说唱风 Hook（旋律为致敬玩梗的近似演绎）
  // lead: [音名, 起拍, 时值(拍)]；16 拍一循环
  const SONG_JITN = {
    bpm: 100, beats: 16,
    lead: [
      ['A4', 0, 0.5], ['C5', 0.5, 0.5], ['E5', 1, 1], ['C5', 2, 0.5], ['B4', 2.5, 0.5],
      ['G4', 3, 0.5], ['A4', 3.5, 1],
      ['A4', 4, 0.5], ['C5', 4.5, 0.5], ['E5', 5, 1], ['C5', 6, 0.5], ['D5', 6.5, 0.5],
      ['E5', 7, 0.5], ['D5', 7.5, 1],
      ['E5', 8, 0.5], ['E5', 8.5, 0.5], ['D5', 9, 0.5], ['C5', 9.5, 0.5], ['A4', 10, 1], ['G4', 11, 1],
      ['A4', 12, 0.75], ['G4', 12.75, 0.25], ['E4', 13, 0.5], ['D4', 13.5, 0.5], ['E4', 14, 2]
    ],
    bass: [
      ['A2', 0, 0.5], ['A2', 0.75, 0.25], ['A2', 1.5, 0.5], ['E2', 2, 0.5], ['E2', 2.75, 0.25],
      ['F2', 4, 0.5], ['F2', 4.75, 0.25], ['F2', 5.5, 0.5], ['G2', 6, 0.5], ['G2', 6.75, 0.25],
      ['A2', 8, 0.5], ['A2', 8.75, 0.25], ['A2', 9.5, 0.5], ['E2', 10, 0.5], ['E2', 10.75, 0.25],
      ['F2', 12, 0.5], ['G2', 13, 0.5], ['A2', 14, 2]
    ],
    hat: true
  };

  // 「大东北我的家乡」· 欢快东北民谣风（五声音阶 + 大秧歌律动，近似演绎）
  const SONG_DBD = {
    bpm: 126, beats: 16,
    lead: [
      ['C5', 0, 0.5], ['D5', 0.5, 0.5], ['E5', 1, 1], ['G5', 2, 0.5], ['E5', 2.5, 0.5],
      ['D5', 3, 0.5], ['E5', 3.5, 0.5], ['D5', 4, 1], ['C5', 5, 1],
      ['A4', 6, 0.5], ['C5', 6.5, 0.5], ['D5', 7, 0.5], ['E5', 7.5, 0.5], ['G5', 8, 1],
      ['E5', 9, 0.5], ['D5', 9.5, 0.5], ['C5', 10, 1], ['A4', 11, 1],
      ['G4', 12, 0.5], ['A4', 12.5, 0.5], ['C5', 13, 0.5], ['D5', 13.5, 0.5], ['C5', 14, 2]
    ],
    bass: [
      ['C3', 0, 0.75], ['C3', 1, 0.25], ['G2', 1.5, 0.5], ['C3', 2, 0.75], ['C3', 3, 0.25], ['G2', 3.5, 0.5],
      ['F2', 4, 0.75], ['F2', 5, 0.25], ['C3', 5.5, 0.5], ['G2', 6, 0.75], ['G2', 7, 0.25], ['G2', 7.5, 0.5],
      ['A2', 8, 0.75], ['A2', 9, 0.25], ['E3', 9.5, 0.5], ['A2', 10, 0.75], ['A2', 11, 0.25], ['E3', 11.5, 0.5],
      ['F2', 12, 0.5], ['G2', 13, 0.5], ['C3', 14, 2]
    ],
    hat: true, folk: true
  };

  const MEME_SONGS = { jitn: SONG_JITN, dbd: SONG_DBD };
  let meme = { timer: null, name: null, pausedName: null };

  // ================= 网络玩梗歌曲（真实人声原曲） =================
  // 原曲下载至游戏目录随站部署（同源HTTPS，规避网易云外链HTTP重定向被浏览器混合内容策略拦截）
  // 本地缺失时回退网易云外链，再失败回退合成 BGM，保证 Boss 战始终有音乐
  const NET_SONGS = {
    jitn: [
      'assets/music/jitn.mp3',                                     // 只因你太美（ROE Bootleg完整版·本地）
      'https://music.163.com/song/media/outer/url?id=1361144868.mp3'  // 备选：网易云外链
    ],
    dbd: [
      'assets/music/dbd.mp3',                                      // 大东北我的家乡（东北最强音版·本地）
      'https://music.163.com/song/media/outer/url?id=3316869901.mp3'   // 备选：网易云外链
    ]
  };
  let netAudio = null;                                  // HTML5 Audio 实例
  let netState = { loading: false, ok: false, srcIdx: 0 };
  let netRetryCleanup = null;                           // autoplay 重试清理函数（停止时调用）
  const preloaded = {};                                 // 预加载的本地音乐（首次交互即后台缓冲）

  // 确保 Audio 真实出声：play() 被浏览器 autoplay 策略拒绝时，
  // 监听一切用户交互（含鼠标移动/滚轮/触摸）并定时轮询重试，直到真正响起为止
  function ensurePlaying(a) {
    a.play().catch(() => {
      let lastTry = 0;
      let timer = null;
      const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'touchmove', 'wheel', 'click'];
      const cleanup = () => {
        EVENTS.forEach(e => window.removeEventListener(e, retry));
        if (timer) { clearInterval(timer); timer = null; }
        if (netRetryCleanup === cleanup) netRetryCleanup = null;
      };
      const retry = () => {
        if (netAudio !== a || !a.paused) { cleanup(); return; }   // 已换曲或已在播
        const now = Date.now();
        if (now - lastTry < 1000) return;                          // 节流：至多每秒试一次
        lastTry = now;
        a.play().then(cleanup, () => {});                          // 成功才清理，失败等下次
      };
      EVENTS.forEach(e => window.addEventListener(e, retry, { passive: true }));
      timer = setInterval(retry, 2000);                            // 无交互时兜底轮询
      netRetryCleanup = cleanup;
    });
  }

  // 首次用户交互后立即后台预载本地音乐：Boss 出现时已完成缓冲，即点即播
  function preloadMemeSongs() {
    for (const name of Object.keys(NET_SONGS)) {
      const url = NET_SONGS[name][0];
      if (/^https?:/.test(url)) continue;               // 仅预载本地文件
      if (preloaded[name]) continue;
      const a = new Audio();
      a.preload = 'auto';
      a.loop = true;
      a.volume = 0.75;
      a.muted = muted;
      a.src = url;
      a.load();
      preloaded[name] = a;
    }
  }

  // 逐个尝试网络歌曲链接
  function tryNetSong(name, idx) {
    const urls = NET_SONGS[name];
    if (idx >= urls.length) {                           // 全部失败 → 回退合成 BGM
      netState = { loading: false, ok: false, srcIdx: -1 };
      startSynthMeme(MEME_SONGS[name]);
      return;
    }
    const url = urls[idx];
    const isLocal = !/^https?:/.test(url);
    let a;
    if (isLocal && preloaded[name] && !preloaded[name].error) {
      a = preloaded[name];                              // 复用预加载实例（大概率已缓冲完）
      try { a.currentTime = 0; } catch (e) {}           // 每场 Boss 战从头播放
    } else {
      a = new Audio();
      a.src = url;
    }
    a.loop = true;
    a.volume = 0.75;
    a.muted = muted;
    netAudio = a;
    netState = { loading: true, ok: false, srcIdx: idx };
    let settled = false;
    const onOk = () => {
      if (netAudio !== a || settled) return;
      settled = true;
      netState.loading = false; netState.ok = true;
      ensurePlaying(a);       // play被拒时自动监听交互+轮询重试，杜绝Boss战静音
    };
    const onErr = () => {
      if (netAudio !== a || settled) return;
      settled = true;
      if (!Object.values(preloaded).includes(a)) {      // 预加载实例保留待复用
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {}
      }
      tryNetSong(name, idx + 1);                        // 尝试备选链接
    };
    if (a.error) onErr();                               // 预载阶段就已失败
    else if (a.readyState >= 3) onOk();                 // 已缓冲完成，立即播放
    else {
      a.addEventListener('canplay', onOk, { once: true });
      a.addEventListener('error', onErr, { once: true });
    }
    // 仅外链设加载超时；本地同源文件必达，慢网络下耐心等待不回退
    if (!isLocal) setTimeout(() => { if (netAudio === a && !settled) onErr(); }, 10000);
  }

  // 合成版玩梗 BGM（网络歌曲不可用时的兜底）
  function startSynthMeme(song) {
    if (!song) return;
    scheduleMemeLoop(song);
    const loopMs = song.beats * (60 / song.bpm) * 1000;
    meme.timer = setInterval(() => scheduleMemeLoop(song), loopMs);
  }

  function scheduleMemeLoop(song) {
    if (!ctx || muted) return;
    const spb = 60 / song.bpm;               // 秒/拍
    const t0 = ctx.currentTime + 0.06;
    // 主旋律（双振荡器轻微失谐加厚，更响更饱满）
    for (const [n, b, d] of song.lead) {
      const f = nf(n);
      toneAt(f, t0 + b * spb, d * spb * 0.92, song.folk ? 'sawtooth' : 'square', 0.30, null, memeGain);
      toneAt(f * 1.005, t0 + b * spb, d * spb * 0.92, song.folk ? 'square' : 'sawtooth', 0.12, null, memeGain);
    }
    // 低音（加八度上复制，节奏感更强）
    for (const [n, b, d] of song.bass) {
      const f = nf(n);
      toneAt(f, t0 + b * spb, d * spb * 0.9, 'triangle', 0.5, null, memeGain);
      toneAt(f * 2, t0 + b * spb, d * spb * 0.85, 'sawtooth', 0.10, null, memeGain);
    }
    // 节拍：底鼓(1/3拍) + 军鼓(2/4拍) + 八分踩镲
    for (let b = 0; b < song.beats; b++) {
      if (b % 2 === 0) toneAt(150, t0 + b * spb, 0.14, 'sine', 0.8, 45, memeGain);             // kick
      else toneAt(1000, t0 + b * spb, 0.07, 'square', 0.10, 500, memeGain);                     // snare
      if (song.hat) toneAt(6500, t0 + (b + 0.5) * spb, 0.03, 'square', 0.05, null, memeGain);   // hat
    }
    // 和弦垫（每4拍一个长和弦，铺底更丰满）
    const chords = song.folk
      ? [['C4', 'E4', 'G4'], ['F3', 'A3', 'C4'], ['A3', 'C4', 'E4'], ['G3', 'B3', 'D4']]
      : [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['A3', 'C4', 'E4'], ['G3', 'B3', 'D4']];
    for (let bar = 0; bar < 4; bar++) {
      for (const n of chords[bar % 4]) {
        toneAt(nf(n), t0 + bar * 4 * spb, 4 * spb * 0.95, 'triangle', 0.08, null, memeGain);
      }
    }
    if (song.folk) {
      // 秧歌小钹点缀（唢呐味高音亮点）
      for (const b of [3.5, 7.5, 11.5, 15.5]) toneAt(2800, t0 + b * spb, 0.09, 'sawtooth', 0.09, 1800, memeGain);
    } else {
      // 说唱"嘿！"点缀（电子短促音）
      for (const b of [2, 6, 10, 14]) toneAt(200, t0 + b * spb, 0.05, 'square', 0.15, 120, memeGain);
    }
  }

  function playMemeSong(name) {
    const song = MEME_SONGS[name];
    if (!song) return;
    ensure();
    if (ctx.state === 'suspended') ctx.resume();   // 双保险：确保音频上下文运行
    stopMemeSong();
    stopMusic();          // Boss 战期间切掉常规 BGM，玩梗歌独占
    meme.name = name;
    // 优先播放网络真实歌曲；无网络源或加载失败时自动回退合成 BGM
    if (NET_SONGS[name]) tryNetSong(name, 0);
    else startSynthMeme(song);
  }

  function stopMemeSong() {
    if (meme.timer) { clearInterval(meme.timer); meme.timer = null; }
    if (netRetryCleanup) {                     // 清理 autoplay 重试监听与轮询
      netRetryCleanup();
      netRetryCleanup = null;
    }
    if (netAudio) {
      try { netAudio.pause(); } catch (e) {}
      // 预加载实例保留缓冲数据供下次 Boss 战复用；外链实例销毁释放资源
      if (!Object.values(preloaded).includes(netAudio)) {
        try { netAudio.removeAttribute('src'); netAudio.load(); } catch (e) {}
      }
      netAudio = null;
    }
    netState = { loading: false, ok: false, srcIdx: 0 };
    meme.name = null; meme.pausedName = null;
    if (ctx) startMusic();   // 恢复常规 BGM
  }

  function pauseMemeSong() {
    if (netAudio) { netAudio.pause(); meme.pausedName = meme.name; meme.name = null; return; }
    if (!meme.timer) return;
    clearInterval(meme.timer); meme.timer = null;
    meme.pausedName = meme.name; meme.name = null;
  }
  function resumeMemeSong() {
    if (!meme.pausedName) return;
    const n = meme.pausedName; meme.pausedName = null;
    // 网络歌曲：从暂停处继续播放（play失败同样有交互重试保障）
    if (netAudio && netAudio.readyState >= 2) { meme.name = n; ensurePlaying(netAudio); return; }
    playMemeSong(n);
  }

  function init() { ensure(); startMusic(); preloadMemeSongs(); }
  function setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.5;
    if (netAudio) netAudio.muted = m;
    for (const a of Object.values(preloaded)) a.muted = m;
  }
  function isMuted() { return muted; }
  function play(name) { ensure(); if (muted) return; if (fx[name]) fx[name](); }

  return { play, init, setMuted, isMuted, playMemeSong, stopMemeSong, pauseMemeSong, resumeMemeSong,
    currentMeme: () => meme.name,
    memeState: () => ({ name: meme.name, timerActive: !!meme.timer, ctxState: ctx ? ctx.state : 'none',
      net: netAudio ? { ok: netState.ok, loading: netState.loading, idx: netState.srcIdx,
        paused: netAudio.paused, readyState: netAudio.readyState, t: Math.round(netAudio.currentTime) } : null }) };
})();
