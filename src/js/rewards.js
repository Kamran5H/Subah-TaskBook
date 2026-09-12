// Surprise Reward Engine & In-App Cinema Player
// Handles mystery gift unboxing, YouTube video/audio embeds, readings, and 5-10 min break timers.

class SubahRewards {
  constructor() {
    this.rewards = [];
    this.currentReward = null;
    this.timerSeconds = 7 * 60;
    this.timerInterval = null;
    this.timerRunning = false;
    this.selectedMinutes = 7;
    this.lastRewardId = null;
    this.unboxTimeout = null;

    // DOM Elements
    this.modal = null;
    this.unboxingStage = null;
    this.rewardStage = null;
    this.categoryBadge = null;
    this.titleText = null;
    this.artistText = null;
    this.playerContainer = null;
    this.readingContainer = null;
    this.timerClock = null;
    this.timerToggleBtn = null;
  }

  init(customRewards = []) {
    // Merge default rewards with custom user rewards
    const defaults = typeof DEFAULT_REWARDS !== "undefined" ? DEFAULT_REWARDS : [];
    this.rewards = [...defaults, ...(customRewards || [])];

    this.modal = document.getElementById("reward-modal");
    this.unboxingStage = document.getElementById("unboxing-stage");
    this.rewardStage = document.getElementById("reward-stage");
    this.categoryBadge = document.getElementById("reward-category-badge");
    this.titleText = document.getElementById("reward-title-text");
    this.artistText = document.getElementById("reward-artist-text");
    this.playerContainer = document.getElementById("cinema-player-box");
    this.readingContainer = document.getElementById("reading-content-box");
    this.timerClock = document.getElementById("timer-clock-badge");

    // Modal Close button
    const closeBtn = document.getElementById("btn-close-reward-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    // Back to Work button
    const backBtn = document.getElementById("btn-back-to-work");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.closeModal());
    }

    // Open External in Browser button
    const externalBtn = document.getElementById("btn-open-in-browser");
    if (externalBtn) {
      externalBtn.addEventListener("click", () => {
        if (this.currentReward && (this.currentReward.externalUrl || this.currentReward.searchUrl)) {
          window.subahAPI.openExternal(this.currentReward.externalUrl || this.currentReward.searchUrl);
          window.subahApp.showToast("Opening reward in your default browser...");
        }
      });
    }

