import { isIssueId } from "./issue.js";
import { CLAUDE_PLAN_ARGS } from "./launch.js";
import { commandExists, run, runRequired, shellQuote } from "./shell.js";

interface OpenWorkspaceOptions {
  branch: string;
  env: NodeJS.ProcessEnv;
  focus: boolean;
  promptPath: string;
  worktreePath: string;
}

export const isFanOutInput = (tokens: string[]): boolean =>
  tokens.length >= 2 && tokens.every(isIssueId);

export const cmuxReachable = (env: NodeJS.ProcessEnv): boolean =>
  commandExists("cmux", env) && run("cmux", ["ping"], { env }).status === 0;

export const claudeCommand = (promptPath: string): string =>
  `claude ${CLAUDE_PLAN_ARGS.join(" ")} "$(cat ${shellQuote(promptPath)})"`;

export const openIssueWorkspace = (options: OpenWorkspaceOptions): void => {
  runRequired(
    "cmux",
    [
      "new-workspace",
      "--name",
      options.branch,
      "--cwd",
      options.worktreePath,
      "--command",
      claudeCommand(options.promptPath),
      "--focus",
      options.focus ? "true" : "false",
    ],
    { env: options.env }
  );
};
