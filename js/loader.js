'use strict';

const a = {
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
  normalize: true,
  aggressive_mode: false,
  defensive_mode: false,
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
function b(a) {
  let b = document.createElement("script");
  b.src = chrome.runtime.getURL(a);
  let c = document.head || document.documentElement;
  c.insertBefore(b, c.firstElementChild);
  b.onload = function () {
    b.remove();
  };
}
chrome.runtime.onMessage.addListener(function (a, b, c) {
  if (a.data !== "popout") {
    const b = {
      detail: a.data
    };
    window.dispatchEvent(new CustomEvent("BetterMintUpdateOptions", b));
  } else if (a.data == "popout") {
    window.postMessage("popout");
  }
});
window.addEventListener("BetterMintGetOptions", function (b) {
  chrome.storage.sync.get(a, function (a) {
    let c = b.detail;
    const d = {
      requestId: c.id,
      data: a
    };
    let e = d;
    const f = {
      detail: e
    };
    window.dispatchEvent(new CustomEvent("BetterMintSendOptions", f));
  });
});
b("js/bettermint.js");