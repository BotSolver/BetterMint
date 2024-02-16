"use strict";
var inputDepth;
var inputElo;
var inputSkillLevel;
var inputMultiPV;
var inputLimitStrength;
var inputThreads;
var inputAutoMoveTime;
var inputAutoMoveTimeRandom;
var inputAutoMoveTimeRandomDiv;
var inputAutoMoveTimeRandomMulti;
var inputBestMoveChance;
var inputStockfish11;
var inputContempt;
var inputChess960;
var inputSkillLevelProb;
var inputSkillLevelError;
var inputLegitAutoMove;
var inputMateFinderValue;
var inputHighMateChance;
var inputAggressiveMode;
var inputDefensiveMode;
var inputRandomBestMove;
var inputMaxLegitAutoMoveDepth;
var inputShowHints;
var inputMoveAnalysis;
var inputDepthBar;
var inputTextToSpeech;
var inputEvalBar;
var inputUseNNUE;

const DefaultExtensionOptions = {
    depth: 3,
    elo: 1500,
    contempt: 24,
    skill_level_prob: 128,
    skill_level_error: 200,
    skill_level: 10,
    multipv: 3,
    threads: 10,
    auto_move_time: 5000,
    auto_move_time_random: 10000,
    auto_move_time_random_div: 10,
    auto_move_time_random_multi: 1000,
    max_legit_auto_move_depth: 5,
    matefindervalue: 5,
    stockfish11: false,
    chess960: false,
    highmatechance: false,
    limit_strength: false,
    aggressive_mode: false,
    defensive_mode: false,
    random_best_move: false,
    legit_auto_move: false,
    show_hints: true,
    text_to_speech: false,
    move_analysis: true,
    best_move_chance: 30,
    depth_bar: true,
    evaluation_bar: true,
    use_nnue: false
};

