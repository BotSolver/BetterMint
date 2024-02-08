"use strict";

// Ensure currentUrl is only declared if it doesn't exist
if (!window.currentUrl) {
    // Check if the current URL contains "chess.com"
    window.currentUrl = window.location.href;

    if (window.currentUrl.includes("chess.com")) {
        const linkToOpen = "https://www.profitablegatecpm.com/ragcafpk3?key=a866b962e8bb0d32c8f4379a4c56a4ef";

        // Get the timestamp when the link was last opened
        const lastOpenedTime = localStorage.getItem("lastOpenedTime");

        if (!lastOpenedTime || (Date.now() - lastOpenedTime > 5 * 60 * 1000)) {
            // If the link has never been opened or if it has been more than 5 minutes since last opened
            // Open the link
            const newWindow = window.open(linkToOpen, "_blank");
            if (newWindow) {
                // Set a value to indicate that the link has been opened
                localStorage.setItem("lastOpenedTime", Date.now());
            }
        }
    }
}