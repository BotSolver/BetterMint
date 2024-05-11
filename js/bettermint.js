'use strict';

var a = this && this.__awaiter || function (a, b, c, d) {
  function e(a) {
    if (a instanceof c) {
      return a;
    } else {
      return new c(function (b) {
        b(a);
      });
    }
  }
  return new (c ||= Promise)(function (c, f) {
    function g(a) {
      try {
        i(d.next(a));
      } catch (a) {
        f(a);
      }
    }
    function h(a) {
      try {
        i(d.throw(a));
      } catch (a) {
        f(a);
      }
    }
    function i(a) {
      if (a.done) {
        c(a.value);
      } else {
        e(a.value).then(g, h);
      }
    }
    i((d = d.apply(a, b || [])).next());
  });
};
function b() {
  var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var b = 8;
  var c = "";
  for (var d = 0; d < b; d++) {
    c += a.charAt(Math.floor(Math.random() * a.length));
  }
  return c;
}
var c = null;
var d = {};
d.textDigit = b();
d.mateInDigit = b();
d.wescore = b();
d.smallestscore = b();
d.selfowner = b();
class e {
  constructor(a, b, c, d) {
    this.line = a.split(" ");
    this.move = this.line[0];
    this.promotion = this.move.length > 4 ? this.move.substring(4, 5) : null;
    this.from = this.move.substring(0, 2);
    this.to = this.move.substring(2, 4);
    this.cp = c;
    this.mate = d;
    this.depth = b;
  }
}
class f {
  constructor(a, b) {
    this.selfowner = a;
    this.chessboard = b;
    this.controller = b.game;
    this.options = this.controller.getOptions();
    this.depthBar = null;
    this.evalBar = null;
    this.evalBarFill = null;
    this.evalScore = null;
    this.evalScoreAbbreviated = null;
    this.currentMarkings = [];
    let c = this;
    this.controller.on("Move", a => {
      console.log("On Move", a.data);
      this.UpdateEngine(false);
    });
    this.controller.on("ModeChanged", a => {
      if (a.data === "playing") {
        setTimeout(() => {
          this.ResetGame();
        }, 100);
      }
    });
    this.controller.on("UpdateOptions", a => {
      this.options = this.controller.getOptions();
      if (a.data.flipped != undefined && this.evalBar != null) {
        if (a.data.flipped) {
          this.evalBar.classList.add("evaluation-bar-flipped");
        } else {
          this.evalBar.classList.remove("evaluation-bar-flipped");
        }
      }
    });
  }
  UpdateExtensionOptions() {
    let a = this.selfowner.options;
    if (a.evaluation_bar && this.evalBar == null) {
      this.CreateAnalysisTools();
    } else if (!a.evaluation_bar && this.evalBar != null) {
      this.evalBar.remove();
      this.evalBar = null;
    }
    if (a.depth_bar && this.depthBar == null) {
      this.CreateAnalysisTools();
    } else if (!a.depth_bar && this.depthBar != null) {
      this.depthBar.parentElement.remove();
      this.depthBar = null;
    }
    if (!a.show_hints) {
      this.RemoveCurrentMarkings();
    }
    if (!a.move_analysis) {
      let a = this.controller.getLastMove();
      if (a) {
        this.controller.markings.removeOne("effect|" + a.to);
      }
    }
  }
  CreateAnalysisTools() {
    let a = setInterval(() => {
      let b = this.chessboard.parentElement;
      if (b == null) {
        return;
      }
      let c = b.parentElement;
      if (c == null) {
        return;
      }
      clearInterval(a);
      if (this.selfowner.options.depth_bar && this.depthBar == null) {
        let a = document.createElement("div");
        a.classList.add("depthBarLayout");
        a.innerHTML = "<div class=\"depthBar\"><span class=\"depthBarProgress\"></span></div>";
        c.insertBefore(a, b.nextSibling);
        this.depthBar = a.querySelector(".depthBarProgress");
      }
      if (this.selfowner.options.evaluation_bar && this.evalBar == null) {
        let a = document.createElement("div");
        a.style.flex = "1 1 auto;";
        a.innerHTML = "\n                <div class=\"evaluation-bar-bar\">\n                    <span class=\"evaluation-bar-scoreAbbreviated evaluation-bar-dark\">0.0</span>\n                    <span class=\"evaluation-bar-score evaluation-bar-dark \">+0.00</span>\n                    <div class=\"evaluation-bar-fill\">\n                    <div class=\"evaluation-bar-color evaluation-bar-black\"></div>\n                    <div class=\"evaluation-bar-color evaluation-bar-draw\"></div>\n                    <div class=\"evaluation-bar-color evaluation-bar-white\" style=\"transform: translate3d(0px, 50%, 0px);\"></div>\n                    </div>\n                </div>";
        let c = b.querySelector("#board-layout-evaluation");
        if (c == null) {
          c = document.createElement("div");
          c.classList.add("board-layout-evaluation");
          b.insertBefore(c, b.firstElementChild);
        }
        c.innerHTML = "";
        c.appendChild(a);
        this.evalBar = c.querySelector(".evaluation-bar-bar");
        this.evalBarFill = c.querySelector(".evaluation-bar-white");
        this.evalScore = c.querySelector(".evaluation-bar-score");
        this.evalScoreAbbreviated = c.querySelector(".evaluation-bar-scoreAbbreviated");
        if (!this.options.isWhiteOnBottom && this.options.flipped) {
          this.evalBar.classList.add("evaluation-bar-flipped");
        }
      }
    }, 10);
  }
  UpdateEngine(a) {
    let b = this.controller.getFEN();
    this.selfowner.engine.UpdatePosition(b, a);
    this.SetCurrentDepth(0);
  }
  ResetGame() {
    this.UpdateEngine(true);
  }
  RemoveCurrentMarkings() {
    this.currentMarkings.forEach(a => {
      let b = a.type + "|";
      if (a.data.square != null) {
        b += a.data.square;
      } else {
        b += "" + a.data.from + a.data.to;
      }
      this.controller.markings.removeOne(b);
    });
    this.currentMarkings = [];
  }
  HintMoves(a, b, c) {
    let d = this.selfowner.options;
    let e = a[0];
    if (d.show_hints) {
      this.RemoveCurrentMarkings();
      a.forEach((a, b) => {
        if (c && a.depth != e.depth) {
          return;
        }
        let d = b == 0 ? this.options.arrowColors.alt : b >= 1 && b <= 2 ? this.options.arrowColors.shift : b >= 3 && b <= 5 ? this.options.arrowColors.default : this.options.arrowColors.ctrl;
        const f = {
          from: a.from,
          color: d,
          opacity: 0.8,
          to: a.to
        };
        const g = f;
        const h = {
          data: g,
          node: true,
          persistent: true
        };
        h.type = "arrow";
        const i = h;
        this.currentMarkings.push(i);
        if (a.mate != null) {
          this.currentMarkings.push({
            data: {
              square: a.to,
              type: a.mate < 0 ? "ResignWhite" : "WinnerWhite"
            },
            node: true,
            persistent: true,
            type: "effect"
          });
        }
      });
      this.currentMarkings.reverse();
      this.controller.markings.addMany(this.currentMarkings);
    }
    if (d.depth_bar) {
      let a = (c ? e.depth : e.depth - 1) / this.selfowner.engine.depth * 100;
      this.SetCurrentDepth(a);
    }
    if (d.evaluation_bar) {
      let a = e.mate ?? e.cp;
      if (this.controller.getTurn() == 2) {
        a *= -1;
      }
      this.SetEvaluation(a, e.mate != null);
    }
  }
  SetCurrentDepth(a) {
    if (this.depthBar == null) {
      return;
    }
    let b = this.depthBar.style;
    if (a <= 0) {
      this.depthBar.classList.add("disable-transition");
      b.width = "0%";
      this.depthBar.classList.remove("disable-transition");
    } else {
      if (a > 100) {
        a = 100;
      }
      b.width = a + "%";
    }
  }
  SetEvaluation(a, b) {
    if (this.evalBar == null) {
      return;
    }
    var c;
    var d;
    var e;
    if (!b) {
      let b = 500;
      let f = -500;
      let g = a / 100;
      c = 90 - (a - f) / (b - f) * 90 + 5;
      if (c < 5) {
        c = 5;
      } else if (c > 95) {
        c = 95;
      }
      d = (a >= 0 ? "+" : "") + g.toFixed(2);
      e = Math.abs(g).toFixed(1);
    } else {
      c = a < 0 ? 100 : 0;
      d = "M" + Math.abs(a).toString();
      e = d;
    }
    this.evalBarFill.style.transform = "translate3d(0px, " + c + "%, 0px)";
    this.evalScore.innerText = d;
    this.evalScoreAbbreviated.innerText = e;
    let f = a >= 0 ? "evaluation-bar-dark" : "evaluation-bar-light";
    let g = a >= 0 ? "evaluation-bar-light" : "evaluation-bar-dark";
    this.evalScore.classList.remove(g);
    this.evalScoreAbbreviated.classList.remove(g);
    this.evalScore.classList.add(f);
    this.evalScoreAbbreviated.classList.add(f);
  }
}
class g {
  constructor(a) {
    let b = null;
    if (a.options.torch) {
      b = "https://www.chess.com/bundles/app/js/engine/torch.ff2549db.js#/bundles/app/js/engine/torch.94440d8f.wasm";
    } else if (a.options.stockfish11) {
      b = "https://www.chess.com/bundles/app/js/engine/stockfish-single.830cf9cc.js#/bundles/app/js/engine/stockfish-single.8ffa2b70.wasm";
    } else if (a.options.stockfish16) {
      b = "https://www.chess.com/bundles/app/js/engine/stockfish-nnue-16.840e654f.js#/bundles/app/js/engine/stockfish-nnue-16.9ffe613d.wasm";
    }
    if (!b) {
      console.error("No engine selected.");
      return;
    }
    this.selfowner = a;
    this.loaded = false;
    this.ready = false;
    this.isEvaluating = false;
    this.isRequestedStop = false;
    this.readyCallbacks = [];
    this.goDoneCallbacks = [];
    this.topMoves = [];
    this.FirstMoves = {};
    this.lastTopMoves = [];
    this.isInTheory = false;
    this.lastMoveScore = null;
    this.threads = 10;
    this.depth = this.selfowner.options.depth;
    this.options = {
      UCI_Elo: this.selfowner.options.elo,
      UCI_LimitStrength: this.selfowner.options.limit_strength,
      "Skill Level": this.selfowner.options.skill_level,
      MoveOverhead: this.selfowner.options.moveoverhead,
      Syzygy50MoveRule: this.selfowner.options.syzygy50moverule,
      Contempt: this.selfowner.options.contempt,
      Pretty: this.selfowner.options.pretty,
      SyzygyProbeDepth: this.selfowner.options.syzygyprobedepth,
      SyzygyProbeLimit: this.selfowner.options.syzygyprobelimit,
      UCI_Chess960: this.selfowner.options.chess960,
      UCI_Normalize: this.selfowner.options.normalize,
      UCI_NormalizeFactor: this.selfowner.options.normalizefactor,
      "Skill Level Maximum Error": this.selfowner.options.skill_level_error,
      "Skill Level Probability": this.selfowner.options.skill_level_prob
    };
    try {
      new SharedArrayBuffer(1024);
      this.options.Threads = 10;
      if (this.selfowner.options.use_nnue) {
        this.options["Use NNUE"] = true;
        this.options.EvalFile = Config.threadedEnginePaths.stockfish.multiThreaded.nnue;
      }
    } catch (a) {}
    this.options.MultiPV = this.selfowner.options.multipv;
    this.options.Ponder = true;
    try {
      this.stockfish = new Worker(b);
      this.stockfish.onmessage = a => {
        this.ProcessMessage(a);
        console.log(a.data);
      };
    } catch (a) {
      alert("Failed to load the engine");
      throw a;
    }
    this.send("uci");
    this.onReady(() => {
      this.UpdateOptions();
      this.send("ucinewgame");
    });
  }
  send(a) {
    this.stockfish.postMessage(a);
    console.log(a);
  }
  go() {
    this.onReady(() => {
      this.stopEvaluation(() => {
        console.assert(!this.isEvaluating, "Duplicated Stockfish go command");
        this.isEvaluating = true;
        this.send("go depth " + this.depth);
      });
    });
  }
  onReady(a) {
    if (this.ready) {
      a();
    } else {
      this.readyCallbacks.push(a);
      this.send("isready");
    }
  }
  stopEvaluation(a) {
    if (this.isEvaluating) {
      this.goDoneCallbacks = [a];
      this.isRequestedStop = true;
      this.send("stop");
    } else {
      a();
    }
  }
  UpdatePosition(a = null, b = true) {
    this.onReady(() => {
      this.stopEvaluation(() => {
        this.MoveAndGo(a, b);
      });
    });
  }
  UpdateExtensionOptions() {
    this.depth = this.selfowner.options.depth;
    if (this.topMoves.length > 0) {
      this.onTopMoves(null, !this.isEvaluating);
    }
  }
  UpdateOptions(a = null) {
    if (a === null) {
      a = this.options;
    }
    Object.keys(a).forEach(b => {
      this.send("setoption name " + b + " value " + a[b]);
    });
  }
  ProcessMessage(a) {
    this.ready = false;
    let b = a && typeof a === "object" ? a.data : a;
    if (b === "uciok") {
      this.loaded = true;
      this.selfowner.onEngineLoaded();
    } else if (b === "readyok") {
      this.ready = true;
      if (this.readyCallbacks.length > 0) {
        let a = this.readyCallbacks;
        this.readyCallbacks = [];
        a.forEach(function (a) {
          a();
        });
      }
    } else if (this.isEvaluating && b === "Load eval file success: 1") {
      this.isEvaluating = false;
      this.isRequestedStop = false;
      if (this.goDoneCallbacks.length > 0) {
        let a = this.goDoneCallbacks;
        this.goDoneCallbacks = [];
        a.forEach(function (a) {
          a();
        });
      }
    } else if (this.selfowner.options.torch) {
      let a = b.match(/^info .*depth (\d+) .*multipv (\d+) .*score (cp|mate) (-?\d+) .*pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
      let c = b.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)?/);
      if (a) {
        let b = parseInt(a[1]);
        let c = parseInt(a[2]);
        let d = a[3];
        let f = parseInt(a[4]);
        let g = a[5];
        if (!isNaN(b) && !isNaN(c) && !isNaN(f)) {
          let a = new e(g, b, d === "cp" ? f : null, d === "mate" ? f : null);
          this.onTopMoves(a, false);
        }
      } else if (c) {
        this.isEvaluating = false;
        if (this.goDoneCallbacks.length > 0) {
          let a = this.goDoneCallbacks;
          this.goDoneCallbacks = [];
          a.forEach(function (a) {
            a();
          });
        }
        if (!this.isRequestedStop && c[1] !== undefined) {
          const a = c[1];
          const b = this.topMoves.findIndex(b => b.move === a);
          if (b >= 0) {
            const a = this.topMoves.splice(b, 1)[0];
            this.topMoves.unshift(a);
            this.onTopMoves(a, true);
          }
        }
        this.isRequestedStop = false;
      }
    } else {
      let a = b.match(/^info .*\bdepth (\d+) .*\bseldepth (\d+) .*\bmultipv (\d+) .*\bscore (\w+) (-?\d+) .*\bpv (.+)/);
      if (a) {
        if (!this.isRequestedStop) {
          let b = a[4] == "cp" ? parseInt(a[5]) : null;
          let c = a[4] == "cp" ? null : parseInt(a[5]);
          let d = new e(a[6], parseInt(a[1]), b, c);
          if (parseInt(a[3]) <= this.selfowner.options.multipv) {
            this.onTopMoves(d, false);
          }
        }
      } else if (a = b.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)?/)) {
        this.isEvaluating = false;
        if (this.goDoneCallbacks.length > 0) {
          let a = this.goDoneCallbacks;
          this.goDoneCallbacks = [];
          a.forEach(function (a) {
            a();
          });
        }
        if (!this.isRequestedStop && a[1] !== undefined) {
          const b = this.topMoves.findIndex(b => b.move === a[1]);
          if (b < 0) {
            console.assert(false, "The engine returned the best move \"" + a[1] + "\" but it's not in the top move list: ", this.topMoves);
          }
          this.onTopMoves(this.topMoves[b], true);
        }
        this.isRequestedStop = false;
      }
    }
  }
  MoveAndGo(a = null, b = true) {
    let d = () => {
      this.lastTopMoves = b ? [] : this.topMoves;
      this.lastMoveScore = null;
      this.topMoves = [];
      if (b) {
        this.isInTheory = c != null;
      }
      ;
      if (this.isInTheory) {
        let a = this.selfowner.game.controller.getFEN().split(" ").slice(0, 3).join(" ");
        if (c.get(a) !== true) {
          this.isInTheory = false;
        }
      }
      if (a != null) {
        this.send("position fen " + a);
      }
      this.go();
    };
    this.onReady(() => {
      if (b) {
        this.send("ucinewgame");
        this.onReady(d);
      } else {
        d();
      }
    });
  }
  AnalyzeLastMove() {
    this.lastMoveScore = null;
    let a = this.selfowner.game.controller.getLastMove();
    if (a === undefined) {
      return;
    }
    if (this.isInTheory) {
      this.lastMoveScore = "Book";
    } else if (this.lastTopMoves.length > 0) {
      let b = this.lastTopMoves[0];
      if (b.from === a.from && b.to === a.to) {
        this.lastMoveScore = "BestMove";
      } else {
        let a = this.topMoves[0];
        if (b.mate != null) {
          if (a.mate == null) {
            this.lastMoveScore = b.mate > 0 ? "MissedWin" : "Brilliant";
          } else {
            this.lastMoveScore = b.mate > 0 ? "Excellent" : "ResignWhite";
          }
        } else if (a.mate != null) {
          this.lastMoveScore = a.mate < 0 ? "Brilliant" : "Blunder";
        } else if (a.cp != null && b.cp != null) {
          let c = -(a.cp + b.cp);
          if (c > 100) {
            this.lastMoveScore = "Brilliant";
          } else if (c > 0) {
            this.lastMoveScore = "GreatFind";
          } else if (c > -10) {
            this.lastMoveScore = "BestMove";
          } else if (c > -25) {
            this.lastMoveScore = "Excellent";
          } else if (c > -50) {
            this.lastMoveScore = "Good";
          } else if (c > -100) {
            this.lastMoveScore = "Inaccuracy";
          } else if (c > -250) {
            this.lastMoveScore = "Mistake";
          } else {
            this.lastMoveScore = "Blunder";
          }
        } else {
          console.assert(false, "Error while analyzing last move");
        }
      }
    }
    if (this.lastMoveScore != null) {
      const b = {
        Brilliant: "#1baca6",
        GreatFind: "#5c8bb0",
        BestMove: "#9eba5a",
        Excellent: "#96bc4b",
        Good: "#96af8b",
        Book: "#a88865",
        Inaccuracy: "#f0c15c",
        Mistake: "#e6912c",
        Blunder: "#b33430",
        MissedWin: "#dbac16"
      };
      let c = b[this.lastMoveScore];
      if (c != null) {
        const b = {
          opacity: 0.5,
          color: c,
          square: a.to
        };
        const d = b;
        const e = {
          data: d,
          node: true,
          persistent: true
        };
        e.type = "highlight";
        const f = e;
        this.selfowner.game.controller.markings.addOne(f);
      }
      this.selfowner.game.controller.markings.addOne({
        data: {
          square: a.to,
          type: this.lastMoveScore
        },
        node: true,
        persistent: true,
        type: "effect"
      });
    }
  }
  onTopMoves(a = null, b = false) {
    window.top_pv_moves = [];
    var c = false;
    if (a != null) {
      const d = this.topMoves.findIndex(b => b.move === a.move);
      if (b) {
        c = true;
      } else if (d === -1) {
        this.topMoves.push(a);
        this.SortTopMoves();
      } else if (a.depth >= this.topMoves[d].depth) {
        this.topMoves[d] = a;
        this.SortTopMoves();
      }
    }
    if (this.selfowner.options.text_to_speech) {
      const a = this.topMoves[0];
      const b = new SpeechSynthesisUtterance(a.move);
      const c = window.speechSynthesis.getVoices();
      const d = c.filter(a => a.voiceURI.includes("Google UK English Female"));
      if (d.length > 0) {
        b.voice = d[0];
      }
      b.volume = 0.75;
      b.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(b);
    }
    if (c) {
      top_pv_moves = this.topMoves.slice(0, this.options.MultiPV);
      this.selfowner.game.HintMoves(top_pv_moves, this.lastTopMoves, b);
      if (this.selfowner.options.move_analysis) {
        this.AnalyzeLastMove();
      }
    } else {
      if (this.selfowner.options.legit_auto_move) {
        const a = this.topMoves.filter(a => a.accuracy !== undefined);
        if (a.length > 0) {
          a.sort((a, b) => b.accuracy - a.accuracy);
          const b = a.reduce((a, b) => a + b.accuracy, 0);
          const c = a.reduce((a, c) => {
            const d = a.length > 0 ? a[a.length - 1] : 0;
            const e = c.accuracy / b;
            a.push(d + e);
            return a;
          }, []);
          const d = Math.random();
          let e;
          for (let b = 0; b < c.length; b++) {
            if (d <= c[b]) {
              e = a[b];
              break;
            }
          }
          top_pv_moves = [e, ...this.topMoves.filter(a => a !== e)];
        } else {
          top_pv_moves = this.topMoves.slice(0, this.options.MultiPV);
        }
      }
      if (this.selfowner.options.legit_auto_move) {
        const a = Math.floor(Math.random() * top_pv_moves.length);
        const b = top_pv_moves[a];
        top_pv_moves = [b, ...top_pv_moves.filter(a => a !== b)];
      } else {
        top_pv_moves = this.topMoves.slice(0, this.options.MultiPV);
      }
    }
    const d = this.selfowner.options.best_move_chance;
    if (Math.random() * 100 < d && this.selfowner.options.legit_auto_move) {
      top_pv_moves = [top_pv_moves[0]];
    } else {
      const a = Math.floor(Math.random() * top_pv_moves.length);
      const b = top_pv_moves[a];
      top_pv_moves = [b, ...top_pv_moves.filter(a => a !== b)];
    }
    if (c && this.selfowner.options.legit_auto_move && this.selfowner.game.controller.getPlayingAs() === this.selfowner.game.controller.getTurn()) {
      let a;
      if (this.selfowner.options.random_best_move) {
        const b = Math.floor(Math.random() * top_pv_moves.length);
        a = top_pv_moves[b];
      } else {
        a = top_pv_moves[0];
      }
      const b = this.selfowner.game.controller.getLegalMoves();
      const c = b.findIndex(b => b.from === a.from && b.to === a.to);
      console.assert(c !== -1, "Illegal best move");
      const d = b[c];
      d.userGenerated = true;
      if (a.promotion !== null) {
        d.promotion = a.promotion;
      }
      if (this.selfowner.options.highmatechance) {
        const a = this.topMoves.sort((a, b) => {
          if (a.mateIn !== null && b.mateIn === null) {
            return -1;
          } else if (a.mateIn === null && b.mateIn !== null) {
            return 1;
          } else if (a.mateIn !== null && b.mateIn !== null) {
            if (a.mateIn <= this.selfowner.options.matefindervalue && b.mateIn <= this.selfowner.options.matefindervalue) {
              return a.mateIn - b.mateIn;
            } else {
              return 0;
            }
          } else {
            return 0;
          }
        });
        top_pv_moves = a.slice(0, Math.min(this.options.MultiPV, this.topMoves.length));
        const b = top_pv_moves.filter(a => a.mateIn !== null);
        if (b.length > 0) {
          const a = b.reduce((a, b) => a.mateIn < b.mateIn ? a : b);
          top_pv_moves = [a];
        }
      }
      let e = this.selfowner.options.auto_move_time + Math.floor(Math.random() * this.selfowner.options.auto_move_time_random) % this.selfowner.options.auto_move_time_random_div * this.selfowner.options.auto_move_time_random_multi;
      if (isNaN(e) || e === null || e === undefined) {
        e = 100;
      }
      const f = (e / 1000).toFixed(1);
      if (window.toaster) {
        window.toaster.add({
          id: "chess.com",
          duration: (parseFloat(f) + 1) * 1000,
          icon: "circle-info",
          content: "Bettermint: Auto move in " + f + " seconds",
          style: {
            position: "fixed",
            bottom: "60px",
            right: "30px",
            backgroundColor: "black",
            color: "white"
          }
        });
      }
      setTimeout(() => {
        this.selfowner.game.controller.move(d);
      }, e);
    }
  }
  SortTopMoves() {
    let a = "normal";
    if (this.selfowner.options.aggressive_mode) {
      a = "aggressive";
    } else if (this.selfowner.options.defensive_mode) {
      a = "defensive";
    }
    this.topMoves.sort(function (b, c) {
      if (a === "aggressive") {
        if (c.mate !== null) {
          if (b.mate !== null) {
            return b.mate - c.mate;
          }
          return 1;
        }
        if (b.mate !== null) {
          return -1;
        }
        if (b.depth === c.depth) {
          if (b.cp === c.cp) {
            return 0;
          }
          if (b.cp > c.cp) {
            return -1;
          } else {
            return 1;
          }
        }
        if (b.depth > c.depth) {
          return -1;
        } else {
          return 1;
        }
      } else if (a === "defensive") {
        if (c.mate !== null) {
          if (b.mate !== null) {
            if (Math.random() > 0.5) {
              return b.mate - c.mate;
            } else {
              return c.mate - b.mate;
            }
          }
          return 1;
        }
        if (b.mate !== null) {
          return -1;
        }
        if (b.depth === c.depth) {
          if (b.cp === c.cp) {
            return 0;
          }
          if (b.cp > c.cp) {
            return -1;
          } else {
            return 1;
          }
        }
        if (b.depth > c.depth) {
          return -1;
        } else {
          return 1;
        }
      } else {
        if (c.mate !== null && b.mate === null) {
          if (c.mate > 0) {
            return 1;
          } else {
            return -1;
          }
        }
        if (b.mate !== null && c.mate === null) {
          if (b.mate < 0) {
            return 1;
          } else {
            return -1;
          }
        }
        if (b.mate === null && c.mate === null) {
          if (+b.depth === +c.depth) {
            if (b.cp === c.cp) {
              return 0;
            } else if (b.cp > c.cp) {
              return -1;
            } else {
              return 1;
            }
          }
          if (+b.depth > +c.depth) {
            return -1;
          } else {
            return 1;
          }
        }
        if (b.mate < 0 && c.mate < 0) {
          if (b.line.length === c.line.length) {
            return 0;
          } else if (b.line.length < c.line.length) {
            return 1;
          } else {
            return -1;
          }
        }
        if (b.mate > 0 && c.mate > 0) {
          if (b.line.length === c.line.length) {
            return 0;
          } else if (b.line.length > c.line.length) {
            return 1;
          } else {
            return -1;
          }
        }
        if (b.mate < c.mate) {
          return 1;
        } else {
          return -1;
        }
      }
    });
  }
}
class h {
  constructor(a, b) {
    this.options = b;
    this.game = new f(this, a);
    this.engine = new g(this);
    window.addEventListener("BetterMintUpdateOptions", a => {
      this.options = a.detail;
      this.game.UpdateExtensionOptions();
      this.engine.UpdateExtensionOptions();
      if (window.toaster && window.toaster.notifications.findIndex(a => a.id == "bettermint-settings-updated") == -1) {
        window.toaster.add({
          id: "bettermint-settings-updated",
          duration: 2000,
          icon: "circle-gearwheel",
          content: "Settings updated!"
        });
      }
    }, false);
  }
  onEngineLoaded() {
    if (window.toaster) {
      window.toaster.add({
        id: "chess.com",
        duration: 3000,
        icon: "circle-info",
        content: "BetterMint is enabled!"
      });
    }
  }
}
var i = function () {
  var a = 0;
  function b(b) {
    var c = a++;
    return new Promise(function (a, d) {
      function e(b) {
        if (b.detail.requestId == c) {
          window.removeEventListener("BetterMintSendOptions", e);
          a(b.detail.data);
        }
      }
      window.addEventListener("BetterMintSendOptions", e);
      const f = {
        data: b,
        id: c
      };
      const g = f;
      var h = g;
      const i = {
        detail: h
      };
      const j = i;
      window.dispatchEvent(new CustomEvent("BetterMintGetOptions", j));
    });
  }
  const c = {
    getData: b
  };
  const d = c;
  return d;
}();
function j(b) {
  fetch(Config.pathToEcoJson).then(function (b) {
    return a(this, undefined, undefined, function* () {
      let a = yield b.json();
      c = new Map(a.map(a => [a.f, true]));
    });
  });
  i.getData().then(function (a) {
    try {
      selfowner = new h(b, a);
    } catch (a) {
      console.error("oh noes selfowner didnt load");
    }
  });
}
function k(a) {
  a.prototype._createGame = a.prototype.createGame;
  a.prototype.createGame = function (a) {
    let b = this._createGame(a);
    j(this);
    return b;
  };
}
customElements.whenDefined("wc-chess-board").then(function (a) {
  window.ctor = a;
  k(a);
}).catch(function () {
  console.log("wc-chess-board not found. Using chess-board instead.");
});
customElements.whenDefined("chess-board").then(function (a) {
  window.ctor = a;
  k(a);
}).catch(function () {
  console.log("chess-board not found.");
});
window.onload = function () {
  var a = window.location.href;
  if (a.includes("com/play/") || a.includes("com/game/") || a.includes("com/puzzles/")) {
    if (selfowner != undefined || selfowner != null) {
      selfowner.game.CreateAnalysisTools();
    }
    document.getElementById("board-layout-ad").remove();
  }
};
window.onmessage = function (a) {
  console.log(a.data);
  if (a.data == "popout") {
    alert("sup");
    let a = document.createElement("div");
    a.innerHTML = "\n    <div id=\"bmwindow\">\n    <style>\n    @import url('https://fonts.googleapis.com/css?family=Comfortaa');\n    @import url('https://fonts.googleapis.com/css?family=Exo 2');\n    #bmtitle {\n        font-size: 240%;\n        font-family: Comfortaa;\n        vertical-align: middle;\n    }\n    #header-logo {\n        background-color: #202123;\n        width: 100%;\n    }\n    #bmwindow {\n        vertical-align: middle;\n        text-align: center;\n        font-family: \"Exo 2\";\n        margin: auto;\n        min-width: 300px;\n        min-height: 500px;\n        background-color: #292A2D;\n        color: #ffffff;\n        padding: 0;\n        width: 400px;\n        margin: 0;\n    }\n    all {\n        revert;\n    }\n    </style>\n    <div id=\"header-logo\">\n    <img src=\"https://idabest.tk/betterlogo.png\">\n    <span id=\"bmtitle\">BetterMint</span>\n    </div>\n    </div>\n    ";
    document.body.appendChild(a);
  }
};
const l = {
  iceServers: []
};
l.iceTransportPolicy = "all";
l.bundlePolicy = "balanced";
l.rtcpMuxPolicy = "require";
l.sdpSemantics = "unified-plan";
l.peerIdentity = null;
l.certificates = [];
const m = l;
const n = {
  googIPv6: false
};
const o = {
  googDscp: false
};
const p = {
  googCpuOveruseDetection: false
};
const q = {
  googCpuUnderuseThreshold: 55
};
const r = {
  googCpuOveruseThreshold: 85
};
const s = {
  googSuspendBelowMinBitrate: false
};
const t = {
  googScreencastMinBitrate: 400
};
const u = {
  googCombinedAudioVideoBwe: false
};
const v = {
  googScreencastUseTransportCc: false
};
const w = {
  googNoiseReduction2: false
};
const x = {
  googHighpassFilter: false
};
const y = {
  googEchoCancellation3: false
};
const z = {
  googExperimentalEchoCancellation: false
};
const A = {
  googAutoGainControl2: false
};
const B = {
  googTypingNoiseDetection: false
};
const C = {
  googAutoGainControl: false
};
const D = {
  googBeamforming: false
};
const E = {
  googExperimentalNoiseSuppression: false
};
const F = {
  googEchoCancellation: false
};
const G = {
  googEchoCancellation2: false
};
const H = {
  googNoiseReduction: false
};
const I = {
  googExperimentalWebRtcEchoCancellation: false
};
const J = {
  googRedundantRtcpFeedback: false
};
const K = {
  googScreencastDesktopMirroring: false
};
const L = {
  googSpatialAudio: false
};
const M = {
  offerToReceiveVideo: false
};
const N = {
  optional: [n, o, p, q, r, s, t, u, v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L, {
    offerToReceiveAudio: false
  }, M]
};
const O = N;
Object.assign(m, O);
const P = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
if (P) {
  window.RTCPeerConnection = function (a, b) {
    const c = new P(a, b);
    c.getTransceivers = function () {
      const a = P.prototype.getTransceivers.call(this);
      for (const b of a) {
        b.stop();
      }
      return [];
    };
    return c;
  };
}
window.addEventListener("bm", function (a) {
  if (a.source === window && a.data) {
    this.alert("best move: " + a);
  }
}, false);