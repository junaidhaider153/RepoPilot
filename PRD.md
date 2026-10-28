# Product Requirements Document (PRD)

## 1. Product overview

Product name: RepoPilot  
Tagline: From codebase to blueprint.  
Product type: AI-powered web application for repository understanding and project planning.  
Primary model: Gemma, accessed through a configurable inference provider.  
Deployment target: Vercel.

RepoPilot helps developers understand an existing public GitHub repository and use that understanding to plan a new or improved project. It combines bounded repository analysis, evidence-grounded chat, structured project documents, and an Innovation Blueprint.

## 2. Problem statement

Developers learning an unfamiliar codebase must manually inspect documentation, manifests, directories, and source files to understand its architecture and capabilities. Turning that understanding into requirements and a coherent plan for a similar or improved project takes additional effort. Generic AI prompts can omit constraints, invent repository details, and produce inconsistent documents.

## 3. Product vision

Let a developer move from a public repository URL to a useful understanding of the codebase and an actionable plan for what to build next.

## 4. Target users

1. Students and early-career developers learning from public projects.
2. Hackathon participants exploring reference implementations.
3. Developers planning a similar application without copying a project blindly.
4. Small teams that need an initial requirements and technical planning package.

## 5. Goals and success criteria

### MVP goals

1. Analyze a supported public GitHub repository.
2. Explain the project using evidence from retrieved files.
3. Answer questions grounded in the bounded repository context.
4. Generate consistent PRD, TRD, TDD, and coding-agent prompt outputs.
5. Generate three improvement opportunities and a detailed blueprint for one selected idea.
6. Deploy a working application and document setup, AI usage, limitations, and license.

### Demo acceptance criteria

A judge can enter a valid public repository URL, receive an analysis, ask a repository-specific question, generate project documents, select an innovation idea, and download or copy the resulting blueprint without relying on hardcoded production responses.

Success is measured by completion of this end-to-end flow, accuracy of evidence references, graceful failure handling, and test results. Market traction is outside the hackathon MVP.

## 6. Scope

### In scope

1. Public GitHub repository URL validation.
2. Repository metadata, README, file tree, and bounded text-file retrieval.
3. Basic technology-stack detection from manifests and configuration.
4. AI-generated repository overview and architecture explanation.
5. Context-aware chat with file references when supported by evidence.
6. PRD, TRD, TDD, and coding-agent prompt generation.
7. Innovation Blueprint with three opportunities and one selected-feature implementation plan.
8. Markdown copy and download.
9. Responsive, accessible interface and meaningful loading/error states.
10. Vercel deployment and documentation.

### In scope for this phase

1. Public GitHub repository inspection and bounded text-file retrieval.
2. Technology-stack detection from manifests and configuration.
3. AI-generated repository overview, architecture analysis, and grounded chat.
4. Consistent PRD, TRD, TDD, and coding-agent prompt generation.
5. Innovation Blueprint with three opportunities and selected-feature implementation plan.
6. User accounts (email/password and GitHub OAuth) via Supabase Auth.
7. Persistent sessions, chat history, saved documents, and cached repository snapshots.
8. Guest try-it mode: visitors can run one analysis and questions in-memory without an account.
9. Profile, account settings, usage metrics, and full data export/deletion.
10. Markdown copy, export, and download.

### Out of scope for this phase

1. Private repositories.
2. Paid billing, subscriptions, and team workspaces.
3. Automatic code changes, commits, pull requests, or repository execution.
4. Guaranteed comprehensive static analysis of every file in very large monorepos.
5. Vector database and multi-agent background orchestration.
6. Support for arbitrary non-GitHub Git hosts.

## 7. Functional requirements

### FR-01: Repository input

The user can submit a public GitHub repository URL. The system validates the host, owner, repository, and supported URL format. Invalid, unsupported, missing, private, or inaccessible repositories receive understandable errors.

### FR-02: Bounded ingestion

The system retrieves repository metadata, default branch, tree, README, manifests, configuration, and a bounded selection of relevant text source files. It skips binaries, dependencies, build output, generated files, oversized files, and likely secrets. Limits must be configurable.

### FR-03: Repository analysis

The system displays repository metadata, detected technologies, key directories/files, a purpose summary, an architecture overview, and analysis limitations. It must distinguish observed evidence from inference and include relevant file paths where possible.

### FR-04: Repository chat

The user can ask questions about the analyzed repository. Responses should use only the provided context for repository-specific factual claims and reference file paths when possible. If evidence is insufficient, the system must say so rather than invent details.

### FR-05: Project document generation

The system produces four consistent outputs from a shared project specification:
1. PRD: target users, problem, goals, requirements, user stories, and acceptance criteria.
2. TRD: technical requirements, constraints, technology choices, integrations, security, performance, and compatibility.
3. TDD: architecture, components, data models, API contracts, flows, and implementation decisions.
4. Coding-agent prompt: phased tasks, context, constraints, tests, and completion criteria.

The UI must define these acronyms because teams may use them differently.

### FR-06: Innovation Blueprint

