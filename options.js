
function updateEasyListToggle(isEnabled) {
  const toggle = document.getElementById("toggle-easylist");
  toggle.checked = isEnabled;
}

function updateCustomBlockListUI() {
  browser.storage.local.get("customList").then((data) => {
    const list = data.customList || [];
    const customList = document.getElementById("custom-list");
    customList.innerHTML = "";
    list.forEach((domain) => {
      const li = document.createElement("li");
      li.textContent = domain;
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        const newList = list.filter((item) => item !== domain);
        browser.storage.local.set({ customList: newList });
        updateCustomBlockListUI();
      });
      li.appendChild(removeButton);
      customList.appendChild(li);
    });
  });
}

// Handle EasyList toggle change
document.getElementById("toggle-easylist").addEventListener("change", (event) => {
  const isEnabled = event.target.checked;
  browser.storage.local.set({ isEzEnabled: isEnabled });
});


// Handle adding custom domains
document.getElementById("add-domain").addEventListener("click", () => {
  const input = document.getElementById("domain-input");
  const domain = input.value.trim();
  if (domain) {
    browser.storage.local.get("customList").then((data) => {
      const list = data.customList || [];
      if (list.includes(domain)) {
        return;
      }
      list.push(domain);
      browser.storage.local.set({ customList: list }).then(() => {
        updateCustomBlockListUI();
      });
    });
    input.value = "";
  }
});

browser.storage.local.get("isEzEnabled").then((data) => {
  const isEnabled = data.isEzEnabled !== false; // Default to true
  updateEasyListToggle(isEnabled);
});

updateCustomBlockListUI();
