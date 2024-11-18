// Default block list (EasyList + EasyPrivacy, etc)
const defaultBlockList = [];

// Retrieve or initialize the custom blocklist and blocked trackers count
let customBlockList = [];
let blockedTrackers = 0;

browser.storage.local
  .get(["customBlockList", "blockedTrackers", "isBlockingEnabled"])
  .then((data) => {
    if (data.customBlockList) {
      customBlockList = data.customBlockList;
    }
    if (typeof data.blockedTrackers === "number") {
      blockedTrackers = data.blockedTrackers;
    } else {
      // Initialize blockedTrackers in storage
      browser.storage.local.set({ blockedTrackers });
    }
    if (typeof data.isBlockingEnabled === "undefined") {
      // Set default blocking state to true
      browser.storage.local.set({ isBlockingEnabled: true });
    }
  });

// Listen for changes in storage to update customBlockList
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.customBlockList) {
      customBlockList = changes.customBlockList.newValue;
      console.log("customBlockList updated:", customBlockList);
    }
    if (changes.isBlockingEnabled) {
      isBlockingEnabled = changes.isBlockingEnabled.newValue;
      console.log("Blocking enabled:", isBlockingEnabled);
    }
  }
});

// Initialize blocking state
let isBlockingEnabled = true;

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleBlocking") {
    isBlockingEnabled = message.isBlockingEnabled;
    console.log("Blocking state toggled:", isBlockingEnabled);
  }
});

// Intercept and block requests to tracking domains
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isBlockingEnabled) {
      return {};
    }

    const url = new URL(details.url);
    const hostname = url.hostname;

    const combinedBlockList = defaultBlockList.concat(customBlockList);

    const isBlocked = combinedBlockList.some((blockedDomain) => {
      return (
        hostname === blockedDomain || hostname.endsWith(`.${blockedDomain}`)
      );
    });

    if (isBlocked) {
      console.log(`Blocked: ${hostname}`);
      reportBlockedTracker(hostname); // Report to the popup
      return { cancel: true };
    }
    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking"],
);

// Send reports to the popup interface and update storage
function reportBlockedTracker(domain) {
  blockedTrackers++;
  // Update the count in storage
  browser.storage.local.set({ blockedTrackers });

  // Send a message to update the count if the popup is open
  browser.runtime.sendMessage({ type: "updateBlockedCount", blockedTrackers });
}
