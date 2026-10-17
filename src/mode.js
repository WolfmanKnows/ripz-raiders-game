// RIPZ Raiders — mode detection (kiosk vs public web)
(function(){
  'use strict';
  var params = new URLSearchParams(location.search);
  var isKiosk = params.get('mode') === 'kiosk' || location.pathname.indexOf('/kiosk') >= 0;
  window.RIPZ_MODE = isKiosk ? 'kiosk' : 'web';
  document.documentElement.classList.add(window.RIPZ_MODE);

  // Kiosk: idle reset with longer timeout for better play
  if (isKiosk) {
    var idleMs = 120000; // 2 minutes
    var idleTimer = null;
    function resetIdle(){
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function(){
        if (window.resetToTitle) window.resetToTitle();
        else location.reload();
      }, idleMs);
    }
    ['touchstart','mousedown','keydown','pointerdown'].forEach(function(ev){
      document.addEventListener(ev, resetIdle, {passive:true});
    });
    resetIdle();
  }

  // Fullscreen for kiosk on first interaction
  if (isKiosk && document.documentElement.requestFullscreen) {
    var fsOnce = false;
    document.addEventListener('click', function once(){
      if (!fsOnce) {
        document.documentElement.requestFullscreen().catch(function(){});
        fsOnce = true;
      }
    }, {once:false});
  }

  // Web mode: optional welcome or other enhancements
  if (!isKiosk) {
    console.log('RIPZ Raiders web mode active');
  }
})();
