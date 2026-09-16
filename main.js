const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, shell, nativeImage, screen } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Enforce single instance lock so only one instance runs
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;
let tray = null;
let forceQuit = false;

// Remove default Chromium menu bar
Menu.setApplicationMenu(null);

// Helpers for Data Storage & Rollover Logic
const {
  getTodayDateString,
  getYesterdayDateString,
  applyDailyStreak,
  getStreakBadge,
  rollOverPendingTasks,
  getDefaultState
} = require("./src/js/taskRollover.js");

function getDataFilePath() {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "subah-data.json");
}

function createRollingSnapshot(data) {
  try {
    const userDataPath = app.getPath("userData");
    const snapshotsDir = path.join(userDataPath, "snapshots");
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }
    const today = getTodayDateString();
    const snapshotFile = path.join(snapshotsDir, `snapshot-${today}.json`);
    if (!fs.existsSync(snapshotFile)) {
      fs.writeFileSync(snapshotFile, JSON.stringify({
        snapshotDate: today,
        createdAt: new Date().toISOString(),
        ...data
      }, null, 2), "utf-8");

      // Retain up to 7 most recent snapshots
      const files = fs.readdirSync(snapshotsDir)
        .filter(f => f.startsWith("snapshot-") && f.endsWith(".json"))
        .sort();
      while (files.length > 7) {
        const oldFile = files.shift();
        try { fs.unlinkSync(path.join(snapshotsDir, oldFile)); } catch (_) {}
      }
    }
  } catch (e) {
    console.error("Error creating rolling snapshot:", e);
  }
}

function loadAppData() {
  const filePath = getDataFilePath();
  const backupPath = filePath + ".bak";

  let raw = null;
  let parsed = null;

  try {
    if (fs.existsSync(filePath)) {
      raw = fs.readFileSync(filePath, "utf-8");
      parsed = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading subah-data.json:", err);
    // Preserve corrupt file for recovery rather than overwriting
    try {
      const corruptPath = filePath + `.corrupt.${Date.now()}`;
      if (raw) fs.writeFileSync(corruptPath, raw, "utf-8");
    } catch (_) {}

    // Attempt restore from backup
    try {
      if (fs.existsSync(backupPath)) {
        const backupRaw = fs.readFileSync(backupPath, "utf-8");
        parsed = JSON.parse(backupRaw);
        console.log("Successfully restored subah-data.json from backup.");
      }
    } catch (bakErr) {
      console.error("Error reading backup data:", bakErr);
    }
  }

  if (parsed) {
    const defaults = getDefaultState();
    const streak = typeof parsed.streak === "number" ? parsed.streak : 1;
    const maxStreak = typeof parsed.maxStreak === "number" ? Math.max(parsed.maxStreak, streak) : streak;
    return {
      ...defaults,
      ...parsed,
      streak,
      maxStreak,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      tasksByDate: parsed.tasksByDate || {},
      reflectionsByDate: parsed.reflectionsByDate || {},
      customRewards: parsed.customRewards || []
    };
  }

  const defaultState = getDefaultState();
  // Only write default state if the file truly did not exist
  if (!fs.existsSync(filePath)) {
    saveAppData(defaultState);
  }
  return defaultState;
}

function saveAppData(data) {
  const filePath = getDataFilePath();
  const tempPath = filePath + ".tmp";
  const backupPath = filePath + ".bak";

  try {
    const serialized = JSON.stringify(data, null, 2);
    // Atomic write: write to temp file, create backup copy of existing, then rename
    fs.writeFileSync(tempPath, serialized, "utf-8");
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (_) {}
    }
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error("Error saving subah-data.json atomically:", err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (e2) {
      console.error("Fallback direct save failed:", e2);
      return false;
    }
  }
}

function getAppIcon() {
  const icoPath = path.join(__dirname, "assets", "icon.ico");
  const pngPath = path.join(__dirname, "assets", "icon.png");
  if (fs.existsSync(icoPath)) {
    return nativeImage.createFromPath(icoPath);
  }
  if (fs.existsSync(pngPath)) {
    return nativeImage.createFromPath(pngPath);
  }
  return undefined;
}

// --- Loopback renderer host -------------------------------------------------
// The renderer MUST be served over a real http origin. Loading it with
// loadFile() yields an opaque file:// origin with no Referer, which YouTube
// rejects with "Error 153 - Video player configuration error". Serving from
// 127.0.0.1 makes embeds behave exactly as they do in a normal browser.
let rendererPort = null;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function startRendererServer() {
  return new Promise((resolve, reject) => {
    const root = path.join(__dirname, "src");
    const safeRoot = root.endsWith(path.sep) ? root : root + path.sep;
    const server = http.createServer((req, res) => {
      let urlPath = "/index.html";
      try {
        urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        if (urlPath === "/") urlPath = "/index.html";
      } catch (_) {
        res.writeHead(400).end("Bad Request");
        return;
      }
      const filePath = path.normalize(path.join(root, urlPath));

      // Path-traversal guard: never serve outside src/
      if (!filePath.startsWith(root) || (!filePath.startsWith(safeRoot) && filePath !== root)) {
        res.writeHead(403).end("Forbidden");
        return;
      }

      fs.readFile(filePath, (err, buf) => {
        if (err) {
          res.writeHead(404).end("Not found");
          return;
        }
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
          "Cache-Control": "no-store"
        });
        res.end(buf);
      });
    });

    server.on("error", reject);
    // Port 0 = ephemeral, avoids collisions. Bound to loopback only, never 0.0.0.0.
    server.listen(0, "127.0.0.1", () => {
      rendererPort = server.address().port;
      console.log("Subah renderer served on http://127.0.0.1:" + rendererPort);
      resolve(rendererPort);
    });
  });
}

