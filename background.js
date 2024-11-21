// Initialize blocking lists
let customBlockList = [];
let activeFilterLists = {};

// Count of blocked trackers
let blockedTrackers = 0;

// Enables or disables blocking
let isBlockingEnabled = true;

// List of available filter lists and their file paths
const availableFilterLists = {
  easylist: "lists/easylist.txt",
};

// Retrieve settings from storage
browser.storage.local
  .get([
    "customBlockList",
    "blockedTrackers",
    "isBlockingEnabled",
    "activeLists",
  ])
  .then((data) => {
    customBlockList = data.customBlockList || [];
    blockedTrackers = data.blockedTrackers || 0;
    isBlockingEnabled = data.isBlockingEnabled !== false; // Default to true
    const storedActiveLists = data.activeLists || {};

    // Load active filter lists
    loadActiveFilterLists(storedActiveLists);
  });

// Listen for storage changes
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
    if (changes.activeLists) {
      // Reload active filter lists
      loadActiveFilterLists(changes.activeLists.newValue);
    }
  }
});

// Listen for messages from the popup or options page
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "toggleBlocking") {
    isBlockingEnabled = message.isBlockingEnabled;
    console.log("Blocking state toggled:", isBlockingEnabled);
  }
});

// Function to load active filter lists
function loadActiveFilterLists(storedActiveLists) {
  activeFilterLists = {}; // Reset active filter lists

  const promises = [];

  for (const listName in availableFilterLists) {
    if (storedActiveLists[listName]) {
      const listPath = availableFilterLists[listName];
      // Fetch the list file
      const fetchPromise = fetch(browser.runtime.getURL(listPath))
        .then((response) => response.text())
        .then((text) => {
          // Parse the filter list
          const filters = parseFilterList(text);
          activeFilterLists[listName] = filters;
          console.log(`Loaded and parsed ${listName}`);
        })
        .catch((error) => {
          console.error(`Error loading ${listName}:`, error);
        });

      promises.push(fetchPromise);
    }
  }

  // Once all lists are loaded
  Promise.all(promises).then(() => {
    console.log("All active filter lists loaded");
  });
}

// Intercept and block requests
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isBlockingEnabled) {
      return {};
    }

    const url = details.url;

    // First, check custom blocklist (simple domain matching)
    const hostname = new URL(url).hostname;
    const isCustomBlocked = customBlockList.some((blockedDomain) => {
      return (
        hostname === blockedDomain || hostname.endsWith(`.${blockedDomain}`)
      );
    });

    if (isCustomBlocked) {
      console.log(`Blocked by custom list: ${hostname}`);
      reportBlockedTracker(hostname);
      return { cancel: true };
    }

    // Next, check active filter lists using shouldBlock function
    const allFilters = [];

    for (const filters of Object.values(activeFilterLists)) {
      allFilters.push(...filters);
    }

    if (allFilters.length > 0) {
      const isBlocked = !shouldBlock(url, allFilters);

      if (isBlocked) {
        console.log(`Blocked by filter lists: ${url}`);
        reportBlockedTracker(url);
        return { cancel: true };
      }
    }

    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking"],
);

// Function to report blocked trackers
function reportBlockedTracker(domain) {
  blockedTrackers++;
  // Update the count in storage
  browser.storage.local.set({ blockedTrackers });

  // Send a message to update the count if the popup is open
  browser.runtime.sendMessage({ type: "updateBlockedCount", blockedTrackers });
}
