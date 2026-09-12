// Pending tasks continuous rollover logic and streak calculation helpers for Subah Task Book

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString() {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const year = y.getFullYear();
  const month = String(y.getMonth() + 1).padStart(2, "0");
  const day = String(y.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Advance the daily streak the first time a given day is committed.
// Mutates `data` in place; returns true if the streak was bumped.
function applyDailyStreak(data, today) {
  if (data.lastCommittedDate === today) return false;
  const yStr = getYesterdayDateString();
  data.streak = data.lastCommittedDate === yStr ? (data.streak || 0) + 1 : 1;
  if (!data.streakHistory) data.streakHistory = [];
  if (!data.streakHistory.includes(today)) data.streakHistory.push(today);
  data.lastCommittedDate = today;
  return true;
}

// Automatically carry forward uncompleted tasks from previous days into today's list
function rollOverPendingTasks(data, today) {
  if (!data || !data.tasksByDate) return false;

  if (!data.tasksByDate[today]) {
    data.tasksByDate[today] = [];
  }

  const todayTasks = data.tasksByDate[today];
  // Track existing tasks on today to prevent duplicate carryovers
  const existingOriginIds = new Set(
    todayTasks.map(t => t.originalTaskId || t.id)
  );
  const existingPendingTexts = new Set(
    todayTasks.filter(t => !t.completed).map(t => (t.text || "").toLowerCase().trim())
  );

  let changesMade = false;
  const priorDates = Object.keys(data.tasksByDate)
    .filter(d => d < today)
    .sort();

  for (const dateStr of priorDates) {
    const list = data.tasksByDate[dateStr];
    if (!Array.isArray(list)) continue;

    for (let i = 0; i < list.length; i++) {
      const task = list[i];
      // Only carry forward tasks that are uncompleted and have not yet rolled over from this date
      if (!task.completed && !task.rolledOver) {
        const origId = task.originalTaskId || task.id;
        const normText = (task.text || "").toLowerCase().trim();

        if (!existingOriginIds.has(origId) && !existingPendingTexts.has(normText)) {
          const carriedTask = {
            id: `task-carry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            text: task.text,
            completed: false,
            priority: task.priority || "normal",
            createdAt: task.createdAt || Date.now(),
            carriedOverFrom: task.carriedOverFrom || dateStr,
            originalTaskId: origId
          };

          todayTasks.push(carriedTask);
          existingOriginIds.add(origId);
          existingPendingTexts.add(normText);
          changesMade = true;
        }

        task.rolledOver = true;
        task.rolledTo = today;
        changesMade = true;
      }
    }
  }

  return changesMade;
}

function getDefaultState() {
  const today = getTodayDateString();
  return {
    lastCommittedDate: null,
    currentDate: today,
    tasksByDate: {},
    streak: 1,
    streakHistory: [],
    settings: {
      theme: "midnight-aurora", // 'midnight-aurora' | 'royal-emerald' | 'obsidian-oled'
      defaultTimerMinutes: 7,
      soundEnabled: true,
      openAtLogin: true,
      enabledCategories: ["naat", "qawwali", "melody", "mashwara", "reading", "reel", "dua", "breathing"]
    },
    customRewards: []
  };
}

module.exports = {
  getTodayDateString,
  getYesterdayDateString,
  applyDailyStreak,
  rollOverPendingTasks,
  getDefaultState
};
