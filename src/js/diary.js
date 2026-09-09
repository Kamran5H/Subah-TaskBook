// Life & Focus Diary Tab Module for Subah Task Book
// Provides a rich, interactive, chronological journal of all daily goals, exact completion timings, and lifetime statistics.

class SubahDiary {
  constructor() {
    this.tasksByDate = {};
    this.todayDate = "";
    this.streak = 1;
    this.currentFilter = "all"; // 'all' | 'completed' | 'pending'
    this.searchQuery = "";

    // DOM Elements
    this.timelineContainer = null;
    this.searchInput = null;
    this.filterButtons = [];
    this.statDaysEl = null;
    this.statTasksEl = null;
    this.statRateEl = null;
    this.statStreakEl = null;
  }

  init(tasksByDate = {}, todayDate = "", streak = 1) {
    this.tasksByDate = tasksByDate || {};
    this.todayDate = todayDate || this.getTodayDateString();
    this.streak = streak || 1;

    this.timelineContainer = document.getElementById("diary-timeline-container");
    this.searchInput = document.getElementById("diary-search-input");
    this.statDaysEl = document.getElementById("diary-stat-days");
    this.statTasksEl = document.getElementById("diary-stat-tasks");
    this.statRateEl = document.getElementById("diary-stat-rate");
    this.statStreakEl = document.getElementById("diary-stat-streak");

    // Search Input Listener
    if (this.searchInput) {
      this.searchInput.value = "";
      this.searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Filter Button Listeners
    this.filterButtons = document.querySelectorAll(".diary-filter-btn");
    this.filterButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.filterButtons.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.currentFilter = e.currentTarget.getAttribute("data-filter") || "all";
        this.render();
      });
    });

    this.render();
  }

  updateData(tasksByDate, todayDate, streak) {
    if (tasksByDate) this.tasksByDate = tasksByDate;
    if (todayDate) this.todayDate = todayDate;
    if (typeof streak === "number") this.streak = streak;
    this.render();
  }

  getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  formatTime(timestamp) {
    if (!timestamp) return "";
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (_) {
      return "";
    }
  }

  formatDateHeading(dateStr) {
    try {
      const [y, m, d] = dateStr.split("-").map(n => parseInt(n, 10));
      const dateObj = new Date(y, m - 1, d);
      const isToday = dateStr === this.todayDate;
      const isYesterday = this.isYesterday(dateStr);

      const prefix = isToday ? "Today" : (isYesterday ? "Yesterday" : "");
      const fullDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      return { prefix, fullDate, isToday, isYesterday };
    } catch (_) {
      return { prefix: "", fullDate: dateStr, isToday: false, isYesterday: false };
    }
  }

  isYesterday(dateStr) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const year = y.getFullYear();
    const month = String(y.getMonth() + 1).padStart(2, "0");
    const day = String(y.getDate()).padStart(2, "0");
    return dateStr === `${year}-${month}-${day}`;
  }

  getHijriDate(dateStr) {
    try {
      const [y, m, d] = dateStr.split("-").map(n => parseInt(n, 10));
      const dateObj = new Date(y, m - 1, d);
      const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      const formatted = formatter.format(dateObj).trim();
      return formatted.endsWith("AH") ? formatted : `${formatted} AH`;
    } catch (_) {
      return "";
    }
  }

  // Find if a task that was rolled over got completed on a downstream date
  buildCompletionIndex() {
    const completionByOriginId = new Map();
    const completionByNormText = new Map();

    const dates = Object.keys(this.tasksByDate || {}).sort();
    dates.forEach(d => {
      const list = this.tasksByDate[d] || [];
      list.forEach(t => {
        if (t.completed) {
          const info = {
            completedAt: t.completedAt,
            resolvedDate: d,
            taskId: t.id
          };
          if (t.originalTaskId) {
            completionByOriginId.set(t.originalTaskId, info);
          }
          completionByOriginId.set(t.id, info);
          const norm = (t.text || "").toLowerCase().trim();
          if (norm && !completionByNormText.has(norm)) {
            completionByNormText.set(norm, info);
          }
        }
      });
    });

    return { completionByOriginId, completionByNormText };
  }

  render() {
    this.updateStats();
    if (!this.timelineContainer) return;

    this.timelineContainer.innerHTML = "";

    const allDates = Object.keys(this.tasksByDate || {}).sort((a, b) => b.localeCompare(a));

    if (allDates.length === 0) {
      this.timelineContainer.innerHTML = `
        <div class="diary-empty-state">
          <div class="diary-empty-icon">📖</div>
          <h3 class="diary-empty-title">Your Diary is Waiting</h3>
          <p style="font-size: 13px;">Add goals in Today's Tasks or the Journal Planner to begin your daily record.</p>
        </div>
      `;
      return;
    }

    const { completionByOriginId, completionByNormText } = this.buildCompletionIndex();
    let renderedDaysCount = 0;

    allDates.forEach(dateStr => {
      const tasks = this.tasksByDate[dateStr] || [];
      if (!Array.isArray(tasks) || tasks.length === 0) return;

      const { prefix, fullDate, isToday, isYesterday } = this.formatDateHeading(dateStr);
      const hijri = this.getHijriDate(dateStr);

      // Filter tasks by status and search query
      const filteredTasks = tasks.filter(task => {
        const norm = (task.text || "").toLowerCase().trim();
        const origId = task.originalTaskId || task.id;
        const resolvedLater = !task.completed && (
          completionByOriginId.has(origId) ||
          (task.rolledTo && completionByNormText.has(norm))
        );

        // Status filter:
        // 'completed' matches directly completed tasks OR tasks resolved on a later date
        if (this.currentFilter === "completed" && !task.completed && !resolvedLater) return false;
        // 'pending' matches only tasks that are NOT completed AND NOT resolved later
        if (this.currentFilter === "pending" && (task.completed || resolvedLater)) return false;

        // Search query
        if (this.searchQuery) {
          const q = this.searchQuery;
          const matchText = norm.includes(q);
          const matchDate = dateStr.includes(q);
          const matchHeading = (fullDate || "").toLowerCase().includes(q);
          const matchRelative = (prefix || "").toLowerCase().includes(q);
          const matchHijri = (hijri || "").toLowerCase().includes(q);
          const matchPriority = (task.priority || "").toLowerCase().includes(q);
          if (!matchText && !matchDate && !matchHeading && !matchRelative && !matchHijri && !matchPriority) {
            return false;
          }
        }

        return true;
      });

      if (filteredTasks.length === 0) return;
      renderedDaysCount++;

      // Day metrics calculation
      const dayTotal = tasks.length;
      const dayCompletedDirect = tasks.filter(t => t.completed).length;
      const dayResolvedLater = tasks.filter(t => {
        if (t.completed) return false;
        const origId = t.originalTaskId || t.id;
        return completionByOriginId.has(origId) || (t.rolledTo && completionByNormText.has((t.text || "").toLowerCase().trim()));
      }).length;

      const totalResolved = dayCompletedDirect + dayResolvedLater;
      const dayPct = dayTotal === 0 ? 0 : Math.round((totalResolved / dayTotal) * 100);

      const dayCard = document.createElement("div");
      dayCard.className = "diary-day-card";
      dayCard.setAttribute("data-date", dateStr);

      // Header row
      let dateBadgeHtml = `<span class="diary-date-badge">${fullDate}</span>`;
      if (prefix) {
        dateBadgeHtml = `
          <span class="diary-today-tag ${isToday ? 'today' : 'yesterday'}">${prefix.toUpperCase()}</span>
          <span class="diary-date-badge">${fullDate}</span>
        `;
      }

      let progressBadgeText = `${dayCompletedDirect} of ${dayTotal} Completed (${dayPct}%)`;
      if (dayResolvedLater > 0 && totalResolved === dayTotal) {
        progressBadgeText = `All ${dayTotal} Tasks Resolved (100% ✓)`;
      } else if (dayResolvedLater > 0) {
        progressBadgeText = `${dayCompletedDirect} on Day • ${dayResolvedLater} Later (${dayPct}%)`;
      }

      dayCard.innerHTML = `
        <div class="diary-day-header">
          <div class="diary-date-group">
            ${dateBadgeHtml}
            ${hijri ? `<span class="diary-hijri-tag">🌙 ${hijri}</span>` : ""}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="diary-day-progress-badge ${dayPct === 100 ? 'complete' : 'partial'}">
              ${progressBadgeText}
            </div>
            <button class="diary-btn-copy-day" title="Copy day journal to clipboard" data-date="${dateStr}">
              📋 Copy
            </button>
          </div>
        </div>
        <div class="diary-tasks-list"></div>
        <div class="diary-day-actions">
          <div class="diary-inline-add-row" style="display: none;">
            <input type="text" class="diary-inline-add-input" placeholder="Add a new goal for this day (Press Enter)..." />
            <button class="diary-inline-add-submit">Add</button>
            <button class="diary-inline-add-cancel">Cancel</button>
          </div>
          <button class="diary-btn-open-add" data-date="${dateStr}">＋ Add Task to this Day</button>
        </div>
      `;

      // Copy Day Journal Handler
      const copyBtn = dayCard.querySelector(".diary-btn-copy-day");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => this.copyDayJournal(dateStr));
      }

      // Add Task Inline Handler
      const addRow = dayCard.querySelector(".diary-inline-add-row");
      const openAddBtn = dayCard.querySelector(".diary-btn-open-add");
      const addInput = dayCard.querySelector(".diary-inline-add-input");
      const addSubmit = dayCard.querySelector(".diary-inline-add-submit");
      const addCancel = dayCard.querySelector(".diary-inline-add-cancel");

      if (openAddBtn && addRow && addInput) {
        openAddBtn.addEventListener("click", () => {
          addRow.style.display = "flex";
          openAddBtn.style.display = "none";
          addInput.focus();
        });

        const commitAdd = async () => {
          const text = addInput.value.trim();
          if (text) {
            await this.addTaskToDate(dateStr, text);
          }
          addInput.value = "";
          addRow.style.display = "none";
          openAddBtn.style.display = "inline-flex";
        };

        if (addSubmit) addSubmit.addEventListener("click", commitAdd);
        if (addCancel) {
          addCancel.addEventListener("click", () => {
            addInput.value = "";
            addRow.style.display = "none";
            openAddBtn.style.display = "inline-flex";
          });
        }
        addInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") commitAdd();
          if (e.key === "Escape") {
            addInput.value = "";
            addRow.style.display = "none";
            openAddBtn.style.display = "inline-flex";
          }
        });
      }

      const listEl = dayCard.querySelector(".diary-tasks-list");

      filteredTasks.forEach(task => {
        const row = document.createElement("div");
        const norm = (task.text || "").toLowerCase().trim();
        const origId = task.originalTaskId || task.id;
        const resolvedInfo = !task.completed ? (
          completionByOriginId.get(origId) ||
          (task.rolledTo ? completionByNormText.get(norm) : null)
        ) : null;

        const isDirectComplete = Boolean(task.completed);
        const isResolvedLater = Boolean(resolvedInfo);
        const isFinished = isDirectComplete || isResolvedLater;

        row.className = `diary-task-row ${isFinished ? 'completed' : ''}`;
        row.setAttribute("data-task-id", task.id);

        const priorityLabel = (task.priority || "normal").toUpperCase();
        let timeBadgeHtml = "";

        if (isDirectComplete) {
          const timeText = task.completedAt ? this.formatTime(task.completedAt) : "Completed";
          timeBadgeHtml = `<span class="diary-time-pill" title="Exact completion timestamp">✓ ${timeText}</span>`;
        } else if (isResolvedLater) {
          const resTimeText = resolvedInfo.completedAt ? this.formatTime(resolvedInfo.completedAt) : "";
          timeBadgeHtml = `<span class="diary-time-pill later" title="Completed on ${resolvedInfo.resolvedDate}">✓ Done on ${resolvedInfo.resolvedDate} ${resTimeText ? `(${resTimeText})` : ''}</span>`;
        } else if (task.rolledTo) {
          timeBadgeHtml = `<span class="diary-carried-pill pending">Rolled to ${task.rolledTo} →</span>`;
        } else if (task.createdAt) {
          timeBadgeHtml = `<span class="diary-created-pill" title="Created time">Created ${this.formatTime(task.createdAt)}</span>`;
        }

        row.innerHTML = `
          <div class="diary-task-left">
            <button class="diary-checkbox-btn ${isFinished ? 'completed' : 'pending'}" title="${isFinished ? 'Mark pending' : 'Click to complete goal'}">
              <svg class="diary-checkmark-svg" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <div class="diary-task-info-wrap">
              <span class="diary-task-text" title="Double click to edit">${this.escapeHtml(task.text)}</span>
              <div class="diary-tags-row">
                <span class="priority-tag ${task.priority || 'normal'}">${priorityLabel}</span>
                ${task.carriedOverFrom ? `<span class="diary-carried-pill">🔄 Carried from ${task.carriedOverFrom}</span>` : ''}
                ${isResolvedLater ? `<span class="diary-carried-pill success">✓ Finished on ${resolvedInfo.resolvedDate}</span>` : ''}
                ${task.rewardClaimed ? '<span class="reward-claimed-pill">🎁 Reward Unlocked</span>' : ''}
              </div>
            </div>
          </div>
          <div class="diary-task-right">
            ${timeBadgeHtml}
            <div class="diary-row-actions">
              <button class="diary-action-btn edit" title="Edit goal text">✎</button>
              <button class="diary-action-btn delete" title="Delete goal from diary">✕</button>
            </div>
          </div>
        `;

        // Interactive Checkbox Toggle
        const checkBtn = row.querySelector(".diary-checkbox-btn");
        if (checkBtn) {
          checkBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleTask(dateStr, task.id);
          });
        }

        // Inline Text Double Click to Edit
        const textSpan = row.querySelector(".diary-task-text");
        if (textSpan) {
          textSpan.addEventListener("dblclick", () => this.startInlineEdit(row, dateStr, task));
        }

        // Action Buttons: Edit & Delete
        const editBtn = row.querySelector(".diary-action-btn.edit");
        if (editBtn) {
          editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.startInlineEdit(row, dateStr, task);
          });
        }

        const delBtn = row.querySelector(".diary-action-btn.delete");
        if (delBtn) {
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.deleteTask(dateStr, task.id);
          });
        }

        listEl.appendChild(row);
      });

      this.timelineContainer.appendChild(dayCard);
    });

    if (renderedDaysCount === 0) {
      this.timelineContainer.innerHTML = `
        <div class="diary-empty-state">
          <div class="diary-empty-icon">🔍</div>
          <h3 class="diary-empty-title">No matching diary entries</h3>
          <p style="font-size: 13px; margin-bottom: 12px;">No goals found matching "${this.escapeHtml(this.searchQuery)}" or current filter.</p>
          <button id="btn-clear-diary-search" class="btn-primary-subtle" style="margin: 0 auto;">
            Reset Search & Filters
          </button>
        </div>
      `;

      const resetBtn = document.getElementById("btn-clear-diary-search");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (this.searchInput) this.searchInput.value = "";
          this.searchQuery = "";
          this.currentFilter = "all";
          this.filterButtons.forEach(b => b.classList.toggle("active", b.getAttribute("data-filter") === "all"));
          this.render();
        });
      }
    }
  }

  // Toggle goal completion directly from the Diary
  async toggleTask(dateStr, taskId) {
    const list = this.tasksByDate[dateStr];
    if (!Array.isArray(list)) return;
    const task = list.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
      task.completedAt = Date.now();
      task.rewardClaimed = true;
      if (window.subahAudio) window.subahAudio.playCelebration();
      if (dateStr === this.todayDate && window.subahConfetti) {
        window.subahConfetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 80);
      }
    } else {
      delete task.completedAt;
      if (window.subahAudio) window.subahAudio.playClick();
    }

    await this.persistDateTasks(dateStr, list);

    // If today was updated, sync checklist
    if (dateStr === this.todayDate && window.subahChecklist) {
      window.subahChecklist.setData(this.todayDate, list, this.streak);
    }

    if (window.subahApp) {
      window.subahApp.showToast(task.completed ? "✓ Goal marked completed in Diary" : "Goal marked pending in Diary");
    }

    this.render();
  }

  // Edit goal inline from the Diary
  startInlineEdit(row, dateStr, task) {
    const infoWrap = row.querySelector(".diary-task-info-wrap");
    if (!infoWrap) return;

    const originalText = task.text;
    infoWrap.innerHTML = `
      <input type="text" class="diary-inline-edit-input" value="${this.escapeHtml(originalText)}" />
    `;

    const input = infoWrap.querySelector("input");
    input.focus();
    input.select();

    let finished = false;
    const finish = async (save) => {
      if (finished) return;
      finished = true;
      if (save) {
        const val = input.value.trim();
        if (val && val !== originalText) {
          task.text = val;
          await this.persistDateTasks(dateStr, this.tasksByDate[dateStr]);
          if (dateStr === this.todayDate && window.subahChecklist) {
            window.subahChecklist.setData(this.todayDate, this.tasksByDate[dateStr], this.streak);
          }
          if (window.subahApp) window.subahApp.showToast("Goal updated in Diary");
        }
      }
      this.render();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
  }

  // Delete goal from the Diary
  async deleteTask(dateStr, taskId) {
    if (!this.tasksByDate[dateStr]) return;
    this.tasksByDate[dateStr] = this.tasksByDate[dateStr].filter(t => t.id !== taskId);

    await this.persistDateTasks(dateStr, this.tasksByDate[dateStr]);

    if (dateStr === this.todayDate && window.subahChecklist) {
      window.subahChecklist.setData(this.todayDate, this.tasksByDate[dateStr], this.streak);
    }

    if (window.subahAudio) window.subahAudio.playClick();
    if (window.subahApp) window.subahApp.showToast("Goal deleted from Diary");
    this.render();
  }

  // Add goal directly to any date
  async addTaskToDate(dateStr, text) {
    if (!this.tasksByDate[dateStr]) this.tasksByDate[dateStr] = [];

    const newTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: text.trim(),
      completed: false,
      priority: "normal",
      createdAt: Date.now()
    };

    this.tasksByDate[dateStr].push(newTask);
    await this.persistDateTasks(dateStr, this.tasksByDate[dateStr]);

    if (dateStr === this.todayDate && window.subahChecklist) {
      window.subahChecklist.setData(this.todayDate, this.tasksByDate[dateStr], this.streak);
    }

    if (window.subahAudio) window.subahAudio.playClick();
    if (window.subahApp) window.subahApp.showToast(`Goal added to ${dateStr}`);
    this.render();
  }

  // Copy clean markdown journal for a given day
  async copyDayJournal(dateStr) {
    const list = this.tasksByDate[dateStr] || [];
    const { fullDate } = this.formatDateHeading(dateStr);
    const hijri = this.getHijriDate(dateStr);

    let md = `### 📖 Subah Diary — ${fullDate}${hijri ? ` (${hijri})` : ''}\n\n`;
    list.forEach(t => {
      const check = t.completed ? "[x]" : "[ ]";
      const timeStr = t.completedAt ? ` (✓ ${this.formatTime(t.completedAt)})` : "";
      const carryStr = t.carriedOverFrom ? ` [Carried from ${t.carriedOverFrom}]` : "";
      md += `- ${check} ${t.text}${timeStr}${carryStr}\n`;
    });

    try {
      await navigator.clipboard.writeText(md);
      if (window.subahApp) {
        window.subahApp.showToast(`📋 Journal for ${fullDate} copied to clipboard!`);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  }

  // Persist day tasks to disk atomically
  async persistDateTasks(dateStr, tasks) {
    try {
      if (window.subahAPI && window.subahAPI.updateTasks) {
        const res = await window.subahAPI.updateTasks({
          date: dateStr,
          tasks: tasks
        });
        if (res && res.success && typeof res.streak === "number") {
          this.streak = res.streak;
        }
      }
    } catch (e) {
      console.error("Failed to persist date tasks from diary:", e);
    }
  }

  updateStats() {
    const dates = Object.keys(this.tasksByDate || {});
    const uniqueOriginIds = new Set();
    const uniqueTaskTexts = new Set();
    let totalCompleted = 0;
    let activeDays = 0;

    dates.forEach(d => {
      const tasks = this.tasksByDate[d];
      if (Array.isArray(tasks) && tasks.length > 0) {
        activeDays++;
        tasks.forEach(t => {
          const origKey = t.originalTaskId || t.id;
          const textKey = (t.text || "").toLowerCase().trim();
          uniqueOriginIds.add(origKey);
          if (textKey) uniqueTaskTexts.add(textKey);

          if (t.completed) {
            totalCompleted++;
          }
        });
      }
    });

    const uniqueTotal = Math.max(totalCompleted, uniqueOriginIds.size);
    const ratePct = uniqueTotal === 0 ? 0 : Math.min(100, Math.round((totalCompleted / uniqueTotal) * 100));

    if (this.statDaysEl) this.statDaysEl.textContent = `${activeDays} Day${activeDays !== 1 ? 's' : ''}`;
    if (this.statTasksEl) this.statTasksEl.textContent = `${totalCompleted} Done`;
    if (this.statRateEl) this.statRateEl.textContent = `${ratePct}%`;
    if (this.statStreakEl) this.statStreakEl.textContent = `${this.streak} Day${this.streak !== 1 ? 's' : ''}`;
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

window.subahDiary = new SubahDiary();
