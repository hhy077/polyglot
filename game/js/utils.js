// ===== 工具函数 + 对象池 =====
window.Utils = (function () {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const choose = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, min, max) => v < min ? min : v > max ? max : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
  const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));
  const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  // 通用对象池
  function ObjectPool(factory, reset) {
    this.factory = factory;
    this.reset = reset;
    this.pool = [];
    this.active = [];
  }
  ObjectPool.prototype.get = function () {
    let o = this.pool.pop();
    if (!o) o = this.factory();
    this.active.push(o);
    return o;
  };
  ObjectPool.prototype.release = function (o) {
    const i = this.active.indexOf(o);
    if (i >= 0) this.active.splice(i, 1);
    if (this.reset) this.reset(o);
    this.pool.push(o);
  };
  ObjectPool.prototype.update = function (dt, fn) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const o = this.active[i];
      fn(o);
      if (o.dead) this.release(o);
    }
  };

  return { TAU, rand, randInt, choose, clamp, lerp, dist, dist2, angleTo, easeOut, ObjectPool };
})();