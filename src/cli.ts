#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "./errors.js";
import { runLinearWorktree } from "./runner.js";

const packageJson = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")) as { version: string };

const program = new Command();

program
  .name("linear-worktree")
  .description("Create git worktrees for Linear issues and launch Claude sessions")
  .version(packageJson.version)
  .option("--print", "create the worktree and print the prompt without launching")
  .option("--repo <path>", "force the git repo for this command")
  .argument("[input...]", "Linear issue ID, URL, or multiple bare issue IDs")
  .action(async (input: string[], options: { print?: boolean; repo?: string }) => {
    try {
      const status = await runLinearWorktree({
        print: Boolean(options.print),
        repoOverride: options.repo,
        tokens: input,
      });
      process.exitCode = status;
    } catch (error) {
      if (error instanceof CliError) {
        console.error(error.message);
        process.exitCode = error.exitCode;
        return;
      }
      throw error;
    }
  });

program.parseAsync();
