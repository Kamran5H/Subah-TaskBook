// Live Share access control: View Only vs Editable, enforced by the list owner
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

console.log("==================================================");
console.log("   RUNNING SUBAH LIVE SHARE ACCESS TESTS          ");
console.log("==================================================\n");

function makeEnv() {
  const elements = {};
  const el = (id) => elements[id] || (elements[id] = {
    id, innerHTML: "", textContent: "", value: "", className: "", style: {},
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, querySelector() { return null; }
  });
  const toasts = [];
  const sent = [];
  const calls = [];
  const storage = {};
  const checklist = {
    todayDate: "2026-09-30",
    tasks: [
      { id: "t1", text: "Read Quran", completed: false, priority: "high" },
      { id: "t2", text: "Gym", completed: false, priority: "normal" },
      { id: "secret", text: "Private goal", completed: false, isPrivate: true }
    ],
    async toggleTask(id, opts) { calls.push(["toggle", id, opts]); const t = this.tasks.find(x => String(x.id) === String(id)); t.completed = !t.completed; },
    async addTaskFromFriend(text, who) { calls.push(["add", text, who]); this.tasks.push({ id: "n" + this.tasks.length, text }); },
    async renameTask(id, text) { calls.push(["rename", id, text]); const t = this.tasks.find(x => String(x.id) === String(id)); const old = t.text; t.text = text; return old; },
    async deleteTask(id) { calls.push(["delete", id]); this.tasks = this.tasks.filter(x => String(x.id) !== String(id)); }
  };
  const window = {
    subahChecklist: checklist,
    subahApp: { showToast: (m, type) => toasts.push({ m, type }) },
    addEventListener() {},
    innerWidth: 1000, innerHeight: 800
  };
  const document = {
    getElementById: (id) => el(id),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener() {},
    createElement: () => el("tmp" + Math.random())
  };
  const context = {
    window, document, console, Date, Math, JSON, String, Number, Boolean, Array, Object, parseInt, setTimeout,
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "src", "js", "liveShare.js"), "utf-8"), context);
  const live = window.SubahLiveShare;
  live.connection = { open: true, send: (p) => sent.push(p) };
  live.isConnected = true;
  live.peerDisplayName = "Ali";
  return { live, checklist, toasts, sent, calls, elements, storage };
}

