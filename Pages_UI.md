# RepoPilot: Pages and UI Addition

Companion to PRD, TRD, TDD and DESIGN.md. Source of truth for the UI, auth and sessions phase.

## 1. Review findings (current codebase)

### How the frontend works today

- One route (`/`) holds everything. `page.tsx` keeps the repo URL, analysis result and active tab in `useState`, so a refresh wipes the whole workspace.
- The four panels (Overview, Chat, Documents, Innovation) stay mounted and toggle with `hidden`. That preserves state across tabs, but nothing survives a reload.
- `layout.tsx` has one global header with no user area and no navigation.
- Chat history lives only inside `ChatPanel` state. The last 10 messages are sent back to the API on each question.

### Issues that matter once accounts and sessions exist

1. **Every API call re-ingests the repository.** `answerRepositoryQuestion` calls `ingestRepository` on each question unless a context is passed in, and the route never passes one. With saved sessions this becomes a speed and rate-limit problem, so a session needs a cached snapshot.
2. **No streaming.** The provider only has `generateCompletion`, so chat shows a spinner until the full JSON answer arrives. Answers are structured JSON (answer, evidence, confidence), which is awkward to stream. See section 7.
3. **The rate limiter will not hold up.** It is an in-memory Map keyed by `x-forwarded-for`. Vercel serverless instances do not share memory, and once users log in it should key on user id.
4. **Scope conflict with existing documents.** PRD section 6 lists user accounts and persistent history as out of scope, and TRD section 6.6 says not to store repository content persistently. This phase reverses both. Section 10 lists the edits.
5. **Possible leaked key.** `.env.example` appears to contain a real value for `GEMMA_API_KEY`. Rotate the key, replace the value with a placeholder, and check Git history and any shared archive.

### Reference image versus the design system

The reference gives the layout: a slim icon rail, a tab bar, a centered greeting, one large composer, suggestion chips under it, and a small info card at the bottom. DESIGN.md asks for monochrome, hairline borders, no gradients and no colored accents. Take the **layout** from the reference and the **look** from DESIGN.md. No colored sidebar icons, no wallpaper. Section 8 maps one to the other.

## 2. Core concept: session

A **session** is one analyzed repository plus its chat thread, generated documents and chosen blueprint.

- **Created** when the user submits a repository URL on the New Session screen.
- **Titled** automatically as `owner/repo`, and renamable.
- **Updated** as the user chats, generates documents or picks a blueprint.
- **Managed** from the sidebar: pin, rename, export, delete.
- **One repository per session.** A different repo means a new session, so every file reference belongs to one known snapshot.

## 3. Site map

| Route | Page | Access | Phase |
|---|---|---|---|
| `/` | Landing with try-it field | Public | 1 |
| `/login` | Log in | Public | 1 |
| `/signup` | Create account | Public | 1 |
| `/forgot-password` | Request reset link | Public | 1 |
| `/reset-password` | Set new password | Public (token) | 1 |
| `/verify-email` | Email confirmation result | Public (token) | 2 |
| `/about-ai` | AI disclosure, limits, data handling | Public | 1 |
| `/privacy`, `/terms` | Legal pages | Public | 1 |
| `/app` | New session (home) | Login | 1 |
| `/app/s/[id]` | Chat workspace | Login | 1 |
| `/app/s/[id]/overview` | Repository overview | Login | 1 |
| `/app/s/[id]/documents` | PRD, TRD, TDD, agent prompt | Login | 1 |
| `/app/s/[id]/blueprint` | Innovation Blueprint | Login | 1 |
| `/app/library` | All generated documents | Login | 2 |
| `/app/settings/profile` | Name, avatar | Login | 1 |
| `/app/settings/account` | Email, password, devices, delete account | Login | 1 |
| `/app/settings/preferences` | Defaults for sidebar, export | Login | 2 |
| `/app/settings/usage` | Request counts and limits | Login | 2 |
| `/app/settings/data` | Export or delete all history | Login | 2 |
| `/shared/[token]` | Read-only shared session | Public (token) | 3 |
| `/app/help` | Shortcuts and FAQ | Login | 3 |
| 404, error, 429, offline | System pages | Public | 1 |

**Guest mode.** Keep `/` working as a try-it page: one analysis and a few chat questions with no account, stored only in the browser tab. Saving sessions, documents and history requires login. The landing page shows a prompt to sign in to keep the session. This protects the PRD demo criterion that a judge can paste a URL without friction.

## 4. App shell and sidebar

All `/app/*` routes share one layout.

### Layout

