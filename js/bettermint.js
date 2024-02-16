"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function (resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function (resolve, reject) {
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
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var textNumber;
var mateInNumber;
var mescore;
var smallerscore;
var selfmaster;
var Config = undefined;
var context = undefined;
var eTable = null;
class TopMove {
    constructor(line, depth, cp, mate) {
        this.cp = cp;
        this.line = line.split(" ");
        this.move = this.line[0];
        this.promotion = this.move.length > 4 ? this.move.substring(4, 5) : null;
        this.from = this.move.substring(0, 2);
        this.to = this.move.substring(2, 4);
        this.mate = mate;
        this.depth = depth;
    }
}
class GameController {
    constructor(selfmaster, chessboard) {
        this.selfmaster = selfmaster;
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
                setTimeout(() => {
                    this.ResetGame();
                }, 100)
            }
        });
        this.controller.on('UpdateOptions', (event) => {
            this.options = this.controller.getOptions();
            if (event.data.flipped != undefined && this.evalBar != null) {
                if (event.data.flipped) this.evalBar.classList.add("evaluation-bar-flipped");
                else this.evalBar.classList.remove("evaluation-bar-flipped");
            }
        });
        this.CreateAnalysisTools();
        setTimeout(() => { this.ResetGame(); }, 100);
    }
    UpdateExtensionOptions() {
        let options = this.selfmaster.options;
        if (options.evaluation_bar && this.evalBar == null) this.CreateAnalysisTools();
        else if (!options.evaluation_bar && this.evalBar != null) {
            this.evalBar.remove();
            this.evalBar = null;
        }
        if (options.depth_bar && this.depthBar == null) this.CreateAnalysisTools();
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
        // we must wait for a little bit because at this point the chessboard has not
        // been added to chessboard layout (#board-layout-main)
        let interval1 = setInterval(() => {
            let layoutChessboard = this.chessboard.parentElement;
            if (layoutChessboard == null) return;
            let layoutMain = layoutChessboard.parentElement;
            if (layoutMain == null) return;
            clearInterval(interval1);
            if (this.selfmaster.options.depth_bar && this.depthBar == null) {
                // create depth bar
                let depthBar = document.createElement("div");
                depthBar.classList.add("depthBarLayout");
                depthBar.innerHTML = `<div class="depthBar"><span class="depthBarProgress"></span></div>`;
                layoutMain.insertBefore(depthBar, layoutChessboard.nextSibling);
                this.depthBar = depthBar.querySelector(".depthBarProgress");
            }
            if (this.selfmaster.options.evaluation_bar && this.evalBar == null) {
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
                if (!this.options.isWhiteOnBottom && this.options.flipped) this.evalBar.classList.add("evaluation-bar-flipped");
            }
        }, 10);
    }
    
    UpdateEngine(isNewGame) {
        // console.log("UpdateEngine", isNewGame);
        let FENs = this.controller.getFEN();
        this.selfmaster.engine.UpdatePosition(FENs, isNewGame);
        this.SetCurrentDepth(0);
    }
    ResetGame() {
        this.UpdateEngine(true);
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
        let options = this.selfmaster.options;
        let bestMove = topMoves[0];
        if (options.show_hints) {
            this.RemoveCurrentMarkings();
            topMoves.forEach((move, idx) => {
                // isBestMove means final evaluation, don't include the moves that have less depth than the best move
                if (isBestMove && move.depth !== bestMove.depth) return;
                let color = idx === 0 ? this.options.arrowColors.alt : idx >= 1 && idx <= 2 ? this.options.arrowColors.shift : idx >= 3 && idx <= 5 ? this.options.arrowColors.default : this.options.arrowColors.ctrl;
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
                if (move.mate !== null) {
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
            let depthPercent = (isBestMove ? bestMove.depth : bestMove.depth - 1) / this.selfmaster.engine.depth * 100;
            this.SetCurrentDepth(depthPercent);
        }
        if (options.evaluation_bar) {
            let score = (bestMove.mate != null ? bestMove.mate : bestMove.cp);
            if (this.controller.getTurn() == 2) score *= -1;
            this.SetEvaluation(score, bestMove.mate != null);
        }
    }
    SetCurrentDepth(percent) {
        if (this.depthBar == null) return;
        let style = this.depthBar.style;
        if (percent <= 0) {
            this.depthBar.classList.add("disable-transition");
            style.width = `0%`;
            this.depthBar.classList.remove("disable-transition");
        } else {
            if (percent > 100) percent = 100;
            style.width = `${percent}%`;
        }
    }
    SetEvaluation(score, isMate) {
        if (this.evalBar == null) return;
        var percent, textNumber, textScoreAbb;
        if (!isMate) {
            let eval_max = 500;
            let eval_min = -500;
            window.smallerscore = score / 100; // convert centipawns to unit in pawns
            window.mescore = smallerscore.toString();
            window.mateInNumber = false;
            if (document.getElementById("movescore") !== null) {
                if (smallerscore > 0) {
                    document.getElementById('movescore').style.color = 'lightgreen';
                    document.getElementById('movescoreprefix').innerHTML = "Evaluation Score: "
                    document.getElementById('movescore').innerHTML = '+' + mescore;
                } else if (smallerscore < 0) {
                    document.getElementById('movescore').style.color = 'red';
                    document.getElementById('movescoreprefix').innerHTML = "Evaluation Score: "
                    document.getElementById('movescore').innerHTML = mescore;
                }
            }
            percent = 90 - (((score - eval_min) / (eval_max - eval_min)) * (95 - 5)) + 5;
            if (percent < 5) percent = 5;
            else if (percent > 95) percent = 95;
            textNumber = (score >= 0 ? "+" : "") + smallerscore.toFixed(2);
            textScoreAbb = Math.abs(smallerscore).toFixed(1);
        } else {
            percent = score < 0 ? 100 : 0;
            let textNumber = "M" + Math.abs(score).toString();
            window.mateInNumber = Math.abs(score).toString();
            textScoreAbb = textNumber;
            if (document.getElementById("movescore") !== null) {
                if (mateInNumber.toString().charAt(0) !== "-") {
                    document.getElementById('movescore').style.color = 'lightgreen';
                    document.getElementById('movescoreprefix').innerHTML = "Checkmate In: "
                    if (mateInNumber !== 1) {
                        document.getElementById('movescore').innerHTML = mateInNumber + ' Moves'
                    } else if (mateInNumber === 1) {
                        document.getElementById('movescore').innerHTML = mateInNumber + ' Move'
                    }
                } else if (mateInNumber.toString().charAt(0) === "-") {
                    document.getElementById('movescore').style.color = 'red';
                    document.getElementById('movescoreprefix').innerHTML = "Checkmate In: "
                    if (mateInNumber !== 1) {
                        document.getElementById('movescore').innerHTML = mateInNumber + ' Moves'
                    } else if (mateInNumber === 1) {
                        document.getElementById('movescore').innerHTML = mateInNumber + ' Move'
                    }
                }
            }
        }
        this.evalBarFill.style.transform = `translate3d(0px, ${percent}%, 0px)`;
        this.evalScore.innerText = textNumber;
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
    constructor(selfmaster) {
        let stockfishJsURL;
        let stockfishPathConfig = Config.threadedEnginePaths.stockfish;
        this.selfmaster = selfmaster;
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
        this.threads = 10;
        this.depth = this.selfmaster.options.depth;
        this.options = {
            "UCI_Elo": this.selfmaster.options.elo,
            "UCI_LimitStrength": this.selfmaster.options.limit_strength,
            "Skill Level": this.selfmaster.options.skill_level,
            "Contempt": this.selfmaster.options.contempt,
            "UCI_Chess960": this.selfmaster.options.chess960,
            "Skill Level Maximum Error": this.selfmaster.options.skill_level_error,
            "Skill Level Probability": this.selfmaster.options.skill_level_prob,
        }

        // Check if stockfish11 is true to load single-threaded
        if (this.selfmaster.options.stockfish11) {
            stockfishJsURL = `${stockfishPathConfig.singleThreaded.loader}#${stockfishPathConfig.singleThreaded.engine}`;
        } else {
            // Load multi-threaded by default unless an error occurs
            try {
                new SharedArrayBuffer(1024);
                stockfishJsURL = `${stockfishPathConfig.multiThreaded.loader}#${stockfishPathConfig.multiThreaded.engine}`;
                this.options["Threads"] = 10;
                if (this.selfmaster.options.use_nnue) {
                    this.options["Use NNUE"] = true;
                    this.options["EvalFile"] = stockfishPathConfig.multiThreaded.nnue;
                }
            } catch (e) {
                // If there's an error, fall back to single-threaded
                stockfishJsURL = `${stockfishPathConfig.singleThreaded.loader}#${stockfishPathConfig.singleThreaded.engine}`;
            }
        }
        this.options["MultiPV"] = this.selfmaster.options.multipv;
        this.options["Ponder"] = true;
        try {
            this.stockfish = new Worker(stockfishJsURL);
            this.stockfish.onmessage = (e) => {
                this.ProcessMessage(e);
                console.log(e.data)
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
    }
    send(cmd) {
        this.stockfish.postMessage(cmd);
        console.log(cmd)
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
    UpdateExtensionOptions() {
        this.depth = this.selfmaster.options.depth;
        // trigger this method to show hints, analysis,.. if it was disabled before if
        // this.isEvaluating is false, it already found the best move
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
        let line = (event && typeof event === "object") ? event.data : event;
        // console.log("SF: " + line);
        if (line === 'uciok') { // uci engine is ok :p
            this.loaded = true;
            this.selfmaster.onEngineLoaded();
        } else if (line === 'readyok') { // uci engine is ready :p
            this.ready = true;
            if (this.readyCallbacks.length > 0) {
                let copy = this.readyCallbacks;
                this.readyCallbacks = [];
                copy.forEach(function (callback) {
                    callback();
                });
            }
        } else if (this.isEvaluating && line === 'Load eval file success: 1') { // nnue eval file loaded :p
            // we have sent the "go" command before stockfish loaded the eval file
            // this.isEvaluating will be stuck at true, this fixes it.
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
            let match = line.match(/^info .*\bdepth (\d+) .*\bseldepth (\d+) .*\bmultipv (\d+) .*\bscore (\w+) (-?\d+) .*\bpv (.+)/);
            if (match) {
                if (!this.isRequestedStop) {
                    let cp = (match[4] == "cp") ? // get score in centipawns from info
                        parseInt(match[5]) : null;
                    let mate = (match[4] == "cp") ? // get score in mate from info
                        null : parseInt(match[5]);
                    let move = new TopMove(match[6], parseInt(match[1]), cp, mate); // match 6 are the moves, match 1 is the depth, cp, or mate is stockfish's evaluation
                    if (parseInt(match[3]) <= this.selfmaster.options.multipv) { // check multipv against selfmaster options
                        this.onTopMoves(move, false);
                    }
                }
            } else if (match = line.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)?/)) { // if the engine done calculating
                this.isEvaluating = false;
                if (this.goDoneCallbacks.length > 0) {
                    let copy = this.goDoneCallbacks;
                    this.goDoneCallbacks = [];
                    copy.forEach(function (callback) {
                        callback();
                    });
                }
                if (!this.isRequestedStop && match[1] !== undefined) {
                    const index = this.topMoves.findIndex(object => object.move === match[1]);
                    if (index < 0) {
                        console.assert(false, `The engine returned the best move "${match[1]}" but it's not in the top move list: `, this.topMoves);
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
            if (isNewGame) this.isInTheory = eTable != null;;
            if (this.isInTheory) {
                let shortFen = this.selfmaster.game.controller.getFEN().split(" ").slice(0, 3).join(" ");
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
        let lastMove = this.selfmaster.game.controller.getLastMove();
        if (lastMove === undefined) return;
        if (this.isInTheory) {
            this.lastMoveScore = "Book";
        } else if (this.lastTopMoves.length > 0) {
            let lastBestMove = this.lastTopMoves[0];
            // check if last move is the best move
            if (lastBestMove.from === lastMove.from && lastBestMove.to === lastMove.to) {
                this.lastMoveScore = "BestMove";
            } else {
                let bestMove = this.topMoves[0];
                if (lastBestMove.mate != null) {
                    // if last move is losing mate, this move just escapes a mate if last move is
                    // winning mate, this move is a missed win
                    if (bestMove.mate == null) {
                        this.lastMoveScore = lastBestMove.mate > 0 ? "MissedWin" : "Brilliant";
                    } else {
                        // both moves are mate
                        this.lastMoveScore = lastBestMove.mate > 0 ? "Excellent" : "ResignWhite";
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
                "Brilliant": "#1baca6",
                "GreatFind": "#5c8bb0",
                "BestMove": "#9eba5a",
                "Excellent": "#96bc4b",
                "Good": "#96af8b",
                "Book": "#a88865",
                "Inaccuracy": "#f0c15c",
                "Mistake": "#e6912c",
                "Blunder": "#b33430",
                "MissedWin": "#dbac16"
            };
            let hlColor = highlightColors[this.lastMoveScore];
            if (hlColor != null) {
                this.selfmaster.game.controller.markings.addOne({
                    data: {
                        opacity: 0.5,
                        color: hlColor,
                        square: lastMove.to
                    },
                    node: true,
                    persistent: true,
                    type: "highlight"
                });
            }
            // this.selfmaster.game.controller.markings.removeOne(`effect|${lastMove.to}`);
            this.selfmaster.game.controller.markings.addOne({
                data: {
                    square: lastMove.to,
                    type: this.lastMoveScore
                },
                node: true,
                persistent: true,
                type: "effect"
            });
            if (this.lastMoveScore === "Blunder") {
                this.selfmaster.game.controller.markings.addOne({
                    data: {
                        square: lastMove.to,
                        type: "Blunder"
                    },
                    node: true,
                    persistent: true,
                    type: "effect"
                });
            }
        }
    }
    onTopMoves(move = null, isBestMove = false) {
        window.top_pv_moves = []; // Initialize top_pv_moves as an empty array
        var bestMoveSelected = false;
    
        if (move != null) {
            const index = this.topMoves.findIndex((object) => object.move === move.move);
    
            if (isBestMove) { // Engine just finished evaluation
                bestMoveSelected = true; // A best move has been selected
            } else {
                if (index === -1) {
                    move.skillLevel = this.options["Skill Level"];
                    move.UCI_Elo = this.options["UCI_Elo"];
                    move.UCI_LimitStrength = this.options["UCI_LimitStrength"];
                    this.topMoves.push(move);
                    this.SortTopMoves();
                } else if (move.depth >= this.topMoves[index].depth) {
                    move.skillLevel = this.options["Skill Level"];
                    move.UCI_Elo = this.options["UCI_Elo"];
                    move.UCI_LimitStrength = this.options["UCI_LimitStrength"];
                    this.topMoves[index] = move;
                    this.SortTopMoves();
                }
            }
        }
    
        // Create an array of theory moves
        const theoryMoves = top_pv_moves.filter(move => eTable.get(move.move) === true);
    
        if (theoryMoves.length > 0) {
            console.log("Found moves in theory:");
            theoryMoves.forEach(theoryMove => {
                console.log(theoryMove.move);
            });
    
            // Sort theory moves using the provided sorting logic
            theoryMoves.sort((a, b) => {
                if (a.mate !== null && b.mate !== null) {
                    return a.mate - b.mate;
                } else if (a.mate !== null) {
                    return -1;
                } else if (b.mate !== null) {
                    return 1;
                } else if (a.cp !== b.cp) {
                    return a.cp > b.cp ? -1 : 1;
                } else if (a.depth !== b.depth) {
                    return a.depth > b.depth ? -1 : 1;
                } else {
                    // Keep the original order if all criteria are equal
                    return 0;
                }
            });            
    
            // Append non-theory moves to the sorted theory moves
            const nonTheoryMoves = top_pv_moves.filter(move => !theoryMoves.includes(move));
            top_pv_moves = [...theoryMoves, ...nonTheoryMoves];
        } else if (!bestMoveSelected) {
            // No theory moves found and no best move selected, keep the original top moves
            top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);
        }

        if (bestMoveSelected) {
            // If a best move has been selected, consider all moves in topMoves
            top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]); // sort by rank in multipv
            this.selfmaster.game.HintMoves(top_pv_moves, this.lastTopMoves, isBestMove);

            if (this.selfmaster.options.move_analysis) {
                this.AnalyzeLastMove();
            }
        } else {
            if (this.selfmaster.options.legit_auto_move) { // legit move stuff, ignore
                const movesWithAccuracy = this.topMoves.filter(move => move.accuracy !== undefined);

                if (movesWithAccuracy.length > 0) {
                    // Sort the moves by accuracy in descending order
                    movesWithAccuracy.sort((a, b) => b.accuracy - a.accuracy);

                    // Calculate the total accuracy
                    const totalAccuracy = movesWithAccuracy.reduce((sum, move) => sum + move.accuracy, 0);

                    // Calculate the cumulative probabilities
                    const cumulativeProbabilities = movesWithAccuracy.reduce((arr, move) => {
                        const lastProbability = arr.length > 0 ? arr[arr.length - 1] : 0;
                        const probability = move.accuracy / totalAccuracy;
                        arr.push(lastProbability + probability);
                        return arr;
                    }, []);

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
                    top_pv_moves = [selectedMove, ...this.topMoves.filter(move => move !== selectedMove)];
                } else {
                    // If no moves have accuracy information, use the normal PV moves
                    top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);

                }
            } // end ignore
            if (this.selfmaster.options.legit_auto_move) { // random crap with auto move
                const randomMoveIndex = Math.floor(Math.random() * top_pv_moves.length);
                const randomMove = top_pv_moves[randomMoveIndex];
                top_pv_moves = [randomMove, ...top_pv_moves.filter(move => move !== randomMove)]; // Move the random move to the front of the PV moves
            } else { // if no auto move and engine aint even done, idfk what this is doing
                top_pv_moves = this.topMoves.slice(0, this.options["MultiPV"]);
            }
        }

        const bestMoveChance = this.selfmaster.options.best_move_chance;
        if (Math.random() * 100 < bestMoveChance && this.selfmaster.options.legit_auto_move) {
            top_pv_moves = [top_pv_moves[0]]; // Only consider the top move
        } else {
            const randomMoveIndex = Math.floor(Math.random() * top_pv_moves.length);
            const randomMove = top_pv_moves[randomMoveIndex];
            top_pv_moves = [randomMove, ...top_pv_moves.filter(move => move !== randomMove)]; // Move the random move to the front of the PV moves
        }

        if (bestMoveSelected && this.selfmaster.options.legit_auto_move && this.selfmaster.game.controller.getPlayingAs() === this.selfmaster.game.controller.getTurn()) {
            let bestMove;
            if (this.selfmaster.options.random_best_move) {
                const random_best_move_index = Math.floor(Math.random() * top_pv_moves.length);
                bestMove = top_pv_moves[random_best_move_index];
            } else {
                bestMove = top_pv_moves[0];
            }
            const legalMoves = this.selfmaster.game.controller.getLegalMoves();
            const index = legalMoves.findIndex(
                (move) => move.from === bestMove.from && move.to === bestMove.to);
            console.assert(index !== -1, "Illegal best move");
            const moveData = legalMoves[index];
            moveData.userGenerated = true;
            if (bestMove.promotion !== null) {
                moveData.promotion = bestMove.promotion;
            }
            if (this.selfmaster.options.highmatechance) {
                const sortedMoves = this.topMoves.sort((a, b) => {
                    if (a.mateInNumber !== null && b.mateInNumber === null) {
                        return -1;
                    } else if (a.mateInNumber === null && b.mateInNumber !== null) {
                        return 1;
                    } else if (a.mateInNumber !== null && b.mateInNumber !== null) {
                        if (a.mateInNumber <= this.selfmaster.options.matefindervalue && b.mateInNumber <= this.selfmaster.options.matefindervalue) {
                            return a.mateInNumber - b.mateInNumber;
                        } else {
                            return 0;
                        }
                    } else {
                        return 0;
                    }
                });
                top_pv_moves = sortedMoves.slice(0, Math.min(this.options["MultiPV"], this.topMoves.length));
                const mateMoves = top_pv_moves.filter((move) => move.mateInNumber !== null);
                if (mateMoves.length > 0) {
                    const fastestMateMove = mateMoves.reduce((a, b) => (a.mateInNumber < b.mateInNumber ? a : b));
                    top_pv_moves = [fastestMateMove];
                }
            }
            let auto_move_time = this.selfmaster.options.auto_move_time + (Math.floor(Math.random() * this.selfmaster.options.auto_move_time_random) % this.selfmaster.options.auto_move_time_random_div) * this.selfmaster.options.auto_move_time_random_multi;
            if (isNaN(auto_move_time) || auto_move_time === null || auto_move_time === undefined) {
                auto_move_time = 0;
            }
            let secondsTillAutoMove = (auto_move_time / 1000).toFixed(1);

            // Check if auto_move_time is 0 or 0.0
            if (auto_move_time === 0 || auto_move_time === 0.0) {
                secondsTillAutoMove = 0.1; // Set display value to 0.1
            }
            
            if (window.toaster) {
                window.toaster.add({
                    id: "chess.com",
                    duration: auto_move_time, // Use the original duration value
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
                this.selfmaster.game.controller.move(moveData);
            }, auto_move_time);
        }
    }
    SortTopMoves() {
        let sortingMode = "normal";
      
        if (this.selfmaster.options.aggressive_mode) {
          sortingMode = "aggressive";
        } else if (this.selfmaster.options.defensive_mode) {
          sortingMode = "defensive";
        }
      
        this.topMoves.sort(function (a, b) {
          if (sortingMode === "aggressive") {
            // Aggressive move sorting
            if (b.mate !== null) {
              if (a.mate !== null) {
                // Both moves are mate moves
                return a.mate - b.mate; // Sort by mate value in ascending order
              }
              // Only b is a mate move, prioritize b
              return 1;
            }
            if (a.mate !== null) {
              // Only a is a mate move, prioritize a
              return -1;
            }
      
            // Neither move is a mate move
            if (a.depth === b.depth) {
              if (a.cp === b.cp) {
                return 0;
              }
              return a.cp > b.cp ? -1 : 1;
            }
            return a.depth > b.depth ? -1 : 1;
          } else if (sortingMode === "defensive") {
            // Defensive move sorting
            if (b.mate !== null) {
              if (a.mate !== null) {
                // Both moves are mate moves
                // Introduce randomness to mate moves in defensive mode
                return Math.random() > 0.5 ? a.mate - b.mate : b.mate - a.mate;
              }
              // Only b is a mate move, prioritize b
              return 1;
            }
            if (a.mate !== null) {
              // Only a is a mate move, prioritize a
              return -1;
            }
      
            // Neither move is a mate move
            if (a.depth === b.depth) {
              if (a.cp === b.cp) {
                return 0;
              }
              return a.cp > b.cp ? -1 : 1;
            }
            return a.depth > b.depth ? -1 : 1;
          } else {
            // Normal move sorting (same as provided detailedMoves.sort code)
            if (b.mate !== null && a.mate === null) {
              return b.mate > 0 ? 1 : -1; // Sort moves with positive 'mate' value first
            }
            if (a.mate !== null && b.mate === null) {
              return a.mate < 0 ? 1 : -1; // Sort moves with negative 'mate' value first
            }
            if (a.mate === null && b.mate === null) {
              if (+a.depth === +b.depth) {
                return a.cp === b.cp ? 0 : a.cp > b.cp ? -1 : 1; // Sort based on 'cp' (centipawn)
              }
              return +a.depth > +b.depth ? -1 : 1; // Sort based on 'depth'
            }
            if (a.mate < 0 && b.mate < 0) {
              return a.line.length === b.line.length ? 0 : a.line.length < b.line.length ? 1 : -1; // Sort based on 'line' length in descending order
            }
            if (a.mate > 0 && b.mate > 0) {
              return a.line.length === b.line.length ? 0 : a.line.length > b.line.length ? 1 : -1; // Sort based on 'line' length in ascending order
            }
            return a.mate < b.mate ? 1 : -1; // Sort remaining moves based on 'mate' value in descending order
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
            // show a notification when the settings is updated, but only if the previous
            // notification has gone
            if (window.toaster && window.toaster.notifications.findIndex((noti) => noti.id == "bettermint-settings-updated") == -1) {
                window.toaster.add({
                    id: "bettermint-settings-updated",
                    duration: 2000,
                    icon: "circle-gearwheel",
                    content: `Settings updated!`
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
                content: `BetterMint is enabled!`
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
var ChromeRequest = (function () { // Options listener and sender
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
                id: id
            };
            window.dispatchEvent(new CustomEvent("BetterMintGetOptions", {
                detail: payload
            }));
        });
    }
    return {
        getData: getData
    };
})();

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
            selfmaster = new BetterMint(chessboard, options);
        } catch (e) {
            console.error(e);
            console.error('oh noes selfmaster didnt load')
        }
    });
}
function createGameHook(ctor) {
    ctor.prototype._createGame = ctor.prototype.createGame;
    ctor.prototype.createGame = function (e) {
        let result = this._createGame(e);
        InitBetterMint(this);
        return result;
    };
}

customElements.whenDefined("wc-chess-board").then(function (ctor) {
    window.ctor = ctor;
    createGameHook(ctor);
}).catch(function () {
    // This code will run if "wc-chess-board" is not defined
    console.log("wc-chess-board not found. Using chess-board instead.");
});

customElements.whenDefined("chess-board").then(function (ctor) {
    window.ctor = ctor;
    createGameHook(ctor);
}).catch(function () {
    console.log("chess-board not found.");
});

window.onload = function () {
    var url = window.location.href;

    // Check if you're possibly in a game
    if (url.includes('com/play/') || url.includes('com/game/') || url.includes('puzzle')) {
        // Remove the side bar ad on load
        var adElement = document.getElementById('board-layout-ad');
        if (adElement) {
            adElement.remove();
        }
    }
};



function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
window.onmessage = function (event) {
    console.log(event.data);
    if (event.data == 'popout') {
        let joe = document.createElement('div')
        joe.id = "bmwparent";
        joe.innerHTML = `
    <div id="bmwindow">
    <style>
    @import url('https://fonts.googleapis.com/css?family=Comfortaa');
    @import url('https://fonts.googleapis.com/css?family=Exo 2');
    #bmtitle {
        font-size: 240%;
        margin: 0;
        user-select: none;
        height: 50px;
        font-family: Comfortaa;
        vertical-align: text-bottom;
    }
    #header-logo {
        background-color: #202123;
        width: 100%;
        border-radius: 10px 10px 0px 0px;
        height: 50px;
        justify-content: center;
        display: flex;
    }
    #bmwindow {
        vertical-align: middle;
        text-align: center;
        font-family: "Exo 2";
        margin: auto;
        top: 1px;
        border-radius: 10px;
        height: 300px;
        z-index: 6969420;
        left: 1150px;
        animation: fadein 0.5s linear forwards;
        position: fixed;
        background-color: #292A2D;
        color: #ffffff;
        padding: 0;
        width: 500px;
        margin: 0;
    }
    @keyframes fadein {
        0% {
            opacity: 0;
        }

        100% {
            opacity: 1;
        }
    }
    @keyframes fadeout {
        0% {
            opacity: 1;
        }

        100% {
            opacity: 0;
        }
    }
    #logo {
        height: 50px;
        margin-right: 0;
        width: 50px;
    }
    #info {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        margin-top: 10px;
    }
    #moveinfo {
        border-right: 1px solid #fff;
        width: 125px;
    }
    all {
        revert;
    }
    #wdl {
        border-right: 1px solid #fff;
        width: 125px;
    }
    #recalc {
        fill: #fff;
        display: block;
        margin-top: 10px;
        position: absolute;
        transition: fill 0.5s ease;
        margin-bottom: 10px;
        margin-right: 10px;
        height: 30px;
        width: 30px;
        cursor: pointer;
        right: 10px;
    }
    #recalc:hover {
        fill: #5d3fd3;
        transition: fill 0.5s ease;
    }
    </style>
    <div id="header-logo">
        <div>
            <img id='logo' src="https://idabest.tk/betterlogo.png">
            <span id="bmtitle">BetterMint</span>
        </div>
            <svg id="recalc" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2023 Fonticons, Inc. --><path d="M386.3 160H336c-17.7 0-32 14.3-32 32s14.3 32 32 32H464c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"/></svg>
        </div>
        <div id="info">
            <div id="moveinfo">
                <h2 class="infotitle">Move Info</h2>
                <hr style="width: 100%;">
                <div id="movescorecontainer">
                    <span id="movescoreprefix">Evaluation Score: </span>
                    <span id="movescore">Unavailable</span>
                </div>
            </div>
            <div id="wdl">
                <h2 class="wdltitle">WDL</h2>
                <hr style="width: 100%;">
                
            </div>
        </div>
    </div>
    `
        if (document.getElementById('bmwindow') === null || document.getElementById('bmwindow') === undefined) {
            document.body.appendChild(joe)
            dragElement(document.getElementById('bmwindow'));
            if (document.getElementById("movescore") !== null) {
                if (smallerscore > 0) {
                    document.getElementById('movescore').style.color = 'lightgreen';
                    document.getElementById('movescore').innerHTML = '+' + mescore;
                } else if (smallerscore < 0) {
                    document.getElementById('movescore').style.color = 'red';
                    document.getElementById('movescore').innerHTML = mescore;
                }
            }
            if (mateInNumber !== false) {
                if (document.getElementById("movescore") !== null) {
                    if (textNumber.charAt(0) !== "-") {
                        document.getElementById('movescore').style.color = 'lightgreen';
                        document.getElementById('movescoreprefix').innerHTML = "Checkmate In: "
                        if (mateInNumber !== 1) {
                            document.getElementById('movescore').innerHTML = mateInNumber + ' Moves'
                        } else if (mateInNumber === 1) {
                            document.getElementById('movescore').innerHTML = mateInNumber + ' Move'
                        }
                    } else if (textNumber.charAt(0) === "-") {
                        document.getElementById('movescore').innerHTML = textNumber;
                        document.getElementById('movescore').style.color = 'red';
                        document.getElementById('movescoreprefix').innerHTML = "Checkmate In: "
                        if (mateInNumber !== 1) {
                            document.getElementById('movescore').innerHTML = mateInNumber + ' Moves'
                        } else if (mateInNumber === 1) {
                            document.getElementById('movescore').innerHTML = mateInNumber + ' Move'
                        }
                    }
                }
            }
        } else if (document.getElementById('bmwindow') !== null || document.getElementById('bmwindow') !== undefined) {
            document.getElementById('bmwindow').style.animation = 'fadeout 0.5s linear forwards';
            setTimeout(() => {
                document.getElementById('bmwindow').style.display = "none";
                document.getElementById('bmwparent').remove();
            }, 500);

        }
    }
}
// Get the current WebRTC configuration of the browser
const config = {
    'iceServers': [],
    'iceTransportPolicy': 'all',
    'bundlePolicy': 'balanced',
    'rtcpMuxPolicy': 'require',
    'sdpSemantics': 'unified-plan',
    'peerIdentity': null,
    'certificates': []
};
// Set the WebRTC configuration options to block fingerprinting
const constraints = {
    'optional': [{
        'googIPv6': false
    }, {
        'googDscp': false
    }, {
        'googCpuOveruseDetection': false
    }, {
        'googCpuUnderuseThreshold': 55
    }, {
        'googCpuOveruseThreshold': 85
    }, {
        'googSuspendBelowMinBitrate': false
    }, {
        'googScreencastMinBitrate': 400
    }, {
        'googCombinedAudioVideoBwe': false
    }, {
        'googScreencastUseTransportCc': false
    }, {
        'googNoiseReduction2': false
    }, {
        'googHighpassFilter': false
    }, {
        'googEchoCancellation3': false
    }, {
        'googExperimentalEchoCancellation': false
    }, {
        'googAutoGainControl2': false
    }, {
        'googTypingNoiseDetection': false
    }, {
        'googAutoGainControl': false
    }, {
        'googBeamforming': false
    }, {
        'googExperimentalNoiseSuppression': false
    }, {
        'googEchoCancellation': false
    }, {
        'googEchoCancellation2': false
    }, {
        'googNoiseReduction': false
    }, {
        'googExperimentalWebRtcEchoCancellation': false
    }, {
        'googRedundantRtcpFeedback': false
    }, {
        'googScreencastDesktopMirroring': false
    }, {
        'googSpatialAudio': false
    }, {
        'offerToReceiveAudio': false
    }, {
        'offerToReceiveVideo': false
    }]
};
Object.assign(config, constraints);
const oldPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
if (oldPeerConnection) {
    window.RTCPeerConnection = function (config, constraints) {
        const pc = new oldPeerConnection(config, constraints);
        pc.getTransceivers = function () {
            const transceivers = oldPeerConnection.prototype.getTransceivers.call(this);
            for (const transceiver of transceivers) {
                transceiver.stop();
            }
            return [];
        };
        return pc;
    };
}
window.addEventListener('bm', function (event) { // get
    if (event.source === window && event.data) {
        this.alert('best move: ' + event)
    }
}, false);