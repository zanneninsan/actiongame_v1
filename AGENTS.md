# Codex Instructions

- Read `docs/CODEX_HANDOFF.md` first. Then check `git status --short --branch`.
- Use Japanese for conversation with the user.
- Do not scan the whole repo. Only inspect files directly relevant to the user's next request.
- For stage layout changes, start with `src/stages.ts`.
- For gameplay changes, search exact symbols in `src/main.ts` before reading large ranges.
- Keep `src/main.ts` focused on core game behavior and thin integration hooks.
- For stage editor behavior changes, start with `src/stageEditor.ts`; use `src/stageEditorPanel.ts` for editor panel DOM/UI only.
- Run `npm run build` after code edits.
- If pushing, bump `DEBUG_VERSION` and update `RELEASE_NOTES.md`.
- Also bump `DEBUG_VERSION` and update `RELEASE_NOTES.md` for large or user-visible updates, even when not pushing yet.
