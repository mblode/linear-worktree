# linear-worktree

Create git worktrees for Linear issues and launch Claude sessions.

## Commands

```bash
npm install                 # setup (requires Node >= 22)
npm run build               # tsdown -> dist/
npm run dev                 # tsdown --watch
npm run test                # vitest run
npm run typecheck           # tsc --noEmit
npm run lint                # oxlint .
npm run check               # ultracite check (lint + format, CI-equivalent)
npm run fix                 # ultracite fix (format + lint autofix)
npm link                    # install linear-worktree globally from this checkout
```

## Architecture

```text
src/
  cli.ts       # Commander entry point
  index.ts     # Public API exports
  types.ts     # Shared types
  issue.ts     # Linear issue input parsing
  repo.ts      # Repo detection
  linear.ts    # Linear GraphQL fetch
  prompt.ts    # Copy-as-prompt rendering
  images.ts    # Screenshot extraction/download
  git.ts       # Worktree creation and locking
  cmux.ts      # cmux reachability + opening worktree-rooted workspaces
  launch.ts    # Inline plan-mode process launch and --print behavior
  progress.ts  # stderr step/spinner progress reporter
  runner.ts    # Orchestration: prepare issue -> worktree -> cmux/inline launch
  shell.ts     # child_process wrapper
```

## Gotchas

- **ESM only**: use `.js` extensions in TypeScript imports.
- **Global local install**: run `npm run build && npm link`; do not rely on the old dotfiles script.
- **No live fan-out in tests**: stub `cmux` and `claude` with a temp `PATH`.
- **Linear token safety**: only send `LINEAR_API_KEY` to trusted Linear API/upload hosts.
- **Launch cwd matters**: Claude must start from the new worktree, not the source repo that spawned the command.
- **Behavior parity matters**: this project replaces `/Users/mblode/dotfiles/bin/linear-worktree`; preserve the current modes before adding new features.