- **Sidebar** on the left: 260px expanded, 56px collapsed (icon rail). Collapse state is remembered.
- **Top bar** on the right: 48px, inside a session only.
- **Content area** fills the rest. Chat column capped at 768px and centered. Overview, Documents and Blueprint use up to 1000px.

### Sidebar contents, top to bottom

1. RepoPilot wordmark (`▲ RepoPilot`) with a collapse button.
2. **New session** button (primary style, shortcut hint `N`).
3. **Search sessions** field that filters the list as you type. `Ctrl/Cmd+K` opens a command palette with the same search plus actions.
4. **Pinned** group, then date groups: Today, Yesterday, Previous 7 days, Older.
5. Each session row shows `owner/repo` in mono, the session title in sans, and a relative time. The active row has a visible left bar and bold text, not color alone. Hover or focus reveals a `⋯` menu: Rename, Pin, Export Markdown, Delete.
6. Library link and Settings link.
7. **User menu** at the bottom: avatar, name, then Profile, Settings, Keyboard shortcuts, Log out.

### Top bar inside a session

- Editable session title and a repo chip linking to GitHub (new tab).
- Tabs: Chat, Overview, Documents, Blueprint. Use real links so each tab has its own URL and the back button works.
- Right side: Export (all documents as Markdown), Share (Phase 3), and a model badge showing the configured Gemma model (FR-10).

### Mobile and tablet

- Below 768px the sidebar becomes a drawer opened from a menu button, with a focus trap and Escape to close.
- The composer stays pinned to the bottom and respects the on-screen keyboard.
- Tabs become a horizontally scrollable strip.

## 5. Page specifications

### 5.1 Landing (`/`)

- Keep the existing hero, repo input, sample repositories and four feature cards.
- Add a top bar with Log in and Sign up (Sign up is primary).
- Add a short **How it works** strip: Paste URL, Read evidence, Ask, Generate, Blueprint.
- Add a **demo terminal panel** with truthful sample output, labeled Demo, as DESIGN.md allows.
- Footer links: About the AI, Privacy, Terms, GitHub repository.

### 5.2 Log in (`/login`)

Centered 400px card on the paper-white canvas, wordmark above.

- Fields: email, password with show/hide toggle. Link: Forgot password.
- Continue with GitHub (OAuth).
- Primary button: Log in. Text link: Create an account.
- **States:** idle, submitting (disabled with spinner and label Logging in), wrong credentials, too many attempts (show wait time), unverified email, network failure.
- **Rules:** one generic error for wrong email or password. Preserve `?next=`. Associate errors with fields via `aria-describedby` and announce with `role="alert"`.

### 5.3 Sign up (`/signup`)

- Fields: name, email, password (single field with visible toggle).
- Live password guidance: minimum 10 characters, shown as an updating checklist. No forced symbol rules.
- Checkbox: agree to Terms and Privacy Policy, with links.
- One-line note that repository content is sent to the configured AI provider (TRD 7.10).
- **States:** field errors, email already registered (neutral message plus login link), success screen telling the user to check their inbox, resend with cooldown.

### 5.4 Forgot and reset password

- `/forgot-password`: email field and button. The confirmation message is the same whether or not the account exists.
- `/reset-password`: new password and confirm. Handle expired and already-used tokens with a clear message and a link to request a new one. On success, redirect to login with a notice.

### 5.5 New session (`/app`)

The screen closest to the reference image.

- Centered greeting using the user's name: `Hello <name>, which repository should we explore?`
- One large **composer card**: URL input with placeholder `https://github.com/owner/repository`, a primary send button, a hint line.
- Above the composer, a compact **options row** containing only options the backend supports (coverage limit now, branch later).
- Below the composer, **chips**: sample repositories (Hello-World, React, Next.js) and recent repos (last 3). Recent chips fill the field without submitting. Sample chips submit.
- Bottom info card: `Evidence-grounded analysis. Every claim points to a retrieved file.`
- **Submit flow:** validate URL client-side, create the session, navigate to `/app/s/[id]` and show the progress stepper. If ingestion fails, stay on the session page with an error panel and a Retry button so the typed URL is never lost.

### 5.6 Chat workspace (`/app/s/[id]`)

The main screen. It should feel like ChatGPT or Claude.

