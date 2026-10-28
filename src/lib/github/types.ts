export type FileCategory =
  | "readme"
  | "manifest"
  | "config"
  | "source"
  | "documentation";

export interface RepositoryInput {
  owner: string;
  repo: string;
  url: string;
}

export interface RetrievedFile {
  path: string;
  content: string;
  sizeBytes: number;
  category: FileCategory;
}

export interface RepositoryMetadata {
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  license?: string;
  language?: string;
  htmlUrl: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

export interface IngestionOptions {
  maxFiles?: number;
  maxFileBytes?: number;
  maxContextChars?: number;
  githubToken?: string;
  timeoutMs?: number;
}

export interface BoundedContext {
  repository: RepositoryMetadata;
  files: RetrievedFile[];
  totalChars: number;
  treeTruncated: boolean;
  totalTreeBlobs: number;
  analyzedFilesCount: number;
  detectedTechnologies: string[];
  coverageNotes: string[];
}

export type GitHubErrorCode =
  | "INVALID_REPOSITORY_URL"
  | "REPOSITORY_NOT_FOUND_OR_INACCESSIBLE"
  | "GITHUB_RATE_LIMITED"
  | "REPOSITORY_TOO_LARGE"
  | "NO_USABLE_TEXT_FILES"
  | "EMPTY_REPOSITORY"
  | "GITHUB_TIMEOUT"
  | "INTERNAL_ERROR";

export class GitHubIngestionError extends Error {
  public code: GitHubErrorCode;
  public status: number;
  public details?: unknown;

  constructor(code: GitHubErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "GitHubIngestionError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

