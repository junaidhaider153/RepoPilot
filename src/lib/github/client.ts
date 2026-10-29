import {
  RepositoryInput,
  RepositoryMetadata,
  GitHubTreeItem,
  RetrievedFile,
  BoundedContext,
  GitHubIngestionError,
  IngestionOptions,
} from "./types";
import { selectRepositoryFiles } from "./select-files";
import { detectTechnologies } from "./detect-tech";

const GITHUB_API_BASE = "https://api.github.com";

declare global {
  var __repopilot_ingestionCache: Map<string, { context: BoundedContext; cachedAt: number }> | undefined;
}

export function getIngestionCacheKey(input: RepositoryInput, options: IngestionOptions = {}): string {
  return `${input.owner.toLowerCase()}/${input.repo.toLowerCase()}:${options.maxFiles ?? ""}:${options.maxFileBytes ?? ""}:${options.maxContextChars ?? ""}`;
}

export function clearIngestionCache(): void {
  if (globalThis.__repopilot_ingestionCache) {
    globalThis.__repopilot_ingestionCache.clear();
  }
}

function getIngestionCache(): Map<string, { context: BoundedContext; cachedAt: number }> {
  if (!globalThis.__repopilot_ingestionCache) {
    globalThis.__repopilot_ingestionCache = new Map();
  }
  return globalThis.__repopilot_ingestionCache;
}

interface FetchOptions {
  githubToken?: string;
  timeoutMs?: number;
}

async function githubFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const timeout = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoPilot-Codebase-Analyzer",
  };

  if (options.githubToken) {
    headers.Authorization = `Bearer ${options.githubToken}`;
  }

  try {
    const res = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      headers,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GitHubIngestionError(
        "GITHUB_TIMEOUT",
        `GitHub API request timed out after ${timeout}ms.`,
        504
      );
    }
    throw new GitHubIngestionError(
      "INTERNAL_ERROR",
      `Failed to communicate with GitHub API: ${err instanceof Error ? err.message : String(err)}`,
      502
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRepositoryMetadata(
  input: RepositoryInput,
  options: FetchOptions = {}
): Promise<RepositoryMetadata> {
  const res = await githubFetch(`/repos/${input.owner}/${input.repo}`, options);

  if (res.status === 404) {
    throw new GitHubIngestionError(
      "REPOSITORY_NOT_FOUND_OR_INACCESSIBLE",
      `Repository "${input.owner}/${input.repo}" was not found or is private. Only public repositories are supported.`,
      404
    );
  }

  if (res.status === 403 || res.status === 429) {
    const rateLimitReset = res.headers.get("x-ratelimit-reset");
    const resetTime = rateLimitReset
      ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString()
      : "soon";
    throw new GitHubIngestionError(
      "GITHUB_RATE_LIMITED",
      `GitHub API rate limit exceeded. Resets at ${resetTime}. Configure a server-side GITHUB_TOKEN to raise limits.`,
      429
    );
  }

  if (!res.ok) {
    throw new GitHubIngestionError(
      "INTERNAL_ERROR",
      `GitHub API returned unexpected status ${res.status} when fetching repository metadata.`,
      res.status
    );
  }

  const data = await res.json();

  if (data.private) {
    throw new GitHubIngestionError(
      "REPOSITORY_NOT_FOUND_OR_INACCESSIBLE",
      `Repository "${input.owner}/${input.repo}" is private. RepoPilot MVP only supports public repositories.`,
      403
    );
  }

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description || "No description provided.",
    defaultBranch: data.default_branch || "main",
    starsCount: data.stargazers_count ?? 0,
    forksCount: data.forks_count ?? 0,
    openIssuesCount: data.open_issues_count ?? 0,
    license: data.license?.spdx_id || data.license?.name || undefined,
    language: data.language || undefined,
    htmlUrl: data.html_url || `https://github.com/${input.owner}/${input.repo}`,
  };
}

