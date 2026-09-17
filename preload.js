const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("subahAPI", {
  getAppState: () => ipcRenderer.invoke("get-app-state"),
  commitMorningTasks: (payload) => ipcRenderer.invoke("commit-morning-tasks", payload),
  updateTasks: (payload) => ipcRenderer.invoke("update-tasks", payload),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  saveCustomRewards: (rewards) => ipcRenderer.invoke("save-custom-rewards", rewards),
  exportBackup: () => ipcRenderer.invoke("export-backup"),
  importBackup: (jsonStr) => ipcRenderer.invoke("import-backup", jsonStr),
  saveReflection: (payload) => ipcRenderer.invoke("save-reflection", payload),

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
  },

  // Software In-App Updates
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: (downloadUrl) => ipcRenderer.invoke("download-update", downloadUrl),
  applyUpdateAndRestart: (filePath) => ipcRenderer.invoke("apply-update-and-restart", filePath),
  onUpdateProgress: (callback) => {
    ipcRenderer.on("update-download-progress", (event, data) => callback(data));
  }
});
