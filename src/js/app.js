// Master Application Coordinator for Subah Task Book

class SubahApp {
  constructor() {
    this.appData = null;
    this.todayDate = "";
    this.toastContainer = null;
    this.currentTab = "checklist";
  }

  get state() {
    return this.appData;
  }

  async init() {
    this.toastContainer = document.getElementById("toast-container");
    if (window.subahAPI && typeof window.subahAPI.onOperationError === "function") {
      window.subahAPI.onOperationError((message) => this.showToast(message, "error", 5000));
    }

    // Titlebar Window Controls
    const btnMin = document.getElementById("btn-win-min");
    const btnMax = document.getElementById("btn-win-max");
    const btnClose = document.getElementById("btn-win-close");

    if (btnMin) btnMin.addEventListener("click", () => window.subahAPI.windowMinimize());
    if (btnMax) btnMax.addEventListener("click", () => window.subahAPI.windowMaximize());
    if (btnClose) btnClose.addEventListener("click", () => window.subahAPI.windowClose());

    // Navigation Tabs Listeners
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.currentTarget.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Listen for tab navigation from tray context menu
    if (window.subahAPI && window.subahAPI.onNavigateTab) {
      window.subahAPI.onNavigateTab((tab) => {
        this.switchTab(tab);
      });
    }

    // Fetch App State from Electron Main Process
    this.appData = await window.subahAPI.getAppState();
    this.todayDate = this.appData.todayDate;

    // Apply Saved Theme
    const savedTheme = (this.appData.settings && this.appData.settings.theme) || "midnight-aurora";
    document.body.setAttribute("data-theme", savedTheme);

    // Apply Sound Settings
    if (this.appData.settings && typeof this.appData.settings.soundEnabled === "boolean") {
      window.subahAudio.setEnabled(this.appData.settings.soundEnabled);
    }

    // Format & Render Today's Dates
    this.renderDates();

    // Render Daily Inspiration Quote
    this.renderInspirationQuote();

    // Initialize Sub-modules
    window.subahChecklist.init();
    if (window.subahSchedule) {
      window.subahSchedule.init(this.appData.tasksByDate || {}, this.todayDate);
    }
    window.subahRewards.init(this.appData.customRewards || []);
    if (window.subahDiary) {
      window.subahDiary.init(this.appData.tasksByDate || {}, this.todayDate, this.appData.streak || 1, this.appData.reflectionsByDate || {});
    }
    window.subahSettings.init(this.appData.settings, this.appData.customRewards || []);

    // Load tasks into checklist
    const todayTasks = (this.appData.tasksByDate && this.appData.tasksByDate[this.todayDate]) || [];
    window.subahChecklist.setData(this.todayDate, todayTasks, this.appData.streak || 1);

    // Double click titlebar to maximize / restore. The drag region itself is
    // handled natively by Windows; this covers the non-drag gaps in the bar.
    const titlebar = document.querySelector(".titlebar");
    if (titlebar) {
      titlebar.addEventListener("dblclick", (e) => {
        if (!e.target.closest("button, input, a, nav, .titlebar-controls")) {
          window.subahAPI.windowMaximize();
        }
      });
    }

    this.initWindowDragging();
    this.initZoomControls();
    this.initIdleAnimationPause();

    // Monitor midnight rollover on focus and interval
    window.addEventListener("focus", () => this.checkDateRollover());
    setInterval(() => this.checkDateRollover(), 60000);

    // Default to Today's Tasks
    this.switchTab("checklist");

    if (window.subahAudio && typeof window.subahAudio.prewarm === "function") {
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
      idle(() => window.subahAudio.prewarm(), { timeout: 3000 });
    }
  }

  onTasksUpdated(date, tasks, streak) {
    if (!this.appData) return;
    if (!this.appData.tasksByDate) this.appData.tasksByDate = {};
    this.appData.tasksByDate[date] = tasks;
    if (typeof streak === "number") this.appData.streak = streak;

    if (window.subahDiary) {
      window.subahDiary.updateData(this.appData.tasksByDate, this.todayDate, this.appData.streak || 1, this.appData.reflectionsByDate || {});
    }
    if (window.subahSchedule) {
      window.subahSchedule.updateData(this.appData.tasksByDate, this.todayDate);
    }
    if (date === this.todayDate && window.subahChecklist && window.subahChecklist.tasks !== tasks) {
      window.subahChecklist.setData(this.todayDate, tasks, this.appData.streak || 1);
    }
  }

