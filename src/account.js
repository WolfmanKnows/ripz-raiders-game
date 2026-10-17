/* RIPZ Raiders — local Owlie Card. SWAP is play-money. No cash, no real login. */
(function () {
  "use strict";
  var KEY = "ripz_owlie_card";
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  window.RIPZ_ACCOUNT = {
    user: read(),
    signedIn: !!read(),
    signIn: function () {
      var prev = read();
      this.user = prev || { id: "owlie-local", name: "OWLIE" };
      this.signedIn = true;
      try { localStorage.setItem(KEY, JSON.stringify(this.user)); } catch (e) {}
      this.updateUI();
      if (window.RIPZ && window.RIPZ.openCard) window.RIPZ.openCard();
      if (window.onAccountChange) window.onAccountChange(this.user);
      return Promise.resolve(this.user);
    },
    signOut: function () {
      this.user = null;
      this.signedIn = false;
      try { localStorage.removeItem(KEY); } catch (e) {}
      this.updateUI();
      if (window.onAccountChange) window.onAccountChange(null);
    },
    saveProgress: function (data) {
      if (!this.signedIn || !this.user) return Promise.resolve(false);
      try { localStorage.setItem("ripz_cloud_" + this.user.id, JSON.stringify(data)); } catch (e) {}
      return Promise.resolve(true);
    },
    loadProgress: function () {
      if (!this.signedIn || !this.user) return Promise.resolve(null);
      try {
        var s = localStorage.getItem("ripz_cloud_" + this.user.id);
        return Promise.resolve(s ? JSON.parse(s) : null);
      } catch (e) { return Promise.resolve(null); }
    },
    submitScore: function () { return Promise.resolve(!!this.signedIn); },
    updateUI: function () {
      var btn = document.getElementById("signInBtn");
      if (!btn) return;
      btn.textContent = this.signedIn ? (this.user.name || "OWLIE") + " · Card" : "Owlie Card";
    },
  };
  function arm() { window.RIPZ_ACCOUNT.updateUI(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();
})();