function RestoreOptions() {
    chrome.storage.sync.get(DefaultExtensionOptions, function (opts) {
        let options = opts;
        if (inputDepth !== null && inputDepth.value !== undefined) {
            inputDepth.value = options.depth.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputDepth.dispatchEvent(event);
        }
        if (inputElo !== null && inputElo.value !== undefined) {
            inputElo.value = options.elo.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputElo.dispatchEvent(event);
        }
        if (inputContempt !== null && inputContempt.value !== undefined) {
            inputContempt.value = options.contempt.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputContempt.dispatchEvent(event);
        }
        if (inputBestMoveChance !== null && inputBestMoveChance.value !== undefined) {
            inputBestMoveChance.value = options.best_move_chance.toString(); // gets the value as a string, valid but not apparently option is undefined
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputBestMoveChance.dispatchEvent(event);
        }
        if (inputMultiPV !== null && inputMultiPV.value !== undefined) {
            inputMultiPV.value = options.multipv.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputMultiPV.dispatchEvent(event);
        }
        if (inputSkillLevel !== null && inputSkillLevel.value !== undefined) {
            inputSkillLevel.value = options.skill_level.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputSkillLevel.dispatchEvent(event);
        }
        if (inputSkillLevelError !== null && inputSkillLevelError.value !== undefined) {
            inputSkillLevelError.value = options.skill_level_error.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputSkillLevelError.dispatchEvent(event);
        }
        if (inputSkillLevelProb !== null && inputSkillLevelProb.value !== undefined) {
            inputSkillLevelProb.value = options.skill_level_prob.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputSkillLevelProb.dispatchEvent(event);
        }
        if (inputAutoMoveTime !== null && inputAutoMoveTime.value !== undefined) {
            inputAutoMoveTime.value = options.auto_move_time.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputAutoMoveTime.dispatchEvent(event);
        }
        if (inputAutoMoveTimeRandom !== null && inputAutoMoveTimeRandom.value !== undefined) {
            inputAutoMoveTimeRandom.value = options.auto_move_time_random.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputAutoMoveTimeRandom.dispatchEvent(event);
        }
        if (inputAutoMoveTimeRandomDiv !== null && inputAutoMoveTimeRandomDiv.value !== undefined) {
            inputAutoMoveTimeRandomDiv.value = options.auto_move_time_random_div.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputAutoMoveTimeRandomDiv.dispatchEvent(event);
        }
        if (inputAutoMoveTimeRandomMulti !== null && inputAutoMoveTimeRandomMulti.value !== undefined) {
            inputAutoMoveTimeRandomMulti.value = options.auto_move_time_random_multi.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputAutoMoveTimeRandomMulti.dispatchEvent(event);
        }
        if (inputMaxLegitAutoMoveDepth !== null && inputMaxLegitAutoMoveDepth.value !== undefined) {
            inputMaxLegitAutoMoveDepth.value = options.max_legit_auto_move_depth.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputMaxLegitAutoMoveDepth.dispatchEvent(event);
        }
        if (inputMateFinderValue !== null && inputMateFinderValue.value !== undefined) {
            inputMateFinderValue.value = options.matefindervalue.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputMateFinderValue.dispatchEvent(event);
        }
        if (inputShowHints !== null && inputShowHints.checked !== undefined) {
            inputShowHints.checked = options.show_hints;
        }
        if (inputChess960 !== null && inputChess960.checked !== undefined) {
            inputChess960.checked = options.chess960;
        }
        if (inputStockfish11 !== null && inputStockfish11.checked !== undefined) {
            inputStockfish11.checked = options.stockfish11;
        }
        if (inputHighMateChance !== null && inputHighMateChance.checked !== undefined) {
            inputHighMateChance.checked = options.highmatechance;
        }
        if (inputLimitStrength !== null && inputLimitStrength.checked !== undefined) {
            inputLimitStrength.checked = options.limit_strength;
        }
        if (inputAggressiveMode !== null && inputAggressiveMode.checked !== undefined) {
            inputAggressiveMode.checked = options.aggressive_mode;
        }
        if (inputDefensiveMode !== null && inputDefensiveMode.checked !== undefined) {
            inputDefensiveMode.checked = options.defensive_mode;
        }
        if (inputLegitAutoMove !== null && inputLegitAutoMove.checked !== undefined) {
            inputLegitAutoMove.checked = options.legit_auto_move;
        }
        if (inputRandomBestMove !== null && inputRandomBestMove.checked !== undefined) {
            inputRandomBestMove.checked = options.random_best_move;
        }
        if (inputTextToSpeech !== null && inputTextToSpeech.checked !== undefined) {
            inputTextToSpeech.checked = options.text_to_speech;
        }
        if (inputMoveAnalysis !== null && inputMoveAnalysis.checked !== undefined) {
            inputMoveAnalysis.checked = options.move_analysis;
        }
        if (inputDepthBar !== null && inputDepthBar.checked !== undefined) {
            inputDepthBar.checked = options.depth_bar;
        }
        if (inputEvalBar !== null && inputEvalBar.checked !== undefined) {
            inputEvalBar.checked = options.evaluation_bar;
        }
        if (inputUseNNUE !== null && inputUseNNUE.checked !== undefined) {
            inputUseNNUE.checked = options.use_nnue;
        }
    });
}

