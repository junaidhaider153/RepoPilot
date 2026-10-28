import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserProfile, updateUserProfile } from "@/lib/persistence/store";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  try {
    const profile = await getUserProfile(user.id);
    return NextResponse.json({ profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load profile.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { displayName, avatarUrl, bio } = body;

    const updated = await updateUserProfile(user.id, {
      display_name: typeof displayName === "string" ? displayName.trim() : undefined,
      avatar_url: typeof avatarUrl === "string" ? avatarUrl : undefined,
      bio: typeof bio === "string" ? bio.trim() : undefined,
    });

    return NextResponse.json({ profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile.";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
