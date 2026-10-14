// RIPZ Raiders — mode detection (kiosk vs public web)
(function(){
  'use strict';
  var params = new URLSearchParams(location.search);
  var isKiosk = params.get('mode') === 'kiosk' || location.pathname.indexOf('/kiosk') >= 0;
  window.RIPZ_MODE = isKiosk ? 'kiosk' : 'web';
  document.documentElement.classList.add(window.RIPZ_MODE);

  // Kiosk: idle reset
  if (isKiosk) {
    var idleMs = 90000;
    var idleTimer = null;
    function resetIdle(){
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function(){
        if (window.resetToTitle) window.resetToTitle();
        else location.reload();
      }, idleMs);
    }
    ['touchstart','mousedown','keydown'].forEach(function(ev){
      document.addEventListener(ev, resetIdle, {passive:true});
    });
    resetIdle();
  }

  // Fullscreen hint for kiosk
  if (isKiosk && document.documentElement.requestFullscreen) {
    document.addEventListener('click', function once(){
      document.documentElement.requestFullscreen().catch(function(){});
      document.removeEventListener('click', once);
    }, {once:true});
  }
})();
