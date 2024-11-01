function updateUI() {
    browser.storage.local.get("customBlockList", (data) => {
      const list = data.customBlockList || [];
      const customList = document.getElementById("custom-list");
      customList.innerHTML = "";
      list.forEach((domain) => {
        const li = document.createElement("li");
        li.textContent = domain;
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remover";
        removeButton.addEventListener("click", () => {
          const newList = list.filter(item => item !== domain);
          browser.storage.local.set({ customBlockList: newList });
          updateUI();
        });
        li.appendChild(removeButton);
        customList.appendChild(li);
      });
    });
  }
  
  document.getElementById("add-domain").addEventListener("click", () => {
    const input = document.getElementById("domain-input");
    const domain = input.value.trim();
    if (domain) {
      browser.storage.local.get("customBlockList", (data) => {
        const list = data.customBlockList || [];
        list.push(domain);
        browser.storage.local.set({ customBlockList: list });
        updateUI();
      });
      input.value = "";
    }
  });
  
  updateUI();
  