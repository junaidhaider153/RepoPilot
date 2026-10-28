import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserUsageStats } from "@/lib/persistence/store";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  try {
    const stats = await getUserUsageStats(user.id);
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load usage statistics.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
