/* RIPZ Raiders species, moves, items, type chart. Original raiders — not Pokémon. */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});

  R.T = {
    GRASS: 0, TALL: 1, PATH: 2, TREE: 3, WATER: 4, WALL: 5, ROOF: 6, DOOR: 7,
    FLOOR: 8, COUNTER: 9, RUG: 10, FLOWER: 11, SAND: 12, BRIDGE: 13, BRAMBLE: 14,
    ROCK: 15, FENCE: 16, PC: 17, BED: 18, BOOK: 19, MACHINE: 20, WINDOW: 21,
    MAT: 22, LAMP: 23, FOIL: 24, SIGN: 25,
  };
  var WALK = [0, 1, 2, 7, 8, 10, 11, 12, 13, 22, 23, 24];
  R.WALK = {};
  WALK.forEach(function (n) { R.WALK[n] = 1; });

  R.TYPE_COLOR = {
    EMBER: "#e25822", TIDE: "#3d8bfd", GALE: "#79c7d4", STONE: "#b09a78",
    SPARK: "#f0c419", SHADE: "#8a6cff", BLOOM: "#3eae5a", METAL: "#c5ced6",
    MYTH: "#e8c547", BASIC: "#d9d0bc",
  };

  var CHART = {
    EMBER: { GALE: 2, METAL: 2, TIDE: 0.5, STONE: 0.5, BLOOM: 0.5 },
    TIDE: { EMBER: 2, STONE: 2, BLOOM: 0.5, SPARK: 0.5 },
    GALE: { BLOOM: 2, EMBER: 0.5, SPARK: 0.5, STONE: 0.5 },
    STONE: { EMBER: 2, SPARK: 2, GALE: 2, TIDE: 0.5, METAL: 0.5, BLOOM: 0.5 },
    SPARK: { TIDE: 2, GALE: 2, METAL: 2, STONE: 0.5 },
    SHADE: { MYTH: 2, SHADE: 0.5 },
    BLOOM: { EMBER: 2, TIDE: 2, STONE: 2, GALE: 0.5 },
    METAL: { STONE: 2, MYTH: 2, EMBER: 0.5, SPARK: 0.5 },
    MYTH: { SHADE: 2, METAL: 0.5, MYTH: 0.5 },
    BASIC: {},
  };

  R.typeMult = function (atk, defs) {
    var m = 1;
    for (var i = 0; i < defs.length; i++) {
      var row = CHART[atk] || {};
      var v = row[defs[i]];
      if (v) m *= v;
    }
    return m;
  };

  function mv(name, type, power, acc, pp, effect) {
    return { name: name, type: type, power: power, acc: acc, pp: pp, effect: effect || (power ? "dmg" : "dmg") };
  }
  R.MOVES = {
    peck: mv("Peck", "BASIC", 35, 100, 35),
    tackle: mv("Tackle", "BASIC", 40, 100, 35),
    gust: mv("Gust", "GALE", 40, 100, 30),
    aircut: mv("Air Cut", "GALE", 75, 95, 15),
    ember: mv("Ember Flick", "EMBER", 40, 100, 25),
    flamepeck: mv("Flame Peck", "EMBER", 70, 95, 15),
    blazeout: mv("Blaze Out", "EMBER", 110, 85, 5),
    splash: mv("Tide Slap", "TIDE", 40, 100, 30),
    brinebeam: mv("Brine Beam", "TIDE", 75, 100, 15),
    tidecrash: mv("Tide Crash", "TIDE", 110, 80, 5),
    spark: mv("Spark", "SPARK", 40, 100, 30),
    voltclap: mv("Volt Clap", "SPARK", 80, 100, 10),
    hex: mv("Foil Hex", "SHADE", 65, 100, 20),
    nightbind: mv("Night Bind", "SHADE", 0, 90, 15, "hex"),
    leafcut: mv("Leaf Cut", "BLOOM", 45, 100, 25),
    thorn: mv("Thorn Volley", "BLOOM", 75, 95, 15),
    petalmend: mv("Petal Mend", "BLOOM", 0, 100, 10, "heal"),
    rockthrow: mv("Rock Throw", "STONE", 50, 90, 20),
    boulder: mv("Boulder", "STONE", 90, 85, 10),
    clang: mv("Clang", "METAL", 55, 95, 20),
    foilslam: mv("Foil Slam", "METAL", 90, 90, 10),
    gleam: mv("Gleam", "MYTH", 70, 100, 15),
    mythray: mv("Myth Ray", "MYTH", 110, 85, 5),
    dazedust: mv("Daze Dust", "BASIC", 0, 85, 15, "daze"),
    soak: mv("Soak", "TIDE", 0, 90, 15, "soak"),
    growl: mv("Growl", "BASIC", 0, 100, 20, "atk-"),
    focus: mv("Focus", "BASIC", 0, 100, 15, "atk+"),
    burnspark: mv("Burn Spark", "EMBER", 0, 85, 15, "burn"),
  };

  function sp(id, name, types, base, catchRate, exp, evo, learn, blurb) {
    return {
      id: id, name: name, types: types,
      base: { hp: base[0], atk: base[1], def: base[2], spd: base[3] },
      catchRate: catchRate, exp: exp, evo: evo, learn: learn, blurb: blurb,
    };
  }
  var L = function (rows) { return rows; };

  R.SPECIES = {
    hootling: sp("hootling", "Hootling", ["GALE"], [48, 52, 44, 58], 45, 48, [16, "chromehoot"], L([[1, "peck"], [1, "growl"], [5, "gust"], [8, "dazedust"], [12, "focus"], [18, "aircut"]]), "A plaza owlet. Gusts smell like fresh packs."),
    chromehoot: sp("chromehoot", "Chrome Hoot", ["GALE", "METAL"], [68, 78, 70, 84], 45, 72, [32, "aureowl"], L([[1, "gust"], [1, "clang"], [16, "clang"], [20, "foilslam"], [24, "aircut"], [28, "gleam"]]), "Foil feathers. Collectors stare."),
    aureowl: sp("aureowl", "Aureowl", ["GALE", "MYTH"], [92, 104, 86, 112], 30, 110, null, L([[1, "aircut"], [1, "gleam"], [32, "mythray"], [36, "foilslam"]]), "Vault-crown wind. The shot everyone chases."),
    nestling: sp("nestling", "Nestling", ["BLOOM"], [52, 46, 52, 42], 45, 48, [16, "packbloom"], L([[1, "tackle"], [1, "growl"], [4, "leafcut"], [8, "petalmend"], [13, "soak"], [18, "thorn"]]), "A seedling raider that hoards petals, not chase cards."),
    packbloom: sp("packbloom", "Packbloom", ["BLOOM"], [74, 72, 78, 58], 45, 72, [32, "canopyrex"], L([[1, "leafcut"], [1, "petalmend"], [16, "thorn"], [22, "focus"], [28, "boulder"]]), "Blooms in the shape of a sealed pack."),
    canopyrex: sp("canopyrex", "Canopy Rex", ["BLOOM", "STONE"], [100, 94, 114, 62], 30, 110, null, L([[1, "thorn"], [1, "boulder"], [32, "foilslam"], [36, "petalmend"]]), "Old growth with a collector's patience."),
    ripkit: sp("ripkit", "Ripkit", ["EMBER"], [44, 58, 40, 62], 45, 48, [16, "ripper"], L([[1, "peck"], [1, "growl"], [4, "ember"], [8, "burnspark"], [12, "flamepeck"], [18, "blazeout"]]), "Sparks when a pack is about to rip."),
    ripper: sp("ripper", "Ripper", ["EMBER"], [66, 88, 58, 86], 45, 74, [32, "infernowl"], L([[1, "ember"], [1, "flamepeck"], [16, "flamepeck"], [22, "blazeout"], [28, "focus"]]), "Tears foil with a grin. Never your wallet."),
    infernowl: sp("infernowl", "Infernowl", ["EMBER", "MYTH"], [88, 118, 72, 104], 30, 112, null, L([[1, "flamepeck"], [1, "gleam"], [32, "mythray"], [36, "blazeout"]]), "A bonfire with wings and a gold beak."),
    foilghost: sp("foilghost", "Foilghost", ["SHADE"], [42, 58, 36, 74], 160, 46, [22, "spectowl"], L([[1, "hex"], [1, "growl"], [6, "nightbind"], [11, "dazedust"], [16, "gleam"]]), "A glare on a sleeve. Blink and the pull is gone."),
    spectowl: sp("spectowl", "Spectowl", ["SHADE"], [72, 98, 62, 98], 70, 78, null, L([[1, "hex"], [1, "nightbind"], [22, "mythray"], [28, "foilslam"]]), "Haunts night routes and bad eBay photos."),
    packrat: sp("packrat", "Packrat", ["METAL"], [50, 52, 64, 42], 180, 44, [24, "hoardbeast"], L([[1, "tackle"], [1, "growl"], [5, "clang"], [10, "foilslam"], [16, "focus"]]), "Cheeks full of commons. Dreams of chases."),
    hoardbeast: sp("hoardbeast", "Hoardbeast", ["METAL", "STONE"], [90, 94, 108, 48], 60, 86, null, L([[1, "clang"], [1, "boulder"], [24, "foilslam"], [30, "focus"]]), "A living storage unit with opinions."),
    tideling: sp("tideling", "Tideling", ["TIDE"], [46, 50, 50, 52], 170, 44, [18, "brineback"], L([[1, "splash"], [1, "growl"], [5, "soak"], [10, "brinebeam"], [16, "tidecrash"]]), "Dock puddle with ambition."),
    brineback: sp("brineback", "Brineback", ["TIDE"], [84, 88, 82, 68], 70, 80, null, L([[1, "brinebeam"], [1, "soak"], [18, "tidecrash"], [26, "boulder"]]), "Harbor muscle. Smells like salt and sleeves."),
    sparkmite: sp("sparkmite", "Sparkmite", ["SPARK"], [40, 58, 36, 70], 170, 44, [20, "voltowl"], L([[1, "spark"], [1, "growl"], [6, "dazedust"], [11, "voltclap"], [18, "focus"]]), "Static in a penny sleeve."),
    voltowl: sp("voltowl", "Voltowl", ["SPARK"], [70, 94, 58, 108], 70, 82, null, L([[1, "spark"], [1, "voltclap"], [20, "dazedust"], [26, "gleam"]]), "Lights the night market when it claps."),
    shelflick: sp("shelflick", "Shelflick", ["STONE"], [58, 62, 74, 28], 160, 46, [22, "shelfbreaker"], L([[1, "rockthrow"], [1, "growl"], [7, "focus"], [12, "boulder"], [18, "clang"]]), "Lives under retail shelves. Eats dust and hope."),
    shelfbreaker: sp("shelfbreaker", "Shelfbreaker", ["STONE"], [94, 98, 124, 38], 60, 86, null, L([[1, "boulder"], [1, "clang"], [22, "foilslam"], [30, "focus"]]), "When the case glass gives up."),
    clearout: sp("clearout", "Clearout", ["GALE"], [50, 64, 44, 80], 150, 50, null, L([[1, "gust"], [1, "peck"], [8, "aircut"], [14, "dazedust"]]), "Blows through a booth at closing time."),
    bulkbuyer: sp("bulkbuyer", "Bulkbuyer", ["MYTH"], [104, 84, 92, 52], 28, 100, null, L([[1, "gleam"], [1, "foilslam"], [12, "mythray"], [22, "boulder"]]), "Rare. Pays in presence, never in cash."),
    resale: sp("resale", "Resale", ["METAL"], [64, 84, 72, 74], 90, 64, null, L([[1, "clang"], [1, "tackle"], [8, "foilslam"], [14, "gleam"]]), "Vex's favorite. Shiny, impatient, loud."),
    scalplet: sp("scalplet", "Scalplet", ["SHADE", "METAL"], [54, 72, 50, 66], 90, 58, null, L([[1, "hex"], [1, "clang"], [6, "nightbind"], [12, "foilslam"]]), "A small scalper-spirit. It only eats if someone pays market."),
  };
  R.DEX_ORDER = Object.keys(R.SPECIES);

  R.ITEMS = {
    ripball: { name: "Rip Ball", price: 20, catch: 1, desc: "Standard foil ball. SWAP only." },
    chromeball: { name: "Chrome Ball", price: 60, catch: 1.6, desc: "Cleaner catch. Still not cash." },
    vaultball: { name: "Vault Ball", price: 180, catch: 2.55, desc: "Vault-grade. The honest shot." },
    berry: { name: "Hoot Berry", price: 15, heal: 30, desc: "Restores 30 HP." },
    goldberry: { name: "Gold Berry", price: 48, heal: 100, desc: "Restores 100 HP." },
    serum: { name: "Foil Serum", price: 32, cure: 1, desc: "Clears burn, daze, hex, soak." },
    charm: { name: "Quiet Charm", price: 80, charm: 80, desc: "Calms tall grass for 80 steps." },
    pack: { name: "Rip Pack", price: 50, pack: "standard", desc: "Three shots. Monsters, not money." },
    chromepack: { name: "Chrome Pack", price: 120, pack: "chrome", desc: "Hotter pool. Still SWAP." },
  };

  R.SHOPS = {
    mart: ["ripball", "chromeball", "berry", "goldberry", "serum", "charm", "pack"],
    bar: ["pack", "chromepack", "ripball", "chromeball", "berry"],
    late: ["vaultball", "chromepack", "goldberry", "serum", "chromeball", "pack"],
  };

  R.expFor = function (level) {
    if (level <= 1) return 0;
    return Math.floor(Math.pow(level, 3) * 0.65);
  };
  R.statHP = function (base, level) {
    return Math.floor(((base + 40) * level) / 42) + level + 14;
  };
  R.statOther = function (base, level) {
    return Math.floor(((base + 18) * level) / 48) + 6;
  };
  R.stats = function (mon) {
    var b = R.SPECIES[mon.sid].base;
    return {
      hp: mon.maxhp,
      atk: R.statOther(b.atk, mon.level),
      def: R.statOther(b.def, mon.level),
      spd: R.statOther(b.spd, mon.level),
    };
  };

  var uid = 1;
  R.peekUid = function () { return uid; };
  R.setUid = function (n) { uid = n; };

  R.movesFor = function (sid, level) {
    var learned = R.SPECIES[sid].learn.filter(function (row) { return row[0] <= level; }).map(function (row) { return row[1]; });
    var last = learned.slice(-4);
    if (!last.length) last = ["tackle"];
    return last.map(function (id) {
      return { id: id, pp: R.MOVES[id].pp, max: R.MOVES[id].pp };
    });
  };

  R.recompute = function (mon) {
    var b = R.SPECIES[mon.sid].base;
    var hp = R.statHP(b.hp, mon.level);
    var diff = hp - (mon.maxhp || hp);
    mon.maxhp = hp;
    if (mon.hp == null) mon.hp = hp;
    else mon.hp = Math.max(0, Math.min(hp, mon.hp + Math.max(0, diff)));
  };

  R.createMon = function (sid, level, opts) {
    opts = opts || {};
    var spc = R.SPECIES[sid];
    if (!spc) throw new Error("Unknown raider " + sid);
    var mon = {
      uid: uid++,
      sid: sid,
      name: spc.name,
      level: level,
      exp: R.expFor(level),
      status: null,
      shiny: opts.shiny != null ? opts.shiny : Math.random() < 0.02,
      moves: R.movesFor(sid, level),
    };
    R.recompute(mon);
    mon.hp = mon.maxhp;
    return mon;
  };

  R.lineKey = function (sid) {
    if (sid === "hootling" || sid === "chromehoot" || sid === "aureowl") return "gale";
    if (sid === "nestling" || sid === "packbloom" || sid === "canopyrex") return "bloom";
    if (sid === "ripkit" || sid === "ripper" || sid === "infernowl") return "ember";
    return "ember";
  };
  R.counterStarter = function (sid) {
    var k = R.lineKey(sid || "hootling");
    if (k === "gale") return "ripkit";
    if (k === "bloom") return "hootling";
    return "nestling";
  };
  R.lineStage = function (sid, stage) {
    var lines = {
      gale: ["hootling", "chromehoot", "aureowl"],
      bloom: ["nestling", "packbloom", "canopyrex"],
      ember: ["ripkit", "ripper", "infernowl"],
    };
    var k = R.lineKey(sid || "hootling");
    if (!lines[k]) k = "ember";
    return lines[k][stage];
  };

  R.effText = function (mult) {
    if (mult >= 3.5) return "A vault-shattering hit!";
    if (mult >= 1.5) return "It lands clean. Super effective.";
    if (mult <= 0.6) return "Not very effective.";
    return "";
  };

  R.QUESTS = function (g) {
    var caught = 0;
    if (g.dexC) caught = Object.keys(g.dexC).length;
    return [
      { id: "starter", name: "Partner up", done: !!g.flags.got_starter, text: "See Prof. Marlowe" },
      { id: "lab", name: "First shot", done: !!g.flags.rival_lab, text: "Beat Vex in the lab" },
      { id: "g1", name: "Ember Crest", done: !!g.flags.badge1, text: "Beat Scorch in Shelfburg" },
      { id: "rip", name: "Take your shot", done: !!g.flags.did_rip, text: "Rip a pack at the Pack Bar" },
      { id: "g2", name: "Brine Seal", done: !!g.flags.badge2, text: "Beat Brine at Foil Harbor" },
      { id: "rv", name: "Stop Vex", done: !!g.flags.rival_vault, text: "Battle Vex at Vault Spire" },
      { id: "ch", name: "Vault Crown", done: !!g.flags.champ, text: "Beat Champion Aurelia" },
      { id: "dex", name: "Field notes", done: caught >= 8, text: "Catch 8 kinds of raiders" },
    ];
  };

  R.BADGE_NAMES = ["EMBER CREST", "BRINE SEAL", "VAULT CROWN"];

  R.validateData = function () {
    var errs = [];
    Object.keys(R.SPECIES).forEach(function (id) {
      var s = R.SPECIES[id];
      if (s.evo && !R.SPECIES[s.evo[1]]) errs.push("evo " + id);
      s.learn.forEach(function (row) {
        if (!R.MOVES[row[1]]) errs.push("move " + id + " " + row[1]);
      });
    });
    return errs;
  };
})();
