import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getSessionById, upsertRepoSnapshot } from "@/lib/persistence/store";
import { analyzeRepository } from "@/lib/analysis/analyze-repository";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { identifier, limit } = getRateLimitIdentifier(req.headers, user.id);
  const rateLimit = checkRateLimit(identifier, limit);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: { message: "Rate limit exceeded. Please wait a moment." } },
      { status: 429 }
    );
  }

  const { id } = await params;
  const session = await getSessionById(user.id, id);
  if (!session) {
    return NextResponse.json({ error: { message: "Session not found" } }, { status: 404 });
  }

  try {
    // Re-fetch files from GitHub and update analysis
    const freshAnalysis = await analyzeRepository(session.repo_url);

    const snapshot = await upsertRepoSnapshot(session.id, {
      defaultBranch: freshAnalysis.repository.defaultBranch || "main",
      selectedPaths: freshAnalysis.analyzedFiles.map((f) => f.path),
      analysisResult: freshAnalysis,
      coverageNotes: freshAnalysis.coverageNotes || [],
    });

    return NextResponse.json({
      success: true,
      refreshedAt: snapshot.fetched_at,
      snapshot,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to refresh repository";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
