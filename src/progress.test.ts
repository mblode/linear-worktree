import { describe, expect, it } from "vitest";

import { createProgress, withPrefix } from "./progress.js";

const captureStream = (
  isTTY: boolean
): { stream: NodeJS.WritableStream; value: () => string } => {
  let output = "";
  const stream = {
    isTTY,
    write(chunk: string | Uint8Array): boolean {
      output += chunk.toString();
      return true;
    },
  } as unknown as NodeJS.WritableStream;
  return { stream, value: () => output };
};

describe("createProgress", () => {
  it("writes prefixed lines on non-TTY streams", () => {
    const { stream, value } = captureStream(false);
    const progress = createProgress(stream);

    progress.step("resolving repo");
    progress.done("all good");

    expect(value()).toBe(
      "[linear-worktree] resolving repo\n[linear-worktree] all good\n"
    );
  });

  it("writes nothing for done() without a message on non-TTY streams", () => {
    const { stream, value } = captureStream(false);
    const progress = createProgress(stream);

    progress.done();

    expect(value()).toBe("");
  });

  it("renders spinner frames and clears the line on TTY streams", () => {
    const { stream, value } = captureStream(true);
    const progress = createProgress(stream);

    progress.step("working");
    progress.done("finished");

    expect(value()).toContain("[2K");
    expect(value()).toContain("working");
    expect(value()).toContain("[linear-worktree] finished\n");
  });
});

describe("withPrefix", () => {
  it("prefixes step and done messages", () => {
    const { stream, value } = captureStream(false);
    const progress = withPrefix(createProgress(stream), "[1/2] TST-1 · ");

    progress.step("creating worktree");
    progress.done("opened tst-1");
    progress.done();

    expect(value()).toBe(
      "[linear-worktree] [1/2] TST-1 · creating worktree\n[linear-worktree] [1/2] TST-1 · opened tst-1\n"
    );
  });
});
