---
name: linear-worktree
description: Creates git worktrees for Linear issues with the globally installed linear-worktree CLI, then launches Claude from the created worktree or fans out cmux workspaces for multiple issues. Use when the user says "linear-worktree", "start this Linear issue", "make a worktree", "spin up workspaces", gives issue IDs like "TIG-423", or asks to verify the linear-worktree CLI.
---

# linear-worktree

Delegate to the globally available `linear-worktree` CLI. Do not reimplement worktree, Linear, prompt, screenshot, or cmux logic inline.

## Reference Files

| File                                 | Read When                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `references/usage-modes.md`          | Choosing one issue, many issues, or `--print`                                                  |
| `references/repo-detection.md`       | The user is outside the target repo, using `--repo`, or configuring team maps                  |
| `references/drive-workspaces.md`     | After multi-issue fan-out, when this session needs to inspect or drive spawned cmux workspaces |
| `references/troubleshooting.md`      | The CLI is missing, repo detection fails, cmux is unavailable, or launch mode fails            |
| `references/verification.md`         | Validating install, safe behavior, and full parity                                             |
| `references/evaluation-scenarios.md` | Evaluating future skill/CLI changes                                                            |

## Workflow

Copy this checklist to track progress:

```text
linear-worktree progress:
- [ ] Confirm global CLI is available
- [ ] Choose mode
- [ ] Run the CLI
- [ ] Verify result or drive spawned sessions
```

1. Confirm install:
   ```bash
   command -v linear-worktree
   linear-worktree --help
   ```
2. Choose mode:
   - One issue: `linear-worktree TIG-423`
   - Many bare issue IDs: `linear-worktree TIG-423 TIG-424`
   - Safe prompt/worktree only: `linear-worktree --print TIG-423`
3. Run from the intended repo, or pass `--repo <path>`.
4. In launch mode, the CLI creates the worktree, starts Claude with `--dangerously-skip-permissions`, and runs Claude from the new worktree directory.

## Local Global Install

If the command is missing, install from the canonical repo:

```bash
cd ~/Code/mblode/linear-worktree
npm install
npm run build
npm link
command -v linear-worktree
```

## Gotchas

- **Launch cwd matters.** Claude must start from the new worktree, not the repo that spawned the command.
- **Multiple IDs fan out.** Two or more bare issue IDs create cmux workspaces instead of doing all work in the current shell.
- **Use `--print` for safe validation.** It creates the worktree and prints the prompt without opening Claude.
- **Repo maps are optional.** Without `~/.config/linear-worktree/repos.json`, unmapped teams fall back to the repo you launched from.
- **Do not call the old dotfiles script.** The TypeScript CLI is canonical.

## Related Skills

- `cmux` / `cmux-workspace` for driving spawned workspaces.
- `handoff` when the Linear issue needs a richer brief than its description.
