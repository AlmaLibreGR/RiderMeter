import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { listUserShifts } from "@/services/shift-service";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const shifts = await listUserShifts(currentUser.userId, {
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
    platform: req.nextUrl.searchParams.get("platform") ?? undefined,
  });

  const header = [
    "date",
    "startTime",
    "endTime",
    "platform",
    "area",
    "hoursWorked",
    "ordersCompleted",
    "kilometersDriven",
    "baseEarnings",
    "tipsAmount",
    "bonusAmount",
    "fuelExpenseDirect",
    "tollsOrParking",
    "notes",
  ];

  const rows = shifts.map((shift) =>
    [
      shift.date,
      shift.startTime ?? "",
      shift.endTime ?? "",
      shift.platform,
      shift.area,
      shift.hoursWorked,
      shift.ordersCompleted,
      shift.kilometersDriven,
      shift.baseEarnings,
      shift.tipsAmount,
      shift.bonusAmount,
      shift.fuelExpenseDirect ?? "",
      shift.tollsOrParking,
      (shift.notes ?? "").replaceAll('"', '""'),
    ]
      .map((cell) => `"${String(cell)}"`)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ridermeter-shifts.csv"',
    },
  });
}
