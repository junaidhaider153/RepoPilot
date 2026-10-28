import { NextRequest, NextResponse } from "next/server";
import { generateProjectDocuments } from "@/lib/documents/generate-documents";
import { BoundedContext, GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { getAuthUser } from "@/lib/auth/get-user";
import { getRepoSnapshot, upsertSessionDocument } from "@/lib/persistence/store";

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

    // Use cached snapshot if available
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
