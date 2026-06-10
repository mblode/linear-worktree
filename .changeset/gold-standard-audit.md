---
"linear-worktree": patch
---

Harden and simplify the CLI internals: surface shell failures as clean
one-line errors, launch Claude with a `cwd` instead of `process.chdir`,
isolate per-image download failures, add fetch timeouts, and derive the
scratch directory from `os.tmpdir()` for portability. Refactors the git
plumbing behind a small runner, warns when a configured Linear key still
yields no issue, prunes the public API, and drops unused dependencies.