(async () => {
  // 1. View Only (default): every kind of incoming edit is refused and nothing changes
  {
    const { live, checklist, sent, calls } = makeEnv();
    assert.strictEqual(live.myAccess, "view", "default share access must be View Only");
    for (const edit of [
      { type: "remote-edit", action: "toggle", taskId: "t1" },
      { type: "remote-edit", action: "add", text: "Injected" },
      { type: "remote-edit", action: "rename", taskId: "t1", text: "Hacked" },
      { type: "remote-edit", action: "delete", taskId: "t2" },
      { type: "toggle-task-request", taskId: "t1" }
    ]) {
      await live.handleIncomingData(edit);
    }
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(calls.length, 0, "View Only must not apply any friend edit");
    assert.strictEqual(checklist.tasks.length, 3);
    assert.strictEqual(checklist.tasks[0].text, "Read Quran");
    assert.strictEqual(sent.filter(p => p.type === "edit-rejected").length, 5, "each refused edit must be reported back");
  }
  console.log("✓ View Only refuses toggle, add, rename, delete and legacy toggle requests.");

  // 2. A friend cannot unlock my list from their side
  {
    const { live, calls } = makeEnv();
    await live.handleIncomingData({ type: "handshake", displayName: "Ali", sharingMode: "coworking", state: { tasks: [] } });
    await live.handleIncomingData({ type: "mode-change", mode: "coworking" });
    await live.handleIncomingData({ type: "access-change", access: "edit" });
    assert.strictEqual(live.myAccess, "view", "peer messages must never change MY access");
    await live.handleIncomingData({ type: "toggle-task-request", taskId: "t1" });
    await live.handleIncomingData({ type: "remote-edit", action: "delete", taskId: "t1" });
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(calls.length, 0, "escalation attempt must not apply edits");
  }
  console.log("✓ Peer handshake/mode-change/access-change cannot escalate to edit rights.");

  // 3. Editable: all actions apply, owner is notified, private goals stay untouchable
  {
    const { live, checklist, sent, calls, toasts, storage } = makeEnv();
    live.setMyAccess("edit");
    assert.strictEqual(live.myAccess, "edit");
    assert.strictEqual(storage.subah_live_access, "edit", "access choice must persist");
    assert(sent.some(p => p.type === "access-change" && p.access === "edit"), "friend must be told about the new access");

    await live.handleIncomingData({ type: "remote-edit", action: "toggle", taskId: "t1" });
    await live.handleIncomingData({ type: "remote-edit", action: "add", text: "  Call   mom  " });
    await live.handleIncomingData({ type: "remote-edit", action: "rename", taskId: "t2", text: "Gym 30 min" });
    await live.handleIncomingData({ type: "remote-edit", action: "delete", taskId: "t1" });
    await new Promise(r => setTimeout(r, 10));

    assert.deepStrictEqual(calls[0].slice(0, 2), ["toggle", "t1"]);
    assert.strictEqual(calls[0][2].fromFriend, true, "friend ticks must not open the owner's reward popup");
    assert.deepStrictEqual(calls[1], ["add", "Call mom", "Ali"], "added text must be whitespace-normalised");
    assert.deepStrictEqual(calls[2], ["rename", "t2", "Gym 30 min"]);
    assert.deepStrictEqual(calls[3], ["delete", "t1"]);
    assert(toasts.some(t => /Ali added a goal/.test(t.m)), "owner must be notified of friend's edits");

    const before = calls.length;
    await live.handleIncomingData({ type: "remote-edit", action: "delete", taskId: "secret" });
    await live.handleIncomingData({ type: "remote-edit", action: "rename", taskId: "secret", text: "x" });
    await live.handleIncomingData({ type: "remote-edit", action: "add", text: "   " });
    await live.handleIncomingData({ type: "remote-edit", action: "drop-table" });
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(calls.length, before, "private goals, empty text and unknown actions must be refused");
    assert(checklist.tasks.some(t => t.id === "secret"), "private goal must survive");

    await live.handleIncomingData({ type: "remote-edit", action: "add", text: "x".repeat(5000) });
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(calls[calls.length - 1][1].length, 300, "goal text must be capped at 300 characters");

    // Switching back to View Only takes effect immediately
    live.setMyAccess("view");
    const n = calls.length;
    await live.handleIncomingData({ type: "remote-edit", action: "toggle", taskId: "t2" });
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(calls.length, n, "edits after switching to View Only must be refused");
  }
  console.log("✓ Editable applies toggle/add/rename/delete; private goals and bad input refused.");

  // 4. Flood guard
  {
    const { live, calls } = makeEnv();
    live.setMyAccess("edit");
    for (let i = 0; i < 40; i++) await live.handleIncomingData({ type: "remote-edit", action: "add", text: "spam " + i });
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(calls.length, 20, "no more than 20 friend edits per 5 seconds");
  }
  console.log("✓ Incoming edit flood is rate-limited.");

  // 5. Outgoing requests respect what the FRIEND allows
  {
    const { live, sent } = makeEnv();
    await live.handleIncomingData({ type: "handshake", displayName: "Ali", access: "view", state: { tasks: [{ id: "a", text: "A" }] } });
    assert.strictEqual(live.peerAccess, "view");
    assert.strictEqual(live.requestToggleRemoteTask("a"), false, "View Only friend: no request is sent");
    assert.strictEqual(sent.filter(p => p.type === "remote-edit").length, 0);

    await live.handleIncomingData({ type: "access-change", access: "edit" });
    assert.strictEqual(live.peerAccess, "edit");
    assert.strictEqual(live.requestToggleRemoteTask("a"), true);
    assert.strictEqual(live.requestAddRemoteTask("New"), true);
    assert.deepStrictEqual(sent.filter(p => p.type === "remote-edit").map(p => p.action), ["toggle", "add"]);

    // Legacy (pre-1.1) friend in co-working: ticking works through the old message, nothing else
    const legacy = makeEnv();
    await legacy.live.handleIncomingData({ type: "handshake", displayName: "Old", sharingMode: "coworking", state: { tasks: [] } });
    assert.strictEqual(legacy.live.peerIsLegacy, true);
    assert.strictEqual(legacy.live.requestToggleRemoteTask("a"), true);
    assert.strictEqual(legacy.sent[legacy.sent.length - 1].type, "toggle-task-request");
    assert.strictEqual(legacy.live.sendRemoteEdit("rename", { taskId: "a", text: "b" }), false, "legacy peers only support ticking");
  }
  console.log("✓ Outgoing edits follow the friend's access; legacy friends stay compatible.");

  // 6. My handshake announces my access and never a shared legacy mode
  {
    const { live, sent } = makeEnv();
    live.setMyAccess("edit");
    let openHandler = null;
    live.connection = { open: true, send: (p) => sent.push(p), on: (ev, fn) => { if (ev === "open") openHandler = fn; } };
    live.setupConnectionHandlers();
    openHandler();
    const hs = sent.find(p => p.type === "handshake");
    assert(hs && hs.access === "edit", "handshake must carry my access");
    assert(!("sharingMode" in hs), "handshake must not send a shared legacy mode");
  }
  console.log("✓ Handshake carries per-owner access only.");

  // 7. Friend data is escaped before it reaches the page
  {
    const { live, elements } = makeEnv();
    live.peerAccess = "edit";
    live.handlePeerStateUpdate({ tasks: [{ id: 'x" onmouseover="alert(1)', text: "<img src=x onerror=alert(1)>", completed: false }] });
    const html = elements["live-peer-tasks-list"].innerHTML;
    assert(!html.includes("<img"), "task text must be escaped");
    assert(!html.includes('" onmouseover="'), "task id must be escaped inside attributes");
    assert(html.includes("live-row-action rename"), "Editable friend list must show edit controls");

    live.peerAccess = "view";
    live.renderPeerTasksUI();
    const viewHtml = elements["live-peer-tasks-list"].innerHTML;
    assert(!viewHtml.includes("live-row-action"), "View Only friend list must hide edit controls");
    assert(viewHtml.includes("readonly"), "View Only checkboxes must render read-only");
  }
  console.log("✓ Friend data is escaped; controls match the friend's access.");

  // 8. Markup wiring
  const html = fs.readFileSync(path.join(ROOT, "src", "index.html"), "utf-8");
  ["host-share-access", "join-share-access", "live-peer-access-badge", "live-peer-add-row", "live-peer-add-input", "btn-live-peer-add"].forEach(id => {
    assert(html.includes(`id="${id}"`), `index.html must contain #${id}`);
  });
  assert(html.includes('data-access="view"') && html.includes('data-access="edit"'), "in-room access switch must exist");
  assert(!html.includes('id="live-sharing-mode"'), "old shared mode selector must be gone");
  console.log("✓ Lobby selectors, in-room switch, badge and add row present.");

  console.log("\n==================================================");
  console.log("   ALL LIVE SHARE ACCESS TESTS PASSED!            ");
  console.log("==================================================");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
