/* localStorage save. Versioned. No accounts required. */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});
  var KEY = "ripz_raiders_save_v1";

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  R.packState = function () {
    var g = R.G;
    return {
      v: 1,
      name: g.name,
      swap: g.swap,
      badges: g.badges,
      party: g.party,
      box: g.box,
      bag: g.bag,
      dexS: g.dexS,
      dexC: g.dexC,
      flags: g.flags,
      cuts: g.cuts,
      map: g.map && g.map.id,
      x: g.player.x,
      y: g.player.y,
      dir: g.player.dir,
      starter: g.starter,
      charm: g.charm,
      clock: g.clock,
      mute: !!g.mute,
      lastHeal: g.lastHeal,
      uid: R.peekUid(),
    };
  };

  R.applyState = function (d) {
    var g = R.G;
    if (!d || d.v !== 1 || !d.map || !R.maps[d.map]) return false;
    g.name = d.name || "OWLIE";
    g.swap = d.swap || 0;
    g.badges = d.badges || [0, 0, 0];
    g.party = d.party || [];
    g.box = d.box || [];
    g.bag = d.bag || {};
    g.dexS = d.dexS || {};
    g.dexC = d.dexC || {};
    g.flags = d.flags || {};
    g.cuts = d.cuts || {};
    g.starter = d.starter || null;
    g.charm = d.charm || 0;
    g.clock = d.clock || 40;
    g.mute = !!d.mute;
    g.lastHeal = d.lastHeal || { map: "player_house", x: 7, y: 7 };
    if (d.uid) R.setUid(d.uid);
    g.party.concat(g.box).forEach(function (m) {
      if (!m.moves) m.moves = R.movesFor(m.sid, m.level);
      R.recompute(m);
      m.dispHp = m.hp;
    });
    R.setMap(d.map, d.x, d.y, { quiet: true });
    g.player.dir = d.dir || 0;
    return true;
  };

  R.hasSave = function () {
    var s = storage();
    if (!s) return false;
    return !!s.getItem(KEY);
  };

  R.saveGame = function () {
    var s = storage();
    if (!s || !R.G || !R.G.map) return false;
    try {
      var data = R.packState();
      s.setItem(KEY, JSON.stringify(data));
      if (window.RIPZ_ACCOUNT && window.RIPZ_ACCOUNT.signedIn) window.RIPZ_ACCOUNT.saveProgress(data);
      return true;
    } catch (e) {
      return false;
    }
  };

  R.loadGame = function () {
    var s = storage();
    if (!s) return false;
    try {
      var raw = s.getItem(KEY);
      if (!raw) return false;
      return R.applyState(JSON.parse(raw));
    } catch (e) {
      return false;
    }
  };

  R.wipeSave = function () {
    var s = storage();
    if (s) s.removeItem(KEY);
  };
})();
