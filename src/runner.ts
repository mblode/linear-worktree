import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cmuxReachable, isFanOutInput, openIssueWorkspace } from "./cmux.js";
import { CliError } from "./errors.js";
import { ensureWorktree, fetchOrigin } from "./git.js";
import { downloadIssueImages } from "./images.js";
import { parseIssueInput, slugify } from "./issue.js";
import { fetchLinearIssue } from "./linear.js";
import { copyCommand, launchPlanMode } from "./launch.js";
import { createProgress, type Progress } from "./progress.js";
import { renderPrompt } from "./prompt.js";
import { resolveRepo } from "./repo.js";
import { commandExists } from "./shell.js";
import type { CliOptions, WorktreeResult } from "./types.js";

type PreparedIssue = {
  displayId: string;
  prompt: string;
  worktree: WorktreeResult;
};

type PrepareContext = {
  cwd: string;
  env: NodeJS.ProcessEnv;
  progress: Progress;
  repoOverride?: string;
};

export async function runLinearWorktree(options: CliOptions): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const stdout = options.stdout ?? process.stdout;
  const tokens = options.tokens.length > 0 ? options.tokens : readStdinTokens();

  if (tokens.length === 0) {
    throw new CliError(
      "usage: linear-worktree [--print] [--repo <path>] <issue-id|url> [more issue-ids...]",
      2,
    );
  }

  const progress = createProgress(options.stderr ?? process.stderr);
  const context: PrepareContext = { cwd, env, progress, repoOverride: options.repoOverride };

  try {
    return await dispatch({ context, env, options, progress, stdout, tokens });
  } catch (error) {
    progress.done();
    throw error;
  }
}

type DispatchArgs = {
  context: PrepareContext;
  env: NodeJS.ProcessEnv;
  options: CliOptions;
  progress: Progress;
  stdout: NodeJS.WritableStream;
  tokens: string[];
};

async function dispatch({
  context,
  env,
  options,
  progress,
  stdout,
  tokens,
}: DispatchArgs): Promise<number> {
  if (isFanOutInput(tokens, Boolean(options.print))) {
    if (!cmuxReachable(env)) {
      throw new CliError("cmux is not reachable (needed for multi-issue fan-out)");
    }
    if (!commandExists("claude", env)) {
      throw new CliError("claude is not on PATH");
    }

    for (const token of tokens) {
      const prepared = await prepareIssue(token, context);
      await launchViaCmux(prepared, env, false, progress);
    }

    progress.done();
    stdout.write(
      `spawned ${tokens.length} workspaces - each running claude in plan mode from its worktree\n`,
    );
    return 0;
  }

  const prepared = await prepareIssue(tokens.join(" "), context);

  if (options.print) {
    const cdCommand = `cd ${prepared.worktree.worktreePath}`;
    copyCommand(cdCommand, env);
    progress.done();
    stdout.write(`agent prompt:\n${prepared.prompt}\n\ncopied:\n${cdCommand}\n`);
    return 0;
  }

  if (cmuxReachable(env) && commandExists("claude", env)) {
    try {
      await launchViaCmux(prepared, env, true, progress);
      progress.done(`opened cmux workspace ${prepared.worktree.branch}`);
      return 0;
    } catch {
      // fall through to inline launch if cmux refuses the workspace
    }
  }

  progress.done();
  return launchPlanMode(prepared.worktree.worktreePath, prepared.prompt, env);
}

async function prepareIssue(token: string, context: PrepareContext): Promise<PreparedIssue> {
  const { cwd, env, progress } = context;

  const parsedIssue = parseIssueInput(token);

  progress.step("resolving repo");
  const repo = resolveRepo({
    cwd,
    env,
    issueId: parsedIssue.issueId,
    repoOverride: context.repoOverride,
  });

  // Dispatch the Linear request first (async, non-blocking) so it travels the
  // network while the synchronous `git fetch origin` blocks the main thread.
  progress.step(`fetching ${parsedIssue.displayId} from Linear`);
  const issuePromise = fetchLinearIssue(parsedIssue.displayId, env);
  progress.step("git fetch origin");
  fetchOrigin(repo.repoRoot, env);
  const issue = await issuePromise;

  const slug = parsedIssue.slug || (issue?.title ? slugify(issue.title) : "");

  let prompt = renderPrompt(issue, parsedIssue.displayId);
  if (issue?.description && env.LINEAR_API_KEY) {
    progress.step("downloading screenshots");
    const screenshots = await downloadIssueImages(
      issue.description,
      parsedIssue.displayId,
      env.LINEAR_API_KEY,
    );
    if (screenshots.length > 0) {
      prompt += `\nScreenshots for this ticket (view with the Read tool):\n${screenshots.join("\n")}`;
    }
  }

  progress.step("creating worktree");
  const worktree = await ensureWorktree({
    env,
    issueId: parsedIssue.issueId,
    repoRoot: repo.repoRoot,
    skipFetch: true,
    slug,
  });

  return { displayId: parsedIssue.displayId, prompt, worktree };
}

async function launchViaCmux(
  prepared: PreparedIssue,
  env: NodeJS.ProcessEnv,
  focus: boolean,
  progress: Progress,
): Promise<void> {
  progress.step(`opening cmux workspace ${prepared.worktree.branch}`);
  const promptPath = await writePromptFile(prepared.displayId, prepared.prompt);
  openIssueWorkspace({
    branch: prepared.worktree.branch,
    env,
    focus,
    promptPath,
    worktreePath: prepared.worktree.worktreePath,
  });
}

async function writePromptFile(displayId: string, prompt: string): Promise<string> {
  const dir = join("/tmp", "linear-worktree", displayId);
  await mkdir(dir, { recursive: true });
  const promptPath = join(dir, "prompt.txt");
  await writeFile(promptPath, prompt);
  return promptPath;
}

function readStdinTokens(): string[] {
  if (process.stdin.isTTY) {
    return [];
  }

  const input = readFileSync(0, "utf8");
  const firstLine = input.split(/\r?\n/)[0]?.trim() ?? "";
  return firstLine ? firstLine.split(/\s+/) : [];
}