  async reloadAppState() {
    this.appData = await window.subahAPI.getAppState();
    this.todayDate = this.appData.todayDate;
    const savedTheme = (this.appData.settings && this.appData.settings.theme) || "midnight-aurora";
    document.body.setAttribute("data-theme", savedTheme);
    if (this.appData.settings && typeof this.appData.settings.soundEnabled === "boolean") {
      window.subahAudio.setEnabled(this.appData.settings.soundEnabled);
    }
    this.renderDates();
    this.renderInspirationQuote();

    const todayTasks = (this.appData.tasksByDate && this.appData.tasksByDate[this.todayDate]) || [];
    window.subahChecklist.setData(this.todayDate, todayTasks, this.appData.streak || 1);

    if (window.subahSchedule) {
      window.subahSchedule.updateData(this.appData.tasksByDate || {}, this.todayDate);
    }
    if (window.subahRewards) {
      // updateCustomRewards, not init(): init binds DOM listeners and must run once.
      window.subahRewards.updateCustomRewards(this.appData.customRewards || []);
    }
    if (window.subahDiary) {
      window.subahDiary.updateData(this.appData.tasksByDate || {}, this.todayDate, this.appData.streak || 1, this.appData.reflectionsByDate || {});
    }
    if (window.subahSettings) {
      window.subahSettings.init(this.appData.settings, this.appData.customRewards || []);
    }
  }

  async checkDateRollover() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const nowStr = `${year}-${month}-${day}`;

