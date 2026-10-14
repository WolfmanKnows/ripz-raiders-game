// RIPZ Raiders — ohhRIPZ account hooks
// Replace these stubs with real ohhRIPZ auth / save / leaderboard calls.
(function(){
  'use strict';
  window.RIPZ_ACCOUNT = {
    user: null,
    signedIn: false,

    signIn: function(){
      // TODO: real ohhRIPZ OAuth / session
      this.user = { id: 'guest-' + Date.now(), name: 'Guest' };
      this.signedIn = true;
      this.updateUI();
      if (window.onAccountChange) window.onAccountChange(this.user);
      return Promise.resolve(this.user);
    },

    signOut: function(){
      this.user = null;
      this.signedIn = false;
      this.updateUI();
      if (window.onAccountChange) window.onAccountChange(null);
    },

    saveProgress: function(data){
      if (!this.signedIn) return Promise.resolve(false);
      // TODO: POST to ohhRIPZ /api/game/save
      try { localStorage.setItem('ripz_cloud_' + this.user.id, JSON.stringify(data)); } catch(e){}
      return Promise.resolve(true);
    },

    loadProgress: function(){
      if (!this.signedIn) return Promise.resolve(null);
      // TODO: GET from ohhRIPZ /api/game/load
      try {
        var s = localStorage.getItem('ripz_cloud_' + this.user.id);
        return Promise.resolve(s ? JSON.parse(s) : null);
      } catch(e){ return Promise.resolve(null); }
    },

    submitScore: function(score, badges){
      if (!this.signedIn) return Promise.resolve(false);
      // TODO: POST to ohhRIPZ leaderboard
      return Promise.resolve(true);
    },

    updateUI: function(){
      var btn = document.getElementById('signInBtn');
      if (!btn) return;
      if (this.signedIn) {
        btn.textContent = this.user.name + ' (signed in)';
        btn.onclick = function(){ window.RIPZ_ACCOUNT.signOut(); };
      } else {
        btn.textContent = 'Sign in to ohhRIPZ';
        btn.onclick = function(){ window.RIPZ_ACCOUNT.signIn(); };
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function(){
    window.RIPZ_ACCOUNT.updateUI();
    var btn = document.getElementById('signInBtn');
    if (btn) btn.onclick = function(){ window.RIPZ_ACCOUNT.signIn(); };
  });
})();
