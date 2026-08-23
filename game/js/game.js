// ===== 主游戏逻辑：状态机 / 波次 / 碰撞 / 得分连击 / HUD / 进度条 / 玩梗BOSS流程 =====
window.Game = (function () {
  const { CFG, Utils, GFX, SFX, Ent, BossSystem, TAUNTS, LEVEL_INFO } = window;
  const W = CFG.canvas.w, H = CFG.canvas.h;

  let canvas, ctx;

  // 状态
  let phase = 'menu';          // menu | playing | paused | settle
  let mode = 'campaign';       // campaign | endless
  let level = 1;
  let player, bosses = [];
  let enemies = [], pickups = [];

  // 波次
  let waveIndex = 0, waveTimer = 0, waveCount = 0, bossTriggered = false, bossCleared = false;
  let nextBossWave = 0;        // 无尽模式：下一个BOSS出现的波次

  // 得分
  let score = 0, combo = 0, comboTimer = 0, maxCombo = 0, kills = 0, elapsed = 0;

  // 结算是否新纪录 / 是否通关
  let newRecord = false, won = false;

  // 关卡横幅 {title, sub, t}
  let banner = null;

  // 背景星星
  let stars = [];
  function initStars() {
    stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.8 + 0.2 });
  }

  // 屏幕震动
  let shake = 0;

  // DOM 引用
  const $ = id => document.getElementById(id);
  const hud = { lpFill: $('lp-fill'), lpLabel: $('lp-label'), bossWrap: $('boss-bar-wrap'), bossFill: $('boss-fill'), bossName: $('boss-name'),
    lives: $('lives'), shield: $('shield'), score: $('score'), combo: $('combo'), energy: $('energy-fill'), bombs: $('bomb-count'), hudEl: $('hud') };

  // ---- 升级商店（持久化） ----
  window.Upgrade = (function () {
    const KEY = 'starDef_upgrade';
    let data = { coins: 0, levels: { attack: 0, hp: 0, defense: 0, speed: 0 } };
    try { data = Object.assign(data, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
    function level(k) { return data.levels[k] || 0; }
    function cost(k) { const c = CFG.upgrade[k]; return Math.round(c.baseCost * Math.pow(c.costMult, level(k))); }
    function canUpgrade(k) { return level(k) < CFG.upgrade.cap && data.coins >= cost(k); }
    function buy(k) {
      if (!canUpgrade(k)) return false;
      data.coins -= cost(k); data.levels[k]++;
      save(); return true;
    }
    function stats() {
      return {
        hp: CFG.upgrade.hp.add * level('hp'),
        defense: CFG.upgrade.defense.add * level('defense'),
        speedMult: 1 + CFG.upgrade.speed.mult * level('speed'),
        dmgMult: 1 + CFG.upgrade.attack.dmg * level('attack')
      };
    }
    function addCoins(n) { data.coins += n; save(); }
    function resetAll() { data.coins = 0; data.levels = { attack: 0, hp: 0, defense: 0, speed: 0 }; save(); }
    return { level, cost, canUpgrade, buy, stats, addCoins, get coins() { return data.coins; }, get levels() { return data.levels; }, resetAll };
  })();

  // 本局金币收益
  let coinsGained = 0;

  function newGame(m) {
    mode = m; level = 1; won = false; resetMatch();
    phase = 'playing';
    hud.hudEl.classList.remove('hidden');
    hud.bossWrap.classList.add('hidden');
    if (mode === 'campaign') showBanner('第 1 关 · ' + LEVEL_INFO[0].name, LEVEL_INFO[0].sub);
    showHud();
  }

  // keepPlayer: 关卡推进时保留火力/生命/护盾等成长
  function resetMatch(keepPlayer) {
    const old = keepPlayer && player ? player : null;
    player = new Ent.Player();
    if (old) {
      player.hp = old.hp; player.shield = old.shield; player.power = old.power;
      player.bombs = old.bombs; player.energy = old.energy;
    }
    enemies = []; pickups = [];
    bosses = []; bossTriggered = false; bossCleared = false;
    waveIndex = 0; waveTimer = 1.2; waveCount = 0;
    nextBossWave = CFG.endlessBossEvery;
    score = keepPlayer ? score : 0;
    combo = 0; comboTimer = 0; maxCombo = keepPlayer ? maxCombo : 0;
    kills = keepPlayer ? kills : 0; elapsed = keepPlayer ? elapsed : 0;
    coinsGained = keepPlayer ? coinsGained : 0;
    shake = 0; newRecord = false;
    SFX.stopMemeSong();
    initStars();
    updateHud(true);
  }

  // ---- 波次生成 ----
  // 每关波次总数（拉长单局时长）
  function totalWaves() {
    if (mode === 'endless') return CFG.endlessWaves;
    return CFG.levelWaves[level - 1] || 8;
  }
  // 每波敌人数量
  function waveEnemyCount() {
    if (mode === 'endless') return CFG.endlessWaves;
    return 4 + level;
  }
  // 各关卡敌机编成
  function waveTypes() {
    if (mode === 'endless') return pickWaveTypesEndless(level);
    const table = [
      ['small', 'small', 'mid', 'small'],
      ['small', 'mid', 'ram', 'small', 'mid'],
      ['small', 'mid', 'ram', 'mid', 'elite', 'ram']
    ];
    return table[level - 1] || table[0];
  }
  function spawnWave() {
    const size = waveEnemyCount();
    const types = waveTypes();
    for (let i = 0; i < size; i++) {
      const t = types[i % types.length];
      const x = Utils.rand(40, W - 40);
      spawnEnemy(t, x, -30 - (i % 3) * 26);
    }
    // 精英
    if (Math.random() < (mode === 'endless' ? 0.5 : 0.6)) {
      const t = mode === 'endless' ? (level > 3 ? 'elite' : 'mid') : (level >= 2 ? 'elite' : 'mid');
      spawnEnemy(t, Utils.rand(60, W - 60), -40);
    }
    waveCount++;
  }
  function pickWaveTypesEndless(lv) {
    const base = ['small', 'small', 'mid'];
    if (lv >= 2) base.push('ram');
    if (lv >= 4) base.push('mid', 'ram');
    return base;
  }
  function spawnEnemy(type, x, y) {
    const e = new Ent.Enemy(type, x, y);
    // 战役模式：关卡越高敌机越耐打（拉长战斗节奏）
    if (mode === 'campaign') {
      const scale = 1 + (level - 1) * 0.35;
      e.hp = e.maxHp = Math.ceil(e.hp * scale);
    }
    if (type === 'elite') {
      // 精英怪嘲讽
      e.taunt = Utils.choose(TAUNTS.eliteEnter);
      e.tauntT = 1.6;
      SFX.play('taunt');
    }
    enemies.push(e);
  }

  function startBoss() {
    bossTriggered = true;
    bossCleared = false;
    shake = 0.6;
    if (mode === 'campaign' && level === 3) {
      // ===== 第三关：双BOSS复仇战（随机播放一首玩梗BGM） =====
      bosses = [
        new BossSystem.Boss(1, { def: BOSS_DEFS[0], hpMult: 0.8, x: W * 0.3, dual: true }),
        new BossSystem.Boss(1, { def: BOSS_DEFS[1], hpMult: 0.8, x: W * 0.7, dual: true })
      ];
      SFX.playMemeSong(Math.random() < 0.5 ? 'jitn' : 'dbd');
      showBanner('最终决战 · 双BOSS复仇战', '鸡哥 & 雨姐 联手出击！');
    } else if (mode === 'endless') {
      // ===== 无尽模式：随机出现鸡哥/雨姐之一，血量随波数增长 =====
      const def = Math.random() < 0.5 ? BOSS_DEFS[0] : BOSS_DEFS[1];
      const hpMult = 0.9 + level * 0.15;
      bosses = [new BossSystem.Boss(1, { def, hpMult })];
      const theme = bosses[0].theme;
      if (theme === 'jitn' || theme === 'dbd') SFX.playMemeSong(theme);
      showBanner('BOSS 战 · ' + bosses[0].name,
        (theme === 'jitn' ? '♪ 鸡你太美~' : '♪ 大东北我的家乡~') + ' · 无尽强化 ×' + hpMult.toFixed(2));
    } else {
      bosses = [new BossSystem.Boss(level)];
      // ===== BOSS 出场：播放对应玩梗 BGM =====
      const theme = bosses[0].theme;
      if (theme === 'jitn' || theme === 'dbd') SFX.playMemeSong(theme);
      showBanner('BOSS 战 · ' + bosses[0].name, theme === 'jitn' ? '♪ 鸡你太美~' : theme === 'dbd' ? '♪ 大东北我的家乡~' : '');
    }
    showHud();
  }

  // ---- 关卡横幅 ----
  function showBanner(title, sub) {
    banner = { title, sub: sub || '', t: 2.6 };
  }

  // ---- 掉落 ----
  function drop(x, y) {
    const r = Math.random();
    let type;
    if (r < 0.5) type = 'C';
    else if (r < 0.62) type = 'P';
    else if (r < 0.72) type = 'S';
    else if (r < 0.8) type = 'B';
    else if (r < 0.86) type = 'H';
    else type = 'P';
    pickups.push(new Ent.Pickup(x, y, type));
  }

  // ---- 碰撞 ----
  function collide() {
    const { myBulletPool, enBulletPool } = Ent;
    // 我方子弹 vs 敌机 / Boss（多个，只打存活者）
    const aliveBosses = bosses.filter(b => !b.dead);
    const targets = aliveBosses.length ? aliveBosses : enemies;
    for (const b of myBulletPool.active) {
      for (const t of targets) {
        const rr = t.radius + CFG.bullets.myRadius;
        if (Utils.dist2(b.x, b.y, t.x, t.y) < rr * rr) {
          b.dead = true;
          const dmg = b.dmg * (bosses.length ? 1 : 1);
          if (bosses.length) {
            const died = t.hit(dmg);
            if (died) onSingleBossDown(t);
          } else {
            registerKill(t);
          }
          break;
        }
      }
    }
    // 敌方子弹 vs 玩家（按弹种半径）
    if (player.alive) {
      for (const b of enBulletPool.active) {
        const rr = b.r + CFG.player.radius;
        if (Utils.dist2(b.x, b.y, player.x, player.y) < rr * rr) {
          b.dead = true;
          if (player.takeDamage()) { GFX.popText(player.x, player.y - 20, 'Ouch!', '#ff3b3b', 18); resetCombo(); }
          break;
        }
      }
    }
    // 敌机 vs 玩家（机体碰撞）
    if (player.alive) {
      for (const e of enemies) {
        const rr = e.radius + CFG.player.radius;
        if (Utils.dist2(e.x, e.y, player.x, player.y) < rr * rr) {
          e.hit(4); registerKill(e);
          if (player.takeDamage()) resetCombo();
        }
      }
    }
    // 道具拾取
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      if (player.alive && Utils.dist2(p.x, p.y, player.x, player.y) < 26 * 26) {
        applyPickup(p); pickups.splice(i, 1);
      }
    }
    // Boss 与玩家碰撞（仅存活BOSS）
    if (player.alive) {
      for (const bs of bosses) {
        if (bs.dead) continue;
        if (Utils.dist2(bs.x, bs.y, player.x, player.y) < (bs.radius + CFG.player.radius) * (bs.radius + CFG.player.radius)) {
          if (player.takeDamage()) resetCombo();
        }
      }
    }
  }

  function registerKill(e) {
    if (e.dead) return;
    combo = Math.min(combo + 1, CFG.combo.maxMult);
    comboTimer = CFG.combo.resetTime;
    maxCombo = Math.max(maxCombo, combo);
    kills++;
    const gained = e.score * combo;
    score += gained;
    GFX.popText(e.x, e.y, '+' + gained, combo >= 5 ? '#ffd54a' : '#fff', combo >= 5 ? 18 : 14);
    GFX.explosion(e.x, e.y, e.color, e.type === 'elite');
    SFX.play('explode');
    // 掉落
    if (Math.random() < 0.35) drop(e.x, e.y);
    // 金币奖励
    const coinVal = CFG.coins[e.type] || 0;
    if (coinVal) { Upgrade.addCoins(coinVal); coinsGained += coinVal; }
    player.gainEnergy(CFG.player.skill.energyPerKill);
    e.dead = true;
    enemies = enemies.filter(x => x !== e);
  }

  function applyPickup(p) {
    SFX.play('pickup');
    switch (p.type) {
      case 'P': player.power = Math.min(player.power + 1, CFG.player.maxLevel); SFX.play('power'); GFX.popText(p.x, p.y, 'POWER UP', '#ffd54a', 18); break;
      case 'S': player.shield = Math.min(player.shield + 1, player.maxShield); break;
      case 'B': player.bombs++; break;
      case 'H': player.hp = Math.min(player.hp + 1, 5); break;
      case 'C': { const cv = CFG.coins.coinPickup; score += cv; Upgrade.addCoins(cv); coinsGained += cv; GFX.popText(p.x, p.y, '+'+cv+'💰', '#ffd54a', 14); break; }
    }
    updateHud();
  }

  // 单个 BOSS 倒下（双BOSS战只有全部倒下才过关）
  function onSingleBossDown(bs) {
    if (bossCleared || bs.rewarded) return;   // 防止死后仍被命中导致重复结算
    bs.rewarded = true;
    score += 2500;
    Upgrade.addCoins(CFG.coins.boss / 2 | 0); coinsGained += CFG.coins.boss / 2 | 0;
    GFX.popText(bs.x, bs.y, 'BOSS DOWN!', '#ffd54a', 20);
    for (let i = 0; i < 3; i++) drop(bs.x + Utils.rand(-30, 30), bs.y);
    player.gainEnergy(20);
    if (bosses.every(b => b.dead)) onBossKilled();
  }

  function onBossKilled() {
    if (bossCleared) return;
    bossCleared = true;
    score += 5000;
    Upgrade.addCoins(CFG.coins.boss); coinsGained += CFG.coins.boss;
    SFX.stopMemeSong();
    GFX.popText(W / 2, H / 2 - 40, 'BOSS DOWN! +5000', '#ffd54a', 24);
    // 大量掉落
    const bx = bosses[0] ? bosses[0].x : W / 2;
    for (let i = 0; i < 6; i++) drop(bx + Utils.rand(-40, 40), 150);
    player.gainEnergy(40);
    if (mode === 'endless') {
      // 无尽模式：Boss 倒下后继续刷怪，稍后迎来更强的随机玩梗 Boss
      setTimeout(() => {
        if (phase !== 'playing') return;   // 过场期间玩家阵亡则不再推进
        bosses = []; bossTriggered = false; bossCleared = false;
        nextBossWave = waveCount + CFG.endlessBossEvery;
        showBanner('危机暂解', '下一个玩梗 BOSS 正在赶来的路上…');
        SFX.play('levelup');
      }, 1600);
      return;
    }
    setTimeout(() => {
      if (phase !== 'playing') return;   // 过场期间玩家阵亡则不再推进
      if (mode === 'campaign' && level < CFG.levels) {
        level++;
        resetMatch(true);          // 保留成长进入下一关
        const info = LEVEL_INFO[level - 1];
        showBanner('第 ' + level + ' 关 · ' + info.name, info.sub);
        SFX.play('levelup');
      } else {
        if (mode === 'campaign') won = true;
        finishGame();
      }
    }, 1600);
  }

  function finishGame() {
    phase = 'settle';
    SFX.stopMemeSong();
    saveRecord();
    UI.showSettle(score, rank(), maxCombo, kills, elapsed, newRecord, mode, won);
  }

  function rank() {
    if (score >= 20000) return 'S';
    if (score >= 12000) return 'A';
    if (score >= 6000) return 'B';
    return 'C';
  }

  function resetCombo() { combo = 0; comboTimer = 0; }

  // ---- 排行榜 ----
  function saveRecord() {
    const key = 'starDef_rank_' + mode;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    list.push({ score, combo: maxCombo, kills, time: Math.floor(elapsed), level, date: Date.now() });
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {}
    newRecord = list[0] && list[0].score === score;
  }
  function getRanks(modeName) {
    const key = 'starDef_rank_' + (modeName || mode);
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
  }

  // ---- 更新 ----
  function update(dt) {
    if (phase !== 'playing') return;
    elapsed += dt;
    Input.update(dt);

    // 玩家
    if (player.alive) {
      // 移动：键盘 / 虚拟摇杆 / 拖拽跟随
      let mx = Input.kbX, my = Input.kbY;
      if (Input.stickActive) { mx = Input.stickDX; my = Input.stickDY; }
      else if (Input.pointerActive && Input.isTouch) {
        // 拖拽跟随：飞船位于手指上方，避免手指遮挡
        player.x = Utils.clamp(Input.pointerX, 20, W - 20);
        player.y = Utils.clamp(Input.pointerY - 45, 40, H - 20);
        mx = 0; my = 0;
      }
      if (mx || my) player.move(dt, mx, my);
      player.fire(dt);
      player.update(dt);
      if (Input.consumeSkill() && player.useSkill()) { GFX.spark(player.x, player.y, '#7B5CFF', 40); }
      if (Input.consumeBomb() && player.useBomb()) {
        // 全屏炸弹：清弹幕 + 秒小怪
        for (const e of enemies) { registerKill(e); }
        while (Ent.enBulletPool.active.length) Ent.enBulletPool.active[Ent.enBulletPool.active.length - 1].dead = true;
        GFX.explosion(player.x, player.y, '#00E5FF', true);
        shake = 0.4;
      }
    }

    // 波次生成（无 Boss 时）
    if (!bossTriggered) {
      // 战役：波次打完等清场出 Boss；无尽：到达 BOSS 波次等清场出随机玩梗 Boss
      const bossPending = mode === 'campaign'
        ? waveCount >= totalWaves()
        : waveCount >= nextBossWave;
      if (!bossPending) {
        waveTimer -= dt;
        if (waveTimer <= 0 && enemies.length < 8) {
          spawnWave();
          waveTimer = mode === 'endless' ? 1.2 : 1.6;
        }
      } else if (enemies.length === 0) {
        startBoss();
      }
    }

    // 无尽模式：持续出波，难度递增（用 level 表示波数）
    if (mode === 'endless') {
      level = Math.floor(waveCount / 3) + 1;
    }

    // 敌机
    for (const e of enemies) e.update(dt, player);
    enemies = enemies.filter(e => !e.dead);
    // 精英嘲讽气泡计时
    for (const e of enemies) {
      if (e.taunt && e.tauntT > 0) { e.tauntT -= dt; if (e.tauntT <= 0) e.taunt = null; }
    }

    // Boss（多个，全部存活时更新；死亡的即时移除出更新列表）
    for (const bs of bosses) {
      if (!bs.dead) bs.update(dt, player, (x, y, a, s, k) => Ent.fireEnemy(x, y, a, s, k));
    }

    // 子弹
    Ent.updateBullets(dt);

    // 碰撞
    collide();

    // 道具
    for (const p of pickups) p.update(dt);
    pickups = pickups.filter(p => !p.dead);

    // 连击计数
    if (combo > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) resetCombo();
    }

    // 玩家死亡判定
    if (!player.alive && phase === 'playing') {
      SFX.play('gameover');
      SFX.stopMemeSong();
      setTimeout(() => { if (phase === 'over_delay') finishGame(); }, 900);
      phase = 'over_delay';
    }
    if (phase === 'over_delay') { /* 等待 timeout */ }

    // 横幅计时
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }

    // 粒子
    GFX.update(dt);
    if (shake > 0) shake = Math.max(0, shake - dt * 2);

    updateHud();
  }

  // ---- HUD 同步 ----
  function showHud() { updateHud(true); }
  let lastHud = {};
  function updateHud(force) {
    if (!player) return;
    // 关卡进度条
    let pct = 0;
    if (mode === 'campaign') {
      if (bosses.length) { pct = 100; hud.lpFill.classList.add('boss'); }
      else {
        const total = totalWaves();
        pct = Math.min(100, (waveCount / total) * 100);
        hud.lpFill.classList.remove('boss');
      }
      const label = bosses.length ? ('第 ' + level + ' 关 · BOSS') : ('第 ' + level + ' 关 · 波次 ' + Math.min(waveCount + 1, totalWaves()) + '/' + totalWaves());
      if (hud.lpLabel.textContent !== label) hud.lpLabel.textContent = label;
    } else {
      pct = (level % 3) * 33.3;
      hud.lpFill.classList.remove('boss');
      const label = bosses.length ? '无尽模式 · BOSS 战' : '无尽模式 · 波 ' + waveCount;
      if (hud.lpLabel.textContent !== label) hud.lpLabel.textContent = label;
    }
    hud.lpFill.style.width = pct + '%';

    // Boss 血条（多BOSS合并显示）
    const liveBosses = bosses.filter(b => !b.dead);
    if (liveBosses.length && !bossCleared) {
      hud.bossWrap.classList.remove('hidden');
      hud.bossName.textContent = liveBosses.length > 1 ? '复仇者 · 鸡哥 & 雨姐' : liveBosses[0].name;
      const hp = liveBosses.reduce((s, b) => s + Math.max(0, b.hp), 0);
      const max = liveBosses.reduce((s, b) => s + b.maxHp, 0);
      hud.bossFill.style.width = (hp / max * 100) + '%';
    } else {
      hud.bossWrap.classList.add('hidden');
    }

    // 生命 / 护盾
    const livesStr = '♥'.repeat(Math.max(0, player.hp));
    if (lastHud.l !== livesStr) { hud.lives.textContent = livesStr; lastHud.l = livesStr; }
    const shieldStr = player.shield > 0 ? '🛡'.repeat(player.shield) : '';
    if (lastHud.s !== shieldStr) { hud.shield.textContent = shieldStr; lastHud.s = shieldStr; }

    // 分数
    if (lastHud.sc !== score) { hud.score.textContent = score.toLocaleString(); lastHud.sc = score; }
    // 连击
    if (combo >= 2) hud.combo.textContent = '连击 ×' + combo; else hud.combo.textContent = '';
    // 能量
    hud.energy.style.width = (player.energy / CFG.player.skill.max * 100) + '%';
    // 炸弹
    if (lastHud.b !== player.bombs) { hud.bombs.textContent = player.bombs; lastHud.b = player.bombs; }
  }

  // ---- 渲染 ----
  function render() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake * 14, (Math.random() - 0.5) * shake * 14);
    }
    // 背景
    ctx.fillStyle = '#05060f';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    // 星云
    const grad = ctx.createRadialGradient(W / 2, H * 0.3, 40, W / 2, H * 0.3, H);
    grad.addColorStop(0, 'rgba(123,92,255,0.12)');
    grad.addColorStop(1, 'rgba(5,6,15,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    // 星星滚动
    for (const s of stars) {
      s.y += s.z * 90 * 0.016;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      ctx.fillStyle = `rgba(255,255,255,${0.3 + s.z * 0.5})`;
      ctx.fillRect(s.x, s.y, s.z * 2, s.z * 3);
    }
    // 实体
    for (const p of pickups) p.render(ctx);
    for (const e of enemies) {
      e.render(ctx);
      if (e.taunt) renderEliteTaunt(ctx, e);
    }
    for (const bs of bosses) if (!bs.dead) bs.render(ctx);
    Ent.renderBullets(ctx);
    if (player) player.render(ctx);
    GFX.render(ctx);
    // 关卡横幅
    if (banner) renderBanner(ctx);
    ctx.restore();
  }

  // 关卡 / BOSS 横幅（大标题 + 副标题，淡入淡出）
  function renderBanner(ctx) {
    const t = banner.t;
    const a = Math.min(1, Math.min(2.6 - t, t) / 0.4);   // 首尾 0.4s 渐变
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.textAlign = 'center';
    // 标题
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 24;
    ctx.fillText(banner.title, W / 2, H * 0.38);
    // 副标题
    if (banner.sub) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#8fd3ff'; ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 10;
      ctx.fillText(banner.sub, W / 2, H * 0.38 + 34);
    }
    // 装饰线
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,229,255,.5)'; ctx.lineWidth = 2;
    const lw = 200;
    ctx.beginPath();
    ctx.moveTo(W / 2 - lw, H * 0.38 + 54); ctx.lineTo(W / 2 + lw, H * 0.38 + 54);
    ctx.stroke();
    ctx.restore();
  }

  function renderEliteTaunt(ctx, e) {
    const a = Math.min(1, e.tauntT / 0.3);
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(e.taunt).width + 20;
    const by = e.y - e.radius - 18;
    ctx.fillStyle = 'rgba(10,16,40,.9)'; ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(e.x - tw / 2, by - 16, tw, 24, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5c8a'; ctx.fillText(e.taunt, e.x, by + 3);
    ctx.restore();
  }

  // ---- 控制接口 ----
  function togglePause() {
    if (phase === 'playing') { phase = 'paused'; SFX.pauseMemeSong(); UI.showPause(); }
    else if (phase === 'paused') { phase = 'playing'; SFX.resumeMemeSong(); UI.hideOverlay(); }
  }
  function restart() { newGame(mode); }
  function toggleMute() { SFX.setMuted(!SFX.isMuted()); const b = $('mute-btn'); if (b) b.textContent = SFX.isMuted() ? '🔇 已静音' : '🔊 音效'; return SFX.isMuted(); }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - (Game._lt || ts)) / 1000);
    Game._lt = ts;
    if (phase === 'playing') update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function init(c) {
    canvas = c; ctx = canvas.getContext('2d');
    initStars();
    GFX.update(0);
    requestAnimationFrame(loop);
  }

  return { init, newGame, restart, togglePause, toggleMute, getRanks, Upgrade,
    get coinsGained() { return coinsGained; },
    get mode() { return mode; }, get score() { return score; },
    // 调试钩子：控制台强制触发BOSS / 跳关验证
    debug: {
      startBossNow() {
        if (phase !== 'playing') return 'not playing';
        waveCount = totalWaves(); enemies = [];
        if (!bossTriggered) { startBoss(); return 'boss started'; }
        return 'boss already active';
      },
      gotoLevel(lv) {
        if (phase !== 'playing' || lv < 1 || lv > CFG.levels) return 'invalid';
        level = lv;
        const info = LEVEL_INFO[lv - 1];
        resetMatch(true);
        showBanner('第 ' + lv + ' 关 · ' + info.name, info.sub);
        return 'level ' + lv;
      },
      killBoss() {
        if (phase !== 'playing') return 'not playing';
        const alive = bosses.filter(b => !b.dead);
        if (!alive.length) return 'no boss';
        for (const bs of alive) {
          bs.dead = true;
          GFX.explosion(bs.x, bs.y, '#fff', true);
          onSingleBossDown(bs);
        }
        return 'boss killed';
      },
      state() { return { phase, mode, level, waveCount, bossCount: bosses.length, bossTriggered, nextBossWave, meme: SFX.currentMeme() }; }
    } };
})();
