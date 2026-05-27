# Thread Handoff 2026-05-25

This is a dense handoff for moving the current long Codex thread into a fresh thread without losing judgment, taste, or recent context. Read this together with `AGENTS.md` and `docs/CODEX_HANDOFF.md`.

## Current Snapshot

- Current branch: `codex/map-menu-feature-pack-20`
- Latest runtime version: `v0.1.407`
- Version sources:
  - `src/main.ts` `DEBUG_VERSION`
  - `public/version.json`
  - `RELEASE_NOTES.md`
- Recent commits:
  - `68c2ef0 Keep clear controls active after screenshot`
  - `85cb277 Fix HUD name overlap`
  - `b5acd6a Compact leaderboard layout`
  - `325d2d5 Fix medium world map responsive layout`
  - `86a4826 Sharpen UI text rendering`
  - `9d0cb5b Improve UI text clarity`
  - `c8b0aae Remove clear bonus breakdown display`
  - `249c95e Strengthen clear world map CTA`
  - `d049b06 Keep world map menu panels stable`
  - `ddaa4b7 Improve boot loading fallback`
  - `4e62c09 Modernize game UI skin`
  - `a3fd1be Polish game UI visuals`
- Working tree was clean when this handoff was created.

## User Preferences And Taste

- Conversation language: Japanese.
- The user strongly dislikes losing context in new threads. Do not behave like a blank-slate assistant.
- The user prefers implementation and verification over abstract proposals.
- Avoid excessive confirmation. If the request is actionable and reasonable, inspect the relevant files, implement, verify, and commit.
- The user is sensitive to UI that feels:
  - old-fashioned
  - bulky
  - wasteful with space
  - hard to tap on mobile landscape
  - visually noisy
  - covered by panels
  - inconsistent with modern mobile-game UI
- The user especially notices:
  - unnecessary empty space
  - controls moving away while the user is trying to tap them
  - buttons hidden behind other UI
  - text overflow, overlap, or blurry/stretched text
  - decorative gold frames that eat usable area
  - weak post-clear routes back to the world map
- Gold/Manzoku-like accent is acceptable, but the old ornate gold frame look should not dominate the UI.
- For UI work, prefer Game Studio guidance, Playwright/browser checks, and measured screenshots or DOM geometry when useful.

## Operational Rules To Preserve

- Start each work turn with `git status --short --branch`.
- Follow `AGENTS.md`.
- On Windows, use:
  - `npm.cmd`
  - `npx.cmd`
  - `firebase.cmd`
- For runtime, visual, or shipped behavior changes:
  - bump `DEBUG_VERSION` in `src/main.ts`
  - update `public/version.json`
  - add `RELEASE_NOTES.md`
  - run `npm.cmd run build`
  - commit the coherent change
- For docs-only changes:
  - no version bump
  - no build needed unless requested
  - commit the doc update if it is useful and complete
- Use `apply_patch` for manual edits.
- Do not scan the whole repo. Inspect focused files only.
- For UI/HUD/start/world-map work, likely files are:
  - `src/main.ts`
  - `src/styles.css`
  - `src/startModal.ts`
  - `src/globalUi.ts`
  - `src/i18n.ts`
- For stages: start with `src/stages.ts`.
- For rendering: start with `src/stageRenderer.ts`.
- For enemies: start with `src/enemies.ts`, placement in `src/stages.ts`.

## Recent UI Work And Intent

### Ranking Modal

- User complained that the ranking modal wasted vertical space and only showed about 2 rows.
- Fixed in `b5acd6a`.
- Goal: show about 5 ranking rows on medium desktop-like screens.
- Verification used a screenshot-like viewport `1149x733`; injected representative leaderboard DOM; measured `fullyVisible: 5`.
- Key file: `src/styles.css`.

### HUD Cyan Strip And Name Overlap

- User asked what the left cyan strip in the HUD was and whether the name was overlapping the PC chip.
- The strip was `hudPanelAccent`; it looked accidental/noisy.
- Fixed in `85cb277`.
- Changes:
  - hide `hudPanelAccent`
  - stop showing leaderboard player ID in the in-game HUD name line
  - constrain player-name text to available width before the PC/MOBILE chip and ellipsize when needed
- Key file: `src/main.ts`.

### Post-Clear Screenshot Freeze

- User asked whether becoming unable to move after taking a screenshot after goal was intended.
- It was treated as a bug.
- Fixed in `68c2ef0`.
- Intent:
  - during active gameplay, screenshot preview may pause the scene
  - after clear, screenshot preview should not pause the whole scene because clear-result buttons must remain responsive after closing
- Key file: `src/main.ts`.

### Medium World Map Layout

- User complained that at some resolution panels overlapped the world map and map nodes.
- Fixed in `325d2d5`.
- Intent:
  - reserve a fixed 16:9 map display area where appropriate
  - move progress and stage-detail panels below on medium tablet-like resolutions
  - avoid covering the selected Shibuya City node with persistent UI
- Key file: `src/styles.css`.

### UI Text Clarity

- User disliked blurry/stretched UI text.
- Recent fixes:
  - `9d0cb5b Improve UI text clarity`
  - `86a4826 Sharpen UI text rendering`
- Direction:
  - avoid high-resolution scaling tricks that make text look hazy
  - prefer crisp DOM/CSS text and clean Phaser text settings
  - do not add heavy blur shadows back

### Clear Result UI

- User said remaining time and bonus were not requested and made the HUD overflow.
- Fixed in `c8b0aae`.
- Do not reintroduce bonus breakdown text unless explicitly requested.
- User also wanted a stronger route back to world map after clear.
- Fixed in `249c95e`: "To World Map" became primary CTA.

## Current Friction

- The current thread is very long and may make Codex sluggish.
- The user does not want to move to a new thread if it makes the assistant "dumber".
- A new thread should read this file before touching code and preserve the above taste and workflow.
- Avoid giving only broad advice. The user wants concrete fixes with verification.

## Recommended First Message In A New Thread

If starting a fresh thread, ask the new Codex to read:

1. `AGENTS.md`
2. `docs/CODEX_HANDOFF.md`
3. `docs/THREAD_HANDOFF_2026-05-25.md`

Then have it run:

```powershell
git status --short --branch
```

The new Codex should then continue from branch `codex/map-menu-feature-pack-20`, preserving the runtime version rules and the UI taste described here.

## Things Not To Do

- Do not make a landing page instead of the actual game UI.
- Do not add bulky nested cards inside cards.
- Do not let persistent panels cover important world-map nodes.
- Do not make touch targets jump to another side when selection changes.
- Do not use browser `alert` for polished game UI confirmation dialogs.
- Do not reintroduce old ornate gold frame styling as the dominant visual language.
- Do not stop at "probably" when a Playwright or DOM geometry check can verify the layout cheaply.
- Do not push or deploy unless explicitly asked.
