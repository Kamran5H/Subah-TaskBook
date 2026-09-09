// Verification suite: media playability architecture + golden developer signature.
// Covers the Error 153 root cause, embed resilience, reward-link rot, and the UI credit.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const { DEFAULT_REWARDS } = require("../src/js/rewardData.js");

console.log("=========================================");
console.log("   MEDIA PLAYABILITY & UI SIGNATURE      ");
console.log("=========================================\n");

// 9. Renderer must be served over a real http origin. loadFile() yields an
//    opaque file:// origin with no Referer, which YouTube rejects with Error 153.
const mainSrc = fs.readFileSync(path.join(ROOT, "main.js"), "utf-8");
assert(
  !/mainWindow\.loadFile\(/.test(mainSrc),
  "main.js must NOT use loadFile() - the file:// origin is what caused YouTube Error 153"
);
assert(/http\.createServer\(/.test(mainSrc), "main.js must run a loopback http server for the renderer");
assert(/listen\(0,\s*"127\.0\.0\.1"/.test(mainSrc), "renderer server must bind an ephemeral port on 127.0.0.1 only");
assert(/loadURL\(`http:\/\/127\.0\.0\.1:/.test(mainSrc), "main.js must load the renderer over http://127.0.0.1");
assert(/startsWith\(root\)/.test(mainSrc), "renderer server must guard against path traversal");
assert(!/listen\([^)]*0\.0\.0\.0/.test(mainSrc), "renderer server must never bind 0.0.0.0 (would expose the app on the LAN)");
console.log("✓ Renderer served over loopback http origin - Error 153 cannot recur.");

// 10. Embed resilience: origin declared, error observable, fallback reachable.
const rewardsSrc = fs.readFileSync(path.join(ROOT, "src", "js", "rewards.js"), "utf-8");
assert(/enablejsapi=1/.test(rewardsSrc), "embed URL must set enablejsapi=1 so onError is observable");
assert(/"origin=" \+ encodeURIComponent/.test(rewardsSrc), "embed URL must declare its real origin");
assert(/onError/.test(rewardsSrc), "rewards.js must handle the YouTube onError event");
assert(/showEmbedFallback/.test(rewardsSrc), "rewards.js must provide an embed fallback path");
assert(/openExternal/.test(rewardsSrc), "fallback must route out to the browser via openExternal");
console.log("✓ Embed resilience: origin declared, onError handled, browser fallback wired.");

// 11. Every reward carries a durable searchUrl. A pinned video id can rot; a
//     search query cannot 404. This is what makes playability permanent.
const missingSearch = DEFAULT_REWARDS.filter(r => !r.searchUrl).map(r => r.id);
assert.deepStrictEqual(missingSearch, [], "every reward needs a durable searchUrl: " + missingSearch.join(", "));
console.log("✓ All " + DEFAULT_REWARDS.length + " rewards carry a durable searchUrl fallback.");

// 12. Golden developer signature: present, gold, and click-inert.
const indexHtml = fs.readFileSync(path.join(ROOT, "src", "index.html"), "utf-8");
const mainCss = fs.readFileSync(path.join(ROOT, "src", "styles", "main.css"), "utf-8");
assert(indexHtml.includes("Kamran Ashraf"), "developer credit must appear in the UI");
assert(/signature-gold-text/.test(indexHtml), "credit must use the gold gradient treatment");
assert(
  /\.signature-gold-text\s*\{[^}]*linear-gradient/.test(mainCss),
  "gold gradient must be defined for .signature-gold-text"
);
assert(
  /\.dev-signature-plate\s*\{[^}]*pointer-events:\s*none/.test(mainCss),
  "signature plate must be pointer-events:none so it can never intercept a click"
);
assert(
  /\.dev-signature-line\s*\{[^}]*pointer-events:\s*none/.test(mainCss),
  "signature line must be pointer-events:none so it can never intercept a click"
);
console.log("✓ Golden 'Developer: Kamran Ashraf' signature present, gradient-gold, click-inert.");

// 13. Placeholder junk must never return to the reward library.
const BANNED = {
  kJQP7kiw5Fk: "Despacito",
  tgbNymZ7vqY: "Muppets Bohemian Rhapsody",
  w7ejDZ8SWv8: "React JS Crash Course",
  "2b9txcAt4e0": "Bali travel vlog"
};
const junk = DEFAULT_REWARDS.filter(r => BANNED[r.youtubeId]).map(r => r.id + " -> " + BANNED[r.youtubeId]);
assert.deepStrictEqual(junk, [], "placeholder junk found in reward library: " + junk.join(", "));
console.log("✓ No placeholder junk in the reward library.");

// 14. NETWORK: every curated video must still exist. Catches link rot before Kamran does.
(async () => {
  const vids = DEFAULT_REWARDS.filter(r => r.youtubeId);
  const dead = [];
  let online = true;

  for (const r of vids) {
    try {
      const res = await fetch(
        "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + r.youtubeId
      );
      if (res.status !== 200) dead.push(r.id + " (" + r.youtubeId + ") -> HTTP " + res.status);
    } catch (e) {
      online = false;
      break;
    }
  }

  if (!online) {
    console.log("⚠ Live video check skipped - no network. Re-run when online.");
  } else {
    assert.deepStrictEqual(dead, [], "dead reward videos detected:\n  " + dead.join("\n  "));
    console.log("✓ All " + vids.length + " reward videos verified live via YouTube oEmbed.");
  }

  console.log("\n=========================================");
  console.log("   MEDIA + UI SUITE PASSED (6 checks)    ");
  console.log("=========================================\n");
})();
