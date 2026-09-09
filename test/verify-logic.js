// Verification suite for Subah Task Book logic
const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=========================================");
console.log("   RUNNING SUBAH TASK BOOK LOGIC TESTS   ");
console.log("=========================================\n");

// 1. Test Reward Dataset
const { DEFAULT_REWARDS } = require("../src/js/rewardData.js");
assert(Array.isArray(DEFAULT_REWARDS), "DEFAULT_REWARDS must be an array");
assert(DEFAULT_REWARDS.length >= 10, "Should have at least 10 curated rewards");

console.log(`✓ Reward Library verified: ${DEFAULT_REWARDS.length} curated items loaded.`);

const requiredCategories = ["naat", "qawwali", "melody", "mashwara", "reading", "reel"];
requiredCategories.forEach(cat => {
  const count = DEFAULT_REWARDS.filter(r => r.category === cat).length;
  assert(count > 0, `Category '${cat}' must have at least one reward`);
  console.log(`  - Category [${cat}]: ${count} items`);
});

// 2. Test Flexible Goal Input (Accepts any count >= 1, encouraging without locking)
function validateGoalTasks(tasks) {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return { valid: false, error: "At least 1 task required" };
  }
  const nonEmpty = tasks.filter(t => t.text && t.text.trim().length > 0);
  if (nonEmpty.length === 0) {
    return { valid: false, error: "Non-empty tasks required" };
  }
  return { valid: true, count: nonEmpty.length };
}

assert.strictEqual(validateGoalTasks([]).valid, false);
assert.strictEqual(validateGoalTasks([{ text: "   " }]).valid, false);
assert.strictEqual(validateGoalTasks([{ text: "Task 1" }]).valid, true);
assert.strictEqual(validateGoalTasks([{ text: "Task 1" }, { text: "Task 2" }]).valid, true);
assert.strictEqual(validateGoalTasks([
  { text: "Task 1" }, { text: "Task 2" }, { text: "Task 3" }, { text: "Task 4" }, { text: "Task 5" }
]).valid, true);
console.log("✓ Validation correctly supports any number of tasks without locking or restricting the user.");

// 3. Test Streak Calculation
function calculateStreak(lastCommittedDate, todayDate, currentStreak) {
  if (!lastCommittedDate) return 1;
  if (lastCommittedDate === todayDate) return currentStreak;

  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  if (lastCommittedDate === yStr) {
    return (currentStreak || 0) + 1;
  }
  return 1;
}

assert.strictEqual(calculateStreak(null, "2026-09-08", 0), 1, "First day commitment should start streak at 1");
assert.strictEqual(calculateStreak("2026-09-07", "2026-09-08", 5), 6, "Consecutive day should increment streak");
assert.strictEqual(calculateStreak("2026-09-08", "2026-09-08", 6), 6, "Same day commit should preserve streak");
assert.strictEqual(calculateStreak("2026-09-05", "2026-09-08", 6), 1, "Broken streak should reset to 1");
console.log("✓ Streak calculation logic verified for all edge cases.");

// 4. Test Text Parsing (Brain dump bullet point stripper)
function parseBrainDump(rawText) {
  return rawText
    .split("\n")
    .map(line => line.replace(/^(?:(?:\d+[\.\)]|\-|\*|•|\[[\s xX]?\])\s*)/, "").trim())
    .filter(line => line.length > 0);
}

const sampleDump = `
1. Morning prayer and Quran recitation
2. Complete project report for team
- Review emails and clear spam
* 30-minute brisk walk & exercise
• Read chapter 4 of book
5) Prepare tomorrow's agenda
`;

const parsed = parseBrainDump(sampleDump);
assert.strictEqual(parsed.length, 6);
assert.strictEqual(parsed[0], "Morning prayer and Quran recitation");
assert.strictEqual(parsed[2], "Review emails and clear spam");
assert.strictEqual(parsed[3], "30-minute brisk walk & exercise");
console.log("✓ Brain dump parser correctly strips bullet points, numbers, and preserves text numbers (e.g. 30-minute workout).");

// 5. Contract: every window.subahApp.<method>() call in the renderer must be
//    defined on the SubahApp class. This catches the class of bug where
//    rewards.js called getEnabledCategories() that never existed and crashed
//    every task completion.
const srcJsDir = path.join(__dirname, "..", "src", "js");
const appSource = fs.readFileSync(path.join(srcJsDir, "app.js"), "utf-8");

