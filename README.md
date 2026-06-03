# linear-worktree

Create git worktrees for Linear issues and launch Claude sessions.

## Installation

For local global use from this checkout:

```bash
npm install
npm run build
npm link
```

Verify:

```bash
command -v linear-worktree
linear-worktree --help
```

## Usage

```bash
linear-worktree TIG-403
linear-worktree TIG-403 TIG-404 CURA-12
linear-worktree --print TIG-403
linear-worktree --repo ~/Code/linktree/frontyard TIG-403
```

## Behavior

- One issue creates a sibling git worktree and launches `claude --dangerously-skip-permissions` inside it.
- Many bare issue IDs fan out one cmux workspace per issue.
- `--print` creates the worktree, prints the prompt, and skips launch.
- Repo detection checks `--repo`, then `~/.config/linear-worktree/repos.json`, then the current repo or `LINEAR_WORKTREE_REPO`.
- `LINEAR_API_KEY` enables Linear GraphQL prompt enrichment and screenshot downloads.

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
- `cmux` on PATH for multi-issue fan-out

## License

[MIT](LICENSE.md)
