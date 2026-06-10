import { tmpdir } from "node:os";
import { join } from "node:path";

export const issueScratchDir = (displayId: string): string =>
  join(tmpdir(), "linear-worktree", displayId);
