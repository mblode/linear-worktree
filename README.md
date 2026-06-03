# linear-worktree

[![npm](https://img.shields.io/npm/v/linear-worktree)](https://www.npmjs.com/package/linear-worktree)

Create a git worktree for a Linear issue and open it in Claude.

## Installation

```bash
npm i -g linear-worktree
```

## Usage

From inside your repo, pass one or more Linear issue IDs:

```bash
linear-worktree ENG-403
linear-worktree ENG-403 ENG-404 ENG-405
```

For each issue, the CLI creates a git worktree, opens it in a new
[cmux](https://cmux.com/) workspace, and launches `claude` in plan mode from
that worktree. The full ticket (title, description, and screenshots) is dropped
in as the prompt. Pass several IDs to fan out one workspace per issue.

## Linear API key

Set `LINEAR_API_KEY` to load issue details and screenshots into the prompt:

```bash
export LINEAR_API_KEY=lin_api_...
```

Create a key in Linear's [API settings](https://linear.app/settings/api).

## Agent skill

This repo ships an agent skill that teaches your coding agent to run the CLI for you. Install it globally:

```bash
npx skills add mblode/linear-worktree -g --all -y
```

## Requirements

- Node.js >= 22
- `git`, `claude`, and [`cmux`](https://cmux.com/) on your PATH

## Works well with

Drive all the worktrees from one central Claude session using the
[cmux](https://cmux.com/) skill: approve plans and run follow-up skills like
`/simplify`, `/pr-reviewer`, or `/visual-qa` across every workspace at once.

## License

[MIT](LICENSE.md)
