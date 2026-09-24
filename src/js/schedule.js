// Schedule Tab Logic for Subah Task Book
// Full interactive Google Calendar-style task scheduler allowing date selection,
// future task planning, pinning, and automatic day-of appearance.

class SubahSchedule {
  constructor() {
    this.tasksByDate = {};
    this.todayDate = "";
    this.selectedDate = "";
    this.viewYear = new Date().getFullYear();
    this.viewMonth = new Date().getMonth(); // 0 - 11

    // DOM Elements
    this.monthYearTitle = null;
    this.calendarDaysGrid = null;
    this.manualDateInput = null;
    this.selectedDayTitle = null;
    this.selectedDaySubtitle = null;
    this.selectedDayCounter = null;
    this.tasksContainer = null;
    this.addTaskInput = null;
    this.prioritySelect = null;
    this.pinCheckbox = null;
    this.addBtn = null;
  }

  init(tasksByDate = {}, todayDate = "") {
    this.tasksByDate = tasksByDate || {};
    this.todayDate = todayDate || this.getTodayDateString();
    this.selectedDate = this.todayDate;

    const [y, m] = this.selectedDate.split("-").map(n => parseInt(n, 10));
    this.viewYear = y || new Date().getFullYear();
    this.viewMonth = (m ? m - 1 : new Date().getMonth());

    // Bind DOM
    this.monthYearTitle = document.getElementById("schedule-month-year-label");
    this.calendarDaysGrid = document.getElementById("schedule-calendar-days");
    this.manualDateInput = document.getElementById("schedule-manual-date");
    this.selectedDayTitle = document.getElementById("schedule-selected-day-title");
    this.selectedDaySubtitle = document.getElementById("schedule-selected-day-subtitle");
    this.selectedDayCounter = document.getElementById("schedule-selected-day-counter");
    this.tasksContainer = document.getElementById("schedule-day-tasks-container");
    this.addTaskInput = document.getElementById("schedule-add-task-input");
    this.prioritySelect = document.getElementById("schedule-add-priority-select");
    this.pinCheckbox = document.getElementById("schedule-add-pin-checkbox");
    this.addBtn = document.getElementById("btn-schedule-add-task");

    // Month Navigation
    const prevBtn = document.getElementById("btn-schedule-prev-month");
    const nextBtn = document.getElementById("btn-schedule-next-month");
    const todayNavBtn = document.getElementById("btn-schedule-jump-today");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        this.viewMonth--;
        if (this.viewMonth < 0) {
          this.viewMonth = 11;
          this.viewYear--;
        }
        this.renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.viewMonth++;
        if (this.viewMonth > 11) {
          this.viewMonth = 0;
          this.viewYear++;
        }
        this.renderCalendar();
      });
    }

    if (todayNavBtn) {
      todayNavBtn.addEventListener("click", () => {
        this.selectDate(this.todayDate);
        const [ty, tm] = this.todayDate.split("-").map(n => parseInt(n, 10));
        this.viewYear = ty;
        this.viewMonth = tm - 1;
        this.renderCalendar();
      });
    }

    // Manual Date Picker
    if (this.manualDateInput) {
      this.manualDateInput.value = this.selectedDate;
      this.manualDateInput.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val) {
          this.selectDate(val);
          const [vy, vm] = val.split("-").map(n => parseInt(n, 10));
          this.viewYear = vy;
          this.viewMonth = vm - 1;
          this.renderCalendar();
        }
      });
    }

    // Quick Date Preset Chips
    document.querySelectorAll(".schedule-preset-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        const offsetDays = parseInt(e.currentTarget.getAttribute("data-offset-days") || "0", 10);
        const targetDate = this.getDateWithOffset(offsetDays);
        this.selectDate(targetDate);
        const [vy, vm] = targetDate.split("-").map(n => parseInt(n, 10));
        this.viewYear = vy;
        this.viewMonth = vm - 1;
        this.renderCalendar();
      });
    });

    // Add Task Inline Input & Button
    if (this.addTaskInput) {
      this.addTaskInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.handleAddTask();
        }
      });
    }

    if (this.addBtn) {
      this.addBtn.addEventListener("click", () => this.handleAddTask());
    }

    this.renderCalendar();
    this.renderSelectedDayTasks();
  }

  onOpen() {
    this.renderCalendar();
    this.renderSelectedDayTasks();
  }

  updateData(tasksByDate, todayDate) {
    if (tasksByDate) this.tasksByDate = tasksByDate;
    if (todayDate) this.todayDate = todayDate;
    this.renderCalendar();
    this.renderSelectedDayTasks();
  }

  getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getDateWithOffset(days) {
    let d = new Date();
    if (this.todayDate && typeof this.todayDate === "string" && this.todayDate.includes("-")) {
      const [y, m, dayNum] = this.todayDate.split("-").map(n => parseInt(n, 10));
      if (!isNaN(y) && !isNaN(m) && !isNaN(dayNum)) {
        d = new Date(y, m - 1, dayNum);
      }
    }
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    if (this.manualDateInput) {
      this.manualDateInput.value = dateStr;
    }
    this.renderCalendar();
    this.renderSelectedDayTasks();
  }

  renderCalendar() {
    if (!this.calendarDaysGrid || !this.monthYearTitle) return;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    this.monthYearTitle.textContent = `${monthNames[this.viewMonth]} ${this.viewYear}`;

    this.calendarDaysGrid.innerHTML = "";

    // Month boundaries
    const firstDayIndex = new Date(this.viewYear, this.viewMonth, 1).getDay();
    // In Sunday=0 -> make Monday=0: (day + 6) % 7
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate();

    // Previous month filler days
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = this.viewMonth === 0 ? 11 : this.viewMonth - 1;
      const prevY = this.viewMonth === 0 ? this.viewYear - 1 : this.viewYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      const cell = this.createDayCell(dayNum, dateStr, false);
      this.calendarDaysGrid.appendChild(cell);
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${this.viewYear}-${String(this.viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const cell = this.createDayCell(dayNum, dateStr, true);
      this.calendarDaysGrid.appendChild(cell);
    }

    // Next month filler days to complete 35 or 42 grid cells
    const totalCells = adjustedFirstDay + daysInMonth;
    const nextDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let dayNum = 1; dayNum <= nextDays; dayNum++) {
      const nextM = this.viewMonth === 11 ? 0 : this.viewMonth + 1;
      const nextY = this.viewMonth === 11 ? this.viewYear + 1 : this.viewYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      const cell = this.createDayCell(dayNum, dateStr, false);
      this.calendarDaysGrid.appendChild(cell);
    }
  }

  createDayCell(dayNum, dateStr, isCurrentMonth) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell";
    if (!isCurrentMonth) cell.classList.add("other-month");

    const isToday = dateStr === this.todayDate;
    const isSelected = dateStr === this.selectedDate;

    if (isToday) cell.classList.add("is-today");
    if (isSelected) cell.classList.add("is-selected");

    const tasks = (this.tasksByDate && this.tasksByDate[dateStr]) || [];
    const taskCount = tasks.length;
    const hasPending = tasks.some(t => !t.completed);
    const hasPinned = tasks.some(t => t.pinned && !t.completed);

    if (taskCount > 0) {
      cell.classList.add("has-tasks");
    }

    let dotHtml = "";
    if (taskCount > 0) {
      if (hasPinned) {
        dotHtml = `<span class="calendar-task-dot pinned" title="${taskCount} tasks (includes pinned)"></span>`;
      } else if (hasPending) {
        dotHtml = `<span class="calendar-task-dot pending" title="${taskCount} tasks"></span>`;
      } else {
        dotHtml = `<span class="calendar-task-dot completed" title="${taskCount} tasks completed"></span>`;
      }
    }

    cell.innerHTML = `
      <span class="day-number">${dayNum}</span>
      <div class="day-indicators-wrap">
        ${dotHtml}
      </div>
    `;

    cell.setAttribute("tabindex", "0");
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", dateStr);

    cell.addEventListener("click", () => {
      if (!isCurrentMonth) {
        const [ny, nm] = dateStr.split("-").map(n => parseInt(n, 10));
        this.viewYear = ny;
        this.viewMonth = nm - 1;
      }
      this.selectDate(dateStr);
    });

    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!isCurrentMonth) {
          const [ny, nm] = dateStr.split("-").map(n => parseInt(n, 10));
          this.viewYear = ny;
          this.viewMonth = nm - 1;
        }
        this.selectDate(dateStr);
      }
    });

    return cell;
  }

  renderSelectedDayTasks() {
    if (!this.selectedDayTitle || !this.tasksContainer) return;

    // Format heading
    const [y, m, d] = this.selectedDate.split("-").map(n => parseInt(n, 10));
    const dateObj = new Date(y, m - 1, d);

    const formattedFull = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    this.selectedDayTitle.textContent = formattedFull;

    // Subtitle label
    let subLabel = "";
    if (this.selectedDate === this.todayDate) {
      subLabel = "🌟 Today";
    } else {
      const todayObj = new Date();
      todayObj.setHours(0, 0, 0, 0);
      const targetObj = new Date(y, m - 1, d);
      targetObj.setHours(0, 0, 0, 0);
      const diffDays = Math.round((targetObj - todayObj) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        subLabel = "🚀 Tomorrow";
      } else if (diffDays === -1) {
        subLabel = "Yesterday";
      } else if (diffDays > 1) {
        subLabel = `📅 In ${diffDays} days`;
      } else {
        subLabel = `Past date (${Math.abs(diffDays)} days ago)`;
      }
    }

    if (this.selectedDaySubtitle) {
      this.selectedDaySubtitle.textContent = subLabel;
    }

    const tasks = (this.tasksByDate && this.tasksByDate[this.selectedDate]) || [];
    const pendingCount = tasks.filter(t => !t.completed).length;

    if (this.selectedDayCounter) {
      this.selectedDayCounter.textContent = `${tasks.length} task${tasks.length !== 1 ? "s" : ""} (${pendingCount} pending)`;
    }

    this.tasksContainer.innerHTML = "";

    if (tasks.length === 0) {
      this.tasksContainer.innerHTML = `
        <div class="schedule-empty-state">
          <div class="schedule-empty-icon">🗓️</div>
          <h4 class="schedule-empty-title">No tasks scheduled for this day</h4>
          <p class="schedule-empty-desc">Plan ahead with peace of mind. Add goals above, and they will automatically appear in your daily tasks when this day arrives!</p>
        </div>
      `;
      return;
    }

    // Sort tasks stably: pending before completed; pinned at top of pending; priority
    const rank = { high: 0, normal: 1, low: 2 };
    const sorted = [...tasks]
      .map((t, i) => ({ t, i }))
      .sort((a, b) => {
        const ac = a.t.completed ? 1 : 0;
        const bc = b.t.completed ? 1 : 0;
        if (ac !== bc) return ac - bc;

        const ap = a.t.pinned ? 0 : 1;
        const bp = b.t.pinned ? 0 : 1;
        if (ap !== bp) return ap - bp;

        const ar = rank[a.t.priority] ?? 1;
        const br = rank[b.t.priority] ?? 1;
        if (ar !== br) return ar - br;

        return a.i - b.i;
      })
      .map(x => x.t);

    sorted.forEach((task) => {
      const card = document.createElement("div");
      card.className = `task-item-card ${task.completed ? "completed" : ""} ${task.pinned ? "pinned" : ""}`;
      card.setAttribute("data-id", task.id);

      const priorityLabel = (task.priority || "normal").toUpperCase();

      card.innerHTML = `
        <div class="task-left-section">
          <button class="custom-checkbox-btn" title="${task.completed ? 'Mark pending' : 'Complete task'}">
            <svg class="checkmark-svg" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <div class="task-content-wrapper">
            <span class="task-text-body">${this.escapeHtml(task.text)}</span>
            <div class="task-tags-row">
              ${task.pinned ? '<span class="pinned-tag-pill" title="Pinned to top">📌 PINNED</span>' : ''}
              <span class="priority-tag ${task.priority || 'normal'}" role="button" tabindex="0" title="Click to cycle priority">${priorityLabel}</span>
              ${task.carriedOverFrom ? `<span class="diary-carried-pill" style="font-size: 10px; padding: 1px 7px;">🔄 Carried from ${task.carriedOverFrom}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="task-right-actions">
          <button class="btn-task-action pin ${task.pinned ? 'active' : ''}" title="${task.pinned ? 'Unpin task' : 'Pin task'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${task.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-2l-2-2V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 2v2z"></path>
            </svg>
          </button>
          ${this.selectedDate !== this.todayDate && !task.completed ? `
            <button class="btn-task-action move-today" title="Move task to Today's Goals">
              ☀️
            </button>
          ` : ''}
          <button class="btn-task-action edit" title="Edit Task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
          <button class="btn-task-action delete" title="Delete Task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Checkbox
      const checkBtn = card.querySelector(".custom-checkbox-btn");
      checkBtn.addEventListener("click", () => this.toggleTaskCompletion(task.id));

      // Priority cycling with mouse or keyboard
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

      // Pin toggle
      const pinBtn = card.querySelector(".btn-task-action.pin");
      if (pinBtn) {
        pinBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.togglePin(task.id);
        });
      }

      // Move to today listener
      const moveBtn = card.querySelector(".btn-task-action.move-today");
      if (moveBtn) {
        moveBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveToToday(task.id);
        });
      }

      // Inline edit
      const editBtn = card.querySelector(".btn-task-action.edit");
      const textSpan = card.querySelector(".task-text-body");
      if (editBtn) {
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.startInlineEdit(card, task);
        });
      }
      if (textSpan) {
        textSpan.addEventListener("dblclick", () => this.startInlineEdit(card, task));
      }

      // Delete
      const deleteBtn = card.querySelector(".btn-task-action.delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deleteTask(task.id);
        });
      }

      this.tasksContainer.appendChild(card);
    });
  }

  async moveToToday(taskId) {
    const list = this.tasksByDate[this.selectedDate] || [];
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const [task] = list.splice(idx, 1);

    if (!this.tasksByDate[this.todayDate]) this.tasksByDate[this.todayDate] = [];
    task.movedFrom = this.selectedDate;
    this.tasksByDate[this.todayDate].push(task);

    await window.subahAPI.updateTasks({ date: this.selectedDate, tasks: this.tasksByDate[this.selectedDate] });
    const res = await window.subahAPI.updateTasks({ date: this.todayDate, tasks: this.tasksByDate[this.todayDate] });

    if (window.subahChecklist) {
      window.subahChecklist.setData(this.todayDate, this.tasksByDate[this.todayDate], res && res.streak);
    }
    if (window.subahApp && typeof window.subahApp.onTasksUpdated === "function") {
      window.subahApp.onTasksUpdated(this.selectedDate, this.tasksByDate[this.selectedDate]);
      window.subahApp.onTasksUpdated(this.todayDate, this.tasksByDate[this.todayDate], res && res.streak);
    }
    if (window.SubahLiveShare) {
      window.SubahLiveShare.broadcastTasksUpdate();
    }

    window.subahAudio.playClick();
    this.renderCalendar();
    this.renderSelectedDayTasks();
    window.subahApp.showToast("Task moved to Today's Goals ☀️", "success");
  }

  async handleAddTask() {
    if (!this.addTaskInput) return;
    const text = this.addTaskInput.value.trim();
    if (!text) return;

    const priority = (this.prioritySelect && this.prioritySelect.value) || "normal";
    const isPinned = Boolean(this.pinCheckbox && this.pinCheckbox.checked);

    const newTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: text,
      completed: false,
      priority: priority,
      pinned: isPinned,
      createdAt: Date.now()
    };

    if (!this.tasksByDate[this.selectedDate]) {
      this.tasksByDate[this.selectedDate] = [];
    }

    this.tasksByDate[this.selectedDate].push(newTask);
    this.addTaskInput.value = "";
    if (this.pinCheckbox) this.pinCheckbox.checked = false;

    window.subahAudio.playClick();
    this.renderCalendar();
    this.renderSelectedDayTasks();
    await this.persistSelectedDay();

    const isToday = this.selectedDate === this.todayDate;
    window.subahApp.showToast(
      isToday ? "Task added to today's goals" : `Task scheduled for ${this.selectedDate}`
    );
  }

  async togglePin(taskId) {
    const dayTasks = this.tasksByDate[this.selectedDate] || [];
    const task = dayTasks.find(t => t.id === taskId);
    if (!task) return;

    task.pinned = !task.pinned;
    window.subahAudio.playClick();
    this.renderCalendar();
    this.renderSelectedDayTasks();
    await this.persistSelectedDay();
    window.subahApp.showToast(task.pinned ? "📌 Task pinned" : "Task unpinned");
  }

  async cyclePriority(taskId) {
    const dayTasks = this.tasksByDate[this.selectedDate] || [];
    const task = dayTasks.find(t => t.id === taskId);
    if (!task) return;

    const order = ["high", "normal", "low"];
    const current = order.includes(task.priority) ? task.priority : "normal";
    task.priority = order[(order.indexOf(current) + 1) % order.length];

    window.subahAudio.playClick();
    this.renderSelectedDayTasks();
    await this.persistSelectedDay();
    window.subahApp.showToast(`Priority set to ${task.priority.toUpperCase()}`);
  }

  async toggleTaskCompletion(taskId) {
    const dayTasks = this.tasksByDate[this.selectedDate] || [];
    const task = dayTasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = Date.now();
      task.rewardClaimed = true;

      if (window.subahAudio) window.subahAudio.playCelebration();

      // If completing on today, trigger confetti burst, reward modal, and live share
      if (this.selectedDate === this.todayDate) {
        if (window.subahConfetti) {
          window.subahConfetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 90);
        }
        if (window.subahRewards) {
          window.subahRewards.presentSurpriseReward(task);
        }
        if (window.SubahLiveShare) {
          window.SubahLiveShare.broadcastTasksUpdate({ completedTaskText: task.text });
        }
      }
    } else {
      delete task.completedAt;
      if (window.subahAudio) window.subahAudio.playClick();
      if (this.selectedDate === this.todayDate && window.SubahLiveShare) {
        window.SubahLiveShare.broadcastTasksUpdate();
      }
    }

    this.renderCalendar();
    this.renderSelectedDayTasks();
    await this.persistSelectedDay();
  }

  async deleteTask(taskId) {
    const dayTasks = this.tasksByDate[this.selectedDate] || [];
    this.tasksByDate[this.selectedDate] = dayTasks.filter(t => t.id !== taskId);

    window.subahAudio.playClick();
    this.renderCalendar();
    this.renderSelectedDayTasks();
    await this.persistSelectedDay();
    window.subahApp.showToast("Scheduled task removed");
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
          await this.persistSelectedDay();
          window.subahApp.showToast("Task updated");
        }
      }
      this.renderSelectedDayTasks();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishEdit(true);
      if (e.key === "Escape") finishEdit(false);
    });
    input.addEventListener("blur", () => finishEdit(true));
  }

  async persistSelectedDay() {
    const currentTasks = this.tasksByDate[this.selectedDate] || [];

    const res = await window.subahAPI.updateTasks({
      date: this.selectedDate,
      tasks: currentTasks
    });

    // Notify SubahApp coordinator
    if (window.subahApp && typeof window.subahApp.onTasksUpdated === "function") {
      window.subahApp.onTasksUpdated(this.selectedDate, currentTasks, res && res.streak);
    }

    // If the edited date is Today, also live-update the checklist tab
    if (this.selectedDate === this.todayDate && window.subahChecklist) {
      window.subahChecklist.setData(this.todayDate, currentTasks, res && res.streak);
    }
    if (this.selectedDate === this.todayDate && window.SubahLiveShare) {
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

window.subahSchedule = new SubahSchedule();
