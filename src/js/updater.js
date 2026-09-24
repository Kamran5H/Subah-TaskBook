/**
 * Subah TaskBook - In-App Software Updater
 * Manages GitHub release checks, update alerts, download progress, and 1-click upgrade.
 */

(function () {
  "use strict";

  const SubahUpdater = {
    currentVersion: "1.0.0",
    updateInfo: null,
    downloadedFilePath: null,
    isChecking: false,
    isDownloading: false,

    async init() {
      try {
        if (window.subahAPI && window.subahAPI.getAppVersion) {
          const verInfo = await window.subahAPI.getAppVersion();
          if (verInfo && verInfo.version) {
            this.currentVersion = verInfo.version;
          }
        }
      } catch (_) {}

      this.bindEvents();

      // Check automatically on boot after 3 seconds if enabled in settings
      setTimeout(() => {
        const appState = (window.subahApp && (window.subahApp.appData || window.subahApp.state)) || {};
        const settings = appState.settings || {};
        if (settings.autoCheckUpdates !== false) {
          this.checkForUpdates({ silent: true });
        }
      }, 3000);
    },

    bindEvents() {
      const btnClose = document.getElementById("btn-close-updater-modal");
      if (btnClose) {
        btnClose.addEventListener("click", () => this.closeModal());
      }

      const btnLater = document.getElementById("btn-updater-later");
      if (btnLater) {
        btnLater.addEventListener("click", () => this.closeModal());
      }

      const btnBrowser = document.getElementById("btn-updater-browser");
      if (btnBrowser) {
        btnBrowser.addEventListener("click", () => {
          if (this.updateInfo && this.updateInfo.releaseUrl && window.subahAPI && window.subahAPI.openExternal) {
            window.subahAPI.openExternal(this.updateInfo.releaseUrl);
          }
        });
      }

      const btnUpgrade = document.getElementById("btn-updater-action");
      if (btnUpgrade) {
        btnUpgrade.addEventListener("click", () => this.handleUpgradeAction());
      }

      // Listen for download progress from main process
      if (window.subahAPI && window.subahAPI.onUpdateProgress) {
        window.subahAPI.onUpdateProgress((data) => {
          this.updateDownloadProgress(data);
        });
      }
    },

    async checkForUpdates({ silent = false } = {}) {
      if (this.isChecking) return;
      this.isChecking = true;

      try {
        if (!window.subahAPI || !window.subahAPI.checkForUpdates) {
          if (!silent && window.subahApp) {
            window.subahApp.showToast("Update check not supported in this environment.", "info");
          }
          this.isChecking = false;
          return;
        }

        const res = await window.subahAPI.checkForUpdates();
        this.isChecking = false;

        if (!res || !res.success) {
          if (!silent && window.subahApp) {
            window.subahApp.showToast(res && res.error ? `Update check failed: ${res.error}` : "Unable to reach update server.", "error");
          }
          return res;
        }

        if (res.hasUpdate) {
          this.updateInfo = res;
          this.openModal(res);
          return res;
        } else {
          this.updateInfo = null;
          if (!silent && window.subahApp) {
            window.subahApp.showToast(`✨ You are already on the latest version of Subah! (v${this.currentVersion})`, "success");
          }
          return res;
        }
      } catch (err) {
        this.isChecking = false;
        if (!silent && window.subahApp) {
          window.subahApp.showToast("Could not check for updates: " + err.message, "error");
        }
        return { success: false, error: err.message };
      }
    },

    openModal(updateInfo) {
      const modal = document.getElementById("updater-modal");
      if (!modal) return;

      const tagEl = document.getElementById("updater-version-tag");
      const nameEl = document.getElementById("updater-release-name");
      const notesEl = document.getElementById("updater-notes-box");
      const progressStage = document.getElementById("updater-progress-stage");
      const btnAction = document.getElementById("btn-updater-action");

      if (tagEl) tagEl.textContent = `New: ${updateInfo.latestVersion || "vLatest"}`;
      if (nameEl) nameEl.textContent = updateInfo.releaseName || "Exciting New Update Available";
      if (notesEl) notesEl.innerHTML = this.renderMarkdownNotes(updateInfo.releaseNotes);

      if (progressStage) progressStage.style.display = "none";
      if (btnAction) {
        btnAction.textContent = "🚀 Upgrade to Latest Version";
        btnAction.disabled = false;
      }

      this.downloadedFilePath = null;
      this.isDownloading = false;

      modal.classList.add("active");
    },

    closeModal() {
      const modal = document.getElementById("updater-modal");
      if (modal) modal.classList.remove("active");
    },

    async handleUpgradeAction() {
      const btnAction = document.getElementById("btn-updater-action");
      const progressStage = document.getElementById("updater-progress-stage");

      // Stage 2: Ready to restart & apply
      if (this.downloadedFilePath) {
        if (btnAction) {
          btnAction.textContent = "Restarting...";
          btnAction.disabled = true;
        }
        if (window.subahAPI && window.subahAPI.applyUpdateAndRestart) {
          await window.subahAPI.applyUpdateAndRestart(this.downloadedFilePath);
        }
        return;
      }

      // Stage 1: Begin download
      if (!this.updateInfo || !this.updateInfo.downloadUrl) {
        if (this.updateInfo && this.updateInfo.releaseUrl && window.subahAPI) {
          window.subahAPI.openExternal(this.updateInfo.releaseUrl);
        }
        return;
      }

      this.isDownloading = true;
      if (progressStage) progressStage.style.display = "flex";
      if (btnAction) {
        btnAction.textContent = "Downloading Update...";
        btnAction.disabled = true;
      }

      try {
        const res = await window.subahAPI.downloadUpdate(this.updateInfo.downloadUrl);
        if (res && res.success) {
          this.downloadedFilePath = res.filePath;
          this.isDownloading = false;

          const fillEl = document.getElementById("updater-progress-bar");
          const labelEl = document.getElementById("updater-progress-percent");
          if (fillEl) fillEl.style.width = "100%";
          if (labelEl) labelEl.textContent = "Download complete!";

          if (btnAction) {
            btnAction.textContent = "⚡ Restart & Apply Update";
            btnAction.disabled = false;
          }

          if (window.subahApp) {
            window.subahApp.showToast("Update downloaded successfully! Click Restart to finish.", "success");
          }
        } else {
          this.isDownloading = false;
          if (btnAction) {
            btnAction.textContent = "Download via Browser";
            btnAction.disabled = false;
          }
          if (window.subahApp) {
            window.subahApp.showToast(res && res.error ? `Download failed: ${res.error}` : "Update download failed.", "error");
          }
        }
      } catch (err) {
        this.isDownloading = false;
        if (btnAction) {
          btnAction.textContent = "Download via Browser";
          btnAction.disabled = false;
        }
        if (window.subahApp) {
          window.subahApp.showToast("Download error: " + err.message, "error");
        }
      }
    },

    updateDownloadProgress(data) {
      if (!data) return;
      const percent = Math.min(100, Math.max(0, data.percent || 0));
      const fillEl = document.getElementById("updater-progress-bar");
      const labelEl = document.getElementById("updater-progress-percent");

      if (fillEl) fillEl.style.width = `${percent}%`;
      if (labelEl) {
        if (data.totalBytes) {
          const mbRec = (data.receivedBytes / (1024 * 1024)).toFixed(1);
          const mbTot = (data.totalBytes / (1024 * 1024)).toFixed(1);
          labelEl.textContent = `${percent}% (${mbRec} MB / ${mbTot} MB)`;
        } else {
          labelEl.textContent = `${percent}%`;
        }
      }
    },

    renderMarkdownNotes(text) {
      if (!text) return "<p>No release notes provided.</p>";
      let safe = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Headers (### Header)
      safe = safe.replace(/^### (.*$)/gim, '<h4 style="margin: 8px 0 4px; color:#38bdf8;">$1</h4>');
      safe = safe.replace(/^## (.*$)/gim, '<h3 style="margin: 10px 0 4px; color:#f8fafc;">$1</h3>');

      // Bold (**bold**)
      safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Bullet points (- or *)
      safe = safe.replace(/^\s*[-*]\s+(.*)$/gim, '<div style="margin-left: 10px;">• $1</div>');

      return safe;
    }
  };

  window.SubahUpdater = SubahUpdater;

  document.addEventListener("DOMContentLoaded", () => {
    SubahUpdater.init();
  });
})();
