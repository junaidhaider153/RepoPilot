Build reviewed: RepoPilot_1.rar (UI phase, Modules 9 to 15 as delivered by Antigravity) Method: full read of the app shell, session routes, chat/documents/blueprint panels, API routes, persistence store, auth, middleware, and SQL migration. Installed dependencies, ran typecheck, lint, production build and the full test suite, and wrote one throwaway reproduction against the real route handlers (deleted afterwards).

1. Result in one paragraph

The build is clean on paper and broken in practice. Typecheck, lint, build and all 130 tests pass, yet the two bugs you saw (chat and blueprint disappearing when you switch tabs) are real and have one shared root cause: the browser and the server keep two separate, unsynchronized lists of sessions. Because of that, saved history can never be loaded back, the repository cache never gets used, and several features (refresh, persistence) silently do nothing. The tests pass because none of them exercise a tab switch or a reload against the real routes. There are also three security-relevant issues and a landing page that was never redesigned.

Check	Result
tsc --noEmit	Pass
ESLint	Pass
next build	Pass
Vitest	23 files, 130 tests, all pass
Your 4 reported issues	All 4 reproduced or explained (section 2)
New issues found	20 (section 3)
2. Your four reported issues
Issue 1 and 2: landing page unchanged, only a small "Open App" button

Confirmed. src/app/page.tsx is still the old single-page app: hero, URL box, and the four-tab monolith (OverviewPanel, ChatPanel, DocumentsPanel, InnovationPanel) with local useState. The only change is a small Open App →, Log in and Sign up in MarketingHeader.tsx. It also means the product now has two parallel implementations of the analyze flow (landing and /app) that behave differently: the landing one has no sessions and no saved history, so work done there is lost on refresh.

My recommendation on your suggestion. Turning the landing page into a ChatGPT-style chat agent is a good direction for the layout, with one change. A general chatbot with no repository would break RepoPilot's core promise (answers grounded in inspected files) and would let anyone spend your free model quota with no account. So:

Make / a chat-first guest entry: a centered composer saying "Paste a GitHub URL to start", sample-repo chips under it, a short How it works strip, and a slim top bar (Product, How it works, Open workspace, Log in).
When a guest submits a URL, show the same workspace components used in /app (shared, not copied). Guests get one analysis and a few questions, kept in the tab, with a banner: sign in to save this session.
Logged-in users who open / are redirected to /app.
Delete the old four-tab monolith from page.tsx. Route guidance for other features comes from the top bar and from the session tabs (Chat, Overview, Documents, Blueprint).

Your other option (keep the original landing and only improve it) is fine too, but the monolith should still go, because it duplicates logic and hides the new routes.

Issue 3: asked a question, opened Overview, came back, question gone

Root cause confirmed by reproduction. Chat state lives in ChatPanel's useState. Each tab is now its own route, so leaving Chat unmounts the component and the messages are gone. The only recovery path is the effect that calls GET /api/sessions/{id}/messages. That call always fails for sessions created in the UI:

NewSessionPage calls createSession() from SessionContext, which only writes to localStorage with an id like s-1799999999999. Nothing ever calls POST /api/sessions.
/api/repository/chat still saves the messages (it accepts any sessionId).
GET /api/sessions/{id}/messages checks that the session exists on the server, does not find it, and returns 404. The panel swallows the error and shows the empty state with starter questions.

Reproduction against the real handlers: chat POST returned 200, then messages GET returned 404, then refresh POST returned 404, all for the same session id.

Issue 4: improvement plans (Blueprint) disappear the same way

Same cause (InnovationPanel and DocumentsPanel both restore from /api/sessions/{id}/blueprint and /documents, which return 404 for the same reason). There are two extra blueprint bugs on top (L-07 and L-08 below): the selected opportunity is never saved, and the saved plan can be shown under the wrong card.

3. Findings

