/* ===== PolyGlot · Router (hash-based SPA) ===== */
window.PG_ROUTER = (function () {
  const routes = {
    home: () => { PG_HOME.render(); PG_HOME.bind(); },
    courses: () => PG_COURSES.render(),
    learning: () => PG_LEARNING.render(),
    progress: () => PG_PROGRESS.render(),
    path: () => PG_PATH.render(),
    community: () => PG_COMMUNITY.render()
  };

  let current = 'home';

  function setActive(name) {
    document.querySelectorAll('.navlinks a').forEach(a => {
      a.classList.toggle('active', a.dataset.route === name);
    });
  }

  function go(name) {
    if (!routes[name]) name = 'home';
    current = name;
    setActive(name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { routes[name](); } catch (e) { console.error(e); PG_UTILS.toast('页面加载出错', 'err'); }
  }

  function fromHash() {
    const h = (location.hash || '').replace('#', '');
    return routes[h] ? h : 'home';
  }

  function init() {
    // delegated so dynamically-rendered [data-route] elements also navigate
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-route]');
      if (!el) return;
      const r = el.dataset.route;
      if (!routes[r]) return;
      if (location.hash === '#' + r) go(r);      // same route: just re-render
      else location.hash = r;                      // hashchange will call go()
    });
    window.addEventListener('hashchange', () => go(fromHash()));
  }

  return { init, go, get current() { return current; } };
})();
