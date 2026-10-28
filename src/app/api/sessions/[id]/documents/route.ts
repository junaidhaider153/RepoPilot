import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getSessionById,
  getSessionDocuments,
  upsertSessionDocument,
} from "@/lib/persistence/store";
import { z } from "zod";

const SaveDocumentSchema = z.object({
  kind: z.enum(["prd", "trd", "tdd", "prompt", "all"]),
  contentMd: z.string().min(1),
  version: z.number().int().optional(),
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

  const documents = await getSessionDocuments(id);
  return NextResponse.json({ documents });
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
    const parsed = SaveDocumentSchema.parse(body);

    const doc = await upsertSessionDocument(id, parsed);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid document payload";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}

