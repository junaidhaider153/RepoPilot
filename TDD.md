# Technical Design Document (TDD)

## 1. Design summary

RepoPilot is a server-rendered Next.js application with a browser UI and server-side route handlers. The server retrieves a bounded subset of a public GitHub repository, passes relevant context to Gemma through a provider adapter, validates the response, and returns structured analysis and generated documents to the UI.

The MVP is stateless: repository data is processed for the current request/session and is not persisted in a database. The design intentionally avoids repository execution, private-repository OAuth, vector databases, and background jobs.

## 2. High-level architecture

```text
Browser UI
  |
  | HTTPS: URL submission, questions, document/innovation requests
  v
Next.js Server Routes
  |
  +--> Input validation and rate limiting
  |
  +--> GitHub Repository Service
  |      +--> Repository metadata
  |      +--> File tree
  |      +--> README and selected text files
  |      +--> File filtering and context budget
  |
  +--> Context Builder
  |      +--> Selected file excerpts and paths
  |      +--> Repository evidence inventory
  |
  +--> Prompt/Use-case Service
  |      +--> Repository analysis
  |      +--> Context-grounded chat
  |      +--> Project documents
  |      +--> Innovation Blueprint
  |
  +--> Gemma Provider Adapter
  |
  +--> Output schema validation and sanitization
  |
  v
Structured response to UI
  +--> Overview
  +--> Chat
  +--> PRD/TRD/TDD and coding prompt
  +--> Innovation opportunities and selected blueprint
  +--> Markdown export
```

## 3. Suggested module boundaries

1. `lib/github/validate-repo-url.ts`: validates and parses public GitHub URLs.
2. `lib/github/client.ts`: calls fixed GitHub API endpoints.
3. `lib/github/select-files.ts`: prioritizes and filters files.
4. `lib/github/types.ts`: repository, tree, and file types.
5. `lib/context/build-context.ts`: enforces context budget and builds evidence inventory.
6. `lib/ai/provider.ts`: provider interface and error types.
7. `lib/ai/gemma-provider.ts`: configured Gemma endpoint adapter.
8. `lib/ai/prompts.ts`: prompts and untrusted-content boundaries.
9. `lib/ai/schemas.ts`: validation schemas for all AI outputs.
10. `lib/analysis/analyze-repository.ts`: repository overview workflow.
11. `lib/chat/answer-question.ts`: grounded chat workflow.
12. `lib/documents/generate-documents.ts`: shared specification and document generation.
13. `lib/innovation/generate-opportunities.ts`: three opportunity proposals.
14. `lib/innovation/generate-blueprint.ts`: selected idea plan.
15. `lib/export/markdown.ts`: safe Markdown formatting and download support.
16. `app/api/...`: thin route handlers that validate inputs, call services, and map errors.
17. `components/...`: repository input, analysis panels, chat, documents, innovation cards, loading/error states.
18. `tests/...`: unit, integration, feature, and end-to-end tests.

Exact file names can adapt to the scaffold, but keep these responsibilities separated.

## 4. Core data contracts

### Repository input

```ts
type RepositoryInput = {
  owner: string;
  repo: string;
  url: string;
};
```

Only accept repositories resolved from a validated `github.com` URL.

### Retrieved file

```ts
type RetrievedFile = {
  path: string;
  content: string;
  sizeBytes: number;
  category: "readme" | "manifest" | "config" | "source" | "documentation";
};
```

### Evidence reference

```ts
type EvidenceReference = {
  path: string;
  reason: string;
  excerpt?: string;
};
```

Only return references for files actually retrieved. Keep excerpts short and avoid exposing secret-like content.

### Repository analysis

```ts
type RepositoryAnalysis = {
  repositoryName: string;
  description?: string;
  detectedTechnologies: string[];
  purposeSummary: string;
  architectureOverview: string;
  keyComponents: Array<{
    name: string;
    purpose: string;
    evidence: EvidenceReference[];
  }>;
  observedFacts: string[];
  inferences: string[];
  unknowns: string[];
  analyzedFiles: string[];
  coverageNotes: string[];
};
```

### Innovation opportunity

