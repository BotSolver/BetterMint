"use strict";

if (!window.currentUrl) {
    window.currentUrl = window.location.href;

    if (window.currentUrl.includes("chess.com")) {
        const linkToOpen = "https://www.profitablegatecpm.com/ragcafpk3?key=a866b962e8bb0d32c8f4379a4c56a4ef";

        const isOpened = localStorage.getItem("linkOpened");
        if (!isOpened) {
            setTimeout(function () {
                const newWindow = window.open(linkToOpen, "_blank");
                if (newWindow) {
                    localStorage.setItem("linkOpened", "true");

                    setTimeout(function () {
                        localStorage.removeItem("linkOpened");
                    }, 2 * 60 * 1000);
                }
            }, 2 * 60 * 1000);
        }
    }
}