- **First view of a new session:** a compact repository summary card (name, description, technologies, files analyzed, coverage note), four suggested questions (reuse `STARTER_QUESTIONS`), and the composer.
- **Messages:** user messages in a light block, assistant messages full width with the `▲ RepoPilot` mono label. Render answers as sanitized Markdown with copyable code blocks (TRD 7.8).
- **Evidence chips** under each answer. Clickable: they open a right-hand **file drawer** with the retrieved excerpt and the reason. Chips for paths that were not retrieved get a muted style and a tooltip explaining why.
- **Badges:** keep "Limited evidence in inspected files". Add a confidence label (high, medium, low) from `ChatAnswerSchema`, always as text.
- **Message actions** on hover or focus: Copy, Regenerate (last answer only), Helpful / Not helpful (Phase 2).
- **Composer:** auto-growing textarea (1 to 8 lines), Enter to send, Shift+Enter for newline, character counter near the 1000-character backend limit, Stop button while generating, send disabled when empty.
- **Suggested follow-ups** (Phase 2): two or three short questions after each answer.
- **States:** empty, loading, streaming, error with Retry, rate-limited with countdown, session not found, repository no longer available.

### 5.7 Overview (`/app/s/[id]/overview`)

`OverviewPanel` moves here almost unchanged. Additions:

- Sticky section navigation (Purpose, Architecture, Key components, Observed facts, Inferences, Unknowns, File inventory).
- Keep evidence-versus-inference separation visible with distinct text labels.
- File inventory becomes a searchable table (path, category, size) with a link that opens the file drawer when content was retrieved.
- Button: Ask about this in chat, pre-filling a question about the selected component.

### 5.8 Documents (`/app/s/[id]/documents`)

`DocumentsPanel` moves here. Additions:

- Tab strip for PRD, TRD, TDD, Agent Prompt, with acronym definitions shown (FR-05).
- The `userIdea` field stays at the top with Generate / Regenerate and last generated time.
- Rendered preview with Copy, Download `.md`, and Download all (zip, Phase 2).
- **Version history** (Phase 2): keep the last 5 generations per session.
- Per-document status: Not generated, Generating, Ready, Failed with Retry.

### 5.9 Blueprint (`/app/s/[id]/blueprint`)

`InnovationPanel` moves here. Additions:

- Three comparable opportunity cards: problem, expected value, complexity, evidence, assumptions, risks. Selected state uses a border plus a text label, not color alone.
- Selecting a card opens the implementation plan below it, or in a split view on wide screens.
- Persist the selected idea and its plan with the session.
- Copy Agent Prompt and Download Markdown stay. Add a note that ideas are hypotheses, not proof of novelty.

### 5.10 Library (`/app/library`), Phase 2

Table of every generated document across sessions: title, type, repository, date. Filters by type and repository, search, bulk download, delete. Empty state links to New session.

### 5.11 Settings

Two-column layout: sub-navigation on the left, form card on the right.

| Page | Contents |
|---|---|
| **Profile** | Display name, avatar upload (2 MB, JPG or PNG), optional bio. Save button with unsaved-changes warning. |
| **Account** | Email change with re-verification, password change (current and new), active devices with Sign out of other devices, Danger zone with Delete account (type the email to confirm). |
| **Preferences** | Default sidebar state, default export format, auto-title sessions, reduced-motion override. |
| **Usage** | Requests used in the current window, limits in plain language, last 30 days as simple bars. |
| **Data and privacy** | Export all my data (JSON plus Markdown), delete all sessions, summary of what is stored and what is sent to the AI provider. |

### 5.12 Shared session (`/shared/[token]`), Phase 3

Read-only view of chat, overview and documents, with a banner saying who shared it and when. Owner can revoke the link from the session menu. Never show the owner's email or account details.

### 5.13 System pages

- **404** and **error** exist already. Add a link back to `/app` for logged-in users and to `/` otherwise.
- **429 page or inline banner:** explains the limit and shows the reset time.
- **Offline banner** in the app shell; composer disabled with an explanation.
- **Session expired modal** prompting re-login that keeps the unsent draft.

## 6. Component inventory

Shared components go under `src/components/ui`; feature components next to their feature folder.

