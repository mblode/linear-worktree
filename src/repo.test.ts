import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { expandTilde, resolveRepo } from "./repo.js";
import { createGitRepo, safeEnv } from "./test-helpers.js";

const cleanup: string[] = [];

afterEach(async () => {
  for (const path of cleanup.splice(0)) {
    await rm(path, { force: true, recursive: true });
  }
});

describe("expandTilde", () => {
  it("expands a bare tilde to the home directory", () => {
    expect(expandTilde("~", "/home/user")).toBe("/home/user");
  });

  it("expands a tilde-prefixed path", () => {
    expect(expandTilde("~/code/repo", "/home/user")).toBe(
      "/home/user/code/repo"
    );
  });

  it("leaves other paths untouched", () => {
    expect(expandTilde("/abs/path", "/home/user")).toBe("/abs/path");
  });
});

describe("resolveRepo", () => {
  it("resolves the repo root from --repo", async () => {
    const { repo, root } = await createGitRepo("src");
    cleanup.push(root);

    expect(
      resolveRepo({ cwd: root, env: safeEnv(), repoOverride: repo })
    ).toEqual({ repoRoot: repo });
  });

  it("throws CliError when --repo is not a git repo", async () => {
    const dir = await realpath(await mkdtemp(join(tmpdir(), "lw-nogit-")));
    cleanup.push(dir);

    expect(() =>
      resolveRepo({ cwd: dir, env: safeEnv(), repoOverride: dir })
    ).toThrow(/--repo is not a git repo/u);
  });
});
