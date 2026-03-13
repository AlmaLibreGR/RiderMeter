import { NextResponse } from "next/server";
import { requireAdminFromCookie } from "@/lib/auth";
import { getAdminOverviewDataset } from "@/services/admin-service";

export async function GET() {
  const currentUser = await requireAdminFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const data = await getAdminOverviewDataset();
  return NextResponse.json({ ok: true, data });
}
