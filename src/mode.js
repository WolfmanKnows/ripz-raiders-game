/* RIPZ Raiders — kiosk vs public web */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var path = location.pathname || "";
  var isKiosk = params.get("mode") === "kiosk" || path.indexOf("/kiosk") >= 0;
  window.RIPZ_MODE = isKiosk ? "kiosk" : "web";
  document.documentElement.classList.add(window.RIPZ_MODE);

  if (isKiosk) {
    var idleMs = 120000;
    var idleTimer = null;
    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (window.resetToTitle) window.resetToTitle();
        else location.reload();
      }, idleMs);
    }
    ["touchstart", "mousedown", "keydown", "pointerdown"].forEach(function (ev) {
      document.addEventListener(ev, resetIdle, { passive: true });
    });
    resetIdle();
    if (document.documentElement.requestFullscreen) {
      document.addEventListener("pointerdown", function once() {
        document.documentElement.requestFullscreen().catch(function () {});
      }, { once: true });
    }
  }

  window.resetToTitle = window.resetToTitle || function () {
    if (window.RIPZ && window.RIPZ.toTitle) window.RIPZ.toTitle();
    else location.reload();
  };
})();
