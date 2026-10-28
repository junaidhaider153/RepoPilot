import { NextRequest, NextResponse } from "next/server";
import { answerRepositoryQuestion } from "@/lib/chat/answer-question";
import { GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.url !== "string" || typeof body.question !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Missing 'url' or 'question' in request body.",
          },
        },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    const answer = await answerRepositoryQuestion({
      url: body.url,
      question: body.question,
      history,
    });

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
