const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("subahAPI", {
  getAppState: () => ipcRenderer.invoke("get-app-state"),
  commitMorningTasks: (payload) => ipcRenderer.invoke("commit-morning-tasks", payload),
  updateTasks: (payload) => ipcRenderer.invoke("update-tasks", payload),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  saveCustomRewards: (rewards) => ipcRenderer.invoke("save-custom-rewards", rewards),

  // Window Controls
  windowMinimize: () => ipcRenderer.send("window-minimize"),
  windowMaximize: () => ipcRenderer.send("window-maximize"),
  windowClose: () => ipcRenderer.send("window-close"),
  appQuit: () => ipcRenderer.send("app-quit"),

  // External URL
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Tray/Main events
  onNavigateTab: (callback) => {
    ipcRenderer.on("navigate-tab", (event, tab) => callback(tab));
  }
});
