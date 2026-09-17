// Daily Task Checklist Screen Logic
// Handles task items, checking/unchecking, progress tracking, streaks, and triggering surprise rewards.

class SubahChecklist {
  constructor() {
    this.tasks = [];
    this.todayDate = "";
    this.currentFilter = "all";
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

    // Filter pill tabs
    const filterPills = document.querySelectorAll(".checklist-filter-pill");
    filterPills.forEach(pill => {
      pill.addEventListener("click", () => {
        filterPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentFilter = pill.getAttribute("data-filter") || "all";
        window.subahAudio.playClick();
        this.render();
      });
    });
  }

  setData(todayDate, tasks, streak = 0) {
    this.todayDate = todayDate;
    this.tasks = tasks || [];
    this.sortByPriority();
    if (this.streakNum) {
      this.streakNum.textContent = streak;
    }
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";

    const total = this.tasks.length;
    const pendingTasks = this.tasks.filter(t => !t.completed);
    const completedTasks = this.tasks.filter(t => t.completed);
    const highTasks = this.tasks.filter(t => t.priority === "high" && !t.completed);

    // Update filter badge counts
    const cAll = document.getElementById("count-filter-all");
    const cPending = document.getElementById("count-filter-pending");
    const cCompleted = document.getElementById("count-filter-completed");
    const cHigh = document.getElementById("count-filter-high");
    if (cAll) cAll.textContent = total;
    if (cPending) cPending.textContent = pendingTasks.length;
    if (cCompleted) cCompleted.textContent = completedTasks.length;
    if (cHigh) cHigh.textContent = highTasks.length;

    if (total === 0) {
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

    // Celebration banner when all goals are achieved
    if (pendingTasks.length === 0 && total > 0) {
      const banner = document.createElement("div");
      banner.className = "checklist-all-done-banner";
      banner.innerHTML = `
        <div class="all-done-icon">🌟</div>
        <div class="all-done-text">
          <h4 class="all-done-title">All Daily Goals Accomplished!</h4>
          <p class="all-done-sub">Your momentum and streak are shining bright today. Recharge with a surprise reward.</p>
        </div>
        <button class="btn-glow-primary all-done-btn" id="btn-all-done-reward">🎲 Surprise Me Now</button>
      `;
      const bannerBtn = banner.querySelector("#btn-all-done-reward");
      if (bannerBtn) {
        bannerBtn.addEventListener("click", () => {
          if (window.subahRewards) {
            window.subahRewards.presentSurpriseReward(null);
          }
        });
      }
      this.container.appendChild(banner);
    }

    // Filter tasks based on currentFilter
    let displayTasks = this.tasks;
    if (this.currentFilter === "pending") displayTasks = pendingTasks;
    else if (this.currentFilter === "completed") displayTasks = completedTasks;
    else if (this.currentFilter === "high") displayTasks = highTasks;

    if (displayTasks.length === 0) {
      const emptyNotice = document.createElement("div");
      emptyNotice.style.cssText = "text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 13px;";
      emptyNotice.textContent = `No ${this.currentFilter} tasks to show right now.`;
      this.container.appendChild(emptyNotice);
      this.updateProgress();
      return;
    }

    displayTasks.forEach((task) => {
      const card = document.createElement("div");
      card.className = `task-item-card ${task.completed ? "completed" : ""} ${task.pinned ? "pinned" : ""}`;
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
              ${task.pinned ? '<span class="pinned-tag-pill" title="Pinned to top">📌 PINNED</span>' : ''}
              <span class="priority-tag ${task.priority || 'normal'}" role="button" tabindex="0" title="Click to change priority (High / Normal / Low)">${priorityLabel}</span>
              ${task.isPrivate ? '<span class="pinned-tag-pill" style="background: rgba(251,191,36,0.15); color: #fbbf24; border-color: rgba(251,191,36,0.3);" title="Private Goal - Hidden from live share">🔒 PRIVATE</span>' : ''}
              ${task.carriedOverFrom ? `<span class="diary-carried-pill" style="font-size: 10px; padding: 1px 7px;">🔄 Carried from ${task.carriedOverFrom}</span>` : ''}
              ${task.rewardClaimed ? '<span class="reward-claimed-pill">🎁 Reward Claimed</span>' : ''}
            </div>
          </div>
        </div>
        <div class="task-right-actions">
          <button class="btn-task-action pin ${task.pinned ? 'active' : ''}" title="${task.pinned ? 'Unpin task' : 'Pin to top'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${task.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-2l-2-2V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 2v2z"></path>
            </svg>
          </button>
          <button class="btn-task-action privacy ${task.isPrivate ? 'active' : ''}" title="${task.isPrivate ? 'Private (Hidden from live share) - Click to make public' : 'Public in live share - Click to make private'}">
            <span style="font-size: 13px;">${task.isPrivate ? '🔒' : '👁️'}</span>
          </button>
          ${!task.completed ? `
            <button class="btn-task-action defer" title="Defer task to tomorrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          ` : ''}
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

      // Priority tag: click (or Enter/Space) to cycle High → Normal → Low
      const priorityTag = card.querySelector(".priority-tag");
      if (priorityTag) {
        priorityTag.addEventListener("click", (e) => {
          e.stopPropagation();
          this.cyclePriority(task.id);
        });
        priorityTag.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            this.cyclePriority(task.id);
          }
        });
      }

      // Inline text double click to edit
      const textSpan = card.querySelector(".task-text-body");
      textSpan.addEventListener("dblclick", () => this.startInlineEdit(card, task));

      // Pin button listener
      const pinBtn = card.querySelector(".btn-task-action.pin");
      if (pinBtn) {
        pinBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.togglePin(task.id);
        });
      }

      // Privacy button listener
      const privacyBtn = card.querySelector(".btn-task-action.privacy");
      if (privacyBtn) {
        privacyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.togglePrivacy(task.id);
        });
      }

      // Defer to tomorrow listener
      const deferBtn = card.querySelector(".btn-task-action.defer");
      if (deferBtn) {
        deferBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deferToTomorrow(task.id);
        });
      }

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

      // 4. Live Share broadcast celebration to friend
      if (window.SubahLiveShare) {
        window.SubahLiveShare.broadcastTasksUpdate({ completedTaskText: task.text });
      }
    } else {
      delete task.completedAt;
      window.subahAudio.playClick();
    }

    this.render();
    await this.persist();
  }

  async togglePrivacy(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.isPrivate = !task.isPrivate;
    this.render();
    await this.persist();

    if (window.SubahLiveShare) {
      window.SubahLiveShare.broadcastTasksUpdate();
    }

    if (window.subahApp) {
      window.subahApp.showToast(task.isPrivate ? "🔒 Goal marked private (hidden from friends)" : "👁️ Goal is now visible to friends in live share", "info");
    }
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
      // Random suffix guards against two adds (or an add + a schedule save) landing
      // in the same millisecond and minting a duplicate task id.
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: text,
      completed: false,
      priority: "normal",
      pinned: false,
      createdAt: Date.now()
    };

    this.tasks.push(newTask);
    this.sortByPriority();
    input.value = "";
    window.subahAudio.playClick();
    this.render();
    await this.persist();
    window.subahApp.showToast("Task added to today's list");
  }

  async togglePin(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.pinned = !task.pinned;
    this.sortByPriority();
    window.subahAudio.playClick();
    this.render();
    await this.persist();
    window.subahApp.showToast(task.pinned ? "📌 Task pinned to top" : "Task unpinned");
  }

  async cyclePriority(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    // High → Normal → Low → High. Higher priority tasks bubble to the top so the
    // day's most important work stays in view without a separate sort control.
    const order = ["high", "normal", "low"];
    const current = order.includes(task.priority) ? task.priority : "normal";
    task.priority = order[(order.indexOf(current) + 1) % order.length];

    this.sortByPriority();
    window.subahAudio.playClick();
    this.render();
    await this.persist();
    window.subahApp.showToast(`Priority set to ${task.priority.toUpperCase()}`);
  }

  sortByPriority() {
    const rank = { high: 0, normal: 1, low: 2 };
    // Stable sort:
    // 1. Pending tasks always come before completed tasks.
    // 2. Among pending tasks: pinned tasks always stay at the absolute top.
    // 3. Within pinned or unpinned buckets: ordered by priority (high -> normal -> low).
    // 4. Stable order: preserves insertion index within identical buckets.
    // 5. Completed tasks: move to bottom, with completed pinned tasks staying at top of completed list.
    this.tasks = this.tasks
      .map((t, i) => ({ t, i }))
      .sort((a, b) => {
        const ac = a.t.completed ? 1 : 0;
        const bc = b.t.completed ? 1 : 0;
        if (ac !== bc) return ac - bc;

        // Both pending or both completed:
        const ap = a.t.pinned ? 0 : 1;
        const bp = b.t.pinned ? 0 : 1;
        if (ap !== bp) return ap - bp;

        const ar = rank[a.t.priority] ?? 1;
        const br = rank[b.t.priority] ?? 1;
        if (ar !== br) return ar - br;

        return a.i - b.i;
      })
      .map(x => x.t);
  }

  async deferToTomorrow(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    const [task] = this.tasks.splice(taskIndex, 1);

    let d = new Date();
    if (this.todayDate && this.todayDate.includes("-")) {
      const [y, m, dayNum] = this.todayDate.split("-").map(n => parseInt(n, 10));
      d = new Date(y, m - 1, dayNum);
    }
    d.setDate(d.getDate() + 1);
    const tmrw = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    task.carriedOver = true;
    task.carriedOverFrom = this.todayDate;
    await this.persist();

    // Persist to tomorrow in schedule / backend
    if (window.subahSchedule && window.subahSchedule.tasksByDate) {
      if (!window.subahSchedule.tasksByDate[tmrw]) window.subahSchedule.tasksByDate[tmrw] = [];
      window.subahSchedule.tasksByDate[tmrw].push(task);
      await window.subahAPI.updateTasks({ date: tmrw, tasks: window.subahSchedule.tasksByDate[tmrw] });
      window.subahSchedule.renderCalendar();
      window.subahSchedule.renderSelectedDayTasks();
    } else {
      const appState = await window.subahAPI.getAppState();
      const tmrwTasks = (appState.tasksByDate && appState.tasksByDate[tmrw]) || [];
      tmrwTasks.push(task);
      await window.subahAPI.updateTasks({ date: tmrw, tasks: tmrwTasks });
    }

    window.subahAudio.playClick();
    this.render();
    window.subahApp.showToast("Task deferred to tomorrow 🌅");
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
    this.sortByPriority();
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
    if (window.SubahLiveShare) {
      window.SubahLiveShare.broadcastTasksUpdate();
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
