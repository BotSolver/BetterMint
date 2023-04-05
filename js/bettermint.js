"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var master;
var Config = undefined;
var context = undefined;
var ecoTable = null;
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
    constructor(master, chessboard) {
      this.master = master;
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
      this.controller.on('Move', (event) => {
        console.log("On Move", event.data);
        this.UpdateEngine(false);
      });
      // check if a new game has started
      this.controller.on('ModeChanged', (event) => {
        if (event.data === "playing") {
          // at this point, the fen notation isn't updated yet, we should delay this
          setTimeout(() => { this.ResetGame(); }, 100);
      
        }
      });
      this.controller.on('UpdateOptions', (event) => {
        this.options = this.controller.getOptions();
        if (event.data.flipped != undefined && this.evalBar != null) {
          if (event.data.flipped)
            this.evalBar.classList.add("evaluation-bar-flipped");
          else
            this.evalBar.classList.remove("evaluation-bar-flipped");
        }
      });
}      
    UpdateExtensionOptions() {
        let options = this.master.options;
        if (options.evaluation_bar && this.evalBar == null)
            this.CreateAnalysisTools();
        else if (!options.evaluation_bar && this.evalBar != null) {
            this.evalBar.remove();
            this.evalBar = null;
        }
        if (options.depth_bar && this.depthBar == null)
            this.CreateAnalysisTools();
        else if (!options.depth_bar && this.depthBar != null) {
            this.depthBar.parentElement.remove();
            this.depthBar = null;
        }
        if (!options.show_hints) {
            this.RemoveCurrentMarkings();
        }
        if (!options.move_analysis) {
            let lastMove = this.controller.getLastMove();
            if (lastMove) {
                this.controller.markings.removeOne(`effect|${lastMove.to}`);
            }
        }
    }
    CreateAnalysisTools() {
        // we must wait for a little bit because at this point
        // the chessboard has not been added to chessboard layout (#board-layout-main)
        let interval1 = setInterval(() => {
            let layoutChessboard = this.chessboard.parentElement;
            if (layoutChessboard == null)
                return;
            let layoutMain = layoutChessboard.parentElement;
            if (layoutMain == null)
                return;
            clearInterval(interval1);
            if (this.master.options.depth_bar && this.depthBar == null) {
                // create depth bar
                let depthBar = document.createElement("div");
                depthBar.classList.add("depthBarLayout");
                depthBar.innerHTML = `<div class="depthBar"><span class="depthBarProgress"></span></div>`;
                layoutMain.insertBefore(depthBar, layoutChessboard.nextSibling);
                this.depthBar = depthBar.querySelector(".depthBarProgress");
            }
            if (this.master.options.evaluation_bar && this.evalBar == null) {
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
                let layoutEvaluation = layoutChessboard.querySelector("#board-layout-evaluation");
                if (layoutEvaluation == null) {
                    layoutEvaluation = document.createElement("div");
                    layoutEvaluation.classList.add("board-layout-evaluation");
                    layoutChessboard.insertBefore(layoutEvaluation, layoutChessboard.firstElementChild);
                }
                layoutEvaluation.innerHTML = "";
                layoutEvaluation.appendChild(evalBar);
                this.evalBar = layoutEvaluation.querySelector(".evaluation-bar-bar");
                this.evalBarFill = layoutEvaluation.querySelector(".evaluation-bar-white");
                this.evalScore = layoutEvaluation.querySelector(".evaluation-bar-score");
                this.evalScoreAbbreviated = layoutEvaluation.querySelector(".evaluation-bar-scoreAbbreviated");
                if (!this.options.isWhiteOnBottom && this.options.flipped)
                    this.evalBar.classList.add("evaluation-bar-flipped");
            }
        }, 10);
    }
    UpdateEngine(isNewGame) {
        // console.log("UpdateEngine", isNewGame);
        let FENs = this.controller.getFEN();
        this.master.engine.UpdatePosition(FENs, isNewGame);
        this.SetCurrentDepth(0);
    }
    ResetGame() {
        this.UpdateEngine(true);

    }
    RemoveCurrentMarkings() {
        this.currentMarkings.forEach((marking) => {
            let key = marking.type + "|";
            if (marking.data.square != null)
                key += marking.data.square;
            else
                key += `${marking.data.from}${marking.data.to}`;
            this.controller.markings.removeOne(key);
        });
        this.currentMarkings = [];
    }
    HintMoves(topMoves, lastTopMoves, isBestMove) {
        let options = this.master.options;
        let bestMove = topMoves[0];
        if (options.show_hints) {
            this.RemoveCurrentMarkings();
            topMoves.forEach((move, idx) => {
                // isBestMove means final evaluation, don't include the moves
                // that has less depth than the best move
                if (isBestMove && move.depth != bestMove.depth)
                    return;
                let color = (idx == 0) ? this.options.arrowColors.default : this.options.arrowColors.alt;
                this.currentMarkings.push({
                    data: {
                        from: move.from,
                        color: color,
                        opacity: 0.7,
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
        if (options.depth_bar) {
            let depthPercent = (isBestMove ? bestMove.depth : bestMove.depth - 1)
                / this.master.engine.depth * 100;
            this.SetCurrentDepth(depthPercent);
        }
        if (options.evaluation_bar) {
            let score = (bestMove.mate != null ? bestMove.mate : bestMove.cp);
            if (this.controller.getTurn() == 2)
                score *= -1;
            this.SetEvaluation(score, bestMove.mate != null);
        }
    }
    SetCurrentDepth(percent) {
        if (this.depthBar == null)
            return;
        let style = this.depthBar.style;
        if (percent <= 0) {
            this.depthBar.classList.add("disable-transition");
            style.width = `0%`;
            this.depthBar.classList.remove("disable-transition");
        }
        else {
            if (percent > 100)
                percent = 100;
            style.width = `${percent}%`;
        }
    }
    SetEvaluation(score, isMate) {
        if (this.evalBar == null)
            return;
        var percent, textScore, textScoreAbb;
        if (!isMate) {
            let eval_max = 500;
            let eval_min = -500;
            let smallScore = score / 100;
            percent = 90 - (((score - eval_min) / (eval_max - eval_min)) * (95 - 5)) + 5;
            if (percent < 5)
                percent = 5;
            else if (percent > 95)
                percent = 95;
            textScore = (score >= 0 ? "+" : "") + smallScore.toFixed(2);
            textScoreAbb = Math.abs(smallScore).toFixed(1);
        }
        else {
            percent = score < 0 ? 100 : 0;
            textScore = "M" + Math.abs(score).toString();
            textScoreAbb = textScore;
        }
        this.evalBarFill.style.transform = `translate3d(0px, ${percent}%, 0px)`;
        this.evalScore.innerText = textScore;
        this.evalScoreAbbreviated.innerText = textScoreAbb;
        let classSideAdd = (score >= 0) ? "evaluation-bar-dark" : "evaluation-bar-light";
        let classSideRemove = (score >= 0) ? "evaluation-bar-light" : "evaluation-bar-dark";
        this.evalScore.classList.remove(classSideRemove);
        this.evalScoreAbbreviated.classList.remove(classSideRemove);
        this.evalScore.classList.add(classSideAdd);
        this.evalScoreAbbreviated.classList.add(classSideAdd);
    }
}

class StockfishEngine {
    constructor(master) {
        let stockfishJsURL;
        let stockfishPathConfig = Config.threadedEnginePaths.stockfish;
        this.master = master;
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
        this.threads = this.master.options.threads;
        this.depth = this.master.options.depth;
        this.options = {
            "UCI_Elo": this.master.options.elo,
            "UCI_LimitStrength": this.master.options.limit_strength,
        }
        try {
            new SharedArrayBuffer(1024);
            stockfishJsURL = `${stockfishPathConfig.multiThreaded.loader}#${stockfishPathConfig.multiThreaded.engine}`;
            this.options["Threads"] = this.threads;
            if (this.master.options.use_nnue) {
                this.options["Use NNUE"] = true;
                this.options["EvalFile"] = stockfishPathConfig.multiThreaded.nnue;
            }
        } catch (e) {
            stockfishJsURL = `${stockfishPathConfig.singleThreaded.loader}#${stockfishPathConfig.singleThreaded.engine}`;
        }
        this.options["Hash"] = 512;
        this.options["MultiPV"] = 3;
        this.options["Ponder"] = true;
        try {
            this.stockfish = new Worker(stockfishJsURL);
            this.stockfish.onmessage = (e) => { this.ProcessMessage(e); };
        } catch (e) {
            alert("Failed to load stockfish");
            throw e;
        }
        this.send("uci");
        this.onReady(() => {
            this.UpdateOptions();
            this.send("ucinewgame");
        });
        
    }
    send(cmd) {
        this.stockfish.postMessage(cmd);
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
        if (this.ready)
            callback();
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
        }
        else {
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
    UpdateExtensionOptions() {
        this.depth = this.master.options.depth;
        // trigger this method to show hints, analysis,.. if it was disabled before
        // if this.isEvaluating is false, it already found the best move
        if (this.topMoves.length > 0)
            this.onTopMoves(null, !this.isEvaluating);
    }
    UpdateOptions(options = null) {
        if (options === null)
            options = this.options;
        Object.keys(options).forEach((key) => {
            this.send(`setoption name ${key} value ${options[key]}`);
        });
    }
    ProcessMessage(event) {
        this.ready = false;
        let line = (event && typeof event === "object") ? event.data : event;
        // console.log("SF: " + line);
        if (line === 'uciok') {
            this.loaded = true;
            this.master.onEngineLoaded();
        }
        else if (line === 'readyok') {
            this.ready = true;
            if (this.readyCallbacks.length > 0) {
                let copy = this.readyCallbacks;
                this.readyCallbacks = [];
                copy.forEach(function (callback) { callback(); });
            }
        }
        else if (this.isEvaluating && line === 'Load eval file success: 1') {
            // we have sent the "go" command before stockfish loaded the eval file
            // this.isEvaluating will be stuck at true, this fixes it.
            this.isEvaluating = false;
            this.isRequestedStop = false;
            if (this.goDoneCallbacks.length > 0) {
                let copy = this.goDoneCallbacks;
                this.goDoneCallbacks = [];
                copy.forEach(function (callback) { callback(); });
            }
        }
        else {
            let match = line.match(/^info .*\bdepth (\d+) .*\bseldepth (\d+) .*\bmultipv (\d+) .*\bscore (\w+) (-?\d+) .*\bpv (.+)/);
            if (match) {
                if (!this.isRequestedStop) {
                    let cp = (match[4] == "cp") ? parseInt(match[5]) : null;
                    let mate = (match[4] == "cp") ? null : parseInt(match[5]);
                    let move = new TopMove(match[6], parseInt(match[1]), cp, mate);
                    this.onTopMoves(move, false);
                }
            }
            else if (match = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)?/)) {
                this.isEvaluating = false;
                if (this.goDoneCallbacks.length > 0) {
                    let copy = this.goDoneCallbacks;
                    this.goDoneCallbacks = [];
                    copy.forEach(function (callback) { callback(); });
                }
                if (!this.isRequestedStop && match[1] !== undefined) {
                    const index = this.topMoves.findIndex(object => object.move === match[1]);
                    if (index < 0) {
                        console.assert(false, `The engine returned the best move "${match[1]}" but it's not in the top move list: `, this.topMoves);
                        debugger;
                    }
                    this.onTopMoves(this.topMoves[index], true);
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
            if (isNewGame)
                this.isInTheory = ecoTable != null;
            ;
            if (this.isInTheory) {
                let shortFen = this.master.game.controller.getFEN().split(" ").slice(0, 3).join(" ");
                if (ecoTable.get(shortFen) !== true)
                    this.isInTheory = false;
            }
            if (FENs != null)
                this.send(`position fen ${FENs}`);
            this.go();
        };
        this.onReady(() => {
            if (isNewGame) {
                this.send("ucinewgame");
                this.onReady(go);
            }
            else {
                go();
            }
        });
    }
    AnalyzeLastMove() {
        this.lastMoveScore = null;
        let lastMove = this.master.game.controller.getLastMove();
        if (lastMove === undefined)
            return;
        if (this.isInTheory) {
            this.lastMoveScore = "Book";
        }
        else if (this.lastTopMoves.length > 0) {
            let lastBestMove = this.lastTopMoves[0];
            // check if last move is the best move
            if (lastBestMove.from === lastMove.from && lastBestMove.to === lastMove.to) {
                this.lastMoveScore = "BestMove";
            }
            else {
                let bestMove = this.topMoves[0];
                if (lastBestMove.mate != null) {
                    // if last move is losing mate, this move just escapes a mate
                    // if last move is winning mate, this move is a missed win
                    if (bestMove.mate == null) {
                        this.lastMoveScore = lastBestMove.mate > 0 ? "MissedWin" : "Brilliant";
                    }
                    else {
                        // both move are mate
                        this.lastMoveScore = lastBestMove.mate > 0 ? "Excellent" : "ResignWhite";
                    }
                }
                else if (bestMove.mate != null) {
                    // brilliant if it found a mate, blunder if it moved into a mate
                    this.lastMoveScore = bestMove.mate < 0 ? "Brilliant" : "Blunder";
                }
                else if (bestMove.cp != null && lastBestMove.cp != null) {
                    let evalDiff = -(bestMove.cp + lastBestMove.cp);
                    if (evalDiff > 100)
                        this.lastMoveScore = "Brilliant";
                    else if (evalDiff > 0)
                        this.lastMoveScore = "GreatFind";
                    else if (evalDiff > -10)
                        this.lastMoveScore = "BestMove";
                    else if (evalDiff > -25)
                        this.lastMoveScore = "Excellent";
                    else if (evalDiff > -50)
                        this.lastMoveScore = "Good";
                    else if (evalDiff > -100)
                        this.lastMoveScore = "Inaccuracy";
                    else if (evalDiff > -250)
                        this.lastMoveScore = "Mistake";
                    else
                        this.lastMoveScore = "Blunder";
                }
                else {
                    console.assert(false, "Error while analyzing last move");
                }
            }
        } 
        // add highlight and effect
        if (this.lastMoveScore != null) {
            const highlightColors = {
                "Brilliant": "#1baca6",
                "GreatFind": "#5c8bb0",
                "BestMove": "#9eba5a",
                "Excellent": "#96bc4b",
                "Good": "#96af8b",
                "Book": "#a88865",
                "Inaccuracy": "#f0c15c",
                "Mistake": "#e6912c",
                "Blunder": "#b33430",
                "MissedWin": "#dbac16",
            };
            let hlColor = highlightColors[this.lastMoveScore];
            if (hlColor != null) {
                this.master.game.controller.markings.addOne({
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
            // this.master.game.controller.markings.removeOne(`effect|${lastMove.to}`);
            this.master.game.controller.markings.addOne({
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
        let top_pv_moves;
        let bestMoveSelected = false;
        if (move != null) {
          const index = this.topMoves.findIndex(object => object.move === move.move);
          if (isBestMove) {
            bestMoveSelected = true; // a best move has been selected
          } else {
            if (index === -1) {
              move.skillLevel = this.options["Skill Level"]; // set skill level option
              move.UCI_Elo = this.options["UCI_Elo"]; // set UCI Elo option
              move.UCI_LimitStrength = this.options["UCI_LimitStrength"]; // set UCI LimitStrength option
              this.topMoves.push(move);
              this.SortTopMoves();
            } else if (move.depth >= this.topMoves[index].depth) {
              // only replace if this move has a higher depth than
              // the one in the current top move list
              move.skillLevel = this.options["Skill Level"]; // set skill level option
              move.UCI_Elo = this.options["UCI_Elo"]; // set UCI Elo option
              move.UCI_LimitStrength = this.options["UCI_LimitStrength"]; // set UCI LimitStrength option
              this.topMoves[index] = move;
              this.SortTopMoves();
            }
          }
        }      
    
        if (!bestMoveSelected && this.master.options.text_to_speech) {
            // pick a random top move up to 5 below the selected depth
            let maxDepth = Math.max(...this.topMoves.map(move => move.depth));
            let randomDepth = Math.floor(Math.random() * Math.min(5, maxDepth));
            let topMoves = this.topMoves.filter(move => move.depth >= randomDepth);
            const randomIndex = Math.floor(Math.random() * (topMoves.length));
            const randomMove = topMoves[randomIndex];
            // speak the top move if text-to-speech is enabled
            const msg = new SpeechSynthesisUtterance(`${randomMove.move}`);
            const voices = window.speechSynthesis.getVoices();
            const femaleVoices = voices.filter(voice => voice.voiceURI.includes('Google UK English Female'));
            if (femaleVoices.length > 0) {
                msg.voice = femaleVoices[0];
            }
            msg.volume = 0.75; // set the volume to 75%
            msg.rate = 1;
            window.speechSynthesis.cancel(); // stop any previous text-to-speech
            window.speechSynthesis.speak(msg);
        } 
      
        if (!bestMoveSelected) { // continue loading depths if a best move hasn't been selected
          if (this.master.options.legit_auto_move) {
            // Select a random depth to consider
            let random_depth;
            if (this.maxDepthLoaded) {
              random_depth = this.maxDepth;
            } else {
              random_depth = Math.floor(Math.random() * this.master.options.max_legit_auto_move_depth) + 1;
              this.maxDepthLoaded = true;
              this.maxDepth = random_depth;
            }      
                top_pv_moves = this.topMoves.filter(move => move.depth <= random_depth).slice(0, this.options["MultiPV"]);
            } else {
                top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);
            }
            this.master.game.HintMoves(top_pv_moves, this.lastTopMoves, isBestMove);
            if (this.master.options.move_analysis)
                this.AnalyzeLastMove();
        } else { // stop loading depths and select the best move
            top_pv_moves = [this.topMoves[0]]; // only consider the best move
        }
        if (this.master.options.legit_auto_move && bestMoveSelected && this.master.game.controller.getPlayingAs() == this.master.game.controller.getTurn()) {
            let bestMove;
            if (this.master.options.random_best_move) {
                // Randomly select a best move from lower depths
                const random_best_move_index = Math.floor(Math.random() * top_pv_moves.length);
                bestMove = top_pv_moves[random_best_move_index];
            } else {
                bestMove = top_pv_moves[0];
            }
            let legalMoves = this.master.game.controller.getLegalMoves();
            const index = legalMoves.findIndex(move => move.from === bestMove.from && move.to == bestMove.to);
            console.assert(index !== -1, "Illegal best move");
    
            let moveData = legalMoves[index];
            moveData.userGenerated = true;
            if (bestMove.promotion != null)
                moveData.promotion = bestMove.promotion;
    
    
            let auto_move_time = this.master.options.auto_move_time + Math.floor(Math.random() * this.master.options.auto_move_time_random) % this.master.options.auto_move_time_random_div * this.master.options.auto_move_time_random_multi;
    
                    setTimeout(() => {
                        this.master.game.controller.move(moveData);
                    }, auto_move_time);
                }
            }
    SortTopMoves() {
        // sort the top move list to bring the best moves on top (index 0)
        this.topMoves.sort(function (a, b) {
            if (b.mate === null) {
                // this move is mate and the other is not
                if (a.mate !== null) {
                    // a negative mate value is a losing move
                    return a.mate < 0 ? 1 : -1
                }
                // both moves has no mate, compare the depth first than centipawn
                if (a.depth === b.depth) {
                    if (a.cp === b.cp)
                        return 0;
                    return a.cp > b.cp ? -1 : 1;
                }
                return a.depth > b.depth ? -1 : 1;
            }
            else {
                // both this move and other move is mate
                if (a.mate !== null) {
                    // both losing move, which takes more moves is better
                    // both winning move, which takes less move is better
                    if ((a.mate < 0 && b.mate < 0) ||
                        (a.mate > 0 && b.mate > 0)) {
                        return a.mate < b.mate ? 1 : -1;
                    }
                    // comparing a losing move with a winning move, positive mate score is winning
                    return a.mate > b.mate ? -1 : 1;
                }
                return b.mate < 0 ? 1 : -1;
            }
        });
    }
}
class BetterMint {
    constructor(chessboard, options) {
        this.options = options;
        this.game = new GameController(this, chessboard);
        this.engine = new StockfishEngine(this);
        window.addEventListener("BetterMintUpdateOptions", (event) => {
            this.options = event.detail;
            this.game.UpdateExtensionOptions();
            this.engine.UpdateExtensionOptions();
            // show a notification when the settings is updated, but only if the previous notification has gone.
            if (window.toaster && window.toaster.notifications.findIndex((noti) => noti.id == "bettermint-settings-updated") == -1) {
                window.toaster.add({
                    id: "bettermint-settings-updated",
                    duration: 2000,
                    icon: "circle-gearwheel",
                    content: `Settings updated!`,
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
                content: `BetterMint is enabled!`,
            });
        }
    }
}
var ChromeRequest = (function () {
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
            var payload = { data: data, id: id };
            window.dispatchEvent(new CustomEvent("BetterMintGetOptions", { detail: payload }));
        });
    }
    return { getData: getData };
})();
function InitBetterMint(chessboard) {
    fetch(Config.pathToEcoJson).then(function (response) {
        return __awaiter(this, void 0, void 0, function* () {
            let table = yield response.json();
            ecoTable = new Map(table.map((data) => [data.f, true]));
        });
    });
    // get the extension option first
    ChromeRequest.getData().then(function (options) {
        try {
            master = new BetterMint(chessboard, options);
        }
        catch (e) {
            console.error(e);
            alert("Failed to load Chess Master");
        }
    });
}
customElements.whenDefined("chess-board").then(function (ctor) {
    ctor.prototype._createGame = ctor.prototype.createGame;
    ctor.prototype.createGame = function (e) {
        let result = this._createGame(e);
        InitBetterMint(this);
        return result;
    };
});
function PostChatMessage(content) {
    let chat_area = document.querySelector(".resizable-chat-area-component");
    let game_id = undefined;
    if (chat_area.__vue__.$vnode.context.liveGame != null) {
        game_id = chat_area.__vue__.$vnode.context.liveGame.uuid;
    }
    else {
        game_id = chat_area.__vue__.liveGame.uuid;
    }
    let user_id = context.user.uuid;
    let api = `https://services.chess.com/service/chat/game/${game_id}/players/messages?uid=${user_id}`;
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: content
        }),
        credentials: "include"
    };
    return fetch(api, options);
}
function testchat(content) {
    let vue = document.querySelector(".chat-room-component").__vue__;
    vue.$emit("chat-input", { "text": content });
}
