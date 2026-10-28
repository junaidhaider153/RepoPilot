import { describe, it, expect } from "vitest";
import {
  selectRepositoryFiles,
  shouldIgnorePath,
  isSecretPath,
  isBinaryPath,
} from "@/lib/github/select-files";
import { GitHubTreeItem } from "@/lib/github/types";

describe("selectRepositoryFiles and filters", () => {
  it("detects and excludes secret files", () => {
    expect(isSecretPath(".env")).toBe(true);
    expect(isSecretPath(".env.local")).toBe(true);
    expect(isSecretPath("server.key")).toBe(true);
    expect(isSecretPath("cert.pem")).toBe(true);
    expect(isSecretPath("id_rsa")).toBe(true);
    expect(isSecretPath("credentials.json")).toBe(true);
    expect(isSecretPath("README.md")).toBe(false);
  });

  it("detects and excludes binary files", () => {
    expect(isBinaryPath("logo.png")).toBe(true);
    expect(isBinaryPath("photo.jpg")).toBe(true);
    expect(isBinaryPath("archive.zip")).toBe(true);
    expect(isBinaryPath("app.wasm")).toBe(true);
    expect(isBinaryPath("font.woff2")).toBe(true);
    expect(isBinaryPath("code.ts")).toBe(false);
  });

  it("ignores unwanted directories, lockfiles, and minified bundles", () => {
    expect(shouldIgnorePath(".git/HEAD")).toBe(true);
    expect(shouldIgnorePath("node_modules/react/index.js")).toBe(true);
    expect(shouldIgnorePath("dist/bundle.js")).toBe(true);
    expect(shouldIgnorePath(".next/static/chunks/app.js")).toBe(true);
    expect(shouldIgnorePath("package-lock.json")).toBe(true);
    expect(shouldIgnorePath("pnpm-lock.yaml")).toBe(true);
    expect(shouldIgnorePath("app.min.js")).toBe(true);
    expect(shouldIgnorePath("bundle.js.map")).toBe(true);

    expect(shouldIgnorePath("src/index.ts")).toBe(false);
    expect(shouldIgnorePath("README.md")).toBe(false);
    expect(shouldIgnorePath("package.json")).toBe(false);
  });

  it("prioritizes README, manifests, configs, and source files appropriately", () => {
    const mockTree: GitHubTreeItem[] = [
      { path: "src/utils/math.ts", mode: "100644", type: "blob", sha: "1", size: 500 },
      { path: "package-lock.json", mode: "100644", type: "blob", sha: "2", size: 5000 },
      { path: "README.md", mode: "100644", type: "blob", sha: "3", size: 1200 },
      { path: "tsconfig.json", mode: "100644", type: "blob", sha: "4", size: 400 },
      { path: "package.json", mode: "100644", type: "blob", sha: "5", size: 800 },
      { path: "assets/logo.png", mode: "100644", type: "blob", sha: "6", size: 1000 },
      { path: "node_modules/lib/index.js", mode: "100644", type: "blob", sha: "7", size: 300 },
      { path: "src/index.ts", mode: "100644", type: "blob", sha: "8", size: 1000 },
    ];

    const selected = selectRepositoryFiles(mockTree, 10, 49152);
    const paths = selected.map((s) => s.item.path);

    // Verify filtered out
    expect(paths).not.toContain("assets/logo.png");
    expect(paths).not.toContain("package-lock.json");
    expect(paths).not.toContain("node_modules/lib/index.js");

    // Verify ordering: README is highest, then manifest (package.json), then config, then source
    expect(paths[0]).toBe("README.md");
    expect(paths[1]).toBe("package.json");
    expect(paths[2]).toBe("tsconfig.json");
  });

  it("respects maxFiles and maxFileBytes limits", () => {
    const mockTree: GitHubTreeItem[] = [
      { path: "README.md", mode: "100644", type: "blob", sha: "1", size: 500 },
      { path: "huge-file.ts", mode: "100644", type: "blob", sha: "2", size: 100000 }, // > 49152 bytes
      { path: "file1.ts", mode: "100644", type: "blob", sha: "3", size: 200 },
      { path: "file2.ts", mode: "100644", type: "blob", sha: "4", size: 200 },
      { path: "file3.ts", mode: "100644", type: "blob", sha: "5", size: 200 },
    ];

    // maxFiles = 2, maxFileBytes = 50000
    const selected = selectRepositoryFiles(mockTree, 2, 50000);
    expect(selected.length).toBe(2);
    expect(selected.some((s) => s.item.path === "huge-file.ts")).toBe(false);
  });
});
