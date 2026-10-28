import { NextRequest, NextResponse } from "next/server";
import { answerRepositoryQuestion } from "@/lib/chat/answer-question";
import { GitHubIngestionError } from "@/lib/github/types";
import { AIProviderError } from "@/lib/ai/types";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local-client";
    const rateCheck = checkRateLimit(ip);
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
