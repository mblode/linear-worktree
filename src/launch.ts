import { CliError } from "./errors.js";
import { commandExists, run } from "./shell.js";

export const CLAUDE_PLAN_ARGS = [
  "--permission-mode",
  "plan",
  "--allow-dangerously-skip-permissions",
] as const;

export const copyCommand = (command: string, env: NodeJS.ProcessEnv): void => {
  if (commandExists("pbcopy", env)) {
    run("pbcopy", [], { env, input: command });
    return;
  }
  if (commandExists("wl-copy", env)) {
    run("wl-copy", [], { env, input: command });
    return;
  }
  if (commandExists("xclip", env)) {
    run("xclip", ["-selection", "clipboard"], { env, input: command });
  }
};

export const launchPlanMode = (
  worktreePath: string,
  prompt: string,
  env: NodeJS.ProcessEnv
): number => {
  if (!commandExists("claude", env)) {
    throw new CliError("claude is not on PATH (use --print to skip launching)");
  }

  const result = run("claude", [...CLAUDE_PLAN_ARGS, prompt], {
    cwd: worktreePath,
    env,
    stdio: "inherit",
  });

  return result.status ?? 1;
};
