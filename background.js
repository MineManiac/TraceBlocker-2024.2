const parsedEz = parseFilterList(easylist);
let customList = []
let isActiveEz = false;


let recentBlockedTrackers = [];
const MaxRecentBlockedTrackers = 30;


// Retrieve settings from storage
browser.storage.local.get("customList").then((data) => {
  customList = data.customList || [];
});

browser.storage.local.get("isActiveEz").then((data) => {
  isActiveEz = data.isActiveEz || false;
});

// Listen for storage changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.customList) {
      customList = changes.customList.newValue;
    }
    if (changes.isActiveEz) {
      isActiveEz = changes.isActiveEz.newValue;
    }
  }
});

// Listen for messages from the popup or options page
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleBlocking") {
    isBlockingEnabled = message.isBlockingEnabled;
    console.log("Blocking state toggled:", isBlockingEnabled);
  } else if (message.type === "getRecentBlockedTrackers") {
    sendResponse({ type: 'sendRecentBlockedTrackers', recentBlockedTrackers });
  }

});

// Function to load active filter lists

// Intercept and block requests
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isBlockingEnabled) {
      return {};
    }

   
    const shoulBlockEz = isActiveEz && shouldBlock(parsedEz, details.url);
    const shouldBlockCustom = customList.some((domain) => details.url.includes(domain));
    if (shoulBlockEz || shouldBlockCustom) {
      reportBlockedTracker(details.url);
      return { cancel: true };
    }

    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking"],
);

// Function to report blocked trackers
function reportBlockedTracker(url) {
  blockedTrackers++;
  
  recentBlockedTrackers.push(url);
  if (recentBlockedTrackers.length > MaxRecentBlockedTrackers) {
    recentBlockedTrackers.shift();
  }

  // Update the count in storage
  browser.storage.local.set({ blockedTrackers });

  // Send a message to update the count if the popup is open
  browser.runtime.sendMessage({ type: "updateInfo", blockedTrackers, recentBlockedTrackers });
}
