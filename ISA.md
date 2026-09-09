---
project: Subah-TaskBook
task: Fix unplayable reward media permanently; add golden developer credit
effort: E3
phase: think
progress: 0/40
mode: algorithm
started: 2026-09-08
updated: 2026-09-08
---

## Problem

Reward media never plays in the app. YouTube returns **Error 153** (player config / origin
rejection) because `main.js` loads the renderer with `loadFile()`, giving an opaque `file://`
origin with no `Referer`. Separately, the "curated" reward library is fabricated: 10 of 15
video IDs are dead (404 on oEmbed) and the 5 live ones are placeholder junk (Muppets Bohemian
Rhapsody as a Ney flute melody, a React JS crash course as a mindful reel). The app also has
no failure path — the 7-minute break timer runs over a dead player.

## Vision

Kamran completes a task, the gift unboxes, and a real naat or qawwali actually plays inside
his app. When a video eventually dies years from now, the app quietly offers a working link
instead of a broken player. His name sits in the UI in gold, like a maker's mark.

## Out of Scope

Not hosting/bundling audio locally (legal + size). Not building a YouTube client. Not
redesigning the app's visual language — the existing aesthetic stays; only additive polish.
Not touching the streak/checklist logic fixed earlier this session.

## Principles

- The brittle dependency is the video ID, not the embed. Never let one ID be the guarantee.
- Fix at the ingestion point (`loadFile`), never at the display layer (iframe markup).
- A dead player is worse than an honest fallback link.
- Data that can rot must be validated by a test, not by the user.

## Constraints

- YouTube embeds require a resolvable http(s) origin. Immovable third-party policy.
- Desktop/startup shortcuts run the packaged asar; source edits require `npm run package`.
- No new runtime dependencies — `dependencies: {}` stays empty.
- Renderer stays plain JS/CSS, no build step.

## Goal

Give the renderer a real loopback HTTP origin so YouTube embeds behave exactly as they do in
Kamran's browser; replace every fabricated video ID with a verified, thematically correct one;
add a durable search-link fallback plus embed error detection so no reward can ever present a
dead player; and add a golden "Developer: Kamran Ashraf" credit. Verified live in the
packaged app, not just in source.

## Criteria

- [ ] ISC-1: `main.js` no longer calls `loadFile` for the main window
- [ ] ISC-2: `main.js` creates an `http` server in the main process
- [ ] ISC-3: Server binds to `127.0.0.1` only
- [ ] ISC-4: Anti: server does NOT bind `0.0.0.0` / expose the app on the LAN
- [ ] ISC-5: Server listens on an ephemeral port (`listen(0)`) to avoid collisions
- [ ] ISC-6: Server document root is the `src/` directory
- [ ] ISC-7: Path-traversal guard rejects paths escaping `src/`
- [ ] ISC-8: `mainWindow.loadURL` targets `http://127.0.0.1:<port>/index.html`
- [ ] ISC-9: Server is started and awaited before `createWindow()`
- [ ] ISC-10: Server serves `.css` with `text/css`
- [ ] ISC-11: Server serves `.js` with `text/javascript`
- [ ] ISC-12: App boots with zero renderer console errors
- [ ] ISC-13: Renderer `window.location.origin` is `http://127.0.0.1:<port>` in the PACKAGED app
- [ ] ISC-14: iframe embed URL includes `origin=` parameter
- [ ] ISC-15: iframe embed URL includes `enablejsapi=1`
- [ ] ISC-16: YouTube IFrame API `onError` handler is wired
- [ ] ISC-17: On embed error the UI shows a working "Watch on YouTube" action
- [ ] ISC-18: Fallback action routes through `openExternal`
- [ ] ISC-19: Every reward exposes a durable `searchUrl` that cannot 404
- [ ] ISC-20: `searchUrl` is derived from title + artist
- [ ] ISC-21: Anti: break timer never runs over a dead player with no fallback offered
- [ ] ISC-22: Zero dead `youtubeId` values — every ID returns oEmbed HTTP 200
- [ ] ISC-23: Anti: no placeholder junk remains (no Despacito / Muppets / React crash course)
- [ ] ISC-24: Every `naat` entry's real YouTube title is actually a naat/hamd/salaam
- [ ] ISC-25: Every `qawwali` entry's real YouTube title is actually a qawwali
- [ ] ISC-26: All six categories still populated after replacement
- [ ] ISC-27: `npm test` validates every `youtubeId` against oEmbed
- [ ] ISC-28: `extractYouTubeId` escapes the literal dot in `youtu.be`
- [ ] ISC-29: `extractYouTubeId` returns null for malformed input
- [ ] ISC-30: "Developer: Kamran Ashraf" string is present in the UI
- [ ] ISC-31: Credit is rendered with a gold gradient treatment
- [ ] ISC-32: Credit renders correctly in all three themes
- [ ] ISC-33: Credit does not overlap or displace existing layout
- [ ] ISC-34: Anti: credit element does not intercept pointer events
- [ ] ISC-35: Credit is reachable without breaking the tab system
- [ ] ISC-36: `npm test` passes fully
- [ ] ISC-37: Packaged `app.asar` contains the new `main.js` server code
- [ ] ISC-38: Packaged app launches successfully
- [ ] ISC-39: Antecedent: a real video element actually loads in the packaged app (no Error 153)
- [ ] ISC-40: Anti: no regression — tab click-through fixes from earlier still pass

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| 1-11 | static | grep main.js for server + loadURL | exact match | Grep/Bash |
| 12-13 | live | CDP probe of packaged Electron app | origin is http | node+CDP |
| 14-21 | static+live | grep rewards.js; simulate embed error | handler fires | Bash/browser |
| 22-27 | network | oEmbed HTTP status per ID | 200 for all | Bash fetch |
| 28-29 | unit | regex against malformed inputs | null returned | node |
| 30-35 | live | render + hit-test in served renderer | visible, inert | browser pane |
| 36-40 | build | npm test; asar grep; CDP screenshot | all pass | Bash/node |

## Features

| name | satisfies | depends_on | parallelizable |
|------|-----------|------------|----------------|
| LoopbackServer | ISC-1..13 | — | no |
| EmbedResilience | ISC-14..21 | LoopbackServer | no |
| RealRewardLibrary | ISC-22..27 | — | yes |
| RegexHardening | ISC-28,29 | — | yes |
| GoldenCredit | ISC-30..35 | — | yes |
| ShipAndVerify | ISC-36..40 | all | no |

## Decisions

- 2026-09-08 Delegation floor relaxed (E3 soft ≥2, used 0). Show-your-math: the fix is a
  surgical single-file main-process change plus data replacement, both deterministically
  verifiable via oEmbed HTTP status and a CDP probe. Forge/Anvil would duplicate work that a
  binary probe already settles; coordination overhead would slow delivery, and Kamran's TELOS
  biases to production stability and immediate actionability over parallel ceremony.
- 2026-09-08 Chose loopback HTTP over `app://` custom scheme: YouTube declines non-http
  origins, so a custom scheme would not clear Error 153.
- 2026-09-08 refined: added durable `searchUrl` per reward after FirstPrinciples showed
  ID-pinning guarantees eventual decay.