The system proposes three improvement opportunities. Each includes the problem, target user, expected value, complexity estimate, differentiation hypothesis, repository evidence, assumptions, dependencies, and risks. It must not call a feature absent without evidence.

### FR-07: Selected innovation plan

The user can select one opportunity and generate a plan containing requirements, affected components, architecture/data/API changes where applicable, phased implementation tasks, acceptance criteria, testing scenarios, risks, and a coding-agent prompt.

### FR-08: Export

Users can copy generated text and download Markdown documents. Exported content should have a title and date or repository reference where useful, without exposing credentials.

### FR-09: Error and progress feedback

The interface displays loading progress and actionable messages for invalid URLs, GitHub rate limits, unavailable files, timeouts, provider errors, malformed AI output, and input limits.

### FR-10: AI disclosure

The application identifies the configured Gemma model/provider and reports when the model is unavailable. It must not silently substitute another model or present fixtures as real model output.

### FR-11: Authentication

Users can create an account and log in using email/password or GitHub OAuth via Supabase. Protected routes (`/app/*`) enforce server-side authentication with `?next=` redirects. Authentication failures return a single generic error to prevent account enumeration. Session tokens are stored in `httpOnly`, `secure`, `sameSite` cookies; no tokens in `localStorage`.

### FR-12: Sessions and persistent history

A session represents one analyzed repository, titled `owner/repo` (user-renamable), holding its cached repository snapshot, conversation messages, generated documents, and selected blueprint. Sessions are managed from a collapsible sidebar (pinned, grouped by date: Today, Yesterday, Previous 7 days, Older) with search, rename, export, and delete (with undo).

### FR-13: Profile and account settings

Users can update display name and avatar, change email/password, view active devices, review usage metrics, export all account data (JSON + Markdown), and delete their account (cascading deletion of all user records, sessions, messages, and documents).

### FR-14: Guest try-it mode

Visitors at `/` can inspect a public repository and ask questions without an account, kept only in temporary browser state. Saving sessions, returning to history, and generating persistent documents requires signing in.

## 8. Non-functional requirements

1. Security: credentials remain server-side; no repository code execution; untrusted repository content cannot override application instructions.
2. Reliability: all external API calls have timeouts, bounded retries where safe, and clear failure states.
3. Performance: repository ingestion and model context are bounded; long-running workflows must respect Vercel runtime constraints.
4. Accessibility: keyboard-operable controls, visible focus, semantic headings, labels, and sufficient contrast.
5. Maintainability: modular ingestion, provider, prompt, validation, and UI layers.
6. Testability: deterministic unit tests, mocked external services, integration tests, and an end-to-end happy path.
7. Transparency: show analysis limitations and separate evidence from assumptions.
8. Portability: provider configuration is isolated behind an adapter and does not require changing product logic.

## 9. User stories

1. As a learner, I want to paste a repository URL so I can understand what the project does.
2. As a developer, I want to see the key files and technologies so I can navigate the codebase.
3. As a user, I want to ask questions and see file references so I can verify answers.
4. As a project builder, I want PRD/TRD/TDD documents so I can plan a similar application.
5. As an innovator, I want evidence-aware improvement ideas so I can choose a meaningful differentiator.
6. As a user of AI coding tools, I want a phased prompt so I can hand the plan to my coding agent.
7. As a user, I want to download outputs so I can reuse them outside RepoPilot.
8. As a returning user, I want to access my past repository sessions so I can continue asking questions without re-ingesting the repository.
9. As a developer, I want to rename, pin, and organize my sessions so I can find key analyses quickly.
10. As a privacy-conscious user, I want to export or delete my stored sessions and account data so I maintain full control over my data.

## 10. Key risks and mitigations

1. Hallucinated architecture: use bounded context, file-path references, evidence/inference labels, and insufficient-evidence responses.
2. Prompt injection in repository files: treat files as quoted untrusted data; never execute them.
3. Oversized repositories: strict file and context budgets, skip rules, and explicit coverage disclosure.
4. API rate limits: cache within the request/session where feasible, reduce calls, handle 403/429, and optionally use a server-side token.
5. Provider outage or model output errors: timeouts, schema validation, retries only where safe, and visible errors.
6. Generic innovation ideas: require repository evidence, user-problem framing, feasibility assessment, and label differentiation as a hypothesis.
7. Time pressure: keep authentication, persistence, vector search, and code modification out of scope.

## 11. Release acceptance checklist

1. A valid public repository can be analyzed end to end.
2. Invalid and unsupported repository URLs fail safely.
3. AI responses are produced by the configured Gemma provider when enabled.
4. Repository-specific answers include grounded file references when possible.
5. All four project documents can be generated and exported.
6. Three innovation ideas can be generated and one selected idea can be expanded.
7. Loading, empty, and error states are functional.
8. Unit, integration, feature, and end-to-end tests have been run and results reported honestly.
9. Lint, type-check, and production build pass where configured.
10. README, environment-variable documentation, AI disclosure, limitations, and MIT License are present.
