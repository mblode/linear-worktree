import { describe, expect, it } from "vitest";

import { isFanOutInput } from "./cmux.js";

describe("isFanOutInput", () => {
  it("is true for multiple bare issue IDs", () => {
    expect(isFanOutInput(["ENG-1", "ENG-2"])).toBe(true);
  });

  it("is false for a single issue ID", () => {
    expect(isFanOutInput(["ENG-1"])).toBe(false);
  });

  it("is false when any token is not a bare issue ID", () => {
    expect(
      isFanOutInput(["ENG-1", "https://linear.app/team/issue/ENG-2/slug"])
    ).toBe(false);
  });
});
