import { existsSync } from "node:fs";
import { mkdir, rmdir } from "node:fs/promises";
import { basename, dirname, isAbsolute, join } from "node:path";
import { setTimeout } from "node:timers/promises";

import { CliError } from "./errors.js";
import { run, runRequired } from "./shell.js";
import type { WorktreeResult } from "./types.js";

interface EnsureWorktreeOptions {
  env: NodeJS.ProcessEnv;
  issueId: string;
  repoRoot: string;
  slug: string;
  skipFetch?: boolean;
}

const git = (repoRoot: string, env: NodeJS.ProcessEnv) => ({
  ok: (...args: string[]): boolean =>
    run("git", ["-C", repoRoot, ...args], { env }).status === 0,
  out: (...args: string[]): string | undefined => {
    const result = run("git", ["-C", repoRoot, ...args], { env });
    return result.status === 0 ? result.stdout.trim() : undefined;
  },
  require: (...args: string[]): string =>
    runRequired("git", ["-C", repoRoot, ...args], { env }),
});

type GitRunner = ReturnType<typeof git>;

export const fetchOrigin = (repoRoot: string, env: NodeJS.ProcessEnv): void => {
  git(repoRoot, env).ok("fetch", "origin", "--quiet");
};

const reuseExistingWorktree = (
  worktreePath: string,
  branch: string,
  env: NodeJS.ProcessEnv
): WorktreeResult | undefined => {
  if (!existsSync(worktreePath)) {
    return undefined;
  }

  const worktree = git(worktreePath, env);
  if (worktree.out("rev-parse", "--show-toplevel") !== worktreePath) {
    throw new CliError(
      `${worktreePath} already exists and is not a git worktree`
    );
  }

  return {
    branch:
      worktree.out("symbolic-ref", "--quiet", "--short", "HEAD") ?? branch,
    worktreePath,
  };
};

const addWorktree = (
  repo: GitRunner,
  worktreePath: string,
  branch: string
): void => {
  if (repo.ok("show-ref", "--verify", "--quiet", `refs/heads/${branch}`)) {
    repo.require("worktree", "add", worktreePath, branch);
    return;
  }

  if (
    repo.ok("show-ref", "--verify", "--quiet", `refs/remotes/origin/${branch}`)
  ) {
    repo.require(
      "worktree",
      "add",
      "--track",
      "-b",
      branch,
      worktreePath,
      `origin/${branch}`
    );
    return;
  }

  const defaultBranch = repo
    .out("symbolic-ref", "--short", "refs/remotes/origin/HEAD")
    ?.replace(/^origin\//u, "");
  if (!defaultBranch) {
    throw new CliError(
      "cannot resolve origin's default branch (try: git remote set-head origin --auto)"
    );
  }

  const baseRef = `refs/remotes/origin/${defaultBranch}`;
  if (!repo.ok("rev-parse", "--verify", `${baseRef}^{commit}`)) {
    throw new CliError(`missing ${baseRef}`);
  }

  repo.require("worktree", "add", "-b", branch, worktreePath, baseRef);
};

const acquireLock = async (lockDir: string): Promise<void> => {
  for (let tries = 0; tries < 300; tries += 1) {
    try {
      await mkdir(lockDir);
      return;
    } catch {
      await setTimeout(300);
    }
  }

  throw new CliError(`timed out waiting for worktree lock: ${lockDir}`);
};

const releaseLock = async (lockDir: string): Promise<void> => {
  await rmdir(lockDir).catch(() => {
    // ignore: lock dir may already be gone
  });
};

export const ensureWorktree = async (
  options: EnsureWorktreeOptions
): Promise<WorktreeResult> => {
  const branch = `${options.issueId}${options.slug ? `-${options.slug}` : ""}`;
  const worktreePath = join(
    dirname(options.repoRoot),
    `${basename(options.repoRoot)}-${options.issueId}`
  );
  const repo = git(options.repoRoot, options.env);

  // Re-running for an issue is a no-op: reuse the existing worktree as-is.
  const existing = reuseExistingWorktree(worktreePath, branch, options.env);
  if (existing) {
    return existing;
  }

  if (!repo.ok("check-ref-format", "--branch", branch)) {
    throw new CliError(`invalid branch name: ${branch}`);
  }

  if (!options.skipFetch) {
    fetchOrigin(options.repoRoot, options.env);
  }

  const commonDir =
    repo.out("rev-parse", "--git-common-dir") ?? join(options.repoRoot, ".git");
  const absoluteCommonDir = isAbsolute(commonDir)
    ? commonDir
    : join(options.repoRoot, commonDir);
  const lockDir = join(absoluteCommonDir, ".linear-worktree.lock");

  await acquireLock(lockDir);
  try {
    // Clear stale registrations whose directories were deleted out from under git.
    repo.ok("worktree", "prune");
    addWorktree(repo, worktreePath, branch);
  } finally {
    await releaseLock(lockDir);
  }

  const worktree = git(worktreePath, options.env);
  if (worktree.require("rev-parse", "--show-toplevel") !== worktreePath) {
    throw new CliError("worktree path mismatch");
  }
  if (
    worktree.require("symbolic-ref", "--quiet", "--short", "HEAD") !== branch
  ) {
    throw new CliError("worktree HEAD mismatch");
  }

  return { branch, worktreePath };
};
