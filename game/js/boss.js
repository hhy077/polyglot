// ===== Boss 战：玩梗主题 BOSS / 多阶段 / 弹幕模式 / 嘲讽 / 血条 =====
// 鸡哥（唱跳Rap篮球梗）· 雨姐（大东北梗）· 双BOSS复仇战
window.BossSystem = (function () {
  const { CFG, Utils, GFX, SFX, Ent, TAUNTS, LYRICS } = window;
  const W = CFG.canvas.w, H = CFG.canvas.h;

  // 主题对应的嘲讽语料前缀
  const THEME_TAUNT = { jitn: 'jige', dbd: 'yujie' };

  class Boss {
    // opts: { def: 指定BOSS定义(双BOSS用), hpMult: 血量倍率, x: 初始x, dual: 是否双BOSS分居一侧 }
    constructor(level, opts = {}) {
      const def = opts.def || BOSS_DEFS[level - 1] || BOSS_DEFS[0];
      this.def = def; this.name = def.name;
      this.theme = def.theme || null;
      this.maxHp = Math.round(def.hp * (opts.hpMult || 1)); this.hp = this.maxHp;
      this.x = opts.x != null ? opts.x : W / 2; this.y = -120; this.enterY = 130;
      this.dual = !!opts.dual;
      // 双BOSS各守半场，避免重叠
      this.sideRange = this.dual
        ? (this.x < W / 2 ? [60, W / 2 - 60] : [W / 2 + 60, W - 60])
        : [70, W - 70];
      this.radius = 44; this.color = def.color;
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
          GFX.popText(Utils.clamp(this.x, 80, W - 80), 170, text, this.theme === 'jitn' ? '#ffd54a' : '#7bed9f', 16);
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
        GFX.popText(this.x, this.y - 70, rageWord, '#ff3b3b', 30);
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
      const cx = this.x, cy = this.y + 20;
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
      GFX.spark(this.x, this.y, this.color, 8);
      if (this.hp <= 0) { this.dead = true; GFX.explosion(this.x, this.y, '#fff', true); return true; }
      return false;
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.theme === 'jitn') this.renderJiGe(ctx);
      else if (this.theme === 'dbd') this.renderYuJie(ctx);
      else this.renderDefault(ctx);
      ctx.restore();
      this.renderCommon(ctx);
    }

    // ===== 形象一：鸡哥（中分发型 + 黑西装 + 篮球 + 话筒） =====
    renderJiGe(ctx) {
      const bob = Math.sin(this.time * 2.4) * 3;      // 唱跳律动
      ctx.save();
      ctx.translate(0, bob * 0.4);

      // --- 西装身体 ---
      ctx.fillStyle = '#16161c';
      ctx.beginPath();
      ctx.moveTo(-42, 58); ctx.quadraticCurveTo(-40, 26, -22, 14);
      ctx.lineTo(22, 14); ctx.quadraticCurveTo(40, 26, 42, 58);
      ctx.closePath(); ctx.fill();
      // 白衬衫 V 领 + 领带
      ctx.fillStyle = '#f4f4f8';
      ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(0, 34); ctx.lineTo(10, 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.moveTo(-3, 18); ctx.lineTo(3, 18); ctx.lineTo(2, 40); ctx.lineTo(-2, 40); ctx.closePath(); ctx.fill();

      // --- 头部 ---
      ctx.fillStyle = '#ffdcb8';
      ctx.beginPath(); ctx.arc(0, -12, 30, 0, Utils.TAU); ctx.fill();
      // 耳朵
      ctx.beginPath(); ctx.arc(-29, -12, 5, 0, Utils.TAU); ctx.arc(29, -12, 5, 0, Utils.TAU); ctx.fill();
      // 标志性中分黑发：左右两片刘海向两侧扫
      ctx.fillStyle = '#17171c';
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.bezierCurveTo(-16, -46, -30, -36, -31, -14);
      ctx.bezierCurveTo(-27, -28, -12, -33, -2, -28);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.bezierCurveTo(16, -46, 30, -36, 31, -14);
      ctx.bezierCurveTo(27, -28, 12, -33, 2, -28);
      ctx.closePath(); ctx.fill();
      // 眉毛
      ctx.strokeStyle = '#17171c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-17, -22); ctx.quadraticCurveTo(-12, -25, -7, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -22); ctx.quadraticCurveTo(12, -25, 17, -22); ctx.stroke();
      // 眼睛（狂暴变红）
      ctx.fillStyle = this.raged ? '#ff3b3b' : '#17171c';
      ctx.beginPath(); ctx.arc(-12, -16, 2.6, 0, Utils.TAU); ctx.arc(12, -16, 2.6, 0, Utils.TAU); ctx.fill();
      // 鼻子
      ctx.strokeStyle = '#d9a06b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-1, -8); ctx.stroke();
      // 嘴：平时自信微笑，狂暴时大喊"你干嘛"
      if (this.raged) {
        ctx.fillStyle = '#7a2020';
        ctx.beginPath(); ctx.ellipse(0, 1, 6, 8, 0, 0, Utils.TAU); ctx.fill();
      } else {
        ctx.strokeStyle = '#b3664d'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, -1, 8, 0.25, Math.PI - 0.25); ctx.stroke();
      }
      ctx.restore();

      // --- 环绕篮球（唱跳Rap篮球） ---
      const ba = this.time * 2.4;
      for (const k of [0, Math.PI]) {
        const bx = Math.cos(ba + k) * 56, by = Math.sin(ba + k) * 16 + 8;
        this.drawBasketball(ctx, bx, by, 9, ba + k);
      }
      // --- 手持话筒（Rap 阶段） ---
      if (this.curPattern === 'rap' || this.stage >= 2) {
        ctx.save();
        ctx.translate(34, 26 + bob);
        ctx.rotate(Math.sin(this.time * 6) * 0.12);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -6); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.shadowColor = '#ffd54a'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(0, -9, 5.5, 0, Utils.TAU); ctx.fill();
        ctx.restore();
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
      ctx.beginPath(); ctx.arc(-r * 1.05, 0, r * 0.7, -0.85, 0.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(r * 1.05, 0, r * 0.7, Math.PI - 0.85, Math.PI + 0.85); ctx.stroke();
      ctx.restore();
    }

    // ===== 形象二：雨姐（红头巾 + 高原红 + 花棉袄 + 菜篮） =====
    renderYuJie(ctx) {
      const bob = Math.sin(this.time * 2.8) * 4;      // 大碴子味律动
      ctx.save();
      ctx.translate(0, bob * 0.4);

      // --- 花棉袄身体（红底白花） ---
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-46, 58); ctx.quadraticCurveTo(-44, 24, -24, 12);
      ctx.lineTo(24, 12); ctx.quadraticCurveTo(44, 24, 46, 58);
      ctx.closePath(); ctx.fill();
      // 花朵点缀
      ctx.fillStyle = '#ffe9e0';
      for (const [fx, fy] of [[-30, 34], [-16, 48], [0, 30], [16, 46], [30, 32], [-6, 52], [24, 20]]) {
        for (let p = 0; p < 4; p++) {
          const a = Utils.TAU / 4 * p;
          ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.2, 0, Utils.TAU); ctx.fill();
        }
      }
      // 内搭黑衣
      ctx.fillStyle = '#3a2e28';
      ctx.beginPath(); ctx.moveTo(-9, 12); ctx.lineTo(9, 12); ctx.lineTo(6, 26); ctx.lineTo(-6, 26); ctx.closePath(); ctx.fill();

      // --- 头部 ---
      ctx.fillStyle = '#ffd2a6';
      ctx.beginPath(); ctx.arc(0, -12, 30, 0, Utils.TAU); ctx.fill();
      // 耳朵
      ctx.beginPath(); ctx.arc(-29, -12, 5, 0, Utils.TAU); ctx.arc(29, -12, 5, 0, Utils.TAU); ctx.fill();
      // 高原红腮红
      ctx.fillStyle = 'rgba(255,110,110,.55)';
      ctx.beginPath(); ctx.arc(-17, -4, 7, 0, Utils.TAU); ctx.arc(17, -4, 7, 0, Utils.TAU); ctx.fill();
      // 红头巾（东北大姨同款）：罩住头顶 + 顶部结
      ctx.fillStyle = '#e85050';
      ctx.beginPath();
      ctx.arc(0, -12, 31, Math.PI * 0.98, Math.PI * 2.02);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -46, 7, 0, Utils.TAU); ctx.fill();
      // 头巾两侧垂下的巾角
      ctx.beginPath();
      ctx.moveTo(-30, -20); ctx.quadraticCurveTo(-38, -4, -32, 6);
      ctx.quadraticCurveTo(-27, -6, -26, -18);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(30, -20); ctx.quadraticCurveTo(38, -4, 32, 6);
      ctx.quadraticCurveTo(27, -6, 26, -18);
      ctx.closePath(); ctx.fill();
      // 头巾条纹
      ctx.strokeStyle = '#ffd0d0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -12, 26, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      // 眼睛：开心眯眯眼（狂暴变怒目）
      if (this.raged) {
        ctx.strokeStyle = '#4a2410'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-16, -18); ctx.lineTo(-8, -14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(16, -18); ctx.lineTo(8, -14); ctx.stroke();
      } else {
        ctx.strokeStyle = '#4a2410'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(-12, -16, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, -16, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      }
      // 大嘴：热情爽朗的笑（狂暴大喊）
      if (this.raged) {
        ctx.fillStyle = '#7a2020';
        ctx.beginPath(); ctx.ellipse(0, 2, 8, 9, 0, 0, Utils.TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-6, -4, 12, 3);
      } else {
        ctx.fillStyle = '#7a2020';
        ctx.beginPath(); ctx.arc(0, -2, 9, 0.15, Math.PI - 0.15); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-6, -2, 12, 3);
      }
      ctx.restore();

      // --- 身旁酸菜篮子 ---
      ctx.save();
      ctx.translate(-52, 34 + bob);
      ctx.fillStyle = '#a9762f';
      ctx.beginPath();
      ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.lineTo(9, 14); ctx.lineTo(-9, 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2ecc71'; ctx.shadowColor = '#7bed9f'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, -2, 10, Math.PI, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ===== 兜底形象（多边形核心，无尽模式/未定义主题时） =====
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
      ctx.fillText('PHASE ' + this.stage, this.x, this.y - this.radius - 14);

      if (this.raged) {
        ctx.fillStyle = '#ff3b3b'; ctx.font = 'bold 14px sans-serif';
        ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 12;
        ctx.fillText('⚠ RAGE', this.x, this.y + this.radius + 24);
        ctx.shadowBlur = 0;
      }

      if (this.tauntBubble) {
        const a = Math.min(1, this.tauntBubble.t / 0.3);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
        const tw = ctx.measureText(this.tauntBubble.text).width + 24;
        const bx = Utils.clamp(this.x, 90, W - 90), by = this.y - this.radius - 46;
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
