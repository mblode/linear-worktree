import { isIssueId } from "./issue.js";
import { commandExists, run, runRequired, shellQuote } from "./shell.js";

type OpenWorkspaceOptions = {
  branch: string;
  env: NodeJS.ProcessEnv;
  focus: boolean;
  promptPath: string;
  worktreePath: string;
};

export function isFanOutInput(tokens: string[], print: boolean): boolean {
  return !print && tokens.length >= 2 && tokens.every(isIssueId);
}

export function cmuxReachable(env: NodeJS.ProcessEnv): boolean {
  return commandExists("cmux", env) && run("cmux", ["ping"], { env }).status === 0;
}

export function claudeCommand(promptPath: string): string {
  return `claude --permission-mode plan --allow-dangerously-skip-permissions "$(cat ${shellQuote(promptPath)})"`;
}

export function openIssueWorkspace(options: OpenWorkspaceOptions): void {
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
    { env: options.env },
  );
}
