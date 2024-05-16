"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };

var ChromeRequest = (function () {
  // Options listener and sender
  var requestId = 0;
  function getData(data) {
    var id = requestId++;
    return new Promise(function (resolve, reject) {
      var listener = function (evt) {
        if (evt.detail.requestId == id) {
          // Deregister self
          window.removeEventListener("BetterMintSendOptions", listener);
          resolve(evt.detail.data);
        }
      };
      window.addEventListener("BetterMintSendOptions", listener);
      var payload = {
        data: data,
        id: id,
      };
      window.dispatchEvent(
        new CustomEvent("BetterMintGetOptions", { detail: payload })
      );
    });
  }
  return { getData: getData };
})();

function getGradientColor(start_color, end_color, percent) {
  // strip the leading # if it's there
  start_color = start_color.replace(/^\s*#|\s*$/g, "");
  end_color = end_color.replace(/^\s*#|\s*$/g, "");

  // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
  if (start_color.length == 3) {
    start_color = start_color.replace(/(.)/g, "$1$1");
  }

  if (end_color.length == 3) {
    end_color = end_color.replace(/(.)/g, "$1$1");
  }

  // get colors
  var start_red = parseInt(start_color.substr(0, 2), 16),
    start_green = parseInt(start_color.substr(2, 2), 16),
    start_blue = parseInt(start_color.substr(4, 2), 16);

  var end_red = parseInt(end_color.substr(0, 2), 16),
    end_green = parseInt(end_color.substr(2, 2), 16),
    end_blue = parseInt(end_color.substr(4, 2), 16);

  // calculate new color
  var diff_red = end_red - start_red;
  var diff_green = end_green - start_green;
  var diff_blue = end_blue - start_blue;

  diff_red = (diff_red * percent + start_red).toString(16).split(".")[0];
  diff_green = (diff_green * percent + start_green).toString(16).split(".")[0];
  diff_blue = (diff_blue * percent + start_blue).toString(16).split(".")[0];

  // ensure 2 digits by color
  if (diff_red.length == 1) diff_red = "0" + diff_red;
  if (diff_green.length == 1) diff_green = "0" + diff_green;
  if (diff_blue.length == 1) diff_blue = "0" + diff_blue;

  return "#" + diff_red + diff_green + diff_blue;
}

var enumOptions = {
  UrlApiStockfish: "option-url-api-stockfish",
  ApiStockfish: "option-api-stockfish",
  NumCores: "option-num-cores",
  HashtableRam: "option-hashtable-ram",
  Depth: "option-depth",
  MateFinderValue: "option-mate-finder-value",
  MultiPV: "option-multipv",
  HighMateChance: "option-highmatechance",
  AutoMoveTime: "option-auto-move-time",
  AutoMoveTimeRandomDiv: "option-auto-move-time-random-div",
  AutoMoveTimeRandomMulti: "option-auto-move-time-random-multi",
  LegitAutoMove: "option-legit-auto-move",
  BestMoveChance: "option-best-move-chance",
  RandomBestMove: "option-random-best-move",
  ShowHints: "option-show-hints",
  TextToSpeech: "option-text-to-speech",
  MoveAnalysis: "option-move-analysis",
  DepthBar: "option-depth-bar",
  EvaluationBar: "option-evaluation-bar",
};

var BetterMintmaster;
var Config = undefined;
var context = undefined;
var eTable = null;

var tempOptions = {};
ChromeRequest.getData().then(function (options) {
  tempOptions = options;
});
function getValueConfig(key) {
  if (BetterMintmaster == undefined) return tempOptions[key];
  return BetterMintmaster.options[key];
}

class TopMove {
  constructor(line, depth, cp, mate) {
    this.line = line.split(" ");
    this.move = this.line[0];
    this.promotion = this.move.length > 4 ? this.move.substring(4, 5) : null;
    this.from = this.move.substring(0, 2);
    this.to = this.move.substring(2, 4);
    this.cp = cp;
    this.mate = mate;
    this.depth = depth;
  }
}

class GameController {
  constructor(BetterMintmaster, chessboard) {
    this.BetterMintmaster = BetterMintmaster;
    this.chessboard = chessboard;
    this.controller = chessboard.game;
    this.options = this.controller.getOptions();
    this.depthBar = null;
    this.evalBar = null;
    this.evalBarFill = null;
    this.evalScore = null;
    this.evalScoreAbbreviated = null;
    this.currentMarkings = [];
    let self = this;
    this.controller.on("Move", (event) => {
      console.log("On Move", event.data);
      this.UpdateEngine(false);
    });
    // check if a new game has started
    if (this.evalBar == null && getValueConfig(enumOptions.EvaluationBar)) {
      this.CreateAnalysisTools();
    }
        // check if a new game has started
        this.controller.on('ModeChanged', (event) => {
          if (event.data === "playing") {
              // at this point, the fen notation isn't updated yet, we should delay this
              setTimeout(() => {
                  this.ResetGame();
                  BetterMintmaster.game.RefreshEvalutionBar();
              }, 100)
          }
      });
    let checkEventOne = false;
    this.controller.on("RendererSet", (event) => {
        setTimeout(() => {
            this.ResetGame();
            this.RefreshEvalutionBar();
            checkEventOne = true;
        }, 1000);
    });
    setTimeout(() => {
        if(!checkEventOne){
            this.controller.on("ResetGame", (event) => {
              this.ResetGame();
              this.RefreshEvalutionBar();
            });
        }
    }, 1100);
    // this.controller.onAll((event) => {
    //   console.log("OnAll", event);
    // });

    this.controller.on("UpdateOptions", (event) => {
      this.options = this.controller.getOptions();
      if (event.data.flipped != undefined && this.evalBar != null) {
        if (event.data.flipped)
          this.evalBar.classList.add("evaluation-bar-flipped");
        else this.evalBar.classList.remove("evaluation-bar-flipped");
      }
    });
  }
  UpdateExtensionOptions() {
    if (getValueConfig(enumOptions.EvaluationBar) && this.evalBar == null)
      this.CreateAnalysisTools();
    else if (
      !getValueConfig(enumOptions.EvaluationBar) &&
      this.evalBar != null
    ) {
      this.evalBar.remove();
      this.evalBar = null;
    }
    if (getValueConfig(enumOptions.DepthBar) && this.depthBar == null)
      this.CreateAnalysisTools();
    else if (!getValueConfig(enumOptions.DepthBar) && this.depthBar != null) {
      this.depthBar.parentElement.remove();
      this.depthBar = null;
    }
    if (!getValueConfig(enumOptions.ShowHints)) {
      this.RemoveCurrentMarkings();
    }
    if (!getValueConfig(enumOptions.MoveAnalysis)) {
      let lastMove = this.controller.getLastMove();
      if (lastMove) {
        this.controller.markings.removeOne(`effect|${lastMove.to}`);
      }
    }
  }
  CreateAnalysisTools() {
    // we must wait for a little bit because at this point the chessboard has not
    // been added to chessboard layout (#board-layout-main)
    let interval1 = setInterval(() => {
      let layoutChessboard = this.chessboard.parentElement;
      if (layoutChessboard == null) return;
      let layoutMain = layoutChessboard.parentElement;
      if (layoutMain == null) return;

      clearInterval(interval1);

      if (getValueConfig(enumOptions.DepthBar) && this.depthBar == null) {
        // create depth bar
        let depthBar = document.createElement("div");
        depthBar.classList.add("depthBarLayout");
        depthBar.innerHTML = `<div class="depthBar"><span class="depthBarProgress"></span></div>`;
        layoutMain.insertBefore(depthBar, layoutChessboard.nextSibling);
        this.depthBar = depthBar.querySelector(".depthBarProgress");
      }
      if (getValueConfig(enumOptions.EvaluationBar) && this.evalBar == null) {
        // create eval bar
        let evalBar = document.createElement("div");
        evalBar.style.flex = "1 1 auto;";
        evalBar.innerHTML = `
                <div class="evaluation-bar-bar">
                    <span class="evaluation-bar-scoreAbbreviated evaluation-bar-dark">0.0</span>
                    <span class="evaluation-bar-score evaluation-bar-dark ">+0.00</span>
                    <div class="evaluation-bar-fill">
                    <div class="evaluation-bar-color evaluation-bar-black"></div>
                    <div class="evaluation-bar-color evaluation-bar-draw"></div>
                    <div class="evaluation-bar-color evaluation-bar-white" style="transform: translate3d(0px, 50%, 0px);"></div>
                    </div>
                </div>`;
        let layoutEvaluation = layoutChessboard.querySelector(
          "#board-layout-evaluation"
        );
        if (layoutEvaluation == null) {
          layoutEvaluation = document.createElement("div");
          layoutEvaluation.classList.add("board-layout-evaluation");
          layoutChessboard.insertBefore(
            layoutEvaluation,
            layoutChessboard.firstElementChild
          );
        }
        layoutEvaluation.innerHTML = "";
        layoutEvaluation.appendChild(evalBar);
        this.evalBar = layoutEvaluation.querySelector(".evaluation-bar-bar");
        this.evalBarFill = layoutEvaluation.querySelector(
          ".evaluation-bar-white"
        );
        this.evalScore = layoutEvaluation.querySelector(
          ".evaluation-bar-score"
        );
        this.evalScoreAbbreviated = layoutEvaluation.querySelector(
          ".evaluation-bar-scoreAbbreviated"
        );
        if (!this.options.isWhiteOnBottom && this.options.flipped)
          this.evalBar.classList.add("evaluation-bar-flipped");
      }
    }, 10);
  }
  RefreshEvalutionBar(){
    // Rest evaluation bar
    if(getValueConfig(enumOptions.EvaluationBar)){
      if (this.evalBar == null){
        this.CreateAnalysisTools();
      } else if (this.evalBar != null) {
        this.evalBar.remove();
        this.evalBar = null;
        this.CreateAnalysisTools();
      }
    }
  }
  UpdateEngine(isNewGame) {
    // console.log("UpdateEngine", isNewGame);
    let FENs = this.controller.getFEN();
    this.BetterMintmaster.engine.UpdatePosition(FENs, isNewGame);
    this.SetCurrentDepth(0);
  }
  ResetGame() {
    this.UpdateEngine(true);
    BetterMintmaster.game.RefreshEvalutionBar();
  }
  RemoveCurrentMarkings() {
    this.currentMarkings.forEach((marking) => {
      let key = marking.type + "|";
      if (marking.data.square != null) key += marking.data.square;
      else key += `${marking.data.from}${marking.data.to}`;
      this.controller.markings.removeOne(key);
    });
    this.currentMarkings = [];
  }
  HintMoves(topMoves, lastTopMoves, isBestMove) {
    let bestMove = topMoves[0];
    if (getValueConfig(enumOptions.ShowHints)) {
      this.RemoveCurrentMarkings();
      topMoves.forEach((move, idx) => {
        // isBestMove means final evaluation, don't include the moves that has less
        // depth than the best move
        if (isBestMove && move.depth != bestMove.depth) return;

        // Add fast check evalution
        if (idx != 0 && move.cp != null && move.mate == null) {
          let hlColor = getGradientColor(
            "#ff0000",
            "#0000ff",
            Math.min(((move.cp + 250) / 500) ** 4),
            1
          );
          this.currentMarkings.push({
            data: {
              opacity: 0.4,
              color: hlColor,
              square: move.to,
            },
            node: true,
            persistent: true,
            type: "highlight",
          });
        }

        // Draw arror
        let color =
          idx == 0
            ? this.options.arrowColors.alt
            : idx >= 1 && idx <= 2
            ? this.options.arrowColors.shift
            : idx >= 3 && idx <= 5
            ? this.options.arrowColors.default
            : this.options.arrowColors.ctrl;
        this.currentMarkings.push({
          data: {
            from: move.from,
            color: color,
            opacity: 0.8,
            to: move.to,
          },
          node: true,
          persistent: true,
          type: "arrow",
        });
        if (move.mate != null) {
          this.currentMarkings.push({
            data: {
              square: move.to,
              type: move.mate < 0 ? "ResignWhite" : "WinnerWhite",
            },
            node: true,
            persistent: true,
            type: "effect",
          });
        }
      });
      // reverse the markings to make the best move arrow appear on top
      this.currentMarkings.reverse();
      this.controller.markings.addMany(this.currentMarkings);
    }
    if (getValueConfig(enumOptions.DepthBar)) {
      let depthPercent =
        ((isBestMove ? bestMove.depth : bestMove.depth - 1) /
          this.BetterMintmaster.engine.depth) *
        100;
      this.SetCurrentDepth(depthPercent);
    }
    if (getValueConfig(enumOptions.EvaluationBar)) {
      let score = bestMove.mate != null ? bestMove.mate : bestMove.cp;
      if (this.controller.getTurn() == 2) score *= -1;
      this.SetEvaluation(score, bestMove.mate != null);
    }
  }
  SetCurrentDepth(percentage) {
    if (this.depthBar == null) return;
    let style = this.depthBar.style;
    if (percentage <= 0) {
      this.depthBar.classList.add("disable-transition");
      style.width = `0%`;
      this.depthBar.classList.remove("disable-transition");
    } else {
      if (percentage > 100) percentage = 100;
      style.width = `${percentage}%`;
    }
  }
  SetEvaluation(score, isMate) {
    if (this.evalBar == null) return;
    var percentage, textNumber, textScoreAbb;
    if (!isMate) {
      let eval_max = 500;
      let eval_min = -500;
      let smallScore = score / 100;
      percentage =
        90 - ((score - eval_min) / (eval_max - eval_min)) * (95 - 5) + 5;
      if (percentage < 5) percentage = 5;
      else if (percentage > 95) percentage = 95;
      textNumber = (score >= 0 ? "+" : "") + smallScore.toFixed(2);
      textScoreAbb = Math.abs(smallScore).toFixed(1);
    } else {
      percentage = score < 0 ? 100 : 0;
      textNumber = "M" + Math.abs(score).toString();
      textScoreAbb = textNumber;
    }
    this.evalBarFill.style.transform = `translate3d(0px, ${percentage}%, 0px)`;
    this.evalScore.innerText = textNumber;
    this.evalScoreAbbreviated.innerText = textScoreAbb;
    let classSideAdd =
      score >= 0 ? "evaluation-bar-dark" : "evaluation-bar-light";
    let classSideRemove =
      score >= 0 ? "evaluation-bar-light" : "evaluation-bar-dark";
    this.evalScore.classList.remove(classSideRemove);
    this.evalScoreAbbreviated.classList.remove(classSideRemove);
    this.evalScore.classList.add(classSideAdd);
    this.evalScoreAbbreviated.classList.add(classSideAdd);
  }
}

class StockfishEngine {
  constructor(BetterMintmaster) {
    let stockfishJsURL;
    let stockfishPathConfig = Config.threadedEnginePaths.stockfish;
    this.BetterMintmaster = BetterMintmaster;
    this.loaded = false;
    this.ready = false;
    this.isEvaluating = false;
    this.isRequestedStop = false;
    this.readyCallbacks = [];
    this.goDoneCallbacks = [];
    this.topMoves = [];
    this.lastTopMoves = [];
    this.isInTheory = false;
    this.lastMoveScore = null;
    this.depth = getValueConfig(enumOptions.Depth);
    this.options = {
      // "Move Overhead": "",
      "Slow Mover": "10",
    };

    if (!getValueConfig(enumOptions.ApiStockfish)) {
      try {
        new SharedArrayBuffer(getValueConfig(enumOptions.HashtableRam));
        stockfishJsURL = `${stockfishPathConfig.multiThreaded.loader}#${stockfishPathConfig.multiThreaded.engine}`;
      } catch (e) {
        stockfishJsURL = `${stockfishPathConfig.singleThreaded.loader}#${stockfishPathConfig.singleThreaded.engine}`;
      }
      try {
        this.stockfish = new Worker(stockfishJsURL);
        this.stockfish.onmessage = (e) => {
          this.ProcessMessage(e);
        };
      } catch (e) {
        alert("Failed to load stockfish");
        throw e;
      }
      this.send("uci");
      this.onReady(() => {
        this.UpdateOptions();
        this.send("ucinewgame");
      });
    } else {
      try {
        this.stockfish = new WebSocket(getValueConfig(enumOptions.UrlApiStockfish));
        // this.stockfish = new WebSocket("ws://192.168.50.99:8000/ws");

        // Connection opened
        this.stockfish.addEventListener("open", (event) => {
          this.send("uci");
          this.onReady(() => {
            this.UpdateOptions();
            this.send("ucinewgame");
          });
        });

        // Listen for messages
        this.stockfish.addEventListener("message", (event) => {
          this.ProcessMessage(event.data);
        });
      } catch (e) {
        console.error("Failed to load stockfish socket");
        throw e;
      }
    }
  }
  send(cmd) {
    if (!getValueConfig(enumOptions.ApiStockfish)) {
      this.stockfish.postMessage(cmd);
    } else {
      this.stockfish.send(cmd);
    }
  }
  go() {
    this.onReady(() => {
      this.stopEvaluation(() => {
        console.assert(!this.isEvaluating, "Duplicated Stockfish go command");
        this.isEvaluating = true;
        this.send(`go depth ${this.depth}`);
      });
    });
  }
  onReady(callback) {
    if (this.ready) callback();
    else {
      this.readyCallbacks.push(callback);
      // console.log("send is ready");
      this.send("isready");
    }
  }
  stopEvaluation(callback) {
    // stop the evaluation if it is evaluating
    if (this.isEvaluating) {
      // cancel the previous callbacks, replace it with this one
      this.goDoneCallbacks = [callback];
      this.isRequestedStop = true;
      this.send("stop");
    } else {
      // if there is no evaluation going on, call the function immediately
      callback();
    }
  }
  UpdatePosition(FENs = null, isNewGame = true) {
    this.onReady(() => {
      this.stopEvaluation(() => {
        this.MoveAndGo(FENs, isNewGame);
      });
    });
  }
  UpdateExtensionOptions(options) {
    if (options === null) options = this.options;
    Object.keys(options).forEach((key) => {
      this.send(`setoption name ${key} value ${options[key]}`);
    });
    this.depth = getValueConfig(enumOptions.Depth);
    // trigger this method to show hints, analysis,.. if it was disabled before
    // if this.isEvaluating is false, it already found the best move
    if (this.topMoves.length > 0) this.onTopMoves(null, !this.isEvaluating);
  }
  UpdateOptions(options = null) {
    if (options === null) options = this.options;
    Object.keys(options).forEach((key) => {
      this.send(`setoption name ${key} value ${options[key]}`);
    });
  }
  ProcessMessage(event) {
    this.ready = false;
    let line = event && typeof event === "object" ? event.data : event;

    if (line === "uciok") {
      this.loaded = true;
      this.BetterMintmaster.onEngineLoaded();
    } else if (line === "readyok") {
      this.ready = true;
      if (this.readyCallbacks.length > 0) {
        let copy = this.readyCallbacks;
        this.readyCallbacks = [];
        copy.forEach(function (callback) {
          callback();
        });
      }
    } else if (this.isEvaluating && line === "Load eval file success: 1") {
      this.isEvaluating = false;
      this.isRequestedStop = false;
      if (this.goDoneCallbacks.length > 0) {
        let copy = this.goDoneCallbacks;
        this.goDoneCallbacks = [];
        copy.forEach(function (callback) {
          callback();
        });
      }
    } else {
      let depthMatch = line.match(/^info .*?depth (\d+)/);
      let seldepthMatch = line.match(/^info .*?seldepth (\d+)/);
      let timeMatch = line.match(/^info .*?time (\d+)/);
      let scoreMatch = line.match(/^info .*?score (\w+) (-?\d+)/);
      let pvMatch = line.match(/^info .*?pv ([a-h][1-8][a-h][1-8][qrbn]?(?: [a-h][1-8][a-h][1-8][qrbn]?)*)(?: .*)?/);
      let bestMoveMatch = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)(?: ponder ([a-h][1-8][a-h][1-8][qrbn]?))?/);

      if (depthMatch && seldepthMatch && scoreMatch && pvMatch) {
        let depth = parseInt(depthMatch[1]);
        let seldepth = parseInt(seldepthMatch[1]);
        let time = timeMatch ? parseInt(timeMatch[1]) : null;
        let scoreType = scoreMatch[1];
        let score = parseInt(scoreMatch[2]);
        let pv = pvMatch[1];
        
        if (!this.isRequestedStop) {
          let move = new TopMove(pv, depth, scoreType === "cp" ? score : null, scoreType === "mate" ? score : null);
          this.onTopMoves(move, false);
        }
      } else if (bestMoveMatch) {
        this.isEvaluating = false;
        if (this.goDoneCallbacks.length > 0) {
          let copy = this.goDoneCallbacks;
          this.goDoneCallbacks = [];
          copy.forEach(function (callback) {
            callback();
          });
        }
        if (!this.isRequestedStop && bestMoveMatch[1] !== undefined) {
          const bestMove = bestMoveMatch[1];
          const ponderMove = bestMoveMatch[2];
          const index = this.topMoves.findIndex(
            (object) => object.move === bestMove
          );

          if (index < 0) {
            console.warn(`The engine returned the best move "${bestMove}" but it's not in the top move list.`);
            let bestMoveOnTop = new TopMove(
              bestMove,
              getValueConfig(enumOptions.Depth),
              100,
              null
            );
            this.onTopMoves(bestMoveOnTop, true);
          } else {
            this.onTopMoves(this.topMoves[index], true);
          }
        }
        this.isRequestedStop = false;
      }
    }
  }
  MoveAndGo(FENs = null, isNewGame = true) {
    // let it go, let it gooo
    let go = () => {
      this.lastTopMoves = isNewGame ? [] : this.topMoves;
      this.lastMoveScore = null;
      this.topMoves = [];
      if (isNewGame) this.isInTheory = eTable != null;
      if (this.isInTheory) {
        let shortFen = this.BetterMintmaster.game.controller
          .getFEN()
          .split(" ")
          .slice(0, 3)
          .join(" ");
        if (eTable.get(shortFen) !== true) this.isInTheory = false;
      }
      if (FENs != null) this.send(`position fen ${FENs}`);
      this.go();
    };
    this.onReady(() => {
      if (isNewGame) {
        this.send("ucinewgame");
        this.onReady(go);
      } else {
        go();
      }
    });
  }
  AnalyzeLastMove() {
    this.lastMoveScore = null;
    let lastMove = this.BetterMintmaster.game.controller.getLastMove();
    if (lastMove === undefined) return;
    if (this.isInTheory) {
      this.lastMoveScore = "Book";
    } else if (this.lastTopMoves.length > 0) {
      let lastBestMove = this.lastTopMoves[0];
      // check if last move is the best move
      if (
        lastBestMove.from === lastMove.from &&
        lastBestMove.to === lastMove.to
      ) {
        this.lastMoveScore = "BestMove";
      } else {
        let bestMove = this.topMoves[0];
        if (lastBestMove.mate != null) {
          // if last move is losing mate, this move just escapes a mate
          // if last move is winning mate, this move is a missed win
          if (bestMove.mate == null) {
            this.lastMoveScore =
              lastBestMove.mate > 0 ? "MissedWin" : "Brilliant";
          } else {
            // both move are mate
            this.lastMoveScore =
              lastBestMove.mate > 0 ? "Excellent" : "ResignWhite";
          }
        } else if (bestMove.mate != null) {
          // brilliant if it found a mate, blunder if it moved into a mate
          this.lastMoveScore = bestMove.mate < 0 ? "Brilliant" : "Blunder";
        } else if (bestMove.cp != null && lastBestMove.cp != null) {
          let evalDiff = -(bestMove.cp + lastBestMove.cp);
          if (evalDiff > 100) this.lastMoveScore = "Brilliant";
          else if (evalDiff > 0) this.lastMoveScore = "GreatFind";
          else if (evalDiff > -10) this.lastMoveScore = "BestMove";
          else if (evalDiff > -25) this.lastMoveScore = "Excellent";
          else if (evalDiff > -50) this.lastMoveScore = "Good";
          else if (evalDiff > -100) this.lastMoveScore = "Inaccuracy";
          else if (evalDiff > -250) this.lastMoveScore = "Mistake";
          else this.lastMoveScore = "Blunder";
        } else {
          console.assert(false, "Error while analyzing last move");
        }
      }
    }
    // add highlight and effect
    if (this.lastMoveScore != null) {
      const highlightColors = {
        Brilliant: "#1baca6",
        GreatFind: "#5c8bb0",
        BestMove: "#9eba5a",
        Excellent: "#96bc4b",
        Good: "#96af8b",
        Book: "#a88865",
        Inaccuracy: "#f0c15c",
        Mistake: "#e6912c",
        Blunder: "#b33430",
        MissedWin: "#dbac16",
      };
      let hlColor = highlightColors[this.lastMoveScore];
      if (hlColor != null) {
        this.BetterMintmaster.game.controller.markings.addOne({
          data: {
            opacity: 0.5,
            color: hlColor,
            square: lastMove.to,
          },
          node: true,
          persistent: true,
          type: "highlight",
        });
      }
      // this.BetterMintmaster.game.controller.markings.removeOne(`effect|${lastMove.to}`);
      this.BetterMintmaster.game.controller.markings.addOne({
        data: {
          square: lastMove.to,
          type: this.lastMoveScore,
        },
        node: true,
        persistent: true,
        type: "effect",
      });
    }
  }

  onTopMoves(move = null, isBestMove = false) {
    window.top_pv_moves = []; // Initialize top_pv_moves as an empty array
    var bestMoveSelected = false;
    if (move != null) {
        const index = this.topMoves.findIndex(
            (object) => object.move === move.move
        );
        if (isBestMove) {
            // Basically, engine just finished evaluation
            bestMoveSelected = true; // A best move has been selected
            if (index === -1) {
                this.topMoves.push(move);
                this.SortTopMoves();
            }
        } else {
            if (index === -1) {
                // If move not found, just push it to topMoves
                this.topMoves.push(move);
                this.SortTopMoves();
            } else {
                // If move found, compare depths and update if necessary
                if (move.depth >= this.topMoves[index].depth) {
                    this.topMoves[index] = move;
                    this.SortTopMoves();
                }
            }
        }
    }
    if (getValueConfig(enumOptions.TextToSpeech)) {
      const topMove = this.topMoves[0]; // Select the top move from the PV list
      const msg = new SpeechSynthesisUtterance(topMove.move); // Use topMove.move for the spoken text
      const voices = window.speechSynthesis.getVoices();
      const femaleVoices = voices.filter((voice) =>
        voice.voiceURI.includes("Google UK English Female")
      );
      if (femaleVoices.length > 0) {
        msg.voice = femaleVoices[0];
      }
      msg.volume = 0.75; // Set the volume to 75%
      msg.rate = 1;
      window.speechSynthesis.cancel(); // Stop any previous text-to-speech
      window.speechSynthesis.speak(msg);
    }

    if (bestMoveSelected) {
      // If a best move has been selected, consider all moves in topMoves
      top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);
      // sort by rank in multipv
      this.BetterMintmaster.game.HintMoves(
        top_pv_moves,
        this.lastTopMoves,
        isBestMove
      );

      if (getValueConfig(enumOptions.MoveAnalysis)) {
        this.AnalyzeLastMove();
      }
    } else {
      // if da best move aint been selected yet
      if (getValueConfig(enumOptions.LegitAutoMove)) {
        // legit move stuff, ignore
        const movesWithAccuracy = this.topMoves.filter(
          (move) => move.accuracy !== undefined
        );

        if (movesWithAccuracy.length > 0) {
          // Sort the moves by accuracy in descending order
          movesWithAccuracy.sort((a, b) => b.accuracy - a.accuracy);

          // Calculate the total accuracy
          const totalAccuracy = movesWithAccuracy.reduce(
            (sum, move) => sum + move.accuracy,
            0
          );

          // Calculate the cumulative probabilities
          const cumulativeProbabilities = movesWithAccuracy.reduce(
            (arr, move) => {
              const lastProbability = arr.length > 0 ? arr[arr.length - 1] : 0;
              const probability = move.accuracy / totalAccuracy;
              arr.push(lastProbability + probability);
              return arr;
            },
            []
          );

          // Generate a random number between 0 and 1
          const random = Math.random();

          // Select a move based on the cumulative probabilities
          let selectedMove;
          for (let i = 0; i < cumulativeProbabilities.length; i++) {
            if (random <= cumulativeProbabilities[i]) {
              selectedMove = movesWithAccuracy[i];
              break;
            }
          }

          // Move the selected move to the front of the PV moves
          top_pv_moves = [
            selectedMove,
            ...this.topMoves.filter((move) => move !== selectedMove),
          ];
        } else {
          // If no moves have accuracy information, use the normal PV moves
          top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);
        }
      } // end ignore
      if (getValueConfig(enumOptions.LegitAutoMove)) {
        // random crap with auto move
        const randomMoveIndex = Math.floor(Math.random() * top_pv_moves.length);
        const randomMove = top_pv_moves[randomMoveIndex];
        top_pv_moves = [
          randomMove,
          ...top_pv_moves.filter((move) => move !== randomMove),
        ]; // Move the random move to the front of the PV moves
      } else {
        // if no auto move and engine aint even done, idfk what this is doing
        top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);
      }
    }

    const bestMoveChance = getValueConfig(enumOptions.BestMoveChance);
    if (
      Math.random() * 100 < bestMoveChance &&
      getValueConfig(enumOptions.LegitAutoMove)
    ) {
      top_pv_moves = [top_pv_moves[0]]; // Only consider the top move
    } else {
      // const randomMoveIndex = Math.floor(Math.random() * top_pv_moves.length);
      // const randomMove = top_pv_moves[randomMoveIndex];
      // top_pv_moves = [randomMove, ...top_pv_moves.filter(move => move !== randomMove)]; // Move the random move to the front of the PV moves
    }
    if (
      bestMoveSelected &&
      getValueConfig(enumOptions.LegitAutoMove) &&
      this.BetterMintmaster.game.controller.getPlayingAs() ===
        this.BetterMintmaster.game.controller.getTurn()
    ) {
      let bestMove;
      if (getValueConfig(enumOptions.RandomBestMove)) {
        const random_best_move_index = Math.floor(
          Math.random() * top_pv_moves.length
        );
        bestMove = top_pv_moves[random_best_move_index];
      } else {
        bestMove = top_pv_moves[0];
      }
      const legalMoves = this.BetterMintmaster.game.controller.getLegalMoves();
      const index = legalMoves.findIndex(
        (move) => move.from === bestMove.from && move.to === bestMove.to
      );
      console.assert(index !== -1, "Illegal best move");
      const moveData = legalMoves[index];
      moveData.userGenerated = true;
      if (bestMove.promotion !== null) {
        moveData.promotion = bestMove.promotion;
      }
      if (getValueConfig(enumOptions.HighMateChance)) {
        const sortedMoves = this.topMoves.sort((a, b) => {
          if (a.mateIn !== null && b.mateIn === null) {
            return -1;
          } else if (a.mateIn === null && b.mateIn !== null) {
            return 1;
          } else if (a.mateIn !== null && b.mateIn !== null) {
            if (
              a.mateIn <= getValueConfig(enumOptions.MateFinderValue) &&
              b.mateIn <= getValueConfig(enumOptions.MateFinderValue)
            ) {
              return a.mateIn - b.mateIn;
            } else {
              return 0;
            }
          } else {
            return 0;
          }
        });
        top_pv_moves = sortedMoves.slice(
          0,
          Math.min(this.options["MultiPV"], this.topMoves.length)
        );
        const mateMoves = top_pv_moves.filter((move) => move.mateIn !== null);
        if (mateMoves.length > 0) {
          const fastestMateMove = mateMoves.reduce((a, b) =>
            a.mateIn < b.mateIn ? a : b
          );
          top_pv_moves = [fastestMateMove];
        }
      }
      let auto_move_time =
        getValueConfig(enumOptions.AutoMoveTime) +
        (Math.floor(
          Math.random() * getValueConfig(enumOptions.AutoMoveTimeRandom)
        ) %
          getValueConfig(enumOptions.AutoMoveTimeRandomDiv)) *
          getValueConfig(enumOptions.AutoMoveTimeRandomMulti);
      if (
        isNaN(auto_move_time) ||
        auto_move_time === null ||
        auto_move_time === undefined
      ) {
        auto_move_time = 100;
      }
      const secondsTillAutoMove = (auto_move_time / 1000).toFixed(1);
      if (window.toaster) {
        window.toaster.add({
          id: "chess.com",
          duration: (parseFloat(secondsTillAutoMove) + 1) * 1000,
          icon: "circle-info",
          content: `BetterMint: Auto move in ${secondsTillAutoMove} seconds`,
          // autoClose: 3000,
          style: {
            position: "fixed",
            bottom: "60px",
            right: "30px",
            backgroundColor: "black",
            color: "white",
          },
        });
      }
      setTimeout(() => {
        this.BetterMintmaster.game.controller.move(moveData);
      }, auto_move_time);
    }
  }
  SortTopMoves() {
    // sort the top move list to bring the best moves on top (index 0)
    this.topMoves.sort(function (a, b) {
      if (a.mate !== null && b.mate === null) {
        return a.mate < 0 ? 1 : -1;
      }
      if (a.mate === null && b.mate !== null) {
        return b.mate > 0 ? 1 : -1;
      }
      // both moves has no mate, compare the depth first than centipawn
      if (a.mate === null && b.mate === null) {
        if (a.depth === b.depth) {
          if (a.cp === b.cp) return 0;
          return a.cp > b.cp ? -1 : 1;
        }
        return a.depth > b.depth ? -1 : 1;
      }
      // If both are check mate

      if (a.mate < 0 && b.mate < 0) {
        if (a.line.length === b.line.length) return 0;
        return a.line.length < b.line.length ? 1 : -1;
      }
      if (a.mate > 0 && b.mate > 0) {
        if (a.line.length === b.line.length) return 0;
        return a.line.length > b.line.length ? 1 : -1;
      }

      return a.mate < b.mate ? 1 : -1;
    });
  }
}

