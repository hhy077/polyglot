// ===== 实体：玩家 / 子弹 / 敌机 / 道具 / 僚机 =====
window.Ent = (function () {
  const { CFG, Utils, GFX, SFX } = window;
  const W = CFG.canvas.w, H = CFG.canvas.h;

  // ---------- 子弹（对象池） ----------
  const myBulletPool = new Utils.ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, dead: true, dmg: 1, crit: false, isMine: true }),
    b => { b.dead = true; }
  );
  const enBulletPool = new Utils.ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, dead: true, isMine: false, kind: null, r: CFG.bullets.enemyRadius, spin: Math.random() * Utils.TAU }),
    b => { b.dead = true; b.kind = null; b.r = CFG.bullets.enemyRadius; }
  );
  function fireMine(x, y, vx, vy, dmg, crit) {
    const b = myBulletPool.get();
    b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.dead = false; b.dmg = dmg; b.crit = crit; b.isMine = true;
    return b;
  }
  // kind: 'ball'篮球 | 'cabbage'酸菜 | 'noodle'粉条 | 'rap'说唱弹 | 默认普通弹
  const BULLET_STYLE = {
    ball:    { r: 8 },
    cabbage: { r: 7 },
    noodle:  { r: 5 },
    rap:     { r: 4 }
  };
  function fireEnemy(x, y, angle, speed, kind) {
    const b = enBulletPool.get();
    b.x = x; b.y = y; b.dead = false; b.isMine = false;
    b.kind = kind || null;
    b.r = (kind && BULLET_STYLE[kind]) ? BULLET_STYLE[kind].r : CFG.bullets.enemyRadius;
    b.vx = Math.cos(angle) * speed; b.vy = Math.sin(angle) * speed;
    return b;
  }
  function updateBullets(dt) {
    myBulletPool.update(dt, b => {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -20 || b.x < -10 || b.x > W + 10) b.dead = true;
    });
    enBulletPool.update(dt, b => {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > H + 20 || b.x < -10 || b.x > W + 10 || b.y < -20) b.dead = true;
    });
  }
  function renderBullets(ctx) {
    ctx.fillStyle = '#7be9ff';
    for (const b of myBulletPool.active) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.shadowColor = b.crit ? '#ffd54a' : '#7be9ff'; ctx.shadowBlur = 8;
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillRect(-6, -2, 12, 4);
      ctx.restore();
    }
    ctx.fillStyle = '#ff5c8a';
    for (const b of enBulletPool.active) {
      if (b.kind === 'ball') {          // 篮球：橙色球体 + 黑色球缝
        b.spin += 0.15;
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.spin);
        ctx.shadowColor = '#ff9f43'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff8c42';
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Utils.TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#4a2410'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Utils.TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-b.r, 0); ctx.lineTo(b.r, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -b.r); ctx.lineTo(0, b.r); ctx.stroke();
        ctx.beginPath(); ctx.arc(-b.r * 1.1, 0, b.r * 0.75, -0.9, 0.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(b.r * 1.1, 0, b.r * 0.75, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
        ctx.restore();
      } else if (b.kind === 'cabbage') { // 酸菜：绿菜叶团
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.shadowColor = '#7bed9f'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Utils.TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#1e8449'; ctx.lineWidth = 1.5;
        for (let k = 0; k < 3; k++) {
          const a = k * Utils.TAU / 3 + b.spin * 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * b.r * 0.3, Math.sin(a) * b.r * 0.3);
          ctx.quadraticCurveTo(Math.cos(a + 0.6) * b.r, Math.sin(a + 0.6) * b.r, Math.cos(a) * b.r * 0.9, Math.sin(a) * b.r * 0.9);
          ctx.stroke();
        }
        ctx.restore();
      } else if (b.kind === 'noodle') {  // 粉条：白色半透明长条
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.shadowColor = '#ffeaa7'; ctx.shadowBlur = 6;
        ctx.fillStyle = 'rgba(255,251,235,.95)';
        ctx.beginPath();
        ctx.roundRect(-b.r * 1.8, -b.r * 0.4, b.r * 3.6, b.r * 0.8, b.r * 0.4);
        ctx.fill();
        ctx.restore();
      } else if (b.kind === 'rap') {     // 说唱弹：金色快速小弹
        ctx.save();
        ctx.shadowColor = '#ffd54a'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffd54a';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Utils.TAU); ctx.fill();
        ctx.restore();
      } else {                            // 普通弹
        ctx.beginPath();
        ctx.shadowColor = '#ff5c8a'; ctx.shadowBlur = 8;
        ctx.arc(b.x, b.y, CFG.bullets.enemyRadius - 1, 0, Utils.TAU);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }

  // ---------- 玩家 ----------
  class Player {
    constructor() {
      this.reset(false);
    }
    reset(keepScore) {
      const p = CFG.player;
      const up = window.Upgrade ? Upgrade.stats() : { hp:0, defense:0, speedMult:1, dmgMult:1 };
      this.x = W / 2; this.y = H - 70;
      this.maxHp = p.maxHp + up.hp;
      this.maxShield = p.maxShield + up.defense;
      this.speed = p.speed * up.speedMult;
      this.dmgMult = up.dmgMult || 1;
      this.hp = this.maxHp; this.shield = this.maxShield;
      this.power = 1; this.fireTimer = 0;
      this.alive = true; this.invincible = 0;
      this.energy = 0; this.bombs = CFG.bombsStart;
      this.skillActive = false; this.skillTimer = 0;
      this.wingman = null;
      this.time = 0;
    }
    move(dt, mx, my) {
      const sp = this.speed;
      this.x += mx * sp * dt;
      this.y += my * sp * dt;
      this.x = Utils.clamp(this.x, 20, W - 20);
      this.y = Utils.clamp(this.y, 40, H - 20);
      // 尾焰
      GFX.trail(this.x, this.y + 14, '#00E5FF');
    }
    fire(dt) {
      this.fireTimer -= dt;
      if (this.fireTimer > 0) return;
      const rate = this.skillActive ? 0.05 : CFG.player.fireRate;
      this.fireTimer = rate;
      SFX.play('shoot');
      const lvl = this.power;
      const y = this.y - 18;
      const sp = CFG.bullets.mySpeed;
      const crit = Math.random() < CFG.bullets.crit;
      const dmg = (crit ? CFG.bullets.critMult : 1) * this.dmgMult;
      // 弹道分布
      const offsets = [[0, 0], [-8, 0], [8, 0], [-16, 0], [16, 0]];
      const centers = [[0], [-6, 6], [-6, 6, 0], [-12, 12, -4, 4], [-14, 14, -6, 6, 0]];
      const list = centers[Math.min(lvl - 1, centers.length - 1)];
      for (const off of list) {
        fireMine(this.x + off, y, 0, -sp, dmg, crit);
      }
      // 侧翼/全向
      if (lvl >= 4) { fireMine(this.x - 16, y + 6, -120, -sp + 60, dmg, crit); fireMine(this.x + 16, y + 6, 120, -sp + 60, dmg, crit); }
      if (lvl >= 5) { fireMine(this.x, y, -60, -sp + 40, dmg, crit); fireMine(this.x, y, 60, -sp + 40, dmg, crit); }
      if (this.wingman) { fireMine(this.wingman.x, this.wingman.y - 10, 0, -sp, dmg, crit); }
    }
    takeDamage() {
      if (this.invincible > 0 || !this.alive) return false;
      if (this.shield > 0) { this.shield--; this.invincible = CFG.player.invincible; SFX.play('shieldHit'); GFX.spark(this.x, this.y, '#00E5FF', 20); return false; }
      this.hp--;
      this.invincible = CFG.player.invincible;
      SFX.play('hurt');
      GFX.explosion(this.x, this.y, '#fff', false);
      if (this.hp <= 0) { this.alive = false; GFX.explosion(this.x, this.y, '#00E5FF', true); }
      return true;
    }
    gainEnergy(amount) { this.energy = Utils.clamp(this.energy + amount, 0, CFG.player.skill.max); }
    useSkill() {
      if (this.energy >= CFG.player.skill.max) {
        this.energy = 0; this.skillActive = true; this.skillTimer = CFG.player.skill.duration;
        SFX.play('skill');
        GFX.explosion(this.x, this.y, '#7B5CFF', true);
        return true;
      }
      return false;
    }
    useBomb() {
      if (this.bombs > 0) { this.bombs--; SFX.play('bomb'); return true; }
      return false;
    }
    update(dt) {
      if (this.invincible > 0) this.invincible -= dt;
      if (this.skillActive) {
        this.skillTimer -= dt;
        GFX.trail(this.x, this.y, '#7B5CFF');
        if (this.skillTimer <= 0) this.skillActive = false;
      }
      if (this.wingman) {
        this.wingman.x += (this.x - this.wingman.x - 24) * Math.min(1, dt * 6);
        this.wingman.y += (this.y - this.wingman.y) * Math.min(1, dt * 6);
      }
    }
    render(ctx) {
      if (!this.alive) return;
      if (this.invincible > 0 && Math.floor(this.time * 20) % 2 === 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      // 机身（霓虹三角）
      ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#0a1a2f';
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(14, 14); ctx.lineTo(0, 8); ctx.lineTo(-14, 14);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2; ctx.stroke();
      // 座舱
      ctx.fillStyle = '#7be9ff'; ctx.beginPath(); ctx.arc(0, -4, 4, 0, Utils.TAU); ctx.fill();
      // 护盾光圈
      if (this.shield > 0) {
        ctx.shadowBlur = 10; ctx.strokeStyle = 'rgba(0,229,255,.5)';
        ctx.beginPath(); ctx.arc(0, 0, 22, 0, Utils.TAU); ctx.stroke();
      }
      ctx.restore();
      if (this.wingman) {
        ctx.save();
        ctx.translate(this.wingman.x, this.wingman.y);
        ctx.shadowColor = '#00E5FF'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#0a1a2f'; ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 10); ctx.lineTo(0, 5); ctx.lineTo(-9, 10);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      this.time += 0.016;
    }
  }

  // ---------- 敌机 ----------
  class Enemy {
    constructor(type, x, y) {
      const d = CFG.enemy[type];
      this.type = type; this.x = x; this.y = y;
      this.hp = d.hp; this.maxHp = d.hp; this.score = d.score;
      this.speed = d.speed; this.radius = d.radius; this.color = d.color;
      this.fire = !!d.fire; this.ram = !!d.ram;
      this.fireTimer = Math.random() * 2;
      this.dead = false;
      this.enter = true; this.enterY = 40;
      this.seed = Math.random() * Utils.TAU;
    }
    update(dt, player) {
      if (this.enter) {
        this.y += this.speed * 1.5 * dt;
        this.x += Math.sin(this.seed) * 0.5;
        if (this.y >= this.enterY) { this.enter = false; }
        return;
      }
      // 移动
      if (this.ram && player) {
        const a = Utils.angleTo(this.x, this.y, player.x, player.y);
        this.x += Math.cos(a) * this.speed * dt;
        this.y += Math.sin(a) * this.speed * dt;
      } else {
        this.y += this.speed * dt;
        this.x += Math.sin(this.seed + this.y * 0.02) * 0.8;
      }
      // 开火
      if (this.fire && player) {
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
          this.fireTimer = Utils.rand(1.5, 2.5);
          const a = Utils.angleTo(this.x, this.y, player.x, player.y);
          fireEnemy(this.x, this.y, a, CFG.bullets.enemySpeed * 0.8);
        }
      }
      if (this.y > H + 40) this.dead = true;
    }
    hit(dmg) {
      this.hp -= dmg;
      GFX.spark(this.x, this.y, this.color, 6);
      if (this.hp <= 0) return true;
      return false;
    }
    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.color; ctx.shadowBlur = 10;
      ctx.fillStyle = '#12081f'; ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      if (this.type === 'small') {
        ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(9, -10); ctx.lineTo(0, -4); ctx.lineTo(-9, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (this.type === 'mid') {
        ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(14, -8); ctx.lineTo(0, -14); ctx.lineTo(-14, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Utils.TAU); ctx.fill();
      } else if (this.type === 'ram') {
        ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(10, -12); ctx.lineTo(0, -6); ctx.lineTo(-10, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(18, -10); ctx.lineTo(0, -18); ctx.lineTo(-18, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Utils.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------- 道具 ----------
  class Pickup {
    constructor(x, y, type) {
      this.x = x; this.y = y; this.type = type; this.dead = false;
      this.vy = 70; this.sway = Math.random() * Utils.TAU;
      this.color = { P: '#ffd54a', S: '#00E5FF', B: '#7be9ff', H: '#ff5c8a', C: '#ffd54a' }[type] || '#fff';
      this.label = this.type;
    }
    update(dt) {
      this.y += this.vy * dt;
      this.sway += dt * 3;
      this.x += Math.sin(this.sway) * 20 * dt;
      if (this.y > H + 30) this.dead = true;
    }
    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.color; ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(10,16,40,.85)'; ctx.strokeStyle = this.color; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Utils.TAU / 6 * i - Math.PI / 2, r = 12;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.color; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.label, 0, 1);
      ctx.restore();
    }
  }

  return { Player, Enemy, Pickup, fireMine, fireEnemy, updateBullets, renderBullets, myBulletPool, enBulletPool };
})();