import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { CliError } from "./errors.js";
import { ensureWorktree } from "./git.js";
import { runRequired } from "./shell.js";
import { createGitRepo, safeEnv } from "./test-helpers.js";

const cleanup: string[] = [];

afterEach(async () => {
  for (const path of cleanup.splice(0)) {
    await rm(path, { force: true, recursive: true });
  }
});

describe("ensureWorktree", () => {
  it("checks out an existing local branch", async () => {
    const { repo, root } = await createGitRepo("src");
    cleanup.push(root);
    runRequired("git", ["-C", repo, "branch", "tst-9-foo"], {
      env: safeEnv(),
    });

    const result = await ensureWorktree({
      env: safeEnv(),
      issueId: "tst-9",
      repoRoot: repo,
      slug: "foo",
    });

    expect(result.branch).toBe("tst-9-foo");
    expect(result.worktreePath).toBe(join(root, "src-tst-9"));
    expect(
      runRequired(
        "git",
        ["-C", result.worktreePath, "branch", "--show-current"],
        { env: safeEnv() }
      )
    ).toBe("tst-9-foo");
  });

  it("creates a tracking branch when only origin has it", async () => {
    const { repo, root } = await createGitRepo("src");
    cleanup.push(root);
    runRequired("git", ["-C", repo, "push", "origin", "main:tst-8-bar"], {
      env: safeEnv(),
    });
    runRequired("git", ["-C", repo, "fetch", "origin"], { env: safeEnv() });

    const result = await ensureWorktree({
      env: safeEnv(),
      issueId: "tst-8",
      repoRoot: repo,
      skipFetch: true,
      slug: "bar",
    });

    expect(result.branch).toBe("tst-8-bar");
    expect(
      runRequired(
        "git",
        ["-C", result.worktreePath, "rev-parse", "--abbrev-ref", "@{upstream}"],
        { env: safeEnv() }
      )
    ).toBe("origin/tst-8-bar");
  });

  it("rejects slugs that produce an invalid branch name", async () => {
    const { repo, root } = await createGitRepo("src");
    cleanup.push(root);

    await expect(
      ensureWorktree({
        env: safeEnv(),
        issueId: "tst-7",
        repoRoot: repo,
        skipFetch: true,
        slug: "foo..bar",
      })
    ).rejects.toThrow(/invalid branch name/u);
  });

  it("throws when the worktree path exists but is not a worktree", async () => {
    const { repo, root } = await createGitRepo("src");
    cleanup.push(root);
    await mkdir(join(root, "src-tst-6"));

    await expect(
      ensureWorktree({
        env: safeEnv(),
        issueId: "tst-6",
        repoRoot: repo,
        skipFetch: true,
        slug: "",
      })
    ).rejects.toThrow(CliError);
    await expect(
      ensureWorktree({
        env: safeEnv(),
        issueId: "tst-6",
        repoRoot: repo,
        skipFetch: true,
        slug: "",
      })
    ).rejects.toThrow(/not a git worktree/u);
  });

  it("throws when origin's default branch cannot be resolved", async () => {
    const { repo, root } = await createGitRepo("src", {
      setOriginHead: false,
    });
    cleanup.push(root);

    await expect(
      ensureWorktree({
        env: safeEnv(),
        issueId: "tst-5",
        repoRoot: repo,
        skipFetch: true,
        slug: "baz",
      })
    ).rejects.toThrow(/cannot resolve origin's default branch/u);
  });
});
