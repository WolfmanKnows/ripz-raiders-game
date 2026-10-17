/* Procedural 64×64 tiles and 128×128 raider sheets (idle / walk / attack). */
(function () {
  "use strict";
  var R = (window.RIPZ = window.RIPZ || {});
  var tileCache = {};
  var monCache = {};
  var trainerCache = {};

  function hexShift(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  var STYLES = {
    hootling: { body: "#9aa0aa", belly: "#f3e6d4", beak: "#e989a8", accent: "#e8c547", ear: 5 },
    chromehoot: { body: "#d5dde6", belly: "#f7fbff", beak: "#9aa8b8", accent: "#e8c547", metal: 1, ear: 6 },
    aureowl: { body: "#f0d78a", belly: "#fff6d8", beak: "#e989a8", accent: "#fff1a8", myth: 1, ear: 8, bulk: 1 },
    nestling: { body: "#7dba6a", belly: "#e7f5c9", beak: "#f0c14a", accent: "#3e7a32", leaf: 1, ear: 4 },
    packbloom: { body: "#5ea85a", belly: "#f6d5e6", beak: "#f0c14a", accent: "#e989a8", leaf: 1, ear: 6 },
    canopyrex: { body: "#3e6b3a", belly: "#c5d6a2", beak: "#d9a441", accent: "#8d6a3a", leaf: 1, rock: 1, ear: 7, bulk: 1 },
    ripkit: { body: "#e07a3d", belly: "#ffd2a8", beak: "#ffe7b0", accent: "#ff5a1f", fire: 1, ear: 5 },
    ripper: { body: "#d3542a", belly: "#ffb088", beak: "#ffe08a", accent: "#ff3b1f", fire: 1, ear: 7 },
    infernowl: { body: "#a61f1f", belly: "#ffcf70", beak: "#ffe9a0", accent: "#ffd24a", fire: 1, myth: 1, ear: 8, bulk: 1 },
    foilghost: { body: "#c9b6ff", belly: "#efe8ff", beak: "#9b8cff", accent: "#e8c547", ghost: 1, ear: 6 },
    spectowl: { body: "#6a5acd", belly: "#d9d0ff", beak: "#c9b6ff", accent: "#e8c547", ghost: 1, ear: 8 },
    packrat: { body: "#b08968", belly: "#f0e0c8", beak: "#e989a8", accent: "#d5dde4", beast: 1, ear: 3 },
    hoardbeast: { body: "#8d6b4a", belly: "#e6d2b5", beak: "#e8c547", accent: "#d9dde6", beast: 1, metal: 1, bulk: 1, ear: 4 },
    tideling: { body: "#4aa3d8", belly: "#d7f1ff", beak: "#f4efe2", accent: "#1d6ea5", water: 1, ear: 4 },
    brineback: { body: "#1f6f93", belly: "#b7e3f5", beak: "#f4efe2", accent: "#e8c547", water: 1, bulk: 1, ear: 6 },
    sparkmite: { body: "#f2d04b", belly: "#fff6c2", beak: "#fffef2", accent: "#7a5cff", spark: 1, ear: 5 },
    voltowl: { body: "#f0c419", belly: "#fff3b0", beak: "#fff", accent: "#5b46ff", spark: 1, ear: 7 },
    shelflick: { body: "#a89880", belly: "#ddd0bc", beak: "#6b5b4b", accent: "#8a8072", rock: 1, ear: 3 },
    shelfbreaker: { body: "#7a6a58", belly: "#c8baa4", beak: "#4a4036", accent: "#e8c547", rock: 1, bulk: 1, ear: 4 },
    clearout: { body: "#87b8e0", belly: "#f4f8ff", beak: "#f0c14a", accent: "#ffffff", ear: 7 },
    bulkbuyer: { body: "#2b2b30", belly: "#f4efe2", beak: "#e8c547", accent: "#e8c547", myth: 1, metal: 1, bulk: 1, ear: 7 },
    resale: { body: "#5c6b7a", belly: "#d5dde4", beak: "#e8c547", accent: "#e85d4c", metal: 1, ear: 6 },
    scalplet: { body: "#3a3a40", belly: "#f0d0da", beak: "#e989a8", accent: "#e85d4c", metal: 1, ghost: 0.35, ear: 6 },
  };

  function sheet(w, h, draw) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    draw(g);
    return c;
  }

  function paintTile(id, variant, frame) {
    var T = R.T;
    return sheet(64, 64, function (ctx) {
      var px = function (x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x * 2, y * 2, w * 2, h * 2); };
      var v = variant % 4;
      if (id === T.GRASS || id === T.TALL || id === T.FLOWER) {
        px(0, 0, 32, 32, v % 2 ? "#245c38" : "#1c4d30");
        for (var i = 0; i < 10; i++) {
          px((v * 5 + i * 7) % 30, (v * 3 + i * 5) % 30, 2, 2, i % 2 ? "#3e8f55" : "#163d26");
        }
        if (id === T.TALL || id === T.FLOWER) {
          var sway = frame % 2;
          px(4 + sway, 6, 2, 10, "#8fd18a");
          px(10, 4 + sway, 2, 12, "#cfe8a0");
          px(18 + sway, 8, 2, 9, "#6fbf62");
          px(24, 5, 2, 11, "#dff5b8");
          px(12, 14, 2, 8, "#8fd18a");
        }
        if (id === T.FLOWER || (id === T.GRASS && v === 0)) {
          px(20, 18, 2, 2, "#e989a8");
          px(22, 18, 2, 2, "#e8c547");
        }
        if (id === T.TALL) px(0, 0, 32, 1, "#143222");
      } else if (id === T.PATH || id === T.BRIDGE || id === T.SAND) {
        var base = id === T.SAND ? "#e2c98a" : id === T.BRIDGE ? "#b08958" : "#cbb892";
        px(0, 0, 32, 32, base);
        px(2, 4, 8, 6, hexShift(base, -18));
        px(16, 10, 10, 7, hexShift(base, -24));
        px(8, 20, 12, 6, hexShift(base, 16));
        px(22, 22, 6, 5, hexShift(base, -10));
        if (id === T.BRIDGE) {
          px(0, 0, 32, 2, "#5a4030");
          px(0, 30, 32, 2, "#5a4030");
        }
      } else if (id === T.TREE) {
        px(0, 0, 32, 32, "#163222");
        px(6, 10, 20, 16, "#1f6b34");
        px(8, 8, 16, 12, "#2f8a45");
        px(10, 6, 10, 8, "#46a85a");
        px(14, 22, 4, 8, "#6b4226");
        px(12, 12, 3, 3, "#d8f5c4");
        px(18, 14, 2, 2, "#e8c547");
      } else if (id === T.WATER) {
        px(0, 0, 32, 32, "#1a4f86");
        var s = frame % 4;
        px(2 + s, 6, 10, 2, "#7ec8ee");
        px(16 - s, 14, 12, 2, "#4aa3d8");
        px(6 + s, 22, 8, 2, "#d7f1ff");
        px(0, 0, 32, 32, "rgba(255,255,255,0)");
      } else if (id === T.WALL || id === T.WINDOW) {
        px(0, 0, 32, 32, "#1a1a1e");
        px(1, 1, 14, 14, "#2a2a30");
        px(17, 1, 14, 14, "#24242a");
        px(1, 17, 14, 14, "#24242a");
        px(17, 17, 14, 14, "#2e2e34");
        px(0, 0, 32, 1, "#e8c547");
        if (id === T.WINDOW) {
          px(8, 8, 16, 12, "#8fd0e8");
          px(8, 13, 16, 1, "#1a1a1e");
          px(15, 8, 1, 12, "#1a1a1e");
          px(10, 10, 3, 2, "#f4efe2");
        }
      } else if (id === T.ROOF) {
        px(0, 0, 32, 32, "#120e0c");
        for (var ry = 0; ry < 32; ry += 4) px(0, ry, 32, 2, "#221c16");
        px(0, 0, 32, 2, "#e8c547");
        px(0, 30, 32, 2, "#6b5420");
        px(4, 8, 2, 2, "#e8c547");
        px(24, 16, 2, 2, "#e8c547");
      } else if (id === T.DOOR) {
        px(0, 0, 32, 32, "#1a1a1e");
        px(8, 6, 16, 26, "#3a2418");
        px(8, 6, 16, 2, "#e8c547");
        px(8, 6, 2, 26, "#e8c547");
        px(22, 6, 2, 26, "#e8c547");
        px(18, 18, 2, 2, "#e8c547");
        px(10, 10, 5, 8, "#6ec1ff");
      } else if (id === T.FLOOR) {
        px(0, 0, 32, 32, "#3a342c");
        px(0, 0, 16, 16, "#453e34");
        px(16, 16, 16, 16, "#453e34");
        px(0, 0, 32, 1, "#2a241c");
      } else if (id === T.COUNTER) {
        px(0, 0, 32, 32, "#2a2118");
        px(0, 8, 32, 16, "#6b4a2a");
        px(0, 8, 32, 3, "#e8c547");
        px(4, 14, 6, 4, "#1a1a1e");
      } else if (id === T.RUG || id === T.MAT) {
        px(0, 0, 32, 32, id === T.MAT ? "#3a342c" : "#3a342c");
        px(4, 6, 24, 20, id === T.MAT ? "#6b1d2a" : "#6b1d2c");
        px(6, 8, 20, 16, "#e8c547");
        px(8, 10, 16, 12, "#1a1a1e");
      } else if (id === T.BRAMBLE) {
        px(0, 0, 32, 32, "#1c4d30");
        px(2, 18, 8, 8, "#3d6b28");
        px(12, 10, 10, 14, "#2a501c");
        px(20, 16, 8, 10, "#4e7a30");
        px(8, 8, 3, 3, "#e85d4c");
        px(18, 6, 3, 3, "#c9b6ff");
      } else if (id === T.ROCK) {
        px(0, 0, 32, 32, "#245c38");
        px(4, 10, 24, 18, "#7a7064");
        px(8, 6, 16, 12, "#a89880");
        px(10, 8, 4, 3, "#e4d8c8");
        px(18, 16, 6, 2, "#3a342c");
      } else if (id === T.FENCE) {
        px(0, 0, 32, 32, "#245c38");
        px(2, 10, 4, 18, "#6b4226");
        px(14, 8, 4, 20, "#6b4226");
        px(26, 10, 4, 18, "#6b4226");
        px(0, 12, 32, 3, "#8a5a34");
        px(0, 20, 32, 3, "#8a5a34");
      } else if (id === T.PC) {
        px(0, 0, 32, 32, "#3a342c");
        px(6, 6, 20, 22, "#1a1a1e");
        px(8, 8, 16, 12, "#67e0c2");
        px(8, 8, 16, 2, "#e8c547");
        px(12, 22, 8, 2, "#e8c547");
      } else if (id === T.BED) {
        px(0, 0, 32, 32, "#3a342c");
        px(4, 8, 24, 18, "#f4efe2");
        px(4, 8, 24, 6, "#6b1d2a");
        px(6, 16, 8, 6, "#e8c547");
      } else if (id === T.BOOK) {
        px(0, 0, 32, 32, "#2a2118");
        px(4, 4, 6, 24, "#6b1d2a");
        px(12, 4, 6, 24, "#e8c547");
        px(20, 4, 6, 24, "#1f4d78");
      } else if (id === T.MACHINE) {
        px(0, 0, 32, 32, "#3a342c");
        px(6, 8, 20, 18, "#1a1a1e");
        px(8, 10, 16, 8, "#e8c547");
        px(10, 20, 4, 3, "#e85d4c");
        px(18, 20, 4, 3, "#3eae5a");
      } else if (id === T.LAMP) {
        px(0, 0, 32, 32, "#1c4d30");
        px(14, 12, 4, 16, "#2a2a30");
        px(8, 4, 16, 10, "#e8c547");
        px(10, 6, 12, 6, "#fff6d0");
      } else if (id === T.FOIL) {
        px(0, 0, 32, 32, "#14141a");
        px(2, 2, 28, 28, "#2a2a34");
        px(6, 6, 20, 20, "#d5dde6");
        px(8, 8, 8, 16, "#fff");
        px(18, 8, 6, 16, "#e8c547");
      } else if (id === T.SIGN) {
        px(0, 0, 32, 32, "#245c38");
        px(14, 14, 4, 16, "#6b4226");
        px(6, 6, 20, 12, "#1a1a1e");
        px(6, 6, 20, 2, "#e8c547");
        px(10, 10, 12, 2, "#e8c547");
      } else {
        px(0, 0, 32, 32, "#222");
      }
    });
  }

  function paintMon(st, frame) {
    return sheet(128, 128, function (ctx) {
      if (st.ghost) ctx.globalAlpha = 0.86;
      var S = 4;
      var bob = frame === 1 || frame === 3 ? -1 : 0;
      var atk = frame === 5 ? 2 : 0;
      var wing = frame === 2 || frame === 4 ? -2 : frame === 5 ? -4 : 0;
      var px = function (x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect((x + atk) * S, (y + bob) * S, w * S, h * S);
      };
      var body = st.body;
      var dark = hexShift(body, -40);
      var mid = hexShift(body, -16);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(64, 112, 36, 10, 0, 0, 7);
      ctx.fill();
      var ear = st.ear || 5;
      px(7, 4, 5, ear, dark);
      px(8, 5, 3, ear - 2, body);
      px(20, 4, 5, ear, dark);
      px(21, 5, 3, ear - 2, body);
      if (st.leaf) {
        px(6, 2, 4, 3, "#3eae5a");
        px(22, 1, 4, 3, "#8fd18a");
      }
      if (st.fire) {
        px(12, 0, 2, 4, "#ff5a1f");
        px(15, 1, 2, 3, "#ffd24a");
        px(18, 0, 2, 4, "#ff5a1f");
      }
      px(6, 8, 20, 12, dark);
      px(7, 9, 18, 10, body);
      var blink = frame === 1;
      px(9, 11, 5, blink ? 1 : 5, blink ? dark : "#f4efe2");
      px(18, 11, 5, blink ? 1 : 5, blink ? dark : "#f4efe2");
      if (!blink) {
        px(11, 13, 2, 2, "#14120c");
        px(20, 13, 2, 2, "#14120c");
        px(11, 12, 1, 1, "#fff");
        px(20, 12, 1, 1, "#fff");
      }
      px(14, 15, 4, 3, st.beak);
      px(15, 18, 2, 1, hexShift(st.beak, -30));
      px(5, 19, 22, 8, dark);
      px(6, 20, 20, 6, body);
      px(10, 21, 12, 4, st.belly);
      px(1, 16 + wing, 5, 8, dark);
      px(2, 17 + wing, 3, 6, mid);
      px(26, 16 - wing, 5, 8, dark);
      px(27, 17 - wing, 3, 6, mid);
      var step = frame === 3 ? 1 : 0;
      px(10 - step, 27, 4, 2, st.beak);
      px(18 + step, 27, 4, 2, st.beak);
      if (st.metal) {
        px(8, 10, 2, 8, "rgba(255,255,255,0.85)");
        px(22, 20, 6, 2, st.accent);
      }
      if (st.rock) {
        px(4, 18, 4, 4, "#a89880");
        px(24, 18, 4, 4, "#7a7064");
      }
      if (st.water) {
        px(4, 26, 3, 2, "#7ec8ee");
        px(25, 26, 3, 2, "#7ec8ee");
      }
      if (st.spark) {
        px(2, 8, 2, 2, st.accent);
        px(28, 6, 2, 2, "#fff");
        px(0, 14, 2, 4, st.accent);
      }
      if (st.myth) {
        px(4, 6, 2, 2, st.accent);
        px(26, 4, 2, 2, "#fff6d0");
        px(15, 2, 2, 2, st.accent);
      }
      if (st.beast) {
        px(12, 18, 8, 2, hexShift(st.beak, -20));
      }
      if (st.bulk) {
        px(4, 22, 3, 4, mid);
        px(25, 22, 3, 4, mid);
      }
      if (frame === 5) {
        px(28, 14, 4, 2, st.accent);
        px(30, 12, 2, 2, "#fff");
      }
      ctx.globalAlpha = 1;
    });
  }

  var TRAINER_COLORS = {
    owlie: { body: "#141418", trim: "#e8c547", skin: "#d7d3cc", beak: "#e989a8" },
    prof: { body: "#6b5a2a", trim: "#e8c547", skin: "#d7d3cc", beak: "#e989a8" },
    rival: { body: "#8c1f2a", trim: "#e8c547", skin: "#d7d3cc", beak: "#e989a8" },
    nurse: { body: "#1f6f6a", trim: "#f4efe2", skin: "#d7d3cc", beak: "#e989a8" },
    leader: { body: "#e8c547", trim: "#1a1a1e", skin: "#d7d3cc", beak: "#e989a8" },
    kid: { body: "#24507a", trim: "#7ec8ee", skin: "#d7d3cc", beak: "#e989a8" },
    clerk: { body: "#3a342c", trim: "#e8c547", skin: "#d7d3cc", beak: "#c9896a" },
    gate: { body: "#2a2a30", trim: "#c5ced6", skin: "#d7d3cc", beak: "#e989a8" },
  };

  function paintTrainer(kind, dir, frame) {
    var pal = TRAINER_COLORS[kind] || TRAINER_COLORS.owlie;
    return sheet(64, 80, function (ctx) {
      var S = 2;
      var bob = frame % 2 ? -1 : 0;
      var step = frame % 2 ? 1 : 0;
      var left = dir === 2;
      var px = function (x, y, w, h, c) {
        var xx = left ? (32 - (x + w)) : x;
        ctx.fillStyle = c;
        ctx.fillRect(xx * S, (y + bob) * S, w * S, h * S);
      };
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(32, 74, 16, 4, 0, 0, 7);
      ctx.fill();
      px(13, 18, 8, 16, "#1a120c");
      px(11 - step, 32, 4, 4, pal.beak);
      px(18 + step, 32, 4, 4, pal.beak);
      px(8, 16, 16, 16, pal.body);
      px(15, 16, 2, 14, pal.trim);
      px(6, 18, 4, 8, pal.body);
      px(22, 18, 4, 8, pal.body);
      if (dir === 1) {
        px(10, 4, 12, 12, pal.body);
        px(12, 6, 8, 8, hexShift(pal.body, 20));
        px(14, 2, 4, 4, pal.trim);
      } else if (dir === 2 || dir === 3) {
        px(12, 4, 10, 12, pal.skin);
        px(14, 2, 6, 5, pal.body);
        px(18, 8, 3, 3, "#f4efe2");
        px(19, 9, 1, 1, "#14120c");
        px(20, 11, 3, 2, pal.beak);
      } else {
        px(9, 4, 14, 13, pal.skin);
        px(10, 2, 12, 6, pal.body);
        px(11, 8, 4, 4, "#f4efe2");
        px(17, 8, 4, 4, "#f4efe2");
        px(12, 9, 2, 2, "#14120c");
        px(18, 9, 2, 2, "#14120c");
        px(14, 13, 4, 2, pal.beak);
        px(12, 3, 3, 2, pal.trim);
        px(17, 3, 3, 2, pal.trim);
      }
    });
  }

  var TILE_NAME = [
    "grass", "tall", "path", "tree", "water", "wall", "roof", "door", "floor", "counter",
    "rug", "flower", "sand", "bridge", "bramble", "rock", "fence", "pc", "bed", "book",
    "machine", "window", "mat", "lamp", "foil", "sign",
  ];
  var MON_IDS = [
    "hootling", "chromehoot", "aureowl", "nestling", "packbloom", "canopyrex",
    "ripkit", "ripper", "infernowl", "foilghost", "spectowl", "packrat", "hoardbeast",
    "tideling", "brineback", "sparkmite", "voltowl", "shelflick", "shelfbreaker",
    "clearout", "bulkbuyer", "resale", "scalplet",
  ];
  var MON_GRID = { hootling: [2, 2], nestling: [2, 2], ripkit: [2, 2], chromehoot: [2, 2] };
  var TRAINERS = ["owlie", "rival", "prof", "nurse", "leader"];
  var TRAINER_ALIAS = { kid: "owlie", clerk: "owlie", gate: "rival", mom: "nurse" };
  var gen = { tiles: {}, mons: {}, trainers: {}, ball: null, arena: null };
  var sliceCache = {};

  function assetRoot() {
    var path = (typeof location !== "undefined" && location.pathname) || "";
    var m = path.match(/^\/hds-[a-z0-9]+-\d+-[a-z0-9]+/i);
    var pre = m ? m[0] : "";
    if (window.__RIPZ_REACT) return pre + "/ripz/assets/";
    return "assets/";
  }

  function loadImg(url) {
    var img = new Image();
    var v = window.__RIPZ_BUILD || "";
    img.src = v ? url + "?v=" + v : url;
    return img;
  }

  function ready(img) {
    return !!(img && img.complete && img.naturalWidth);
  }

  function sliceOf(img, cols, rows, col, row, nudge) {
    var sw = img.width / cols;
    var sh = img.height / rows;
    var cnv = document.createElement("canvas");
    cnv.width = Math.max(1, Math.round(sw));
    cnv.height = Math.max(1, Math.round(sh));
    var g = cnv.getContext("2d");
    g.imageSmoothingEnabled = true;
    var dx = nudge ? sw * 0.05 : 0;
    g.drawImage(img, Math.round(col * sw), Math.round(row * sh), Math.round(sw), Math.round(sh), dx, 0, sw - dx, sh);
    return cnv;
  }

  function paintFallbackTile(id, variant, frame) {
    var k = "p:" + id + ":" + (variant % 4) + ":" + (frame % 4);
    if (!tileCache[k]) tileCache[k] = paintTile(id, variant % 4, frame % 4);
    return tileCache[k];
  }

  R.art = {
    tile: function (id, variant, frame) {
      var name = TILE_NAME[id] || "grass";
      if (name === "water") name = "water" + ((frame || 0) % 4);
      var img = gen.tiles[name];
      if (ready(img)) return img;
      return paintFallbackTile(id, variant, frame);
    },
    mon: function (sid, frame) {
      var img = gen.mons[sid];
      if (!ready(img)) {
        var k = sid + ":" + frame;
        if (!monCache[k]) monCache[k] = paintMon(STYLES[sid] || STYLES.hootling, frame);
        return monCache[k];
      }
      var grid = MON_GRID[sid] || [1, 1];
      var col = 0;
      var row = 0;
      var nudge = false;
      if (grid[0] === 2) {
        if (frame === 1) col = 1;
        else if (frame === 5) { col = 1; row = 1; }
        else if (frame === 2 || frame === 3 || frame === 4) row = 1;
      } else if (frame === 5) nudge = true;
      var key = "m:" + sid + ":" + frame;
      if (!sliceCache[key]) sliceCache[key] = sliceOf(img, grid[0], grid[1], col, row, nudge);
      return sliceCache[key];
    },
    trainer: function (kind, dir, frame) {
      var name = TRAINER_ALIAS[kind] || kind || "owlie";
      if (TRAINERS.indexOf(name) < 0) name = "owlie";
      var img = gen.trainers[name];
      if (!ready(img)) {
        var k = kind + ":" + dir + ":" + (frame % 2);
        if (!trainerCache[k]) trainerCache[k] = paintTrainer(kind, dir, frame % 2);
        return trainerCache[k];
      }
      var row = dir === 1 ? 3 : dir === 2 ? 1 : dir === 3 ? 2 : 0;
      var col = (frame || 0) % 4;
      var key = "t:" + name + ":" + row + ":" + col;
      if (!sliceCache[key]) sliceCache[key] = sliceOf(img, 4, 4, col, row, false);
      return sliceCache[key];
    },
    ball: function () { return ready(gen.ball) ? gen.ball : null; },
    arena: function () { return ready(gen.arena) ? gen.arena : null; },
    build: function () {
      var root = assetRoot();
      TILE_NAME.forEach(function (n) {
        if (n === "water") {
          for (var i = 0; i < 4; i++) gen.tiles["water" + i] = loadImg(root + "tiles/water" + i + ".png");
        } else gen.tiles[n] = loadImg(root + "tiles/" + n + ".png");
      });
      MON_IDS.forEach(function (id) { gen.mons[id] = loadImg(root + "sheets/" + id + ".png"); });
      TRAINERS.forEach(function (id) { gen.trainers[id] = loadImg(root + "sheets/" + id + ".png"); });
      gen.ball = loadImg(root + "sheets/ripball.png");
      gen.arena = loadImg(root + "ui/arena.jpg");
    },
  };
})();