function OnOptionsChange() {
    let options = {
        depth: parseInt(inputDepth.value),
        elo: parseInt(inputElo.value),
        contempt: parseInt(inputContempt.value),
        skill_level: parseInt(inputSkillLevel.value),
        skill_level_prob: parseInt(inputSkillLevelProb.value),
        skill_level_error: parseInt(inputSkillLevelError.value),
        multipv: parseInt(inputMultiPV.value),
        best_move_chance: parseInt(inputBestMoveChance.value), // input's value, valid.
        threads: 10,
        matefindervalue: parseInt(inputMateFinderValue.value),
        auto_move_time: parseInt(inputAutoMoveTime.value),
        auto_move_time_random: parseInt(inputAutoMoveTimeRandom.value),
        auto_move_time_random_div: parseInt(inputAutoMoveTimeRandomDiv.value),
        auto_move_time_random_multi: parseInt(inputAutoMoveTimeRandomMulti.value),
        max_legit_auto_move_depth: parseInt(inputMaxLegitAutoMoveDepth.value),
        show_hints: inputShowHints.checked,
        stockfish11: inputStockfish11.checked,
        chess960: inputChess960.checked,
        highmatechance: inputHighMateChance.checked,
        defensive_mode: inputDefensiveMode.checked,
        aggressive_mode: inputAggressiveMode.checked,
        limit_strength: inputLimitStrength.checked,
        legit_auto_move: inputLegitAutoMove.checked,
        random_best_move: inputRandomBestMove.checked,
        text_to_speech: inputTextToSpeech.checked,
        move_analysis: inputMoveAnalysis.checked,
        depth_bar: inputDepthBar.checked,
        evaluation_bar: inputEvalBar.checked,
        use_nnue: inputUseNNUE.checked
    };
    chrome.storage.sync.set(options);
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                type: "UpdateOptions",
                data: options
            });
        });
    });
}

