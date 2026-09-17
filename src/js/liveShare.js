/**
 * Subah TaskBook - Live Shareable Co-Working & Accountability Controller
 * Powered by WebRTC Data Channels (PeerJS) for serverless, zero-config P2P sync.
 */

(function () {
  "use strict";

  const SubahLiveShare = {
    peer: null,
    connection: null,
    isHost: false,
    roomCode: null,
    myDisplayName: "Me",
    peerDisplayName: "Friend",
    sharingMode: "dual", // "dual" (accountability) or "coworking"
    isConnected: false,
    peerTasks: [],
    peerStreak: 1,
    peerCompletedCount: 0,

    init() {
      this.loadSavedSettings();
      this.bindEvents();
      this.renderMyTasksPreview();
    },

    loadSavedSettings() {
      try {
        const savedName = localStorage.getItem("subah_live_name");
        if (savedName) {
          this.myDisplayName = savedName;
          const nameInput = document.getElementById("join-display-name");
          if (nameInput) nameInput.value = savedName;
          const hostNameInput = document.getElementById("host-display-name");
          if (hostNameInput) hostNameInput.value = savedName;
        }
      } catch (_) {}
    },

    bindEvents() {
      // Host Button
      const btnHost = document.getElementById("btn-create-live-room");
      if (btnHost) {
        btnHost.addEventListener("click", () => this.startHosting());
      }

      // Join Button
      const btnJoin = document.getElementById("btn-join-live-room");
      if (btnJoin) {
        btnJoin.addEventListener("click", () => this.joinRoom());
      }

      // Copy Code Buttons
      const btnCopyCode = document.getElementById("btn-copy-room-code");
      if (btnCopyCode) {
        btnCopyCode.addEventListener("click", () => this.copyRoomCode());
      }
      const btnCopyBanner = document.getElementById("btn-copy-banner-code");
      if (btnCopyBanner) {
        btnCopyBanner.addEventListener("click", () => this.copyRoomCode());
      }

      // Disconnect / Leave
      const btnLeave = document.getElementById("btn-leave-live-room");
      if (btnLeave) {
        btnLeave.addEventListener("click", () => this.disconnect("Left live session."));
      }
      const btnKick = document.getElementById("btn-kick-peer");
      if (btnKick) {
        btnKick.addEventListener("click", () => this.disconnect("Ended session with friend."));
      }

      // Reaction Buttons
      const reactionBtns = document.querySelectorAll(".reaction-btn");
      reactionBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const emoji = btn.getAttribute("data-emoji") || btn.textContent.trim();
          this.sendReaction(emoji);
        });
      });

      // Quick "Go Live" shortcut button in Checklist top bar
      const btnQuickLive = document.getElementById("btn-quick-live-share");
      if (btnQuickLive) {
        btnQuickLive.addEventListener("click", () => {
          const navLiveTab = document.querySelector('.nav-tab-btn[data-tab="live-share"]');
          if (navLiveTab) navLiveTab.click();
        });
      }

      // Mode toggle (View-Only vs Co-working)
      const modeSelect = document.getElementById("live-sharing-mode");
      if (modeSelect) {
        modeSelect.addEventListener("change", (e) => {
          this.sharingMode = e.target.value;
          if (this.connection && this.connection.open) {
            this.sendPayload({ type: "mode-change", mode: this.sharingMode });
          }
        });
      }
    },

    generateRoomCode() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `SUB-${code}`;
    },

    formatPeerId(roomCode) {
      const sanitized = roomCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      return `subahtask-${sanitized}`;
    },

    setStatus(statusText, stateClass) {
      const badge = document.getElementById("live-status-pill");
      const label = document.getElementById("live-status-label");
      if (badge) {
        badge.className = `live-status-badge ${stateClass}`;
      }
      if (label) {
        label.textContent = statusText;
      }
    },

    // --- HOSTING FLOW ---
    async startHosting() {
      const nameInput = document.getElementById("host-display-name");
      if (nameInput && nameInput.value.trim()) {
        this.myDisplayName = nameInput.value.trim();
        try { localStorage.setItem("subah_live_name", this.myDisplayName); } catch (_) {}
      }

      this.roomCode = this.generateRoomCode();
      const peerId = this.formatPeerId(this.roomCode);

      this.isHost = true;
      this.setStatus("Connecting signaling...", "connecting");

      if (typeof Peer === "undefined") {
        if (window.subahApp) window.subahApp.showToast("WebRTC Peer library not loaded. Check internet connection.", "error");
        this.setStatus("Offline", "offline");
        return;
      }

      this.cleanupPeer();

      try {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" }
            ]
          }
        });

        this.peer.on("open", (id) => {
          this.setStatus(`Waiting for friend (${this.roomCode})`, "connecting");
          const codeEl = document.getElementById("host-generated-code");
          if (codeEl) codeEl.textContent = this.roomCode;
          const boxEl = document.getElementById("host-code-box");
          if (boxEl) boxEl.style.display = "flex";

          if (window.subahApp) {
            window.subahApp.showToast(`Live Room Created! Share code: ${this.roomCode}`, "success");
          }
        });

        this.peer.on("connection", (conn) => {
          this.connection = conn;
          this.setupConnectionHandlers();
        });

        this.peer.on("error", (err) => {
          console.error("PeerJS Error:", err);
          if (err.type === "unavailable-id") {
            // Collision retry
            this.startHosting();
          } else {
            this.setStatus("Connection error", "offline");
            if (window.subahApp) window.subahApp.showToast("Connection issue: " + err.type, "error");
          }
        });
      } catch (e) {
        console.error("Failed to initialize Peer:", e);
        this.setStatus("Error", "offline");
      }
    },

    // --- JOINING FLOW ---
    async joinRoom() {
      const codeInput = document.getElementById("join-room-code");
      const nameInput = document.getElementById("join-display-name");

      if (!codeInput || !codeInput.value.trim()) {
        if (window.subahApp) window.subahApp.showToast("Please enter a room code.", "warning");
        return;
      }

      const inputCode = codeInput.value.trim().toUpperCase();
      this.roomCode = inputCode;
      const targetPeerId = this.formatPeerId(this.roomCode);

      if (nameInput && nameInput.value.trim()) {
        this.myDisplayName = nameInput.value.trim();
        try { localStorage.setItem("subah_live_name", this.myDisplayName); } catch (_) {}
      }

      this.isHost = false;
      this.setStatus(`Connecting to ${inputCode}...`, "connecting");

      if (typeof Peer === "undefined") {
        if (window.subahApp) window.subahApp.showToast("WebRTC Peer library not loaded.", "error");
        this.setStatus("Offline", "offline");
        return;
      }

      this.cleanupPeer();

      try {
        this.peer = new Peer({
          debug: 1,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" }
            ]
          }
        });

        this.peer.on("open", () => {
          const conn = this.peer.connect(targetPeerId, { reliable: true });
          this.connection = conn;
          this.setupConnectionHandlers();
        });

        this.peer.on("error", (err) => {
          console.error("Peer Join Error:", err);
          this.setStatus("Could not find room", "offline");
          if (window.subahApp) window.subahApp.showToast("Could not find room " + inputCode, "error");
        });
      } catch (e) {
        console.error("Failed to connect to peer:", e);
        this.setStatus("Error", "offline");
      }
    },

    setupConnectionHandlers() {
      if (!this.connection) return;

      this.connection.on("open", () => {
        this.isConnected = true;
        this.setStatus("🟢 Live Connected", "connected");

        // Send handshake
        const myPayload = this.getMyShareableState();
        this.sendPayload({
          type: "handshake",
          displayName: this.myDisplayName,
          isHost: this.isHost,
          sharingMode: this.sharingMode,
          state: myPayload
        });

        this.showActiveRoom();

        if (window.subahApp) {
          window.subahApp.showToast("🤝 Live connected with friend!", "success");
        }
      });

      this.connection.on("data", (data) => {
        this.handleIncomingData(data);
      });

      this.connection.on("close", () => {
        this.disconnect("Friend disconnected from the live room.");
      });

      this.connection.on("error", (err) => {
        console.error("Data connection error:", err);
        this.disconnect("Connection dropped.");
      });
    },

    handleIncomingData(data) {
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "handshake":
          this.peerDisplayName = data.displayName || "Friend";
          if (data.sharingMode) this.sharingMode = data.sharingMode;
          if (data.state) {
            this.handlePeerStateUpdate(data.state);
          }
          this.updatePeerInfoUI();
          break;

        case "tasks-update":
          this.handlePeerStateUpdate(data.state);
          break;

        case "task-completed-celebration":
          this.triggerPeerCelebration(data.taskText);
          break;

        case "reaction":
          this.receiveReaction(data.emoji, data.from);
          break;

        case "mode-change":
          this.sharingMode = data.mode;
          if (window.subahApp) {
            window.subahApp.showToast(`Live mode set to: ${data.mode === "coworking" ? "Shared Co-Working" : "Dual Accountability"}`, "info");
          }
          break;

        case "toggle-task-request":
          this.handleRemoteTaskToggle(data.taskId);
          break;
      }
    },

    getMyShareableState() {
      const appState = (window.subahApp && window.subahApp.state) || {};
      const todayDate = (window.subahChecklist && window.subahChecklist.todayDate) || new Date().toISOString().split("T")[0];
      const allTasks = (appState.tasksByDate && appState.tasksByDate[todayDate]) || [];

      // Filter out private tasks (selective privacy)
      const shareableTasks = allTasks.filter((t) => !t.isPrivate).map((t) => ({
        id: t.id,
        text: t.text,
        completed: Boolean(t.completed),
        priority: t.priority || "normal",
        pinned: Boolean(t.pinned)
      }));

      const completedCount = shareableTasks.filter((t) => t.completed).length;

      return {
        todayDate,
        streak: appState.streak || 1,
        tasks: shareableTasks,
        completedCount,
        totalCount: shareableTasks.length
      };
    },

    broadcastTasksUpdate({ completedTaskText = null } = {}) {
      if (!this.isConnected || !this.connection || !this.connection.open) return;

      const myPayload = this.getMyShareableState();
      this.sendPayload({
        type: "tasks-update",
        state: myPayload
      });

      if (completedTaskText) {
        this.sendPayload({
          type: "task-completed-celebration",
          taskText: completedTaskText
        });
      }

      this.renderMyTasksPreview();
    },

    handlePeerStateUpdate(peerState) {
      if (!peerState) return;
      this.peerTasks = peerState.tasks || [];
      this.peerStreak = peerState.streak || 1;
      this.peerCompletedCount = peerState.completedCount || 0;

      this.renderPeerTasksUI();
    },

    triggerPeerCelebration(taskText) {
      if (window.subahAudio && window.subahAudio.playCelebration) {
        window.subahAudio.playCelebration();
      }
      if (window.subahConfetti && window.subahConfetti.fire) {
        window.subahConfetti.fire();
      }
      if (window.subahApp) {
        window.subahApp.showToast(`🎉 ${this.peerDisplayName} just completed: "${taskText || "a task"}"!`, "success");
      }
    },

    sendReaction(emoji) {
      this.spawnFloatingReaction(emoji);

      if (this.isConnected && this.connection && this.connection.open) {
        this.sendPayload({
          type: "reaction",
          emoji: emoji,
          from: this.myDisplayName
        });
      } else {
        if (window.subahApp) window.subahApp.showToast("Reaction preview (connect with a friend to share live)", "info");
      }
    },

    receiveReaction(emoji, fromName) {
      this.spawnFloatingReaction(emoji);
      if (window.subahAudio && window.subahAudio.playChime) {
        window.subahAudio.playChime();
      }
      if (window.subahApp) {
        window.subahApp.showToast(`${fromName || "Friend"} sent ${emoji}`, "info");
      }
    },

    spawnFloatingReaction(emoji) {
      const el = document.createElement("div");
      el.className = "floating-reaction-particle";
      el.textContent = emoji;

      // Random horizontal position near center
      const randomX = Math.floor(window.innerWidth * 0.35 + Math.random() * (window.innerWidth * 0.3));
      const startY = window.innerHeight - 140;

      el.style.left = `${randomX}px`;
      el.style.top = `${startY}px`;

      document.body.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 2500);
    },

    showActiveRoom() {
      const lobby = document.getElementById("live-lobby-section");
      const room = document.getElementById("live-active-room-section");
      if (lobby) lobby.style.display = "none";
      if (room) room.style.display = "flex";

      const roomCodeEl = document.getElementById("room-code-banner-val");
      if (roomCodeEl) roomCodeEl.textContent = this.roomCode || "SUBAH";

      this.updatePeerInfoUI();
      this.renderMyTasksPreview();
      this.renderPeerTasksUI();
    },

    updatePeerInfoUI() {
      const peerNameEl = document.getElementById("live-peer-name");
      const peerInitialEl = document.getElementById("live-peer-avatar-initial");
      const peerStreakEl = document.getElementById("live-peer-streak-badge");

      if (peerNameEl) peerNameEl.textContent = this.peerDisplayName;
      if (peerInitialEl) peerInitialEl.textContent = (this.peerDisplayName || "F").charAt(0).toUpperCase();
      if (peerStreakEl) peerStreakEl.textContent = `🔥 ${this.peerStreak}d Streak`;

      const myNameEl = document.getElementById("live-my-name");
      if (myNameEl) myNameEl.textContent = this.myDisplayName;
    },

    renderMyTasksPreview() {
      const container = document.getElementById("live-my-tasks-list");
      if (!container) return;

      const myState = this.getMyShareableState();
      const fillEl = document.getElementById("live-my-progress-fill");
      const labelEl = document.getElementById("live-my-progress-label");

      const percent = myState.totalCount > 0 ? Math.round((myState.completedCount / myState.totalCount) * 100) : 0;
      if (fillEl) fillEl.style.width = `${percent}%`;
      if (labelEl) labelEl.textContent = `${myState.completedCount}/${myState.totalCount} (${percent}%)`;

      if (myState.tasks.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-sub, #94a3b8); font-size: 13px;">No public tasks for today yet. Add goals in Today's Tasks!</div>`;
        return;
      }

      container.innerHTML = myState.tasks.map((t) => `
        <div class="live-task-row ${t.completed ? "completed" : ""}">
          <span style="font-size: 14px;">${t.completed ? "✅" : "⏳"}</span>
          <span class="live-task-text">${this.escapeHtml(t.text)}</span>
          ${t.priority === "high" ? `<span style="font-size: 11px; color: #fbbf24; font-weight: 600;">HIGH</span>` : ""}
        </div>
      `).join("");
    },

    renderPeerTasksUI() {
      const container = document.getElementById("live-peer-tasks-list");
      if (!container) return;

      const fillEl = document.getElementById("live-peer-progress-fill");
      const labelEl = document.getElementById("live-peer-progress-label");

      const total = this.peerTasks.length;
      const completed = this.peerCompletedCount;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      if (fillEl) fillEl.style.width = `${percent}%`;
      if (labelEl) labelEl.textContent = `${completed}/${total} (${percent}%)`;

      if (this.peerTasks.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-sub, #94a3b8); font-size: 13px;">Waiting for ${this.escapeHtml(this.peerDisplayName)}'s goals to sync...</div>`;
        return;
      }

      container.innerHTML = this.peerTasks.map((t) => `
        <div class="live-task-row ${t.completed ? "completed" : ""}">
          <span style="font-size: 14px;">${t.completed ? "✅" : "⏳"}</span>
          <span class="live-task-text">${this.escapeHtml(t.text)}</span>
          ${t.priority === "high" ? `<span style="font-size: 11px; color: #fbbf24; font-weight: 600;">HIGH</span>` : ""}
        </div>
      `).join("");
    },

    sendPayload(payload) {
      if (this.connection && this.connection.open) {
        try {
          this.connection.send(payload);
        } catch (e) {
          console.error("Failed to send P2P message:", e);
        }
      }
    },

    copyRoomCode() {
      if (!this.roomCode) return;
      navigator.clipboard.writeText(this.roomCode).then(() => {
        if (window.subahApp) window.subahApp.showToast(`Room code copied: ${this.roomCode}`, "success");
      }).catch(() => {
        prompt("Copy room code:", this.roomCode);
      });
    },

    disconnect(reason = "Disconnected") {
      this.isConnected = false;
      this.cleanupPeer();

      this.setStatus("Offline", "offline");

      const lobby = document.getElementById("live-lobby-section");
      const room = document.getElementById("live-active-room-section");
      if (lobby) lobby.style.display = "grid";
      if (room) room.style.display = "none";

      const hostBox = document.getElementById("host-code-box");
      if (hostBox) hostBox.style.display = "none";

      if (window.subahApp && reason) {
        window.subahApp.showToast(reason, "info");
      }
    },

    cleanupPeer() {
      if (this.connection) {
        try { this.connection.close(); } catch (_) {}
        this.connection = null;
      }
      if (this.peer) {
        try { this.peer.destroy(); } catch (_) {}
        this.peer = null;
      }
    },

    escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  };

  window.SubahLiveShare = SubahLiveShare;

  document.addEventListener("DOMContentLoaded", () => {
    SubahLiveShare.init();
  });
})();
