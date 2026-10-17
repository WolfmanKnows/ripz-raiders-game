/* Damage math, type chart helpers, AI. */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});

  function stageMul(s) {
    s = Math.max(-4, Math.min(4, s || 0));
    return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  }

  R.stageMul = stageMul;

  R.calcDamage = function (atkMon, defMon, move, stagesA, stagesD, weather) {
    var specA = R.SPECIES[atkMon.sid];
    var specD = R.SPECIES[defMon.sid];
    var sa = R.stats(atkMon);
    var sd = R.stats(defMon);
    var atk = sa.atk * stageMul(stagesA && stagesA.atk);
    var def = sd.def * stageMul(stagesD && stagesD.def);
    if (atkMon.status === "BURN") atk *= 0.75;
    var power = move.power;
    if (weather === "rain") {
      if (move.type === "TIDE") power *= 1.25;
      if (move.type === "EMBER") power *= 0.75;
    } else if (weather === "wind") {
      if (move.type === "GALE") power *= 1.25;
    }
    var stab = specA.types.indexOf(move.type) >= 0 ? 1.5 : 1;
    var mult = R.typeMult(move.type, specD.types);
    var base = Math.floor(((2 * atkMon.level / 5 + 2) * power * atk / Math.max(1, def)) / 50) + 2;
    var rand = 0.86 + Math.random() * 0.14;
    var crit = Math.random() < 0.0625;
    var dmg = Math.max(1, Math.floor(base * stab * mult * rand * (crit ? 1.5 : 1)));
    return { dmg: dmg, mult: mult, crit: crit, stab: stab > 1 };
  };

  R.aiChoose = function (mon, foe) {
    var specF = R.SPECIES[foe.sid];
    var usable = mon.moves.filter(function (m) { return m.pp > 0; });
    if (!usable.length) return null;
    var best = usable[0];
    var bestScore = -999;
    for (var i = 0; i < usable.length; i++) {
      var slot = usable[i];
      var mv = R.MOVES[slot.id];
      var score = 0;
      if (mv.power > 0) {
        var stab = R.SPECIES[mon.sid].types.indexOf(mv.type) >= 0 ? 1.5 : 1;
        score = mv.power * R.typeMult(mv.type, specF.types) * stab * (0.85 + Math.random() * 0.3);
      } else if (mv.effect === "heal") {
        score = mon.hp / mon.maxhp < 0.55 ? 90 : 4;
      } else if (mv.effect === "burn" || mv.effect === "daze" || mv.effect === "hex" || mv.effect === "soak") {
        score = foe.status ? 2 : 58;
      } else score = 28 + Math.random() * 8;
      if (score > bestScore) { bestScore = score; best = slot; }
    }
    return best;
  };

  R.catchChance = function (mon, ball) {
    var sp = R.SPECIES[mon.sid];
    var hp = Math.max(1, mon.hp);
    var a = ((3 * mon.maxhp - 2 * hp) * sp.catchRate * ball) / (3 * mon.maxhp);
    if (mon.status) a *= 1.45;
    var p = a / 210;
    return Math.max(0.05, Math.min(0.93, p));
  };
})();