| Component | Used in | Notes |
|---|---|---|
| `AppShell`, `Sidebar`, `SidebarToggle` | All `/app` pages | Persist collapse state |
| `SessionList`, `SessionItem`, `SessionMenu` | Sidebar | Date grouping, inline rename |
| `TopBar`, `SessionTabs`, `RepoChip`, `ModelBadge` | Session pages | Tabs are links |
| `Composer` | New session, chat | Auto-grow, counter, stop button |
| `SuggestionChips` | New session, chat | Keyboard reachable |
| `MessageList`, `MessageBubble`, `MessageActions` | Chat | Scroll anchoring |
| `MarkdownRenderer` | Chat, documents | Sanitized, no raw HTML |
| `EvidenceChip`, `FileDrawer` | Chat, overview | Excerpt and reason |
| `ProgressStepper` | Ingestion, generation | Real stages |
| `AuthCard`, `FormField`, `PasswordInput`, `PasswordChecklist` | Auth, settings | Inline errors |
| `Button`, `IconButton`, `Dropdown`, `Modal`, `ConfirmDialog`, `Tooltip` | Everywhere | Focus trap, Escape |
| `Toast`, `Banner` | Everywhere | `aria-live` |
| `Avatar`, `UserMenu` | Sidebar, settings | Initials fallback |
| `EmptyState`, `Skeleton`, `ErrorPanel` | Everywhere | One consistent pattern |
| `CommandPalette` | App shell | `Ctrl/Cmd+K` |
| `CopyButton`, `DownloadButton` | Documents, blueprint | Reuse existing logic |
| Route guard / middleware | `/app/*` | Redirect with `?next=` |

The existing `Badge` stays. Extract the repeated tab and card class strings in `page.tsx` into components first, so new pages do not copy them.

## 7. UX improvements to existing flows

1. **Cache the repository snapshot per session.** Ingest once at session creation, store the file list and context, and pass it to chat, documents and blueprint calls. Re-ingest only on Refresh repository.
2. **Real progress stepper:** Validate URL, Fetch repository tree, Select files, Read files, Ask Gemma, Validate output. If one API route cannot report stages, split ingestion and analysis into two requests so the UI can tick off the first stage honestly.
3. **Streaming chat.** Ask the model for the prose answer first and an evidence block last, stream the prose, validate evidence paths against retrieved files (already done in analysis code), then send them as a final event. Test with the configured model first. If it does not hold the format reliably, keep non-streaming JSON with the stepper and a skeleton message. Do not fake streaming by animating a finished answer.
4. **Auto-generated session titles** from the first question, falling back to the repo name.
5. **Draft preservation.** Save unsent composer text per session in the browser.
6. **Scroll behavior.** Stick to bottom while streaming, stop if the user scrolls up, show a Jump to latest button.
7. **Retry everywhere.** Every failed request shows Retry next to the existing actionable message.
8. **Keyboard shortcuts:** `N` new session, `/` focus composer, `Ctrl/Cmd+K` palette, `[` toggle sidebar, `Esc` close drawers.
9. **Toasts** for quiet confirmations (copied, saved, deleted), with Undo for delete.
10. **Accessibility carry-over.** Apply TRD section 8 to every new page, including drawer, menus and modals.

## 8. Design adaptation (reference to DESIGN.md)

| Reference element | RepoPilot version |
|---|---|
| Dark top bar with tabs | Paper-white top bar, hairline bottom border, tabs with underline plus bold text for the active one |
| Colored sidebar icons | Monochrome `lucide-react` icons in `#666666`, active icon `#171717` |
| Wallpaper background | Plain `#fafafa` canvas |
| Soft shadowed composer | White card, 1px `#ebebeb` border, 6px radius, no shadow, `#171717` border on focus |
| Greeting with logo | `▲` motif in mono next to the greeting |
| Suggestion chips | Hairline-bordered mono chips at 12px, 6px radius |
| Bottom promo card | Quiet info card, caption text, no illustration |
| Avatar and progress at sidebar bottom | Avatar and usage bar in the user menu |

**Dimensions:** sidebar 260 / 56px, app top bar 48px (64px stays for marketing pages), chat column 768px, composer min-height 56px, 4px spacing rhythm, 16px card padding. Reuse the existing CSS tokens and Tailwind color names. The `#fff9e6` warning and `#eaf5ed` success colors in `Badge.tsx` are outside the strict token list; add them to DESIGN.md or replace them.

## 9. Data and authentication architecture

### Decision

Supabase Auth plus Postgres with row-level security. Sign-in: email and password, plus GitHub OAuth.

### Tables

| Table | Key columns |
|---|---|
| `profiles` | `id` (user id), `display_name`, `avatar_url`, `created_at` |
| `sessions` | `id`, `user_id`, `repo_url`, `owner`, `repo`, `title`, `pinned`, `created_at`, `updated_at` |
| `repo_snapshots` | `session_id`, `default_branch`, `selected_paths`, `analysis_json`, `coverage_notes`, `fetched_at` |
| `messages` | `id`, `session_id`, `role`, `content`, `evidence_json`, `confidence`, `created_at` |
| `documents` | `id`, `session_id`, `kind` (prd, trd, tdd, prompt), `content_md`, `version`, `created_at` |
| `blueprints` | `id`, `session_id`, `opportunities_json`, `selected_index`, `plan_json`, `created_at` |
| `usage_events` | `user_id`, `route`, `created_at` |

