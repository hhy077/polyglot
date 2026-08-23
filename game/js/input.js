// ===== 输入抽象：键盘 / 鼠标 / 触屏（拖拽跟随 / 虚拟摇杆） =====
window.Input = (function () {
  const CFG = window.CFG;
  const keys = {};
  // 键盘轴向
  let kbX = 0, kbY = 0;
  // 指针（拖拽跟随）
  let pointerActive = false, pointerX = CFG.canvas.w / 2, pointerY = CFG.canvas.h / 2;
  let isTouch = false;
  // 摇杆
  let stick = { active: false, oid: null, ox: 0, oy: 0, dx: 0, dy: 0, baseX: 0, baseY: 0 };
  // 临时动作
  let skillPressed = false, bombPressed = false;

  // 操作模式：drag（跟随）| stick（摇杆）
  function getMode() {
    try { let m = localStorage.getItem('starDef_ctrl') || (isTouch ? 'drag' : 'drag'); return m; } catch (e) { return 'drag'; }
  }
  function setMode(m) { try { localStorage.setItem('starDef_ctrl', m); } catch (e) {} }

  function kbMove() {
    let mx = 0, my = 0;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) my -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) my += 1;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) mx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) mx += 1;
    const len = Math.hypot(mx, my);
    if (len > 0) { mx /= len; my /= len; }
    return [mx, my];
  }

  window.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    keys[e.key] = true;
    if (e.key === 'z' || e.key === 'Z') skillPressed = true;
    if (e.key === 'x' || e.key === 'X') bombPressed = true;
    if (e.key === 'm' || e.key === 'M') { if (Game && Game.toggleMute) Game.toggleMute(); }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // 坐标换算：屏幕 → 画布逻辑坐标
  function toCanvas(clientX, clientY) {
    const rect = document.getElementById('game').getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (CFG.canvas.w / rect.width),
      y: (clientY - rect.top) * (CFG.canvas.h / rect.height)
    };
  }

  function startStick(id, x, y) {
    stick.active = true; stick.oid = id;
    stick.ox = x; stick.oy = y; stick.dx = 0; stick.dy = 0;
    stick.baseX = x; stick.baseY = y;
    const js = document.getElementById('joystick');
    js.style.display = 'block';
    js.style.left = x + 'px'; js.style.top = y + 'px';
  }
  function moveStick(id, x, y) {
    if (!stick.active || id !== stick.oid) return;
    const dx = x - stick.ox, dy = y - stick.oy;
    const maxR = 120 / CFG.canvas.w * 480; // 摇杆半径（画布逻辑单位）
    const len = Math.hypot(dx, dy);
    const cl = Math.min(len, maxR);
    const ang = Math.atan2(dy, dx);
    stick.dx = Math.cos(ang) * cl / maxR;
    stick.dy = Math.sin(ang) * cl / maxR;
    const knob = document.getElementById('js-knob');
    knob.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
  }
  function endStick(id) {
    if (id !== stick.oid) return;
    stick.active = false; stick.dx = 0; stick.dy = 0; stick.oid = null;
    document.getElementById('joystick').style.display = 'none';
  }

  document.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return; // 不拦截按钮
    isTouch = e.pointerType === 'touch';
    const { x, y } = toCanvas(e.clientX, e.clientY);
    if (getMode() === 'stick' && e.pointerType === 'touch' && x < CFG.canvas.w * 0.5) {
      startStick(e.pointerId, x, y);
    } else {
      pointerActive = true; pointerX = x; pointerY = y;
    }
  });
  document.addEventListener('pointermove', e => {
    const { x, y } = toCanvas(e.clientX, e.clientY);
    if (stick.active && e.pointerId === stick.oid) moveStick(e.pointerId, x, y);
    else if (e.pointerType === 'touch') { pointerX = x; pointerY = y; }
    else if (e.buttons) { pointerActive = true; pointerX = x; pointerY = y; }
  });
  document.addEventListener('pointerup', e => {
    if (stick.active) endStick(e.pointerId);
    else if (e.pointerType === 'touch') pointerActive = false;
  });
  document.addEventListener('pointercancel', e => { if (stick.active) endStick(e.pointerId); else pointerActive = false; });

  function update(dt) {
    const [mx, my] = kbMove();
    kbX = mx; kbY = my;
    skillPressed = skillPressed; bombPressed = bombPressed;
  }

  function setVirtual(action) {
    if (action === 'skill') skillPressed = true;
    if (action === 'bomb') bombPressed = true;
  }
  function reset() { for (const k in keys) delete keys[k]; pointerActive = false; stick.active = false; }

  function consumeSkill() { const v = skillPressed; skillPressed = false; return v; }
  function consumeBomb() { const v = bombPressed; bombPressed = false; return v; }

  return {
    update, setVirtual, reset, getMode, setMode, consumeSkill, consumeBomb,
    get kbX() { return kbX; }, get kbY() { return kbY; },
    get stickDX() { return stick.dx; }, get stickDY() { return stick.dy; }, get stickActive() { return stick.active; },
    get pointerActive() { return pointerActive; }, get pointerX() { return pointerX; }, get pointerY() { return pointerY; },
    get isTouch() { return isTouch; }
  };
})();