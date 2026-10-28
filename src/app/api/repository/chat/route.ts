import { NextRequest, NextResponse } from "next/server";
import { answerRepositoryQuestion } from "@/lib/chat/answer-question";
import { BoundedContext, GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { getAuthUser } from "@/lib/auth/get-user";
import { getRepoSnapshot, insertSessionMessage } from "@/lib/persistence/store";

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
            message: "Too many chat requests. Please wait a moment before sending another question.",
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);

    if (
      !body ||
      typeof body.url !== "string" ||
      typeof body.question !== "string" ||
      body.question.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Missing or empty 'url' or 'question' in request body.",
          },
        },
        { status: 400 }
      );
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : null;

    // Check if we have a cached snapshot for this session to avoid re-ingestion
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

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (h: any) =>
              h &&
              (h.role === "user" || h.role === "assistant") &&
              typeof h.content === "string"
          )
          .slice(-10)
      : [];

    // Save user question to message persistence if sessionId is active
    if (sessionId) {
      await insertSessionMessage(sessionId, {
        role: "user",
        content: body.question,
      });
    }

    const answer = await answerRepositoryQuestion({
      url: body.url,
      question: body.question,
      history,
      context: cachedContext,
    });

    // Save assistant answer to message persistence
    if (sessionId) {
      await insertSessionMessage(sessionId, {
        role: "assistant",
        content: answer.answer,
        evidence: answer.evidence,
        confidence: answer.confidence,
      });
    }

    return NextResponse.json(answer, { status: 200 });
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
