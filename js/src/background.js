chrome.action.onClicked.addListener(() => {
  chrome.storage.sync.get((storageObj) => {
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: Number(storageObj.width) || 960,
      height: Number(storageObj.height) || 400,
    })
  })
})

chrome.runtime.onInstalled.addListener((details) => {
  details.reason == 'install' && chrome.storage.sync.set({ installed: true })
})