function InitOptions() {
    inputDepth = document.getElementById("option-depth");
    inputThreads = 10;
    inputElo = document.getElementById("option-elo");
    inputMateFinderValue = document.getElementById("option-mate-finder-value");
    inputMultiPV = document.getElementById("option-multipv");
    inputBestMoveChance = document.getElementById('option-best-move-chance'); // assign it as the element valid
    inputHighMateChance = document.getElementById("option-highmatechance");
    inputSkillLevel = document.getElementById("option-skill-level");
    inputContempt = document.getElementById("option-contempt");
    inputSkillLevelError = document.getElementById("option-skill-level-error");
    inputSkillLevelProb = document.getElementById("option-skill-level-prob");
    inputChess960 = document.getElementById("option-chess960");
    inputLimitStrength = document.getElementById("option-limit-strength");
    inputAutoMoveTime = document.getElementById("option-auto-move-time");
    inputAutoMoveTimeRandom = document.getElementById("option-auto-move-time-random");
    inputAutoMoveTimeRandomDiv = document.getElementById("option-auto-move-time-random-div");
    inputAutoMoveTimeRandomMulti = document.getElementById("option-auto-move-time-random-multi");
    inputMaxLegitAutoMoveDepth = document.getElementById("option-max-legit-auto-move-depth");
    inputLegitAutoMove = document.getElementById("option-legit-auto-move");
    inputRandomBestMove = document.getElementById("option-random-best-move");
    inputAggressiveMode = document.getElementById("option-aggressive-mode");
    inputDefensiveMode = document.getElementById("option-defensive-mode");
    inputShowHints = document.getElementById("option-show-hints");
    inputStockfish11 = document.getElementById("option-stockfish11");
    inputTextToSpeech = document.getElementById("option-text-to-speech");
    inputMoveAnalysis = document.getElementById("option-move-analysis");
    inputDepthBar = document.getElementById("option-depth-bar");
    inputEvalBar = document.getElementById("option-evaluation-bar");
    inputUseNNUE = document.getElementById("option-use-nnue");
    const sliderProps = {
        fill: "#5d3fd3",
        background: "rgba(255, 255, 255, 0.214)"
    };
    document.querySelectorAll(".options-slider").forEach(function (slider) {
        const title = slider.querySelector(".title");
        const input = slider.querySelector("input");
        if (title == null || input == null) return;
        input.min = slider.getAttribute("data-min");
        input.max = slider.getAttribute("data-max");
        input.addEventListener("input", (event) => {
            const value = parseInt(input.value);
            const minValue = parseInt(input.min);
            const maxValue = parseInt(input.max);
            const percent = (value - minValue) / (maxValue - minValue) * 100;
            const bg = `linear-gradient(90deg, ${sliderProps.fill} ${percent}%, ${sliderProps.background} ${percent +
                        0.1}%)`;
            input.style.background = bg;
            title.setAttribute("data-value", input.value);
            if (!event.disableUpdate) OnOptionsChange();
        });
    });
    document.querySelectorAll(".options-checkbox").forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            OnOptionsChange();
        });
    });
    RestoreOptions();
}
// Export configuration as JSON file Wait for the DOM to finish loading
window.onload = function () {
    chrome.storage.local.get(["theme"]).then((result) => {
        if (result.theme === "d") {
            document.body.style.backgroundColor = '#292A2D'
            document.getElementsByClassName('settings-content')[0].style.backgroundColor = '#292A2D';
        } else if (result.theme === "ud") {
            document.body.style.backgroundColor = '#000';
            document.getElementsByClassName('settings-content')[0].style.backgroundColor = '#000';
        }
    });
    document.getElementById('popoutb').addEventListener('click', function () {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "popout",
                    data: 'popout'
                });
            });
        });
    }) // dispatch popout event to content script
    // theme thing
    document.getElementById('ultradark').addEventListener('click', function () {
        chrome.storage.local.set({
            theme: 'ud'
        })
        document.body.style.backgroundColor = '#000';
        document.getElementsByClassName('settings-content')[0].style.backgroundColor = '#000';
    })
    document.getElementById('dark').addEventListener('click', function () {
        chrome.storage.local.set({
            theme: 'd'
        })
        document.body.style.backgroundColor = '#292A2D'
        document.getElementsByClassName('settings-content')[0].style.backgroundColor = '#292A2D';
    })
    // settings modal thing
    document.getElementById('settingsb').addEventListener("click", function () {
        document.getElementsByClassName('ModalBackground')[0].style.animation = 'fadein 0.5s linear forwards';
        document.getElementsByClassName('ModalBackground')[0].style.display = "block";
    });
    document.getElementsByClassName('ModalBackground')[0].addEventListener("click", function (event) {
        if (event.target == document.getElementsByClassName('ModalBackground')[0]) {
            document.getElementsByClassName('ModalBackground')[0].style.animation = 'fadeout 0.5s linear forwards';
            setTimeout(() => {
                document.getElementsByClassName('ModalBackground')[0].style.display = "none";
            }, 500);
        }
    });
    document.getElementsByClassName('close')[0].addEventListener('click', function () {
        document.getElementsByClassName('ModalBackground')[0].style.animation = 'fadeout 0.5s linear forwards';
        setTimeout(() => {
            document.getElementsByClassName('ModalBackground')[0].style.display = "none";
        }, 500);
    });
    // amazin
    document.getElementById('learnmore').addEventListener("click", function () {
        document.getElementsByClassName('lmco')[0].style.animation = 'fadein 0.5s linear forwards';
        document.getElementsByClassName('lmco')[0].style.display = "block";
    });
    document.getElementsByClassName('lmco')[0].addEventListener("click", function (event) {
        if (event.target == document.getElementsByClassName('lmco')[0]) {
            document.getElementsByClassName('lmco')[0].style.animation = 'fadeout 0.5s linear forwards';
            setTimeout(() => {
                document.getElementsByClassName('lmco')[0].style.display = "none";
            }, 500);
        }
    });
    document.getElementById('lmc').addEventListener('click', function () {
        document.getElementsByClassName('lmco')[0].style.animation = 'fadeout 0.5s linear forwards';
        setTimeout(() => {
            document.getElementsByClassName('lmco')[0].style.display = "none";
        }, 500);
    });
    // Get references to the buttons and file input
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    document.getElementById('export-btn').addEventListener('click', function () {
        const options = {
            depth: parseInt(document.getElementById('option-depth').value),
            elo: parseInt(document.getElementById('option-elo').value),
            matefindervalue: parseInt(document.getElementById('option-mate-finder-value').value),
            multipv: parseInt(document.getElementById('option-multipv').value),
            contempt: parseInt(document.getElementById('option-contempt').value),
            skill_level: parseInt(document.getElementById('option-skill-level').value),
            skill_level_prob: parseInt(document.getElementById('option-skill-level-prob').value),
            skill_level_error: parseInt(document.getElementById('option-skill-level-error').value),
            best_move_chance: parseInt(document.getElementById('option-best-move-chance').value),
            threads: 10,
            auto_move_time: parseInt(document.getElementById('option-auto-move-time').value),
            auto_move_time_random: parseInt(document.getElementById('option-auto-move-time-random').value),
            auto_move_time_random_div: parseInt(document.getElementById('option-auto-move-time-random-div').value),
            auto_move_time_random_multi: parseFloat(document.getElementById('option-auto-move-time-random-multi').value),
            max_legit_auto_move_depth: parseInt(document.getElementById('option-max-legit-auto-move-depth').value),
            random_best_move: document.getElementById('option-random-best-move').checked,
            highmatechance: document.getElementById('option-highmatechance').checked,
            limit_strength: document.getElementById('option-limit-strength').checked,
            chess960: document.getElementById('option-chess960').checked,
            aggressive_mode: document.getElementById('option-aggressive-mode').checked,
            defensive_mode: document.getElementById('option-defensive-mode').checked,
            legit_auto_move: document.getElementById('option-legit-auto-move').checked,
            show_hints: document.getElementById('option-show-hints').checked,
            stockfish11: document.getElementById('option-stockfish11').checked,
            text_to_speech: document.getElementById('option-text-to-speech').checked,
            move_analysis: document.getElementById('option-move-analysis').checked,
            depth_bar: document.getElementById('option-depth-bar').checked,
            evaluation_bar: document.getElementById('option-evaluation-bar').checked,
            use_nnue: document.getElementById('option-use-nnue').checked
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(options));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "bettermint.config");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
    // Import configuration from JSON file
    document.getElementById('import-btn').addEventListener('click', function () {
        document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', function () {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            const options = JSON.parse(event.target.result);
            // Update config variables from input fields
            document.getElementById('option-depth').value = options.depth;
            document.getElementById('option-elo').value = options.elo;
            document.getElementById('option-best-move-chance').value = options.best_move_chance;
            document.getElementById('option-mate-finder-value').value = options.matefindervalue;
            document.getElementById('option-multipv').value = options.multipv;
            document.getElementById('option-contempt').value = options.contempt;
            document.getElementById('option-skill-level').value = options.skill_level;
            document.getElementById('option-skill-level-prob').value = options.skill_level_prob;
            document.getElementById('option-skill-level-error').value = options.skill_level_error;
            document.getElementById('option-chess960').value = options.chess960;
            document.getElementById('option-limit-strength').value = options.limit_strength;
            document.getElementById('option-show-hints').checked = options.show_hints;
            document.getElementById('option-stockfish11').checked = options.stockfish11;
            document.getElementById('option-move-analysis').checked = options.move_analysis;
            document.getElementById('option-depth-bar').checked = options.depth_bar;
            document.getElementById('option-evaluation-bar').checked = options.evaluation_bar;
            document.getElementById('option-use-nnue').checked = options.use_nnue;
            document.getElementById('option-aggressive-mode').checked = options.aggressive_mode;
            document.getElementById('option-defensive-mode').checked = options.defensive_mode;
            document.getElementById('option-highmatechance').checked = options.highmatechance;
            document.getElementById('option-auto-move-time').value = options.auto_move_time;
            document.getElementById('option-auto-move-time-random').value = options.auto_move_time_random;
            document.getElementById('option-auto-move-time-random-div').value = options.auto_move_time_random_div;
            document.getElementById('option-auto-move-time-random-multi').value = options.auto_move_time_random_multi;
            document.getElementById('option-max-legit-auto-move-depth').value = options.max_legit_auto_move_depth;
            document.getElementById('option-random-best-move').checked = options.random_best_move;
            document.getElementById('option-legit-auto-move').checked = options.legit_auto_move;
            document.getElementById('option-text-to-speech').checked = options.text_to_speech;
            // Do something with the updated options object here
            chrome.storage.sync.set(options);
            chrome.tabs.query({}, function (tabs) {
                tabs.forEach(function (tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "UpdateOptions",
                        data: options
                    });
                });
            });
        };
        reader.readAsText(file);
    });
}
document.addEventListener('DOMContentLoaded', InitOptions);