import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserSessions, insertSession } from "@/lib/persistence/store";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { z } from "zod";

const CreateSessionSchema = z.object({
  id: z.string().optional(),
  repoUrl: z.string().url("Valid repository URL is required"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  title: z.string().min(1),
});

export async function GET(req: NextRequest) {
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

  const sessions = await getUserSessions(user.id);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const parsed = CreateSessionSchema.parse(body);

    const sessionId = parsed.id || `s-${Date.now()}`;
    const session = await insertSession(user.id, {
      id: sessionId,
      repoUrl: parsed.repoUrl,
      owner: parsed.owner,
      repo: parsed.repo,
      title: parsed.title,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid session payload";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}

