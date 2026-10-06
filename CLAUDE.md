@AGENTS.md

## Claude Code specifics

- Create work branches as `claude/<short-topic>`; open a pull request rather than pushing to `main`.
- Run `npm ci && npm run build && npm run verify` before committing code changes. For docs-only changes, no verification run is needed.
- Codex works in the same repo. Before starting, check open `codex/*` branches for overlapping work, and record handoff notes as described in `AGENTS.md`.
