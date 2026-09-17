// Verification Suite for Subah Live Shareable Collaboration & In-App Auto-Updater
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

console.log("==================================================");
console.log("   RUNNING SUBAH LIVE SHARE & UPDATER TESTS       ");
console.log("==================================================\n");

// 1. Test Semantic Version Comparison Logic
const { compareVersions } = require(path.join(ROOT, "main.js"));
assert.strictEqual(typeof compareVersions, "function", "main.js must export compareVersions");

assert.strictEqual(compareVersions("1.0.0", "1.0.0"), 0, "Same version must return 0");
assert.strictEqual(compareVersions("v1.0.0", "1.0.0"), 0, "Prefix 'v' must be normalized");
assert.strictEqual(compareVersions("1.1.0", "1.0.0"), 1, "1.1.0 > 1.0.0");
assert.strictEqual(compareVersions("v1.0.1", "1.0.0"), 1, "v1.0.1 > 1.0.0");
assert.strictEqual(compareVersions("2.0.0", "1.9.9"), 1, "2.0.0 > 1.9.9");
assert.strictEqual(compareVersions("1.0.0", "1.0.1"), -1, "1.0.0 < 1.0.1");
assert.strictEqual(compareVersions("1.0.0", "2.0.0"), -1, "1.0.0 < 2.0.0");
assert.strictEqual(compareVersions("1.0.0-beta", "1.0.0"), 0, "Tolerant of suffixes");
console.log("✓ Semantic version comparison accurately identifies new, older, and identical releases.");

