import { RetrievedFile } from "./types";

/**
 * Detects programming languages, frameworks, and tools from retrieved repository files.
 */
export function detectTechnologies(files: RetrievedFile[]): string[] {
  const detected = new Set<string>();

  for (const file of files) {
    const filename = file.path.toLowerCase().split("/").pop() || "";
    const content = file.content.toLowerCase();

    // JavaScript / TypeScript ecosystem
    if (filename === "package.json") {
      detected.add("Node.js");
      try {
        const pkg = JSON.parse(file.content);
        const deps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
        };

        if (deps.next) detected.add("Next.js");
        if (deps.react) detected.add("React");
        if (deps.typescript) detected.add("TypeScript");
        if (deps.tailwindcss) detected.add("Tailwind CSS");
        if (deps.vue) detected.add("Vue.js");
        if (deps.svelte) detected.add("Svelte");
        if (deps.express) detected.add("Express");
        if (deps.fastify) detected.add("Fastify");
        if (deps.nestjs || deps["@nestjs/core"]) detected.add("NestJS");
        if (deps.prisma || deps["@prisma/client"]) detected.add("Prisma");
        if (deps["drizzle-orm"]) detected.add("Drizzle ORM");
        if (deps.vitest) detected.add("Vitest");
        if (deps.jest) detected.add("Jest");
        if (deps.playwright || deps["@playwright/test"]) detected.add("Playwright");
      } catch {
        // Parse error fallback: regex string checks
        if (content.includes('"next"')) detected.add("Next.js");
        if (content.includes('"react"')) detected.add("React");
        if (content.includes('"typescript"')) detected.add("TypeScript");
      }
    }

    if (filename === "tsconfig.json") {
      detected.add("TypeScript");
    }

    if (filename.includes("tailwind.config")) {
      detected.add("Tailwind CSS");
    }

    if (filename.includes("vite.config")) {
      detected.add("Vite");
    }

    // Python ecosystem
    if (filename === "pyproject.toml" || filename === "requirements.txt" || filename === "pipfile") {
      detected.add("Python");
      if (content.includes("fastapi")) detected.add("FastAPI");
      if (content.includes("django")) detected.add("Django");
      if (content.includes("flask")) detected.add("Flask");
      if (content.includes("pydantic")) detected.add("Pydantic");
      if (content.includes("pytest")) detected.add("Pytest");
      if (content.includes("torch") || content.includes("pytorch")) detected.add("PyTorch");
      if (content.includes("tensorflow")) detected.add("TensorFlow");
      if (content.includes("transformers") || content.includes("huggingface")) detected.add("Hugging Face");
    }

    // Go ecosystem
    if (filename === "go.mod") {
      detected.add("Go");
      if (content.includes("github.com/gin-gonic/gin")) detected.add("Gin");
      if (content.includes("github.com/labstack/echo")) detected.add("Echo");
    }

    // Rust ecosystem
    if (filename === "cargo.toml") {
      detected.add("Rust");
      if (content.includes("actix-web")) detected.add("Actix");
      if (content.includes("axum")) detected.add("Axum");
      if (content.includes("tokio")) detected.add("Tokio");
    }

    // Docker & Infrastructure
    if (filename === "dockerfile" || filename.includes("docker-compose")) {
      detected.add("Docker");
    }

    // Extensions fallback
    if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) detected.add("TypeScript");
    if (file.path.endsWith(".py")) detected.add("Python");
    if (file.path.endsWith(".go")) detected.add("Go");
    if (file.path.endsWith(".rs")) detected.add("Rust");
  }

  return Array.from(detected).sort();
}

