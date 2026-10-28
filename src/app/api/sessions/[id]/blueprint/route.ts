import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import {
  getSessionById,
  getSessionBlueprint,
  upsertSessionBlueprint,
} from "@/lib/persistence/store";
import { z } from "zod";

const SaveBlueprintSchema = z.object({
  opportunities: z.array(z.any()),
  selectedIndex: z.number().int().min(0).default(0),
  planJson: z.any().optional(),
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

  const blueprint = await getSessionBlueprint(id);
  return NextResponse.json({ blueprint });
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
    const parsed = SaveBlueprintSchema.parse(body);

    const bp = await upsertSessionBlueprint(id, parsed);
    return NextResponse.json({ blueprint: bp }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid blueprint payload";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}

