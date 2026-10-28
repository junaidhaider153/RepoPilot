import { NextRequest, NextResponse } from "next/server";
import { generateInnovationBlueprint } from "@/lib/innovation/generate-blueprint";
import { BoundedContext, GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { getAuthUser } from "@/lib/auth/get-user";
import { getRepoSnapshot, getSessionBlueprint, upsertSessionBlueprint, getSessionById } from "@/lib/persistence/store";

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
            message: "Too many blueprint requests. Please wait a moment before trying again.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);

    if (
      !body ||
      typeof body.url !== "string" ||
      !body.opportunity ||
      typeof body.opportunity !== "object" ||
      typeof body.opportunity.title !== "string"
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Missing 'url' or valid 'opportunity' object in request body.",
          },
        },
        { status: 400 }
      );
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : null;

    // Verify ownership if sessionId is provided
    if (sessionId) {
      if (!user) {
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Sign in to access session blueprints." } },
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

    let cachedContext: BoundedContext | undefined;
    if (sessionId) {
      const snapshot = await getRepoSnapshot(sessionId);
      if (snapshot && snapshot.analysis_json) {
        cachedContext = {
          repository: snapshot.analysis_json.repository,
          files: snapshot.analysis_json.analyzedFiles.map((f) => ({
            path: f.path,
            category: (f.category as any) || "core",
            content: (f as any).content || `File: ${f.path}`,
            sizeBytes: f.sizeBytes,
          })),
          totalChars: 5000,
          treeTruncated: false,
          totalTreeBlobs: snapshot.selected_paths.length,
          analyzedFilesCount: snapshot.analysis_json.analyzedFiles.length,
          detectedTechnologies: snapshot.analysis_json.detectedTechnologies || [],
          coverageNotes: snapshot.coverage_notes,
        };
      }
    }

    const result = await generateInnovationBlueprint({
      url: body.url,
      opportunity: body.opportunity,
      context: cachedContext,
    });

    if (sessionId) {
      const existing = await getSessionBlueprint(sessionId);
      await upsertSessionBlueprint(sessionId, {
        opportunities: existing?.opportunities_json || [body.opportunity],
        selectedIndex: typeof body.selectedIndex === "number" ? body.selectedIndex : 0,
        planJson: result,
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