**Stored content.** Store analysis output, selected file paths and short evidence excerpts. Do not store full file contents. Re-fetch files after a long gap or on Refresh. Update the TRD and privacy page to say exactly this.

### New API routes

- `GET/POST /api/sessions`, `GET/PATCH/DELETE /api/sessions/[id]`
- `GET/POST /api/sessions/[id]/messages`
- `GET/POST /api/sessions/[id]/documents`, `GET/POST /api/sessions/[id]/blueprint`
- `PATCH /api/profile`, `DELETE /api/account`, `GET /api/account/export`
- Existing AI routes verify the logged-in user (or apply guest limits) and take a `sessionId` so they can use the cached snapshot.

### Security checklist

- Sessions in `httpOnly`, `secure`, `sameSite` cookies. No tokens in `localStorage`.
- Verify the user on the server for every `/app` page and API route. Client-side guards are display only.
- Rate-limit login, signup and reset requests. Move the AI limiter to a shared store keyed by user id, with IP fallback for guests.
- Never reveal whether an email exists on login, signup or reset.
- Keep Markdown sanitization on for everything stored and shown, including shared pages.
- Every row query filtered by owner, enforced by database policy.
- Account deletion deletes sessions, messages, documents and blueprints.

## 10. Edits needed in existing documents

| Document | Change |
|---|---|
| PRD section 6 | Move accounts and persistent history from out of scope to in scope. Keep billing, teams and private repos out. |
| PRD section 7 | Add FR-11 Authentication, FR-12 Sessions and history, FR-13 Profile and account settings, FR-14 Guest mode. |
| PRD section 9 | Add user stories: return to a past analysis, rename and delete sessions, control my data. |
| TRD sections 2 and 3 | Add Supabase and its env vars (placeholders only). |
| TRD sections 6.6 and 7 | Replace the no-storage rule with the stored-data rule above. Add cookie, account and per-user rate-limit requirements. |
| TDD section 5 | Add the new routes and the session snapshot flow. |
| TDD section 9 and DESIGN.md | Add app shell, sidebar, composer, drawer, auth card and settings layout specs from sections 4 to 6 of this file. |
| QA plan | Add modules for the app shell, auth and persistence (section 11). |

## 11. Build order and exit criteria

One module at a time. Run the quality gate after each.

1. **Module 9: Primitives and app shell.** Extract Button, Input, Modal, Dropdown, Toast, Skeleton. Build `AppShell`, sidebar and top bar with mock data and local state. *Exit:* shell renders at mobile, tablet and desktop widths; keyboard navigation works.
2. **Module 10: Route split.** Move the four panels to routes under `/app/s/[id]`. Keep the current stateless APIs. *Exit:* each tab has a URL and survives back and forward.
3. **Module 11: Auth pages and protection.** Login, signup, forgot, reset, route guard, user menu. *Exit:* unauthenticated users cannot reach `/app` or any session API.
4. **Module 12: Persistence.** Tables, session CRUD, saved messages, documents and blueprints, snapshot caching. *Exit:* a reload restores a session, and another account cannot read it.
5. **Module 13: Chat upgrade.** Composer, message actions, evidence drawer, stepper, streaming if the model supports it. *Exit:* a long thread works and a failed request can be retried.
6. **Module 14: Settings and data controls.** Profile, account, usage, export, delete. *Exit:* delete account removes all rows.
7. **Module 15: Polish and release.** Library, shortcuts, empty and error states, accessibility pass, production build, deployment smoke test.

## 12. Acceptance checklist

- A new visitor can try one analysis without an account.
- Sign up, verify, log in, log out and reset password all work, including expired links.
- Wrong credentials show one generic message and never reveal whether the account exists.
- Protected routes redirect to login and return the user to their destination afterward.
- Sidebar lists sessions grouped by date and supports search, rename, pin and delete with Undo.
- Reloading a session restores messages, documents and blueprint.
- A second test account cannot open the first account's session by guessing the URL.
- Chat shows loading, error with Retry, and rate-limit countdown states.
- Evidence chips open the file drawer, and unretrieved paths are clearly marked.
- Every page is usable by keyboard alone, with visible focus and announced errors.
- Layout holds at 375px, 768px and 1280px with no horizontal page scroll.
- Lint, type-check, tests and production build pass, with results reported honestly.

## 13. Decisions made

- Auth and database: Supabase.
- Sign-in: email and password, plus GitHub.
- Guest try-it mode: kept.
- Dark mode: out of this phase.
- One repository per session.
- Confirm the Vercel plan's function duration before adding streaming.