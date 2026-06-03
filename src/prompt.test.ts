import { describe, expect, it } from "vitest";
import { renderPrompt } from "./prompt.js";
import type { LinearIssue } from "./types.js";

describe("prompt rendering", () => {
  it("renders Linear copy-as-prompt shape without url", () => {
    const issue: LinearIssue = {
      children: {
        nodes: [
          {
            description: "Child body",
            id: "child-uuid",
            identifier: "TIG-404",
            title: "Child task",
          },
        ],
      },
      description: "Raw markdown with ![shot](https://uploads.linear.app/file.png)",
      identifier: "TIG-403",
      labels: { nodes: [{ name: "Frontend" }, { name: "Bug" }] },
      parent: {
        id: "parent-uuid",
        identifier: "TIG-400",
        title: "Parent task",
      },
      project: { name: "Activation" },
      team: { name: "Frontyard" },
      title: "Fix launch flow",
    };

    const prompt = renderPrompt(issue, "TIG-403");

    expect(prompt).toContain("Work on Linear issue TIG-403:");
    expect(prompt).toContain('<issue identifier="TIG-403">');
    expect(prompt).toContain("<team name=\"Frontyard\"/>");
    expect(prompt).toContain("<label>Frontend</label>");
    expect(prompt).toContain("<project name=\"Activation\"/>");
    expect(prompt).toContain("<parent-issue identifier=\"TIG-400\">");
    expect(prompt).toContain("<id>parent-uuid</id>");
    expect(prompt).toContain("<sub-issue identifier=\"TIG-404\">");
    expect(prompt).toContain("<id>child-uuid</id>");
    expect(prompt).not.toContain("<url>");
  });

  it("falls back when Linear data is unavailable", () => {
    expect(renderPrompt(undefined, "TIG-999")).toBe("Work on Linear issue TIG-999.");
  });
});
