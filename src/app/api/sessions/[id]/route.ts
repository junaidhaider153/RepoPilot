import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getSessionById,
  updateSessionData,
  deleteSessionData,
  getRepoSnapshot,
} from "@/lib/persistence/store";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/security/rate-limiter";
import { z } from "zod";

const UpdateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const session = await getSessionById(user.id, id);
  if (!session) {
    return NextResponse.json({ error: { message: "Session not found" } }, { status: 404 });
  }

  const snapshot = await getRepoSnapshot(id);
  return NextResponse.json({ session, snapshot });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = UpdateSessionSchema.parse(body);

    const updated = await updateSessionData(user.id, id, parsed);
    if (!updated) {
      return NextResponse.json({ error: { message: "Session not found" } }, { status: 404 });
    }

    return NextResponse.json({ session: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid update payload";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteSessionData(user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: { message: "Session not found" } }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
