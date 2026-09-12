// Settings & Custom Reward Manager Logic

class SubahSettings {
  constructor() {
    this.settings = {};
    this.customRewards = [];
  }

  init(settings, customRewards) {
    this.settings = settings || {};
    this.customRewards = customRewards || [];

    // Theme selector buttons
    document.querySelectorAll(".theme-card-btn").forEach(card => {
      card.addEventListener("click", (e) => {
        const theme = e.currentTarget.getAttribute("data-theme");
        this.setTheme(theme);
      });
    });

    // Windows startup toggle
    const startupToggle = document.getElementById("toggle-startup-login");
    if (startupToggle) {
      startupToggle.checked = !!this.settings.openAtLogin;
      startupToggle.addEventListener("change", async (e) => {
        this.settings.openAtLogin = e.target.checked;
        await window.subahAPI.saveSettings({ openAtLogin: this.settings.openAtLogin });
        window.subahApp.showToast(this.settings.openAtLogin ? "Windows startup enabled" : "Windows startup disabled");
      });
    }

    // Sound toggle
    const soundToggle = document.getElementById("toggle-sound-effects");
    if (soundToggle) {
      soundToggle.checked = this.settings.soundEnabled !== false;
      soundToggle.addEventListener("change", async (e) => {
        this.settings.soundEnabled = e.target.checked;
        window.subahAudio.setEnabled(this.settings.soundEnabled);
        await window.subahAPI.saveSettings({ soundEnabled: this.settings.soundEnabled });
        window.subahApp.showToast(this.settings.soundEnabled ? "Acoustic sounds enabled" : "Acoustic sounds muted");
      });
    }

    // Add Custom Reward Form
    const btnAddCustom = document.getElementById("btn-submit-custom-reward");
    if (btnAddCustom) {
      btnAddCustom.addEventListener("click", () => this.handleAddCustomReward());
    }

    // Initial render of custom rewards list
    this.renderCustomRewards();
  }

  async setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-card-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-theme") === theme);
    });
    this.settings.theme = theme;
    await window.subahAPI.saveSettings({ theme });
    window.subahApp.showToast(`Theme switched to ${theme.replace("-", " ")}`);
  }

  extractYouTubeId(url) {
    if (!url) return null;
    // Escaped dot (an unescaped "." matched any char, e.g. "youtuXbe/"), and the id
    // must be exactly 11 valid chars - a malformed paste must not mint a bogus id.
    const regExp = /(?:youtu\.be\/|\/v\/|\/embed\/|\/shorts\/|[?&]v=)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  async handleAddCustomReward() {
    const titleInput = document.getElementById("custom-reward-title");
    const catSelect = document.getElementById("custom-reward-category");
    const linkInput = document.getElementById("custom-reward-link");
    const durInput = document.getElementById("custom-reward-duration");

    const title = titleInput.value.trim();
    const category = catSelect.value;
    const link = linkInput.value.trim();
    const duration = durInput.value.trim() || "5 mins";

    if (!title || !link) {
      window.subahApp.showToast("Please enter both a title and link.");
      return;
    }

    const ytId = this.extractYouTubeId(link);

    const categoryLabels = {
      naat: "🕌 Soulful Naat",
      qawwali: "🎶 Qawwali",
      melody: "🎵 Peaceful Melody",
      mashwara: "💡 Mashwara / Advice",
      reading: "📖 Thought to Ponder",
      dua: "🤲 Dua & Zikr",
      breathing: "🌬️ Breathe & Move",
      reel: "📱 Short Reel"
    };

    const newReward = {
      id: `custom-${Date.now()}`,
      category: category,
      categoryLabel: categoryLabels[category] || `⭐ ${category.toUpperCase()}`,
      title: title,
      artist: "Personal Collection",
      duration: duration,
      youtubeId: ytId,
      externalUrl: link,
      description: "Added to your personal reward collection"
    };

    this.customRewards.push(newReward);
    await window.subahAPI.saveCustomRewards(this.customRewards);
    window.subahRewards.updateCustomRewards(this.customRewards);

    // Reset inputs
    titleInput.value = "";
    linkInput.value = "";
    durInput.value = "";

    this.renderCustomRewards();
    window.subahAudio.playChime();
    window.subahApp.showToast("✨ Custom reward saved to library!");
  }

  async deleteCustomReward(id) {
    this.customRewards = this.customRewards.filter(r => r.id !== id);
    await window.subahAPI.saveCustomRewards(this.customRewards);
    window.subahRewards.updateCustomRewards(this.customRewards);
    this.renderCustomRewards();
    window.subahApp.showToast("Reward removed from collection.");
  }

  renderCustomRewards() {
    const listContainer = document.getElementById("custom-rewards-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (this.customRewards.length === 0) {
      listContainer.innerHTML = `
        <div style="font-size: 12.5px; color: var(--text-muted); text-align: center; padding: 14px; background: rgba(0,0,0,0.15); border-radius: 8px;">
          No custom rewards added yet. Paste any YouTube video or web link above to add your own treasures!
        </div>
      `;
      return;
    }

    this.customRewards.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 8px; border: 1px solid var(--border-subtle); font-size: 13px;";
      row.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-weight: 700; color: #fff;">${this.escapeHtml(item.title)}</span>
          <span style="font-size: 11px; color: var(--accent-gold); font-weight: 600;">${this.escapeHtml(item.categoryLabel || item.category)} • ${this.escapeHtml(item.duration)}</span>
        </div>
        <button class="btn-task-action delete" title="Delete from collection">✕</button>
      `;

      row.querySelector(".delete").addEventListener("click", () => {
        this.deleteCustomReward(item.id);
      });

      listContainer.appendChild(row);
    });
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

window.subahSettings = new SubahSettings();
