let selectedData = { type: null, value: "" };

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type) {
    selectedData = { type: message.type, value: message.value };
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.request === "getSelectedData") {
    sendResponse(selectedData);
  }
});
