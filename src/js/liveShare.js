/**
 * Subah TaskBook - Live Shareable Co-Working & Accountability Controller
 * Powered by WebRTC Data Channels (PeerJS) for serverless, zero-config P2P sync.
 *
 * Share access is decided per person, by the OWNER of each list:
 *   "view" - the friend can only see my goals.
 *   "edit" - the friend can check off, add, rename and delete my goals.
 * Every incoming change is checked against MY setting on MY side, so a peer
 * can never grant itself edit rights (older builds had one shared mode that
 * either side could flip).
 */

(function () {
  "use strict";

  const MAX_TASK_TEXT = 300;
  const MAX_NAME = 40;
  // Flood guard for incoming edits: at most this many per window.
  const EDIT_RATE_LIMIT = 20;
  const EDIT_RATE_WINDOW_MS = 5000;

  const normalizeAccess = (value) => (value === "edit" ? "edit" : "view");
  const cleanText = (value, max) => String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);

  const SubahLiveShare = {
    peer: null,
    connection: null,
    isHost: false,
    roomCode: null,
    myDisplayName: "Me",
    peerDisplayName: "Friend",
    myAccess: "view",        // what my friend may do with MY goals (I decide)
    peerAccess: "view",      // what my friend lets ME do with THEIR goals (they decide)
    peerIsLegacy: false,     // friend runs a pre-1.1 build (shared "mode", toggle-only)
    isConnected: false,
    peerTasks: [],
    peerStreak: 1,
    peerCompletedCount: 0,
    peerEditingId: null,
    peerRenderPending: false,
    incomingEditTimes: [],

    init() {
      this.loadSavedSettings();
      this.bindEvents();
      this.syncAccessUI();
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
        this.myAccess = normalizeAccess(localStorage.getItem("subah_live_access"));
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
        btn.addEventListener("click", () => {
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

      // Share access: lobby dropdowns (host + join cards) and in-room switch
      document.querySelectorAll(".live-share-access-select").forEach((select) => {
        select.addEventListener("change", (e) => this.setMyAccess(e.target.value));
      });
      document.querySelectorAll(".live-access-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.setMyAccess(btn.getAttribute("data-access")));
      });

      // My goals (live room preview): tick my own goals
      const myList = document.getElementById("live-my-tasks-list");
      if (myList) {
        myList.addEventListener("click", (e) => {
          const btn = e.target.closest(".live-checkbox-btn");
          const id = btn && btn.getAttribute("data-id");
          if (id && window.subahChecklist) window.subahChecklist.toggleTask(id);
        });
      }

      // Friend's goals: tick / rename / delete (only acts when they allow editing)
      const peerList = document.getElementById("live-peer-tasks-list");
      if (peerList) {
        peerList.addEventListener("click", (e) => this.handlePeerListClick(e));
      }

      // Friend's goals: add a goal
      const addInput = document.getElementById("live-peer-add-input");
      const addBtn = document.getElementById("btn-live-peer-add");
      const submitAdd = () => {
        if (!addInput) return;
        const text = cleanText(addInput.value, MAX_TASK_TEXT);
        if (!text) return;
        if (this.requestAddRemoteTask(text)) addInput.value = "";
      };
      if (addInput) {
        addInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submitAdd();
        });
      }
      if (addBtn) addBtn.addEventListener("click", submitAdd);

      // Cleanup on window unload
      window.addEventListener("beforeunload", () => {
        this.cleanupPeer();
      });
    },

    // --- SHARE ACCESS ---------------------------------------------------------
    setMyAccess(value) {
      const access = normalizeAccess(value);
      const changed = access !== this.myAccess;
      this.myAccess = access;
      try { localStorage.setItem("subah_live_access", access); } catch (_) {}
      this.syncAccessUI();
      if (!changed) return;

      if (this.isConnected) {
        // Legacy peers ignore this message (and must never be sent a
        // "mode-change": in old builds that would also unlock THEIR list).
        this.sendPayload({ type: "access-change", access });
      }
      if (window.subahApp) {
        window.subahApp.showToast(
          access === "edit"
            ? "✏️ Editable: friends can now check off, add, edit & delete your goals"
            : "👁️ View Only: friends can see your goals but not change them",
          "info"
        );
      }
    },

    syncAccessUI() {
      document.querySelectorAll(".live-share-access-select").forEach((select) => {
        select.value = this.myAccess;
      });
      document.querySelectorAll(".live-access-btn").forEach((btn) => {
        const on = btn.getAttribute("data-access") === this.myAccess;
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-checked", on ? "true" : "false");
      });
    },

    canEditPeer() {
      return this.isConnected && this.peerAccess === "edit";
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
      const accessSelect = document.getElementById("host-share-access");
      if (accessSelect) this.setMyAccess(accessSelect.value);

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

        this.peer.on("open", () => {
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
      const accessSelect = document.getElementById("join-share-access");
      if (accessSelect) this.setMyAccess(accessSelect.value);

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
        this.setStatus("Live Connected", "connected");

        // Handshake. No legacy "sharingMode" field: old builds would adopt it
        // as a shared mode, and each side must keep deciding for itself.
        this.sendPayload({
          type: "handshake",
          protocol: 2,
          displayName: this.myDisplayName,
          isHost: this.isHost,
          access: this.myAccess,
          state: this.getMyShareableState()
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
          this.peerDisplayName = cleanText(data.displayName, MAX_NAME) || "Friend";
          if (typeof data.access === "string") {
            this.peerIsLegacy = false;
            this.peerAccess = normalizeAccess(data.access);
          } else {
            // Pre-1.1 build: "coworking" meant ticking was allowed, nothing more.
            this.peerIsLegacy = true;
            this.peerAccess = data.sharingMode === "coworking" ? "edit" : "view";
          }
          if (data.state) {
            this.handlePeerStateUpdate(data.state);
          }
          this.updatePeerInfoUI();
          break;

        case "tasks-update":
          this.handlePeerStateUpdate(data.state);
          break;

        case "task-completed-celebration":
          this.triggerPeerCelebration(cleanText(data.taskText, MAX_TASK_TEXT));
          break;

        case "reaction":
          this.receiveReaction(cleanText(data.emoji, 8), cleanText(data.from, MAX_NAME));
          break;

        case "access-change": {
          const next = normalizeAccess(data.access);
          if (next !== this.peerAccess) {
            this.peerAccess = next;
            if (window.subahApp) {
              window.subahApp.showToast(
                next === "edit"
                  ? `✏️ ${this.peerDisplayName} made their goals editable. You can now check off, add, edit & delete them.`
                  : `👁️ ${this.peerDisplayName} set their goals to View Only.`,
                "info"
              );
            }
          }
          this.updatePeerInfoUI();
          this.renderPeerTasksUI();
          break;
        }

        case "mode-change":
          // Legacy builds: only describes what THEY allow on THEIR list.
          // It never changes what I allow on mine.
          if (this.peerIsLegacy) {
            this.peerAccess = data.mode === "coworking" ? "edit" : "view";
            this.updatePeerInfoUI();
            this.renderPeerTasksUI();
          }
          break;

        case "remote-edit":
          this.applyRemoteEdit(data);
          break;

        case "toggle-task-request":
          // Legacy builds send this to tick a goal.
          this.handleRemoteTaskToggle(data.taskId);
          break;

        case "edit-rejected":
          if (window.subahApp) {
            window.subahApp.showToast(`👁️ ${this.peerDisplayName}'s goals are View Only. Your change was not applied.`, "warning");
          }
          break;
      }
    },

    getMyShareableState() {
      const appData = (window.subahApp && (window.subahApp.appData || window.subahApp.state)) || {};
      const todayDate = (window.subahChecklist && window.subahChecklist.todayDate) || (window.subahApp && window.subahApp.todayDate) || new Date().toISOString().split("T")[0];
      const allTasks = (window.subahChecklist && Array.isArray(window.subahChecklist.tasks) && window.subahChecklist.tasks.length > 0)
        ? window.subahChecklist.tasks
        : ((appData.tasksByDate && appData.tasksByDate[todayDate]) || []);

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
        streak: (appData.streak) || (window.subahChecklist && window.subahChecklist.streakNum ? parseInt(window.subahChecklist.streakNum.textContent, 10) : 1) || 1,
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
      if (!peerState || typeof peerState !== "object") return;
      const tasks = Array.isArray(peerState.tasks) ? peerState.tasks : [];
      // Normalise everything that came over the wire before it reaches the DOM.
      this.peerTasks = tasks.slice(0, 500).map((t) => ({
        id: cleanText(t && t.id, 80),
        text: cleanText(t && t.text, MAX_TASK_TEXT),
        completed: Boolean(t && t.completed),
        priority: ["high", "normal", "low"].includes(t && t.priority) ? t.priority : "normal"
      })).filter((t) => t.id);
      this.peerStreak = Math.max(1, parseInt(peerState.streak, 10) || 1);
      this.peerCompletedCount = this.peerTasks.filter((t) => t.completed).length;

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

      this.syncAccessUI();
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

      const friendTitle = document.getElementById("live-friend-column-title");
      if (friendTitle) friendTitle.textContent = `${this.peerDisplayName}'s Goals`;

      const badge = document.getElementById("live-peer-access-badge");
      if (badge) {
        const edit = this.peerAccess === "edit";
        badge.className = `live-peer-access-badge ${edit ? "edit" : "view"}`;
        badge.textContent = edit
          ? (this.peerIsLegacy ? "✏️ You can check off" : "✏️ You can edit")
          : "👁️ View Only";
      }

      const addRow = document.getElementById("live-peer-add-row");
      if (addRow) addRow.style.display = this.canEditPeer() && !this.peerIsLegacy ? "flex" : "none";
      const addInput = document.getElementById("live-peer-add-input");
      if (addInput) addInput.placeholder = `Add a goal to ${this.peerDisplayName}'s list...`;
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
          <button class="live-checkbox-btn" data-id="${this.escapeHtml(String(t.id))}" title="${t.completed ? 'Mark pending' : 'Complete goal'}">
            ${t.completed ? "✅" : "⏳"}
          </button>
          <span class="live-task-text">${this.escapeHtml(t.text)}</span>
          ${t.priority === "high" ? `<span style="font-size: 11px; color: #fbbf24; font-weight: 600;">HIGH</span>` : ""}
        </div>
      `).join("");
    },

    renderPeerTasksUI() {
      const container = document.getElementById("live-peer-tasks-list");
      if (!container) return;

      // Don't wipe an in-progress rename; re-render once it finishes.
      if (this.peerEditingId) {
        this.peerRenderPending = true;
        return;
      }
      this.peerRenderPending = false;

      const fillEl = document.getElementById("live-peer-progress-fill");
      const labelEl = document.getElementById("live-peer-progress-label");

      const total = this.peerTasks.length;
      const completed = this.peerCompletedCount;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      if (fillEl) fillEl.style.width = `${percent}%`;
      if (labelEl) labelEl.textContent = `${completed}/${total} (${percent}%)`;
      this.updatePeerInfoUI();

      if (this.peerTasks.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-sub, #94a3b8); font-size: 13px;">${
          this.canEditPeer() && !this.peerIsLegacy
            ? `${this.escapeHtml(this.peerDisplayName)} has no goals yet. Add one below!`
            : `Waiting for ${this.escapeHtml(this.peerDisplayName)}'s goals to sync...`
        }</div>`;
        return;
      }

      const canEdit = this.canEditPeer();
      const fullEdit = canEdit && !this.peerIsLegacy;

      container.innerHTML = this.peerTasks.map((t) => {
        const id = this.escapeHtml(t.id);
        const checkTitle = canEdit
          ? (t.completed ? "Mark pending" : "Check off for your friend")
          : "View Only: your friend hasn't allowed editing";
        return `
        <div class="live-task-row ${t.completed ? "completed" : ""}" data-peer-row="${id}">
          <button class="live-checkbox-btn ${canEdit ? "" : "readonly"}" data-peer-id="${id}" title="${checkTitle}" aria-disabled="${canEdit ? "false" : "true"}">
            ${t.completed ? "✅" : "⏳"}
          </button>
          <span class="live-task-text">${this.escapeHtml(t.text)}</span>
          ${t.priority === "high" ? `<span style="font-size: 11px; color: #fbbf24; font-weight: 600;">HIGH</span>` : ""}
          ${fullEdit ? `
            <span class="live-row-actions">
              <button type="button" class="live-row-action rename" data-peer-id="${id}" title="Edit goal text">✎</button>
              <button type="button" class="live-row-action delete" data-peer-id="${id}" title="Delete goal">🗑</button>
            </span>` : ""}
        </div>`;
      }).join("");
    },

    handlePeerListClick(e) {
      const renameBtn = e.target.closest(".live-row-action.rename");
      if (renameBtn) {
        const row = renameBtn.closest(".live-task-row");
        this.startPeerRename(row, renameBtn.getAttribute("data-peer-id"));
        return;
      }

      const deleteBtn = e.target.closest(".live-row-action.delete");
      if (deleteBtn) {
        const id = deleteBtn.getAttribute("data-peer-id");
        // Two-step delete: first click arms, second click (within 3s) confirms.
        if (!deleteBtn.classList.contains("confirm")) {
          deleteBtn.classList.add("confirm");
          deleteBtn.textContent = "Delete?";
          setTimeout(() => {
            if (deleteBtn.isConnected && deleteBtn.classList.contains("confirm")) {
              deleteBtn.classList.remove("confirm");
              deleteBtn.textContent = "🗑";
            }
          }, 3000);
          return;
        }
        this.sendRemoteEdit("delete", { taskId: id });
        return;
      }

      const checkBtn = e.target.closest(".live-checkbox-btn");
      if (checkBtn) {
        const id = checkBtn.getAttribute("data-peer-id");
        if (id) this.requestToggleRemoteTask(id);
      }
    },

    startPeerRename(row, taskId) {
      if (!row || !taskId || !this.canEditPeer()) return;
      const task = this.peerTasks.find((t) => t.id === taskId);
      const textEl = row.querySelector(".live-task-text");
      if (!task || !textEl) return;

      this.peerEditingId = taskId;
      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-input live-task-edit-input";
      input.maxLength = MAX_TASK_TEXT;
      input.value = task.text;
      textEl.replaceWith(input);
      input.focus();
      input.select();

      let done = false;
      const finish = (save) => {
        if (done) return;
        done = true;
        const text = cleanText(input.value, MAX_TASK_TEXT);
        this.peerEditingId = null;
        if (save && text && text !== task.text) {
          this.sendRemoteEdit("rename", { taskId, text });
        }
        this.renderPeerTasksUI();
      };
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") finish(true);
        if (ev.key === "Escape") finish(false);
      });
      input.addEventListener("blur", () => finish(true));
    },

    // --- OUTGOING EDITS (on my friend's list) ---------------------------------
    // Returns true when the request was sent.
    sendRemoteEdit(action, fields = {}) {
      if (!this.isConnected || !this.connection || !this.connection.open) {
        if (window.subahApp) window.subahApp.showToast("Not connected to a friend.", "warning");
        return false;
      }
      if (this.peerAccess !== "edit") {
        if (window.subahApp) {
          window.subahApp.showToast(`👁️ ${this.peerDisplayName} shares their goals as View Only.`, "info");
        }
        return false;
      }
      if (this.peerIsLegacy) {
        if (action !== "toggle") {
          if (window.subahApp) {
            window.subahApp.showToast(`${this.peerDisplayName}'s Subah is an older version that only allows checking off goals. Ask them to update.`, "info");
          }
          return false;
        }
        this.sendPayload({ type: "toggle-task-request", taskId: fields.taskId });
        return true;
      }
      this.sendPayload({ type: "remote-edit", action, ...fields });
      return true;
    },

    requestToggleRemoteTask(taskId) {
      return this.sendRemoteEdit("toggle", { taskId });
    },

    requestAddRemoteTask(text) {
      return this.sendRemoteEdit("add", { text });
    },

    // --- INCOMING EDITS (on my list) — permission is enforced HERE ------------
    handleRemoteTaskToggle(taskId) {
      return this.applyRemoteEdit({ action: "toggle", taskId });
    },

    async applyRemoteEdit(data) {
      const reject = (reason) => {
        this.sendPayload({ type: "edit-rejected", reason });
        return false;
      };

      if (this.myAccess !== "edit") return reject("view-only");

      const now = Date.now();
      this.incomingEditTimes = this.incomingEditTimes.filter((t) => now - t < EDIT_RATE_WINDOW_MS);
      if (this.incomingEditTimes.length >= EDIT_RATE_LIMIT) return reject("rate-limited");
      this.incomingEditTimes.push(now);

      const checklist = window.subahChecklist;
      if (!checklist || !Array.isArray(checklist.tasks)) return false;

      const action = data && data.action;
      const who = this.peerDisplayName;
      const toast = (msg) => window.subahApp && window.subahApp.showToast(msg, "success");

      if (action === "add") {
        const text = cleanText(data.text, MAX_TASK_TEXT);
        if (!text) return reject("invalid");
        await checklist.addTaskFromFriend(text, who);
        toast(`🤝 ${who} added a goal: "${text}"`);
        return true;
      }

      // Everything else targets one of my SHARED goals. Private goals are never
      // sent to the friend, so an id pointing at one is refused.
      const taskId = cleanText(data.taskId, 80);
      const task = checklist.tasks.find((t) => String(t.id) === taskId);
      if (!task || task.isPrivate) return reject("not-found");

      if (action === "toggle") {
        const wasCompleted = Boolean(task.completed);
        await checklist.toggleTask(task.id, { fromFriend: true });
        toast(`🤝 ${who} ${wasCompleted ? "marked pending" : "checked off"}: "${task.text}"`);
        return true;
      }
      if (action === "rename") {
        const text = cleanText(data.text, MAX_TASK_TEXT);
        if (!text) return reject("invalid");
        const oldText = await checklist.renameTask(task.id, text);
        if (oldText !== null && oldText !== undefined) toast(`✏️ ${who} renamed "${oldText}" to "${text}"`);
        return true;
      }
      if (action === "delete") {
        const text = task.text;
        await checklist.deleteTask(task.id);
        toast(`🗑 ${who} deleted: "${text}"`);
        return true;
      }
      return reject("invalid");
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

      // Friend-granted rights end with the session.
      this.peerAccess = "view";
      this.peerIsLegacy = false;
      this.peerTasks = [];
      this.peerCompletedCount = 0;
      this.peerEditingId = null;
      const addRow = document.getElementById("live-peer-add-row");
      if (addRow) addRow.style.display = "none";

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
