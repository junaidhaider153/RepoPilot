import { NextRequest, NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/analysis/analyze-repository";
import { GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
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

    const result = await analyzeRepository(body.url);
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