Severity: Critical = data loss or security, High = feature broken, Medium = wrong behavior, Low = polish. "Verified" means I reproduced it or confirmed it by running code. "Code-read" means I traced it through the source but did not run it against a live Supabase project.

Critical

L-01 Split-brain sessions (Verified). Client list = localStorage (SessionContext), server list = Supabase or an in-memory Map. They never sync. Causes issues 3 and 4, a dead Refresh button (404), and an unusable cache. Fix: one source of truth. Create the session on the server first (POST /api/sessions, server returns the id), then navigate. Hydrate the sidebar from GET /api/sessions. Keep localStorage only as an offline cache for guests. Move chat messages, documents and blueprint state up into a per-session provider in app/s/[id]/layout.tsx, so switching tabs never unmounts them and restores are instant.

L-02 Persistence silently fails in production (Code-read, high confidence). The schema defines messages.id, documents.id and blueprints.id as UUID, but the store inserts ids like msg-1730…-ab12 and doc-1730…. Postgres rejects those, the catch {} swallows the error, and the code falls through to the in-memory Map and reports success. On a real Supabase project chat history and documents would never reach the database, and on Vercel the Map is per instance, so data would appear and vanish at random. Fix: let the database generate ids (omit id on insert), and stop using bare catch {} fall-throughs.

L-03 Fail-open authentication (Verified in code). If the Supabase env vars are missing, middleware allows every /app route and getAuthUser() returns one shared demo user (u-demo-1). A production deploy with a typo in an env var would give every visitor the same account and shared data, with no error. Fix: fail closed when NODE_ENV === "production" and Supabase is not configured. Use an explicit DEMO_MODE=true flag for local demos.

High

L-04 Silent fallback to memory on any database error (Code-read). Every function in persistence/store.ts catches all errors and writes to the in-memory Map instead. A network blip, an RLS rejection, or a schema error is hidden and the UI shows success. Return real errors to the caller and show a "Could not save" toast.

L-05 Repository cache never used, and would not work if it were (Verified). The new-session page calls /api/repository/analyze without a sessionId, so no snapshot is stored. Every later chat, document and blueprint call finds no snapshot and re-downloads the repository from GitHub, the exact problem the first review flagged. Separately, if a snapshot did exist, analyzedFiles holds only path, category and size, so the cached context is rebuilt with content: "File: <path>" and a hard-coded totalChars: 5000. The model would be answering from file names only, which breaks evidence grounding. Fix: pass sessionId on analyze, and store short evidence excerpts (not full files) with the snapshot, or re-fetch only the selected paths with a short server-side cache.

L-06 Refresh repository always fails for UI-created sessions (Verified). The refresh route requires the session to exist on the server (L-01), so it returns 404 and the toast says Session not found.

L-07 Blueprint selection not saved (Code-read). The client never sends selectedIndex, and the route defaults to 0. After a restore, the saved plan (for opportunity 3, say) is displayed under card 1.

L-08 Regenerating opportunities wipes the saved plan (Code-read). The opportunities route upserts with no planJson, so plan_json becomes null. If that is intended, say so in the UI. If not, keep the plan until the user confirms.

L-09 Retry and Regenerate duplicate messages (Code-read). The failed question is already in the thread, then handleSend adds it again. Regenerate appends a second copy of the last question and keeps the old answer. The duplicated entries are also sent back as chat history. Fix: Retry reuses the existing user message. Regenerate replaces the last assistant message.

L-10 Orphan user message saved before the answer (Code-read). The chat route stores the question first. If the AI call fails, history contains a question with no answer. Save both after a successful answer, or mark the failed one.

L-11 Sessions are per browser, not per account (Code-read). The sidebar reads one localStorage key (repopilot_sessions_v1). Sign out and sign in as someone else on the same browser and you see the previous person's sessions, including their stored analysis results. Clear it on sign out and key it by user id.

Medium