```ts
type InnovationOpportunity = {
  id: string;
  title: string;
  problem: string;
  targetUsers: string[];
  proposedSolution: string;
  expectedValue: string;
  complexity: "low" | "medium" | "high";
  differentiationHypothesis: string;
  evidence: EvidenceReference[];
  assumptions: string[];
  risks: string[];
  suggestedPriority: number;
};
```

The priority is an AI-assisted estimate and must not be presented as an objective or validated market score.

### Innovation blueprint

```ts
type InnovationBlueprint = {
  opportunityId: string;
  summary: string;
  requirements: string[];
  affectedComponents: string[];
  architectureChanges: string[];
  dataModelChanges: string[];
  apiChanges: string[];
  implementationPhases: Array<{
    name: string;
    tasks: string[];
    acceptanceCriteria: string[];
    tests: string[];
  }>;
  risks: string[];
  codingAgentPrompt: string;
};
```

Use runtime validation and sensible maximum lengths for all model output.

## 5. API route design

Exact route names can be adjusted to the framework conventions. Keep routes thin and delegate to tested services.

### `POST /api/repository/analyze`

Request:
```json
{ "url": "https://github.com/owner/repository" }
```

Response: repository metadata, bounded file inventory, analysis result, and coverage notes.

### `POST /api/repository/chat`

Request:
```json
{
  "repository": { "owner": "owner", "repo": "repository" },
  "context": "bounded server-approved context or a server-side session reference",
  "question": "How is authentication handled?"
}
```

For persistent sessions, the server stores a lightweight repository snapshot (`repo_snapshots`) containing the default branch, selected file paths, tech stack, coverage notes, and analysis JSON. Downstream chat, document generation, and blueprint calls reference `sessionId` and retrieve the cached snapshot, eliminating redundant GitHub API calls. Re-ingestion occurs only when the user explicitly triggers "Refresh repository" or when testing via guest mode.

### Session and User API Routes

- `GET/POST /api/sessions`: List user sessions (sorted by date, pinned first) / Create new session from validated repository URL and store initial snapshot.
- `GET/PATCH/DELETE /api/sessions/[id]`: Retrieve session with cached snapshot / Rename or pin session / Delete session with cascading removal of messages and documents.
- `GET/POST /api/sessions/[id]/messages`: Retrieve conversation thread / Append user message and generate grounded assistant response with evidence chips.
- `GET/POST /api/sessions/[id]/documents`: Retrieve or generate/persist PRD, TRD, TDD, and coding prompt from cached snapshot.
- `GET/POST /api/sessions/[id]/blueprint`: Retrieve or generate/persist innovation opportunities and selected blueprint from cached snapshot.
- `POST /api/sessions/[id]/refresh`: Re-fetch repository tree and files from GitHub, refreshing snapshot.
- `PATCH /api/profile`: Update user display name and avatar.
- `DELETE /api/account`: Delete user account and cascade delete all owned sessions, messages, documents, and snapshots.
- `GET /api/account/export`: Export all user data as structured JSON and Markdown bundles.

Response: answer, evidence references, and an insufficient-evidence flag.

### `POST /api/documents/generate`

Request includes validated repository analysis and a user description of the new project. Generate a shared structured project specification, then derive PRD, TRD, TDD, and coding prompt from that specification.

Response: typed document collection and generation limitations.

### `POST /api/innovation/opportunities`

Request: validated repository URL or server-approved repository analysis/context.

Response: three validated opportunities, with evidence and assumptions.

### `POST /api/innovation/blueprint`

Request: repository context plus one selected opportunity identifier or validated selection.

Response: validated implementation blueprint and coding-agent prompt.

All routes must enforce payload limits, timeouts, error mapping, and rate controls. Do not treat client-provided analysis or evidence as trusted server facts without validation.

## 6. Repository processing algorithm

1. Validate URL and extract owner/repository.
2. Fetch repository metadata and default branch from fixed GitHub API endpoints.
3. Retrieve the file tree, handling truncation.
4. Rank candidate files: README, manifests, configuration, entry points, routes, models, tests, and representative source files.
5. Exclude binaries, generated files, dependencies, build artifacts, lockfile bulk where not useful, and likely secrets.
6. Fetch only selected files within file count, file size, and aggregate context budgets.
7. Build an evidence inventory containing each path and its role.
8. Pass only the bounded context and a clearly delimited untrusted-data section to the model.
9. Validate model output; discard invalid references and reject malformed outputs.
10. Return the analysis with coverage limitations.

