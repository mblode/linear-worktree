# linear-worktree

Create git worktrees for Linear issues and launch Claude sessions.

## Installation

```bash
npm i -g linear-worktree
```

## Usage

```bash
linear-worktree ENG-403
linear-worktree ENG-403 ENG-404 WEB-12
linear-worktree --print ENG-403
linear-worktree --repo ~/Code/acme/web ENG-403
```

## How it works

For one issue, it runs in order:

1. Find the repo — `--repo`, then `~/.config/linear-worktree/repos.json`, then the current repo, then `LINEAR_WORKTREE_REPO`.
2. Fetch the issue from Linear (needs `LINEAR_API_KEY`), including screenshots.
3. Create a sibling git worktree and branch.
4. Launch the session — a focused [cmux](https://cmux.com/) workspace running `claude` in plan mode, or `claude` inline if cmux isn't running.

For multiple issues, it opens one [cmux](https://cmux.com/) workspace each. cmux is required here — there's no inline fallback.

`--print` stops after step 3: it prints the prompt and copies a `cd` into the worktree.

## Programmatic API

```typescript
import { runLinearWorktree } from "linear-worktree";
```

## Usage with AI Agents

The canonical skill lives at `skills/linear-worktree/SKILL.md` in this repo.

## Requirements

- Node.js >= 22
- git
- `claude` on PATH for launch mode
- [`cmux`](https://cmux.com/) on PATH — required for multiple issues; the preferred launcher for a single issue when available

## License

[MIT](LICENSE.md)
