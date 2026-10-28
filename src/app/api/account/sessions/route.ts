import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { deleteAllUserSessions } from "@/lib/persistence/store";

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  try {
    await deleteAllUserSessions(user.id);
    return NextResponse.json({
      success: true,
      message: "All repository sessions and cached snapshots deleted.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete sessions.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

