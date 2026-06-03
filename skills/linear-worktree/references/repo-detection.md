# Repo Detection

The CLI chooses a repo per issue. First match wins:

1. `--repo <path>`
2. Team map at `~/.config/linear-worktree/repos.json`
3. Current git repo
4. `LINEAR_WORKTREE_REPO`

## Team Map

```json
{
  "ENG": "~/Code/acme/web",
  "WEB": "~/Code/acme/api"
}
```

Use a team map when the user pastes mixed-team IDs from outside the target repos. The map is optional. Missing keys fall back to the current repo.

## Worktree Location

Worktrees are siblings of the resolved repo:

```text
~/Code/acme/web      -> ~/Code/acme/web-eng-423
~/Code/acme/api       -> ~/Code/acme/api-web-12
```

Do not create nested worktrees inside the source repo.
