// Master Application Coordinator for Subah Task Book

class SubahApp {
  constructor() {
    this.appData = null;
    this.todayDate = "";
    this.toastContainer = null;
    this.currentTab = "checklist";
  }

  async init() {
    this.toastContainer = document.getElementById("toast-container");

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
    window.subahPlanner.init();
    window.subahRewards.init(this.appData.customRewards || []);
    if (window.subahDiary) {
      window.subahDiary.init(this.appData.tasksByDate || {}, this.todayDate, this.appData.streak || 1);
    }
    window.subahSettings.init(this.appData.settings, this.appData.customRewards || []);

    // Load tasks into checklist
    const todayTasks = (this.appData.tasksByDate && this.appData.tasksByDate[this.todayDate]) || [];
    window.subahChecklist.setData(this.todayDate, todayTasks, this.appData.streak || 1);

    // Double click titlebar to maximize / restore
    const titlebar = document.querySelector(".titlebar");
    if (titlebar) {
      titlebar.addEventListener("dblclick", (e) => {
        if (!e.target.closest("button, input, a, nav")) {
          window.subahAPI.windowMaximize();
        }
      });
    }

    // Monitor midnight rollover on focus and interval
    window.addEventListener("focus", () => this.checkDateRollover());
    setInterval(() => this.checkDateRollover(), 60000);

    // If today has 0 tasks, open the planner tab with a welcoming gentle chime
    if (todayTasks.length === 0) {
      this.switchTab("planner");
      setTimeout(() => {
        window.subahAudio.playChime();
      }, 350);
    } else {
      this.switchTab("checklist");
    }
  }

  onTasksUpdated(date, tasks, streak) {
    if (!this.appData) return;
    if (!this.appData.tasksByDate) this.appData.tasksByDate = {};
    this.appData.tasksByDate[date] = tasks;
    if (typeof streak === "number") this.appData.streak = streak;

    if (window.subahDiary) {
      window.subahDiary.updateData(this.appData.tasksByDate, this.todayDate, this.appData.streak || 1);
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
        window.subahDiary.updateData(this.appData.tasksByDate, this.todayDate, this.appData.streak || 1);
      }

      if (todayTasks.length === 0) {
        this.switchTab("planner");
      }
    }
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

    // Auto-focus if switching to planner
    if (tabName === "planner") {
      const textarea = document.getElementById("planner-textarea");
      if (textarea) setTimeout(() => textarea.focus(), 150);
    }

    // Refresh diary when switching to diary tab
    if (tabName === "diary" && window.subahDiary) {
      window.subahDiary.updateData(this.appData.tasksByDate, this.todayDate, this.appData.streak);
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

  showToast(message, duration = 3000) {
    if (!this.toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${message}</span>`;

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
