document.getElementById("toggle-blocking").addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "toggleBlocking" });
  });
  
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "trackerBlocked") {
      let count = parseInt(document.getElementById("blocked-count").textContent);
      document.getElementById("blocked-count").textContent = count + 1;
    }
  });
  
  document.getElementById("open-options").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
  });
  