import { describe, it, expect } from "vitest";
import { detectTechnologies } from "@/lib/github/detect-tech";
import { RetrievedFile } from "@/lib/github/types";

describe("detectTechnologies", () => {
  it("detects Node, Next.js, React, Tailwind, and TypeScript from package.json and tsconfig.json", () => {
    const files: RetrievedFile[] = [
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: {
            next: "15.0.0",
            react: "19.0.0",
            tailwindcss: "3.4.0",
          },
          devDependencies: {
            typescript: "5.0.0",
            vitest: "3.0.0",
          },
        }),
        sizeBytes: 200,
        category: "manifest",
      },
      {
        path: "tsconfig.json",
        content: "{}",
        sizeBytes: 10,
        category: "config",
      },
    ];

    const tech = detectTechnologies(files);
    expect(tech).toContain("Next.js");
    expect(tech).toContain("React");
    expect(tech).toContain("Tailwind CSS");
    expect(tech).toContain("TypeScript");
    expect(tech).toContain("Vitest");
    expect(tech).toContain("Node.js");
  });

  it("detects Python and FastAPI from requirements.txt", () => {
    const files: RetrievedFile[] = [
      {
        path: "requirements.txt",
        content: "fastapi==0.110.0\nuvicorn==0.28.0\npydantic>=2.0",
        sizeBytes: 50,
        category: "manifest",
      },
      {
        path: "main.py",
        content: "from fastapi import FastAPI\napp = FastAPI()",
        sizeBytes: 45,
        category: "source",
      },
    ];

    const tech = detectTechnologies(files);
    expect(tech).toContain("Python");
    expect(tech).toContain("FastAPI");
    expect(tech).toContain("Pydantic");
  });

  it("detects Go and Docker from go.mod and Dockerfile", () => {
    const files: RetrievedFile[] = [
      {
        path: "go.mod",
        content: "module example.com/app\n\ngo 1.22\n\nrequire github.com/gin-gonic/gin v1.9.1",
        sizeBytes: 80,
        category: "manifest",
      },
      {
        path: "Dockerfile",
        content: "FROM golang:1.22-alpine\nWORKDIR /app",
        sizeBytes: 40,
        category: "config",
      },
    ];

    const tech = detectTechnologies(files);
    expect(tech).toContain("Go");
    expect(tech).toContain("Gin");
    expect(tech).toContain("Docker");
  });
});

