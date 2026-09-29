const { contextBridge, ipcRenderer } = require("electron");

let onOperationError = () => {};

const invokeMutation = async (channel, ...args) => {
  const result = await ipcRenderer.invoke(channel, ...args);
  if (result && result.success === false) {
    onOperationError(result.error || "The change could not be saved.");
  }
  return result;
};

contextBridge.exposeInMainWorld("subahAPI", {
  getAppState: () => ipcRenderer.invoke("get-app-state"),
  commitMorningTasks: (payload) => invokeMutation("commit-morning-tasks", payload),
  updateTasks: (payload) => invokeMutation("update-tasks", payload),
  saveSettings: (settings) => invokeMutation("save-settings", settings),
  saveCustomRewards: (rewards) => invokeMutation("save-custom-rewards", rewards),
  exportBackup: () => ipcRenderer.invoke("export-backup"),
  importBackup: (jsonStr) => invokeMutation("import-backup", jsonStr),
  saveReflection: (payload) => invokeMutation("save-reflection", payload),
  onOperationError: (callback) => {
    onOperationError = typeof callback === "function" ? callback : () => {};
  },

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
