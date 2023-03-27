"use strict";

var inputDepth;
var inputThreads;
var inputAutoMoveTime;
var inputAutoMoveTimeRandom;
var inputAutoMoveTimeRandomDiv;
var inputAutoMoveTimeRandomMulti;
var inputLegitAutoMove;
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
    threads: 8,
    auto_move_time: 5000,
    auto_move_time_random: 10000,
    auto_move_time_random_div: 10,
    auto_move_time_random_multi: 1000,
    max_legit_auto_move_depth: 5,
    random_best_move: false,
    legit_auto_move: false,
    show_hints: true,
    text_to_speech: false,
    move_analysis: true,
    depth_bar: true,
    evaluation_bar: true,
    use_nnue: false,
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
        if (inputThreads !== null && inputThreads.value !== undefined) {
            inputThreads.value = options.threads.toString();
            let event = new CustomEvent("input");
            event.disableUpdate = true;
            inputThreads.dispatchEvent(event);
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
        if (inputShowHints !== null && inputShowHints.checked !== undefined) {
            inputShowHints.checked = options.show_hints;
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
        threads: parseInt(inputThreads.value),
        auto_move_time: parseInt(inputAutoMoveTime.value),
        auto_move_time_random: parseInt(inputAutoMoveTimeRandom.value),
        auto_move_time_random_div: parseInt(inputAutoMoveTimeRandomDiv.value),
        auto_move_time_random_multi: parseInt(inputAutoMoveTimeRandomMulti.value),
        max_legit_auto_move_depth: parseInt(inputMaxLegitAutoMoveDepth.value),
        show_hints: inputShowHints.checked,
        legit_auto_move: inputLegitAutoMove.checked,
        random_best_move: inputRandomBestMove.checked,
        text_to_speech: inputTextToSpeech.checked,
        move_analysis: inputMoveAnalysis.checked,
        depth_bar: inputDepthBar.checked,
        evaluation_bar: inputEvalBar.checked,
        use_nnue: inputUseNNUE.checked,
    };
    chrome.storage.sync.set(options);
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, { type: "UpdateOptions", data: options });
        });
    });
}

function InitOptions() {
    inputDepth = document.getElementById("option-depth");
    inputThreads = document.getElementById("option-threads");
    inputAutoMoveTime = document.getElementById("option-auto-move-time");
    inputAutoMoveTimeRandom = document.getElementById("option-auto-move-time-random");
    inputAutoMoveTimeRandomDiv = document.getElementById("option-auto-move-time-random-div");
    inputAutoMoveTimeRandomMulti = document.getElementById("option-auto-move-time-random-multi");
    inputMaxLegitAutoMoveDepth = document.getElementById("option-max-legit-auto-move-depth");
    inputLegitAutoMove = document.getElementById("option-legit-auto-move");
    inputRandomBestMove = document.getElementById("option-random-best-move");
    inputShowHints = document.getElementById("option-show-hints");
    inputTextToSpeech = document.getElementById("option-text-to-speech");
    inputMoveAnalysis = document.getElementById("option-move-analysis");
    inputDepthBar = document.getElementById("option-depth-bar");
    inputEvalBar = document.getElementById("option-evaluation-bar");
    inputUseNNUE = document.getElementById("option-use-nnue");

    const sliderProps = {
        fill: "#2CA137",
        background: "rgba(255, 255, 255, 0.214)",
    };

    document.querySelectorAll(".options-slider").forEach(function (slider) {
        const title = slider.querySelector(".title");
        const input = slider.querySelector("input");
        if (title == null || input == null)
            return;
        input.min = slider.getAttribute("data-min");
        input.max = slider.getAttribute("data-max");
        input.addEventListener("input", (event) => {
            const value = parseInt(input.value);
            const minValue = parseInt(input.min);
            const maxValue = parseInt(input.max);
            const percent = (value - minValue) / (maxValue - minValue) * 100;
            const bg = `linear-gradient(90deg, ${sliderProps.fill} ${percent}%, ${sliderProps.background} ${percent + 0.1}%)`;
            input.style.background = bg;
            title.setAttribute("data-value", input.value);
            if (!event.disableUpdate)
                OnOptionsChange();
        });
    });    
    document.querySelectorAll(".options-checkbox").forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            OnOptionsChange();
        });
    });
    RestoreOptions();
}
document.addEventListener('DOMContentLoaded', InitOptions);
//# sourceMappingURL=options.js.map