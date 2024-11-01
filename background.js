// Lista padrão de domínios de rastreamento conhecidos
const defaultBlockList = [
    "example-tracker.com",
    "ads.tracker.net",
    "analytics.tracker.org"
  ];
  
  // Recupera ou inicializa a lista de bloqueio personalizada
  let customBlockList = [];
  browser.storage.local.get("customBlockList", (data) => {
    if (data.customBlockList) {
      customBlockList = data.customBlockList;
    }
  });
  
  // Função para atualizar a lista de bloqueio
  function updateCustomBlockList(newList) {
    customBlockList = newList;
    browser.storage.local.set({ customBlockList: customBlockList });
  }
  
  // Intercepta e bloqueia requisições para domínios de rastreamento
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      const url = new URL(details.url);
      if (defaultBlockList.includes(url.hostname) || customBlockList.includes(url.hostname)) {
        console.log(`Bloqueado: ${url.hostname}`);
        return { cancel: true };
      }
      return { cancel: false };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
  
  // Envia relatórios para a interface popup
  let blockedTrackers = 0;
  function reportBlockedTracker(domain) {
    blockedTrackers++;
    browser.runtime.sendMessage({ type: "trackerBlocked", domain });
  }
  