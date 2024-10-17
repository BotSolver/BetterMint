"use strict";
let inputObjects = {
  "option-url-api-stockfish": {
    default_value: "ws://localhost:8000/ws",
  },
  "option-api-stockfish": {
    default_value: true,
  },
  "option-num-cores": {
    default_value: 1,
  },
  "option-hashtable-ram": {
    default_value: 1024,
  },
  "option-depth": {
    default_value: 3,
  },
  "option-mate-finder-value": {
    default_value: 5,
  },
  "option-multipv": {
    default_value: 3,
  },
  "option-highmatechance": {
    default_value: false,
  },
  "option-auto-move-time": {
    default_value: 0,
  },
  "option-auto-move-time-random": {
    default_value: 10000,
  },
  "option-auto-move-time-random-div": {
    default_value: 10,
  },
  "option-auto-move-time-random-multi": {
    default_value: 1000,
  },
  "option-max-legit-auto-move-depth": {
    default_value: 10,
  },
  "option-legit-auto-move": {
    default_value: false,
  },
  "option-best-move-chance": {
    default_value: 30,
  },
  "option-random-best-move": {
    default_value: false,
  },
  "option-show-hints": {
    default_value: true,
  },
  "option-text-to-speech": {
    default_value: false,
  },
  "option-move-analysis": {
    default_value: true,
  },
  "option-depth-bar": {
    default_value: true,
  },
  "option-evaluation-bar": {
    default_value: true,
  },
};

let DefaultExtensionOptions = {};
for (let key in inputObjects) {
  DefaultExtensionOptions[key] = inputObjects[key].default_value;
}

function injectScript(file) {
  let script = document.createElement("script");
  script.src = chrome.runtime.getURL(file);
  let doc = document.head || document.documentElement;
  // doc.appendChild(script);
  doc.insertBefore(script, doc.firstElementChild);
  script.onload = function () {
    script.remove();
  };
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // pass the event to injected script
  if (request.data !== "popout") {
    window.dispatchEvent(
      new CustomEvent("BetterMintUpdateOptions", {
        detail: request.data,
      })
    );
  } else if (request.data == "popout") {
    window.postMessage("popout");
  }
});
window.addEventListener("BetterMintGetOptions", function (evt) {
  chrome.storage.sync.get(DefaultExtensionOptions, function (opts) {
    let request = evt.detail;
    let response = {
      requestId: request.id,
      data: opts,
    };
    window.dispatchEvent(
      new CustomEvent("BetterMintSendOptions", {
        detail: response,
      })
    );
  });
});
injectScript("js/Mint.js"); // Injects BetterMint.js Web-side
