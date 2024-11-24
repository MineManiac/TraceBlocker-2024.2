

// Function to update the UI
function updateUI() {
  // Update custom blocklist UI
  browser.storage.local.get(["customList"]).then((data) => {
    const list = data.customBlockList || [];
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
        updateUI();
      });
      li.appendChild(removeButton);
      customList.appendChild(li);
    });

    // Update filter lists UI
    const activeLists = data.activeLists || {};
    const filterListsContainer = document.getElementById("filter-lists");
    filterListsContainer.innerHTML = "";

    for (const listKey in availableFilterLists) {
      const listName = availableFilterLists[listKey];
      const li = document.createElement("li");

      const label = document.createElement("label");
      label.textContent = listName;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = activeLists[listKey] || false;
      checkbox.addEventListener("change", () => {
        activeLists[listKey] = checkbox.checked;
        browser.storage.local.set({ activeLists });
      });

      label.prepend(checkbox);
      li.appendChild(label);
      filterListsContainer.appendChild(li);
    }
  });
}

// Handle adding custom domains
document.getElementById("add-domain").addEventListener("click", () => {
  const input = document.getElementById("domain-input");
  const domain = input.value.trim();
  if (domain) {
    browser.storage.local.get("customBlockList").then((data) => {
      const list = data.customBlockList || [];
      list.push(domain);
      browser.storage.local.set({ customBlockList: list }).then(() => {
        updateUI();
      });
    });
    input.value = "";
  }
});

// Initial UI update
updateUI();
