import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getDashboardDataset } from "@/services/dashboard-service";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const period = searchParams.get("period");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const data = await getDashboardDataset({
    userId: currentUser.userId,
    period:
      period === "today" || period === "week" || period === "month" || period === "custom"
        ? period
        : undefined,
    from,
    to,
  });

  return NextResponse.json({ ok: true, data });
}
