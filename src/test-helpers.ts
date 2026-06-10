import { chmod, mkdtemp, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runRequired } from "./shell.js";

export const safeEnv = (): NodeJS.ProcessEnv => ({
  HOME: process.env.HOME,
  PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
});

export const captureWritable = (): {
  stream: NodeJS.WritableStream;
  value: () => string;
} => {
  let output = "";
  const stream = {
    write(chunk: string | Uint8Array): boolean {
      output += chunk.toString();
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  return { stream, value: () => output };
};

export const writeExecutable = async (
  path: string,
  contents: string
): Promise<void> => {
  await writeFile(path, contents);
  await chmod(path, 0o755);
};

export const createGitRepo = async (
  name: string,
  options: { setOriginHead?: boolean } = {}
): Promise<{ repo: string; root: string }> => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "lw-test-")));
  const origin = join(root, "origin.git");
  const repo = join(root, name);

  runRequired("git", ["init", "--bare", "--initial-branch=main", origin], {
    env: safeEnv(),
  });
  runRequired("git", ["init", "--initial-branch=main", repo], {
    env: safeEnv(),
  });
  runRequired("git", ["-C", repo, "config", "user.email", "test@example.com"], {
    env: safeEnv(),
  });
  runRequired("git", ["-C", repo, "config", "user.name", "Test"], {
    env: safeEnv(),
  });
  await writeFile(join(repo, "README.md"), "test\n");
  runRequired("git", ["-C", repo, "add", "README.md"], { env: safeEnv() });
  runRequired("git", ["-C", repo, "commit", "-m", "init"], { env: safeEnv() });
  runRequired("git", ["-C", repo, "remote", "add", "origin", origin], {
    env: safeEnv(),
  });
  runRequired("git", ["-C", repo, "push", "-u", "origin", "main"], {
    env: safeEnv(),
  });
  if (options.setOriginHead !== false) {
    runRequired("git", ["-C", repo, "remote", "set-head", "origin", "--auto"], {
      env: safeEnv(),
    });
  }

  return { repo, root };
};
