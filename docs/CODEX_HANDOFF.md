# Codex Handoff

This file is the short context packet for future Codex sessions. Read this first before scanning the whole repository.

## Project

- Browser-playable 2D side-scrolling dot/pixel action game.
- Stack: Phaser 3 + Vite + TypeScript.
- Game root: the repository root that contains this `docs` directory.
  - In the original authoring environment this was `F:\Codex\2026-05-01\2d-wasd-ui-md\game`, but future sessions should use the current checkout path instead of assuming that absolute path.
- Remote: `https://github.com/zanneninsan/actiongame_v1.git`
- GitHub Pages: `https://zanneninsan.github.io/actiongame_v1/`
- Main branch: `main`

## Current State

- Latest known version at handoff creation: `v0.1.64`.
- Version is displayed in-game through `DEBUG_VERSION` in `src/main.ts`.
- Build command: `npm run build`.
- Dev server command: `npm run dev`.
  - When starting a dev server from a Codex worktree, avoid the default port if another worktree may already be using it. Pick a separate port such as `5176` and run `npm run dev -- --host 127.0.0.1 --port 5176`.
  - Before reusing a port, check which worktree owns it; do not stop another worktree's server unless the user asks.
- GitHub Pages deployment runs from GitHub Actions.
- Firebase manual deployment:
  - Target project is defined in `.firebaserc` as `zannenin-sisters-leaderboard`.
  - Hosting URL is `https://zannenin-sisters-leaderboard.web.app/`.
  - Run `npm run build` first, then run `firebase deploy` from the repository root to deploy Firestore rules/indexes, Functions, and Hosting together.
  - If only Functions should be deployed, run `firebase deploy --only functions`.
  - `firebase.json` hosts the built Vite app from `dist` and runs the Functions predeploy build automatically.
- The worktree may contain user or external changes. Always check `git status --short --branch` before editing.

## Important Files

- `src/main.ts`
  - Phaser scene lifecycle, player control, player collision/damage, run state, score/timer integration, and thin hooks into extracted modules.
  - Keep core game behavior and wiring here. Do not move feature-specific rendering, DOM controls, item/enemy internals, or detailed editor workflows back into this file.
- `src/stages.ts`
  - Active stage data: world width, start, goal, explicit platform runs including ground floors/gaps, lamps, decorations, item placements, and enemy placements.
  - Most stage layout changes should happen here.
- `src/assets.ts`
  - Asset keys, item definitions, stage object definitions, shared stage types.
- `src/stageRenderer.ts`
  - Renders stage platform runs, street lamps, decorations, and decoration top-platform hitboxes from stage data.
- `src/items.ts`
  - Item glow creation, item sprite placement, pickup overlap handling, and pickup cleanup. Score updates are passed back into `src/main.ts`.
- `src/enemies.ts`
  - Enemy texture generation, enemy sprite creation, patrol movement, and enemy physics setup. Damage response stays in `src/main.ts`.
- `src/backgrounds.ts`
  - Rear/midground background creation, scrolling, and debug background cycling.
- `src/globalUi.ts`
  - DOM global UI for version, HIT toggle, background toggles, sound toggle, and options modal.
- `src/mobileControls.ts`
  - DOM mobile control buttons and pointer binding.
- `src/i18n.ts`
  - English/Japanese UI text dictionary and locale helpers.
- `src/stageConstants.ts`
  - Default and per-stage world bounds, ground height, visual ground height, street-lamp baseline.
- `src/stageEditorPanel.ts`
  - DOM panel for in-game stage editing.
- `src/stageEditor.ts`
  - In-game stage editor behavior: tool state, selection, add/move/delete, Undo/Redo history, input binding, and JSON export.
- `src/startModal.ts`
  - Start modal, player name, PC/mobile mode, sound on/off.
- `src/countdown.ts`
  - Start countdown UI and timing.
- `src/rainbowPipeline.ts`
  - Clear-time rainbow shader pipeline.
- `src/styles.css`
  - DOM UI styling: start modal, mobile controls, editor, debug UI.
- `public/assets`
  - Sprites, backgrounds, platforms, items, stage objects, sound assets.
- `assets_source`
  - Reversible, lossless source and intermediate raster assets. Runtime assets should not depend on files here.
- `docs/ASSET_PROCESSING.md`
  - Asset processing rules: final runtime rasters should be WebP, reversible intermediates should be preserved, and transparency cleanup should bias toward preserving subject pixels.
- `RELEASE_NOTES.md`
  - Version notes. Update when making user-visible changes.

## Working Rules

- Prefer scoped reads:
  - Use `Select-String` or `Get-Content | Select-Object -Index (...)` for exact regions.
  - Exclude `node_modules` from file searches.
  - Do not read all of `src/main.ts` unless the task requires it.
- Prefer editing the smallest relevant module:
  - Stage placement: `src/stages.ts`
  - Stage rendering behavior: `src/stageRenderer.ts`
  - Enemy behavior: `src/enemies.ts`
  - Enemy placement: `src/stages.ts`
  - Item behavior: `src/items.ts`
  - Item placement: `src/stages.ts`
  - Background switching/rendering: `src/backgrounds.ts`
  - Global debug/options UI: `src/globalUi.ts`
  - Mobile controls: `src/mobileControls.ts`
  - Stage editor behavior: `src/stageEditor.ts`
  - UI style only: `src/styles.css`
  - Start screen: `src/startModal.ts`
  - Editor panel: `src/stageEditorPanel.ts`
  - Asset catalog: `src/assets.ts`
