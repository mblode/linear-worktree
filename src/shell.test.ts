import { describe, expect, it } from "vitest";

import { CliError } from "./errors.js";
import { runRequired, shellQuote } from "./shell.js";

describe("shellQuote", () => {
  it("wraps values in single quotes", () => {
    expect(shellQuote("plain")).toBe("'plain'");
  });

  it("escapes embedded single quotes", () => {
    expect(shellQuote("it's here")).toBe("'it'\\''s here'");
  });
});

describe("runRequired", () => {
  it("returns trimmed stdout on success", () => {
    expect(runRequired("sh", ["-c", "echo '  hello  '"])).toBe("hello");
  });

  it("throws CliError with stderr detail on failure", () => {
    expect(() => runRequired("sh", ["-c", "echo broken >&2; exit 3"])).toThrow(
      CliError
    );
    expect(() => runRequired("sh", ["-c", "echo broken >&2; exit 3"])).toThrow(
      /broken/u
    );
  });
});
