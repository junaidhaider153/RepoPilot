import { GitHubTreeItem, FileCategory } from "./types";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "vendor",
  "target",
  "dist",
  "build",
  "out",
  ".next",
  ".turbo",
  "coverage",
  ".idea",
  ".vscode",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "env",
  "bin",
  "obj",
  ".gradle",
]);

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".svg",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".rar",
  ".7z",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mp3",
  ".wav",
  ".ogg",
  ".mov",
  ".avi",
  ".flac",
  ".class",
  ".pyc",
  ".wasm",
  ".jar",
]);

const SECRET_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pkcs12$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /^id_rsa/i,
  /^id_ed25519/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
  /secret/i,
];

const SKIPPED_LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "cargo.lock",
  "composer.lock",
  "poetry.lock",
  "gemfile.lock",
]);

export interface RankedFile {
  item: GitHubTreeItem;
  category: FileCategory;
  priority: number;
}

export function isSecretPath(path: string): boolean {
  const filename = path.split("/").pop() || "";
  return SECRET_PATTERNS.some((pat) => pat.test(filename));
}

export function isBinaryPath(path: string): boolean {
  const dotIdx = path.lastIndexOf(".");
  if (dotIdx === -1) return false;
  const ext = path.slice(dotIdx).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export function shouldIgnorePath(path: string): boolean {
  const segments = path.split("/");
  // Check ignored directories
  for (const seg of segments.slice(0, -1)) {
    if (IGNORED_DIRECTORIES.has(seg.toLowerCase())) {
      return true;
    }
  }

  const filename = segments[segments.length - 1].toLowerCase();

  // Skip lockfiles bulk
  if (SKIPPED_LOCKFILES.has(filename)) {
    return true;
  }

  // Skip sourcemaps and minified files
  if (filename.endsWith(".map") || filename.includes(".min.")) {
    return true;
  }

  // Skip secrets
  if (isSecretPath(path)) {
    return true;
  }

  // Skip binaries
  if (isBinaryPath(path)) {
    return true;
  }

  return false;
}

export function categorizeAndScoreFile(path: string): { category: FileCategory; priority: number } {
  const lower = path.toLowerCase();
  const filename = lower.split("/").pop() || "";

  // 1. README
  if (filename.startsWith("readme")) {
    return { category: "readme", priority: 100 };
  }

  // 2. Manifests
  if (
    filename === "package.json" ||
    filename === "cargo.toml" ||
    filename === "pyproject.toml" ||
    filename === "go.mod" ||
    filename === "pom.xml" ||
    filename === "build.gradle" ||
    filename === "requirements.txt" ||
    filename === "gemfile" ||
    filename === "composer.json"
  ) {
    return { category: "manifest", priority: 90 };
  }

  // 3. Configurations
  if (
    filename.includes("config") ||
    filename === "tsconfig.json" ||
    filename === "dockerfile" ||
    filename === "docker-compose.yml" ||
    filename === "docker-compose.yaml" ||
    filename === "wrangler.toml" ||
    filename === ".eslintrc.json" ||
    filename === "vite.config.ts" ||
    filename === "next.config.js" ||
    filename === "next.config.ts" ||
    filename === "next.config.mjs"
  ) {
    return { category: "config", priority: 80 };
  }

  // 4. Key Documentation
  if (
    filename === "architecture.md" ||
    filename === "contributing.md" ||
    filename === "design.md" ||
    lower.startsWith("docs/") ||
    lower.startsWith("doc/")
  ) {
    return { category: "documentation", priority: 70 };
  }

  // 5. High-signal source entry points & routing
  if (
    filename === "main.go" ||
    filename === "main.rs" ||
    filename === "main.py" ||
    filename === "index.ts" ||
    filename === "index.js" ||
    filename === "app.ts" ||
    filename === "server.ts" ||
    filename === "server.js" ||
    filename === "page.tsx" ||
    filename === "layout.tsx" ||
    path.includes("src/app/") ||
    path.includes("src/routes/") ||
    path.includes("src/controllers/")
  ) {
    return { category: "source", priority: 60 };
  }

  // 6. General source files
  const textExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".go",
    ".rs",
    ".java",
    ".rb",
    ".php",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".html",
    ".css",
    ".scss",
    ".sql",
    ".sh",
    ".yaml",
    ".yml",
    ".json",
    ".md",
  ];

  if (textExtensions.some((ext) => filename.endsWith(ext))) {
    return { category: "source", priority: 40 };
  }

  return { category: "source", priority: 10 };
}

/**
 * Filter and prioritize file tree items according to size and context constraints.
 */
export function selectRepositoryFiles(
  treeItems: GitHubTreeItem[],
  maxFiles = 25,
  maxFileBytes = 49152
): RankedFile[] {
  const eligible: RankedFile[] = [];

  for (const item of treeItems) {
    // Only examine blobs (files)
    if (item.type !== "blob") continue;

    // Check size limit if known
    if (typeof item.size === "number" && item.size > maxFileBytes) {
      continue;
    }

    // Check filters
    if (shouldIgnorePath(item.path)) {
      continue;
    }

    const { category, priority } = categorizeAndScoreFile(item.path);

    // Prefer shallow files slightly over deeply nested files of same priority
    const depth = item.path.split("/").length;
    const depthPenalty = Math.min(depth * 0.5, 10);
    const adjustedPriority = priority - depthPenalty;

    eligible.push({
      item,
      category,
      priority: adjustedPriority,
    });
  }

  // Sort descending by priority
  eligible.sort((a, b) => b.priority - a.priority);

  return eligible.slice(0, maxFiles);
}
