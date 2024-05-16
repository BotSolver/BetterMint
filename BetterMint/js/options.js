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
  "option-limit-strength": {
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

function RestoreOptions() {
  chrome.storage.sync.get(DefaultExtensionOptions, function (opts) {
    let options = opts;
    for (let key in inputObjects) {
      if (inputObjects[key].inputField !== null && inputObjects[key].inputField !== undefined) {
        if (
          inputObjects[key].inputField.type == "checkbox" &&
          inputObjects[key].inputField.checked !== undefined
        ) {
          inputObjects[key].inputField.checked = options[key];
        } else if (inputObjects[key].inputField.value !== undefined) {
          inputObjects[key].inputField.value = options[key].toString();
          let event = new CustomEvent("input");
          event.disableUpdate = true;
          inputObjects[key].inputField.dispatchEvent(event);
        }
      }
    }
  });
}

function OnOptionsChange() {
  let options = {};
  for (let key in inputObjects) {
    if (inputObjects[key].inputField !== null && inputObjects[key].inputField !== undefined) {
      if (inputObjects[key].inputField.type === "checkbox") {
        options[key] = inputObjects[key].inputField.checked;
      } else if (inputObjects[key].inputField.type === "range") {
        options[key] = parseInt(inputObjects[key].inputField.value);
      } else if (inputObjects[key].inputField.type === "text") {
        options[key] = inputObjects[key].inputField.value;
      }
    }
  }

  chrome.storage.sync.set(options);
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: "UpdateOptions",
        data: options,
      });
    });
  });
}

function InitOptions() {
  for (let key in inputObjects) {
    inputObjects[key].inputField = document.getElementById(key);
  }

  const sliderProps = {
    fill: "#5d3fd3",
    background: "rgba(255, 255, 255, 0.214)",
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
      const percent = ((value - minValue) / (maxValue - minValue)) * 100;
      const bg = `linear-gradient(90deg, ${sliderProps.fill} ${percent}%, ${
        sliderProps.background
      } ${percent + 0.1}%)`;
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

  document.querySelectorAll(".options-text").forEach(function (text) {
    text.addEventListener("change", function () {
      OnOptionsChange();
    });
  });

  RestoreOptions();
}

window.onload = function () {
  chrome.storage.local.get(["theme"]).then((result) => {
    if (result.theme === "d") {
      document.body.style.backgroundColor = "#292A2D";
      document.getElementsByClassName(
        "settings-content"
      )[0].style.backgroundColor = "#292A2D";
    } else if (result.theme === "ud") {
      document.body.style.backgroundColor = "#000";
      document.getElementsByClassName(
        "settings-content"
      )[0].style.backgroundColor = "#000";
    }
  });

  document.getElementById("popoutb").addEventListener("click", function () {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: "popout",
          data: "popout",
        });
      });
    });
  });

  document.getElementById("ultradark").addEventListener("click", function () {
    chrome.storage.local.set({
      theme: "ud",
    });
    document.body.style.backgroundColor = "#000";
    document.getElementsByClassName(
      "settings-content"
    )[0].style.backgroundColor = "#000";
  });

  document.getElementById("dark").addEventListener("click", function () {
    chrome.storage.local.set({
      theme: "d",
    });
    document.body.style.backgroundColor = "#292A2D";
    document.getElementsByClassName(
      "settings-content"
    )[0].style.backgroundColor = "#292A2D";
  });

  document.getElementById("settingsb").addEventListener("click", function () {
    document.getElementsByClassName("ModalBackground")[0].style.animation =
      "fadein 0.5s linear forwards";
    document.getElementsByClassName("ModalBackground")[0].style.display =
      "block";
  });

  document
    .getElementsByClassName("ModalBackground")[0]
    .addEventListener("click", function (event) {
      if (
        event.target == document.getElementsByClassName("ModalBackground")[0]
      ) {
        document.getElementsByClassName("ModalBackground")[0].style.animation =
          "fadeout 0.5s linear forwards";
        setTimeout(() => {
          document.getElementsByClassName("ModalBackground")[0].style.display =
            "none";
        }, 500);
      }
    });

  document
    .getElementsByClassName("close")[0]
    .addEventListener("click", function () {
      document.getElementsByClassName("ModalBackground")[0].style.animation =
        "fadeout 0.5s linear forwards";
      setTimeout(() => {
        document.getElementsByClassName("ModalBackground")[0].style.display =
          "none";
      }, 500);
    });

  document.getElementById("learnmore").addEventListener("click", function () {
    document.getElementsByClassName("lmco")[0].style.animation =
      "fadein 0.5s linear forwards";
    document.getElementsByClassName("lmco")[0].style.display = "block";
  });

  document
    .getElementsByClassName("lmco")[0]
    .addEventListener("click", function (event) {
      if (event.target == document.getElementsByClassName("lmco")[0]) {
        document.getElementsByClassName("lmco")[0].style.animation =
          "fadeout 0.5s linear forwards";
        setTimeout(() => {
          document.getElementsByClassName("lmco")[0].style.display = "none";
        }, 500);
      }
    });

  document.getElementById("lmc").addEventListener("click", function () {
    document.getElementsByClassName("lmco")[0].style.animation =
      "fadeout 0.5s linear forwards";
    setTimeout(() => {
      document.getElementsByClassName("lmco")[0].style.display = "none";
    }, 500);
  });

  InitOptions();
};