const calledMethods = new Set();
fs.readdirSync(srcJsDir)
  .filter(f => f.endsWith(".js"))
  .forEach(f => {
    const src = fs.readFileSync(path.join(srcJsDir, f), "utf-8");
    let m;
    const re = /subahApp\.([a-zA-Z_]\w*)\s*\(/g;
    while ((m = re.exec(src)) !== null) calledMethods.add(m[1]);
  });

calledMethods.forEach(method => {
  const defined = new RegExp(`(^|\\n)\\s*(async\\s+)?${method}\\s*\\(`).test(appSource);
  assert(defined, `SubahApp is missing method '${method}()' called from the renderer`);
});
console.log(`✓ SubahApp API contract verified: ${[...calledMethods].sort().join(", ")}`);

// 6. Streak must advance through the live update-tasks path, not only the
//    orphaned commit-morning-tasks handler.
const mainSource = fs.readFileSync(path.join(__dirname, "..", "main.js"), "utf-8");
const updateHandler = mainSource.slice(mainSource.indexOf('ipcMain.handle("update-tasks"'));
assert(
  /applyDailyStreak\(/.test(updateHandler),
  "update-tasks handler must advance the daily streak (renderer never calls commit-morning-tasks)"
);
console.log("✓ Streak tracking wired into the update-tasks handler.");

// 7. No stylesheet may set `display` on a #tab-* ID rule. An ID selector (1,0,0)
//    outranks `.tab-screen.active` (0,2,0), which pins that tab permanently
//    visible. It then sits absolutely positioned over the other tabs and
//    swallows every click meant for them.
const stylesDir = path.join(__dirname, "..", "src", "styles");
const offenders = [];
fs.readdirSync(stylesDir)
  .filter(f => f.endsWith(".css"))
  .forEach(f => {
    const css = fs.readFileSync(path.join(stylesDir, f), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, ""); // ignore comments
    const re = /#tab-[\w-]+\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css)) !== null) {
      if (/(^|[;\s])display\s*:/.test(m[1])) offenders.push(`${f}: ${m[0].split("{")[0].trim()}`);
    }
  });
assert.deepStrictEqual(
  offenders, [],
  `#tab-* rules must not set 'display' (they outrank .tab-screen.active and block clicks): ${offenders.join(", ")}`
);
console.log("✓ Tab visibility owned solely by .tab-screen/.active — no ID rule hijacks display.");

// 8. Inactive tabs must be click-inert as a structural safety net.
const mainCss = fs.readFileSync(path.join(stylesDir, "main.css"), "utf-8");
assert(
  /\.tab-screen:not\(\.active\)\s*\{[^}]*pointer-events\s*:\s*none/.test(mainCss),
  "main.css must keep '.tab-screen:not(.active) { pointer-events: none }' so a hidden tab can never intercept clicks"
);
console.log("✓ Inactive tabs are click-inert (pointer-events guard present).");

// 9. Continuous Pending Tasks Rollover Series
const { rollOverPendingTasks } = require("../src/js/taskRollover.js");
assert(typeof rollOverPendingTasks === "function", "taskRollover.js must export rollOverPendingTasks");

const testData = {
  tasksByDate: {
    "2026-09-01": [
      { id: "t-1", text: "Finished Task", completed: true, completedAt: 1000 },
      { id: "t-2", text: "Pending Task A", completed: false },
      { id: "t-3", text: "Pending Task B", completed: false }
    ]
  }
};

// Rollover to Day 2
const changedDay2 = rollOverPendingTasks(testData, "2026-09-02");
assert.strictEqual(changedDay2, true, "Rollover should report changes on day 2");
assert(Array.isArray(testData.tasksByDate["2026-09-02"]), "Day 2 tasks array should exist");
assert.strictEqual(testData.tasksByDate["2026-09-02"].length, 2, "Only the 2 pending tasks should roll over");
assert.strictEqual(testData.tasksByDate["2026-09-02"][0].text, "Pending Task A");
assert.strictEqual(testData.tasksByDate["2026-09-02"][0].carriedOverFrom, "2026-09-01");
assert.strictEqual(testData.tasksByDate["2026-09-02"][1].text, "Pending Task B");

// Idempotent: running again on Day 2 must NOT duplicate tasks
const changedDay2Again = rollOverPendingTasks(testData, "2026-09-02");
assert.strictEqual(changedDay2Again, false, "Second rollover on same day must not duplicate tasks");
assert.strictEqual(testData.tasksByDate["2026-09-02"].length, 2, "Task count must remain 2");

// On Day 2, user completes Task A, but leaves Task B pending
testData.tasksByDate["2026-09-02"][0].completed = true;
testData.tasksByDate["2026-09-02"][0].completedAt = 2000;

// Rollover to Day 3: only Task B should continue to Day 3
const changedDay3 = rollOverPendingTasks(testData, "2026-09-03");
assert.strictEqual(changedDay3, true, "Rollover should report changes on day 3");
assert.strictEqual(testData.tasksByDate["2026-09-03"].length, 1, "Only pending Task B should roll over to day 3");
assert.strictEqual(testData.tasksByDate["2026-09-03"][0].text, "Pending Task B");
assert.strictEqual(testData.tasksByDate["2026-09-03"][0].carriedOverFrom, "2026-09-01", "Preserves original origin date");
console.log("✓ Continuous pending task carryover series verified (idempotent, preserves origins, chains forward).");

// 10. Diary & History integration in index.html
const indexHtmlContent = fs.readFileSync(path.join(__dirname, "..", "src", "index.html"), "utf-8");
assert(indexHtmlContent.includes('data-tab="diary"'), "index.html must include Diary nav tab button");
assert(indexHtmlContent.includes('id="tab-diary"'), "index.html must include tab-diary section");
assert(indexHtmlContent.includes('src="js/diary.js"'), "index.html must load js/diary.js");
assert(indexHtmlContent.includes('href="styles/diary.css"'), "index.html must load styles/diary.css");
console.log("✓ Diary History UI and script integration verified.");

// 11. SubahDiary Logic & Rollover Resolution Engine
const diarySrc = fs.readFileSync(path.join(__dirname, "..", "src", "js", "diary.js"), "utf-8");
assert(/class SubahDiary/.test(diarySrc), "diary.js must define SubahDiary class");
assert(/buildCompletionIndex/.test(diarySrc), "diary.js must index downstream completions for carried tasks");
assert(/copyDayJournal/.test(diarySrc), "diary.js must provide copyDayJournal export");
assert(/toggleTask/.test(diarySrc), "diary.js must provide interactive toggleTask handler");

// Verify SubahDiary stats and completion resolution behavior in isolated environment
const vm = require("vm");
const mockContext = {
  window: {},
  document: {
    getElementById: () => null,
    querySelectorAll: () => []
  },
  Intl,
  Date,
  Set,
  Map,
  Array,
  Math,
  console
};
vm.createContext(mockContext);
vm.runInContext(diarySrc, mockContext);

const diaryInstance = mockContext.window.subahDiary;
assert(diaryInstance, "window.subahDiary must be instantiated");

// Verify Hijri date formatting does NOT duplicate "AH"
const hijriTest = diaryInstance.getHijriDate("2026-09-09");
assert(!hijriTest.includes("AH AH"), "Hijri date must never duplicate 'AH': " + hijriTest);
assert(hijriTest.includes("AH"), "Hijri date must include AH era: " + hijriTest);
console.log("✓ Hijri date formatting verified without duplicate AH suffix (" + hijriTest + ")");

// Verify Downstream Completion Resolution:
// Task t-1 rolled over from day 1 to day 2 and was completed on day 2.
// The completion index must map t-1 to day 2 completion!
diaryInstance.tasksByDate = {
  "2026-09-01": [
    { id: "t-1", text: "Rolled Goal", completed: false, rolledOver: true, rolledTo: "2026-09-02" }
  ],
  "2026-09-02": [
    { id: "t-1-carry", originalTaskId: "t-1", text: "Rolled Goal", completed: true, completedAt: 12345678 }
  ]
};

const { completionByOriginId } = diaryInstance.buildCompletionIndex();
assert(completionByOriginId.has("t-1"), "t-1 must be indexed as completed downstream");
assert.strictEqual(completionByOriginId.get("t-1").resolvedDate, "2026-09-02");
console.log("✓ SubahDiary downstream completion resolution verified (carried tasks resolve cleanly).");

console.log("\n=========================================");
console.log("      ALL 11 CORE LOGIC TESTS PASSED!    ");
console.log("=========================================\n");
