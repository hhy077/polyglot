// ===== 粒子系统（爆炸/火花/尾焰/飘字） =====
window.GFX = (function () {
  const Utils = window.Utils;
  const particles = [];
  const texts = [];

  function makeP(x, y, vx, vy, life, size, color, gravity, shrink) {
    particles.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity: gravity || 0, shrink: shrink === undefined ? true : shrink });
  }

  function spark(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Utils.TAU;
      const sp = Utils.rand(40, 220);
      makeP(x, y, Math.cos(a) * sp, Math.sin(a) * sp, Utils.rand(0.3, 0.7), Utils.rand(2, 5), color, 60, true);
    }
  }

  function explosion(x, y, color, big) {
    const n = big ? 40 : 18;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Utils.TAU;
      const sp = Utils.rand(big ? 80 : 40, big ? 320 : 200);
      const c = ['#fff', color, color, '#ffd54a'][Math.floor(Math.random() * 4)];
      makeP(x, y, Math.cos(a) * sp, Math.sin(a) * sp, Utils.rand(0.4, big ? 1.1 : 0.7), Utils.rand(big ? 6 : 3, big ? 16 : 8), c, big ? 40 : 20, true);
    }
    // 冲击波环
    particles.push({ x, y, vx: 0, vy: 0, life: big ? 0.5 : 0.3, maxLife: big ? 0.5 : 0.3, size: big ? 60 : 30, color, gravity: 0, shrink: false, ring: true });
  }

  function trail(x, y, color) {
    particles.push({ x: x + Utils.rand(-3, 3), y: y + Utils.rand(0, 6), vx: Utils.rand(-10, 10), vy: Utils.rand(60, 120), life: 0.3, maxLife: 0.3, size: Utils.rand(3, 6), color, gravity: 0, shrink: true });
  }

  function popText(x, y, str, color, size) {
    texts.push({ x, y, str, color, size: size || 16, life: 0.9, maxLife: 0.9, vy: -50 });
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      if (p.shrink) p.size = Math.max(0.5, p.size * (1 - dt * 2));
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
  }

  function render(ctx) {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.ring) {
        ctx.strokeStyle = p.color; ctx.lineWidth = 3;
        ctx.arc(p.x, p.y, p.size, 0, Utils.TAU);
        ctx.stroke();
      } else {
        ctx.arc(p.x, p.y, p.size, 0, Utils.TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = `bold ${t.size}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color; ctx.shadowBlur = 10;
      ctx.fillText(t.str, t.x, t.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  return { makeP, spark, explosion, trail, popText, update, render };
})();