export async function fetchRepositoryTree(
  input: RepositoryInput,
  defaultBranch: string,
  options: FetchOptions = {}
): Promise<{ items: GitHubTreeItem[]; truncated: boolean }> {
  const res = await githubFetch(
    `/repos/${input.owner}/${input.repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
    options
  );

  if (res.status === 404 || res.status === 409) {
    // 409 Git Repository is empty
    throw new GitHubIngestionError(
      "EMPTY_REPOSITORY",
      `Repository "${input.owner}/${input.repo}" appears to be empty or has no commits on branch "${defaultBranch}".`,
      400
    );
  }

  if (res.status === 403 || res.status === 429) {
    throw new GitHubIngestionError(
      "GITHUB_RATE_LIMITED",
      "GitHub API rate limit exceeded while retrieving repository tree.",
      429
    );
  }

  if (!res.ok) {
    throw new GitHubIngestionError(
      "INTERNAL_ERROR",
      `GitHub API returned status ${res.status} when fetching repository tree.`,
      res.status
    );
  }

  const data = await res.json();
  const items: GitHubTreeItem[] = Array.isArray(data.tree) ? data.tree : [];
  const truncated = Boolean(data.truncated);

  if (items.length === 0) {
    throw new GitHubIngestionError(
      "EMPTY_REPOSITORY",
      `No files found in repository "${input.owner}/${input.repo}".`,
      400
    );
  }

  return { items, truncated };
}

export async function fetchFileContent(
  input: RepositoryInput,
  path: string,
  defaultBranch: string,
  options: FetchOptions = {}
): Promise<string> {
  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const res = await githubFetch(
    `/repos/${input.owner}/${input.repo}/contents/${encodedPath}?ref=${encodeURIComponent(defaultBranch)}`,
    options
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch file ${path}: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.encoding === "base64" && typeof data.content === "string") {
    // Decode base64 utf-8
    const cleanBase64 = data.content.replace(/\s/g, "");
    const decoded = Buffer.from(cleanBase64, "base64").toString("utf-8");
    return decoded;
  }

  if (typeof data.content === "string") {
    return data.content;
  }

  throw new Error(`Unexpected content format for file ${path}`);
}

/**
 * End-to-end bounded ingestion pipeline for a validated repository.
 */
export async function ingestRepository(
  input: RepositoryInput,
  options: IngestionOptions = {}
): Promise<BoundedContext> {
  const cacheKey = getIngestionCacheKey(input, options);
  const cache = getIngestionCache();
  const cached = cache.get(cacheKey);
  const TTL_MS = 10 * 60 * 1000; // 10 minutes cache
  if (cached && Date.now() - cached.cachedAt < TTL_MS) {
    return cached.context;
  }

  const envMaxFiles = parseInt(process.env.MAX_REPOSITORY_FILES || "", 10);
  const maxFiles =
    options.maxFiles ?? (Number.isFinite(envMaxFiles) && envMaxFiles > 0 ? envMaxFiles : 25);

  const envMaxBytes = parseInt(process.env.MAX_FILE_BYTES || "", 10);
  const maxFileBytes =
    options.maxFileBytes ?? (Number.isFinite(envMaxBytes) && envMaxBytes > 0 ? envMaxBytes : 49152);

  const envMaxContext = parseInt(process.env.MAX_CONTEXT_CHARS || "", 10);
  const maxContextChars =
    options.maxContextChars ?? (Number.isFinite(envMaxContext) && envMaxContext > 0 ? envMaxContext : 80000);

  const maxSingleFileChars = 16384;
  const fetchOpts: FetchOptions = {
    githubToken: options.githubToken || process.env.GITHUB_TOKEN,
    timeoutMs: options.timeoutMs ?? 15000,
  };

  // 1. Fetch metadata
  const repository = await fetchRepositoryMetadata(input, fetchOpts);

  // 2. Fetch recursive tree
  const { items, truncated: treeTruncated } = await fetchRepositoryTree(
    input,
    repository.defaultBranch,
    fetchOpts
  );

  const coverageNotes: string[] = [];
  if (treeTruncated) {
    coverageNotes.push(
      "Repository tree exceeded GitHub API size limit and was truncated. Analysis reflects visible tree files only."
    );
  }

  // 3. Filter & Rank candidate files
  const rankedFiles = selectRepositoryFiles(items, maxFiles, maxFileBytes);

  if (rankedFiles.length === 0) {
    throw new GitHubIngestionError(
      "NO_USABLE_TEXT_FILES",
      `No supported source, manifest, or documentation text files were found in "${repository.fullName}".`,
      400
    );
  }

  // 4. Fetch selected file contents concurrently with bounded context
  const retrievedFiles: RetrievedFile[] = [];
  let currentTotalChars = 0;

  const fetchedResults = await Promise.all(
    rankedFiles.map(async ({ item, category }) => {
      try {
        const content = await fetchFileContent(
          input,
          item.path,
          repository.defaultBranch,
          fetchOpts
        );
        return { item, category, content, ok: true };
      } catch {
        return { item, category, content: "", ok: false };
      }
    })
  );

  for (const { item, category, content, ok } of fetchedResults) {
    if (!ok) {
      coverageNotes.push(`Could not retrieve contents for "${item.path}". File skipped.`);
      continue;
    }

    // Sanitize null bytes or non-text characters
    let cleanContent = content.replace(/\0/g, "");
    const singleFileSuffix = `\n... [File content bounded to ${maxSingleFileChars} chars to preserve context balance]`;
    if (cleanContent.length > maxSingleFileChars) {
      const sliceLen = Math.max(0, maxSingleFileChars - singleFileSuffix.length);
      cleanContent = cleanContent.slice(0, sliceLen) + singleFileSuffix;
    }
    const charLength = cleanContent.length;

    // Check if adding this file exceeds aggregate context
    if (currentTotalChars + charLength > maxContextChars) {
      // Truncate file content to fit remaining budget
      const remainingChars = maxContextChars - currentTotalChars;
      const truncationSuffix = "\n... [File content truncated to respect context limit]";
      if (remainingChars > truncationSuffix.length + 100) {
        const sliceLen = Math.max(0, remainingChars - truncationSuffix.length);
        const truncatedContent = cleanContent.slice(0, sliceLen) + truncationSuffix;
        retrievedFiles.push({
          path: item.path,
          content: truncatedContent,
          sizeBytes: Buffer.byteLength(truncatedContent, "utf8"),
          category,
        });
        currentTotalChars += truncatedContent.length;
        coverageNotes.push(
          `File "${item.path}" was truncated to fit the ${maxContextChars} total character limit.`
        );
      } else {
        coverageNotes.push(
          `Context limit reached (${maxContextChars} chars). Additional candidate files were omitted.`
        );
        break;
      }
    } else {
      retrievedFiles.push({
        path: item.path,
        content: cleanContent,
        sizeBytes: Buffer.byteLength(cleanContent, "utf8"),
        category,
      });
      currentTotalChars += charLength;
    }
  }

  if (retrievedFiles.length === 0) {
    throw new GitHubIngestionError(
      "NO_USABLE_TEXT_FILES",
      "Failed to retrieve any eligible file contents from the repository.",
      400
    );
  }

  // 5. Detect technologies
  const detectedTechnologies = detectTechnologies(retrievedFiles);

  coverageNotes.push(
    `Bounded context assembled: ${retrievedFiles.length} files (${Math.round(currentTotalChars / 1024)} KB of text context) from ${items.filter((i) => i.type === "blob").length} total files.`
  );

  const boundedContext: BoundedContext = {
    repository,
    files: retrievedFiles,
    totalChars: currentTotalChars,
    treeTruncated,
    totalTreeBlobs: items.filter((i) => i.type === "blob").length,
    analyzedFilesCount: retrievedFiles.length,
    detectedTechnologies,
    coverageNotes,
  };

  cache.set(cacheKey, { context: boundedContext, cachedAt: Date.now() });

  return boundedContext;
}