L-12 Fake seed sessions. SessionContext seeds "Spec-Kit Core Architecture" and "React Concurrent Runtime" for every new browser, and the server store seeds the same two ids. They are not real work and should not appear.

L-13 Wrong user name. The New Session greeting reads the hard-coded DEFAULT_USER ("Dev Lead") from SessionContext instead of the signed-in user from AuthContext.

L-14 Ownership not checked on AI routes (Code-read). /api/repository/chat, /analyze, /documents/generate and /innovation/* accept any sessionId and read or write its snapshot, messages and documents without verifying the session belongs to the user. Row-level security would block it on Supabase, but L-04 means the failure falls through to memory. Check ownership first in every route.

L-15 Progress stepper is a timer, not real progress (Verified in code). The chat steps flip to completed at 1.2 s, 3.2 s and 5.5 s regardless of what the server is doing. Steps are shown as done before they happen. This conflicts with the spec ("real stages") and with the product's honesty rule. Either wire real stages or show a single honest "Working…" state.

L-16 Scroll logic does nothing. containerRef has no overflow, so onScroll never fires and the Jump to latest button never appears. The auto-scroll effect also runs on mount and pulls the page to the bottom even for an empty chat.

L-17 In-memory rate limiter remains. Module 12 required a shared store. Limits are per serverless instance, so they are easy to exceed and may be inconsistent.

L-18 Export all downloads an empty file. handleExportAll writes a header and one line of text and then shows "Export Ready". Include the documents, blueprint and chat transcript, or hide the button until it does.

L-19 Open redirect via ?next=. Login does router.push(searchParams.get("next")) with no validation, so next=https://evil.example can send a user off site after login. Accept only paths that start with a single /.

Low

L-20 Smaller items.

The mobile menu opens by querying the DOM for an aria-label and calling .click(). Use shared state instead.
Whole analysisResult objects are stored in localStorage per session and can hit the browser quota, after which saves fail silently.
Message ids use Date.now() and can collide on fast double sends.
Copy-message failure has no feedback.
The group-hover underline on evidence chips has no group parent.
restored documents are rebuilt with empty spec objects, so structured fields are lost after a reload.
Documents inserts on Supabase add a new row each time instead of replacing the same kind, so a restore may pick an old version.

Previously flagged and now fixed: .env.example values are placeholders in this build.

4. Why the tests did not catch this

All 130 tests pass because they check components and handlers in isolation, with mocks. None of them does the real sequence a user performs: create session, ask, switch tab, switch back. None runs the store against an error. And the test for ids does not check them against the schema.

Add these regression tests:

Session sync: creating a session in the UI results in a row the server can return (GET /api/sessions contains it).
Tab-switch persistence: render the session layout, send a message, navigate to Overview and back, expect the message to still be there.
Reload persistence: unmount and remount, expect messages, documents, blueprint selection and plan restored.
Store failure: when the database returns an error, the API returns an error and the UI shows a toast, and nothing is written to memory.
Id format: inserts into messages, documents and blueprints use database-generated ids.
Fail closed: production mode with missing Supabase env returns 503 or redirects, and never returns the demo user.
Ownership: user B cannot read, write or refresh user A's session by id, on every route.
Cache: after analyze with a sessionId, a chat call makes zero GitHub requests and the model receives real file excerpts.
Retry and regenerate: neither creates a duplicate user message.
Redirect: next=https://evil.example and next=//evil.example fall back to /app.
5. Recommended fix order
L-03, L-19, L-14 (security, small and fast).
L-01 with L-06 and L-12 and L-13 (session source of truth; this alone fixes your issues 3 and 4).
L-02 and L-04 (persistence that really persists, with honest errors).
L-05 (working cache with real excerpts).
L-07, L-08, L-09, L-10 (chat and blueprint behavior).
Landing page redesign (issues 1 and 2) with the shared workspace components.
L-11, L-15, L-16, L-17, L-18, L-20 (privacy, honesty and polish).