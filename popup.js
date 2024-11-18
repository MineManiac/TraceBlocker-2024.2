// Function to update the toggle button appearance
function updateToggleButton(isBlockingEnabled) {
  const toggleButton = document.getElementById("toggle-blocking");
  if (isBlockingEnabled) {
    toggleButton.classList.add("active");
    toggleButton.classList.remove("inactive");
    toggleButton.textContent = "Blocking Active";
  } else {
    toggleButton.classList.add("inactive");
    toggleButton.classList.remove("active");
    toggleButton.textContent = "Blocking Inactive";
  }
}

// Initialize blocking state and blocked trackers count
browser.storage.local
  .get(["isBlockingEnabled", "blockedTrackers"])
  .then((data) => {
    const isBlockingEnabled = data.isBlockingEnabled !== false; // Default to true
    updateToggleButton(isBlockingEnabled);

    const blockedCount = data.blockedTrackers || 0;
    updateBlockedCountDisplay(blockedCount);
  });

// Function to update the blocked count display
function updateBlockedCountDisplay(count) {
  const countElement = document.getElementById("blocked-count");
  countElement.textContent = count;
}

// Handle toggle button click
document.getElementById("toggle-blocking").addEventListener("click", () => {
  browser.storage.local.get("isBlockingEnabled").then((data) => {
    const isBlockingEnabled = data.isBlockingEnabled !== false; // Default to true
    const newBlockingState = !isBlockingEnabled;

    // Update the blocking state in storage
    browser.storage.local
      .set({ isBlockingEnabled: newBlockingState })
      .then(() => {
        // Send a message to the background script to update the blocking state
        browser.runtime.sendMessage({
          type: "toggleBlocking",
          isBlockingEnabled: newBlockingState,
        });
        // Update the button appearance
        updateToggleButton(newBlockingState);
      });
  });
});

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "updateBlockedCount") {
    updateBlockedCountDisplay(message.blockedTrackers);
  }
});

document.getElementById("open-options").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});
