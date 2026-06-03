import { CliError } from "./errors.js";
import type { ParsedIssue } from "./types.js";

export const issueIdPattern = "[A-Za-z][A-Za-z0-9_]*-[0-9]+";
export const issueIdRegex = new RegExp(`^${issueIdPattern}$`);

export function isIssueId(value: string): boolean {
  return issueIdRegex.test(value);
}

export function slugify(value: string): string {
  let slug = value.toLowerCase().replace(/['`]/g, "");
  slug = slug.replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  if (slug.length > 60) {
    slug = slug.slice(0, 60);
    const lastDash = slug.lastIndexOf("-");
    if (lastDash !== -1) {
      slug = slug.slice(0, lastDash);
    }
  }
  return slug;
}

export function parseIssueInput(input: string): ParsedIssue {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(new RegExp(`^https?://linear\\.app/[^/]+/issue/(${issueIdPattern})/?(.*)$`));

  let rawId = "";
  let slug = "";

  if (urlMatch) {
    rawId = urlMatch[1] ?? "";
    slug = slugify((urlMatch[2] ?? "").split(/[?#]/)[0] ?? "");
  } else {
    const idMatch = trimmed.match(new RegExp(`^(${issueIdPattern})([\\s]+(.*))?$`));
    if (!idMatch) {
      throw new CliError(`could not parse issue ID from: ${input}`);
    }
    rawId = idMatch[1] ?? "";
    slug = slugify(idMatch[3] ?? "");
  }

  const issueId = rawId.toLowerCase();
  return {
    displayId: issueId.toUpperCase(),
    issueId,
    slug,
  };
}
