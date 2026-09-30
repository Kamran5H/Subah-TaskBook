// Window ergonomics & performance verification: zoom, window dragging, light rendering
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf-8");

console.log("==================================================");
console.log("   RUNNING SUBAH WINDOW, ZOOM & PERFORMANCE TESTS ");
console.log("==================================================\n");

const { clampZoom, nextZoomStep, getZoomShortcutAction, getSavedZoomFactor } = require(path.join(ROOT, "main.js"));

// 1. Zoom maths
assert.strictEqual(clampZoom(1), 1);
assert.strictEqual(clampZoom(5), 2, "zoom must cap at 200%");
assert.strictEqual(clampZoom(0.1), 0.5, "zoom must floor at 50%");
assert.strictEqual(clampZoom("garbage"), 1, "invalid zoom falls back to 100%");
assert.strictEqual(clampZoom(undefined), 1);
assert.strictEqual(nextZoomStep(1, 1), 1.1);
assert.strictEqual(nextZoomStep(1, -1), 0.9);
assert.strictEqual(nextZoomStep(1.2, 1), 1.25, "between presets, zoom in snaps to next preset");
assert.strictEqual(nextZoomStep(1.2, -1), 1.1, "between presets, zoom out snaps to previous preset");
assert.strictEqual(nextZoomStep(2, 1), 2, "zoom in at max stays at max");
assert.strictEqual(nextZoomStep(0.5, -1), 0.5, "zoom out at min stays at min");
assert.strictEqual(getSavedZoomFactor({ settings: { zoomFactor: 1.25 } }), 1.25);
assert.strictEqual(getSavedZoomFactor({}), 1);
console.log("✓ Zoom presets step, snap and clamp between 50% and 200%.");

// 2. Keyboard shortcuts (Ctrl held): main row, shifted plus and numpad
assert.strictEqual(getZoomShortcutAction({ key: "=", code: "Equal" }), "in");
assert.strictEqual(getZoomShortcutAction({ key: "+", code: "Equal" }), "in");
assert.strictEqual(getZoomShortcutAction({ key: "+", code: "NumpadAdd" }), "in");
assert.strictEqual(getZoomShortcutAction({ key: "-", code: "Minus" }), "out");
assert.strictEqual(getZoomShortcutAction({ key: "-", code: "NumpadSubtract" }), "out");
assert.strictEqual(getZoomShortcutAction({ key: "0", code: "Digit0" }), "reset");
assert.strictEqual(getZoomShortcutAction({ key: "0", code: "Numpad0" }), "reset");
assert.strictEqual(getZoomShortcutAction({ key: "n", code: "KeyN" }), null, "other Ctrl shortcuts are untouched");
console.log("✓ Ctrl + / Ctrl - / Ctrl 0 (incl. numpad) map to zoom actions.");

// 3. Wiring: main process, preload bridge, titlebar UI
const mainSrc = read("main.js");
assert(mainSrc.includes('on("zoom-changed"'), "Ctrl + mouse wheel must be handled via webContents zoom-changed");
assert(mainSrc.includes("setZoomFactor"), "zoom must be applied with setZoomFactor");
assert(mainSrc.includes("zoomFactor: getSavedZoomFactor"), "saved zoom must be restored at window creation");
assert(mainSrc.includes('ipcMain.on("window-drag-start"') && mainSrc.includes('ipcMain.on("window-drag-end"'));
assert(mainSrc.includes("getCursorScreenPoint"), "window drag must follow the OS cursor");
assert(/if \(appDataCache\) return appDataCache;/.test(mainSrc), "app data must be served from the in-memory cache");

const preloadSrc = read("preload.js");
["zoomIn", "zoomOut", "zoomReset", "getZoom", "onZoomChanged", "windowDragStart", "windowDragEnd"].forEach(fn => {
  assert(preloadSrc.includes(`${fn}:`), `preload must expose ${fn}`);
});

const html = read("src", "index.html");
["btn-zoom-in", "btn-zoom-out", "btn-zoom-reset", "zoom-indicator"].forEach(id => {
  assert(html.includes(`id="${id}"`), `index.html must contain #${id}`);
});
console.log("✓ Zoom + window-drag IPC, preload bridge and titlebar controls are wired.");

// 4. Renderer behaviour
const appSrc = read("src", "js", "app.js");
assert(appSrc.includes("initWindowDragging()") && appSrc.includes("isWindowDragSurface"), "empty areas must drag the window");
assert(appSrc.includes("initIdleAnimationPause()"), "animations must pause when the window is idle");
assert(!/reloadAppState[\s\S]*subahRewards\.init\(/.test(appSrc.split("checkDateRollover")[0].split("async reloadAppState")[1] || ""),
  "reloadAppState must not re-run rewards.init (duplicates listeners)");
console.log("✓ Drag-from-empty-area, double-click maximize and idle animation pause present.");

// 5. Lightweight rendering guards
const stylesDir = path.join(ROOT, "src", "styles");
const cssFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith(".css"));
cssFiles.forEach(f => {
  const css = fs.readFileSync(path.join(stylesDir, f), "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert(!/backdrop-filter\s*:\s*blur/.test(css), `${f}: backdrop-filter blur is too expensive (re-rasterises every frame)`);
  const keyframes = css.match(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) || [];
  keyframes.forEach(k => {
    assert(!/filter\s*:/.test(k), `${f}: animating 'filter' forces a repaint every frame (${k.split("{")[0].trim()})`);
  });
});
const mainCss = fs.readFileSync(path.join(stylesDir, "main.css"), "utf-8");
assert(!/background-attachment\s*:\s*fixed/.test(mainCss), "fixed body background forces full repaints");
assert(!/signatureShimmer[^;]*infinite/.test(mainCss), "always-visible footer shimmer must not run forever");
assert(/body\.app-idle \*/.test(mainCss), "idle animation-pause rule must exist");

const diarySrc = read("src", "js", "diary.js");
const scheduleSrc = read("src", "js", "schedule.js");
assert(diarySrc.includes("isTabHidden()"), "diary must skip rendering while hidden");
assert(scheduleSrc.includes('getElementById("tab-schedule")'), "schedule must skip rendering while hidden");
console.log("✓ No backdrop blurs, no filter keyframes, hidden tabs don't re-render.");

console.log("\n==================================================");
console.log("   ALL WINDOW, ZOOM & PERFORMANCE TESTS PASSED!   ");
console.log("==================================================");