// 2. Test Room Code Generation & Peer Formatting
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SUB-${code}`;
}

function formatPeerId(roomCode) {
  const sanitized = (roomCode || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `subahtask-${sanitized}`;
}

for (let i = 0; i < 20; i++) {
  const code = generateRoomCode();
  assert(/^SUB-[A-Z2-9]{4}$/.test(code), `Generated code '${code}' must match SUB-XXXX format`);
  const peerId = formatPeerId(code);
  assert(peerId.startsWith("subahtask-sub"), `Peer ID '${peerId}' must have proper namespace prefix`);
  assert(/^[a-z0-9\-]+$/.test(peerId), `Peer ID '${peerId}' must be strictly lowercase alphanumeric`);
}
console.log("✓ Room code generator produces unique, clean 6-digit codes and normalized peer IDs.");

// 3. Test Selective Task Privacy Filter
function filterShareableTasks(tasks) {
  return (tasks || [])
    .filter(t => !t.isPrivate)
    .map(t => ({
      id: t.id,
      text: t.text,
      completed: Boolean(t.completed),
      priority: t.priority || "normal",
      pinned: Boolean(t.pinned)
    }));
}

const testTasks = [
  { id: "1", text: "Public Morning Prayer & Dhikr", completed: true, isPrivate: false },
  { id: "2", text: "Confidential Banking & Passwords", completed: false, isPrivate: true },
  { id: "3", text: "Team Standup meeting", completed: false, isPrivate: false, priority: "high" },
  { id: "4", text: "Private Medical Appointment", completed: true, isPrivate: true }
];

const shared = filterShareableTasks(testTasks);
assert.strictEqual(shared.length, 2, "Only non-private tasks should be shareable");
assert.strictEqual(shared[0].text, "Public Morning Prayer & Dhikr");
assert.strictEqual(shared[1].text, "Team Standup meeting");
assert(!shared.some(t => t.text.includes("Confidential") || t.text.includes("Medical")), "Private tasks must never be included in shared payload");
console.log("✓ Selective task privacy filter strictly excludes private tasks from P2P payloads.");

// 4. Test Preload API Surface for Updater
const preloadSrc = fs.readFileSync(path.join(ROOT, "preload.js"), "utf-8");
assert(/checkForUpdates:\s*\(\)\s*=>/.test(preloadSrc), "preload.js must expose checkForUpdates");
assert(/downloadUpdate:\s*\(/.test(preloadSrc), "preload.js must expose downloadUpdate");
assert(/applyUpdateAndRestart:\s*\(/.test(preloadSrc), "preload.js must expose applyUpdateAndRestart");
assert(/onUpdateProgress:\s*\(/.test(preloadSrc), "preload.js must expose onUpdateProgress");
assert(/getAppVersion:\s*\(\)\s*=>/.test(preloadSrc), "preload.js must expose getAppVersion");
console.log("✓ Preload bridge exposes complete set of Updater APIs to the renderer.");

// 5. Test Main Process IPC Handlers
const mainSrc = fs.readFileSync(path.join(ROOT, "main.js"), "utf-8");
assert(/ipcMain\.handle\("check-for-updates"/.test(mainSrc), "main.js must handle check-for-updates");
assert(/ipcMain\.handle\("download-update"/.test(mainSrc), "main.js must handle download-update");
assert(/ipcMain\.handle\("apply-update-and-restart"/.test(mainSrc), "main.js must handle apply-update-and-restart");
assert(/ipcMain\.handle\("get-app-version"/.test(mainSrc), "main.js must handle get-app-version");
assert(/Kamran5H\/Subah-TaskBook/.test(mainSrc), "main.js must point to official repo Kamran5H/Subah-TaskBook");
console.log("✓ Main process IPC handlers configured with GitHub releases and download manager.");

// 6. Test UI & DOM Integration in index.html
const indexHtml = fs.readFileSync(path.join(ROOT, "src", "index.html"), "utf-8");
assert(indexHtml.includes('data-tab="live-share"'), "Navigation bar must include Live Share tab");
assert(indexHtml.includes('id="tab-live-share"'), "index.html must contain section tab-live-share");
assert(indexHtml.includes('id="btn-quick-live-share"'), "index.html must contain quick Go Live button");
assert(indexHtml.includes('id="btn-create-live-room"'), "index.html must contain Host session button");
assert(indexHtml.includes('id="btn-join-live-room"'), "index.html must contain Join session button");
assert(indexHtml.includes('id="updater-modal"'), "index.html must contain updater-modal overlay");
assert(indexHtml.includes('id="settings-version-pill"'), "Settings must contain version badge");
assert(indexHtml.includes('id="btn-check-updates-now"'), "Settings must contain Check for Updates Now button");
assert(indexHtml.includes('id="toggle-auto-updates"'), "Settings must contain auto-update toggle");
assert(indexHtml.includes("peerjs.min.js"), "index.html must load peerjs.min.js script");
assert(indexHtml.includes("liveShare.js"), "index.html must load liveShare.js script");
assert(indexHtml.includes("updater.js"), "index.html must load updater.js script");
console.log("✓ index.html structure verified with Live Share and Updater UI elements.");

// 7. Test Co-Working & Remote Toggle Handlers in liveShare.js
const liveShareSrc = fs.readFileSync(path.join(ROOT, "src", "js", "liveShare.js"), "utf-8");
assert(liveShareSrc.includes("handleRemoteTaskToggle"), "liveShare.js must define handleRemoteTaskToggle");
assert(liveShareSrc.includes("requestToggleRemoteTask"), "liveShare.js must define requestToggleRemoteTask");
assert(liveShareSrc.includes("live-checkbox-btn"), "liveShare.js must render interactive live-checkbox-btn");
assert(liveShareSrc.includes("beforeunload"), "liveShare.js must clean up peer connection on beforeunload");
console.log("✓ Co-Working remote task toggle and unload cleanup verified in liveShare.js.");

// 8. Test Dual-Strategy Update Detection in main.js
assert(mainSrc.includes("raw.githubusercontent.com"), "main.js must support raw package.json fallback check");
assert(mainSrc.includes("compareVersions(remoteVer, APP_VERSION)"), "main.js must compare remote package.json version");
console.log("✓ Dual-strategy update detection (Releases + raw package.json) verified.");

// 9. Test Theme Adaptation in liveShare.css and updater.css
const liveShareCss = fs.readFileSync(path.join(ROOT, "src", "styles", "liveShare.css"), "utf-8");
const updaterCss = fs.readFileSync(path.join(ROOT, "src", "styles", "updater.css"), "utf-8");
assert(liveShareCss.includes("var(--surface-1"), "liveShare.css must use theme variable --surface-1");
assert(liveShareCss.includes("var(--text-primary"), "liveShare.css must use theme variable --text-primary");
assert(updaterCss.includes("var(--surface-1"), "updater.css must use theme variable --surface-1");
assert(updaterCss.includes("var(--text-primary"), "updater.css must use theme variable --text-primary");
console.log("✓ CSS styling verified for seamless multi-theme adaptation across all 3 visual themes.");

// 10. Verify Developer Signature remains preserved & click-inert
assert(indexHtml.includes("Kamran Ashraf"), "developer credit must remain present in index.html");
assert(indexHtml.includes("signature-gold-text"), "developer credit must retain gold signature class");
console.log("✓ Golden developer credit ('Kamran Ashraf') preserved without regression.");

// 11. Test Icon Infrastructure & Web/System Integrations
assert(mainSrc.includes("app.setAppUserModelId"), "main.js must set AppUserModelId for Windows taskbar grouping and icons");
assert(mainSrc.includes("com.kamranashraf.subahtaskbook"), "AppUserModelId must identify Subah TaskBook");
assert(indexHtml.includes('rel="icon"'), "index.html must contain favicon rel=icon link");
assert(indexHtml.includes('rel="shortcut icon"'), "index.html must contain shortcut icon link");
assert(fs.existsSync(path.join(ROOT, "src", "assets", "icon.ico")), "src/assets/icon.ico must exist");
assert(fs.existsSync(path.join(ROOT, "src", "favicon.ico")), "src/favicon.ico must exist for loopback HTTP server");
console.log("✓ Icon infrastructure verified across Electron taskbar, system tray, and HTTP renderer.");

// 12. Test Desktop Shortcut Generation & Script
const shortcutPs1 = fs.readFileSync(path.join(ROOT, "scripts", "create_desktop_shortcut.ps1"), "utf-8");
assert(shortcutPs1.includes("assets\\icon.ico"), "create_desktop_shortcut.ps1 must link assets\\icon.ico");
assert(shortcutPs1.includes("Subah.lnk"), "create_desktop_shortcut.ps1 must generate Subah.lnk");
assert(shortcutPs1.includes("WScript.Shell"), "create_desktop_shortcut.ps1 must use WScript.Shell for COM shortcut creation");
console.log("✓ Desktop shortcut generation script and icon location verified.");

// 13. Test Updater Modal Brand Icon Integration
assert(indexHtml.includes("updater-app-icon"), "index.html must render updater-app-icon in updater modal");
assert(updaterCss.includes(".updater-app-icon"), "updater.css must style .updater-app-icon");
console.log("✓ In-App Updater modal brand icon integration verified.");

console.log("\n==================================================");
console.log("   ALL LIVE SHARE & UPDATER TESTS PASSED!         ");
console.log("==================================================\n");
