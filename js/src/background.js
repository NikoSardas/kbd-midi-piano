chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get(['width', 'height'], ({ width = 960, height = 400 }) => {
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: Number(width),
      height: Number(height),
    });
  });
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.sync.set({ installed: true });
  }
});
