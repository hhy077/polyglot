/* ===== PolyGlot · App Bootstrap ===== */
(function () {
  function init() {
    PG_AUTH.init();
    PG_ROUTER.init();

    // voices may load asynchronously; speak() picks them up when ready
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }

    PG_ROUTER.go(location.hash.replace('#', '') || 'home');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