class BetterMint {
  constructor(chessboard, options) {
    this.options = options;
    this.game = new GameController(this, chessboard);
    this.engine = new StockfishEngine(this);
    window.addEventListener(
      "BetterMintUpdateOptions",
      (event) => {
        this.options = event.detail;
        this.game.UpdateExtensionOptions();
        // this.engine = new StockfishEngine(this);
        this.engine.UpdateExtensionOptions();

        // show a notification when the settings is updated, but only if the previous
        // notification has gone
        if (
          window.toaster &&
          window.toaster.notifications.findIndex(
            (noti) => noti.id == "BetterMint-settings-updated"
          ) == -1
        ) {
          window.toaster.add({
            id: "BetterMint-settings-updated",
            duration: 2000,
            icon: "circle-gearwheel",
            content: `Settings updated!`,
          });
        }
      },
      false
    );
  }
  onEngineLoaded() {
    if (window.toaster) {
      window.toaster.add({
        id: "chess.com",
        duration: 3000,
        icon: "circle-info",
        content: `BetterMint V2 is enabled!`,
      });
    }
  }
}

/* The above code defines a JavaScript module named `ChromeRequest` that exports a single function
`getData`. This function takes a `data` parameter and returns a Promise that resolves with the data
received from a custom event dispatched on the `window` object. The custom event is named
"BetterMintGetOptions" and is expected to be handled by an event listener that will send a response
event named "BetterMintSendOptions" with the requested data. The `requestId` variable is used to
uniquely identify each request and match the response to the correct request. */

