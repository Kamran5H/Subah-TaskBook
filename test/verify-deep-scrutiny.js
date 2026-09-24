// Deep Scrutiny & Hardening Verification Suite for Subah Task Book
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const srcJsDir = path.join(ROOT, "src", "js");
const stylesDir = path.join(ROOT, "src", "styles");

console.log("==================================================");
console.log("   RUNNING SUBAH DEEP SCRUTINY VERIFICATION       ");
console.log("==================================================\n");

// 1. Test taskRollover relative date calculation and streak logic
const { getYesterdayFor, applyDailyStreak, rollOverPendingTasks } = require(path.join(srcJsDir, "taskRollover.js"));

assert.strictEqual(typeof getYesterdayFor, "function", "taskRollover.js must export getYesterdayFor");
assert.strictEqual(getYesterdayFor("2026-03-01"), "2026-02-28", "2026 non-leap year yesterday for March 1 must be Feb 28");
assert.strictEqual(getYesterdayFor("2024-03-01"), "2024-02-29", "2024 leap year yesterday for March 1 must be Feb 29");
assert.strictEqual(getYesterdayFor("2026-01-01"), "2025-12-31", "Yesterday for Jan 1 must be Dec 31 of prior year");
assert.strictEqual(getYesterdayFor("2026-09-14"), "2026-09-13", "Yesterday for Sep 14 must be Sep 13");
console.log("✓ getYesterdayFor correctly handles leap years, month ends, and year ends.");

// Test applyDailyStreak with specified dateStr parameter
const streakState = { streak: 3, lastCommittedDate: "2026-09-12" };
applyDailyStreak(streakState, "2026-09-13");
assert.strictEqual(streakState.streak, 4, "Consecutive day commitment must increment streak to 4");
assert.strictEqual(streakState.lastCommittedDate, "2026-09-13");

// Same day: streak stays 4
applyDailyStreak(streakState, "2026-09-13");
assert.strictEqual(streakState.streak, 4, "Same day commitment must preserve streak at 4");

// Broken streak: gap of 2 days resets to 1
applyDailyStreak(streakState, "2026-09-16");
assert.strictEqual(streakState.streak, 1, "Gap day must reset streak to 1");
console.log("✓ applyDailyStreak operates deterministically with custom dateStr parameter.");

// Test defensive input handling for rollOverPendingTasks
assert.strictEqual(rollOverPendingTasks(null, "2026-09-14"), false, "Null state must return false");
assert.strictEqual(rollOverPendingTasks({}, "2026-09-14"), false, "Empty state must return false");
assert.strictEqual(rollOverPendingTasks({ tasksByDate: null }, "2026-09-14"), false, "Null tasksByDate must return false");
console.log("✓ rollOverPendingTasks defensively handles corrupt or null state.");

// 2. Test Markdown non-greedy parser in rewards.js
const rewardsSrc = fs.readFileSync(path.join(srcJsDir, "rewards.js"), "utf-8");
const rewardsContext = {
  window: {},
  document: {
    getElementById: () => null,
    addEventListener: () => {}
  },
  Date,
  Math,
  Array,
  Intl,
  Set,
  Map,
  setInterval: () => 1,
  clearInterval: () => {},
  console
};
vm.createContext(rewardsContext);
vm.runInContext(rewardsSrc, rewardsContext);
const rewards = rewardsContext.window.subahRewards;
assert(rewards, "window.subahRewards must be instantiated");

// Test non-greedy markdown formatting
const sampleMd = "**First Bold** some regular text **Second Bold** and *First Italic* then *Second Italic*";
const renderedHtml = rewards.renderMarkdown(sampleMd);
assert(renderedHtml.includes("<strong>First Bold</strong>"), "Must parse first bold separately");
assert(renderedHtml.includes("<strong>Second Bold</strong>"), "Must parse second bold separately");
assert(!renderedHtml.includes("<strong>First Bold** some regular text **Second Bold</strong>"), "Must not greedily swallow across multiple bold markers");
console.log("✓ renderMarkdown uses non-greedy regex without swallow bugs.");

// 3. Test Timer Pause and Restart in rewards.js
rewards.selectedMinutes = 5;
rewards.timerSeconds = 300;
rewards.timerRunning = true;
rewards.timerInterval = 123;
rewards.timerClock = { textContent: "05:00", classList: { add: () => {}, remove: () => {} } };
rewards.timerToggleBtn = { textContent: "⏸ Pause" };

// Toggle timer pauses countdown
rewards.toggleTimer();
assert.strictEqual(rewards.timerRunning, false, "Timer must pause");
assert.strictEqual(rewards.timerToggleBtn.textContent, "▶ Resume");

