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

// Calculate the preceding day relative to a given date string (YYYY-MM-DD)
function getYesterdayFor(dateStr) {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) {
    return getYesterdayDateString();
  }
  const parts = dateStr.split("-").map(n => parseInt(n, 10));
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return getYesterdayDateString();
  }
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() - 1);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Advance the daily streak the first time a given day is committed.
// Mutates `data` in place; returns true if the streak was bumped.
function applyDailyStreak(data, today) {
  if (!data) return false;
  const targetDay = today || getTodayDateString();
  if (data.lastCommittedDate === targetDay) return false;

  const yStr = getYesterdayFor(targetDay);
  data.streak = data.lastCommittedDate === yStr ? (data.streak || 0) + 1 : 1;
  data.maxStreak = Math.max(data.maxStreak || 1, data.streak);

  if (!data.streakHistory) data.streakHistory = [];
  if (!data.streakHistory.includes(targetDay)) data.streakHistory.push(targetDay);
  data.lastCommittedDate = targetDay;
  return true;
}

// Get motivational streak badge metadata based on streak length
function getStreakBadge(streak = 1) {
  const num = typeof streak === "number" ? streak : 1;
  if (num >= 100) return { name: "Legend", icon: "🌟", min: 100, color: "#fbbf24" };
  if (num >= 30) return { name: "Diamond Focus", icon: "💎", min: 30, color: "#38bdf8" };
  if (num >= 14) return { name: "Mastery Crown", icon: "👑", min: 14, color: "#f59e0b" };
  if (num >= 7) return { name: "Unstoppable Flame", icon: "🔥", min: 7, color: "#f43f5e" };
  if (num >= 3) return { name: "Green Sprout", icon: "🌱", min: 3, color: "#34d399" };
  return { name: "Morning Spark", icon: "✨", min: 1, color: "#94a3b8" };
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
      if (!task || typeof task !== "object") continue;

      // Only carry forward tasks that are uncompleted and have not yet rolled over from this date
      if (!task.completed && !task.rolledOver) {
        const origId = task.originalTaskId || task.id;
        const normText = (task.text || "").toLowerCase().trim();

        if (!existingOriginIds.has(origId) && !existingPendingTexts.has(normText)) {
          const carriedTask = {
            id: `task-carry-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
            text: task.text,
            completed: false,
            priority: task.priority || "normal",
            createdAt: task.createdAt || Date.now(),
            carriedOverFrom: task.carriedOverFrom || dateStr,
            rolloverCount: (typeof task.rolloverCount === "number" ? task.rolloverCount : 0) + 1,
            originalTaskId: origId,
            pinned: Boolean(task.pinned),
            subtasks: Array.isArray(task.subtasks) ? JSON.parse(JSON.stringify(task.subtasks)) : [],
            estimatedTime: task.estimatedTime || null,
            note: task.note || ""
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
    maxStreak: 1,
    streakHistory: [],
    settings: {
      theme: "midnight-aurora", // 'midnight-aurora' | 'royal-emerald' | 'obsidian-oled' | 'twilight-amethyst'
      defaultTimerMinutes: 7,
      soundEnabled: true,
      openAtLogin: true,
      enabledCategories: ["naat", "qawwali", "melody", "mashwara", "reading", "reel", "dua", "breathing"],
      favoriteRewards: []
    },
    reflectionsByDate: {},
    customRewards: []
  };
}

module.exports = {
  getTodayDateString,
  getYesterdayDateString,
  getYesterdayFor,
  applyDailyStreak,
  getStreakBadge,
  rollOverPendingTasks,
  getDefaultState
};
