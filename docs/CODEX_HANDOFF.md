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

- Latest known version at handoff creation: `v0.1.60`.
- Version is displayed in-game through `DEBUG_VERSION` in `src/main.ts`.
- Build command: `npm run build`.
- Dev server command: `npm run dev`.
- GitHub Pages deployment runs from GitHub Actions.
- The worktree may contain user or external changes. Always check `git status --short --branch` before editing.

## Important Files

- `src/main.ts`
  - Phaser scene, player control, collision, run state, score, timer, and a thin stage editor hookup.
  - Keep core game behavior here. Do not add detailed editor workflows here unless they are just integration callbacks.
- `src/stages.ts`
  - Active stage data: world width, start, goal, platform runs, lamps, decorations, item placements.
  - Most stage layout changes should happen here.
- `src/assets.ts`
  - Asset keys, item definitions, stage object definitions, shared stage types.
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
- `RELEASE_NOTES.md`
  - Version notes. Update when making user-visible changes.

## Working Rules

- Prefer scoped reads:
  - Use `Select-String` or `Get-Content | Select-Object -Index (...)` for exact regions.
  - Do not read all of `src/main.ts` unless the task requires it.
- Prefer editing the smallest relevant module:
  - Stage placement: `src/stages.ts`
  - Stage editor behavior: `src/stageEditor.ts`
  - UI style only: `src/styles.css`
  - Start screen: `src/startModal.ts`
  - Editor panel: `src/stageEditorPanel.ts`
  - Asset catalog: `src/assets.ts`
- Use `apply_patch` for manual edits.
- Run `npm run build` after code changes.
- Before committing, check:
  - `git status --short`
  - `git diff --stat`
- If pushing, bump `DEBUG_VERSION` and add release notes.
- Also bump `DEBUG_VERSION` and update `RELEASE_NOTES.md` for large or user-visible updates, even when not pushing yet.
- Do not revert user or external changes unless explicitly asked.

## Version Rule

When pushing changes, or when making a large/user-visible update even before pushing:

1. Increment `DEBUG_VERSION` in `src/main.ts`.
2. Add a matching section to `RELEASE_NOTES.md`.
3. Run `npm run build`.
4. If pushing, commit with a concise message.
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
- Decorations can omit `y`; default becomes the resolved stage `groundTopY`.
- Street lamps and decorations can omit `scale`; default is `1`.

### Mobile Controls

Mobile controls are DOM-based in `src/main.ts` and styled in `src/styles.css`.

- Mobile mode is selected from the start modal.
- Touch buttons update `mobileInput`.
- Jump also queues `mobileJumpQueued`.

### Debug / Editor

- Debug UI is created in `src/main.ts`.
- `HIT` toggles collision rectangles.
- `EDITOR` opens the stage editor panel through the thin hook in `src/main.ts`.
- Stage editor behavior lives in `src/stageEditor.ts`.
- Stage editor UI markup/events live in `src/stageEditorPanel.ts`.
- Stage editor can select, move, delete, add platform/item/lamp/decoration/start/goal, Undo/Redo edits, then export JSON.

### Assets

Asset keys are centralized in `src/assets.ts`.

- If adding new stage object images, add the asset definition there.
- Put runtime assets under `public/assets`.
- Keep heavy unused source files out of tracked/public runtime assets when possible.

## Quota-Saving Prompt For New Sessions

Use this at the start of a new chat:

```text
Read `docs/CODEX_HANDOFF.md` first. Then check `git status --short --branch`.
Use Japanese for conversation with the user.
Do not scan the whole repo. Only inspect files directly relevant to my next request.
For stage layout changes, start with `src/stages.ts`.
For gameplay changes, search exact symbols in `src/main.ts` before reading large ranges.
For stage editor behavior changes, start with `src/stageEditor.ts`; use `src/stageEditorPanel.ts` for panel UI only.
Run `npm run build` after code edits.
If pushing, bump `DEBUG_VERSION` and update `RELEASE_NOTES.md`.
For large or user-visible updates, bump `DEBUG_VERSION` and update `RELEASE_NOTES.md` even before pushing.
```

## Notes For Future Codex

- The user is iterating visually and often asks for small feel/design changes.
- Keep responses concise in Japanese unless asked otherwise.
- Be careful with image-heavy workflows; summarize file paths and outputs instead of embedding large context.
- The game is a character-focused prototype, so changes that affect movement feel, animation readability, and stage visibility matter more than pure technical neatness.