// Toggle timer resumes countdown
rewards.toggleTimer();
assert.strictEqual(rewards.timerRunning, true, "Timer must resume");
assert.strictEqual(rewards.timerToggleBtn.textContent, "⏸ Pause");

// Simulate timer finishing (00:00)
rewards.timerSeconds = 0;
rewardsContext.window.subahAudio = { playTimerBell: () => {} };
rewardsContext.window.subahApp = { showToast: () => {} };
rewards.onTimerComplete();
assert.strictEqual(rewards.timerRunning, false, "Completed timer must not be running");
assert.strictEqual(rewards.timerInterval, null, "Completed timer must clear timerInterval");

// Clicking toggleTimer after completion must restart countdown with fresh duration
let createdInterval = false;
rewardsContext.setInterval = () => {
  createdInterval = true;
  return 456;
};
rewards.toggleTimer();
assert.strictEqual(rewards.timerRunning, true, "Timer must restart on click after complete");
assert.strictEqual(rewards.timerSeconds, 300, "Timer at 00:00 must reset to 300 seconds (5 min)");
assert(createdInterval, "setInterval must be invoked on timer restart from 00:00");
console.log("✓ Timer pause, resume, and completion restart logic verified.");

// 4. Test schedule.js relative date offset calculation and today completion reward
const scheduleSrc = fs.readFileSync(path.join(srcJsDir, "schedule.js"), "utf-8");
const scheduleContext = {
  window: {
    subahAudio: { playClick: () => {}, playCelebration: () => {} },
    subahConfetti: { burst: () => {} },
    subahRewards: { presentSurpriseReward: () => {} },
    subahApp: { onTasksUpdated: () => {}, showToast: () => {} },
    subahAPI: { updateTasks: async (data) => ({ success: true, ...data, streak: 1 }) }
  },
  document: {
    getElementById: () => null,
    createElement: () => ({ classList: { add: () => {}, remove: () => {} }, style: {}, dataset: {} }),
    querySelectorAll: () => []
  },
  Date,
  Math,
  Array,
  Intl,
  Set,
  Map,
  console
};
vm.createContext(scheduleContext);
vm.runInContext(scheduleSrc, scheduleContext);
const schedule = scheduleContext.window.subahSchedule;
assert(schedule, "window.subahSchedule must be instantiated");

// Set todayDate to a specific fixed date
schedule.todayDate = "2026-09-14";
assert.strictEqual(schedule.getDateWithOffset(0), "2026-09-14", "Offset 0 must be todayDate");
assert.strictEqual(schedule.getDateWithOffset(1), "2026-09-15", "Offset 1 must be tomorrow relative to todayDate");
assert.strictEqual(schedule.getDateWithOffset(-1), "2026-09-13", "Offset -1 must be yesterday relative to todayDate");
assert.strictEqual(schedule.getDateWithOffset(17), "2026-10-01", "Offset 17 must cross month boundary relative to todayDate");

// Set todayDate to Dec 31
schedule.todayDate = "2026-12-31";
assert.strictEqual(schedule.getDateWithOffset(1), "2027-01-01", "Offset 1 on Dec 31 must cross year boundary to Jan 1");
console.log("✓ schedule.getDateWithOffset computes relative to this.todayDate consistently.");

// Test task completion on todayDate triggers reward and sets rewardClaimed
let celebrationTriggered = false;
scheduleContext.window.subahRewards.presentSurpriseReward = () => {
  celebrationTriggered = true;
};
schedule.tasksByDate = {
  "2026-12-31": [
    { id: "test-task-1", text: "Today task", completed: false, rewardClaimed: false }
  ]
};
schedule.selectedDate = "2026-12-31";
schedule.renderTasks = () => {};
schedule.renderCalendar = () => {};

(async () => {
  await schedule.toggleTaskCompletion("test-task-1");
  const task = schedule.tasksByDate["2026-12-31"][0];
  assert.strictEqual(task.completed, true, "Task must be marked completed");
  assert.strictEqual(task.rewardClaimed, true, "rewardClaimed must be set to true");
  assert(celebrationTriggered, "presentSurpriseReward must be called on completing today's task");
  console.log("✓ Completing task for today sets rewardClaimed and triggers surprise reward.");
})();

