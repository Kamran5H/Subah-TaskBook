// Daily Task Checklist Screen Logic
// Handles task items, checking/unchecking, progress tracking, streaks, and triggering surprise rewards.

class SubahChecklist {
  constructor() {
    this.tasks = [];
    this.todayDate = "";
    this.container = null;
    this.progressFill = null;
    this.progressCounterText = null;
    this.streakNum = null;
  }

  init() {
    this.container = document.getElementById("task-items-container");
    this.progressFill = document.getElementById("checklist-progress-fill");
    this.progressCounterText = document.getElementById("checklist-progress-counter");
    this.streakNum = document.getElementById("streak-count-num");

    // Add task inline input
    const addInput = document.getElementById("add-task-input");
    const addBtn = document.getElementById("btn-add-task-submit");

    if (addInput) {
      addInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.handleAddTask();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", () => this.handleAddTask());
    }
  }

  setData(todayDate, tasks, streak = 0) {
    this.todayDate = todayDate;
    this.tasks = tasks || [];
    if (this.streakNum) {
      this.streakNum.textContent = streak;
    }
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    if (this.tasks.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 4px;">No tasks for today yet</h3>
          <p style="font-size: 13px;">Add a task above to keep your momentum going.</p>
        </div>
      `;
      this.updateProgress();
      return;
    }

    this.tasks.forEach((task, index) => {
      const card = document.createElement("div");
      card.className = `task-item-card ${task.completed ? "completed" : ""}`;
      card.setAttribute("data-id", task.id);

      const priorityLabel = (task.priority || "normal").toUpperCase();

      card.innerHTML = `
        <div class="task-left-section">
          <button class="custom-checkbox-btn" title="${task.completed ? 'Mark pending' : 'Complete task & claim reward!'}">
            <svg class="checkmark-svg" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <div class="task-content-wrapper">
            <span class="task-text-body">${this.escapeHtml(task.text)}</span>
            <div class="task-tags-row">
              <span class="priority-tag ${task.priority || 'normal'}">${priorityLabel}</span>
              ${task.carriedOverFrom ? `<span class="diary-carried-pill" style="font-size: 10px; padding: 1px 7px;">🔄 Carried from ${task.carriedOverFrom}</span>` : ''}
              ${task.rewardClaimed ? '<span class="reward-claimed-pill">🎁 Reward Claimed</span>' : ''}
            </div>
          </div>
        </div>
        <div class="task-right-actions">
          <button class="btn-task-action edit" title="Edit Task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          ${task.rewardClaimed ? `
            <button class="btn-task-action replay-reward" title="Replay Reward">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          ` : ''}
          <button class="btn-task-action delete" title="Delete Task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Checkbox click listener
      const checkBtn = card.querySelector(".custom-checkbox-btn");
      checkBtn.addEventListener("click", () => this.toggleTask(task.id));

      // Inline text double click to edit
      const textSpan = card.querySelector(".task-text-body");
      textSpan.addEventListener("dblclick", () => this.startInlineEdit(card, task));

      // Edit button listener
      const editBtn = card.querySelector(".btn-task-action.edit");
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.startInlineEdit(card, task);
      });

      // Replay reward button
      const replayBtn = card.querySelector(".replay-reward");
      if (replayBtn) {
        replayBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          window.subahRewards.presentSurpriseReward(task, true);
        });
      }

      // Delete button listener
      const deleteBtn = card.querySelector(".btn-task-action.delete");
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteTask(task.id);
      });

      this.container.appendChild(card);
    });

    this.updateProgress();
  }

  async toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
      task.completedAt = Date.now();
      task.rewardClaimed = true;

      // 1. Play celebration fanfare sound
      window.subahAudio.playCelebration();

      // 2. Explode festive confetti
      window.subahConfetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 100);

      // 3. Open Surprise Reward Gift Modal
      window.subahRewards.presentSurpriseReward(task);
    } else {
      delete task.completedAt;
      window.subahAudio.playClick();
    }

    this.render();
    await this.persist();
  }

  startInlineEdit(card, task) {
    const contentWrap = card.querySelector(".task-content-wrapper");
    if (!contentWrap) return;

    const originalText = task.text;
    contentWrap.innerHTML = `
      <input type="text" class="task-inline-edit-input" style="padding: 4px 8px; background: rgba(0,0,0,0.35); border: 1px solid var(--border-accent); border-radius: 6px; width: 100%; color: #fff; font-size: 14px; outline: none;" value="${this.escapeHtml(originalText)}">
    `;

    const input = contentWrap.querySelector("input");
    input.focus();
    input.select();

    let finished = false;
    const finishEdit = async (save) => {
      if (finished) return;
      finished = true;
      if (save) {
        const val = input.value.trim();
        if (val && val !== originalText) {
          task.text = val;
          await this.persist();
          window.subahApp.showToast("Task updated");
        }
      }
      this.render();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishEdit(true);
      if (e.key === "Escape") finishEdit(false);
    });
    input.addEventListener("blur", () => finishEdit(true));
  }

  async handleAddTask() {
    const input = document.getElementById("add-task-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const newTask = {
      // Random suffix guards against two adds (or an add + a planner save) landing
      // in the same millisecond and minting a duplicate task id.
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: text,
      completed: false,
      priority: "normal",
      createdAt: Date.now()
    };

    this.tasks.push(newTask);
    input.value = "";
    window.subahAudio.playClick();
    this.render();
    await this.persist();
    window.subahApp.showToast("Task added to today's list");
  }

  async deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    window.subahAudio.playClick();
    this.render();
    await this.persist();
  }

  async addMultipleTasks(newTasks) {
    if (!newTasks || newTasks.length === 0) return;
    this.tasks = [...this.tasks, ...newTasks];
    this.render();
    await this.persist();
  }

  updateProgress() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (this.progressFill) {
      this.progressFill.style.width = `${pct}%`;
    }
    if (this.progressCounterText) {
      this.progressCounterText.textContent = `${completed} of ${total} Completed (${pct}%)`;
    }
  }

  async persist() {
    const res = await window.subahAPI.updateTasks({
      date: this.todayDate,
      tasks: this.tasks
    });
    // Reflect a streak bump (first tasks of the day) without needing a restart
    if (res && typeof res.streak === "number" && this.streakNum) {
      this.streakNum.textContent = res.streak;
    }
    if (window.subahApp && typeof window.subahApp.onTasksUpdated === "function") {
      window.subahApp.onTasksUpdated(this.todayDate, this.tasks, res && res.streak);
    }
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }
}

window.subahChecklist = new SubahChecklist();
