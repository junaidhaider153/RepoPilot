# RepoPilot — Staged QA and Test Plan

## 1. Non-negotiable rule

Development is module-by-module. After every meaningful module, run relevant unit tests, integration tests, feature tests, and regression checks before starting the next module. Record commands and actual results. Never mark unexecuted tests as passed.

## 2. Test levels

### Unit testing

Test individual functions and components in isolation:
1. GitHub URL parsing and validation.
2. Repository file selection and skip rules.
3. File-size, file-count, and context-budget enforcement.
4. Technology detection.
5. Prompt construction and untrusted-content boundaries.
6. Model response schema validation.
7. Evidence-reference validation.
8. Innovation opportunity validation and prioritization formatting.
9. Markdown generation and export formatting.
10. Error mapping and timeout handling.

### Integration testing

Use mocked GitHub and Gemma provider boundaries to test:
1. Repository metadata plus tree plus selected file retrieval.
2. Truncated tree, missing README, missing files, and rate-limit responses.
3. Context assembly and analysis generation.
4. Chat request to provider to validated response.
5. Shared project specification to PRD/TRD/TDD/coding prompt.
6. Innovation opportunities to selected blueprint.
7. Provider timeout, malformed output, and missing configuration.
8. Server routes reject invalid inputs and oversized payloads.

### Feature testing

Test complete user-facing features:
1. Enter a valid public GitHub URL and receive an analysis.
2. Invalid URL shows a useful validation message.
3. Repository overview shows technologies, files, limitations, and evidence.
4. Ask a question answerable from retrieved files and inspect references.
5. Ask a question unsupported by context and verify the system acknowledges uncertainty.
6. Generate all four project documents and copy/download each.
7. Generate three innovation opportunities and inspect evidence/assumptions.
8. Select one opportunity and generate a complete blueprint.
9. Verify loading, empty, partial, success, and error states.
10. Verify the interface remains usable on mobile and desktop.

### End-to-end testing

Run at least one browser-based happy path against a known, small public repository:
1. Open the application.
2. Submit the repository URL.
3. Wait for analysis to finish.
4. Verify a repository overview and analyzed-file inventory appear.
5. Ask a question grounded in the source.
6. Generate project documents.
7. Generate innovation opportunities.
8. Create and export a selected innovation blueprint.

Also run at least one negative path: invalid URL or unavailable repository, and one AI-provider failure path.

### Security and robustness testing

1. Reject URLs not hosted on `github.com`.
2. Reject malformed URL, unexpected ports, credentials embedded in URL, and path traversal attempts.
3. Ensure arbitrary repository content cannot cause server-side fetching of unrelated URLs.
4. Ensure source files are never executed.
5. Use a fixture containing prompt-injection instructions and verify the model is told to treat it as untrusted content.
6. Verify environment secrets are absent from client bundles, responses, and logs.
7. Check likely secrets are excluded from selected context.
8. Test file count, file size, aggregate context, and request payload limits.
9. Test GitHub and model provider 403/429, 5xx, timeout, and network failures.
10. Test Markdown sanitization and unsafe HTML handling.
11. Test repeated requests and abuse controls.
12. Check that error messages do not disclose tokens, stack traces, or full provider payloads.

### Accessibility and UI testing

1. Navigate all controls using the keyboard.
2. Verify visible focus indicators.
3. Check labels, heading order, semantic landmarks, and button names.
4. Verify loading and error feedback is accessible.
5. Check responsive layout at mobile, tablet, and desktop widths.
6. Check color contrast and avoid color-only status communication.

## 3. Mandatory quality gate after each module

For every module:
1. Run targeted unit tests.
2. Run relevant integration and feature tests.
3. Test a success path and at least one failure/edge path.
4. Run lint and TypeScript checks.
5. Run production build at scaffold, integration, and release milestones.
6. Review for regressions in completed modules.
7. Fix failures and rerun relevant checks.
8. Record module status, files changed, commands run, pass/fail counts, and remaining limitations.
9. Do not proceed with unresolved high-severity defects.

## 4. Suggested module sequence and exit criteria

### Module 0 — Workspace audit and scaffold
Exit criteria: concise audit/plan delivered; app runs; lint/type-check/test/build scripts exist and baseline passes.

### Module 1 — GitHub ingestion
Exit criteria: valid public repo loads; invalid URL, missing repo, rate limit, empty repo, and oversized repo paths are handled; unit and integration tests pass.

### Module 2 — Gemma provider
Exit criteria: mocked provider tests pass; missing configuration and provider failures are handled; actual Gemma smoke test passes when credentials are available; no silent model fallback.

### Module 3 — Repository analysis
Exit criteria: analysis shows evidence and coverage limits; references only retrieved files; malformed model response and insufficient context are handled.

### Module 4 — Repository chat
Exit criteria: supported question answers with file references where possible; unsupported question expresses uncertainty; prompt-injection fixture does not override system instructions.

### Module 5 — Project documents
Exit criteria: PRD, TRD, TDD, and coding prompt are generated from one shared specification; outputs can be copied/downloaded; consistency and failure tests pass.

### Module 6 — Innovation Blueprint
Exit criteria: three proposals with evidence and assumptions; selected idea expands into an implementation plan; unsupported novelty claims are avoided; malformed output is handled.

### Module 7 — UX, security, deployment
Exit criteria: responsive/accessibility checks pass; secrets review completed; production deployment and live smoke test pass.

### Module 8 — Release verification
Exit criteria: all available tests, lint, type-check, build, documentation, license, and final live demo are verified. Remaining limitations are documented.

## 5. Suggested commands

Antigravity must adapt these to the actual scripts in `package.json` and report exact commands used.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If scripts do not exist, add appropriate scripts and tests instead of reporting that checks passed. Use the project's actual package manager and lockfile.

## 6. Test data

Use a small, stable public repository as the demo target and document its URL. Do not rely on a repository that is unusually large or unstable. Mock external GitHub and inference calls for deterministic automated tests. Keep one explicit integration smoke test for real Gemma connectivity.

Fixtures should cover:
1. Valid repository.
2. Invalid and unsupported URL.
3. Empty repository.
4. Missing README.
5. Truncated file tree.
6. Binary and oversized files.
7. Likely secret file.
8. Prompt-injection content in README/source.
9. GitHub rate limit and server error.
10. AI timeout, malformed JSON, and unsupported answer.

## 7. Release report template

```text
Module:
Files changed:
Unit tests: command / passed / failed
Integration tests: command / passed / failed
Feature tests: command / passed / failed
Lint:
Type check:
Build:
Manual success-path checks:
Manual failure-path checks:
Security/accessibility checks:
Regressions found and fixed:
Known limitations:
Decision: PASS / BLOCKED
Next module:
```

A module is PASS only when relevant tests actually run and pass, or when a documented exception is explicitly accepted. Do not disguise missing tests as passing results.
