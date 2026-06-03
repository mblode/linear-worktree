import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { CliError } from "./errors.js";
import { run } from "./shell.js";
import type { ResolvedRepo } from "./types.js";

interface ResolveRepoOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  issueId: string;
  repoOverride?: string;
}

export const expandTilde = (value: string, home = homedir()): string => {
  if (value === "~") {
    return home;
  }
  if (value.startsWith("~/")) {
    return join(home, value.slice(2));
  }
  return value;
};

const gitTopLevel = (
  cwd: string,
  env: NodeJS.ProcessEnv
): string | undefined => {
  const result = run("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
    env,
  });
  if (result.status !== 0) {
    return undefined;
  }
  return result.stdout.trim();
};

const resolveTeamRepo = (
  issueId: string,
  env: NodeJS.ProcessEnv
): ResolvedRepo | undefined => {
  const team = issueId.split("-")[0]?.toUpperCase();
  if (!team) {
    return undefined;
  }

  const configPath = join(
    homedir(),
    ".config",
    "linear-worktree",
    "repos.json"
  );
  if (!existsSync(configPath)) {
    return undefined;
  }

  let map: Record<string, string>;
  try {
    map = JSON.parse(readFileSync(configPath, "utf-8")) as Record<
      string,
      string
    >;
  } catch {
    return undefined;
  }

  const configured = map[team];
  if (!configured) {
    return undefined;
  }

  const expanded = expandTilde(configured);
  const repo = gitTopLevel(expanded, env);
  if (!repo) {
    throw new CliError(
      `configured repo for ${team} is not a git repo: ${expanded}`
    );
  }

  return { repoRoot: repo, source: "team-map" };
};

export const resolveRepo = (options: ResolveRepoOptions): ResolvedRepo => {
  if (options.repoOverride) {
    const repo = gitTopLevel(expandTilde(options.repoOverride), options.env);
    if (repo) {
      return { repoRoot: repo, source: "override" };
    }
    throw new CliError(`--repo is not a git repo: ${options.repoOverride}`);
  }

  const teamRepo = resolveTeamRepo(options.issueId, options.env);
  if (teamRepo) {
    return teamRepo;
  }

  const cwdRepo = gitTopLevel(options.cwd, options.env);
  if (cwdRepo) {
    return { repoRoot: cwdRepo, source: "cwd" };
  }

  if (options.env.LINEAR_WORKTREE_REPO) {
    const envRepo = gitTopLevel(
      expandTilde(options.env.LINEAR_WORKTREE_REPO),
      options.env
    );
    if (envRepo) {
      return { repoRoot: envRepo, source: "env" };
    }
  }

  throw new CliError(
    `not in a git repo and no repo mapping for ${options.issueId.toUpperCase()} (use --repo, configure ~/.config/linear-worktree/repos.json, or set LINEAR_WORKTREE_REPO)`
  );
};
