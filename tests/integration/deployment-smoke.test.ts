import { describe, it, expect, vi } from "vitest";
import { GET as getSessions, POST as createSession } from "@/app/api/sessions/route";
import { GET as getSessionById, DELETE as deleteSession } from "@/app/api/sessions/[id]/route";
import { GET as getLibrary, DELETE as deleteLibraryDoc } from "@/app/api/documents/library/route";
import { GET as getProfile, PATCH as patchProfile } from "@/app/api/profile/route";
import { GET as getUsage } from "@/app/api/account/usage/route";
import { GET as getExport } from "@/app/api/account/export/route";
import { DELETE as wipeSessions } from "@/app/api/account/sessions/route";
import { DELETE as deleteAccount } from "@/app/api/account/route";
import { NextRequest } from "next/server";

// Mock authentication user
vi.mock("@/lib/auth/get-user", () => ({
  getAuthUser: vi.fn().mockResolvedValue({
    id: "smoke-test-user-1",
    email: "smoke-test@repopilot.local",
    displayName: "Smoke Tester",
  }),
}));

describe("Deployment Smoke Test — End-to-End API Routes", () => {
  let createdSessionId = "";

  it("creates and retrieves a new repository session via /api/sessions", async () => {
    const createReq = new NextRequest("http://localhost:3000/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        repoUrl: "https://github.com/github/spec-kit",
        owner: "github",
        repo: "spec-kit",
        title: "Spec-Kit Core Architecture",
      }),
    });

    const createRes = await createSession(createReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.session).toBeDefined();
    expect(createData.session.owner).toBe("github");
    expect(createData.session.repo).toBe("spec-kit");

    createdSessionId = createData.session.id;

    // List sessions
    const listRes = await getSessions(new NextRequest("http://localhost:3000/api/sessions"));
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.sessions.some((s: any) => s.id === createdSessionId)).toBe(true);

    // Get specific session
    const singleRes = await getSessionById(
      new NextRequest(`http://localhost:3000/api/sessions/${createdSessionId}`),
      { params: Promise.resolve({ id: createdSessionId }) }
    );
    expect(singleRes.status).toBe(200);
    const singleData = await singleRes.json();
    expect(singleData.session.id).toBe(createdSessionId);
  });

  it("reads and updates user profile via /api/profile", async () => {
    const getRes = await getProfile(new NextRequest("http://localhost:3000/api/profile"));
    expect(getRes.status).toBe(200);
    const profileData = await getRes.json();
    expect(profileData.profile).toBeDefined();

    const patchReq = new NextRequest("http://localhost:3000/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "Verified Smoke Runner",
        bio: "Smoke test verification complete.",
      }),
    });

    const patchRes = await patchProfile(patchReq);
    expect(patchRes.status).toBe(200);
    const updatedData = await patchRes.json();
    expect(updatedData.profile.display_name).toBe("Verified Smoke Runner");
  });

  it("retrieves usage metrics and limit allocations via /api/account/usage", async () => {
    const usageRes = await getUsage(new NextRequest("http://localhost:3000/api/account/usage"));
    expect(usageRes.status).toBe(200);
    const usageData = await usageRes.json();
    expect(usageData.stats.requestsLimit).toBe(60);
    expect(usageData.stats.dailyHistory.length).toBe(30);
  });

  it("exports account data bundle via /api/account/export", async () => {
    const exportRes = await getExport(new NextRequest("http://localhost:3000/api/account/export"));
    expect(exportRes.status).toBe(200);
    const exportData = await exportRes.json();
    expect(exportData.success).toBe(true);
    expect(exportData.data.jsonBundle).toBeDefined();
    expect(exportData.data.markdownBundle).toBeDefined();

    // Verify Markdown format query parameter
    const mdExportRes = await getExport(
      new NextRequest("http://localhost:3000/api/account/export?format=markdown")
    );
    expect(mdExportRes.headers.get("Content-Type")).toContain("text/markdown");
  });

  it("lists documents across sessions via /api/documents/library", async () => {
    const libRes = await getLibrary(new NextRequest("http://localhost:3000/api/documents/library"));
    expect(libRes.status).toBe(200);
    const libData = await libRes.json();
    expect(Array.isArray(libData.documents)).toBe(true);
  });

  it("wipes sessions and permanently deletes account via /api/account", async () => {
    // Test wiping sessions
    const wipeRes = await wipeSessions(
      new NextRequest("http://localhost:3000/api/account/sessions", { method: "DELETE" })
    );
    expect(wipeRes.status).toBe(200);

    // Test delete account with mismatched email (must fail)
    const badDeleteReq = new NextRequest("http://localhost:3000/api/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmEmail: "wrong-email@domain.com" }),
    });
    const badDeleteRes = await deleteAccount(badDeleteReq);
    expect(badDeleteRes.status).toBe(400);

    // Test delete account with matching email (must succeed)
    const goodDeleteReq = new NextRequest("http://localhost:3000/api/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmEmail: "smoke-test@repopilot.local" }),
    });
    const goodDeleteRes = await deleteAccount(goodDeleteReq);
    expect(goodDeleteRes.status).toBe(200);
  });
});
