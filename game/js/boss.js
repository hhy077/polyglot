// ===== Boss 战：玩梗主题 BOSS / 多阶段 / 弹幕模式 / 嘲讽 / 血条 =====
// 鸡哥（唱跳Rap篮球梗）· 雨姐（大东北梗）· 双BOSS复仇战
// 形象采用"表情包照片卡"渲染：梗图 + 白边相纸 + 底部梗文字
window.BossSystem = (function () {
  const { CFG, Utils, GFX, SFX, Ent, TAUNTS, LYRICS } = window;
  const W = CFG.canvas.w, H = CFG.canvas.h;

  // ---- 玩梗形象图（本地资源，随游戏部署） ----
  const IMG = {
    jige: Object.assign(new Image(), { src: 'assets/jige.png' }),
    yujie: Object.assign(new Image(), { src: 'assets/yujie.png' })
  };
  function imgOk(img) { return img && img.complete && img.naturalWidth > 0; }

  // 主题对应的嘲讽语料前缀
  const THEME_TAUNT = { jitn: 'jige', dbd: 'yujie' };

  // 表情包底部梗文字（随阶段/狂暴变化）
  const CAPTIONS = {
    jitn: { 1: '只因你太美~', 2: '你干嘛~！', 3: '唱跳Rap篮球！', rage: '食不食油饼！！！' },
    dbd:  { 1: '大东北我的家乡~', 2: '上酸菜！', 3: '老妹儿来啦~', rage: '哎妈呀！！！' }
  };

  class Boss {
    // opts: { def: 指定BOSS定义(双BOSS用), hpMult: 血量倍率, x: 初始x, dual: 是否双BOSS分居一侧 }
    constructor(level, opts = {}) {
      const def = opts.def || BOSS_DEFS[level - 1] || BOSS_DEFS[0];
      this.def = def; this.name = def.name;
      this.theme = def.theme || null;
      this.maxHp = Math.round(def.hp * (opts.hpMult || 1)); this.hp = this.maxHp;
      this.x = opts.x != null ? opts.x : W / 2; this.y = -140; this.enterY = 140;
      this.dual = !!opts.dual;
      this.radius = this.dual ? 46 : 54;   // 照片卡半宽（碰撞半径）
      // 双BOSS各守半场，避免重叠
      this.sideRange = this.dual
        ? (this.x < W / 2 ? [70, W / 2 - 70] : [W / 2 + 70, W - 70])
        : [80, W - 80];
      this.color = def.color;
      this.stage = 1;
      this.stageHp = this.maxHp / CFG.boss.stages;
      this.patterns = def.patterns.slice();
      this.curPattern = this.patterns[0];
      this.patternTimer = 2.2;
      this.aimAngle = 0;
      this.entering = true;
      this.raged = false;
      this.dead = false;
      this.tauntsShown = { stage: {}, rage: false };
      this.time = 0;
      this.tauntBubble = null; // {text, t}
      this.lyricTimer = 2.2;  // 歌词飘字计时
      this.flash = 0;         // 受击白闪
      // 说开场嘲讽（玩梗 BOSS 用专属语料）
      this.say(Utils.choose(this.taunts('Enter')), true);
    }

    // 按主题取嘲讽语料：Enter / Stage2 / Stage3 / Rage
    taunts(kind) {
      const key = THEME_TAUNT[this.theme];
      if (key && TAUNTS[key + kind]) return TAUNTS[key + kind];
      const map = { Enter: 'bossEnter', Stage2: 'bossStage2', Stage3: 'bossStage3', Rage: 'bossRage' };
      return TAUNTS[map[kind]] || TAUNTS.bossEnter;
    }

    say(text, force) {
      if (this.tauntBubble && !force) return;
      this.tauntBubble = { text, t: 1.8 };
      SFX.play('taunt');
    }

    update(dt, player, fireEnemy) {
      this.time += dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.tauntBubble) { this.tauntBubble.t -= dt; if (this.tauntBubble.t <= 0) this.tauntBubble = null; }

      if (this.entering) {
        this.y += 60 * dt;
        if (this.y >= this.enterY) this.entering = false;
        return;
      }

      // 歌词飘字（配合玩梗 BGM）
      if (this.theme && LYRICS[this.theme]) {
        this.lyricTimer -= dt;
        if (this.lyricTimer <= 0) {
          this.lyricTimer = Utils.rand(2.4, 3.4);
          const text = Utils.choose(LYRICS[this.theme]);
          GFX.popText(Utils.clamp(this.x, 80, W - 80), 190, text, this.theme === 'jitn' ? '#ffd54a' : '#7bed9f', 16);
        }
      }

      // 左右游走
      this.x += Math.sin(this.time * (this.dual ? 1.1 : 0.8)) * 60 * dt;
      this.x = Utils.clamp(this.x, this.sideRange[0], this.sideRange[1]);

      // 阶段切换判定
      const passed = this.stage * this.stageHp;
      if (this.hp <= passed && this.stage < CFG.boss.stages) {
        this.stage++;
        this.curPattern = this.patterns[Math.min(this.stage - 1, this.patterns.length - 1)];
        this.patternTimer = 1.2;
        GFX.explosion(this.x, this.y, this.color, true);
        this.say(Utils.choose(this.taunts('Stage' + this.stage)), true);
      }
      // 狂暴
      if (!this.raged && this.hp <= this.maxHp * CFG.boss.rageHpPct) {
        this.raged = true;
        this.say(Utils.choose(this.taunts('Rage')), true);
        GFX.explosion(this.x, this.y, '#ff3b3b', true);
        // 玩梗狂暴名场面大字
        const rageWord = this.theme === 'jitn' ? '你干嘛！！！' : this.theme === 'dbd' ? '哎妈呀！！！' : '！！！';
        GFX.popText(this.x, this.y - 80, rageWord, '#ff3b3b', 30);
      }

      // 发射弹幕（狂暴后节奏加快）
      this.patternTimer -= dt;
      if (this.patternTimer <= 0) {
        const rageMult = this.raged ? 0.62 : 1;
        const base = this.curPattern === 'spiral' ? 0.5
          : this.curPattern === 'rap' ? 0.85
          : this.curPattern === 'basketball' ? 1.5
          : this.curPattern === 'cabbage' ? 1.4
          : this.curPattern === 'noodle' ? 1.7
          : Utils.rand(1.4, 2.2);
        this.patternTimer = base * rageMult;
        this.firePattern(player, fireEnemy);
      }
    }

    firePattern(player, fireEnemy) {
      const cx = this.x, cy = this.y + this.radius * 0.6;   // 弹幕从照片卡下方发出
      const sp = CFG.bullets.enemySpeed * (1 + (this.stage) * 0.15);
      switch (this.curPattern) {
        // ==== 鸡哥专属 ====
        case 'basketball': {   // 篮球轰炸：瞄准玩家的扇形抛球
          const n = 2 + this.stage;
          const base = Utils.angleTo(cx, cy, player.x, player.y);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.38;
            fireEnemy(cx, cy, a, sp * 0.8, 'ball');
          }
          break;
        }
        case 'rap': {          // 说唱连发：密集直线弹雨
          const a = Utils.angleTo(cx, cy, player.x, player.y);
          const n = 5 + this.stage * 2;
          for (let i = 0; i < n; i++) {
            fireEnemy(cx + Utils.rand(-14, 14), cy, a + Utils.rand(-0.07, 0.07), sp * 1.25, 'rap');
          }
          break;
        }
        // ==== 雨姐专属 ====
        case 'cabbage': {      // 酸菜乱炖：大范围慢速散射
          const n = 6 + this.stage;
          const base = Utils.angleTo(cx, cy, player.x, player.y);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.32;
            fireEnemy(cx, cy, a, sp * 0.68, 'cabbage');
          }
          break;
        }
        case 'noodle': {       // 粉条甩面：蛇形下落的白色长条
          const a0 = Utils.angleTo(cx, cy, player.x, player.y);
          const n = 9;
          for (let i = 0; i < n; i++) {
            const a = a0 + Math.sin(i * 0.85 + this.time * 3) * 0.55;
            fireEnemy(cx, cy + i * 7, a, sp * (0.8 + i * 0.05), 'noodle');
          }
          break;
        }
        // ==== 通用弹幕 ====
        case 'fan': {
          const n = 6 + this.stage; const base = Utils.angleTo(cx, cy, player.x, player.y);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.25;
            fireEnemy(cx, cy, a, sp);
          } break;
        }
        case 'ring': {
          const n = 16; const rot = this.time;
          for (let i = 0; i < n; i++) fireEnemy(cx, cy, Utils.TAU / n * i + rot, sp * 0.9);
          break;
        }
        case 'spiral': {
          this.aimAngle += 0.5;
          fireEnemy(cx, cy, this.aimAngle, sp);
          fireEnemy(cx, cy, this.aimAngle + Math.PI, sp * 0.9);
          break;
        }
        case 'random': {
          const n = 8;
          for (let i = 0; i < n; i++) fireEnemy(cx, cy, Math.random() * Utils.TAU, sp * (0.7 + Math.random() * 0.5));
          break;
        }
        case 'aim': {
          const a = Utils.angleTo(cx, cy, player.x, player.y);
          fireEnemy(cx, cy, a, sp + 60);
          fireEnemy(cx, cy, a - 0.3, sp); fireEnemy(cx, cy, a + 0.3, sp);
          break;
        }
      }
    }

    hit(dmg) {
      this.hp -= dmg;
      this.flash = 0.08;
      GFX.spark(this.x, this.y, this.color, 8);
      if (this.hp <= 0) { this.dead = true; GFX.explosion(this.x, this.y, '#fff', true); return true; }
      return false;
    }

    // 当前表情包梗文字
    caption() {
      const caps = CAPTIONS[this.theme];
      if (!caps) return '';
      return this.raged ? caps.rage : caps[Math.min(this.stage, 3)];
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      // 照片卡摇摆律动（狂暴时剧烈抖动）
      const wob = this.raged ? Math.sin(this.time * 18) * 0.06 : Math.sin(this.time * 1.8) * 0.045;
      ctx.rotate(wob);

      const img = this.theme === 'jitn' ? IMG.jige : this.theme === 'dbd' ? IMG.yujie : null;
      if (imgOk(img)) this.renderPhotoCard(ctx, img);
      else this.renderDefault(ctx);

      // 受击白闪 / 狂暴红光覆盖
      if (this.flash > 0) {
        const s = this.radius * 2;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, 8); ctx.fill();
        ctx.restore();
      }
      if (this.raged) {
        const s = this.radius * 2;
        ctx.save();
        ctx.globalAlpha = 0.18 + Math.sin(this.time * 8) * 0.08;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, 10, 0, 0, s);
        g.addColorStop(0, '#ff3b3b'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, s * 0.75, 0, Utils.TAU); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      this.renderCommon(ctx);
    }

    // ===== 表情包照片卡：梗图 + 白色相纸边框 + 底部梗文字 =====
    renderPhotoCard(ctx, img) {
      const s = this.radius * 2;             // 图片区域边长
      const capH = 26;                        // 底部文字区高度
      const bob = Math.sin(this.time * 2.4) * 3;  // 唱跳律动

      // 白色相纸（表情包照片卡）+ 主题色描边发光
      ctx.save();
      ctx.translate(0, bob * 0.3);
      ctx.shadowColor = this.color; ctx.shadowBlur = 26;
      ctx.fillStyle = '#fdfdf8';
      ctx.beginPath();
      ctx.roundRect(-s / 2 - 5, -s / 2 - 5, s + 10, s + 10 + capH, 10);
      ctx.fill();
      ctx.restore();

      // 梗图本体
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-s / 2, -s / 2, s, s, 6);
      ctx.clip();
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
      ctx.restore();

      // 底部梗文字（表情包经典黄字黑边）
      const cap = this.caption();
      if (cap) {
        ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000'; ctx.fillStyle = '#ffe95c';
        ctx.strokeText(cap, 0, s / 2 + capH / 2 - 2);
        ctx.fillText(cap, 0, s / 2 + capH / 2 - 2);
      }

      // 鸡哥：环绕篮球（唱跳Rap篮球）
      if (this.theme === 'jitn') {
        const ba = this.time * 2.4;
        for (const k of [0, Math.PI]) {
          this.drawBasketball(ctx, Math.cos(ba + k) * (this.radius + 18), Math.sin(ba + k) * 14 + 10, 9, ba + k);
        }
      }
      // 雨姐：身旁飞舞酸菜
      if (this.theme === 'dbd') {
        for (let i = 0; i < 3; i++) {
          const a = this.time * 2 + i * Utils.TAU / 3;
          const cx2 = Math.cos(a) * (this.radius + 20), cy2 = Math.sin(a) * 16 + 12;
          ctx.save();
          ctx.translate(cx2, cy2);
          ctx.shadowColor = '#7bed9f'; ctx.shadowBlur = 8;
          ctx.fillStyle = '#2ecc71';
          ctx.beginPath(); ctx.arc(0, 0, 7, 0, Utils.TAU); ctx.fill();
          ctx.restore();
        }
      }
    }

    drawBasketball(ctx, x, y, r, rot) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.shadowColor = '#ff9f43'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff8c42';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Utils.TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#4a2410'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Utils.TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
      ctx.restore();
    }

    // ===== 兜底形象（多边形核心，图片加载失败时） =====
    renderDefault(ctx) {
      ctx.shadowColor = this.color; ctx.shadowBlur = 24;
      ctx.fillStyle = '#12081f'; ctx.strokeStyle = this.color; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = Utils.TAU / 8 * i - Math.PI / 2, r = this.radius;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.rotate(this.time * 1.5);
      ctx.lineWidth = 2; ctx.strokeStyle = this.color;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.radius + 10, 0); ctx.stroke();
      }
      ctx.rotate(-this.time * 1.5);
      ctx.fillStyle = '#fff'; ctx.shadowColor = this.color; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(0, 0, 10 + Math.sin(this.time * 3) * 2, 0, Utils.TAU); ctx.fill();
    }

    // 公共：阶段标识 / 狂暴警示 / 嘲讽气泡
    renderCommon(ctx) {
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('PHASE ' + this.stage, this.x, this.y - this.radius - 24);

      if (this.raged) {
        ctx.fillStyle = '#ff3b3b'; ctx.font = 'bold 14px sans-serif';
        ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 12;
        ctx.fillText('⚠ RAGE', this.x, this.y + this.radius + 34);
        ctx.shadowBlur = 0;
      }

      if (this.tauntBubble) {
        const a = Math.min(1, this.tauntBubble.t / 0.3);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
        const tw = ctx.measureText(this.tauntBubble.text).width + 24;
        const bx = Utils.clamp(this.x, 90, W - 90), by = this.y - this.radius - 56;
        ctx.fillStyle = 'rgba(10,16,40,.9)'; ctx.strokeStyle = '#ff2e88'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(bx - tw / 2, by - 20, tw, 30, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff5c8a'; ctx.shadowColor = '#ff5c8a'; ctx.shadowBlur = 10;
        ctx.fillText(this.tauntBubble.text, bx, by + 4);
        ctx.restore();
      }
    }
  }

  return { Boss };
})();
