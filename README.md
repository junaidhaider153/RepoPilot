# ▲ RepoPilot — From Codebase to Blueprint

> AI-powered repository understanding and project planning tool for developers, hackathon participants, and engineering leads.

RepoPilot analyzes public GitHub repositories with bounded context extraction, answers codebase questions grounded in retrieved source files, synthesizes unified project specifications (PRD, TRD, TDD, and phased coding-agent prompts), and generates evidence-backed Innovation Blueprints with actionable implementation plans.

Built for the **Hacktoberfest Hack Day** using Next.js App Router, TypeScript, Tailwind CSS, and Gemma 2 via configurable inference adapters.

---

## 🌟 Core Features

1. **Repository Ingestion & Bounded Analysis**
   - Strictly validates public GitHub HTTPS repository URLs; rejects malicious hosts, path traversal, and unauthorized protocols.
   - Bounded ingestion: retrieves default branch tree, prioritizes README, manifests (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`), configuration files, and key source entry points.
   - Automatic exclusions: strips binary files, lockfile bulk, dependency directories (`node_modules/`, `vendor/`), and secret files (`.env`, `*.pem`, `*.key`).
   - Automatically detects programming languages, libraries, and frameworks.

2. **Repository Architecture Overview**
   - Generates purpose summaries, system architecture breakdowns, and key component cards.
   - Grounded citations: every component references inspected file paths.
   - Separation of concerns: clearly differentiates **Observed Facts**, **Architectural Inferences**, and **Unknowns**.

3. **Grounded Codebase Q&A (Ask the Repository)**
   - Conversational chat grounded strictly in retrieved context.
   - Answers cite exact file paths.
   - Expresses uncertainty: when information is absent from inspected files, RepoPilot explicitly declares `insufficientEvidence: true` rather than hallucinating details.
   - Prompt-injection defense: treats repository files as untrusted text enclosed in security delimiters (`<untrusted_repository_content>`), ensuring instructions in source code cannot override system policies.

4. **Project Document Generation (PRD, TRD, TDD, Agent Prompt)**
   - Two-stage synthesis: first establishes a cohesive **Shared Project Specification**, then derives all four documents from that single specification to eliminate cross-document contradictions.
   - **PRD**: Product Requirements Document (problem, target users, goals, user stories, acceptance criteria).
   - **TRD**: Technical Requirements Document (technology stack, architecture pattern, constraints, security, testing strategy).
   - **TDD**: Technical Design Document (components, data models, request flows, risks & mitigations).
   - **Coding-Agent Prompt**: Ready-to-use phased instructions for autonomous coding agents (Claude Code, Cursor, Antigravity, Copilot).
   - 1-click Markdown copy and download for individual documents or full bundle.

5. **Innovation Blueprint**
   - Discovers **three (3) prioritized enhancement opportunities** directly grounded in inspected files (e.g., concurrency bottlenecks, missing tests, scaling limits).
   - Labels differentiation as a testable **hypothesis**, not an objective market certainty.
   - Interactive selection: expand any opportunity into an actionable **Implementation Blueprint** with technical requirements, affected components, phased implementation tasks, verification tests, and a dedicated coding-agent prompt.

---

## 🛠️ Tech Stack & Design System

- **Framework**: Next.js 15+ (App Router, Server Actions, Serverless Edge Route Handlers)
- **Language**: TypeScript 5.7+ (strict mode enabled)
- **Styling**: Tailwind CSS configured with custom developer tokens (`#fafafa` paper white, `#171717` obsidian text/buttons, `#ebebeb` hairline borders, `#297a3a` terminal green for success confirmation)
- **Typography**: Geist Sans & Geist Mono (with Inter and JetBrains Mono fallbacks)
- **AI Inference**: Gemma (e.g. `gemma2-9b-it`) accessed through a server-only OpenAI-compatible provider adapter (Groq, OpenRouter, Ollama, Hugging Face, etc.)
- **Validation**: Zod runtime schema validation for all inputs and model outputs
- **Testing**: Vitest for unit & integration testing
- **Deployment**: Vercel ready (stateless, zero database required for MVP)

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v20+` or `v24+`
- npm `10+` or `11+`

### 1. Clone & Install

```bash
git clone https://github.com/your-username/repopilot.git
cd repopilot
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your inference provider and optional GitHub token in `.env.local`:

```env
# Optional: raises GitHub unauthenticated rate limit from 60 to 5,000 req/hr
GITHUB_TOKEN=your_github_personal_access_token

# Gemma Provider (Groq example)
GEMMA_API_BASE_URL=https://api.groq.com/openai/v1
GEMMA_MODEL=gemma2-9b-it
GEMMA_API_KEY=gsk_your_groq_api_key

# Alternatively, for local Ollama:
# GEMMA_API_BASE_URL=http://localhost:11434/v1
# GEMMA_MODEL=gemma2:9b
# GEMMA_API_KEY=ollama

# Provider timeout and bounded context limits
AI_REQUEST_TIMEOUT_MS=30000
MAX_REPOSITORY_FILES=25
MAX_FILE_BYTES=49152
MAX_CONTEXT_CHARS=120000
MAX_REQUESTS_PER_WINDOW=30
```

> **Note on Model Configuration**: RepoPilot adheres to strict AI transparency. If credentials or configuration are absent, the application gracefully reports configuration instructions rather than silently substituting an alternative model.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Gates

RepoPilot follows a strict test-driven quality gate after every module.

```bash
# Run all unit and integration tests (Vitest)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run Next.js production build
npm run build
```

---

## 📖 Walkthrough Demo Path

1. **Submit Repository**: Paste any public GitHub URL (e.g., `https://github.com/octocat/Hello-World` or `https://github.com/facebook/react`) or click one of the sample repository pills.
2. **Review Overview**: Inspect detected technology stack tags, purpose summary, architectural overview, key components with verified file path chips, and coverage limitations.
3. **Ask the Codebase**: Navigate to **Ask Codebase** and ask questions like *"How does routing work?"* or *"What dependencies are imported?"*. Observe that answers cite verified file paths and acknowledge when evidence is absent.
4. **Generate Documents**: Navigate to **Project Documents**, provide an optional project goal, and click **Generate PRD, TRD, TDD & Coding Prompt**. Review each document in the tabbed viewer and copy or download the markdown files.
5. **Explore Innovations**: Navigate to **Innovation Blueprint** and generate 3 evidence-backed opportunities. Select an opportunity to expand it into a full phased implementation roadmap with acceptance tests and coding-agent prompt.

---

## 🔒 Security & Privacy Model

- **No Code Execution**: Repository files are never executed, compiled, or evaluated on the server.
- **Untrusted Boundaries**: All external content from GitHub is treated as untrusted third-party data enclosed in boundary delimiters.
- **Server-Only Credentials**: Provider keys (`GEMMA_API_KEY`, `GITHUB_TOKEN`) are strictly restricted to server-side route handlers and never exposed in client bundles.
- **Abuse Throttling**: In-memory sliding-window rate limiting prevents API abuse and denial of service.
- **Path Sanitization**: Directory traversal (`..`, `%2e`) and non-GitHub hosts are rejected prior to network requests.

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

