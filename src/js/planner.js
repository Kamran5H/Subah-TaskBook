// Journal Planner Tab Logic
// Simple, elegant, distraction-free goal setting that converts lines to checklist tasks.

class SubahPlanner {
  constructor() {
    this.textarea = null;
    this.counterBadge = null;
  }

  init() {
    this.textarea = document.getElementById("planner-textarea");
    this.counterBadge = document.getElementById("planner-counter-badge");

    if (this.textarea) {
      this.textarea.addEventListener("input", () => this.updateCounter());
    }

    const saveBtn = document.getElementById("btn-save-planner-tasks");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveToTodayChecklist());
    }

    const clearBtn = document.getElementById("btn-clear-planner");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (this.textarea) {
          this.textarea.value = "";
          this.updateCounter();
        }
      });
    }

    this.updateCounter();
  }

  cleanBulletPrefix(line) {
    return line.replace(/^(?:(?:\d+[\.\)]|\-|\*|•|\[[\s xX]?\])\s*)/, "").trim();
  }

  getTasks() {
    if (!this.textarea) return [];
    return this.textarea.value
      .split("\n")
      .map(l => this.cleanBulletPrefix(l))
      .filter(l => l.length > 0)
      .map((text, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        text: text,
        completed: false,
        priority: "normal",
        createdAt: Date.now()
      }));
  }

  updateCounter() {
    const tasks = this.getTasks();
    const count = tasks.length;
    if (this.counterBadge) {
      if (count === 0) {
        this.counterBadge.textContent = "0 goals written";
        this.counterBadge.style.color = "var(--accent-cyan)";
      } else if (count >= 5) {
        this.counterBadge.textContent = `✨ ${count} goals ready (Daily momentum!)`;
        this.counterBadge.style.color = "var(--accent-emerald)";
      } else {
        this.counterBadge.textContent = `${count} goal${count > 1 ? "s" : ""} written`;
        this.counterBadge.style.color = "var(--accent-cyan)";
      }
    }
  }

  async saveToTodayChecklist() {
    const newTasks = this.getTasks();
    if (newTasks.length === 0) {
      window.subahApp.showToast("Please write at least 1 goal to add.");
      return;
    }

    // Append to existing checklist
    await window.subahChecklist.addMultipleTasks(newTasks);

    // Reset textarea for fresh future notes
    if (this.textarea) {
      this.textarea.value = "";
      this.updateCounter();
    }

    // Celebration
    window.subahAudio.playChime();
    window.subahConfetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 80);
    window.subahApp.showToast(`✨ ${newTasks.length} goal${newTasks.length > 1 ? "s" : ""} added to today's tasks!`);

    // Switch to Today's Tasks tab
    window.subahApp.switchTab("checklist");
  }
}

window.subahPlanner = new SubahPlanner();
