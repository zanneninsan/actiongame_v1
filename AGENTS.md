# Codex Instructions

- Read `docs/CODEX_HANDOFF.md` first. Then check `git status --short --branch`.
- Use Japanese for conversation with the user.
- Do not scan the whole repo. Only inspect files directly relevant to the user's next request.
- For stage layout changes, start with `src/stages.ts`.
- For gameplay changes, search exact symbols in `src/main.ts` before reading large ranges.
- Run `npm run build` after code edits.
- If pushing, bump `DEBUG_VERSION` and update `RELEASE_NOTES.md`.