// 5. Test diary.js downstream completion deduplication and sync
const diarySrc = fs.readFileSync(path.join(srcJsDir, "diary.js"), "utf-8");
let onTasksUpdatedCalled = false;
const diaryContext = {
  window: {
    subahApp: {
      onTasksUpdated: (dateStr, tasks, streak) => {
        onTasksUpdatedCalled = true;
      },
      showToast: () => {}
    },
    subahAudio: {
      playClick: () => {}
    },
    subahAPI: {
      updateTasks: async (data) => ({ success: true, ...data, streak: 5 })
    }
  },
  document: {
    getElementById: () => null,
    querySelectorAll: () => []
  },
  Date,
  Math,
  Array,
  Intl,
  Set,
  Map,
  console
};
vm.createContext(diaryContext);
vm.runInContext(diarySrc, diaryContext);
const diary = diaryContext.window.subahDiary;
assert(diary, "window.subahDiary must be instantiated");

// Verify persistDateTasks calls window.subahApp.onTasksUpdated
(async () => {
  diary.tasksByDate = { "2026-09-14": [{ id: "d-1", text: "Diary Task", completed: true }] };
  diary.streak = 5;
  await diary.persistDateTasks("2026-09-14");
  assert(onTasksUpdatedCalled, "persistDateTasks must broadcast via subahApp.onTasksUpdated");
  console.log("✓ diary.persistDateTasks broadcasts updates to all active tabs.");
})();

// 6. Test main.js Tray context menu update integration
const mainSrc = fs.readFileSync(path.join(ROOT, "main.js"), "utf-8");
assert(mainSrc.includes("function updateTrayMenu("), "main.js must define updateTrayMenu at module scope");
assert(mainSrc.includes("updateTrayMenu()"), "main.js must invoke updateTrayMenu when updating state");
assert(mainSrc.includes("mainWindow.isMinimized()"), "main.js app.on('activate') must handle minimized window");
console.log("✓ main.js live tray menu update and window activation handlers verified.");

// 7. Test Theme surface-header CSS tokens and stylesheet references
const themesCss = fs.readFileSync(path.join(stylesDir, "themes.css"), "utf-8");
assert(themesCss.includes("--surface-header: rgba(8, 12, 22, 0.75);"), "midnight-aurora must define --surface-header");
assert(themesCss.includes("--surface-header: rgba(2, 18, 11, 0.88);"), "royal-emerald must define --surface-header");
assert(themesCss.includes("--surface-header: rgba(10, 10, 14, 0.95);"), "obsidian-oled must define --surface-header");

const mainCss = fs.readFileSync(path.join(stylesDir, "main.css"), "utf-8");
assert(mainCss.includes("var(--surface-header"), "main.css titlebar must use var(--surface-header)");

const diaryCss = fs.readFileSync(path.join(stylesDir, "diary.css"), "utf-8");
assert(diaryCss.includes("var(--surface-header"), "diary.css controls bar must use var(--surface-header)");
console.log("✓ Dynamic theme token --surface-header defined and consumed across stylesheets.");

// 8. Test Scripts portability
const launchVbs = fs.readFileSync(path.join(ROOT, "scripts", "launch.vbs"), "utf-8");
assert(launchVbs.includes("Scripting.FileSystemObject"), "launch.vbs must use Scripting.FileSystemObject");
assert(launchVbs.includes("package.json"), "launch.vbs must dynamically find folder with package.json");

const setupBat = fs.readFileSync(path.join(ROOT, "scripts", "setup_startup.bat"), "utf-8");
assert(setupBat.includes("[Environment]::GetFolderPath('Desktop')"), "setup_startup.bat must use dynamic Desktop path");

const generateIconPy = fs.readFileSync(path.join(ROOT, "scripts", "generate_icon.py"), "utf-8");
assert(generateIconPy.includes("os.path.dirname(os.path.abspath(__file__))"), "generate_icon.py must resolve path relative to __file__");
console.log("✓ Scripts portability and dynamic directory resolution verified.");

// 9. Test checklist.js Defer to Tomorrow and Filter Chips
const checklistSrc = fs.readFileSync(path.join(srcJsDir, "checklist.js"), "utf-8");
const checklistContext = {
  window: {
    subahAudio: { playClick: () => {}, playCelebration: () => {} },
    subahConfetti: { burst: () => {} },
    subahApp: { onTasksUpdated: () => {}, showToast: () => {}, todayDate: "2026-09-14" },
    subahAPI: {
      updateTasks: async (d) => ({ success: true, ...d, streak: 2 }),
      getAppState: async () => ({ tasksByDate: { "2026-09-15": [] } })
    },
    subahRewards: { presentSurpriseReward: () => {} }
  },
  document: {
    getElementById: () => null,
    createElement: () => ({ classList: { add: () => {}, remove: () => {} }, style: {}, dataset: {} }),
    querySelectorAll: () => []
  },
  Date,
  Math,
  Array,
  Intl,
  Set,
  Map,
  console
};
vm.createContext(checklistContext);
vm.runInContext(checklistSrc, checklistContext);
const chk = checklistContext.window.subahChecklist;

