"use strict";
const DefaultExtensionOptions2 = {
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
    move_analysis: true,
    depth_bar: true,
    evaluation_bar: true,
    use_nnue: false,
};
function injectScript(file) {
    let script = document.createElement("script");
    script.src = chrome.runtime.getURL(file);
    let doc = (document.head || document.documentElement);
    // doc.appendChild(script);
    doc.insertBefore(script, doc.firstElementChild);
    script.onload = function () { script.remove(); };
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // pass the event to injected script
    window.dispatchEvent(new CustomEvent("ChessMintUpdateOptions", { detail: request.data }));
});
window.addEventListener("ChessMintGetOptions", function (evt) {
    chrome.storage.sync.get(DefaultExtensionOptions2, function (opts) {
        let request = evt.detail;
        let response = { requestId: request.id, data: opts };
        window.dispatchEvent(new CustomEvent("ChessMintSendOptions", { detail: response }));
    });
});
injectScript("js/chessmint.js");
//# sourceMappingURL=loader.js.map