/* Tiny chiptune stings. Unlocks on the first gesture. */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});
  var ctx = null;
  R.unlockAudio = function () {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
    return ctx;
  };
  function tone(freq, dur, type, gain, delay) {
    if (!ctx || (R.G && R.G.mute)) return;
    var t0 = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain || 0.04, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  R.sfx = function (name) {
    if (!ctx || (R.G && R.G.mute)) return;
    var bank = {
      tap: function () { tone(520, 0.05, "square", 0.03); },
      menu: function () { tone(340, 0.06, "square", 0.035); tone(520, 0.07, "square", 0.03, 0.05); },
      hit: function () { tone(180, 0.08, "sawtooth", 0.05); tone(90, 0.12, "square", 0.04, 0.02); },
      weak: function () { tone(240, 0.1, "triangle", 0.04); },
      super: function () { tone(520, 0.08, "square", 0.05); tone(780, 0.1, "square", 0.04, 0.06); },
      faint: function () { tone(300, 0.12, "sawtooth", 0.04); tone(140, 0.2, "triangle", 0.04, 0.08); },
      catch: function () { tone(660, 0.08, "square", 0.04); tone(880, 0.1, "square", 0.04, 0.1); tone(1180, 0.14, "triangle", 0.04, 0.2); },
      break: function () { tone(200, 0.1, "square", 0.04); },
      level: function () { tone(523, 0.08, "square", 0.04); tone(659, 0.08, "square", 0.04, 0.08); tone(784, 0.14, "square", 0.04, 0.16); },
      evo: function () { tone(400, 0.1, "sawtooth", 0.03); tone(600, 0.1, "sawtooth", 0.03, 0.12); tone(900, 0.18, "triangle", 0.04, 0.24); },
      item: function () { tone(700, 0.06, "square", 0.03); tone(980, 0.1, "square", 0.03, 0.06); },
      bump: function () { tone(90, 0.04, "square", 0.03); },
      start: function () { tone(440, 0.08, "square", 0.04); tone(554, 0.08, "square", 0.04, 0.09); tone(659, 0.16, "triangle", 0.045, 0.18); },
      rip: function () { tone(200, 0.08, "sawtooth", 0.04); tone(800, 0.12, "square", 0.04, 0.12); },
    };
    if (bank[name]) bank[name]();
  };
})();