- For HUD and rich in-game UI visuals, use GPT Image2-generated raster assets in `public/assets` as the baseline visual layer. Keep CSS/DOM styling limited to positioning, text overlays, and interaction hooks.
- When changing labels or controls in the start modal, check the options modal for equivalent labels or controls and update matching items there as well when appropriate.
- Use `apply_patch` for manual edits.
- Run `npm run build` after code changes.
- Commit each completed, coherent fix or feature chunk after verification. Do not leave finished work uncommitted unless the user explicitly asks not to commit.
- Before committing, check:
  - `git status --short`
  - `git diff --stat`
- When merging a work branch back into `main`, expect README and version/release-note files to conflict. Resolve them deliberately by preserving the newest user-facing version entry, keeping both relevant README changes when possible, and re-running `npm run build` before the merge commit is considered done.
- If pushing, bump `DEBUG_VERSION` and add release notes.
- Also bump `DEBUG_VERSION` and update `RELEASE_NOTES.md` for large or user-visible updates, even when not pushing yet.
- When updating `RELEASE_NOTES.md`, write the `### Japanese` section in natural Japanese text. Do not use romanized Japanese such as "wo", "ni", or "shimashita".
- Do not revert user or external changes unless explicitly asked.

## Version Rule

When pushing changes, or when making a large/user-visible update even before pushing:

1. Increment `DEBUG_VERSION` in `src/main.ts`.
2. Add a matching section to `RELEASE_NOTES.md`.
   - Write `### Japanese` entries in proper Japanese, not romanized Japanese.
3. Run `npm run build`.
4. Commit the completed chunk with a concise message.
5. If pushing, push `main`.

If only making small local notes, documentation tweaks, or internal refactors with no user-visible behavior change, version bump is not required.

## Common Tasks

### Stage Layout

Start with `src/stages.ts`.

- `ACTIVE_STAGE` currently resolves from `STAGES.neonCanal`.
- `StageDefinition` supports:
  - `worldWidth`
  - `worldTop`
  - `worldBottom`
  - `groundTopY`
  - `groundVisualY`
  - `streetLampGroundY`
  - `playerStart`
  - `goal`
  - `platforms`
  - `streetLamps`
  - `decorations`
  - `items`
  - `enemies`
- Decorations can omit `y`; default becomes the resolved stage `groundTopY`.
- Street lamps and decorations can omit `scale`; default is `1`.
- Baseline ground is no longer auto-generated. Ground floors and holes are explicit `platforms` entries in `src/stages.ts`.

### Mobile Controls

Mobile controls are DOM-based in `src/mobileControls.ts` and styled in `src/styles.css`.

- Mobile mode is selected from the start modal.
- Touch buttons update `mobileInput`.
- Jump also queues `mobileJumpQueued`.

### Debug / Editor

- Debug/global UI is created in `src/globalUi.ts` through a thin hook in `src/main.ts`.
- `HIT` toggles collision rectangles.
- Rear/midground background switching lives in `src/backgrounds.ts`.
- `EDITOR` opens the stage editor panel through the thin hook in `src/main.ts`.
- Stage editor behavior lives in `src/stageEditor.ts`.
- Stage editor UI markup/events live in `src/stageEditorPanel.ts`.
- Stage editor can select, move, delete, add platform/item/lamp/decoration/start/goal, Undo/Redo edits, then export JSON.

### Assets

Asset keys are centralized in `src/assets.ts`.

- If adding new stage object images, add the asset definition there.
- Put runtime assets under `public/assets`.
- Runtime raster outputs should be WebP where supported.
- Keep reversible source/intermediate files under `assets_source`.
- When removing backgrounds, use conservative transparency settings; preserve subject pixels, outlines, hair, glows, and pale clothing rather than cutting too much away.
- Keep heavy unused source files out of tracked/public runtime assets when possible.

## Quota-Saving Prompt For New Sessions

Use this at the start of a new chat:

```text
Read `docs/CODEX_HANDOFF.md` first. Then check `git status --short --branch`.
Use Japanese for conversation with the user.
Do not scan the whole repo. Only inspect files directly relevant to my next request.
When searching files, exclude `node_modules` from the search target.
For stage layout changes, start with `src/stages.ts`.
For stage rendering behavior, start with `src/stageRenderer.ts`.
For enemy behavior, start with `src/enemies.ts`; use `src/stages.ts` for enemy placement.
For item behavior, start with `src/items.ts`; use `src/stages.ts` for item placement.
For gameplay changes, search exact symbols in the focused module first; use `src/main.ts` for player movement, run state, collisions, score/timer integration, and scene wiring.
For global/debug UI, start with `src/globalUi.ts`; for mobile controls, start with `src/mobileControls.ts`; for background switching, start with `src/backgrounds.ts`.
For stage editor behavior changes, start with `src/stageEditor.ts`; use `src/stageEditorPanel.ts` for panel UI only.
Run `npm run build` after code edits.
Commit each completed, coherent fix or feature chunk after verification unless I explicitly ask not to commit.
If pushing, bump `DEBUG_VERSION` and update `RELEASE_NOTES.md`.
For large or user-visible updates, bump `DEBUG_VERSION` and update `RELEASE_NOTES.md` even before pushing.
When updating `RELEASE_NOTES.md`, write the `### Japanese` section in natural Japanese, not romanized Japanese.
```

## Notes For Future Codex

- The user is iterating visually and often asks for small feel/design changes.
- Keep responses concise in Japanese unless asked otherwise.
- Be careful with image-heavy workflows; summarize file paths and outputs instead of embedding large context.
- The game is a character-focused prototype, so changes that affect movement feel, animation readability, and stage visibility matter more than pure technical neatness.
