import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { exportUserData } from "@/lib/persistence/store";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized." } }, { status: 401 });
  }

  try {
    const exportData = await exportUserData(user.id);
    const format = req.nextUrl.searchParams.get("format");

    if (format === "markdown") {
      return new NextResponse(exportData.markdownBundle, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="repopilot-export-${new Date().toISOString().split("T")[0]}.md"`,
        },
      });
    }

    if (format === "json") {
      return new NextResponse(exportData.jsonBundle, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="repopilot-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export data.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
