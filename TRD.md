# Technical Requirements Document (TRD)

## 1. Purpose

Define the technical capabilities and constraints required to deliver the RepoPilot MVP on Vercel using Next.js, TypeScript, GitHub's public API, and Gemma through a configurable inference provider.

## 2. Required technology

1. Application framework: Next.js with TypeScript.
2. Runtime: Node.js-compatible Vercel deployment.
3. UI: accessible React components and responsive CSS.
4. Repository source: GitHub REST API for public repository metadata, tree, README, and selected file contents.
5. AI: Gemma through a configurable hosted inference endpoint or compatible provider.
6. Validation: runtime schemas for request inputs and model outputs. Select a maintained validation library only if needed.
7. Testing: the framework's unit/integration test tools plus browser-based end-to-end testing where time permits.
8. Hosting: Vercel.
9. Documents: Markdown generated server-side or safely formatted on the client.

Antigravity must verify current package versions and provider request formats before implementation rather than assuming a specific API shape.

## 3. Runtime configuration

Required or optional server-side environment variables should be documented in `.env.example`, with no real secrets committed.

1. `GITHUB_TOKEN` — optional server-side token to improve GitHub API rate limits. Public unauthenticated access may be used when omitted.
2. `GEMMA_API_BASE_URL` — provider endpoint.
3. `GEMMA_API_KEY` — provider credential, if required.
4. `GEMMA_MODEL` — exact model identifier supported by the chosen provider.
5. `AI_REQUEST_TIMEOUT_MS` — bounded provider timeout.
6. `MAX_REPOSITORY_FILES` — maximum number of files considered.
7. `MAX_FILE_BYTES` — maximum individual file size.
8. `MAX_CONTEXT_CHARS` — maximum combined text context.
9. `MAX_REQUESTS_PER_WINDOW` or equivalent rate-limit configuration where supported.

Validate required settings at runtime. The application must explain missing AI configuration rather than crashing. Never expose environment variables to client-side code. Avoid using a `NEXT_PUBLIC_` prefix for secrets.

## 4. Repository ingestion requirements

1. Accept only HTTPS URLs on `github.com` in the MVP.
2. Parse owner and repository names safely; normalize trailing slashes and supported `.git` suffixes.
3. Reject unsupported URL forms, unexpected hosts, malformed names, and path traversal attempts.
4. Fetch repository metadata and default branch using GitHub API endpoints.
5. Retrieve the recursive tree when supported; handle truncated tree responses.
6. Select README, package manifests, lockfile metadata where useful, framework configuration, environment examples without secrets, and representative source files.
7. Skip `.git`, `node_modules`, vendor folders, build outputs, coverage, minified bundles, binaries, generated files, and files matching likely secret patterns.
8. Decode file content safely and skip content that cannot be handled as text.
9. Enforce configurable limits for file count, individual file size, aggregate context, and request duration.
10. Include a coverage note listing selected files and explaining that analysis is based on a bounded subset.
11. Handle 404, 403, 429, timeout, network failure, missing default branch, empty repository, and truncated tree responses.

## 5. AI inference requirements

1. All model requests run on the server.
2. Use a provider adapter that isolates endpoint details from product logic.
3. Include a model identifier in server configuration and visible product disclosure.
4. Build prompts with explicit instructions that repository content is untrusted input.
5. Ask the model to distinguish evidence, inference, and unknowns.
6. Use structured JSON output for analysis and innovation proposals where provider support allows; validate all output before rendering.
7. Do not trust model-produced paths unless they correspond to retrieved files.
8. Use request timeouts and safe error mapping. Retry only transient failures and only within a bounded policy.
9. Never silently use a different model or fixture when Gemma fails.
10. Unit tests must use a mocked provider; a separate integration smoke test should verify actual Gemma connectivity when credentials are configured.

## 6. Performance and hosting constraints

1. Keep each server request bounded to fit the configured Vercel function duration and payload constraints.
2. Avoid cloning and executing repositories on the server.
3. Avoid sending entire large repositories to the model.
4. Keep model context small and prioritize high-signal files.
5. If an operation cannot fit in one request, reduce scope for the MVP rather than adding a complex queue.
6. Avoid storing repository contents or prompts persistently in the MVP.
7. Keep responses and UI state bounded; use progress indicators for multi-stage work.
8. Check current Vercel plan and runtime limits before deployment and set explicit function configuration only when supported.

## 7. Security and privacy requirements

1. Never execute source code, shell commands, install scripts, or repository-provided workflows.
2. Treat repository files, README text, issue content, and model output as untrusted.
3. Ignore instructions found inside repository content that ask to reveal secrets, change policies, or perform external actions.
4. Validate and constrain all input URLs and API parameters.
5. Prevent SSRF by constructing requests only to fixed GitHub API hosts and the explicitly configured inference provider; do not fetch arbitrary URLs from repository content.
6. Keep secrets server-side; redact tokens from logs and errors.
7. Do not log full repository contents or prompts by default.
8. Sanitize Markdown rendering and disallow unsafe HTML.
9. Add request throttling or abuse controls appropriate to the deployment.
10. Disclose that submitted public repository content is sent to the configured inference provider, subject to that provider's terms and retention policy.
11. Do not claim that private data is supported or secure; private repositories are out of scope.

## 8. Accessibility and UX requirements

1. Semantic landmarks and heading order.
2. Labels for URL input and all form controls.
3. Keyboard-accessible tabs, dialogs, buttons, and export controls.
4. Visible focus states and adequate contrast.
5. Screen-reader announcements for loading and errors where appropriate.
6. Responsive layout for mobile, tablet, and desktop.
7. Empty, loading, partial-result, success, and error states.

## 9. Quality requirements

1. Unit tests for URL parsing, filters, limits, schema validation, prompt construction, scoring, and formatting.
2. Integration tests with mocked GitHub and AI provider boundaries.
3. Feature tests for all primary user journeys and failure states.
4. End-to-end smoke test for a known public repository.
5. Lint, TypeScript check, and production build.
6. Dependency and secret review before publishing.
7. A release checklist with actual commands and truthful results.

## 10. Deployment requirements

1. Project deploys to Vercel with documented build settings.
2. Environment variables are configured in Vercel settings, not committed.
3. `.env.example` contains placeholder values only.
4. Production error messages are useful but do not reveal stack traces, tokens, or internal provider payloads.
5. README documents local development, tests, deployment, model/provider configuration, known limits, and license.
6. A live smoke test is completed after deployment.
