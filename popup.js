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
async function getData() {
  const localDataPromise =  browser.storage.local.get(["isBlockingEnabled"]);
  const blockedDataPromise = browser.runtime.sendMessage({type: "getBlocked"});

  const [localData,blockedData] = await Promise.all([localDataPromise,blockedDataPromise])

  const isBlockingEnabled = localData.isBlockingEnabled;
  const {blockedTrackers,recentBlockedTrackers} = blockedData;

  // update html
  updateToggleButton(isBlockingEnabled);
  updateBlockedCountDisplay(blockedTrackers);
  
}

getData();
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
document.getElementById("toggle-blocking").addEventListener("click", async () => {
  browser.storage.local.get("isBlockingEnabled").then((data) => {
    const isBlockingEnabled = data.isBlockingEnabled !== false; // Default to true
    const newBlockingState = !isBlockingEnabled;

    // Send a message to the background script to update the blocking state
    browser.runtime.sendMessage({
      type: "toggleBlocking",
      isBlockingEnabled: newBlockingState,
    });
    // Update the button appearance
    updateToggleButton(newBlockingState);
      

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
