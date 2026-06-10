import { describe, expect, it } from "vitest";

import { fetchLinearIssue } from "./linear.js";
import type { FetchLike } from "./types.js";

const neverFetch: FetchLike = () => {
  throw new Error("should not be called");
};

const serverError: FetchLike = () =>
  Promise.resolve(new Response("nope", { status: 500 }));

const networkDown: FetchLike = () => Promise.reject(new Error("network down"));

describe("fetchLinearIssue", () => {
  it("maps the GraphQL response to the issue", async () => {
    const calls: { url: string; auth: string }[] = [];
    const fetchImpl: FetchLike = (input, init) => {
      const headers = init?.headers as Record<string, string>;
      calls.push({ auth: headers.Authorization ?? "", url: String(input) });
      return Promise.resolve(
        Response.json({
          data: { issue: { identifier: "ENG-1", title: "Fix the thing" } },
        })
      );
    };

    const issue = await fetchLinearIssue(
      "ENG-1",
      { LINEAR_API_KEY: "lin_api_key" },
      fetchImpl
    );

    expect(issue?.identifier).toBe("ENG-1");
    expect(issue?.title).toBe("Fix the thing");
    expect(calls).toEqual([
      { auth: "lin_api_key", url: "https://api.linear.app/graphql" },
    ]);
  });

  it("returns undefined without fetching when LINEAR_API_KEY is absent", async () => {
    expect(await fetchLinearIssue("ENG-1", {}, neverFetch)).toBeUndefined();
  });

  it("returns undefined on a non-ok response", async () => {
    expect(
      await fetchLinearIssue("ENG-1", { LINEAR_API_KEY: "k" }, serverError)
    ).toBeUndefined();
  });

  it("returns undefined when fetch throws", async () => {
    expect(
      await fetchLinearIssue("ENG-1", { LINEAR_API_KEY: "k" }, networkDown)
    ).toBeUndefined();
  });
});
