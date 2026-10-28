import { NextRequest, NextResponse } from "next/server";
import { generateProjectDocuments } from "@/lib/documents/generate-documents";
import { BoundedContext, GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { getAuthUser } from "@/lib/auth/get-user";
import { getRepoSnapshot, upsertSessionDocument, getSessionById } from "@/lib/persistence/store";
import { reconstructContextFromSnapshot } from "@/lib/analysis/analyze-repository";

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
            message: "Too many document generation requests. Please wait a moment before trying again.",
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
            message: "Missing 'url' in request body.",
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
          { error: { code: "UNAUTHORIZED", message: "Sign in to access session documents." } },
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

    // Use cached snapshot if available
    let cachedContext: BoundedContext | undefined;
    if (sessionId) {
      const snapshot = await getRepoSnapshot(sessionId);
      if (snapshot && snapshot.analysis_json) {
        cachedContext = reconstructContextFromSnapshot(snapshot);
      }
    }

    const result = await generateProjectDocuments({
      url: body.url,
      userIdea:
        typeof body.userIdea === "string"
          ? body.userIdea.trim().slice(0, 2000)
          : undefined,
      context: cachedContext,
    });

    // Save generated markdown documents to persistence
    if (sessionId && result.markdown) {
      if (result.markdown.prd) {
        await upsertSessionDocument(sessionId, { kind: "prd", contentMd: result.markdown.prd });
      }
      if (result.markdown.trd) {
        await upsertSessionDocument(sessionId, { kind: "trd", contentMd: result.markdown.trd });
      }
      if (result.markdown.tdd) {
        await upsertSessionDocument(sessionId, { kind: "tdd", contentMd: result.markdown.tdd });
      }
      if (result.markdown.prompt) {
        await upsertSessionDocument(sessionId, { kind: "prompt", contentMd: result.markdown.prompt });
      }
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