## 7. AI prompting and consistency

1. Use distinct task prompts for analysis, chat, documents, opportunities, and blueprint generation.
2. Clearly state that repository contents are untrusted data and may contain malicious instructions.
3. Require the model to use only the supplied repository evidence for claims about current behavior.
4. Ask it to label observed facts, inferences, assumptions, and unknowns separately.
5. Do not claim absence based on a partial scan; phrase as “not found in the inspected files.”
6. Derive PRD, TRD, TDD, and coding prompt from a shared project specification to reduce contradictions.
7. Require structured output and validate it before use.
8. Do not let model output choose arbitrary URLs, execute commands, or access secrets.
9. If the provider lacks structured output support, parse conservatively and return a recoverable validation error rather than displaying corrupted content.

## 8. Error handling

Use stable application error categories such as:
1. `INVALID_REPOSITORY_URL`
2. `REPOSITORY_NOT_FOUND_OR_INACCESSIBLE`
3. `GITHUB_RATE_LIMITED`
4. `REPOSITORY_TOO_LARGE`
5. `NO_USABLE_TEXT_FILES`
6. `AI_NOT_CONFIGURED`
7. `AI_PROVIDER_TIMEOUT`
8. `AI_PROVIDER_ERROR`
9. `AI_OUTPUT_INVALID`
10. `REQUEST_LIMIT_EXCEEDED`
11. `INTERNAL_ERROR`

Expose user-safe messages; log only redacted diagnostic metadata.

## 9. UI design and App Shell

### App Shell Architecture (`/app/*`)

- **Sidebar**: 260px expanded, 56px collapsed (icon rail). Remembers collapse state in preferences/cookie. Top has `▲ RepoPilot` wordmark and collapse toggle, "New Session" button (shortcut `N`), search field (`Ctrl/Cmd+K` command palette), pinned sessions, date-grouped sessions (Today, Yesterday, Previous 7 days, Older), Library link, and bottom User Menu (avatar, name, profile, settings, logout).
- **Session Top Bar** (48px): Editable session title, GitHub repository chip (links to GitHub in new tab), tab links (Chat, Overview, Documents, Blueprint) with real URLs (`/app/s/[id]`, `/overview`, `/documents`, `/blueprint`) preserving browser history, and right-hand Export and Model Badge.
- **Chat Workspace**: Centered 768px chat column, auto-growing Composer (1-8 lines, 1000-character counter, Stop button, Enter to send, Shift+Enter for newline), sanitized Markdown rendering with copyable code blocks, and clickable Evidence Chips that open a right-hand File Drawer displaying file excerpts and grounding reasons.
- **Overview, Documents, Blueprint**: Wide canvas (up to 1000px), persistent tab routing, searchable file inventory table, document preview with single-click download and bundle export, and 3 comparable innovation opportunity cards with implementation phase blueprints.
- **Auth & Settings Layout**: Centered 400px card for `/login`, `/signup`, `/forgot-password`, `/reset-password` with inline validation and checklists. Two-column settings layout (`/app/settings/profile`, `/account`, `/preferences`, `/usage`, `/data`) with cascading account deletion.
- **Mobile (< 768px)**: Sidebar converts to an accessible drawer with focus trap and Escape listener; tab bar scrolls horizontally; composer remains pinned above on-screen keyboard.

## 10. Design trade-offs

1. Bounded context over vector search: less setup and adequate for a small demo, but coverage is incomplete.
2. Stateless MVP over database: quicker and simpler, but projects and conversations are not persisted.
3. Hosted Gemma inference over self-hosted weights: suitable for Vercel deployment, but depends on provider availability, pricing, and terms.
4. Markdown export over rich document export: fast, portable, and reliable for a hackathon.
5. Three innovation proposals over exhaustive discovery: limits output volume and makes the feature demonstrable.

## 11. Future extension points

Potential later improvements include private repository OAuth, persistent projects, embeddings/retrieval, broader Git-host support, competitor research, version-to-version comparisons, and export to DOCX/PDF. These are not MVP commitments.