function createWindow() {
  const iconImg = getAppIcon();

  // Screen adaptive dimensions with memory for user preferences
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  let winWidth = Math.min(1020, Math.round(screenWidth * 0.9));
  let winHeight = Math.min(840, Math.round(screenHeight * 0.94));
  let winX = undefined;
  let winY = undefined;

  const appData = loadAppData();
  const savedBounds = appData.settings && appData.settings.windowBounds;
  if (savedBounds && typeof savedBounds.width === "number" && typeof savedBounds.height === "number") {
    const allDisplays = screen.getAllDisplays();
    const isVisibleOnAnyDisplay = allDisplays.some(disp => {
      const b = disp.bounds;
      return (
        savedBounds.x >= b.x - 50 &&
        savedBounds.x < (b.x + b.width - 100) &&
        savedBounds.y >= b.y - 50 &&
        savedBounds.y < (b.y + b.height - 100)
      );
    });
    if (isVisibleOnAnyDisplay) {
      winWidth = Math.max(780, Math.min(savedBounds.width, screenWidth));
      winHeight = Math.max(600, Math.min(savedBounds.height, screenHeight));
      winX = savedBounds.x;
      winY = savedBounds.y;
    }
  }

  const windowOpts = {
    width: winWidth,
    height: winHeight,
    minWidth: 780,
    minHeight: 600,
    show: true,
    frame: false, // Frameless for rich modern aesthetic
    titleBarStyle: "hidden",
    alwaysOnTop: false, // Fully unlocked - never blocks other desktop windows
    closable: true,
    minimizable: true,
    resizable: true,
    icon: iconImg,
    backgroundColor: "#080c16",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };

  if (typeof winX === "number" && typeof winY === "number") {
    windowOpts.x = winX;
    windowOpts.y = winY;
  } else {
    windowOpts.center = true;
  }

  mainWindow = new BrowserWindow(windowOpts);

  let boundsSaveTimer = null;
  const debouncedSaveBounds = () => {
    if (!mainWindow || mainWindow.isMinimized() || mainWindow.isMaximized()) return;
    clearTimeout(boundsSaveTimer);
    boundsSaveTimer = setTimeout(() => {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        const currentBounds = mainWindow.getBounds();
        const currentData = loadAppData();
        currentData.settings = currentData.settings || {};
        currentData.settings.windowBounds = currentBounds;
        saveAppData(currentData);
      } catch (_) {}
    }, 600);
  };

  mainWindow.on("resize", debouncedSaveBounds);
  mainWindow.on("move", debouncedSaveBounds);

  mainWindow.loadURL(`http://127.0.0.1:${rendererPort}/index.html`);

  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer] [L${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Security: prevent unvetted popup windows and frame hijacking
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${rendererPort}/`)) {
      event.preventDefault();
      if (url.startsWith("https://") || url.startsWith("http://")) {
        shell.openExternal(url);
      }
    }
  });

  // Keyboard ergonomics: F11 toggles full-screen view
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // Intercept window close to minimize to tray instead of killing app
  mainWindow.on("close", (e) => {
    if (forceQuit) {
      return;
    }
    e.preventDefault();
    mainWindow.hide();
  });
}

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("CRITICAL Uncaught Exception in Electron:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("CRITICAL Unhandled Rejection in Electron:", reason);
});

function updateTrayMenu() {
  if (!tray) return;
  try {
    const appData = loadAppData();
    const today = getTodayDateString();
    const tasks = (appData.tasksByDate && appData.tasksByDate[today]) || [];
    const completed = tasks.filter((t) => t.completed).length;

    const badge = getStreakBadge(appData.streak || 1);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "🌅 Open Subah (Ctrl+Shift+T)",
        click: () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: `📊 Today: ${completed}/${tasks.length} tasks completed`,
        enabled: false
      },
      {
        label: `${badge.icon} Streak: ${appData.streak || 1} days (${badge.name})`,
        enabled: false
      },
      { type: "separator" },
      {
        label: "📅 Schedule & Calendar Tasks",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("navigate-tab", "schedule");
          }
        }
      },
      {
        label: "🎁 Surprise Reward Sanctuary",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("navigate-tab", "rewards");
          }
        }
      },
      {
        label: "📖 Task Diary & History",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("navigate-tab", "diary");
          }
        }
      },
      {
        label: "⚙️ Preferences",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("navigate-tab", "settings");
          }
        }
      },
      { type: "separator" },
      {
        label: "❌ Exit Subah",
        click: () => {
          forceQuit = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  } catch (err) {
    console.error("Error updating tray menu:", err);
  }
}

function createTray() {
  try {
    if (tray) return;

    const icoPath = path.join(__dirname, "assets", "icon.ico");
    const pngPath = path.join(__dirname, "assets", "icon.png");
    let trayIcon = null;

    if (fs.existsSync(pngPath)) {
      trayIcon = nativeImage.createFromPath(pngPath).resize({ width: 16, height: 16 });
    } else if (fs.existsSync(icoPath)) {
      trayIcon = nativeImage.createFromPath(icoPath);
    }

    if (!trayIcon || trayIcon.isEmpty()) {
      console.warn("Tray icon not found or empty, skipping tray creation");
      return;
    }

    tray = new Tray(trayIcon);
    tray.setToolTip("Subah - Daily Task & Surprise Reward Book");

    updateTrayMenu();

    // Tray left click: smooth toggle
    tray.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.error("Error creating tray:", err);
  }
}

// Clean up any stale development startup entry registered under "electron.app.Electron"
function cleanupRogueDevStartup() {
  if (process.platform === "win32") {
    try {
      const { exec } = require("child_process");
      exec('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "electron.app.Electron" /f', () => {});
    } catch (_) {}
  }
}

// Sync Windows startup: only register the compiled binary when packaged.
// In dev mode (npx electron .), registering process.execPath creates a rogue entry
// pointing to bare node_modules/electron/dist/electron.exe which opens the default Electron screen!
function syncStartupSettings(openAtLogin) {
  cleanupRogueDevStartup();
  if (typeof openAtLogin !== "boolean") return;

  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: openAtLogin,
      path: process.execPath,
      args: []
    });
  }
}

// App Initialization
app.whenReady().then(async () => {
  try {
    cleanupRogueDevStartup();
    await startRendererServer();
    createWindow();
    createTray();

    // Register Global Hotkey: Ctrl+Shift+T (instant toggle without restrictions)
    globalShortcut.register("CommandOrControl+Shift+T", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    // Sync Windows login startup setting & create daily rolling snapshot
    const appData = loadAppData();
    createRollingSnapshot(appData);
    if (appData.settings && typeof appData.settings.openAtLogin === "boolean") {
      syncStartupSettings(appData.settings.openAtLogin);
    }

    app.on("activate", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      } else if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error("Error during app.whenReady:", err);
  }
});

app.on("window-all-closed", (e) => {
  if (!forceQuit) {
    if (e && e.preventDefault) e.preventDefault();
  } else {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// --- IPC Handlers ---

// Fetch app state
ipcMain.handle("get-app-state", async () => {
  const data = loadAppData();
  const today = getTodayDateString();
  const changed = rollOverPendingTasks(data, today);
  if (changed) {
    saveAppData(data);
  }
  updateTrayMenu();
  return {
    ...data,
    todayDate: today,
    isLocked: false // Always fully unlocked
  };
});

// Commit tasks (supports any count: 1, 2, 5, etc.)
ipcMain.handle("commit-morning-tasks", async (event, { tasks }) => {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return { success: false, error: "Please add at least 1 task" };
  }

  const data = loadAppData();
  const today = getTodayDateString();

  const formattedTasks = tasks.map((t, idx) => ({
    id: t.id || `task-${Date.now()}-${idx}`,
    text: t.text.trim(),
    completed: false,
    priority: t.priority || "normal",
    pinned: Boolean(t.pinned),
    createdAt: Date.now()
  }));

  // Update streak if new day
  applyDailyStreak(data, today);

  data.tasksByDate[today] = formattedTasks;
  data.lastCommittedDate = today;
  saveAppData(data);
  updateTrayMenu();

  return {
    success: true,
    data: {
      ...data,
      todayDate: today,
      isLocked: false
    }
  };
});

// Update tasks during the day (toggle, add, delete, inline edit)
ipcMain.handle("update-tasks", async (event, { date, tasks }) => {
  const data = loadAppData();
  const targetDate = date || getTodayDateString();
  data.tasksByDate[targetDate] = tasks;

  // Count today as committed the first time it actually has tasks.
  // The renderer only calls update-tasks (planner "Save" appends via this path),
  // so streak tracking has to live here, not just in commit-morning-tasks.
  const today = getTodayDateString();
  if (targetDate === today && Array.isArray(tasks) && tasks.length > 0) {
    applyDailyStreak(data, today);
  }

  saveAppData(data);
  updateTrayMenu();
  return { success: true, tasks: data.tasksByDate[targetDate], streak: data.streak };
});

// Save settings (theme, startup, timer, etc.)
ipcMain.handle("save-settings", async (event, newSettings) => {
  const data = loadAppData();
  data.settings = { ...data.settings, ...newSettings };
  saveAppData(data);

  // Update OS startup setting
  if (typeof newSettings.openAtLogin === "boolean") {
    syncStartupSettings(newSettings.openAtLogin);
  }

  return { success: true, settings: data.settings };
});

// Save custom rewards list
ipcMain.handle("save-custom-rewards", async (event, customRewards) => {
  const data = loadAppData();
  data.customRewards = customRewards;
  saveAppData(data);
  return { success: true, customRewards: data.customRewards };
});

// Window controls (Minimize, Maximize, Close to Tray, Quit)
ipcMain.on("window-minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on("app-quit", () => {
  forceQuit = true;
  app.quit();
});

// Safe external browser launcher
ipcMain.handle("open-external", async (event, url) => {
  if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: "Invalid URL" };
});

// Export entire JSON database backup
ipcMain.handle("export-backup", async () => {
  try {
    const data = loadAppData();
    const payload = {
      appName: "Subah-TaskBook",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      ...data
    };
    return { success: true, json: JSON.stringify(payload, null, 2) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Import JSON database backup
ipcMain.handle("import-backup", async (event, jsonString) => {
  try {
    if (!jsonString || typeof jsonString !== "string") {
      return { success: false, error: "Empty or invalid backup data." };
    }
    let parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid backup format." };
    }
    // Defensive unwrap if JSON was exported with a { success: true, json: "..." } wrapper
    if (typeof parsed.json === "string") {
      try {
        const inner = JSON.parse(parsed.json);
        if (inner && typeof inner === "object") {
          parsed = inner;
        }
      } catch (_) {}
    }
    const defaults = getDefaultState();
    const merged = {
      ...defaults,
      ...parsed,
      tasksByDate: parsed.tasksByDate || {},
      reflectionsByDate: parsed.reflectionsByDate || {},
      customRewards: Array.isArray(parsed.customRewards) ? parsed.customRewards : [],
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      streak: typeof parsed.streak === "number" ? parsed.streak : 1,
      lastCommittedDate: parsed.lastCommittedDate || null
    };

    saveAppData(merged);
    updateTrayMenu();
    return { success: true, data: merged };
  } catch (err) {
    return { success: false, error: "Failed to parse backup JSON: " + err.message };
  }
});

// Save daily reflection note
ipcMain.handle("save-reflection", async (event, { date, text }) => {
  const data = loadAppData();
  if (!data.reflectionsByDate) data.reflectionsByDate = {};
  data.reflectionsByDate[date] = text || "";
  saveAppData(data);
  return { success: true, reflectionsByDate: data.reflectionsByDate };
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = { rollOverPendingTasks, applyDailyStreak };
}


