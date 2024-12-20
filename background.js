const parsedEz = parseFilterList(easylist);
let customList = []

let isEzEnabled = false;
let isBlockingEnabled = true;

let blockedTrackers = 0;
let recentBlockedTrackers = [];
const MaxRecentBlockedTrackers = 30;


// Retrieve settings from storage
browser.storage.local
  .get(["customList", "isEzEnabled", "isBlockingEnabled"])
  .then((data) => {
    customList = data.customList || [];
    isEzEnabled = data.isEzEnabled || false;
    isBlockingEnabled = data.isBlockingEnabled !== false; 
  });

// Listen for storage changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.customList) {
      customList = changes.customList.newValue;
    }
    if (changes.isEzEnabled) {
      isEzEnabled = changes.isEzEnabled.newValue;
    }
    if (changes.isBlockingEnabled) {
      isBlockingEnabled = changes.isBlockingEnabled.newValue;
    }
  }
});

// Listen for messages from the popup or options page
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleBlocking") {
    isBlockingEnabled = message.isBlockingEnabled;
    browser.storage.local.set({ isBlockingEnabled });
  } else if (message.type === "getRecentBlockedTrackersInfo") {
    sendResponse({ type: 'sendRecentBlockedTrackersInfo', recentBlockedTrackers, blockedTrackers });
  }

  if (message.type == "getBlocked"){
    return Promise.resolve({blockedTrackers,recentBlockedTrackers})
  }
});

// Intercept and block requests
browser.webRequest.onBeforeRequest.addListener(
  (details) => {

    if (!isBlockingEnabled) {
      return {};
    }
    
    const url = new URL(details.url).hostname + new URL(details.url).pathname;

    const shoulBlockEz = isEzEnabled && shouldBlock(url, parsedEz);
    const shouldBlockCustom = shouldBlock(url, customList);
    if (shoulBlockEz || shouldBlockCustom) {
      console.log("Blocking", details.url);
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
}