    // Timer duration buttons (5m, 7m, 10m)
    document.querySelectorAll(".timer-dur-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".timer-dur-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const mins = parseInt(e.currentTarget.getAttribute("data-mins"), 10) || 7;
        this.setTimerMinutes(mins);
      });
    });

    // Timer Play/Pause button
    this.timerToggleBtn = document.getElementById("btn-timer-toggle");
    if (this.timerToggleBtn) {
      this.timerToggleBtn.addEventListener("click", () => this.toggleTimer());
    }

    // Mystery Box click for instant reveal
    const giftBox = document.getElementById("mystery-gift-box-el");
    if (giftBox) {
      giftBox.addEventListener("click", () => this.revealReward());
    }

    // Surprise Me Now button in Rewards tab
    const btnSurpriseNow = document.getElementById("btn-open-random-reward");
    if (btnSurpriseNow) {
      btnSurpriseNow.addEventListener("click", () => {
        window.subahAudio.playCelebration();
        window.subahConfetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 90);
        this.presentSurpriseReward(null);
      });
    }

    // Filter buttons in Rewards tab
    document.querySelectorAll(".filter-pill-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-pill-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const cat = e.currentTarget.getAttribute("data-category");
        this.renderLibraryGrid(cat);
      });
    });

    // Show the real library size on the "All" pill so it can never drift from the data.
    const allPill = document.querySelector('.filter-pill-btn[data-category="all"]');
    if (allPill) allPill.textContent = `All (${this.rewards.length})`;

    this.renderLibraryGrid("all");
  }

  renderLibraryGrid(category = "all") {
    const grid = document.getElementById("rewards-library-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const items = category === "all"
      ? this.rewards
      : this.rewards.filter(r => r.category === category);

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "reward-card-item";
      card.innerHTML = `
        <div class="reward-card-top">
          <span class="card-category-badge">${this.escapeHtml(item.categoryLabel || item.category.toUpperCase())}</span>
          <span class="card-duration-badge">⏱️ ${this.escapeHtml(item.duration || "5m")}</span>
        </div>
        <div>
          <h3 class="card-title-text">${this.escapeHtml(item.title)}</h3>
          <p class="card-desc-text">${this.escapeHtml(item.description || item.artist || item.author || "")}</p>
        </div>
        <div class="card-play-row">
          <span class="btn-play-card">
            ▶ Play / Open
          </span>
          <span style="font-size: 11px; color: var(--text-muted);">${this.escapeHtml(item.artist || item.author || "")}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        this.currentReward = item;
        if (this.modal) this.modal.classList.add("active");
        if (this.unboxingStage) this.unboxingStage.style.display = "none";
        if (this.rewardStage) this.rewardStage.classList.add("active");
        this.populateRewardData(item);
        this.startTimer();
      });

      grid.appendChild(card);
    });
  }

  updateCustomRewards(customRewards = []) {
    const defaults = typeof DEFAULT_REWARDS !== "undefined" ? DEFAULT_REWARDS : [];
    this.rewards = [...defaults, ...customRewards];
  }

  getRandomReward() {
    if (this.rewards.length === 0) return null;

    // Check offline status: if disconnected from internet, prioritize readings/mashwara cards
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    // Filter by enabled categories if available
    const enabledCats = (window.subahApp && typeof window.subahApp.getEnabledCategories === "function")
      ? window.subahApp.getEnabledCategories()
      : null;
    let pool = this.rewards;

    // Honour the user's enabled categories first...
    if (enabledCats && enabledCats.length > 0) {
      const catPool = this.rewards.filter(r => enabledCats.includes(r.category));
      if (catPool.length > 0) pool = catPool;
    }

    // ...then, if offline, narrow to items that need no network (content cards).
    // Combining both filters means an offline user still respects their category
    // choices where possible instead of one filter silently overriding the other.
    if (isOffline) {
      const offlinePool = pool.filter(r => r.content);
      if (offlinePool.length > 0) pool = offlinePool;
    }

    // Avoid repeating the exact same reward consecutively if possible
    let candidates = pool.filter(r => r.id !== this.lastRewardId);
    if (candidates.length === 0) candidates = pool;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastRewardId = chosen.id;
    return chosen;
  }

  presentSurpriseReward(task, isReplay = false) {
    const reward = this.getRandomReward();
    if (!reward) return;

    this.currentReward = reward;

    // Show modal in unboxing state
    if (this.modal) {
      this.modal.classList.add("active");
    }

    if (this.unboxingStage) {
      this.unboxingStage.style.display = isReplay ? "none" : "flex";
    }
    if (this.rewardStage) {
      this.rewardStage.classList.toggle("active", isReplay);
    }

    if (isReplay) {
      this.populateRewardData(reward);
      this.startTimer();
    } else {
      // Auto unbox after 1.4 seconds of suspense. Track the handle so closing the
      // modal mid-suspense cancels it — otherwise it fired later on a hidden modal,
      // playing a phantom chime and silently starting a break timer.
      if (this.unboxTimeout) clearTimeout(this.unboxTimeout);
      this.unboxTimeout = setTimeout(() => {
        this.unboxTimeout = null;
        this.revealReward();
      }, 1400);
    }
  }

  revealReward() {
    if (!this.currentReward) return;
    // Guard: never reveal into a closed modal (e.g. a stale unbox timer that raced
    // the close button).
    if (this.modal && !this.modal.classList.contains("active")) return;
    if (this.unboxingStage) this.unboxingStage.style.display = "none";
    if (this.rewardStage) this.rewardStage.classList.add("active");

    window.subahAudio.playChime();
    this.populateRewardData(this.currentReward);
    this.startTimer();
  }

  populateRewardData(reward) {
    if (this.categoryBadge) {
      this.categoryBadge.textContent = reward.categoryLabel || reward.category.toUpperCase();
    }
    if (this.titleText) {
      this.titleText.textContent = reward.title;
    }
    if (this.artistText) {
      this.artistText.textContent = reward.artist || reward.author || "";
    }

    // Render Player or Reading
    if (reward.youtubeId) {
      if (this.playerContainer) {
        this.playerContainer.style.display = "block";
        this.renderYouTubePlayer(reward);
      }
      if (this.readingContainer) {
        this.readingContainer.style.display = "none";
      }
    } else if (reward.content) {
      // Reading / Mashwara content
      if (this.playerContainer) {
        this.playerContainer.style.display = "none";
        this.playerContainer.innerHTML = "";
      }
      if (this.readingContainer) {
        this.readingContainer.style.display = "block";
        this.readingContainer.innerHTML = this.renderMarkdown(reward.content);
      }
    } else {
      // General external link card
      if (this.playerContainer) {
        this.playerContainer.style.display = "block";
        this.playerContainer.innerHTML = `
          <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; text-align: center; padding: 20px;">
            <div style="font-size: 36px; margin-bottom: 12px;">🌟</div>
            <h3 style="font-size: 18px; margin-bottom: 6px;">${this.escapeHtml(reward.title)}</h3>
            <p style="font-size: 13px; color: var(--text-secondary); max-width: 440px; margin-bottom: 16px;">${this.escapeHtml(reward.description || "")}</p>
            <button class="btn-glow-primary" id="btn-play-external-now">Open & Enjoy in Browser →</button>
          </div>
        `;
        const playBtn = document.getElementById("btn-play-external-now");
        if (playBtn) {
          playBtn.addEventListener("click", () => {
            window.subahAPI.openExternal(reward.externalUrl);
          });
        }
      }
      if (this.readingContainer) {
        this.readingContainer.style.display = "none";
      }
    }
  }

  // --- Resilient YouTube Player ---------------------------------------------
  // The renderer is served from http://127.0.0.1 by the main process, so we have
  // a real origin to hand YouTube. Passing it explicitly (plus enablejsapi) lets
  // us listen for onError and fall back instead of stranding the user on a dead
  // player while the break timer runs.
  buildEmbedUrl(reward) {
    const origin = window.location.origin;
    const params = [
      "autoplay=1",
      "rel=0",
      "modestbranding=1",
      "playsinline=1",
      "enablejsapi=1",
      "origin=" + encodeURIComponent(origin)
    ].join("&");
    return "https://www.youtube-nocookie.com/embed/" + reward.youtubeId + "?" + params;
  }

  renderYouTubePlayer(reward) {
    this.playerContainer.innerHTML = `
      <iframe
        id="cinema-yt-frame"
        class="cinema-iframe"
        src="${this.buildEmbedUrl(reward)}"
        title="${this.escapeHtml(reward.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;
    this.attachEmbedWatchdog(reward);
  }

  attachEmbedWatchdog(reward) {
    const frame = document.getElementById("cinema-yt-frame");
    if (!frame) return;

    if (this.embedListener) {
      window.removeEventListener("message", this.embedListener);
      this.embedListener = null;
    }

    // Minimal YouTube widget handshake: announce we are listening, then watch
    // for onError. Error codes 100/101/150 = removed / embedding disabled.
    const handshake = () => {
      try {
        frame.contentWindow.postMessage(
          JSON.stringify({ event: "listening", id: "cinema-yt-frame", channel: "widget" }),
          "https://www.youtube-nocookie.com"
        );
      } catch (e) { /* cross-origin timing - harmless */ }
    };
    frame.addEventListener("load", handshake);
    setTimeout(handshake, 400);

    this.embedListener = (ev) => {
      let hostname = "";
      try {
        hostname = new URL(ev.origin).hostname.replace(/^www\./, "");
      } catch (_) {
        return;
      }
      if (!/youtube(-nocookie)?\.com$/.test(hostname)) return;
      let data = ev.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (e) { return; }
      }
      if (data && data.event === "onError") {
        this.showEmbedFallback(reward, data.info);
      }
    };
    window.addEventListener("message", this.embedListener);
  }

  showEmbedFallback(reward, code) {
    if (!this.playerContainer) return;
    const watchUrl = reward.externalUrl || reward.searchUrl;
    this.playerContainer.innerHTML = `
      <div class="embed-fallback-card">
        <div class="embed-fallback-icon">🌙</div>
        <h3 class="embed-fallback-title">${this.escapeHtml(reward.title)}</h3>
        <p class="embed-fallback-sub">
          This one will not play inside the app right now${code ? " (code " + code + ")" : ""}.
          Your reward is still waiting — open it in your browser.
        </p>
        <div class="embed-fallback-actions">
          <button class="btn-glow-primary" id="btn-fallback-watch">▶ Watch on YouTube</button>
          <button class="btn-secondary" id="btn-fallback-search">🔎 Find another version</button>
        </div>
      </div>
    `;
    const w = document.getElementById("btn-fallback-watch");
    if (w) w.addEventListener("click", () => window.subahAPI.openExternal(watchUrl));
    const f = document.getElementById("btn-fallback-search");
    if (f) f.addEventListener("click", () => window.subahAPI.openExternal(reward.searchUrl));
  }

  // --- Break Countdown Timer (5-10 Mins) ---
  setTimerMinutes(mins) {
    this.selectedMinutes = mins;
    this.timerSeconds = mins * 60;
    this.updateTimerDisplay();
  }

  startTimer() {
    this.stopTimer();
    this.timerSeconds = this.selectedMinutes * 60;
    this.timerRunning = true;
    this.updateTimerDisplay();
    if (this.timerToggleBtn) this.timerToggleBtn.textContent = "⏸ Pause";

    this.timerInterval = setInterval(() => {
      if (!this.timerRunning) return;
      this.timerSeconds--;
      this.updateTimerDisplay();

      if (this.timerSeconds <= 0) {
        this.onTimerComplete();
      }
    }, 1000);
  }

  toggleTimer() {
    this.timerRunning = !this.timerRunning;
    if (this.timerToggleBtn) {
      this.timerToggleBtn.textContent = this.timerRunning ? "⏸ Pause" : "▶ Resume";
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerRunning = false;
  }

  updateTimerDisplay() {
    if (!this.timerClock) return;
    const mins = Math.max(0, Math.floor(this.timerSeconds / 60));
    const secs = Math.max(0, this.timerSeconds % 60);
    this.timerClock.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    this.timerClock.classList.remove("finished");
  }

  onTimerComplete() {
    this.stopTimer();
    if (this.timerClock) {
      this.timerClock.textContent = "00:00";
      this.timerClock.classList.add("finished");
    }
    // Gentle singing bowl bell chime
    window.subahAudio.playTimerBell();
    window.subahApp.showToast("🔔 Break time complete! Feel refreshed and energized for your next task.");
  }

  closeModal() {
    this.stopTimer();
    if (this.unboxTimeout) {
      clearTimeout(this.unboxTimeout);
      this.unboxTimeout = null;
    }
    if (this.embedListener) {
      window.removeEventListener("message", this.embedListener);
      this.embedListener = null;
    }
    if (this.playerContainer) {
      this.playerContainer.innerHTML = ""; // Stop video playback
    }
    if (this.modal) {
      this.modal.classList.remove("active");
    }
    window.subahAudio.playClick();
  }

  renderMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/\n$/gim, "<br />");
    return html;
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

window.subahRewards = new SubahRewards();