chk.todayDate = "2026-09-14";
chk.tasks = [
  { id: "task-1", text: "Task to defer", completed: false, priority: "normal" },
  { id: "task-2", text: "Task to keep", completed: true, priority: "high" }
];
let updatedDate = null;
let updatedTasks = null;
chk.persistTasks = async () => {};
checklistContext.window.subahAPI.updateTasks = async ({ date, tasks }) => {
  updatedDate = date;
  updatedTasks = tasks;
  return { success: true, tasks, streak: 2 };
};

(async () => {
  await chk.deferToTomorrow("task-1");
  assert.strictEqual(chk.tasks.length, 1, "Today's tasks list must have 1 task left after defer");
  assert.strictEqual(chk.tasks[0].id, "task-2", "Remaining task must be task-2");
  assert.strictEqual(updatedDate, "2026-09-15", "Tomorrow's date must be target for deferred task");
  assert(updatedTasks.some(t => t.id === "task-1" && t.carriedOver === true), "Deferred task must have carriedOver: true");
  console.log("✓ checklist.deferToTomorrow moves task to tomorrow and flags carriedOver.");
})();

// 10. Test schedule.js Move to Today
schedule.todayDate = "2026-09-14";
schedule.selectedDate = "2026-09-20";
schedule.tasksByDate["2026-09-14"] = [{ id: "today-a", text: "Existing today", completed: false }];
schedule.tasksByDate["2026-09-20"] = [{ id: "future-b", text: "Future task to move", completed: false, priority: "high" }];
(async () => {
  await schedule.moveToToday("future-b");
  assert.strictEqual(schedule.tasksByDate["2026-09-20"].length, 0, "Future date must have 0 tasks after move");
  assert.strictEqual(schedule.tasksByDate["2026-09-14"].length, 2, "Today must have 2 tasks after move");
  assert.strictEqual(schedule.tasksByDate["2026-09-14"][1].id, "future-b", "Moved task must be in today's task list");
  console.log("✓ schedule.moveToToday relocates selected task to today's schedule.");
})();

// 11. Test diary.js Highlight Text, Reflections, and Markdown Export
diary.searchQuery = "focus";
const highlighted = diary.highlightText("Maintain sharp focus and discipline");
assert(highlighted.includes('<mark class="diary-search-highlight">focus</mark>'), "highlightText must wrap query in mark tag");

// Test regex special characters in search do not crash
diary.searchQuery = "test [special] (chars)?";
const safeHighlight = diary.highlightText("Some text with test [special] (chars)? inside");
assert(safeHighlight.includes('<mark class="diary-search-highlight">test [special] (chars)?</mark>'), "Regex special characters safely escaped");

// Test reflection storage
diary.saveDailyReflection("2026-09-14", "Great productive morning!");
assert.strictEqual(diary.reflectionsByDate["2026-09-14"], "Great productive morning!", "saveDailyReflection must update reflectionsByDate");
console.log("✓ diary.highlightText and saveDailyReflection operate cleanly and safely.");

// 12. Test Breathing Guide Visualizer in rewards.js
rewards.breathingOrb = { className: "" };
rewards.breathingPhaseText = { textContent: "" };
rewards.breathingCounter = { textContent: "" };
rewards.startBreathingGuide();
assert(rewards.breathingInterval !== null, "startBreathingGuide must create interval");
assert.strictEqual(rewards.breathingPhaseText.textContent, "Inhale...", "Initial phase is Inhale...");
assert.strictEqual(rewards.breathingOrb.className, "breathing-orb inhale", "Orb has inhale class");

rewards.stopBreathingGuide();
assert.strictEqual(rewards.breathingInterval, null, "stopBreathingGuide must clear interval");
console.log("✓ Breathing zen guide cycles phases and cleans up on stop.");

// 13. Test main.js IPC backup and reflection registrations
assert(mainSrc.includes('ipcMain.handle("export-backup"'), "main.js must register export-backup handler");
assert(mainSrc.includes('ipcMain.handle("import-backup"'), "main.js must register import-backup handler");
assert(mainSrc.includes('ipcMain.handle("save-reflection"'), "main.js must register save-reflection handler");
assert(mainSrc.includes("savedBounds"), "main.js must remember window bounds");
console.log("✓ main.js backup export/import and window bounds memory verified.");

