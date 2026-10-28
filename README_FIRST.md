# RepoPilot — Hackathon Project Pack

This pack contains the product and engineering specifications, the Antigravity implementation prompt, and the staged QA plan for RepoPilot.

## Product direction

RepoPilot analyzes a public GitHub repository, explains its structure using Gemma, answers repository-grounded questions, and generates a project blueprint for building a new project. Its signature feature is the Innovation Blueprint, which proposes evidence-aware improvements and turns one selected opportunity into an actionable implementation plan.

## Read these files in order

1. `ANTIGRAVITY_MASTER_PROMPT.md` — paste this into Antigravity after creating/opening the project workspace.
2. `PRD.md` — product goals, users, scope, features, and acceptance criteria.
3. `TRD.md` — technology, infrastructure, limits, security, and operational requirements.
4. `TDD.md` — proposed architecture, data flow, modules, API contracts, and implementation decisions.
5. `QA_TEST_PLAN.md` — mandatory staged testing and release gates.
6. `LICENSE` — MIT License template. Replace `[YEAR]` and `[COPYRIGHT HOLDER]` before publishing.

## Important execution rule

Antigravity must inspect the actual workspace first and treat the current source code as truth. It must not assume that a feature exists merely because it appears in these documents. It should produce a concise audit and implementation plan, then implement one module at a time. After every module, it must run the relevant tests and checks, fix failures and regressions, and only then continue.

These documents define the intended new project. They are not evidence that any code has already been implemented or tested.
