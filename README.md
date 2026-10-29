<div align="center">
  <img src="public/brand/logo.jpg" alt="RepoPilot Logo" width="280" style="border-radius: 16px; margin-bottom: 16px;" />

  # RepoPilot

  **Evidence-Grounded Codebase Intelligence & Innovation Blueprint Engine**

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Gemma](https://img.shields.io/badge/AI-Gemma_2-orange?logo=google)](https://deepmind.google/technologies/gemma/)
  [![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
  [![Tests](https://img.shields.io/badge/Tests-204%20Passing-brightgreen)](./tests)

  <br />

  <p align="center">
    RepoPilot transforms complex public GitHub repositories into grounded architecture models, interactive architectural Q&A, coordinated project specifications (PRD, TRD, TDD, Agent Prompts), and actionable Innovation Blueprints.
  </p>

  <p align="center">
    <a href="#-deploy-to-vercel"><b>Deploy to Vercel</b></a> •
    <a href="#-core-capabilities"><b>Features</b></a> •
    <a href="#-quick-start"><b>Local Setup</b></a> •
    <a href="#-environment-variables"><b>Environment Variables</b></a> •
    <a href="#-architecture"><b>Architecture</b></a>
  </p>
</div>

---

## 🚀 Deploy to Vercel

RepoPilot is configured and optimized for immediate zero-config deployment on Vercel.

### 1-Click Deployment

Click the button below to fork and deploy directly into your Vercel account:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/junaidhaider153/RepoPilot&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,GEMMA_API_BASE_URL,GEMMA_MODEL,GEMMA_API_KEY,GITHUB_TOKEN,NEXT_PUBLIC_APP_URL)

---

### Manual Vercel Deployment Steps

1. **Import Project**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Under **Import Git Repository**, select **`junaidhaider153/RepoPilot`**.
   - Framework Preset will auto-detect as **Next.js**.

2. **Add Environment Variables**:
   In the Vercel deployment modal, add the following variables under **Environment Variables**:

   | Variable Name | Description | Example / Required Value |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key | `sb_publishable_...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | `sb_secret_...` |
   | `GEMMA_API_BASE_URL` | Inference Endpoint Base URL | `https://generativelanguage.googleapis.com/v1beta/openai` *(or Groq / OpenRouter / Ollama)* |
   | `GEMMA_MODEL` | Target Gemma Model | `gemma-2-9b-it` *(or `gemma2-9b-it`)* |
   | `GEMMA_API_KEY` | API Key for Gemma inference | Your Google AI Studio or Groq Key |
   | `GITHUB_TOKEN` | GitHub PAT (increases rate limit to 5k req/hr) | `ghp_...` |
   | `NEXT_PUBLIC_APP_URL` | Production application base URL | `https://your-repopilot.vercel.app` |
   | `SMTP_HOST` *(Optional)* | SMTP Host for custom mailers | `smtp.gmail.com` |
   | `SMTP_PORT` *(Optional)* | SMTP Port | `465` |
   | `SMTP_USER` *(Optional)* | SMTP Email Username | `your-email@gmail.com` |
   | `SMTP_PASS` *(Optional)* | Google App Password (16 chars) | `xxxx xxxx xxxx xxxx` |
   | `SMTP_FROM` *(Optional)* | Outgoing Mail Sender Display | `"RepoPilot <your-email@gmail.com>"` |

3. **Click Deploy**:
   Vercel will build and deploy your live production instance in ~60 seconds.

4. **Update Supabase Redirect URLs**:
   Once Vercel gives you your live URL (e.g., `https://repopilot.vercel.app`):
   - Open your **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**.
   - Set **Site URL** to: `https://your-repopilot.vercel.app`.
   - Add to **Redirect URLs**: `https://your-repopilot.vercel.app/**`.

---

## 🌟 Core Capabilities

### 1. Bounded Repository Ingestion
- Ingests public repositories via validated HTTPS GitHub URLs.
- Traversal protection rejects malicious paths, non-GitHub hosts, and private endpoints.
- Excludes binary assets, lockfile bulk, dependency directories (`node_modules/`, `vendor/`), and credential files (`.env`, `*.pem`).
- Automatically identifies tech stacks, manifest dependencies, and key entry points.

### 2. Evidence-Grounded Architecture Model
- Synthesizes architecture summaries, component diagrams, and runtime pipelines.
- Differentiates verified facts from probabilistic inferences.
- Every architecture card cites inspected source file paths.

### 3. Untrusted Codebase Q&A ("Ask the Repository")
- Context-bounded conversational chat assistant.
- Delimited with untrusted boundaries (`<untrusted_repository_content>`) to resist prompt-injection attacks.
- Honestly expresses `insufficientEvidence: true` when source files do not contain the answer, preventing hallucinations.

### 4. Harmonized Specification Synthesis
- Two-stage generation guarantees cross-document consistency:
  - **PRD**: Problem definition, user personas, success criteria, user stories.
  - **TRD**: Tech stack, constraints, scalability boundaries, security controls.
  - **TDD**: Component structure, data models, sequence flows, risk matrix.
  - **Coding Agent Prompt**: Phased prompt instructions ready for autonomous AI coding agents (Claude Code, Cursor, Antigravity).

### 5. Innovation Blueprint Engine
- Identifies 3 evidence-backed technical enhancement opportunities from the codebase.
- Expands any selected opportunity into a full step-by-step implementation blueprint with task breakdowns, test specifications, and agent prompts.

### 6. Authentication & Persistence Layer
- Full email/password registration with dual-mode verification:
  - 8-digit **Verification Passcode** input directly on `/signup`.
  - 1-click email confirmation links.
- GitHub OAuth integration support.
- Obsidian developer theme inspired by clean enterprise typography and hairline borders.
- Persistent sessions, chat history, document generation, and export capabilities.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript 5.7+ (Strict Mode) |
| **Styling** | Tailwind CSS v4, Lucide Icons, Geist Sans / Geist Mono fonts |
| **Inference Engine** | Gemma 2 (via OpenAI-compatible provider adapter) |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Supabase Auth) |
| **Transactional Email** | Supabase Auth Templates & Nodemailer SMTP with Google App Password support |
| **Testing** | Vitest, React Testing Library, JSDOM |
| **Deployment** | Vercel (Edge & Node.js Serverless Functions) |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js `20.x` or `22.x+`
- npm `10.x+`

### 1. Clone Repository
```bash
git clone https://github.com/junaidhaider153/RepoPilot.git
cd RepoPilot
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials and AI inference key in `.env.local`.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start exploring repositories.

---

## 🧪 Quality & Verification Gates

RepoPilot enforces strict testing and type safety across all components:

```bash
# Run complete test suite (204 tests across 40 test files)
npm test

# Run TypeScript strict type verification
npm run typecheck

# Verify Next.js production build locally
npm run build
```

---

## 🔒 Security & Safe Ingestion Architecture

- **Zero Remote Code Execution**: Code files are parsed as static text data and never executed or evaluated.
- **Untrusted Context Isolation**: External repository data is encapsulated inside explicit security tags.
- **Server-Only Credentials**: Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMMA_API_KEY`, `GITHUB_TOKEN`) are strictly confined to server-side routes and never bundled into the client runtime.
- **Rate Limiting**: Sliding-window rate limiters protect API routes against abuse and denial of service.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
