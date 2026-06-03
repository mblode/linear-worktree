# linear-worktree

Create a git worktree for a Linear issue and open it in Claude.

## Installation

```bash
npm i -g linear-worktree
```

## Usage

From inside your repo, pass one or more Linear issue IDs:

```bash
linear-worktree ENG-403
linear-worktree ENG-403 ENG-404
```

Each issue gets its own [cmux](https://cmux.com/) workspace running `claude` in plan mode.

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

## License

[MIT](LICENSE.md)
