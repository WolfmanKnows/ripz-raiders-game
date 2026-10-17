/* RIPZ Raiders — overworld, battles, packs, save. TAKE YOUR SHOT. */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});
  var c, ctx;
  var TILE = 64;
  var INTRO = [
    "Okay. You're the Owlie. I'm the narration. We both know it.",
    "Scalpers want the story, not your cash. Cash is banned. I will not let it go.",
    "Professor Marlowe is west of the plaza, doing the tutorial with a straight face.",
    "TAKE YOUR SHOT. Yes, you press A. I'm helpful and unbearable.",
  ];
  var KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["DEL", "OK"]);

  function fresh() {
    return {
      scene: "title",
      name: "OWLIE",
      swap: 0,
      badges: [0, 0, 0],
      party: [],
      box: [],
      bag: {},
      dexS: {},
      dexC: {},
      flags: {},
      cuts: {},
      map: null,
      player: { x: 0, y: 0, dir: 0, moving: false, mt: 0, fromX: 0, fromY: 0, suppressWarp: true },
      starter: null,
      charm: 0,
      clock: 45,
      mute: false,
      lastHeal: { map: "player_house", x: 7, y: 7 },
      held: new Set(),
      pressed: [],
      dialog: null,
      ui: null,
      battle: null,
      fade: null,
      toast: null,
      particles: [],
      shake: 0,
      weather: "clear",
      time: 0,
      titleI: 0,
      nameBuf: "OWLIE",
      nameI: 27,
      introI: 0,
      steps: 0,
      error: "",
      rename: false,
    };
  }

  function $(id) { return document.getElementById(id); }

  R.stop = function () { R._loop = (R._loop || 0) + 1; };

  R.boot = function () {
    R.stop();
    var my = R._loop;
    c = $("c");
    if (!c) return;
    ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    try {
      var errs = (R.validateData ? R.validateData() : []).concat(R.validateMaps ? R.validateMaps() : []);
      if (errs.length) console.error("RIPZ validate", errs);
      if (R.art) R.art.build();
    } catch (e) { console.error(e); }
    if (!R.G) R.G = fresh();
    bindInput();
    configureViewport();
    var qs = new URLSearchParams(location.search);
    if (qs.get("qa") === "1" && !R.G._qa) quickQA();
    var app = document.querySelector(".ripz-app");
    if (app) app.classList.add("is-live");
    window.__controlsTest = {
      getYaw: function () { return R.G.player ? R.G.player.dir : 0; },
      getSpeed: function () { return R.G.player && R.G.player.moving ? 1 : 0; },
      getPos: function () { return { x: R.G.player.x, y: R.G.player.y }; },
      setKeys: function (codes) {
        R.G.held.clear();
        (codes || []).forEach(function (k) { R.G.held.add(k); });
      },
    };
    R.debug = {
      warp: function (id, x, y) { R.G.scene = "overworld"; R.setMap(id, x || 4, y || 4); },
      wild: function (id, lv) { startWildMon(R.createMon(id || "foilghost", lv || 4)); },
      flag: function (k) { R.G.flags[k] = 1; },
    };
    var last = performance.now();
    function frame(t) {
      if (my !== R._loop) return;
      var dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      try { update(dt); render(); }
      catch (err) {
        console.error(err);
        R.G.error = String(err && err.message ? err.message : err);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  R.toTitle = function () {
    if (!R.G) return;
    R.G.scene = "title";
    R.G.dialog = null;
    R.G.ui = null;
    R.G.battle = null;
    R.G.busy = null;
    R.G.fade = null;
  };
  R.openCard = function () {
    if (!R.G) return;
    R.G.rename = true;
    R.G.nameBuf = R.G.name || "OWLIE";
    R.G._back = R.G.scene;
    R.G.scene = "name";
  };

  function configureViewport() {
    if (!c) return;
    var portrait = window.innerHeight > window.innerWidth + 30;
    var w = portrait ? 640 : 960;
    var h = portrait ? 960 : 640;
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    fit();
  }
  function fit() {
    var wrap = $("canvasWrap");
    if (!wrap || !c) return;
    var r = wrap.getBoundingClientRect();
    var ar = c.width / c.height;
    var w = r.width - 8;
    var h = r.height - 8;
    if (w / h > ar) w = h * ar;
    else h = w / ar;
    c.style.width = Math.max(80, Math.floor(w)) + "px";
    c.style.height = Math.max(80, Math.floor(h)) + "px";
  }

  function bindInput() {
    if (R._bound) return;
    R._bound = true;
    window.addEventListener("keydown", function (e) {
      var block = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1 };
      if (block[e.code]) e.preventDefault();
      R.unlockAudio && R.unlockAudio();
      if (!R.G) return;
      if (!e.repeat) R.G.pressed.push(e.code);
      R.G.held.add(e.code);
    });
    window.addEventListener("keyup", function (e) { if (R.G) R.G.held.delete(e.code); });
    window.addEventListener("blur", function () { if (R.G) R.G.held.clear(); });
    window.addEventListener("resize", configureViewport);
    function hold(btn, code) {
      if (!btn) return;
      var down = function (e) {
        e.preventDefault();
        R.unlockAudio && R.unlockAudio();
        if (!R.G) return;
        R.G.held.add(code);
        R.G.pressed.push(code);
        if (c) c.focus();
      };
      var up = function () { if (R.G) R.G.held.delete(code); };
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", up);
      btn.addEventListener("pointerleave", up);
    }
    document.querySelectorAll("[data-dir]").forEach(function (b) { hold(b, "t:" + b.dataset.dir); });
    hold($("btnA"), "t:a");
    hold($("btnB"), "t:b");
    hold($("btnStart"), "t:menu");
    var card = $("signInBtn");
    if (card) card.addEventListener("click", function () {
      if (window.RIPZ_ACCOUNT) window.RIPZ_ACCOUNT.signIn();
    });
    if (c) {
      c.addEventListener("pointerdown", function () { c.focus(); R.unlockAudio && R.unlockAudio(); });
      c.tabIndex = 0;
    }
  }

  function consumed(codes) {
    var g = R.G;
    for (var i = 0; i < codes.length; i++) {
      var ix = g.pressed.indexOf(codes[i]);
      if (ix >= 0) { g.pressed.splice(ix, 1); return true; }
    }
    return false;
  }
  function pressA() { return consumed(["Enter", "Space", "KeyZ", "KeyE", "t:a"]); }
  function pressB() { return consumed(["KeyX", "Backspace", "Escape", "t:b"]); }
  function pressMenu() { return consumed(["KeyM", "t:menu"]); }
  function pressDir(which) {
    var map = {
      0: ["ArrowDown", "KeyS", "t:down"],
      1: ["ArrowUp", "KeyW", "t:up"],
      2: ["ArrowLeft", "KeyA", "t:left"],
      3: ["ArrowRight", "KeyD", "t:right"],
    };
    return consumed(map[which]);
  }
  function dirHeld() {
    var h = R.G.held;
    if (h.has("ArrowUp") || h.has("KeyW") || h.has("t:up")) return 1;
    if (h.has("ArrowDown") || h.has("KeyS") || h.has("t:down")) return 0;
    if (h.has("ArrowLeft") || h.has("KeyA") || h.has("t:left")) return 2;
    if (h.has("ArrowRight") || h.has("KeyD") || h.has("t:right")) return 3;
    return -1;
  }
  function step(x, y, d) {
    if (d === 0) return { x: x, y: y + 1 };
    if (d === 1) return { x: x, y: y - 1 };
    if (d === 2) return { x: x - 1, y: y };
    return { x: x + 1, y: y };
  }

  function say(lines, cb) {
    if (typeof lines === "string") lines = [lines];
    R.G.dialog = { lines: lines, i: 0, cb: cb || null, choices: null, ci: 0 };
  }
  function choice(prompt, options) {
    R.G.dialog = { lines: [prompt], i: 0, cb: null, choices: options, ci: 0 };
  }

  function update(dt) {
    var g = R.G;
    g.time += dt;
    if (g.scene !== "title" && g.scene !== "name" && g.scene !== "intro") g.clock += dt;
    g.hour = (8 + g.clock / 45) % 24;
    if (g.toast) { g.toast.t -= dt; if (g.toast.t <= 0) g.toast = null; }
    g.shake = Math.max(0, g.shake - dt * 18);
    tickHp(dt);
    tickParts(dt);
    if (g.battle && g.battle.fx && g.battle.fx.t != null && g.battle.phase === "catch") {
      g.battle.fx.t += dt;
      if (g.battle.fx.t >= g.battle.fx.dur) resolveCatch();
    }
    if (g.fade) {
      g.fade.t += dt;
      if (g.fade.t >= 0.28 && !g.fade.fired) {
        g.fade.fired = true;
        var fn = g.fade.fn;
        g.fade.fn = null;
        if (fn) fn();
      }
      if (g.fade.t >= 0.56) g.fade = null;
      if (g.fade && g.fade.t < 0.45) { g.pressed.length = 0; return; }
    }
    if (g.dialog) updateDialog();
    else if (g.ui && (g.scene === "overworld" || g.scene === "battle")) updateUI();
    else if (g.scene === "title") updateTitle();
    else if (g.scene === "name") updateName();
    else if (g.scene === "intro") updateIntro();
    else if (g.scene === "overworld") updateWorld(dt);
    else if (g.scene === "battle") updateBattle();
    else if (g.scene === "shop") updateShop();
    else if (g.scene === "rip") updateRip(dt);
    else if (g.scene === "pc") updatePC();
    else if (g.scene === "evo") updateEvo(dt);
    g.pressed.length = 0;
  }

  function updateDialog() {
    var d = R.G.dialog;
    if (!d) return;
    var choosing = d.choices && d.i >= d.lines.length - 1;
    if (choosing && pressDir(1)) { d.ci = (d.ci + d.choices.length - 1) % d.choices.length; R.sfx("tap"); }
    if (choosing && pressDir(0)) { d.ci = (d.ci + 1) % d.choices.length; R.sfx("tap"); }
    if (pressA() || (!choosing && pressMenu())) {
      if (d.i < d.lines.length - 1) { d.i++; R.sfx("tap"); return; }
      if (choosing) {
        var pick = d.choices[d.ci || 0];
        R.G.dialog = null;
        if (pick && pick.cb) pick.cb();
        return;
      }
      var cb = d.cb;
      R.G.dialog = null;
      if (cb) cb();
      return;
    }
    if (pressB() && choosing) {
      var last = d.choices[d.choices.length - 1];
      R.G.dialog = null;
      if (last && last.cb) last.cb();
    }
  }

  function updateTitle() {
    if (pressDir(1)) { R.G.titleI = (R.G.titleI + 2) % 3; R.sfx("tap"); }
    if (pressDir(0)) { R.G.titleI = (R.G.titleI + 1) % 3; R.sfx("tap"); }
    if (pressA() || pressMenu()) {
      R.sfx("start");
      if (R.G.titleI === 0) {
        R.G.rename = false;
        R.G.nameBuf = "OWLIE";
        R.G.nameI = KEYS.length - 1;
        R.G.scene = "name";
      } else if (R.G.titleI === 1) {
        if (R.hasSave() && R.loadGame()) {
          R.G.scene = "overworld";
          R.G.toast = { text: R.G.map.name, t: 2 };
        } else say("No save on this device yet.");
      } else R.G.mute = !R.G.mute;
    }
  }

  function updateName() {
    var cols = 10;
    if (pressDir(2)) R.G.nameI = Math.max(0, R.G.nameI - 1);
    if (pressDir(3)) R.G.nameI = Math.min(KEYS.length - 1, R.G.nameI + 1);
    if (pressDir(1)) R.G.nameI = Math.max(0, R.G.nameI - cols);
    if (pressDir(0)) R.G.nameI = Math.min(KEYS.length - 1, R.G.nameI + cols);
    if (pressB()) {
      R.G.nameBuf = R.G.nameBuf.slice(0, -1);
    }
    if (pressA()) {
      var ch = KEYS[R.G.nameI];
      if (ch === "OK") { confirmName(); return; }
      if (ch === "DEL") R.G.nameBuf = R.G.nameBuf.slice(0, -1);
      else if (R.G.nameBuf.length < 10) R.G.nameBuf += ch;
      R.sfx("tap");
    }
  }
  function confirmName() {
    var name = (R.G.nameBuf || "OWLIE").slice(0, 10);
    if (R.G.rename) {
      R.G.name = name;
      if (window.RIPZ_ACCOUNT && window.RIPZ_ACCOUNT.user) {
        window.RIPZ_ACCOUNT.user.name = name;
        try { localStorage.setItem("ripz_owlie_card", JSON.stringify(window.RIPZ_ACCOUNT.user)); } catch (e) {}
        window.RIPZ_ACCOUNT.updateUI();
      }
      R.G.scene = R.G._back || "overworld";
      R.G.rename = false;
      return;
    }
    beginAdventure(name);
  }

  function beginAdventure(name) {
    var keepMute = R.G.mute;
    R.G = fresh();
    R.G.mute = keepMute;
    R.G.name = name || "OWLIE";
    R.G.swap = 40;
    R.G.bag = { ripball: 8, berry: 4, serum: 1, pack: 1 };
    R.G.scene = "intro";
    R.G.introI = 0;
    R.setMap("player_house", 7, 7, { quiet: true });
  }

  function updateIntro() {
    if (pressA() || pressMenu()) {
      R.G.introI++;
      R.sfx("tap");
      if (R.G.introI >= INTRO.length) {
        R.G.scene = "overworld";
        R.G.flags.mom_hi = 1;
        say([
          "MA: There you are. I was about to break the fourth wall myself.",
          "MA: Marlowe's lab. West side. Gold machines. The quest log is already screaming.",
          "MA: Rip pack, berries, SWAP only. Cash is a bit. We don't do bits.",
          "MA: TAKE YOUR SHOT.",
        ]);
        R.saveGame();
      }
    }
  }

  function quickQA() {
    beginAdventure("QA");
    R.G.scene = "overworld";
    R.G.flags.got_starter = 1;
    R.G.flags.rival_lab = 1;
    R.G.flags.mom_hi = 1;
    R.G.starter = "hootling";
    var m = R.createMon("hootling", 12, { shiny: false });
    R.G.party = [m, R.createMon("ripkit", 8, { shiny: false })];
    R.G.dexS.hootling = 1; R.G.dexC.hootling = 1;
    R.G.dexS.ripkit = 1; R.G.dexC.ripkit = 1;
    R.G.bag.chromeball = 5;
    R.G.bag.goldberry = 2;
    R.G.swap = 200;
    R.setMap("plaza", 20, 14, { quiet: true });
    R.G._qa = 1;
  }

  R.setMap = function (id, x, y, opts) {
    var m = R.maps[id];
    if (!m) return;
    var g = R.G;
    g.map = m;
    g.player.x = x;
    g.player.y = y;
    g.player.fromX = x;
    g.player.fromY = y;
    g.player.moving = false;
    g.player.suppressWarp = true;
    g.busy = null;
    if (!opts || !opts.quiet) {
      g.weather = m.outdoor ? (Math.random() < 0.62 ? "clear" : Math.random() < 0.55 ? "rain" : "wind") : "clear";
      g.toast = { text: m.name, t: 2.2 };
      R.saveGame();
    }
  };

  function tileAt(x, y) {
    var m = R.G.map;
    var k = m.id + ":" + x + ":" + y;
    if (R.G.cuts[k]) return R.T.PATH;
    return m.tiles[y][x];
  }
  function activeNpcs() {
    if (!R.G.map) return [];
    return R.G.map.npcs.filter(function (n) { return !n.show || n.show(R.G.flags); });
  }
  function npcAt(x, y) {
    var list = activeNpcs();
    for (var i = 0; i < list.length; i++) if (list[i].x === x && list[i].y === y) return list[i];
    return null;
  }
  function walkable(x, y) {
    var m = R.G.map;
    if (!m || x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
    if (!R.WALK[tileAt(x, y)]) return false;
    if (npcAt(x, y)) return false;
    return true;
  }
  function warpAt(x, y) {
    var ws = R.G.map.warps;
    for (var i = 0; i < ws.length; i++) if (ws[i].x === x && ws[i].y === y) return ws[i];
    return null;
  }

  function updateWorld(dt) {
    var p = R.G.player;
    if (R.G.busy) {
      R.G.busy.t -= dt;
      if (R.G.busy.t <= 0) {
        var n = R.G.busy.n;
        R.G.busy = null;
        placeAdjacent(n);
        talkTrainer(n, true);
      }
      return;
    }
    if (pressMenu()) { R.G.ui = { type: "menu", i: 0 }; R.sfx("menu"); return; }
    if (pressA()) { interact(); return; }
    if (p.moving) {
      var dur = R.G.held.has("ShiftLeft") ? 0.085 : 0.16;
      p.mt += dt / dur;
      if (p.mt >= 1) {
        p.mt = 1;
        p.moving = false;
        onStep();
      }
      return;
    }
    var d = dirHeld();
    if (d < 0) { p.bumpLock = false; return; }
    p.dir = d;
    var npos = step(p.x, p.y, d);
    if (!walkable(npos.x, npos.y)) {
      if (!p.bumpLock) { R.sfx("bump"); p.bumpLock = true; }
      return;
    }
    p.bumpLock = false;
    p.fromX = p.x;
    p.fromY = p.y;
    p.x = npos.x;
    p.y = npos.y;
    p.mt = 0;
    p.moving = true;
    R.G.steps++;
  }

  function onStep() {
    if (checkWarp()) return;
    if (checkItem()) return;
    if (checkEnc()) return;
    if (checkSight()) return;
    checkScript();
  }
  function checkWarp() {
    var p = R.G.player;
    var w = warpAt(p.x, p.y);
    if (!w) { p.suppressWarp = false; return false; }
    if (p.suppressWarp) return false;
    if (w.needFlag && !R.G.flags[w.needFlag]) {
      say(w.deny || "Not yet.");
      p.x = p.fromX;
      p.y = p.fromY;
      return true;
    }
    R.G.fade = { t: 0, fired: false, fn: function () { R.setMap(w.to, w.tx, w.ty); R.G.player.suppressWarp = true; } };
    return true;
  }
  function checkItem() {
    var items = R.G.map.items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.x === R.G.player.x && it.y === R.G.player.y && !R.G.flags[it.flag]) {
        R.G.flags[it.flag] = 1;
        R.G.bag[it.id] = (R.G.bag[it.id] || 0) + it.n;
        R.sfx("item");
        say("Picked up " + it.n + " " + R.ITEMS[it.id].name + ". The grass was keeping it warm.");
        R.saveGame();
        return true;
      }
    }
    return false;
  }
  function checkEnc() {
    if (tileAt(R.G.player.x, R.G.player.y) !== R.T.TALL) return false;
    if (!R.G.map.enc || !R.G.map.enc.length) return false;
    if (R.G.charm > 0) { R.G.charm--; return false; }
    var rate = R.G.map.nightBias && (R.G.hour < 6 || R.G.hour >= 20) ? 0.16 : 0.11;
    if (Math.random() > rate) return false;
    var enc = R.G.map.enc;
    var total = 0;
    enc.forEach(function (e) { total += e.w; });
    var r = Math.random() * total;
    var pick = enc[0];
    for (var i = 0; i < enc.length; i++) { r -= enc[i].w; if (r <= 0) { pick = enc[i]; break; } }
    var lv = pick.min + Math.floor(Math.random() * (pick.max - pick.min + 1));
    if (R.G.map.nightBias && (R.G.hour < 6 || R.G.hour >= 20)) lv += 1;
    startWildMon(R.createMon(pick.id, lv));
    return true;
  }
  function checkSight() {
    var list = activeNpcs();
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (n.role !== "trainer" || !n.sight || R.G.flags[n.flag]) continue;
      var range = n.range || 4;
      var px = R.G.player.x, py = R.G.player.y;
      var see = false;
      if (n.dir === 0 && px === n.x && py > n.y && py - n.y <= range) see = clearTo(n.x, n.y, px, py);
      if (n.dir === 1 && px === n.x && py < n.y && n.y - py <= range) see = clearTo(n.x, n.y, px, py);
      if (n.dir === 2 && py === n.y && px < n.x && n.x - px <= range) see = clearTo(n.x, n.y, px, py);
      if (n.dir === 3 && py === n.y && px > n.x && px - n.x <= range) see = clearTo(n.x, n.y, px, py);
      if (see) {
        R.sfx("menu");
        R.G.busy = { t: 0.35, n: n };
        R.G.toast = { text: "!", t: 0.6 };
        return true;
      }
    }
    return false;
  }
  function clearTo(x, y, tx, ty) {
    var dx = Math.sign(tx - x), dy = Math.sign(ty - y);
    var cx = x + dx, cy = y + dy, guard = 0;
    while ((cx !== tx || cy !== ty) && guard++ < 12) {
      if (!R.G.map || cx < 0 || cy < 0 || cx >= R.G.map.w || cy >= R.G.map.h) return false;
      if (!R.WALK[tileAt(cx, cy)]) return false;
      cx += dx; cy += dy;
    }
    return true;
  }
  function placeAdjacent(n) {
    var px = R.G.player.x, py = R.G.player.y;
    var opts = [{ x: px, y: py + 1, d: 1 }, { x: px, y: py - 1, d: 0 }, { x: px - 1, y: py, d: 3 }, { x: px + 1, y: py, d: 2 }];
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      if (o.x === n.x && o.y === n.y) { n.dir = o.d; return; }
    }
    for (var j = 0; j < opts.length; j++) {
      if (walkable(opts[j].x, opts[j].y) || (opts[j].x === n.x && opts[j].y === n.y)) {
        n.x = opts[j].x; n.y = opts[j].y; n.dir = opts[j].d; return;
      }
    }
  }
  function checkScript() {
    var scripts = R.G.map.scripts || [];
    for (var i = 0; i < scripts.length; i++) {
      var sc = scripts[i];
      if (R.G.flags[sc.flag] || R.G.flags[sc.flag + "_arm"]) continue;
      if (R.G.player.x >= sc.x && R.G.player.x < sc.x + sc.w && R.G.player.y >= sc.y && R.G.player.y < sc.y + sc.h) {
        R.G.flags[sc.flag + "_arm"] = 1;
        if (sc.start === "rival_route") rivalRoute();
        else if (sc.start === "rival_harbor") rivalHarbor();
        return;
      }
    }
  }
  function rivalRoute() {
    var base = R.G.starter || "hootling";
    say(["VEX slides onto the path. Yes, the one you were walking.", "Cute plaza win. The trail is a different rip."], function () {
      startTrainer({
        name: "VEX",
        flag: "rival_route1",
        reward: 90,
        team: [[R.lineStage(base, 0), 11], ["scalplet", 10]],
        win: ["Remember this spot. I get louder from here. The writers insisted."],
      });
    });
  }
  function rivalHarbor() {
    var base = R.G.starter || "hootling";
    say(["VEX is waiting by the lamps. Scheduled, and still creepy.", "Harbor air. My team got meaner. Still no cash. I checked with the sign."], function () {
      startTrainer({
        name: "VEX",
        flag: "rival_harbor",
        reward: 220,
        team: [[R.lineStage(base, 1), 22], ["resale", 21], ["scalplet", 20]],
        win: ["Spire's next. I'll be standing on the script tile either way."],
      });
    });
  }

  function interact() {
    var f = step(R.G.player.x, R.G.player.y, R.G.player.dir);
    var n = npcAt(f.x, f.y);
    if (n) {
      n.dir = [1, 0, 3, 2][R.G.player.dir];
      return talkNpc(n);
    }
    var signs = R.G.map.signs || [];
    for (var i = 0; i < signs.length; i++) {
      if (signs[i].x === f.x && signs[i].y === f.y) return say(signs[i].text);
    }
    if (inMap(f.x, f.y)) {
      var t = tileAt(f.x, f.y);
      if (t === R.T.PC) return openPC();
      if ((t === R.T.MACHINE || t === R.T.FOIL) && R.G.map.id === "pack_bar") return ripFromBag();
      if (t === R.T.BRAMBLE || t === R.T.ROCK) return tryField(f.x, f.y, t);
    }
  }
  function inMap(x, y) {
    var m = R.G.map;
    return x >= 0 && y >= 0 && x < m.w && y < m.h;
  }
  function talkNpc(n) {
    if (n.role === "prof") return talkProf();
    if (n.role === "mom") return talkMom();
    if (n.role === "heal") return talkHeal();
    if (n.role === "mart") return openShop(n.shop || "mart");
    if (n.role === "bartender") return talkBar();
    if (n.role === "trainer" || n.role === "static") return talkTrainer(n, false);
    var lines = n.lines || ["..."];
    say(lines.map(function (l) { return n.name + ": " + l; }));
  }
  function talkMom() {
    var lines = R.G.flags.got_starter
      ? ["Lab light's still on. Marlowe loves a monologue.", "Want me to patch the team? It's free. I'm the nice tutorial."]
      : ["Marlowe's lab. Gold machines. West of the main street.", "TAKE YOUR SHOT — after you have a partner. Order of operations. I'm a mom."];
    say(lines.map(function (l) { return "MA: " + l; }), function () {
      if (!R.G.flags.got_starter) return;
      choice("Rest the team?", [
        { label: "Yes", cb: function () { healAll(); R.G.lastHeal = { map: "player_house", x: 7, y: 7 }; say("MA: All keyed up. Go be a problem."); } },
        { label: "No", cb: function () {} },
      ]);
    });
  }
  function talkHeal() {
    say(R.G.map.name + " — SABLE: Need a tune-up? SWAP stays in your pocket. I heal for the bit.", function () {
      choice("Patch every raider?", [
        { label: "Yes", cb: function () {
          healAll();
          R.G.lastHeal = { map: R.G.map.id, x: R.G.player.x, y: R.G.player.y };
          R.sfx("item");
          say("Your raiders look fight-ready. Try not to immediately walk into tall grass. You will.");
        } },
        { label: "No", cb: function () {} },
      ]);
    });
  }
  function talkBar() {
    say(["JUNO: Pack Bar. Rips cost SWAP. Never cash. I have a sign, a speech, and a stare.", "Packs in the bag rip right here. The machine is nosy. So am I."], function () {
      choice("What'll it be?", [
        { label: "Shop", cb: function () { openShop("bar"); } },
        { label: "Rip a pack", cb: ripFromBag },
        { label: "Leave", cb: function () {} },
      ]);
    });
  }
  function talkProf() {
    if (!R.G.flags.got_starter) {
      say(["MARLOWE: I am Professor Marlowe. This is the part where I pretend I don't see you.", "The routes grew teeth. Foil ghosts, packrats, tide things. Very scientific.", "Pick a partner. I will not choose for you. That's the one choice that matters."], function () {
        choice("Who keys to you?", [
          { label: "Hootling", cb: function () { giveStarter("hootling"); } },
          { label: "Nestling", cb: function () { giveStarter("nestling"); } },
          { label: "Ripkit", cb: function () { giveStarter("ripkit"); } },
        ]);
      });
      return;
    }
    if (!R.G.flags.rival_lab) {
      say("MARLOWE: Vex is still in the doorway. Finish the shot. I'll hold the exposition.");
      return;
    }
    say("MARLOWE: The dex fills when you catch. Bring stories, not receipts. Receipts make me faint.");
  }
  function giveStarter(id) {
    var mon = R.createMon(id, 5, { shiny: false });
    R.G.party = [mon];
    R.G.starter = id;
    R.G.flags.got_starter = 1;
    R.G.dexS[id] = 1;
    R.G.dexC[id] = 1;
    say(mon.name + " is keyed to you.", function () {
      say(["VEX shoves the curtain.", "Cute. I took the one that eats yours. Type chart. Look it up, or suffer."], function () {
        startTrainer({
          name: "VEX",
          flag: "rival_lab",
          reward: 40,
          team: [[R.counterStarter(id), 5]],
          win: ["Tch. Enjoy the plaza. I'll be on the trail, practicing this speech."],
        });
      });
    });
  }
  function talkTrainer(n, fromSight) {
    if (n.flag && R.G.flags[n.flag]) {
      var done = n.lines || ["You already took that shot."];
      say(done.map(function (l) { return n.name + ": " + l; }));
      return;
    }
    var intro = n.intro || ["Let's go."];
    say(intro.map(function (l) { return n.name + ": " + l; }), function () {
      startTrainer({
        name: n.name,
        flag: n.flag,
        reward: n.reward || 40,
        badge: n.badge || 0,
        team: n.team ? n.team(R.G) : [["packrat", 4]],
        win: n.win || ["Good shot."],
        kind: n.role === "static" ? "wild" : "trainer",
        catchable: n.role === "static",
      });
    });
  }
  function tryField(x, y, t) {
    if (t === R.T.BRAMBLE) {
      if (!R.G.flags.badge1 || !partyHas("GALE")) {
        say("Bramble. Gust Sweep needs the Ember Crest and a gale raider. I'm a bush with prerequisites.");
        return;
      }
      choice("Gust Sweep the bramble?", [
        { label: "Yes", cb: function () { cutTile(x, y); say("The bramble peels back. Nature hates a well-timed badge."); } },
        { label: "No", cb: function () {} },
      ]);
    } else {
      if (!R.G.flags.badge2 || !partyHas("STONE")) {
        say("A cracked rock. Stone Smash needs the Brine Seal and a stone raider. Geology, but make it a gate.");
        return;
      }
      choice("Stone Smash?", [
        { label: "Yes", cb: function () { cutTile(x, y); say("The rock gives. Don't thank it. It lost."); } },
        { label: "No", cb: function () {} },
      ]);
    }
  }
  function partyHas(type) {
    return R.G.party.some(function (m) { return R.SPECIES[m.sid].types.indexOf(type) >= 0; });
  }
  function cutTile(x, y) {
    R.G.cuts[R.G.map.id + ":" + x + ":" + y] = 1;
    R.sfx("hit");
    R.saveGame();
  }

  function healAll() {
    R.G.party.concat(R.G.box).forEach(function (m) {
      m.status = null;
      R.recompute(m);
      m.hp = m.maxhp;
      m.dispHp = m.hp;
      m.moves.forEach(function (mv) { mv.pp = mv.max; });
    });
  }
  function clearArms() {
    Object.keys(R.G.flags).forEach(function (k) {
      if (k.slice(-4) === "_arm") delete R.G.flags[k];
    });
  }

  function openShop(which) {
    var ids = (R.SHOPS[which] || R.SHOPS.mart).slice();
    if (which === "late" && !R.G.flags.badge2) ids = ids.filter(function (id) { return id !== "vaultball"; });
    R.G.scene = "shop";
    R.G.shop = { ids: ids, i: 0 };
  }
  function updateShop() {
    var s = R.G.shop;
    if (pressDir(1)) s.i = (s.i + s.ids.length - 1) % s.ids.length;
    if (pressDir(0)) s.i = (s.i + 1) % s.ids.length;
    if (pressB() || pressMenu()) { R.G.scene = "overworld"; return; }
    if (pressA()) {
      var id = s.ids[s.i];
      var it = R.ITEMS[id];
      if (R.G.swap < it.price) say("Not enough SWAP. Battles pay. Cash does not. I will die on this small hill.");
      else {
        R.G.swap -= it.price;
        R.G.bag[id] = (R.G.bag[id] || 0) + 1;
        R.sfx("item");
        R.G.toast = { text: it.name, t: 1.2 };
      }
    }
  }

  function ripFromBag() {
    var haveS = R.G.bag.pack > 0;
    var haveC = R.G.bag.chromepack > 0;
    if (!haveS && !haveC) { say("No pack in the bag. The bar sells them for SWAP."); return; }
    if (haveS && haveC) {
      choice("Which rip?", [
        { label: "Rip Pack", cb: function () { startRip("standard"); } },
        { label: "Chrome Pack", cb: function () { startRip("chrome"); } },
        { label: "Cancel", cb: function () {} },
      ]);
    } else startRip(haveC ? "chrome" : "standard");
  }
  function startRip(tier) {
    var key = tier === "chrome" ? "chromepack" : "pack";
    if (!R.G.bag[key]) { say("You don't have that pack."); return; }
    R.G.bag[key]--;
    var cards = [rollFiller(), rollFiller(), rollMain(tier)];
    cards.forEach(applyCard);
    R.G.flags.did_rip = 1;
    R.G.rip = { t: 0, phase: 0, cards: cards, tier: tier };
    R.G.scene = "rip";
    R.sfx("rip");
    R.saveGame();
  }
  function rollFiller() {
    var r = Math.random();
    if (r < 0.5) return { kind: "swap", n: 10 + Math.floor(Math.random() * 20) };
    if (r < 0.8) return { kind: "item", id: "berry", n: 2 };
    return { kind: "item", id: "ripball", n: 2 };
  }
  function rollMain(tier) {
    if (Math.random() < 0.22) {
      return { kind: "item", id: tier === "chrome" ? "chromeball" : "serum", n: tier === "chrome" ? 2 : 1 };
    }
    var pool = tier === "chrome"
      ? [["chromehoot", 16], ["packbloom", 16], ["ripper", 16], ["brineback", 18], ["voltowl", 18], ["spectowl", 22], ["hoardbeast", 24], ["bulkbuyer", 22]]
      : [["foilghost", 4], ["packrat", 4], ["tideling", 5], ["sparkmite", 5], ["shelflick", 5], ["clearout", 5], ["hootling", 5], ["nestling", 5], ["ripkit", 5], ["scalplet", 6]];
    var p = pool[Math.floor(Math.random() * pool.length)];
    return { kind: "mon", id: p[0], lv: p[1] };
  }
  function applyCard(card) {
    if (card.kind === "mon") {
      var mon = R.createMon(card.id, card.lv);
      storeMon(mon);
      R.G.dexS[mon.sid] = 1;
      R.G.dexC[mon.sid] = 1;
      card.label = mon.name + "  Lv " + mon.level + (mon.shiny ? " ★" : "");
    } else if (card.kind === "item") {
      R.G.bag[card.id] = (R.G.bag[card.id] || 0) + card.n;
      card.label = card.n + "× " + R.ITEMS[card.id].name;
    } else {
      R.G.swap += card.n;
      card.label = card.n + " SWAP";
    }
  }
  function storeMon(mon) {
    if (R.G.party.length < 6) R.G.party.push(mon);
    else if (R.G.box.length < 30) R.G.box.push(mon);
    else R.G.swap += mon.level * 4;
  }
  function updateRip(dt) {
    var rip = R.G.rip;
    rip.t += dt;
    var need = rip.phase === 0 ? 0.85 : 0.4;
    if (rip.t > need || pressA()) {
      rip.phase++;
      rip.t = 0;
      R.sfx("tap");
      if (rip.phase > 4) {
        R.G.scene = "overworld";
        say("That's the rip. TAKE YOUR SHOT again when you want — SWAP only. The machine winked.");
      }
    }
  }

  function openPC() {
    R.G.scene = "pc";
    R.G.pc = { side: 0, i: 0 };
    R.G.lastHeal = R.G.lastHeal || { map: R.G.map.id, x: R.G.player.x, y: R.G.player.y };
  }
  function pcList() {
    return R.G.pc.side === 0 ? R.G.party : R.G.box;
  }
  function updatePC() {
    var pc = R.G.pc;
    var list = pcList();
    if (pressDir(2) || pressDir(3)) { pc.side = pc.side ? 0 : 1; pc.i = 0; R.sfx("tap"); }
    if (list.length) {
      if (pressDir(1)) pc.i = (pc.i + list.length - 1) % list.length;
      if (pressDir(0)) pc.i = (pc.i + 1) % list.length;
    }
    if (pressB() || pressMenu()) { R.G.scene = "overworld"; R.saveGame(); return; }
    if (pressA() && list.length) {
      var mon = list[pc.i];
      var side = pc.side;
      choice(mon.name + "  Lv " + mon.level, [
        { label: side === 0 ? "Deposit" : "Withdraw", cb: function () { pcMove(side, pc.i); } },
        { label: "Summary", cb: function () { R.G.ui = { type: "summary", mon: mon, back: "pc" }; R.G.scene = "overworld"; } },
        { label: "Release", cb: function () { pcRelease(side, mon); } },
        { label: "Back", cb: function () {} },
      ]);
    }
  }
  function pcMove(side, index) {
    if (side === 0) {
      if (R.G.party.length <= 1) { say("Your party needs a body."); return; }
      if (R.G.box.length >= 30) { say("The vault box is full."); return; }
      R.G.box.push(R.G.party.splice(index, 1)[0]);
    } else {
      if (R.G.party.length >= 6) { say("Party is six deep."); return; }
      R.G.party.push(R.G.box.splice(index, 1)[0]);
    }
    R.sfx("item");
    R.G.pc.i = 0;
  }
  function pcRelease(side, mon) {
    var list = side === 0 ? R.G.party : R.G.box;
    if (side === 0 && R.G.party.length <= 1) { say("You can't release your last partner."); return; }
    choice("Release " + mon.name + " for " + (mon.level * 3) + " SWAP?", [
      { label: "Release", cb: function () {
        var ix = list.indexOf(mon);
        if (ix >= 0) list.splice(ix, 1);
        R.G.swap += mon.level * 3;
        say(mon.name + " heads out. SWAP comes back.");
      } },
      { label: "Keep", cb: function () {} },
    ]);
  }

  function updateUI() {
    var ui = R.G.ui;
    if (!ui) return;
    if (ui.type === "menu") {
      var items = ["Party", "Bag", "Dex", "Card", "Save", R.G.mute ? "Sound on" : "Sound off", "Close"];
      if (pressDir(1)) ui.i = (ui.i + items.length - 1) % items.length;
      if (pressDir(0)) ui.i = (ui.i + 1) % items.length;
      if (pressB()) { R.G.ui = null; return; }
      if (pressA() || pressMenu()) {
        var pick = items[ui.i];
        if (pick === "Close") R.G.ui = null;
        else if (pick === "Party") R.G.ui = { type: "party", i: 0 };
        else if (pick === "Bag") R.G.ui = { type: "bag", i: 0 };
        else if (pick === "Dex") R.G.ui = { type: "dex", i: 0 };
        else if (pick === "Card") { R.G.ui = null; R.openCard(); }
        else if (pick === "Save") { R.saveGame(); say("Progress saved on this device. The cloud is a rumor. I live in your pocket now."); R.G.ui = null; }
        else { R.G.mute = !R.G.mute; R.G.ui = null; }
      }
      return;
    }
    if (ui.type === "party") return updatePartyUI();
    if (ui.type === "bag") return updateBagUI();
    if (ui.type === "dex") return updateDexUI();
    if (ui.type === "summary") {
      if (pressA() || pressB() || pressMenu()) {
        if (ui.back === "pc") { R.G.scene = "pc"; R.G.ui = null; }
        else R.G.ui = { type: "party", i: 0 };
      }
    }
  }
  function updatePartyUI() {
    var ui = R.G.ui;
    var list = R.G.party;
    if (!list.length) { if (pressA() || pressB()) R.G.ui = null; return; }
    if (pressDir(1)) ui.i = (ui.i + list.length - 1) % list.length;
    if (pressDir(0)) ui.i = (ui.i + 1) % list.length;
    if (pressB() && !ui.forced) {
      R.G.ui = ui.battle ? null : { type: "menu", i: 0 };
      if (ui.battle && R.G.battle) R.G.battle.phase = "command";
      return;
    }
    if (pressA()) {
      var mon = list[ui.i];
      if (ui.item) {
        var msg = applyItem(ui.item, mon);
        R.G.ui = null;
        if (msg === "ok") {
          say("Used " + R.ITEMS[ui.item].name + ".", function () {
            if (ui.battle) foeFreeHit();
          });
        } else say(msg);
        return;
      }
      if (ui.forced || ui.battle) {
        if (mon.hp <= 0) { say("That raider is out."); return; }
        if (ui.i === R.G.battle.playerIndex && !ui.forced) { say("Already in."); return; }
        var prev = R.G.battle.playerIndex;
        R.G.battle.playerIndex = ui.i;
        R.G.battle.stages.p = { atk: 0, def: 0 };
        if (R.G.battle.appeared.indexOf(mon.uid) < 0) R.G.battle.appeared.push(mon.uid);
        var forced = ui.forced;
        R.G.ui = null;
        say("Go, " + mon.name + "!", function () {
          if (!forced && prev !== R.G.battle.playerIndex) foeFreeHit();
          else if (R.G.battle) R.G.battle.phase = "command";
        });
        return;
      }
      if (ui.swapFrom == null) {
        choice(mon.name, [
          { label: "Summary", cb: function () { R.G.ui = { type: "summary", mon: mon }; } },
          { label: "Reorder", cb: function () { R.G.ui = { type: "party", i: ui.i, swapFrom: ui.i }; } },
          { label: "Back", cb: function () { R.G.ui = { type: "party", i: ui.i }; } },
        ]);
      } else {
        var a = R.G.party[ui.swapFrom];
        R.G.party[ui.swapFrom] = R.G.party[ui.i];
        R.G.party[ui.i] = a;
        R.G.ui = { type: "party", i: ui.i };
        R.sfx("tap");
      }
    }
  }
  function bagEntries() {
    return Object.keys(R.G.bag).filter(function (id) { return R.G.bag[id] > 0 && R.ITEMS[id]; });
  }
  function battleItems() {
    return bagEntries().filter(function (id) {
      var it = R.ITEMS[id];
      return it.catch || it.heal || it.cure;
    });
  }
  function updateBagUI() {
    var ui = R.G.ui;
    var list = ui.battle ? battleItems() : bagEntries();
    if (!list.length) { if (pressA() || pressB()) R.G.ui = ui.battle ? null : { type: "menu", i: 1 }; return; }
    if (pressDir(1)) ui.i = (ui.i + list.length - 1) % list.length;
    if (pressDir(0)) ui.i = (ui.i + 1) % list.length;
    if (pressB()) { R.G.ui = ui.battle ? null : { type: "menu", i: 1 }; return; }
    if (pressA()) {
      var id = list[ui.i];
      if (ui.battle) { R.G.ui = null; useBattleItem(id); return; }
      var it = R.ITEMS[id];
      if (it.pack) { R.G.ui = null; startRip(it.pack); return; }
      if (it.charm) {
        R.G.bag[id]--;
        R.G.charm = it.charm;
        R.G.ui = null;
        say("The tall grass goes quiet for a while.");
        return;
      }
      if (it.heal || it.cure) { R.G.ui = { type: "party", i: 0, item: id }; return; }
      say(it.desc || it.name);
    }
  }
  function updateDexUI() {
    var ui = R.G.ui;
    var n = R.DEX_ORDER.length;
    if (pressDir(1)) ui.i = (ui.i + n - 1) % n;
    if (pressDir(0)) ui.i = (ui.i + 1) % n;
    if (pressB()) { R.G.ui = { type: "menu", i: 2 }; return; }
    if (pressA()) {
      var id = R.DEX_ORDER[ui.i];
      if (!R.G.dexS[id]) return;
      var sp = R.SPECIES[id];
      var own = R.G.dexC[id] ? "Caught. " : "Seen. ";
      say(sp.name + "  " + sp.types.join("/") + ". " + own + sp.blurb);
    }
  }

  function applyItem(id, mon) {
    var it = R.ITEMS[id];
    if (!R.G.bag[id]) return "You don't have that.";
    if (it.heal) {
      if (mon.hp <= 0) return "That raider is out. Berries don't revive.";
      if (mon.hp >= mon.maxhp) return "HP is already full.";
      R.G.bag[id]--;
      mon.hp = Math.min(mon.maxhp, mon.hp + it.heal);
      R.sfx("item");
      return "ok";
    }
    if (it.cure) {
      if (!mon.status) return "No status to clear.";
      R.G.bag[id]--;
      mon.status = null;
      R.sfx("item");
      return "ok";
    }
    return "Can't use that here.";
  }

  /* ---------- battles ---------- */
  function startWildMon(mon) {
    startBattle({
      kind: "wild",
      foes: [mon],
      name: mon.name,
      reward: 8 + mon.level * 2,
      win: [],
      catchable: true,
    });
  }
  function startTrainer(opts) {
    var foes = (opts.team || []).map(function (row) { return R.createMon(row[0], row[1], { shiny: false }); });
    startBattle({
      kind: opts.kind || "trainer",
      foes: foes,
      name: opts.name,
      flag: opts.flag,
      reward: opts.reward,
      badge: opts.badge,
      win: opts.win,
      catchable: !!opts.catchable,
    });
  }
  function startBattle(opts) {
    var g = R.G;
    g.scene = "battle";
    g.ui = null;
    g.busy = null;
    var pi = firstAlive();
    g.battle = {
      kind: opts.kind,
      foes: opts.foes,
      foeIndex: 0,
      playerIndex: pi,
      name: opts.name || "",
      flag: opts.flag || null,
      reward: opts.reward || 0,
      badge: opts.badge || 0,
      win: opts.win || [],
      catchable: opts.kind === "wild" || opts.catchable,
      phase: "command",
      cmd: 0,
      moveI: 0,
      itemI: 0,
      submenu: null,
      appeared: [g.party[pi].uid],
      stages: { p: { atk: 0, def: 0 }, f: { atk: 0, def: 0 } },
      weather: g.map && g.map.outdoor ? g.weather : "clear",
      fx: null,
    };
    opts.foes.forEach(function (m) { g.dexS[m.sid] = 1; m.dispHp = m.hp; });
    g.party.forEach(function (m) { if (m.dispHp == null) m.dispHp = m.hp; });
    var lead = opts.foes[0];
    var line = opts.kind === "wild" ? "A wild " + lead.name + " showed up!" : opts.name + " sent out " + lead.name + "!";
    say(line);
    R.sfx("start");
  }
  function curMon() { return R.G.party[R.G.battle.playerIndex]; }
  function curFoe() { return R.G.battle.foes[R.G.battle.foeIndex]; }
  function firstAlive() {
    for (var i = 0; i < R.G.party.length; i++) if (R.G.party[i].hp > 0) return i;
    return 0;
  }
  function updateBattle() {
    var b = R.G.battle;
    if (!b || b.phase !== "command") return;
    if (!b.submenu) {
      if (pressDir(1)) b.cmd = (b.cmd + 3) % 4;
      if (pressDir(0)) b.cmd = (b.cmd + 1) % 4;
      if (pressDir(2)) b.cmd = (b.cmd + 3) % 4;
      if (pressDir(3)) b.cmd = (b.cmd + 1) % 4;
      if (pressA()) {
        if (b.cmd === 0) { b.submenu = "fight"; b.moveI = 0; }
        else if (b.cmd === 1) { b.submenu = "bag"; b.itemI = 0; }
        else if (b.cmd === 2) R.G.ui = { type: "party", i: 0, battle: true };
        else tryRun();
      }
      return;
    }
    if (b.submenu === "fight") {
      var moves = curMon().moves;
      if (pressDir(1)) b.moveI = (b.moveI + moves.length - 1) % moves.length;
      if (pressDir(0)) b.moveI = (b.moveI + 1) % moves.length;
      if (pressB()) { b.submenu = null; return; }
      if (pressA()) {
        var sl = moves[b.moveI];
        if (sl.pp <= 0) say("No PP left for that.");
        else { b.submenu = null; b.phase = "go"; doTurn(sl); }
      }
    } else if (b.submenu === "bag") {
      var items = battleItems();
      if (!items.length) { if (pressA() || pressB()) b.submenu = null; return; }
      if (pressDir(1)) b.itemI = (b.itemI + items.length - 1) % items.length;
      if (pressDir(0)) b.itemI = (b.itemI + 1) % items.length;
      if (pressB()) { b.submenu = null; return; }
      if (pressA()) useBattleItem(items[b.itemI]);
    }
  }
  function useBattleItem(id) {
    var it = R.ITEMS[id];
    var b = R.G.battle;
    if (it.catch) {
      if (!b.catchable) { say("You don't rip a trainer's partner."); return; }
      R.G.bag[id]--;
      b.submenu = null;
      startCatch(it.catch);
      return;
    }
    b.submenu = null;
    R.G.ui = { type: "party", i: 0, battle: true, item: id };
  }
  function tryRun() {
    var b = R.G.battle;
    if (b.kind !== "wild") { say("You can't walk out on a trainer."); return; }
    var ps = R.stats(curMon()).spd;
    var fs = R.stats(curFoe()).spd;
    if (Math.random() < 0.45 + Math.max(-0.2, Math.min(0.4, (ps - fs) / 200))) {
      var bonus = 0;
      b.phase = "go";
      say("Got away clean.", function () { endBattleScene(false, true); });
    } else {
      say("Couldn't get out!", function () { foeFreeHit(); });
    }
  }
  function doTurn(slot) {
    var player = curMon();
    var foe = curFoe();
    var foeSlot = R.aiChoose(foe, player);
    var sp = R.stats(player).spd * (player.status === "SOAK" ? 0.65 : 1);
    var sf = R.stats(foe).spd * (foe.status === "SOAK" ? 0.65 : 1);
    var order = sp >= sf ? ["p", "f"] : ["f", "p"];
    var i = 0;
    function step() {
      if (!R.G.battle) return;
      if (i >= order.length) return endRound();
      var who = order[i++];
      if (who === "p" && curMon().hp <= 0) return step();
      if (who === "f" && curFoe().hp <= 0) return step();
      var actor = who === "p" ? curMon() : curFoe();
      var other = who === "p" ? curFoe() : curMon();
      var sl = who === "p" ? slot : foeSlot;
      perform(actor, other, sl, who, step);
    }
    step();
  }
  function perform(actor, other, slot, who, done) {
    if (actor.status === "DAZE" && Math.random() < 0.25) { say(actor.name + " is dazed!", done); return; }
    if (actor.status === "HEX" && Math.random() < 0.3) { say(actor.name + " lost the shine!", done); return; }
    if (!slot) {
      var chip = Math.max(1, Math.floor(other.maxhp * 0.08));
      other.hp = Math.max(0, other.hp - chip);
      R.G.shake = 4;
      say(actor.name + " struggled!", function () { afterHit(other, who === "p" ? "f" : "p", done); });
      return;
    }
    var mv = R.MOVES[slot.id];
    slot.pp = Math.max(0, slot.pp - 1);
    R.G.battle.flash = who;
    say(actor.name + " used " + mv.name + "!", function () {
      if (Math.random() * 100 > mv.acc) { say("It missed!", done); return; }
      if (mv.effect === "heal") {
        actor.hp = Math.min(actor.maxhp, actor.hp + Math.floor(actor.maxhp * 0.42));
        say(actor.name + " knit back together.", done);
        return;
      }
      if (!mv.power) { applyEffect(actor, other, mv, who, done); return; }
      var res = R.calcDamage(actor, other, mv, R.G.battle.stages[who], R.G.battle.stages[who === "p" ? "f" : "p"], R.G.battle.weather);
      other.hp = Math.max(0, other.hp - res.dmg);
      R.G.shake = res.mult >= 1.5 ? 9 : 4;
      R.sfx(res.mult >= 1.5 ? "super" : "hit");
      burst(who === "p");
      var bits = [];
      if (res.crit) bits.push("Critical hit.");
      var eff = R.effText(res.mult);
      if (eff) bits.push(eff);
      if (bits.length) say(bits.join(" "), function () { afterHit(other, who === "p" ? "f" : "p", done); });
      else afterHit(other, who === "p" ? "f" : "p", done);
    });
  }
  function applyEffect(actor, other, mv, who, done) {
    var foeSide = who === "p" ? "f" : "p";
    if (mv.effect === "burn" || mv.effect === "daze" || mv.effect === "hex" || mv.effect === "soak") {
      var map = { burn: "BURN", daze: "DAZE", hex: "HEX", soak: "SOAK" };
      if (other.status) { say("It didn't stick.", done); return; }
      other.status = map[mv.effect];
      say(other.name + " is " + other.status.toLowerCase() + "!", done);
      return;
    }
    if (mv.effect === "atk-") {
      R.G.battle.stages[foeSide].atk = Math.max(-4, R.G.battle.stages[foeSide].atk - 1);
      say(other.name + "'s attack fell.", done);
      return;
    }
    if (mv.effect === "atk+") {
      R.G.battle.stages[who].atk = Math.min(4, R.G.battle.stages[who].atk + 1);
      say(actor.name + " sharpened up.", done);
      return;
    }
    done();
  }
  function afterHit(mon, side, done) {
    if (mon.hp > 0) return done();
    R.sfx("faint");
    say(mon.name + " fainted!", function () {
      if (side === "f") onFoeDown();
      else onPlayerDown();
    });
  }
  function onFoeDown() {
    var b = R.G.battle;
    var fallen = b.foes[b.foeIndex];
    grantExp(fallen, function () {
      if (!R.G.battle) return;
      b.foeIndex++;
      if (b.foeIndex >= b.foes.length) {
        if (b.kind === "wild") endWild(b.reward);
        else endTrainer();
        return;
      }
      b.stages.f = { atk: 0, def: 0 };
      var next = curFoe();
      R.G.dexS[next.sid] = 1;
      say(b.name + " sent out " + next.name + "!", function () { if (R.G.battle) R.G.battle.phase = "command"; });
    });
  }
  function onPlayerDown() {
    if (R.G.party.every(function (m) { return m.hp <= 0; })) { blackout(); return; }
    say("Choose the next raider.", function () {
      R.G.ui = { type: "party", i: 0, battle: true, forced: true };
    });
  }
  function endRound() {
    statusTick(curMon(), function (alive) {
      if (!R.G.battle) return;
      if (!alive) return;
      statusTick(curFoe(), function (alive2) {
        if (!R.G.battle) return;
        if (!alive2) return;
        R.G.battle.phase = "command";
      });
    });
  }
  function statusTick(mon, cb) {
    if (!mon || mon.hp <= 0 || mon.status !== "BURN") return cb(true);
    var dmg = Math.max(1, Math.floor(mon.maxhp / 8));
    mon.hp = Math.max(0, mon.hp - dmg);
    say(mon.name + " is singed by foil-burn!", function () {
      if (mon.hp <= 0) {
        R.sfx("faint");
        say(mon.name + " fainted!", function () {
          if (mon === curFoe()) onFoeDown();
          else onPlayerDown();
          cb(false);
        });
      } else cb(true);
    });
  }
  function foeFreeHit() {
    if (!R.G.battle) return;
    var foe = curFoe();
    if (!foe || foe.hp <= 0) { R.G.battle.phase = "command"; return; }
    var slot = R.aiChoose(foe, curMon());
    R.G.battle.phase = "go";
    perform(foe, curMon(), slot, "f", function () { if (R.G.battle) R.G.battle.phase = "command"; });
  }
  function startCatch(ball) {
    var foe = curFoe();
    var p = R.catchChance(foe, ball);
    R.G.battle.phase = "catch";
    R.G.battle.fx = { t: 0, dur: 1.7, p: p, success: Math.random() < p };
    R.sfx("catch");
  }
  function resolveCatch() {
    var fx = R.G.battle.fx;
    R.G.battle.fx = null;
    if (!fx.success) {
      R.sfx("break");
      say("Broke free!", function () { foeFreeHit(); });
      return;
    }
    var foe = curFoe();
    R.G.dexC[foe.sid] = 1;
    storeMon(foe);
    var where = R.G.party.indexOf(foe) >= 0 ? "party" : "Vault box";
    say(foe.name + " is keyed to you! (" + where + ")", function () {
      var amount = Math.floor(R.SPECIES[foe.sid].exp * foe.level / 10) + 6;
      var mon = curMon();
      if (mon && mon.hp > 0) giveExp(mon, amount, function () { endWild(6 + foe.level); });
      else endWild(6 + foe.level);
    });
  }
  function grantExp(foe, cb) {
    var amount = Math.floor(R.SPECIES[foe.sid].exp * foe.level / 6) + 10;
    var ids = R.G.battle.appeared.slice();
    var i = 0;
    function next() {
      if (!R.G.battle) return;
      if (i >= ids.length) return cb();
      var uid = ids[i++];
      var mon = null;
      for (var k = 0; k < R.G.party.length; k++) if (R.G.party[k].uid === uid) mon = R.G.party[k];
      if (!mon || mon.hp <= 0) return next();
      giveExp(mon, amount, next);
    }
    next();
  }
  function giveExp(mon, amount, cb) {
    mon.exp += amount;
    say(mon.name + " gained " + amount + " EXP.", function () { levelLoop(mon, cb); });
  }
  function levelLoop(mon, cb) {
    if (mon.level >= 70 || mon.exp < R.expFor(mon.level + 1)) return cb();
    mon.level++;
    var before = mon.maxhp;
    R.recompute(mon);
    mon.hp = Math.min(mon.maxhp, mon.hp + (mon.maxhp - before));
    R.sfx("level");
    say(mon.name + " grew to level " + mon.level + "!", function () {
      learnAt(mon, function () { tryEvo(mon, function () { levelLoop(mon, cb); }); });
    });
  }
  function learnAt(mon, cb) {
    var rows = R.SPECIES[mon.sid].learn.filter(function (r) { return r[0] === mon.level; });
    var i = 0;
    function next() {
      if (i >= rows.length) return cb();
      var id = rows[i++][1];
      if (mon.moves.some(function (m) { return m.id === id; })) return next();
      if (mon.moves.length < 4) {
        mon.moves.push({ id: id, pp: R.MOVES[id].pp, max: R.MOVES[id].pp });
        say(mon.name + " learned " + R.MOVES[id].name + "!", next);
      } else {
        var opts = mon.moves.map(function (m, idx) {
          return { label: "Forget " + R.MOVES[m.id].name, cb: function () {
            mon.moves[idx] = { id: id, pp: R.MOVES[id].pp, max: R.MOVES[id].pp };
            say("Learned " + R.MOVES[id].name + ".", next);
          } };
        });
        opts.push({ label: "Skip " + R.MOVES[id].name, cb: next });
        choice(mon.name + " wants " + R.MOVES[id].name + ".", opts);
      }
    }
    next();
  }
  function tryEvo(mon, cb) {
    var evo = R.SPECIES[mon.sid].evo;
    if (!evo || mon.level < evo[0]) return cb();
    R.G.evo = { mon: mon, into: evo[1], t: 0, cb: cb };
    R.G.scene = "evo";
  }
  function updateEvo(dt) {
    var e = R.G.evo;
    if (!e) return;
    e.t += dt;
    if (e.t > 2.3 || (e.t > 0.4 && pressA())) {
      var mon = e.mon;
      var prevName = mon.name;
      var speciesName = R.SPECIES[mon.sid].name;
      mon.sid = e.into;
      if (prevName === speciesName) mon.name = R.SPECIES[mon.sid].name;
      R.recompute(mon);
      mon.hp = mon.maxhp;
      R.sfx("evo");
      var cb = e.cb;
      R.G.evo = null;
      R.G.scene = R.G.battle ? "battle" : "overworld";
      say(prevName + " evolved into " + R.SPECIES[mon.sid].name + "!", function () {
        learnAt(mon, cb);
      });
    }
  }
  function endWild(bonus) {
    var b = R.G.battle;
    if (b && b.flag) R.G.flags[b.flag] = 1;
    R.G.swap += bonus || 0;
    R.G.battle = null;
    R.G.ui = null;
    R.G.scene = "overworld";
    say("Picked up " + (bonus || 0) + " SWAP.");
    R.saveGame();
  }
  function endTrainer() {
    var b = R.G.battle;
    if (b.flag) R.G.flags[b.flag] = 1;
    if (b.badge) {
      R.G.badges[b.badge - 1] = 1;
      R.G.flags["badge" + b.badge] = 1;
    }
    R.G.swap += b.reward || 0;
    var lines = (b.win || []).map(function (l) { return b.name + ": " + l; });
    lines.push("Received " + (b.reward || 0) + " SWAP.");
    if (b.badge) lines.push(R.BADGE_NAMES[b.badge - 1] + " earned.");
    if (b.badge === 3) lines.push("The region stays open. Fill the dex.");
    R.G.battle = null;
    R.G.ui = null;
    R.G.scene = "overworld";
    say(lines);
    R.saveGame();
  }
  function endBattleScene() {
    R.G.battle = null;
    R.G.ui = null;
    R.G.scene = "overworld";
    R.saveGame();
  }
  function blackout() {
    clearArms();
    var loss = Math.min(R.G.swap, Math.max(0, Math.floor(R.G.swap * 0.08)));
    R.G.swap -= loss;
    healAll();
    R.G.battle = null;
    R.G.ui = null;
    R.G.scene = "overworld";
    var h = R.G.lastHeal || { map: "player_house", x: 7, y: 7 };
    R.setMap(h.map, h.x, h.y);
    say("You dropped " + loss + " SWAP in the scuffle and woke up patched. TAKE YOUR SHOT again. The fade did its best.");
  }

  function tickHp(dt) {
    var list = R.G.party.concat(R.G.box);
    if (R.G.battle) list = list.concat(R.G.battle.foes);
    list.forEach(function (m) {
      if (!m) return;
      if (m.dispHp == null) m.dispHp = m.hp;
      var d = m.hp - m.dispHp;
      if (Math.abs(d) < 0.25) m.dispHp = m.hp;
      else m.dispHp += d * Math.min(1, dt * 7);
    });
  }
  function tickParts(dt) {
    R.G.particles = R.G.particles.filter(function (p) {
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return p.t > 0;
    });
  }
  function burst(atFoe) {
    var w = c.width, h = c.height;
    var x = atFoe ? w * 0.7 : w * 0.3;
    var y = atFoe ? h * 0.3 : h * 0.58;
    for (var i = 0; i < 12; i++) {
      R.G.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220,
        t: 0.35 + Math.random() * 0.2,
        color: Math.random() < 0.5 ? "#e8c547" : "#f4efe2",
      });
    }
  }

  /* ---------- render ---------- */
  function render() {
    if (!ctx) return;
    var w = c.width, h = c.height;
    ctx.imageSmoothingEnabled = true;
    ctx.save();
    if (R.G.shake > 0) ctx.translate((Math.random() - 0.5) * R.G.shake, (Math.random() - 0.5) * R.G.shake);
    ctx.fillStyle = "#07080c";
    ctx.fillRect(-8, -8, w + 16, h + 16);
    if (R.G.scene === "title") drawTitle();
    else if (R.G.scene === "name") drawName();
    else if (R.G.scene === "intro") drawIntro();
    else if (R.G.scene === "battle") drawBattle();
    else if (R.G.scene === "shop") { drawWorld(); drawShop(); }
    else if (R.G.scene === "pc") { drawWorld(); drawPC(); }
    else if (R.G.scene === "rip") drawRip();
    else if (R.G.scene === "evo" && R.G.battle) { drawBattle(); drawEvo(); }
    else if (R.G.scene === "evo") { drawWorld(); drawEvo(); }
    else if (R.G.map) drawWorld();
    if (R.G.scene === "overworld" || R.G.scene === "battle") drawUI();
    if (R.G.toast && R.G.scene !== "title") drawToast();
    if (R.G.dialog) drawDialog();
    if (R.G.fade) {
      var a = R.G.fade.t < 0.28 ? R.G.fade.t / 0.28 : 1 - (R.G.fade.t - 0.28) / 0.28;
      ctx.fillStyle = "rgba(0,0,0," + Math.max(0, Math.min(1, a)) + ")";
      ctx.fillRect(0, 0, w, h);
    }
    R.G.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.t * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.globalAlpha = 1;
    });
    if (R.G.error) {
      ctx.fillStyle = "#ffb4b4";
      ctx.font = "16px sans-serif";
      ctx.fillText(R.G.error.slice(0, 80), 16, 24);
    }
    ctx.restore();
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = "rgba(10,10,12,0.92)";
    round(x, y, w, h, 14);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#e8c547";
    round(x, y, w, h, 14);
    ctx.stroke();
  }
  function round(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }
  function text(str, x, y, size, color, bold) {
    ctx.fillStyle = color || "#f4efe2";
    ctx.font = (bold ? "700 " : "500 ") + size + "px Palatino, Georgia, Liberation Serif, serif";
    ctx.fillText(str, x, y);
  }
  function wrap(str, x, y, max, size, color) {
    ctx.fillStyle = color || "#f4efe2";
    ctx.font = "600 " + size + "px Palatino, Georgia, Liberation Serif, serif";
    var words = String(str).split(" ");
    var line = "";
    var yy = y;
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(t).width > max && line) {
        ctx.fillText(line, x, yy);
        line = words[i];
        yy += size + 6;
      } else line = t;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy;
  }

  function drawTitle() {
    var w = c.width, h = c.height;
    ctx.fillStyle = "#07080c";
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? "#1a160e" : "#100e0c";
      ctx.fillRect(0, i * (h / 18), w, h / 18);
    }
    var owl = R.art.mon("aureowl", 0);
    ctx.drawImage(owl, w / 2 - 84, 0, 168, 168);
    ctx.textAlign = "center";
    text("ohhRIPZ", w / 2, 196, 16, "#e8c547", true);
    text("RIPZ RAIDERS", w / 2, 244, 46, "#f4efe2", true);
    text("TAKE YOUR SHOT!", w / 2, 280, 18, "#e8c547", true);
    ctx.textAlign = "left";
    var items = ["NEW GAME", R.hasSave() ? "CONTINUE" : "CONTINUE — empty", R.G.mute ? "SOUND OFF" : "SOUND ON"];
    items.forEach(function (label, i) {
      var y = 348 + i * 48;
      if (R.G.titleI === i) {
        ctx.fillStyle = "#e8c547";
        round(w / 2 - 200, y - 32, 400, 44, 12);
        ctx.fill();
      }
      ctx.textAlign = "center";
      text(label, w / 2, y, 22, R.G.titleI === i ? "#141004" : "#f4efe2", true);
      ctx.textAlign = "left";
    });
    ctx.textAlign = "center";
    text(window.RIPZ_MODE === "kiosk" ? "KIOSK" : "PUBLIC WEB", w / 2, h - 36, 14, "#b7b09a");
    text("Arrows move   A confirm   B back   SWAP ≠ cash", w / 2, h - 14, 13, "#8a8270");
    ctx.textAlign = "left";
  }

  function drawName() {
    var w = c.width, h = c.height;
    ctx.fillStyle = "#07080c";
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    text(R.G.rename ? "OWLIE CARD" : "NAME YOUR OWLIE", w / 2, 70, 28, "#e8c547", true);
    text(R.G.nameBuf || "—", w / 2, 130, 40, "#f4efe2", true);
    ctx.textAlign = "left";
    var cols = 10;
    for (var i = 0; i < KEYS.length; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = w / 2 - 220 + col * 44;
      var y = 200 + row * 54;
      var ch = KEYS[i];
      if (i === R.G.nameI) {
        ctx.fillStyle = "#e8c547";
        round(x - 8, y - 28, ch.length > 1 ? 64 : 40, 40, 8);
        ctx.fill();
      }
      text(ch, x, y, 20, i === R.G.nameI ? "#141004" : "#f4efe2", true);
    }
    ctx.textAlign = "center";
    text("Highlight OK and press A", w / 2, h - 40, 16, "#b7b09a");
    ctx.textAlign = "left";
  }

  function drawIntro() {
    ctx.fillStyle = "#07080c";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.textAlign = "center";
    text("RIPZ RAIDERS", c.width / 2, c.height * 0.28, 28, "#e8c547", true);
    wrap(INTRO[Math.min(R.G.introI, INTRO.length - 1)], c.width / 2 - 260, c.height * 0.45, 520, 26, "#f4efe2");
    text("A", c.width / 2, c.height * 0.78, 16, "#e8c547");
    ctx.textAlign = "left";
  }

  function visualPlayer() {
    var p = R.G.player;
    if (!p.moving) return { x: p.x, y: p.y };
    var e = p.mt < 0.5 ? 2 * p.mt * p.mt : 1 - Math.pow(-2 * p.mt + 2, 2) / 2;
    return { x: p.fromX + (p.x - p.fromX) * e, y: p.fromY + (p.y - p.fromY) * e };
  }

  function drawWorld() {
    var m = R.G.map;
    if (!m) return;
    var cols = c.width / TILE;
    var rows = c.height / TILE;
    var vis = visualPlayer();
    var camX = vis.x - cols / 2 + 0.5;
    var camY = vis.y - rows / 2 + 0.5;
    camX = Math.max(0, Math.min(camX, Math.max(0, m.w - cols)));
    camY = Math.max(0, Math.min(camY, Math.max(0, m.h - rows)));
    if (m.w < cols) camX = (m.w - cols) / 2;
    if (m.h < rows) camY = (m.h - rows) / 2;
    var x0 = Math.floor(camX), y0 = Math.floor(camY);
    var x1 = Math.ceil(camX + cols), y1 = Math.ceil(camY + rows);
    var frame = Math.floor(R.G.time * 4) % 4;
    var tall = {};
    [R.T.TREE, R.T.WALL, R.T.ROOF, R.T.FENCE, R.T.ROCK, R.T.SIGN, R.T.LAMP, R.T.BRAMBLE, R.T.DOOR, R.T.WINDOW, R.T.COUNTER].forEach(function (id) { tall[id] = 1; });
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        var id = tileAt(x, y);
        if (tall[id]) continue;
        var img = R.art.tile(id, (x * 3 + y * 5) % 3, frame);
        ctx.drawImage(img, Math.round((x - camX) * TILE), Math.round((y - camY) * TILE), TILE, TILE);
      }
    }
    (m.items || []).forEach(function (it) {
      if (R.G.flags[it.flag]) return;
      var sx = Math.round((it.x - camX) * TILE) + 14;
      var sy = Math.round((it.y - camY) * TILE) + 12;
      var ball = R.art.ball && R.art.ball();
      if (ball) ctx.drawImage(ball, sx, sy, 36, 36);
      else {
        ctx.fillStyle = "#1a1a1e";
        ctx.fillRect(sx, sy, 28, 28);
        ctx.fillStyle = "#e8c547";
        ctx.fillRect(sx + 4, sy + 4, 20, 20);
      }
    });
    var ents = [];
    activeNpcs().forEach(function (n) {
      ents.push({ y: n.y, draw: function () {
        var spr = R.art.trainer(n.kind || "owlie", n.dir || 0, Math.floor(R.G.time * 3) % 4);
        var dw = 78, dh = 78;
        var sx = Math.round((n.x - camX) * TILE) + (TILE - dw) / 2;
        var sy = Math.round((n.y - camY) * TILE) + TILE - dh + 14;
        ctx.drawImage(spr, sx, sy, dw, dh);
      } });
    });
    ents.push({ y: vis.y, draw: function () {
      var fr = R.G.player.moving ? Math.floor(R.G.time * 8) % 4 : 0;
      var spr = R.art.trainer("owlie", R.G.player.dir, fr);
      var dw = 84, dh = 84;
      var sx = Math.round((vis.x - camX) * TILE) + (TILE - dw) / 2;
      var sy = Math.round((vis.y - camY) * TILE) + TILE - dh + 16;
      ctx.drawImage(spr, sx, sy, dw, dh);
    } });
    ents.sort(function (a, b) { return a.y - b.y; });
    var ei = 0;
    for (var ry = y0; ry <= y1; ry++) {
      while (ei < ents.length && ents[ei].y < ry + 0.55) ents[ei++].draw();
      for (var rx = x0; rx <= x1; rx++) {
        if (rx < 0 || ry < 0 || rx >= m.w || ry >= m.h) continue;
        var tid = tileAt(rx, ry);
        if (!tall[tid]) continue;
        var timg = R.art.tile(tid, (rx * 3 + ry * 5) % 3, frame);
        ctx.drawImage(timg, Math.round((rx - camX) * TILE), Math.round((ry - camY) * TILE), TILE, TILE);
      }
    }
    while (ei < ents.length) ents[ei++].draw();
    if (m.outdoor) {
      var hour = R.G.hour;
      var alpha = 0;
      if (hour >= 20 || hour < 5) alpha = 0.5;
      else if (hour >= 17) alpha = ((hour - 17) / 3) * 0.42;
      else if (hour < 7) alpha = ((7 - hour) / 2) * 0.35;
      if (m.nightBias) alpha = Math.min(0.62, alpha + 0.18);
      if (alpha > 0) {
        ctx.fillStyle = "rgba(8,12,32," + alpha + ")";
        ctx.fillRect(0, 0, c.width, c.height);
      }
      if (R.G.weather === "rain") {
        ctx.strokeStyle = "rgba(180,210,255,0.45)";
        ctx.lineWidth = 2;
        var shift = (R.G.time * 380) % 40;
        for (var i = 0; i < 40; i++) {
          var rx = (i * 57 + shift) % c.width;
          var ry = (i * 93 + shift * 2) % c.height;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 16);
          ctx.stroke();
        }
      } else if (R.G.weather === "wind") {
        ctx.fillStyle = "rgba(232,197,71,0.35)";
        var ws = (R.G.time * 80) % c.width;
        for (var k = 0; k < 8; k++) ctx.fillRect((ws + k * 120) % c.width, 40 + k * 30, 10, 3);
      }
    }
    drawHud();
    if (R.G.busy) {
      ctx.textAlign = "center";
      text("!", c.width / 2, 80, 40, "#e8c547", true);
      ctx.textAlign = "left";
    }
  }

  function drawHud() {
    var q = null;
    var quests = R.QUESTS(R.G);
    for (var i = 0; i < quests.length; i++) if (!quests[i].done) { q = quests[i]; break; }
    panel(10, 10, 280, q ? 78 : 58);
    text(R.G.name, 22, 34, 16, "#f4efe2", true);
    var badges = "";
    for (var b = 0; b < 3; b++) badges += R.G.badges[b] ? "●" : "○";
    text(badges, 150, 34, 16, "#e8c547", true);
    var hh = Math.floor(R.G.hour);
    var mm = Math.floor((R.G.hour - hh) * 60);
    text("SWAP " + R.G.swap + "   " + (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm, 22, 56, 14, "#e8c547");
    if (q) text(q.text, 22, 76, 13, "#f4efe2");
    if (R.G.map) {
      ctx.textAlign = "right";
      text(R.G.map.name.toUpperCase(), c.width - 16, 32, 16, "#f4efe2", true);
      if (R.G.weather !== "clear" && R.G.map.outdoor) text(R.G.weather.toUpperCase(), c.width - 16, 52, 13, "#b7b09a");
      if (R.G.charm > 0) text("QUIET " + R.G.charm, c.width - 16, 70, 13, "#79c7d4");
      ctx.textAlign = "left";
    }
  }

  function drawBattle() {
    var w = c.width, h = c.height;
    var b = R.G.battle;
    if (!b) return;
    var bg = R.art.arena && R.art.arena();
    if (bg) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#10141c";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = b.weather === "rain" ? "#16324a" : "#1a2430";
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.3, w * 0.18, 28, 0, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#e8c547";
      ctx.stroke();
      ctx.fillStyle = "#243028";
      ctx.beginPath();
      ctx.ellipse(w * 0.3, h * 0.58, w * 0.2, 32, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
    var foe = curFoe();
    var mon = curMon();
    if (foe) {
      var fr = R.G.shake > 2 && b.flash === "p" ? 5 : Math.floor(R.G.time * 3) % 2;
      var img = R.art.mon(foe.sid, fr);
      var fs = 200;
      ctx.drawImage(img, w * 0.64 - fs / 2, h * 0.40 - fs * 0.35, fs, fs);
      if (foe.shiny) ring(w * 0.58, h * 0.18);
    }
    if (mon) {
      var fr2 = R.G.shake > 2 && b.flash === "f" ? 5 : Math.floor(R.G.time * 3) % 2;
      var ps = 230;
      ctx.drawImage(R.art.mon(mon.sid, fr2), w * 0.28 - ps / 2, h * 0.60 - ps * 0.38, ps, ps);
      if (mon.shiny) ring(w * 0.30, h * 0.48);
    }
    if (b.fx && b.phase === "catch") drawBall(w * 0.58, h * 0.28, b.fx.t);
    if (foe) infoBox(16, 16, foe, true);
    if (mon) infoBox(w - 300, h * 0.46, mon, false);
    if (!R.G.dialog && b.phase === "command") drawCommands();
    if (b.weather === "rain") {
      ctx.fillStyle = "rgba(80,140,200,0.08)";
      ctx.fillRect(0, 0, w, h);
    }
  }
  function ring(x, y) {
    ctx.strokeStyle = "#e8c547";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 54, 0, 7);
    ctx.stroke();
  }
  function drawBall(x, y, t) {
    var hop = Math.abs(Math.sin(t * 10)) * 30;
    var ball = R.art.ball && R.art.ball();
    if (ball) {
      ctx.drawImage(ball, x - 22, y - hop - 22, 44, 44);
      return;
    }
    ctx.fillStyle = "#1a1a1e";
    ctx.beginPath();
    ctx.arc(x, y - hop, 16, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#e8c547";
    ctx.beginPath();
    ctx.arc(x, y - hop, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#f4efe2";
    ctx.beginPath();
    ctx.arc(x, y - hop, 5, 0, 7);
    ctx.fill();
  }
  function infoBox(x, y, mon, foe) {
    panel(x, y, 280, 86);
    text(mon.name + (mon.shiny ? " ★" : ""), x + 14, y + 26, 18, "#f4efe2", true);
    text("Lv " + mon.level, x + 200, y + 26, 16, "#e8c547", true);
    var ratio = Math.max(0, (mon.dispHp != null ? mon.dispHp : mon.hp) / mon.maxhp);
    var col = ratio > 0.5 ? "#3eae5a" : ratio > 0.2 ? "#e8c547" : "#e85d4c";
    ctx.fillStyle = "#1a1a1e";
    ctx.fillRect(x + 14, y + 40, 250, 12);
    ctx.fillStyle = col;
    ctx.fillRect(x + 14, y + 40, Math.floor(250 * ratio), 12);
    ctx.strokeStyle = "#e8c547";
    ctx.strokeRect(x + 14, y + 40, 250, 12);
    var label = mon.status ? mon.status : Math.ceil(mon.hp) + "/" + mon.maxhp;
    text(label, x + 14, y + 74, 14, "#f4efe2");
    if (!foe) {
      var types = R.SPECIES[mon.sid].types.join(" · ");
      text(types, x + 140, y + 74, 13, "#b7b09a");
    }
  }
  function drawCommands() {
    var b = R.G.battle;
    var w = c.width, h = c.height;
    var labels = ["FIGHT", "BAG", "PARTY", "RUN"];
    if (!b.submenu) {
      panel(w - 250, h - 210, 230, 190);
      labels.forEach(function (lb, i) {
        var on = b.cmd === i;
        if (on) { ctx.fillStyle = "#e8c547"; round(w - 236, h - 196 + i * 44, 200, 36, 8); ctx.fill(); }
        text(lb, w - 220, h - 170 + i * 44, 20, on ? "#141004" : "#f4efe2", true);
      });
    } else if (b.submenu === "fight") {
      panel(16, h - 220, w - 32, 200);
      curMon().moves.forEach(function (sl, i) {
        var mv = R.MOVES[sl.id];
        var on = b.moveI === i;
        var y = h - 190 + i * 44;
        if (on) { ctx.fillStyle = "#e8c547"; round(28, y - 24, w - 56, 38, 8); ctx.fill(); }
        text(mv.name, 40, y, 18, on ? "#141004" : "#f4efe2", true);
        text(mv.type + "  " + sl.pp + "/" + sl.max, w - 220, y, 14, on ? "#141004" : R.TYPE_COLOR[mv.type] || "#f4efe2");
      });
    } else if (b.submenu === "bag") {
      var items = battleItems();
      panel(16, h - 220, w - 32, 200);
      if (!items.length) text("Bag is empty of battle tools.", 40, h - 120, 18, "#f4efe2");
      items.forEach(function (id, i) {
        var on = b.itemI === i;
        var y = h - 190 + i * 36;
        if (on) { ctx.fillStyle = "#e8c547"; round(28, y - 22, w - 56, 32, 8); ctx.fill(); }
        text(R.ITEMS[id].name + "  ×" + R.G.bag[id], 40, y, 18, on ? "#141004" : "#f4efe2", true);
      });
    }
  }

  function drawUI() {
    var ui = R.G.ui;
    if (!ui) return;
    var w = c.width, h = c.height;
    if (ui.type === "menu") {
      var items = ["Party", "Bag", "Dex", "Owlie Card", "Save", R.G.mute ? "Sound on" : "Sound off", "Close"];
      panel(w - 280, 100, 260, 80 + items.length * 36);
      text("MENU", w - 260, 132, 18, "#e8c547", true);
      items.forEach(function (lb, i) {
        var on = ui.i === i;
        if (on) { ctx.fillStyle = "#e8c547"; round(w - 266, 146 + i * 36, 232, 32, 8); ctx.fill(); }
        text(lb, w - 250, 170 + i * 36, 18, on ? "#141004" : "#f4efe2", true);
      });
    } else if (ui.type === "party") {
      panel(40, 80, w - 80, h - 160);
      text(ui.forced ? "SEND NEXT" : "PARTY", 60, 116, 22, "#e8c547", true);
      R.G.party.forEach(function (m, i) {
        var on = ui.i === i;
        var y = 150 + i * 48;
        if (on) { ctx.fillStyle = "#e8c547"; round(56, y - 24, w - 120, 40, 8); ctx.fill(); }
        text(m.name + "  Lv" + m.level, 70, y, 18, on ? "#141004" : "#f4efe2", true);
        text(Math.ceil(m.hp) + "/" + m.maxhp + (m.status ? " " + m.status : ""), w - 280, y, 16, on ? "#141004" : "#b7b09a");
      });
    } else if (ui.type === "bag") {
      var list = ui.battle ? battleItems() : bagEntries();
      panel(40, 80, w - 80, h - 160);
      text("BAG", 60, 116, 22, "#e8c547", true);
      if (!list.length) text("Empty pockets.", 70, 170, 18, "#f4efe2");
      list.forEach(function (id, i) {
        var on = ui.i === i;
        var y = 160 + i * 40;
        if (on) { ctx.fillStyle = "#e8c547"; round(56, y - 22, w - 120, 34, 8); ctx.fill(); }
        text(R.ITEMS[id].name + "  ×" + R.G.bag[id], 70, y, 18, on ? "#141004" : "#f4efe2", true);
      });
    } else if (ui.type === "dex") {
      panel(30, 70, w - 60, h - 140);
      text("DEX  " + Object.keys(R.G.dexC).length + "/" + R.DEX_ORDER.length, 50, 104, 20, "#e8c547", true);
      var start = Math.max(0, ui.i - 5);
      for (var i = start; i < Math.min(R.DEX_ORDER.length, start + 10); i++) {
        var id = R.DEX_ORDER[i];
        var seen = R.G.dexS[id];
        var on = ui.i === i;
        var y = 140 + (i - start) * 36;
        if (on) { ctx.fillStyle = "#e8c547"; round(46, y - 20, w - 100, 32, 8); ctx.fill(); }
        var label = seen ? R.SPECIES[id].name + (R.G.dexC[id] ? "  ●" : "  ○") : "???";
        text(String(i + 1).padStart(2, "0") + "  " + label, 60, y, 16, on ? "#141004" : "#f4efe2", true);
      }
    } else if (ui.type === "summary" && ui.mon) {
      var m = ui.mon;
      var st = R.stats(m);
      panel(40, 70, w - 80, h - 140);
      text(m.name, 60, 110, 26, "#f4efe2", true);
      text(R.SPECIES[m.sid].types.join(" / "), 60, 142, 16, "#e8c547");
      text("Lv " + m.level + "   HP " + m.hp + "/" + m.maxhp, 60, 176, 18, "#f4efe2");
      text("ATK " + st.atk + "   DEF " + st.def + "   SPD " + st.spd, 60, 206, 18, "#f4efe2");
      text(m.status ? "STATUS " + m.status : "STATUS clear", 60, 236, 16, "#b7b09a");
      m.moves.forEach(function (sl, i) {
        var mv = R.MOVES[sl.id];
        text(mv.name + "  " + mv.type + "  " + sl.pp + "/" + sl.max, 60, 280 + i * 32, 16, R.TYPE_COLOR[mv.type]);
      });
      text(R.SPECIES[m.sid].blurb, 60, h - 120, 14, "#f4efe2");
    }
  }

  function drawShop() {
    var s = R.G.shop;
    panel(40, 70, c.width - 80, c.height - 120);
    text("MART   SWAP " + R.G.swap, 60, 110, 22, "#e8c547", true);
    s.ids.forEach(function (id, i) {
      var it = R.ITEMS[id];
      var on = s.i === i;
      var y = 160 + i * 42;
      if (on) { ctx.fillStyle = "#e8c547"; round(56, y - 24, c.width - 120, 36, 8); ctx.fill(); }
      text(it.name, 70, y, 18, on ? "#141004" : "#f4efe2", true);
      text(it.price + " SWAP", c.width - 220, y, 16, on ? "#141004" : "#e8c547");
    });
    text("A buy    B leave", 60, c.height - 70, 14, "#b7b09a");
  }

  function drawPC() {
    var pc = R.G.pc;
    panel(20, 60, c.width - 40, c.height - 100);
    text("VAULT", 40, 96, 22, "#e8c547", true);
    text(pc.side === 0 ? "PARTY" : "party", 40, 130, 16, pc.side === 0 ? "#e8c547" : "#b7b09a", true);
    text(pc.side === 1 ? "BOX" : "box", c.width / 2, 130, 16, pc.side === 1 ? "#e8c547" : "#b7b09a", true);
    var left = R.G.party, right = R.G.box;
    left.forEach(function (m, i) {
      var on = pc.side === 0 && pc.i === i;
      text((on ? "> " : "  ") + m.name + " Lv" + m.level, 40, 170 + i * 32, 16, on ? "#e8c547" : "#f4efe2");
    });
    right.forEach(function (m, i) {
      if (i > 10) return;
      var on = pc.side === 1 && pc.i === i;
      text((on ? "> " : "  ") + m.name + " Lv" + m.level, c.width / 2, 170 + i * 28, 15, on ? "#e8c547" : "#f4efe2");
    });
    if (!right.length && pc.side === 1) text("Box is empty.", c.width / 2, 180, 16, "#b7b09a");
    text("Left/right switch   A act   B close", 40, c.height - 56, 14, "#b7b09a");
  }

  function drawRip() {
    var w = c.width, h = c.height;
    ctx.fillStyle = "#07080c";
    ctx.fillRect(0, 0, w, h);
    var rip = R.G.rip;
    ctx.textAlign = "center";
    text("PACK BAR", w / 2, 50, 16, "#e8c547", true);
    text("TAKE YOUR SHOT!", w / 2, 86, 28, "#f4efe2", true);
    if (rip.phase < 2) {
      var jig = Math.sin(R.G.time * 30) * (rip.phase === 0 ? 6 : 0);
      ctx.fillStyle = "#1a1a1e";
      round(w / 2 - 70 + jig, 160, 140, 180, 12);
      ctx.fill();
      ctx.strokeStyle = "#e8c547";
      ctx.lineWidth = 4;
      round(w / 2 - 70 + jig, 160, 140, 180, 12);
      ctx.stroke();
      text(rip.tier === "chrome" ? "CHROME" : "RIP", w / 2 + jig, 260, 22, "#e8c547", true);
      text(rip.phase === 0 ? "shaking…" : "tearing foil…", w / 2, 400, 16, "#b7b09a");
    } else {
      for (var i = 0; i < 3; i++) {
        var show = rip.phase >= i + 2;
        var x = w / 2 - 240 + i * 170;
        ctx.fillStyle = show ? "#14140f" : "#1a1a1e";
        round(x, 180, 150, 200, 12);
        ctx.fill();
        ctx.strokeStyle = "#e8c547";
        round(x, 180, 150, 200, 12);
        ctx.stroke();
        if (show) {
          var card = rip.cards[i];
          text(i === 2 ? "HIT" : "PULL", x + 75, 220, 14, "#e8c547", true);
          wrap(card.label, x + 16, 270, 120, 16, "#f4efe2");
        } else text("?", x + 75, 280, 28, "#e8c547", true);
      }
    }
    text("A", w / 2, h - 36, 14, "#b7b09a");
    ctx.textAlign = "left";
  }

  function drawEvo() {
    var e = R.G.evo;
    if (!e) return;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, c.width, c.height);
    var flash = Math.floor(e.t * 8) % 2;
    var sid = e.t > 1.4 ? e.into : e.mon.sid;
    if (!flash || e.t > 1.6) ctx.drawImage(R.art.mon(sid, 0), c.width / 2 - 80, c.height / 2 - 120, 160, 160);
    ctx.textAlign = "center";
    text("Evolving…", c.width / 2, c.height / 2 + 80, 22, "#e8c547", true);
    ctx.textAlign = "left";
  }

  function drawToast() {
    ctx.textAlign = "center";
    panel(c.width / 2 - 180, c.height * 0.18, 360, 48);
    text(R.G.toast.text, c.width / 2, c.height * 0.18 + 32, 20, "#f4efe2", true);
    ctx.textAlign = "left";
  }

  function drawDialog() {
    var d = R.G.dialog;
    var w = c.width, h = c.height;
    var boxH = d.choices ? 200 : 120;
    panel(16, h - boxH - 16, w - 32, boxH);
    var line = d.lines[d.i] || "";
    wrap(line, 36, h - boxH + 20, w - 80, 20, "#f4efe2");
    if (d.choices && d.i >= d.lines.length - 1) {
      d.choices.forEach(function (ch, i) {
        var on = (d.ci || 0) === i;
        var y = h - boxH + 78 + i * 28;
        if (on) { ctx.fillStyle = "#e8c547"; round(36, y - 18, w - 90, 26, 6); ctx.fill(); }
        text(ch.label, 48, y, 16, on ? "#141004" : "#f4efe2", true);
      });
    } else {
      text("A", w - 48, h - 28, 14, "#e8c547", true);
    }
  }

  if (!window.__RIPZ_REACT && $("c")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { R.boot(); });
    else R.boot();
  }
})();
