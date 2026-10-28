import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getSessionById,
  getSessionMessages,
  insertSessionMessage,
} from "@/lib/persistence/store";
import { z } from "zod";

const AddMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  evidence: z.array(z.any()).optional(),
  confidence: z.string().optional(),
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

  const messages = await getSessionMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(
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

  try {
    const body = await req.json();
    const parsed = AddMessageSchema.parse(body);

    const message = await insertSessionMessage(id, parsed);
    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid message payload";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}

