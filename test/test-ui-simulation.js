// Automated UI and functional simulation test for Subah Schedule and Pin Task features
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("==================================================");
console.log("   RUNNING SUBAH SCHEDULE & PIN UI SIMULATION     ");
console.log("==================================================\n");

// Minimal DOM Mock
function createMockElement(tag = "div", id = "", className = "") {
  const children = [];
  const listeners = {};
  const style = {};
  const dataset = {};
  const attributes = {};

  return {
    tagName: tag.toUpperCase(),
    id,
    className,
    style,
    dataset,
    children,
    value: "",
    checked: false,
    textContent: "",
    innerHTML: "",
    getAttribute(name) { return attributes[name] || this.dataset[name.replace("data-", "")]; },
    setAttribute(name, val) {
      attributes[name] = val;
      if (name.startsWith("data-")) {
        this.dataset[name.replace("data-", "")] = val;
      }
    },
    classList: {
      _classes: new Set(className ? className.split(" ").filter(Boolean) : []),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      toggle(cls, force) {
        if (force === undefined) {
          if (this._classes.has(cls)) this._classes.delete(cls);
          else this._classes.add(cls);
        } else if (force) {
          this._classes.add(cls);
        } else {
          this._classes.delete(cls);
        }
      },
      contains(cls) { return this._classes.has(cls); }
    },
    addEventListener(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    dispatchEvent(evt, data) {
      if (listeners[evt]) listeners[evt].forEach(fn => fn(data || {}));
    },
    appendChild(child) { children.push(child); return child; },
    querySelector(sel) {
      if (sel === ".custom-checkbox-btn") return createMockElement("button", "", "custom-checkbox-btn");
      if (sel === ".btn-task-action.pin") return createMockElement("button", "", "btn-task-action pin");
      if (sel === ".btn-task-action.edit") return createMockElement("button", "", "btn-task-action edit");
      if (sel === ".btn-task-action.delete") return createMockElement("button", "", "btn-task-action delete");
      if (sel === ".task-text-body") return createMockElement("span", "", "task-text-body");
      if (sel === ".priority-tag") return createMockElement("span", "", "priority-tag");
      return null;
    },
    querySelectorAll(sel) { return []; }
  };
}

const mockDoc = {
  getElementById(id) {
    return createMockElement("div", id);
  },
  createElement(tag) {
    return createMockElement(tag);
  },
  querySelectorAll(sel) {
    return [];
  }
};

const mockWindow = {
  subahAudio: { playClick: () => {}, playChime: () => {}, playCelebration: () => {} },
  subahConfetti: { burst: () => {} },
  subahApp: {
    showToast: (msg) => { console.log(`    [App Toast] "${msg}"`); },
    onTasksUpdated: (date, tasks, streak) => {}
  },
  subahAPI: {
    updateTasks: async ({ date, tasks }) => ({ success: true, tasks, streak: 5 })
  }
};

const context = {
  window: mockWindow,
  document: mockDoc,
  Date,
  Math,
  Array,
  Intl,
  Set,
  Map,
  console
};

vm.createContext(context);

// Load checklist.js
const checklistSrc = fs.readFileSync(path.join(__dirname, "..", "src", "js", "checklist.js"), "utf-8");
vm.runInContext(checklistSrc, context);
const checklist = context.window.subahChecklist;

// Test Checklist Pinning & Sorting
console.log("1. Testing Checklist Pinning & Priority Cycling...");
checklist.container = createMockElement("div");
checklist.todayDate = "2026-09-13";
checklist.tasks = [
  { id: "task-low", text: "Low Priority Task", priority: "low", completed: false, pinned: false },
  { id: "task-normal", text: "Normal Task", priority: "normal", completed: false, pinned: false },
  { id: "task-high", text: "High Priority Task", priority: "high", completed: false, pinned: false }
];

checklist.sortByPriority();
assert.deepStrictEqual(checklist.tasks.map(t => t.id), ["task-high", "task-normal", "task-low"]);
console.log("   ✓ Default priority order: high -> normal -> low");

// Pin the normal task
checklist.tasks[1].pinned = true;
checklist.sortByPriority();
assert.deepStrictEqual(checklist.tasks.map(t => t.id), ["task-normal", "task-high", "task-low"]);
console.log("   ✓ Pinned normal task moved ABOVE unpinned high task!");

// Pin the low task as well
checklist.tasks[2].pinned = true;
checklist.sortByPriority();
// Both task-normal and task-low are pinned; normal ranks above low among pinned
assert.deepStrictEqual(checklist.tasks.map(t => t.id), ["task-normal", "task-low", "task-high"]);
console.log("   ✓ Multiple pinned tasks order properly among themselves, ahead of unpinned");

// Complete the pinned normal task
checklist.tasks[0].completed = true;
checklist.sortByPriority();
// Pending pinned low task first, then pending unpinned high, then completed pinned normal
assert.deepStrictEqual(checklist.tasks.map(t => t.id), ["task-low", "task-high", "task-normal"]);
console.log("   ✓ Completed pinned task moves down to completed section without blocking pending tasks");

// Load schedule.js
console.log("\n2. Testing Schedule Tab & Calendar Functionality...");
const scheduleSrc = fs.readFileSync(path.join(__dirname, "..", "src", "js", "schedule.js"), "utf-8");
vm.runInContext(scheduleSrc, context);
const schedule = context.window.subahSchedule;

assert(schedule, "subahSchedule must be instantiated");

schedule.calendarDaysGrid = createMockElement("div");
schedule.monthYearTitle = createMockElement("span");
schedule.selectedDayTitle = createMockElement("h2");
schedule.selectedDaySubtitle = createMockElement("span");
schedule.selectedDayCounter = createMockElement("span");
schedule.tasksContainer = createMockElement("div");

schedule.init({
  "2026-09-13": [
    { id: "today-1", text: "Today's Focus", completed: false, priority: "high", pinned: true }
  ],
  "2026-09-18": [
    { id: "future-1", text: "Doctor Appointment", completed: false, priority: "normal", pinned: true },
    { id: "future-2", text: "Buy Groceries", completed: false, priority: "low", pinned: false }
  ]
}, "2026-09-13");

assert.strictEqual(schedule.selectedDate, "2026-09-13");
console.log("   ✓ Schedule initialized with today's date selected");

// Select future date
schedule.selectDate("2026-09-18");
assert.strictEqual(schedule.selectedDate, "2026-09-18");
assert.strictEqual(schedule.tasksByDate["2026-09-18"].length, 2);
console.log("   ✓ Future date 2026-09-18 selected with 2 tasks loaded");

// Simulate adding a task for 2026-09-18
schedule.addTaskInput = { value: "Review quarterly report" };
schedule.prioritySelect = { value: "high" };
schedule.pinCheckbox = { checked: true };

(async () => {
  await schedule.handleAddTask();
  assert.strictEqual(schedule.tasksByDate["2026-09-18"].length, 3);
  const newTask = schedule.tasksByDate["2026-09-18"][2];
  assert.strictEqual(newTask.text, "Review quarterly report");
  assert.strictEqual(newTask.priority, "high");
  assert.strictEqual(newTask.pinned, true);
  console.log("   ✓ Added new pinned high-priority task for future date");

  // Check day cell generation
  const cell = schedule.createDayCell(18, "2026-09-18", true);
  assert(cell.classList.contains("has-tasks"), "2026-09-18 must be flagged with has-tasks class");
  assert(cell.innerHTML.includes('calendar-task-dot pinned'), "Must render pinned task dot");
  console.log("   ✓ Calendar day cell reflects has-tasks and golden pinned indicator dot");

  console.log("\n==================================================");
  console.log("   ALL UI SIMULATION TESTS PASSED SUCCESSFULLY!   ");
  console.log("==================================================\n");
})();