// 14. Test SubahAudio fanfare alias
const audioSrc = fs.readFileSync(path.join(srcJsDir, "audio.js"), "utf-8");
const audioContext = { window: {}, AudioContext: null, webkitAudioContext: null };
vm.createContext(audioContext);
vm.runInContext(audioSrc, audioContext);
assert.strictEqual(typeof audioContext.window.subahAudio.playFanfare, "function", "audio.js must define playFanfare alias");
let celebrationPlayed = false;
audioContext.window.subahAudio.playCelebration = () => { celebrationPlayed = true; };
audioContext.window.subahAudio.playFanfare();
assert(celebrationPlayed, "playFanfare must invoke playCelebration");
console.log("✓ audio.js playFanfare alias cleanly delegates to playCelebration.");

// 15. Test Backup Import Unwrapping and Pinned Task Preservation in main.js
assert(mainSrc.includes("pinned: Boolean(t.pinned)"), "commit-morning-tasks must preserve pinned flag");
assert(mainSrc.includes("typeof parsed.json === \"string\""), "import-backup must safely unwrap nested json format");
console.log("✓ main.js unwrapped backup import and pinned morning task preservation verified.");

// 16. Test SubahApp state getter and showToast signature resilience
const appSrc = fs.readFileSync(path.join(srcJsDir, "app.js"), "utf-8");
const appContext = {
  window: {},
  document: {
    getElementById: () => ({ appendChild: () => {}, querySelector: () => null, querySelectorAll: () => [] }),
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  setTimeout: (fn, delay) => {
    // Assert delay is a valid number >= 1000 and not NaN or 0
    assert(typeof delay === "number" && !isNaN(delay) && delay >= 1000, "showToast duration must be a valid positive number >= 1000ms");
    return 1;
  }
};
vm.createContext(appContext);
vm.runInContext(appSrc, appContext);
const subahApp = appContext.window.subahApp;
assert(subahApp, "window.subahApp must be instantiated");

// Test state getter
subahApp.appData = { streak: 7, todayDate: "2026-09-17", tasksByDate: {} };
assert.strictEqual(subahApp.state, subahApp.appData, "subahApp.state getter must return subahApp.appData");
console.log("✓ SubahApp state getter accurately reflects appData.");

// Test showToast with duration only
let createdToast = null;
appContext.document.createElement = (tag) => {
  const el = { tagName: tag, className: "", style: {}, appendChild: () => {}, remove: () => {} };
  if (tag === "div") createdToast = el;
  return el;
};
subahApp.toastContainer = { appendChild: () => {} };

subahApp.showToast("Test duration", 2500);
assert(createdToast.className.includes("toast"), "Toast must have base toast class");
assert(createdToast.className.includes("toast-info"), "Toast without type must default to toast-info");

// Test showToast with string type ("error", "success", "warning")
subahApp.showToast("Connection failed", "error");
assert(createdToast.className.includes("toast-error"), "Toast with error type must have toast-error class");

subahApp.showToast("Goal achieved", "success", 4000);
assert(createdToast.className.includes("toast-success"), "Toast with success type must have toast-success class");
console.log("✓ showToast supports flexible (msg, duration) and (msg, type, duration) without premature dismissal.");

// 17. Test deferToTomorrow and moveToToday cross-module synchronization
assert(checklistSrc.includes("window.subahApp.onTasksUpdated(tmrw"), "checklist.deferToTomorrow must notify onTasksUpdated for tomorrow");
assert(scheduleSrc.includes("window.subahApp.onTasksUpdated(this.selectedDate"), "schedule.moveToToday must notify onTasksUpdated for selectedDate");
assert(scheduleSrc.includes("completedTaskText: task.text"), "schedule.toggleTaskCompletion must broadcast completed task to Live Share");
console.log("✓ Cross-tab task synchronization verified (deferToTomorrow, moveToToday, liveShare broadcast).");

// 18. Test main.js tray menu unminimize restore
const trayMenuCode = mainSrc.slice(mainSrc.indexOf("function updateTrayMenu()"), mainSrc.indexOf("function createTray()"));
const restoreMatches = (trayMenuCode.match(/if \(mainWindow\.isMinimized\(\)\) mainWindow\.restore\(\);/g) || []).length;
assert(restoreMatches >= 5, `All tray navigation actions must restore minimized windows (found ${restoreMatches})`);
console.log("✓ main.js tray menu unminimize restore verified for all navigation items.");

console.log("\n==================================================");
console.log("   ALL DEEP SCRUTINY VERIFICATIONS PASSED!        ");
console.log("==================================================\n");