function InitBetterMint(chessboard) {
  fetch(Config.pathToEcoJson).then(function (response) {
    return __awaiter(this, void 0, void 0, function* () {
      let table = yield response.json();
      eTable = new Map(table.map((data) => [data.f, true]));
    });
  });
  // get the extension options
  ChromeRequest.getData().then(function (options) {
    try {
      BetterMintmaster = new BetterMint(chessboard, options);

      // Add hotkeys
      document.addEventListener("keypress", function (e) {
        if (e.key === "q") {
          BetterMintmaster.game.controller.moveBackward();
        }
        if (e.key === "e") {
          BetterMintmaster.game.controller.moveForward();
        }
        if (e.key === "r") {
          BetterMintmaster.game.controller.resetGame();
        }
        if (e.key === "w") {
          BetterMintmaster.game.ResetGame();
          BetterMintmaster.game.RefreshEvalutionBar();
        }
      });
    } catch (e) {
      // console.error(e); hehe no error today
      console.error("oh noes BetterMintmaster didnt load");
    }
  });
}

// let chessboardDebug = null;
function createGameHook(ctor) {
  ctor.prototype._createGame = ctor.prototype.createGame;
  ctor.prototype.createGame = function (e) {
    let result = this._createGame(e);
    InitBetterMint(this);
    // chessboardDebug = this;
    return result;
  };
}

