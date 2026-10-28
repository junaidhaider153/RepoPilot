import { NextRequest, NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/analysis/analyze-repository";
import { GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { getAuthUser } from "@/lib/auth/get-user";
import { upsertRepoSnapshot, getSessionById } from "@/lib/persistence/store";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const { identifier, limit } = getRateLimitIdentifier(req.headers, user?.id);
    const rateCheck = checkRateLimit(identifier, limit);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_LIMIT_EXCEEDED",
            message: "Too many requests. Please wait before submitting additional analysis requests.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body.url !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Missing or invalid 'url' in request body. Must be a valid public GitHub URL string.",
          },
        },
        { status: 400 }
      );
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : null;
    if (sessionId) {
      if (!user) {
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Sign in to save repository snapshot." } },
          { status: 401 }
        );
      }
      const session = await getSessionById(user.id, sessionId);
      if (!session) {
        return NextResponse.json(
          { error: { code: "SESSION_NOT_FOUND", message: "Session not found or unauthorized access." } },
          { status: 404 }
        );
      }
    }

    const result = await analyzeRepository(body.url);

    // If sessionId provided, cache the snapshot
    if (sessionId) {
      await upsertRepoSnapshot(sessionId, {
        defaultBranch: result.repository.defaultBranch || "main",
        selectedPaths: result.analyzedFiles.map((f) => f.path),
        analysisResult: result,
        coverageNotes: result.coverageNotes || [],
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof GitHubIngestionError) {
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        },
        { status: err.status }
      );
    }

    if (err instanceof AIProviderError) {
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        },
        { status: err.status }
      );
    }

    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
