import { RepositoryInput, GitHubIngestionError } from "./types";

const GITHUB_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Validates and parses a public GitHub repository URL.
 * Only accepts public https://github.com/:owner/:repo formats.
 */
export function validateGitHubRepoUrl(rawUrl: string): RepositoryInput {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Repository URL is required and must be a string."
    );
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 500) {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Repository URL exceeds maximum allowed length of 500 characters."
    );
  }

  // Pre-URL parse check for path traversal patterns
  if (
    trimmed.includes("..") ||
    trimmed.toLowerCase().includes("%2e%2e") ||
    trimmed.toLowerCase().includes("%2e")
  ) {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Path traversal characters and encoded sequences are not permitted."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Malformed URL structure. Please provide a valid HTTPS GitHub repository URL."
    );
  }

  // Enforce HTTPS
  if (parsed.protocol !== "https:") {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Only secure HTTPS URLs are permitted (e.g., https://github.com/owner/repo)."
    );
  }

  // Enforce exact github.com hostname (no arbitrary subdomains, no alternative git hosts)
  if (parsed.hostname.toLowerCase() !== "github.com") {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      `Unsupported host "${parsed.hostname}". Only public repositories on github.com are supported in MVP.`
    );
  }

  // Reject credentials in URL
  if (parsed.username || parsed.password) {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Repository URL must not contain embedded user credentials or tokens."
    );
  }

  // Reject non-standard ports
  if (parsed.port && parsed.port !== "443") {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Non-standard ports are not allowed in repository URLs."
    );
  }

  // Parse path segments
  const pathParts = parsed.pathname
    .split("/")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (pathParts.length < 2) {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "GitHub repository URL must include both owner and repository name (e.g., https://github.com/owner/repo)."
    );
  }

  const owner = pathParts[0];
  let repo = pathParts[1];

  // Remove .git suffix if present
  if (repo.endsWith(".git")) {
    repo = repo.slice(0, -4);
  }

  // Prevent path traversal or forbidden characters
  if (
    owner === "." ||
    owner === ".." ||
    repo === "." ||
    repo === ".." ||
    owner.includes("%") ||
    repo.includes("%")
  ) {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Path traversal characters and encoded sequences are not permitted."
    );
  }

  if (!GITHUB_NAME_REGEX.test(owner) || !GITHUB_NAME_REGEX.test(repo)) {
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      "Owner and repository names may only contain alphanumeric characters, hyphens, periods, and underscores."
    );
  }

  // If there are additional path parts beyond /owner/repo (e.g., /blob/..., /issues), reject or clarify
  if (pathParts.length > 2) {
    // Check if user accidentally pasted a subpath like tree/main or blob/main
    throw new GitHubIngestionError(
      "INVALID_REPOSITORY_URL",
      `Please provide the root repository URL (https://github.com/${owner}/${repo}) instead of subpaths or deep links.`
    );
  }

  const normalizedUrl = `https://github.com/${owner}/${repo}`;

  return {
    owner,
    repo,
    url: normalizedUrl,
  };
}