    if (nowStr !== this.todayDate) {
      this.todayDate = nowStr;
      this.appData = await window.subahAPI.getAppState();
      this.renderDates();
      this.renderInspirationQuote();

      const todayTasks = (this.appData.tasksByDate && this.appData.tasksByDate[this.todayDate]) || [];
      window.subahChecklist.setData(this.todayDate, todayTasks, this.appData.streak || 1);

      if (window.subahDiary) {
        window.subahDiary.updateData(this.appData.tasksByDate, this.todayDate, this.appData.streak || 1, this.appData.reflectionsByDate || {});
      }
      if (window.subahSchedule) {
        window.subahSchedule.updateData(this.appData.tasksByDate, this.todayDate);
      }
    }
  }

  // Press and drag on any empty area (tab background, page headers, footer) to
  // move the window; double-click the same areas to maximize / restore.
  // Interactive elements and text inside cards are never drag handles.
  isWindowDragSurface(target) {
    if (!target || target.nodeType !== 1) return false;
    if (target === document.body || target === document.documentElement) return true;
    if (target.closest("button, input, textarea, select, a, label, iframe, [contenteditable], .modal-overlay, .titlebar")) {
      return false;
    }
    return target.matches(
      ".app-container, .tab-screen, [data-window-drag], " +
      ".checklist-top-bar, .date-streak-group, .daily-date-heading, .hijri-date-text, " +
      ".schedule-wrapper, .schedule-grid-container, " +
      ".rewards-lib-header, .rewards-lib-header > div, .rewards-lib-title, .rewards-lib-subtitle, " +
      ".diary-header, .diary-title-col, .diary-main-title, .diary-main-sub, " +
      ".live-share-container, .live-share-top-bar, " +
      ".settings-screen-body, .settings-header, .settings-main-title, .settings-main-sub, " +
      ".dev-signature-line"
    );
  }

  initWindowDragging() {
    if (!window.subahAPI || !window.subahAPI.windowDragStart) return;
    const THRESHOLD = 4; // px of movement before a press becomes a drag (keeps clicks as clicks)
    let pending = null;
    let dragging = false;

    const endDrag = () => {
      if (dragging) {
        window.subahAPI.windowDragEnd();
        document.body.classList.remove("window-dragging");
      }
      if (pending && pending.el && pending.el.hasPointerCapture && pending.el.hasPointerCapture(pending.pointerId)) {
        try { pending.el.releasePointerCapture(pending.pointerId); } catch (_) {}
      }
      pending = null;
      dragging = false;
    };

    document.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.pointerType === "touch" || e.detail > 1) return;
      if (!this.isWindowDragSurface(e.target)) return;
      // A press on a scrollbar targets the scrolling element itself; let it scroll.
      if (e.offsetX >= e.target.clientWidth || e.offsetY >= e.target.clientHeight) return;
      pending ={ x: e.screenX, y: e.screenY, pointerId: e.pointerId, el: e.target };
    });

    document.addEventListener("pointermove", (e) => {
      if (!pending || dragging) return;
      if (Math.abs(e.screenX - pending.x) < THRESHOLD && Math.abs(e.screenY - pending.y) < THRESHOLD) return;
      dragging = true;
      try { pending.el.setPointerCapture(pending.pointerId); } catch (_) {}
      const sel = window.getSelection && window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
      document.body.classList.add("window-dragging");
      window.subahAPI.windowDragStart();
    });

    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);

    document.addEventListener("dblclick", (e) => {
      if (e.button === 0 && this.isWindowDragSurface(e.target)) {
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
        window.subahAPI.windowMaximize();
      }
    });
  }

  initZoomControls() {
    const api = window.subahAPI;
    if (!api || !api.zoomIn) return;
    const btnIn = document.getElementById("btn-zoom-in");
    const btnOut = document.getElementById("btn-zoom-out");
    const btnReset = document.getElementById("btn-zoom-reset");
    const indicator = document.getElementById("zoom-indicator");
    let hideTimer = null;

    if (btnIn) btnIn.addEventListener("click", () => api.zoomIn());
    if (btnOut) btnOut.addEventListener("click", () => api.zoomOut());
    if (btnReset) btnReset.addEventListener("click", () => api.zoomReset());

    const render = ({ percent, announce }) => {
      if (btnReset) btnReset.textContent = `${percent}%`;
      if (!announce || !indicator) return;
      indicator.textContent = `Zoom ${percent}%`;
      indicator.classList.add("visible");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => indicator.classList.remove("visible"), 900);
    };

    if (api.onZoomChanged) api.onZoomChanged(render);
    if (api.getZoom) {
      api.getZoom().then((z) => z && render({ percent: z.percent, announce: false })).catch(() => {});
    }
  }

  // Decorative CSS animations keep the GPU busy even when nobody is looking.
  // Freeze them while the window is hidden, minimised or in the background.
  initIdleAnimationPause() {
    const update = () => {
      const idle = document.hidden || !document.hasFocus();
      document.body.classList.toggle("app-idle", idle);
    };
    document.addEventListener("visibilitychange", update);
    window.addEventListener("blur", update);
    window.addEventListener("focus", update);
    update();
  }

  getEnabledCategories() {
    return (this.appData && this.appData.settings && this.appData.settings.enabledCategories) || null;
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update Nav Buttons
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });

    // Update Tab Screens
    document.querySelectorAll(".tab-screen").forEach(screen => {
      screen.classList.remove("active");
    });

    const targetScreen = document.getElementById(`tab-${tabName}`);
    if (targetScreen) {
      targetScreen.classList.add("active");
    }

    // Refresh schedule when switching to schedule tab
    if (tabName === "schedule" && window.subahSchedule) {
      window.subahSchedule.onOpen();
    }

    // Refresh diary when switching to diary tab
    // (only rebuilds the timeline if something changed while it was hidden)
    if (tabName === "diary" && window.subahDiary) {
      const diary = window.subahDiary;
      if (diary.tasksByDate !== this.appData.tasksByDate || diary.todayDate !== this.todayDate) {
        diary.needsRender = true;
      }
      if (typeof diary.onOpen === "function") {
        diary.tasksByDate = this.appData.tasksByDate || diary.tasksByDate;
        diary.todayDate = this.todayDate;
        if (typeof this.appData.streak === "number") diary.streak = this.appData.streak;
        diary.onOpen();
      } else {
        diary.updateData(this.appData.tasksByDate, this.todayDate, this.appData.streak || 1, this.appData.reflectionsByDate || {});
      }
    }

    // Refresh live share when switching to live-share tab
    if (tabName === "live-share" && window.SubahLiveShare) {
      window.SubahLiveShare.renderMyTasksPreview();
    }
  }

  renderDates() {
    const d = new Date();
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const dateFormatted = d.toLocaleDateString("en-US", options);

    const checkDateEl = document.getElementById("checklist-current-date");
    if (checkDateEl) checkDateEl.textContent = dateFormatted;

    const hijriText = this.getHijriDateString(d);
    const hijriEl = document.getElementById("checklist-hijri-date");
    if (hijriEl) hijriEl.innerHTML = `<span>🌙 ${hijriText}</span>`;
  }

  getHijriDateString(date) {
    try {
      const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      const formatted = formatter.format(date).trim();
      const cleanHijri = formatted.endsWith("AH") ? formatted : `${formatted} AH`;
      return `${cleanHijri} • Subah Bakhair`;
    } catch (e) {
      return "Subah Bakhair • Blessed Morning";
    }
  }

  renderInspirationQuote() {
    const quotes = [
      "The secret of getting ahead is getting started with sincere intentions and presence.",
      "Begin every task in tranquility. Barakah flows where hurry ceases.",
      "Small daily disciplines repeated consistently create monumental victories.",
      "Work with your hands, keep peace in your heart, and trust divine timing.",
      "Patience is not passive waiting; it is the grace with which you plant your seeds."
    ];
    const el = document.getElementById("daily-inspiration-text");
    if (el) {
      const dayIndex = new Date().getDate() % quotes.length;
      el.textContent = `"${quotes[dayIndex]}"`;
    }
  }

  showToast(message, typeOrDuration = 3000, maybeDuration = 3000) {
    if (!this.toastContainer) return;

    let toastType = "info";
    let duration = 3000;

    if (typeof typeOrDuration === "number") {
      duration = typeOrDuration;
    } else if (typeof typeOrDuration === "string") {
      toastType = typeOrDuration;
      if (typeof maybeDuration === "number") {
        duration = maybeDuration;
      }
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${toastType}`;
    // textContent, not innerHTML: toast messages can interpolate task text / dates,
    // so never let them be parsed as markup.
    const span = document.createElement("span");
    span.textContent = message;
    toast.appendChild(span);

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

window.subahApp = new SubahApp();
document.addEventListener("DOMContentLoaded", () => {
  window.subahApp.init();
});
