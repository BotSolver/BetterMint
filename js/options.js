"use strict";

var a;
var b;
var c;
var d;
var e;
var f;
var g;
var h;
var i;
var j;
var k;
var l;
var m;
var n;
var o;
var p;
var q;
var r;
var s;
var t;
var u;
var v;
var w;
var x;
var y;
var z;
var A;
var B;
var C;
var D;
var E;
var F;
var G;
var H;
var I;
var J;
var K;
var L;
const M = {
  depth: 3,
  elo: 1500,
  contempt: 0,
  moveoverhead: 100,
  syzygyprobedepth: 1,
  syzygyprobelimit: 7,
  normalizefactor: 199,
  skill_level_prob: 128,
  skill_level_error: 200,
  skill_level: 10,
  multipv: 3,
  threads: 10,
  auto_move_time: 0,
  auto_move_time_random: 0,
  auto_move_time_random_div: 0,
  auto_move_time_random_multi: 0,
  max_legit_auto_move_depth: 5,
  best_move_chance: 50,
  matefindervalue: 3,
  stockfish11: false,
  stockfish16: true,
  torch: false,
  aggressive_mode: false,
  defensive_mode: false,
  normalize: true,
  pretty: false,
  syzygy50moverule: false,
  chess960: false,
  limit_strength: false,
  highmatechance: false,
  random_best_move: false,
  legit_auto_move: false,
  show_hints: true,
  text_to_speech: false,
  move_analysis: true,
  depth_bar: true,
  evaluation_bar: true,
  use_nnue: false
};
function N() {
  chrome.storage.sync.get(M, function (j) {
    let M = j;
    if (a !== null && a.value !== undefined) {
      a.value = M.depth.toString();
      let b = new CustomEvent("input");
      b.disableUpdate = true;
      a.dispatchEvent(b);
    }
    if (g !== null && g.value !== undefined) {
      g.value = M.syzygyprobedepth.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      g.dispatchEvent(a);
    }
    if (B !== null && B.value !== undefined) {
      B.value = M.syzygyprobelimit.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      B.dispatchEvent(a);
    }
    if (A !== null && A.value !== undefined) {
      A.value = M.normalizefactor.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      A.dispatchEvent(a);
    }
    if (f !== null && f.value !== undefined) {
      f.value = M.moveoverhead.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      f.dispatchEvent(a);
    }
    if (y !== null && y.value !== undefined) {
      y.value = M.skill_level_error.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      y.dispatchEvent(a);
    }
    if (x !== null && x.value !== undefined) {
      x.value = M.skill_level_prob.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      x.dispatchEvent(a);
    }
    if (v !== null && v.value !== undefined) {
      v.value = M.contempt.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      v.dispatchEvent(a);
    }
    if (b !== null && b.value !== undefined) {
      b.value = M.elo.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      b.dispatchEvent(a);
    }
    if (o !== null && o.value !== undefined) {
      o.value = M.best_move_chance.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      o.dispatchEvent(a);
    }
    if (d !== null && d.value !== undefined) {
      d.value = M.multipv.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      d.dispatchEvent(a);
    }
    if (c !== null && c.value !== undefined) {
      c.value = M.skill_level.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      c.dispatchEvent(a);
    }
    if (k !== null && k.value !== undefined) {
      k.value = M.auto_move_time.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      k.dispatchEvent(a);
    }
    if (l !== null && l.value !== undefined) {
      l.value = M.auto_move_time_random.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      l.dispatchEvent(a);
    }
    if (m !== null && m.value !== undefined) {
      m.value = M.auto_move_time_random_div.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      m.dispatchEvent(a);
    }
    if (n !== null && n.value !== undefined) {
      n.value = M.auto_move_time_random_multi.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      n.dispatchEvent(a);
    }
    if (F !== null && F.value !== undefined) {
      F.value = M.max_legit_auto_move_depth.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      F.dispatchEvent(a);
    }
    if (C !== null && C.value !== undefined) {
      C.value = M.matefindervalue.toString();
      let a = new CustomEvent("input");
      a.disableUpdate = true;
      C.dispatchEvent(a);
    }
    if (i !== null && i.checked !== undefined) {
      i.checked = M.syzygy50moverule;
    }
    if (h !== null && h.checked !== undefined) {
      h.checked = M.pretty;
    }
    if (z !== null && z.checked !== undefined) {
      z.checked = M.normalize;
    }
    if (w !== null && w.checked !== undefined) {
      w.checked = M.chess960;
    }
    if (q !== null && q.checked !== undefined) {
      q.checked = M.stockfish11;
    }
    if (r !== null && r.checked !== undefined) {
      r.checked = M.stockfish16;
    }
    if (s !== null && s.checked !== undefined) {
      s.checked = M.torch;
    }
    if (G !== null && G.checked !== undefined) {
      G.checked = M.show_hints;
    }
    if (t !== null && t.checked !== undefined) {
      t.checked = M.aggressive_mode;
    }
    if (u !== null && u.checked !== undefined) {
      u.checked = M.defensive_mode;
    }
    if (D !== null && D.checked !== undefined) {
      D.checked = M.highmatechance;
    }
    if (e !== null && e.checked !== undefined) {
      e.checked = M.limit_strength;
    }
    if (p !== null && p.checked !== undefined) {
      p.checked = M.legit_auto_move;
    }
    if (E !== null && E.checked !== undefined) {
      E.checked = M.random_best_move;
    }
    if (J !== null && J.checked !== undefined) {
      J.checked = M.text_to_speech;
    }
    if (H !== null && H.checked !== undefined) {
      H.checked = M.move_analysis;
    }
    if (I !== null && I.checked !== undefined) {
      I.checked = M.depth_bar;
    }
    if (K !== null && K.checked !== undefined) {
      K.checked = M.evaluation_bar;
    }
    if (L !== null && L.checked !== undefined) {
      L.checked = M.use_nnue;
    }
  });
}
function O() {
  let i = {
    depth: parseInt(a.value),
    elo: parseInt(b.value),
    moveoverhead: parseInt(f.value),
    syzygyprobedepth: parseInt(g.value),
    normalizefactor: parseInt(A.value),
    syzygyprobelimit: parseInt(B.value),
    contempt: parseInt(v.value),
    skill_level: parseInt(c.value),
    skill_level_prob: parseInt(x.value),
    skill_level_error: parseInt(y.value),
    skill_level: parseInt(c.value),
    multipv: parseInt(d.value),
    best_move_chance: parseInt(o.value),
    threads: 10,
    matefindervalue: parseInt(C.value),
    auto_move_time: parseInt(k.value),
    auto_move_time_random: parseInt(l.value),
    auto_move_time_random_div: parseInt(m.value),
    auto_move_time_random_multi: parseInt(n.value),
    max_legit_auto_move_depth: parseInt(F.value),
    show_hints: G.checked,
    stockfish11: q.checked,
    stockfish16: r.checked,
    torch: s.checked,
    pretty: h.checked,
    normalize: z.checked,
    defensive_mode: u.checked,
    aggressive_mode: t.checked,
    chess960: w.checked,
    highmatechance: D.checked,
    limit_strength: e.checked,
    legit_auto_move: p.checked,
    random_best_move: E.checked,
    text_to_speech: J.checked,
    move_analysis: H.checked,
    depth_bar: I.checked,
    evaluation_bar: K.checked,
    use_nnue: L.checked
  };
  chrome.storage.sync.set(i);
  chrome.tabs.query({}, function (a) {
    a.forEach(function (a) {
      var b = {
        type: "UpdateOptions",
        data: i
      };
      chrome.tabs.sendMessage(a.id, b);
    });
  });
}
function P() {
  a = document.getElementById("option-depth");
  j = 10;
  f = document.getElementById("option-moveoverhead");
  b = document.getElementById("option-elo");
  C = document.getElementById("option-mate-finder-value");
  d = document.getElementById("option-multipv");
  o = document.getElementById("option-best-move-chance");
  D = document.getElementById("option-highmatechance");
  c = document.getElementById("option-skill-level");
  e = document.getElementById("option-limit-strength");
  k = document.getElementById("option-auto-move-time");
  v = document.getElementById("option-contempt");
  y = document.getElementById("option-skill-level-error");
  g = document.getElementById("option-syzygyprobedepth");
  B = document.getElementById("option-syzygyprobelimit");
  A = document.getElementById("option-normalizefactor");
  w = document.getElementById("option-chess960");
  h = document.getElementById("option-pretty");
  z = document.getElementById("option-normalize");
  i = document.getElementById("option-syzygy50moverule");
  x = document.getElementById("option-skill-level-prob");
  w = document.getElementById("option-chess960");
  l = document.getElementById("option-auto-move-time-random");
  m = document.getElementById("option-auto-move-time-random-div");
  n = document.getElementById("option-auto-move-time-random-multi");
  F = document.getElementById("option-max-legit-auto-move-depth");
  p = document.getElementById("option-legit-auto-move");
  E = document.getElementById("option-random-best-move");
  G = document.getElementById("option-show-hints");
  t = document.getElementById("option-aggro");
  u = document.getElementById("option-defend");
  q = document.getElementById("option-stockfish11");
  r = document.getElementById("option-stockfish16");
  s = document.getElementById("option-torch");
  J = document.getElementById("option-text-to-speech");
  H = document.getElementById("option-move-analysis");
  I = document.getElementById("option-depth-bar");
  K = document.getElementById("option-evaluation-bar");
  L = document.getElementById("option-use-nnue");
  const M = {
    fill: "#5d3fd3",
    background: "rgba(255, 255, 255, 0.214)"
  };
  document.querySelectorAll(".options-slider").forEach(function (a) {
    const b = a.querySelector(".title");
    const c = a.querySelector("input");
    if (b == null || c == null) {
      return;
    }
    c.min = a.getAttribute("data-min");
    c.max = a.getAttribute("data-max");
    c.addEventListener("input", a => {
      const d = parseInt(c.value);
      const e = parseInt(c.min);
      const f = parseInt(c.max);
      const g = (d - e) / (f - e) * 100;
      const h = "linear-gradient(90deg, " + M.fill + " " + g + "%, " + M.background + " " + (g + 0.1) + "%)";
      c.style.background = h;
      b.setAttribute("data-value", c.value);
      if (!a.disableUpdate) {
        O();
      }
    });
  });
  document.querySelectorAll(".options-checkbox").forEach(function (a) {
    a.addEventListener("change", function () {
      O();
    });
  });
  N();
}
window.onload = function () {
  chrome.storage.local.get(["theme"]).then(a => {
    if (a.theme === "d") {
      document.body.style.backgroundColor = "#292A2D";
      document.getElementsByClassName("settings-content")[0].style.backgroundColor = "#292A2D";
    } else if (a.theme === "ud") {
      document.body.style.backgroundColor = "#000";
      document.getElementsByClassName("settings-content")[0].style.backgroundColor = "#000";
    }
  });
  document.getElementById("popoutb").addEventListener("click", function () {
    chrome.tabs.query({}, function (a) {
      a.forEach(function (a) {
        chrome.tabs.sendMessage(a.id, {
          type: "popout",
          data: "popout"
        });
      });
    });
  });
  document.getElementById("ultradark").addEventListener("click", function () {
    chrome.storage.local.set({
      theme: "ud"
    });
    document.body.style.backgroundColor = "#000";
    document.getElementsByClassName("settings-content")[0].style.backgroundColor = "#000";
  });
  document.getElementById("dark").addEventListener("click", function () {
    chrome.storage.local.set({
      theme: "d"
    });
    document.body.style.backgroundColor = "#292A2D";
    document.getElementsByClassName("settings-content")[0].style.backgroundColor = "#292A2D";
  });
  document.getElementById("settingsb").addEventListener("click", function () {
    document.getElementsByClassName("ModalBackground")[0].style.animation = "fadein 0.5s linear forwards";
    document.getElementsByClassName("ModalBackground")[0].style.display = "block";
  });
  document.getElementsByClassName("ModalBackground")[0].addEventListener("click", function (a) {
    if (a.target == document.getElementsByClassName("ModalBackground")[0]) {
      document.getElementsByClassName("ModalBackground")[0].style.animation = "fadeout 0.5s linear forwards";
      setTimeout(() => {
        document.getElementsByClassName("ModalBackground")[0].style.display = "none";
      }, 500);
    }
  });
  document.getElementsByClassName("close")[0].addEventListener("click", function () {
    document.getElementsByClassName("ModalBackground")[0].style.animation = "fadeout 0.5s linear forwards";
    setTimeout(() => {
      document.getElementsByClassName("ModalBackground")[0].style.display = "none";
    }, 500);
  });
  document.getElementById("learnmore").addEventListener("click", function () {
    document.getElementsByClassName("lmco")[0].style.animation = "fadein 0.5s linear forwards";
    document.getElementsByClassName("lmco")[0].style.display = "block";
  });
  document.getElementsByClassName("lmco")[0].addEventListener("click", function (a) {
    if (a.target == document.getElementsByClassName("lmco")[0]) {
      document.getElementsByClassName("lmco")[0].style.animation = "fadeout 0.5s linear forwards";
      setTimeout(() => {
        document.getElementsByClassName("lmco")[0].style.display = "none";
      }, 500);
    }
  });
  document.getElementById("lmc").addEventListener("click", function () {
    document.getElementsByClassName("lmco")[0].style.animation = "fadeout 0.5s linear forwards";
    setTimeout(() => {
      document.getElementsByClassName("lmco")[0].style.display = "none";
    }, 500);
  });
  const a = document.getElementById("export-btn");
  const b = document.getElementById("import-btn");
  const c = document.getElementById("import-file-input");
  document.getElementById("export-btn").addEventListener("click", function () {
    const a = {
      depth: parseInt(document.getElementById("option-depth").value),
      elo: parseInt(document.getElementById("option-elo").value),
      matefindervalue: parseInt(document.getElementById("option-mate-finder-value").value),
      multipv: parseInt(document.getElementById("option-multipv").value),
      skill_level: parseInt(document.getElementById("option-skill-level").value),
      contempt: parseInt(document.getElementById("option-contempt").value),
      skill_level: parseInt(document.getElementById("option-skill-level").value),
      syzygyprobedepth: parseInt(document.getElementById("option-syzygyprobedepth").value),
      moveoverhead: parseInt(document.getElementById("option-moveoverhead").value),
      normalizefactor: parseInt(document.getElementById("option-normalizefactor").value),
      syzygyprobelimit: parseInt(document.getElementById("option-syzygyprobelimit").value),
      skill_level_prob: parseInt(document.getElementById("option-skill-level-prob").value),
      skill_level_error: parseInt(document.getElementById("option-skill-level-error").value),
      best_move_chance: parseInt(document.getElementById("option-best-move-chance").value),
      threads: 10,
      auto_move_time: parseInt(document.getElementById("option-auto-move-time").value),
      auto_move_time_random: parseInt(document.getElementById("option-auto-move-time-random").value),
      auto_move_time_random_div: parseInt(document.getElementById("option-auto-move-time-random-div").value),
      auto_move_time_random_multi: parseFloat(document.getElementById("option-auto-move-time-random-multi").value),
      max_legit_auto_move_depth: parseInt(document.getElementById("option-max-legit-auto-move-depth").value),
      random_best_move: document.getElementById("option-random-best-move").checked,
      chess960: document.getElementById("option-chess960").checked,
      aggressive_mode: document.getElementById("option-aggro").checked,
      defensive_mode: document.getElementById("option-defend").checked,
      torch: document.getElementById("option-torch").checked,
      highmatechance: document.getElementById("option-highmatechance").checked,
      limit_strength: document.getElementById("option-limit-strength").checked,
      syzygy50moverule: document.getElementById("option-syzygy50moverule").checked,
      pretty: document.getElementById("option-pretty").checked,
      normalize: document.getElementById("option-normalize").checked,
      stockfish11: document.getElementById("option-stockfish11").checked,
      stockfish16: document.getElementById("option-stockfish16").checked,
      legit_auto_move: document.getElementById("option-legit-auto-move").checked,
      show_hints: document.getElementById("option-show-hints").checked,
      text_to_speech: document.getElementById("option-text-to-speech").checked,
      move_analysis: document.getElementById("option-move-analysis").checked,
      depth_bar: document.getElementById("option-depth-bar").checked,
      evaluation_bar: document.getElementById("option-evaluation-bar").checked,
      use_nnue: document.getElementById("option-use-nnue").checked
    };
    const b = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(a));
    const c = document.createElement("a");
    c.setAttribute("href", b);
    c.setAttribute("download", "bettermint.config");
    document.body.appendChild(c);
    c.click();
    c.remove();
  });
  document.getElementById("import-btn").addEventListener("click", function () {
    document.getElementById("import-file-input").click();
  });
  document.getElementById("import-file-input").addEventListener("change", function () {
    const a = this.files[0];
    const b = new FileReader();
    b.onload = function (a) {
      const b = JSON.parse(a.target.result);
      document.getElementById("option-depth").value = b.depth;
      document.getElementById("option-elo").value = b.elo;
      document.getElementById("option-best-move-chance").value = b.best_move_chance;
      document.getElementById("option-mate-finder-value").value = b.matefindervalue;
      document.getElementById("option-multipv").value = b.multipv;
      document.getElementById("option-moveoverhead").value = b.moveoverhead;
      document.getElementById("option-skill-level").value = b.skill_level;
      document.getElementById("option-contempt").value = b.contempt;
      document.getElementById("option-skill-level").value = b.skill_level;
      document.getElementById("option-skill-level-prob").value = b.skill_level_prob;
      document.getElementById("option-skill-level-error").value = b.skill_level_error;
      document.getElementById("option-syzygyprobedepth").value = b.syzygyprobedepth;
      document.getElementById("option-normalizefactor").value = b.normalizefactor;
      document.getElementById("option-syzygyprobelimit").value = b.syzygyprobelimit;
      document.getElementById("option-pretty").value = b.pretty;
      document.getElementById("option-normalize").value = b.normalize;
      document.getElementById("option-syzygy50moverule").value = b.syzygy50moverule;
      document.getElementById("option-stockfish11").checked = b.stockfish11;
      document.getElementById("option-stockfish16").checked = b.stockfish16;
      document.getElementById("option-chess960").value = b.chess960;
      document.getElementById("option-limit-strength").value = b.limit_strength;
      document.getElementById("option-aggro").checked = b.aggressive_mode;
      document.getElementById("option-defend").checked = b.defensive_mode;
      document.getElementById("option-show-hints").checked = b.show_hints;
      document.getElementById("option-move-analysis").checked = b.move_analysis;
      document.getElementById("option-depth-bar").checked = b.depth_bar;
      document.getElementById("option-evaluation-bar").checked = b.evaluation_bar;
      document.getElementById("option-use-nnue").checked = b.use_nnue;
      document.getElementById("option-torch").checked = b.torch;
      document.getElementById("option-highmatechance").checked = b.highmatechance;
      document.getElementById("option-auto-move-time").value = b.auto_move_time;
      document.getElementById("option-auto-move-time-random").value = b.auto_move_time_random;
      document.getElementById("option-auto-move-time-random-div").value = b.auto_move_time_random_div;
      document.getElementById("option-auto-move-time-random-multi").value = b.auto_move_time_random_multi;
      document.getElementById("option-max-legit-auto-move-depth").value = b.max_legit_auto_move_depth;
      document.getElementById("option-random-best-move").checked = b.random_best_move;
      document.getElementById("option-legit-auto-move").checked = b.legit_auto_move;
      document.getElementById("option-text-to-speech").checked = b.text_to_speech;
      chrome.storage.sync.set(b);
      chrome.tabs.query({}, function (a) {
        a.forEach(function (a) {
          var c = {
            type: "UpdateOptions",
            data: b
          };
          chrome.tabs.sendMessage(a.id, c);
        });
      });
    };
    b.readAsText(a);
  });
};
document.addEventListener("DOMContentLoaded", P);