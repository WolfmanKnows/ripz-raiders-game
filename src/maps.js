/* RIPZ region: Hoot Plaza, routes, Shelfburg, Foil Harbor, Vault Spire. */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});
  var T = R.T;

  function M(id, name, w, h, fill, extra) {
    var tiles = [];
    for (var y = 0; y < h; y++) {
      tiles[y] = [];
      for (var x = 0; x < w; x++) tiles[y][x] = fill;
    }
    var m = {
      id: id, name: name, w: w, h: h, tiles: tiles,
      warps: [], npcs: [], signs: [], items: [], scripts: [],
      outdoor: true, indoor: false, enc: [],
    };
    if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; });
    m.set = function (x, y, t) {
      if (x >= 0 && y >= 0 && x < w && y < h) tiles[y][x] = t;
      return m;
    };
    m.rect = function (x, y, rw, rh, t) {
      for (var j = 0; j < rh; j++) for (var i = 0; i < rw; i++) m.set(x + i, y + j, t);
      return m;
    };
    m.border = function (t) {
      m.rect(0, 0, w, 1, t);
      m.rect(0, h - 1, w, 1, t);
      m.rect(0, 0, 1, h, t);
      m.rect(w - 1, 0, 1, h, t);
      return m;
    };
    m.house = function (x, y, rw, rh, dx) {
      m.rect(x, y, rw, 1, T.ROOF);
      m.rect(x, y + 1, rw, rh - 1, T.WALL);
      for (var i = 1; i < rw - 1; i += 2) {
        if (x + i !== dx) m.set(x + i, y + 2, T.WINDOW);
      }
      m.set(dx, y + rh - 1, T.DOOR);
      return m;
    };
    return m;
  }

  function room(id, name, w, h) {
    var m = M(id, name, w, h, T.FLOOR, { indoor: true, outdoor: false });
    m.rect(0, 0, w, 1, T.WALL);
    m.rect(0, h - 1, w, 1, T.WALL);
    m.rect(0, 0, 1, h, T.WALL);
    m.rect(w - 1, 0, 1, h, T.WALL);
    return m;
  }

  var maps = {};

  /* ---------- Hoot Plaza ---------- */
  var plaza = M("plaza", "Hoot Plaza", 40, 34, T.GRASS);
  plaza.border(T.TREE);
  plaza.rect(17, 1, 6, 32, T.PATH);
  plaza.rect(2, 12, 36, 3, T.PATH);
  plaza.house(3, 2, 10, 6, 7);
  plaza.house(26, 2, 10, 6, 30);
  plaza.house(3, 18, 10, 6, 7);
  plaza.house(15, 18, 9, 6, 19);
  plaza.house(26, 18, 10, 6, 30);
  plaza.house(26, 26, 10, 6, 30);
  for (var i = 0; i < 6; i++) plaza.set(17 + (i % 4), 0, T.PATH);
  plaza.rect(17, 0, 6, 1, T.PATH);
  plaza.set(8, 16, T.FLOWER);
  plaza.set(12, 16, T.FLOWER);
  plaza.set(24, 16, T.LAMP);
  plaza.set(14, 27, T.LAMP);
  plaza.set(16, 11, T.SIGN);
  plaza.signs.push({ x: 16, y: 11, text: "HOOT PLAZA — Owlies only. SWAP, never cash. TAKE YOUR SHOT." });
  [18, 19, 20, 21].forEach(function (x) {
    plaza.warps.push({ x: x, y: 0, to: "route1", tx: 6 + (x - 18), ty: 45, needFlag: "got_starter", deny: "Professor Marlowe is waiting in the lab. Grab a partner first." });
  });
  plaza.npcs.push({
    id: "kid", name: "PIP", kind: "kid", x: 10, y: 15, dir: 0, role: "chat",
    lines: ["Vex keeps saying the routes are sold out.", "They are not. The grass is full of raiders."],
  });
  plaza.npcs.push({
    id: "fan", name: "NIA", kind: "owlie", x: 11, y: 25, dir: 1, role: "chat",
    lines: ["Pack Bar's through that gold door.", "Rips cost SWAP. Nobody here takes a card or cash."],
  });
  maps.plaza = plaza;

  /* interiors */
  var house = room("player_house", "Your Nest", 14, 12);
  house.set(7, 10, T.DOOR);
  house.set(3, 3, T.BED);
  house.set(10, 3, T.BOOK);
  house.rect(5, 6, 4, 2, T.RUG);
  house.warps.push({ x: 7, y: 10, to: "plaza", tx: 30, ty: 8 });
  house.npcs.push({
    id: "mom", name: "MA", kind: "nurse", x: 4, y: 5, dir: 0, role: "mom",
  });
  maps.player_house = house;

  var lab = room("lab", "Marlowe Lab", 16, 14);
  lab.set(8, 12, T.DOOR);
  lab.rect(4, 3, 8, 1, T.COUNTER);
  lab.set(5, 5, T.MACHINE);
  lab.set(7, 5, T.MACHINE);
  lab.set(9, 5, T.MACHINE);
  lab.set(12, 3, T.BOOK);
  lab.warps.push({ x: 8, y: 12, to: "plaza", tx: 7, ty: 8 });
  lab.npcs.push({ id: "prof", name: "MARLOWE", kind: "prof", x: 8, y: 6, dir: 0, role: "prof" });
  lab.npcs.push({
    id: "vexlab", name: "VEX", kind: "rival", x: 8, y: 10, dir: 1, role: "trainer",
    flag: "rival_lab", reward: 40, sight: 0,
    show: function (f) { return !!f.got_starter && !f.rival_lab; },
    team: function (g) { return [[R.counterStarter(g.starter), 5]]; },
    intro: ["Still here? Fine. TAKE YOUR SHOT."],
    win: ["Tch. The trail is mine next."],
    lines: ["You got lucky in the curtain light."],
  });
  maps.lab = lab;

  var bar = room("pack_bar", "Pack Bar", 16, 12);
  bar.set(8, 10, T.DOOR);
  bar.rect(3, 3, 10, 1, T.COUNTER);
  bar.set(4, 5, T.MACHINE);
  bar.set(5, 6, T.FOIL);
  bar.rect(6, 7, 4, 2, T.RUG);
  bar.warps.push({ x: 8, y: 10, to: "plaza", tx: 7, ty: 24 });
  bar.npcs.push({ id: "barkeep", name: "JUNO", kind: "clerk", x: 8, y: 4, dir: 0, role: "bartender" });
  maps.pack_bar = bar;

  var pc = room("pc", "Vault Counter", 14, 12);
  pc.set(7, 10, T.DOOR);
  pc.set(3, 4, T.PC);
  pc.set(4, 4, T.PC);
  pc.rect(6, 6, 3, 2, T.RUG);
  pc.warps.push({ x: 7, y: 10, to: "plaza", tx: 19, ty: 24 });
  pc.npcs.push({ id: "nurse", name: "SABLE", kind: "nurse", x: 8, y: 5, dir: 0, role: "heal" });
  maps.pc = pc;

  var mart = room("mart", "Plaza Mart", 14, 12);
  mart.set(7, 10, T.DOOR);
  mart.rect(3, 3, 8, 1, T.COUNTER);
  mart.set(11, 4, T.BOOK);
  mart.warps.push({ x: 7, y: 10, to: "plaza", tx: 30, ty: 24 });
  mart.npcs.push({ id: "clerk", name: "OTTO", kind: "clerk", x: 6, y: 4, dir: 0, role: "mart", shop: "mart" });
  maps.mart = mart;

  var rhouse = room("rival_house", "Vex's Nest", 12, 10);
  rhouse.set(6, 8, T.DOOR);
  rhouse.set(2, 2, T.BED);
  rhouse.set(8, 2, T.BOOK);
  rhouse.warps.push({ x: 6, y: 8, to: "plaza", tx: 30, ty: 32 });
  rhouse.npcs.push({
    id: "vexmom", name: "REN", kind: "owlie", x: 4, y: 4, dir: 0, role: "chat",
    lines: ["Vex talks a big rip and sleeps through breakfast.", "Beat them fair. No cash bets in this house."],
  });
  maps.rival_house = rhouse;

  /* doors from plaza into interiors — step on the door tile */
  plaza.warps.push({ x: 7, y: 7, to: "lab", tx: 8, ty: 11 });
  plaza.warps.push({ x: 30, y: 7, to: "player_house", tx: 7, ty: 9 });
  plaza.warps.push({ x: 7, y: 23, to: "pack_bar", tx: 8, ty: 9 });
  plaza.warps.push({ x: 19, y: 23, to: "pc", tx: 7, ty: 9 });
  plaza.warps.push({ x: 30, y: 23, to: "mart", tx: 7, ty: 9 });
  plaza.warps.push({ x: 30, y: 31, to: "rival_house", tx: 6, ty: 7 });

  /* ---------- Route 1 ---------- */
  var r1 = M("route1", "Foil Trail", 16, 48, T.TALL);
  r1.border(T.TREE);
  r1.rect(6, 1, 4, 46, T.PATH);
  r1.rect(0, 0, 16, 1, T.TREE);
  r1.rect(0, 47, 16, 1, T.TREE);
  r1.rect(6, 0, 4, 1, T.PATH);
  r1.rect(6, 47, 4, 1, T.PATH);
  r1.rect(2, 30, 3, 2, T.BRAMBLE);
  r1.set(2, 28, T.FLOWER);
  r1.items.push({ x: 2, y: 27, id: "charm", n: 1, flag: "it_r1_charm" });
  r1.set(3, 27, T.BRAMBLE);
  r1.enc = [
    { id: "foilghost", min: 3, max: 5, w: 20 },
    { id: "packrat", min: 3, max: 5, w: 20 },
    { id: "clearout", min: 4, max: 6, w: 16 },
    { id: "nestling", min: 3, max: 5, w: 12 },
    { id: "hootling", min: 3, max: 4, w: 10 },
    { id: "scalplet", min: 5, max: 6, w: 6 },
  ];
  [6, 7, 8, 9].forEach(function (x, i) {
    r1.warps.push({ x: x, y: 47, to: "plaza", tx: 18 + i, ty: 1 });
    r1.warps.push({ x: x, y: 0, to: "shelfburg", tx: 16 + i, ty: 27 });
  });
  r1.npcs.push({
    id: "ace", name: "ACE", kind: "kid", x: 4, y: 18, dir: 3, role: "trainer",
    flag: "t_r1_ace", reward: 60, sight: 3, range: 3,
    team: function () { return [["packrat", 6], ["foilghost", 6]]; },
    intro: ["This trail is my case. Hands off the foils."],
    win: ["Okay, okay. Your sleeves are cleaner."],
    lines: ["I will restock. With SWAP. Not yours."],
  });
  r1.scripts.push({
    x: 6, y: 22, w: 4, h: 1, flag: "rival_route1",
    start: "rival_route",
  });
  r1.set(5, 10, T.SIGN);
  r1.signs.push({ x: 5, y: 10, text: "FOIL TRAIL — tall grass hides raiders. Bramble hates a gale." });
  maps.route1 = r1;

  /* ---------- Shelfburg ---------- */
  var shelf = M("shelfburg", "Shelfburg", 36, 30, T.GRASS);
  shelf.border(T.TREE);
  shelf.rect(14, 1, 6, 28, T.PATH);
  shelf.rect(2, 14, 32, 3, T.PATH);
  shelf.house(2, 3, 10, 6, 6);
  shelf.house(22, 4, 10, 6, 26);
  shelf.house(22, 18, 10, 6, 26);
  shelf.rect(14, 28, 6, 1, T.PATH);
  shelf.rect(34, 13, 2, 4, T.PATH);
  shelf.set(12, 13, T.SIGN);
  shelf.signs.push({ x: 12, y: 13, text: "SHELFBURG GYM — east door. Leader SCORCH. East gate wants the Ember Crest." });
  shelf.set(20, 16, T.LAMP);
  [14, 15, 16, 17].forEach(function (x, i) {
    shelf.warps.push({ x: x, y: 28, to: "route1", tx: 6 + i, ty: 1 });
  });
  shelf.warps.push({ x: 6, y: 8, to: "gym1", tx: 9, ty: 13 });
  shelf.warps.push({ x: 26, y: 9, to: "shelf_mart", tx: 7, ty: 9 });
  shelf.warps.push({ x: 26, y: 23, to: "shelf_pc", tx: 7, ty: 9 });
  [14, 15].forEach(function (y) {
    shelf.warps.push({
      x: 35, y: y, to: "route2", tx: 1, ty: 7 + (y - 14),
      needFlag: "badge1",
      deny: "Gate Owlie taps the post. Ember Crest, then the coast.",
    });
  });
  shelf.npcs.push({
    id: "guide1", name: "QUILL", kind: "gate", x: 33, y: 12, dir: 0, role: "chat",
    lines: ["Scorch runs the gym in the west building.", "Gust Sweep opens after the crest. Stone Smash waits on a later seal."],
  });
  shelf.npcs.push({
    id: "local", name: "BEE", kind: "owlie", x: 10, y: 16, dir: 3, role: "chat",
    lines: ["Shelfburg used to be a stockroom.", "Now the stock fights back."],
  });
  maps.shelfburg = shelf;

  var smart = room("shelf_mart", "Shelf Mart", 14, 12);
  smart.set(7, 10, T.DOOR);
  smart.rect(3, 3, 8, 1, T.COUNTER);
  smart.warps.push({ x: 7, y: 10, to: "shelfburg", tx: 26, ty: 10 });
  smart.npcs.push({ id: "sclerk", name: "OTTO", kind: "clerk", x: 6, y: 4, dir: 0, role: "mart", shop: "mart" });
  maps.shelf_mart = smart;

  var spc = room("shelf_pc", "Shelf Vault", 14, 12);
  spc.set(7, 10, T.DOOR);
  spc.set(3, 4, T.PC);
  spc.warps.push({ x: 7, y: 10, to: "shelfburg", tx: 26, ty: 24 });
  spc.npcs.push({ id: "snurse", name: "SABLE", kind: "nurse", x: 8, y: 5, dir: 0, role: "heal" });
  maps.shelf_pc = spc;

  var gym1 = room("gym1", "Ember Gym", 18, 16);
  gym1.set(9, 14, T.DOOR);
  gym1.rect(4, 4, 10, 1, T.COUNTER);
  gym1.rect(6, 8, 6, 3, T.RUG);
  gym1.set(3, 3, T.LAMP);
  gym1.set(14, 3, T.LAMP);
  gym1.warps.push({ x: 9, y: 14, to: "shelfburg", tx: 6, ty: 9 });
  gym1.npcs.push({
    id: "g1a", name: "CINN", kind: "kid", x: 4, y: 9, dir: 3, role: "trainer",
    flag: "t_g1a", reward: 80, sight: 3, range: 4,
    team: function () { return [["ripkit", 11], ["sparkmite", 11]]; },
    intro: ["Warm-up pull. Don't whiff."],
    win: ["Scorch is hotter than me."],
    lines: ["I need a berry and a nap."],
  });
  gym1.npcs.push({
    id: "g1b", name: "FLINT", kind: "owlie", x: 13, y: 7, dir: 2, role: "trainer",
    flag: "t_g1b", reward: 90, sight: 2, range: 4,
    team: function () { return [["ripper", 13]]; },
    intro: ["Foil burns if you hesitate."],
    win: ["Crest's that way."],
    lines: ["Nice shot."],
  });
  gym1.npcs.push({
    id: "scorch", name: "SCORCH", kind: "leader", x: 9, y: 5, dir: 0, role: "trainer",
    flag: "badge1", reward: 280, sight: 0, badge: 1,
    team: function () { return [["ripper", 15], ["ripkit", 14], ["voltowl", 15]]; },
    intro: ["I am Scorch. Show me you can finish a box, not just open it."],
    win: ["Ember Crest is yours. Bramble bows to gale now.", "Harbor is past the east gate. Brine is wet and rude."],
    lines: ["The crest looks right on an Owlie."],
  });
  maps.gym1 = gym1;

  /* ---------- Route 2 coast ---------- */
  var r2 = M("route2", "Chrome Coast", 42, 18, T.GRASS);
  r2.rect(0, 0, 42, 2, T.TREE);
  r2.rect(0, 2, 42, 4, T.TALL);
  r2.rect(0, 6, 42, 4, T.PATH);
  r2.rect(0, 10, 42, 2, T.SAND);
  r2.rect(0, 12, 42, 6, T.WATER);
  r2.set(0, 7, T.PATH);
  r2.set(0, 8, T.PATH);
  r2.set(41, 7, T.PATH);
  r2.set(41, 8, T.PATH);
  r2.set(20, 2, T.ROCK);
  r2.set(22, 2, T.ROCK);
  r2.set(20, 3, T.ROCK);
  r2.set(21, 3, T.ROCK);
  r2.set(22, 3, T.ROCK);
  r2.set(21, 1, T.TREE);
  r2.items.push({ x: 21, y: 2, id: "chromeball", n: 3, flag: "it_r2_chrome" });
  r2.set(8, 5, T.SIGN);
  r2.signs.push({ x: 8, y: 5, text: "CHROME COAST — tide raiders in the grass. Rocks want the Brine Seal and a stone arm." });
  r2.enc = [
    { id: "tideling", min: 12, max: 15, w: 22 },
    { id: "shelflick", min: 12, max: 15, w: 18 },
    { id: "sparkmite", min: 12, max: 14, w: 14 },
    { id: "packrat", min: 13, max: 16, w: 12 },
    { id: "clearout", min: 13, max: 16, w: 10 },
  ];
  [7, 8].forEach(function (y, i) {
    r2.warps.push({ x: 0, y: y, to: "shelfburg", tx: 34, ty: 14 + i });
    r2.warps.push({ x: 41, y: y, to: "harbor", tx: 1, ty: 14 + i });
  });
  r2.npcs.push({
    id: "sailor", name: "BRIN", kind: "owlie", x: 18, y: 5, dir: 0, role: "trainer",
    flag: "t_r2_brin", reward: 120, sight: 0, range: 3,
    team: function () { return [["tideling", 14], ["shelflick", 14]]; },
    intro: ["Coast tax. One battle."],
    win: ["Keep your SWAP. I was joking about tax."],
    lines: ["Harbor lights are east."],
  });
  maps.route2 = r2;

  /* ---------- Harbor ---------- */
  var harbor = M("harbor", "Foil Harbor", 34, 26, T.GRASS);
  harbor.border(T.TREE);
  harbor.rect(0, 13, 2, 4, T.PATH);
  harbor.rect(2, 12, 28, 4, T.PATH);
  harbor.rect(14, 2, 4, 12, T.PATH);
  harbor.rect(14, 16, 4, 8, T.PATH);
  harbor.rect(26, 4, 7, 8, T.WATER);
  harbor.rect(26, 8, 3, 2, T.BRIDGE);
  harbor.house(3, 3, 9, 6, 7);
  harbor.house(18, 4, 8, 6, 21);
  harbor.house(4, 18, 9, 6, 8);
  harbor.set(12, 11, T.SIGN);
  harbor.signs.push({ x: 12, y: 11, text: "FOIL HARBOR — Gym west. North road wants the Brine Seal." });
  harbor.set(16, 18, T.LAMP);
  harbor.warps.push({ x: 7, y: 8, to: "gym2", tx: 9, ty: 13 });
  harbor.warps.push({ x: 21, y: 9, to: "harbor_mart", tx: 7, ty: 9 });
  harbor.warps.push({ x: 8, y: 23, to: "harbor_pc", tx: 7, ty: 9 });
  [14, 15].forEach(function (y) {
    harbor.warps.push({ x: 0, y: y, to: "route2", tx: 40, ty: 7 + (y - 14) });
  });
  [15, 16].forEach(function (x) {
    harbor.warps.push({
      x: x, y: 1, to: "route3", tx: 6 + (x - 15), ty: 33,
      needFlag: "badge2",
      deny: "The dock master shakes their head. Brine Seal first.",
    });
  });
  harbor.rect(15, 0, 2, 1, T.PATH);
  harbor.npcs.push({
    id: "dock", name: "MARL", kind: "gate", x: 18, y: 3, dir: 0, role: "chat",
    lines: ["North is Night Rip Road.", "Vex already bragged their way toward the Spire."],
  });
  harbor.scripts.push({ x: 14, y: 20, w: 4, h: 1, flag: "rival_harbor", start: "rival_harbor" });
  maps.harbor = harbor;

  var hmart = room("harbor_mart", "Harbor Mart", 14, 12);
  hmart.set(7, 10, T.DOOR);
  hmart.rect(3, 3, 8, 1, T.COUNTER);
  hmart.warps.push({ x: 7, y: 10, to: "harbor", tx: 21, ty: 10 });
  hmart.npcs.push({ id: "hclerk", name: "OTTO", kind: "clerk", x: 6, y: 4, dir: 0, role: "mart", shop: "late" });
  maps.harbor_mart = hmart;

  var hpc = room("harbor_pc", "Harbor Vault", 14, 12);
  hpc.set(7, 10, T.DOOR);
  hpc.set(3, 4, T.PC);
  hpc.warps.push({ x: 7, y: 10, to: "harbor", tx: 8, ty: 24 });
  hpc.npcs.push({ id: "hnurse", name: "SABLE", kind: "nurse", x: 8, y: 5, dir: 0, role: "heal" });
  maps.harbor_pc = hpc;

  var gym2 = room("gym2", "Tide Gym", 18, 16);
  gym2.set(9, 14, T.DOOR);
  gym2.rect(3, 6, 12, 4, T.WATER);
  gym2.rect(8, 5, 2, 10, T.BRIDGE);
  gym2.rect(7, 3, 4, 2, T.RUG);
  gym2.warps.push({ x: 9, y: 14, to: "harbor", tx: 7, ty: 9 });
  gym2.npcs.push({
    id: "g2a", name: "KELP", kind: "owlie", x: 4, y: 11, dir: 3, role: "trainer",
    flag: "t_g2a", reward: 140, sight: 3, range: 4,
    team: function () { return [["tideling", 20], ["brineback", 21]]; },
    intro: ["Mind the slick boards."],
    win: ["Brine is at the north rug."],
    lines: ["Salt in the sleeves. Classic."],
  });
  gym2.npcs.push({
    id: "brine", name: "BRINE", kind: "leader", x: 9, y: 4, dir: 0, role: "trainer",
    flag: "badge2", reward: 420, sight: 0, badge: 2,
    team: function () { return [["brineback", 24], ["tideling", 22], ["shelfbreaker", 24]]; },
    intro: ["Brine. The harbor doesn't do refunds. It does rematches until you learn."],
    win: ["Brine Seal. Stone Smash is yours.", "Night Rip Road is open. Vex is already loud up there."],
    lines: ["Keep the seal dry. Joke. It can swim."],
  });
  maps.gym2 = gym2;

  /* ---------- Route 3 ---------- */
  var r3 = M("route3", "Night Rip Road", 16, 36, T.TALL, { nightBias: 1 });
  r3.border(T.TREE);
  r3.rect(6, 1, 4, 34, T.PATH);
  r3.rect(6, 0, 4, 1, T.PATH);
  r3.rect(6, 35, 4, 1, T.PATH);
  r3.rect(11, 8, 3, 2, T.ROCK);
  r3.items.push({ x: 13, y: 6, id: "vaultball", n: 1, flag: "it_r3_vault" });
  r3.set(13, 7, T.ROCK);
  r3.set(4, 16, T.LAMP);
  r3.set(11, 24, T.LAMP);
  r3.enc = [
    { id: "foilghost", min: 22, max: 26, w: 18 },
    { id: "spectowl", min: 24, max: 28, w: 14 },
    { id: "scalplet", min: 22, max: 26, w: 12 },
    { id: "voltowl", min: 23, max: 27, w: 10 },
    { id: "bulkbuyer", min: 26, max: 28, w: 4 },
  ];
  [6, 7].forEach(function (x, i) {
    r3.warps.push({ x: x, y: 35, to: "harbor", tx: 15 + i, ty: 2 });
    r3.warps.push({ x: x, y: 0, to: "vault", tx: 13 + i, ty: 21 });
  });
  r3.npcs.push({
    id: "shade", name: "UMBRA", kind: "rival", x: 4, y: 18, dir: 3, role: "trainer",
    flag: "t_r3_umbra", reward: 200, sight: 3, range: 3,
    team: function () { return [["spectowl", 26], ["foilghost", 25]]; },
    intro: ["Night market rules. Winner walks."],
    win: ["The Spire is lit. Don't sell the moment."],
    lines: ["I fade. You don't."],
  });
  r3.npcs.push({
    id: "bulk", name: "BULK", kind: "leader", x: 12, y: 5, dir: 0, role: "static",
    flag: "static_bulk",
    show: function (f) { return !!f.badge2 && !f.static_bulk; },
    team: function () { return [["bulkbuyer", 30]]; },
    intro: ["A Bulkbuyer regards you like a sealed case.", "It can be caught. TAKE YOUR SHOT."],
    lines: ["The case is empty now."],
  });
  maps.route3 = r3;

  /* ---------- Vault Spire ---------- */
  var vault = M("vault", "Vault Spire", 30, 24, T.GRASS);
  vault.border(T.TREE);
  vault.rect(12, 1, 6, 22, T.PATH);
  vault.rect(4, 10, 22, 3, T.PATH);
  vault.house(8, 2, 14, 7, 14);
  vault.rect(12, 22, 6, 1, T.PATH);
  vault.set(10, 12, T.SIGN);
  vault.signs.push({ x: 10, y: 12, text: "VAULT SPIRE — Champion Aurelia. No buy-ins. No cash. Just the crown." });
  vault.set(18, 14, T.LAMP);
  vault.set(11, 14, T.LAMP);
  [13, 14].forEach(function (x, i) {
    vault.warps.push({ x: x, y: 22, to: "route3", tx: 6 + i, ty: 1 });
  });
  vault.warps.push({
    x: 14, y: 8, to: "champ", tx: 9, ty: 14,
    needFlag: "rival_vault",
    deny: "Vex blocks the gold door. They want the last word.",
  });
  vault.npcs.push({
    id: "vexvault", name: "VEX", kind: "rival", x: 14, y: 11, dir: 0, role: "trainer",
    flag: "rival_vault", reward: 500, sight: 0,
    show: function (f) { return !!f.badge2 && !f.rival_vault; },
    team: function (g) {
      var base = g.starter || "hootling";
      return [[R.lineStage(base, 2), 31], ["resale", 30], ["spectowl", 29], ["scalplet", 28]];
    },
    intro: ["Last stall, Owlie.", "I don't want your money. I want the story where I win."],
    win: ["...Take the door.", "Aurelia doesn't blink. Don't you blink either."],
    lines: ["Go on. The crown isn't my size anyway."],
  });
  maps.vault = vault;

  var champ = room("champ", "Crown Hall", 18, 16);
  champ.set(9, 14, T.DOOR);
  champ.rect(5, 6, 8, 4, T.RUG);
  champ.set(4, 3, T.BOOK);
  champ.set(13, 3, T.BOOK);
  champ.set(9, 4, T.FOIL);
  champ.warps.push({ x: 9, y: 14, to: "vault", tx: 14, ty: 9 });
  champ.npcs.push({
    id: "aurelia", name: "AURELIA", kind: "leader", x: 9, y: 5, dir: 0, role: "trainer",
    flag: "champ", reward: 900, sight: 0, badge: 3,
    team: function () {
      return [["aureowl", 34], ["infernowl", 33], ["canopyrex", 33], ["spectowl", 32], ["hoardbeast", 32]];
    },
    intro: ["Aurelia. Vault Spire.", "SHOW me the shot. Not a story about a shot."],
    win: ["Vault Crown.", "The region stays open. Fill the dex. Rip honest packs. Never cash."],
    lines: ["Champion Owlie. The foil looks good on you."],
  });
  maps.champ = champ;

  R.maps = maps;

  R.validateMaps = function () {
    var errs = [];
    Object.keys(maps).forEach(function (id) {
      var m = maps[id];
      m.warps.forEach(function (w) {
        var t = maps[w.to];
        if (!t) errs.push(id + " warp missing " + w.to);
        else if (w.tx < 0 || w.ty < 0 || w.tx >= t.w || w.ty >= t.h) errs.push(id + " warp oob " + w.to + " " + w.tx + "," + w.ty);
      });
      m.npcs.forEach(function (n) {
        if (n.x < 0 || n.y < 0 || n.x >= m.w || n.y >= m.h) errs.push(id + " npc oob " + n.id);
      });
      m.enc.forEach(function (e) {
        if (!R.SPECIES[e.id]) errs.push(id + " enc " + e.id);
      });
      m.items.forEach(function (it) {
        if (!R.ITEMS[it.id]) errs.push(id + " item " + it.id);
      });
    });
    return errs;
  };
})();
