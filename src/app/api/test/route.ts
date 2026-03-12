import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "API works",
  });
}
