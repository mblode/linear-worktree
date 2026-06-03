# Repo Detection

The CLI chooses a repo per issue. First match wins:

1. `--repo <path>`
2. Team map at `~/.config/linear-worktree/repos.json`
3. Current git repo
4. `LINEAR_WORKTREE_REPO`

## Team Map

```json
{
  "TIG": "~/Code/linktree/frontyard",
  "CURA": "~/Code/linktree/discover"
}
```

Use a team map when the user pastes mixed-team IDs from outside the target repos. The map is optional. Missing keys fall back to the current repo.

## Worktree Location

Worktrees are siblings of the resolved repo:

```text
~/Code/linktree/frontyard      -> ~/Code/linktree/frontyard-tig-423
~/Code/linktree/discover       -> ~/Code/linktree/discover-cura-12
```

Do not create nested worktrees inside the source repo.
