export type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

export type RunOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  stdio?: "pipe" | "inherit";
};

export type ParsedIssue = {
  displayId: string;
  issueId: string;
  slug: string;
};

export type ResolvedRepo = {
  repoRoot: string;
  source: "override" | "team-map" | "cwd" | "env";
};

export type WorktreeResult = {
  branch: string;
  worktreePath: string;
};

export type LinearIssue = {
  identifier: string;
  title?: string | null;
  description?: string | null;
  team?: { name?: string | null } | null;
  labels?: { nodes?: Array<{ name?: string | null }> | null } | null;
  project?: { name?: string | null } | null;
  parent?: LinearRelatedIssue | null;
  children?: { nodes?: LinearRelatedIssue[] | null } | null;
};

export type LinearRelatedIssue = {
  identifier: string;
  id?: string | null;
  title?: string | null;
  description?: string | null;
};

export type LinearGraphqlResponse = {
  data?: {
    issue?: LinearIssue | null;
  };
};

export type CliOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  print?: boolean;
  repoOverride?: string;
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
  tokens: string[];
};
