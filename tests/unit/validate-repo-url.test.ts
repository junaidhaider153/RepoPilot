import { describe, it, expect } from "vitest";
import { validateGitHubRepoUrl } from "@/lib/github/validate-repo-url";
import { GitHubIngestionError } from "@/lib/github/types";

describe("validateGitHubRepoUrl", () => {
  it("parses and normalizes valid GitHub URLs", () => {
    const valid1 = validateGitHubRepoUrl("https://github.com/vercel/next.js");
    expect(valid1).toEqual({
      owner: "vercel",
      repo: "next.js",
      url: "https://github.com/vercel/next.js",
    });

    const validWithGit = validateGitHubRepoUrl("https://github.com/facebook/react.git");
    expect(validWithGit).toEqual({
      owner: "facebook",
      repo: "react",
      url: "https://github.com/facebook/react",
    });

    const validWithSlash = validateGitHubRepoUrl("https://github.com/octocat/Hello-World/  ");
    expect(validWithSlash).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      url: "https://github.com/octocat/Hello-World",
    });
  });

  it("rejects non-HTTPS URLs", () => {
    expect(() => validateGitHubRepoUrl("http://github.com/owner/repo")).toThrow(
      GitHubIngestionError
    );
    expect(() => validateGitHubRepoUrl("http://github.com/owner/repo")).toThrow(
      /Only secure HTTPS URLs are permitted/
    );
  });

  it("rejects non-GitHub domains and subdomains", () => {
    expect(() => validateGitHubRepoUrl("https://gitlab.com/owner/repo")).toThrow(
      /Unsupported host/
    );
    expect(() => validateGitHubRepoUrl("https://bitbucket.org/owner/repo")).toThrow(
      /Unsupported host/
    );
    expect(() => validateGitHubRepoUrl("https://gist.github.com/owner/repo")).toThrow(
      /Unsupported host/
    );
    expect(() => validateGitHubRepoUrl("https://github.com.evil.com/owner/repo")).toThrow(
      /Unsupported host/
    );
  });

  it("rejects credentials in URL", () => {
    expect(() =>
      validateGitHubRepoUrl("https://token:secret@github.com/owner/repo")
    ).toThrow(/embedded user credentials/);
  });

  it("rejects non-standard ports", () => {
    expect(() =>
      validateGitHubRepoUrl("https://github.com:8443/owner/repo")
    ).toThrow(/Non-standard ports are not allowed/);
  });

  it("rejects URLs missing repository or owner", () => {
    expect(() => validateGitHubRepoUrl("https://github.com/onlyowner")).toThrow(
      /must include both owner and repository name/
    );
    expect(() => validateGitHubRepoUrl("https://github.com/")).toThrow(
      /must include both owner and repository name/
    );
  });

  it("rejects path traversal attempts", () => {
    expect(() =>
      validateGitHubRepoUrl("https://github.com/owner/../repo")
    ).toThrow();
    expect(() =>
      validateGitHubRepoUrl("https://github.com/owner/%2e%2e/repo")
    ).toThrow(/Path traversal characters/);
  });

  it("rejects subpaths / deep links", () => {
    expect(() =>
      validateGitHubRepoUrl("https://github.com/owner/repo/blob/main/README.md")
    ).toThrow(/Please provide the root repository URL/);
  });

  it("rejects empty, null, or excessively long input", () => {
    expect(() => validateGitHubRepoUrl("")).toThrow(GitHubIngestionError);
    expect(() => validateGitHubRepoUrl("   ")).toThrow(GitHubIngestionError);
    expect(() => validateGitHubRepoUrl("https://github.com/" + "a".repeat(505))).toThrow(
      /exceeds maximum allowed length/
    );
  });
});