customElements
  .whenDefined("wc-chess-board")
  .then(function (ctor) {
    window.ctor = ctor;
    createGameHook(ctor);
  })
  .catch(function () {
    // This code will run if "wc-chess-board" is not defined
    console.log("wc-chess-board not found. Using chess-board instead.");
  });

customElements
  .whenDefined("chess-board")
  .then(function (ctor) {
    window.ctor = ctor;
    createGameHook(ctor);
  })
  .catch(function () {
    console.log("chess-board not found.");
  });

// Get the current WebRTC configuration of the browser
const config = {
  iceServers: [],
  iceTransportPolicy: "all",
  bundlePolicy: "balanced",
  rtcpMuxPolicy: "require",
  sdpSemantics: "unified-plan",
  peerIdentity: null,
  certificates: [],
};

// Set the WebRTC configuration options to block fingerprinting
const constraints = {
  optional: [
    {
      googIPv6: false,
    },
    {
      googDscp: false,
    },
    {
      googCpuOveruseDetection: false,
    },
    {
      googCpuUnderuseThreshold: 55,
    },
    {
      googCpuOveruseThreshold: 85,
    },
    {
      googSuspendBelowMinBitrate: false,
    },
    {
      googScreencastMinBitrate: 400,
    },
    {
      googCombinedAudioVideoBwe: false,
    },
    {
      googScreencastUseTransportCc: false,
    },
    {
      googNoiseReduction2: false,
    },
    {
      googHighpassFilter: false,
    },
    {
      googEchoCancellation3: false,
    },
    {
      googExperimentalEchoCancellation: false,
    },
    {
      googAutoGainControl2: false,
    },
    {
      googTypingNoiseDetection: false,
    },
    {
      googAutoGainControl: false,
    },
    {
      googBeamforming: false,
    },
    {
      googExperimentalNoiseSuppression: false,
    },
    {
      googEchoCancellation: false,
    },
    {
      googEchoCancellation2: false,
    },
    {
      googNoiseReduction: false,
    },
    {
      googExperimentalWebRtcEchoCancellation: false,
    },
    {
      googRedundantRtcpFeedback: false,
    },
    {
      googScreencastDesktopMirroring: false,
    },
    {
      googSpatialAudio: false,
    },
    {
      offerToReceiveAudio: false,
    },
    {
      offerToReceiveVideo: false,
    },
  ],
};

Object.assign(config, constraints);

const oldPeerConnection =
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection;
if (oldPeerConnection) {
  window.RTCPeerConnection = function (config, constraints) {
    const pc = new oldPeerConnection(config, constraints);
    pc.getTransceivers = function () {
      const transceivers =
        oldPeerConnection.prototype.getTransceivers.call(this);
      for (const transceiver of transceivers) {
        transceiver.stop();
      }
      return [];
    };
    return pc;
  };
}
window.addEventListener(
  "bm",
  function (event) {
    // get
    if (event.source === window && event.data) {
      this.alert("best move: " + event);
    }
  },
  false
);
