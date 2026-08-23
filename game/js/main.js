// ===== 入口：界面切换 / 按钮绑定 / 启动 =====
window.UI = (function () {
  const $ = id => document.getElementById(id);
  const screens = { menu: $('menu'), rank: $('rank'), help: $('help'), upgrade: $('upgrade'), pause: $('pause'), settle: $('settle') };
  let rankMode = 'campaign';

  // 升级项定义（顺序即展示顺序）
  const UPGRADES = [
    { key: 'attack',  icon: '⚔️', name: '攻击力', desc: '每级 +10% 伤害' },
    { key: 'hp',      icon: '❤️', name: '生命',   desc: '每级 +1 命' },
    { key: 'defense', icon: '🛡️', name: '防御',   desc: '每级 +1 护盾' },
    { key: 'speed',   icon: '🚀', name: '速度',   desc: '每级 +4% 移速' }
  ];

  function renderUpgrade() {
    const Up = Game.Upgrade, g = CFG.upgrade;
    $('upg-coins').textContent = Up.coins.toLocaleString();
    const box = $('upg-list');
    box.innerHTML = '';
    UPGRADES.forEach(u => {
      const lv = Up.level(u.key), cap = g.cap;
      const cost = Up.cost(u.key);
      const maxed = lv >= cap;
      const afford = !maxed && Up.coins >= cost;
      const item = document.createElement('div');
      item.className = 'upg-item';
      item.innerHTML = `
        <div class="upg-icon">${u.icon}</div>
        <div class="upg-info">
          <div class="upg-name">${u.name} <span style="color:#8AA0C0;font-size:12px">Lv.${lv}/${cap}</span></div>
          <div class="upg-desc">${u.desc}</div>
          <div class="upg-bar"><i style="width:${(lv / cap * 100).toFixed(0)}%"></i></div>
        </div>
        <button class="upg-btn ${maxed ? 'max' : afford ? '' : 'soon'}" data-key="${u.key}">
          ${maxed ? 'MAX' : '💰 ' + cost.toLocaleString()}
        </button>`;
      box.appendChild(item);
    });
    // 绑定升级点击
    box.querySelectorAll('.upg-btn').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.key;
        if (Game.Upgrade.canUpgrade(k)) { Game.Upgrade.buy(k); SFX.play('power'); renderUpgrade(); }
      });
    });
  }

  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }
  function showOverlay(showIt) { $('overlay').style.display = showIt ? 'flex' : 'none'; }
  function hideOverlay() { showOverlay(false); }

  function showPause() { showOverlay(true); show('pause'); }
  function showSettle(sc, rk, cmb, kills, time, isNew, modeName, won) {
    $('s-score').textContent = sc.toLocaleString();
    $('s-rank').textContent = rk;
    $('s-combo').textContent = cmb;
    $('s-kills').textContent = kills;
    $('s-time').textContent = time + 's';
    $('new-record').classList.toggle('hidden', !isNew);
    // 通关 / 模式差异化标题
    $('settle-title').textContent = won
      ? '🏆 通关！星际防线告捷！（本局金币 +' + Game.coinsGained + '💰）'
      : (modeName === 'endless' ? '🏁 无尽结算（本局金币 +' + Game.coinsGained + '💰）' : '🏁 关卡结算（本局金币 +' + Game.coinsGained + '💰）');
    showOverlay(true); show('settle');
  }

  function renderRank(modeName) {
    rankMode = modeName;
    const list = Game.getRanks(modeName);
    const ol = $('rank-list');
    ol.innerHTML = '';
    if (list.length === 0) { ol.innerHTML = '<li style="justify-content:center;color:#8AA0C0">暂无记录，快去挑战吧！</li>'; }
    list.forEach((r, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${i + 1}. ${r.score.toLocaleString()} 分</span><span style="color:#8AA0C0">连击×${r.combo} · ${r.time}s</span>`;
      ol.appendChild(li);
    });
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.mode === modeName));
  }

  function bind() {
    // 菜单按钮
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'campaign') { showOverlay(false); $('hud').classList.remove('hidden'); Game.newGame('campaign'); }
        else if (a === 'endless') { showOverlay(false); $('hud').classList.remove('hidden'); Game.newGame('endless'); }
        else if (a === 'rank') { renderRank('campaign'); show('rank'); }
        else if (a === 'upgrade') { renderUpgrade(); show('upgrade'); }
        else if (a === 'help') { show('help'); }
        else if (a === 'toMenu') { show('menu'); }
        else if (a === 'resume') { Game.togglePause(); }
        else if (a === 'restart') { Game.restart(); }
        else if (a === 'next') { Game.restart(); }
      });
    });
    // 排行榜 tab
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => renderRank(t.dataset.mode)));
    // 静音
    $('mute-btn').addEventListener('click', () => { Game.toggleMute(); });
    // 暂停
    document.addEventListener('keydown', e => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); Game.togglePause(); }
    });
    // 虚拟键
    $('btn-skill').addEventListener('pointerdown', () => Input.setVirtual('skill'));
    $('btn-bomb').addEventListener('pointerdown', () => Input.setVirtual('bomb'));
    // 操作模式切换（移动端）
    const mt = $('mode-toggle');
    function syncModeBtn() { mt.textContent = Input.getMode() === 'stick' ? '🕹' : '👆'; }
    mt.addEventListener('click', () => {
      Input.setMode(Input.getMode() === 'stick' ? 'drag' : 'stick');
      syncModeBtn();
      SFX.play('pickup');
    });
    syncModeBtn();
  }

  function init() {
    bind();
    show('menu');
    showOverlay(true);
  }

  return { init, show, showOverlay, hideOverlay, showPause, showSettle, renderRank };
})();

// 启动
window.addEventListener('DOMContentLoaded', () => {
  UI.init();
  Game.init(document.getElementById('game'));
  // 首次用户手势解锁音频
  document.addEventListener('pointerdown', () => SFX.init(), { once: true });
  document.addEventListener('keydown', () => SFX.init(), { once: true });
});