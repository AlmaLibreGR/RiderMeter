import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const shifts = await prisma.shift.findMany({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const shift = await prisma.shift.create({
      data: {
        userId: currentUser.userId,
        date: new Date(body.date),
        platform: body.platform,
        area: body.area,
        hours: Number(body.hours),
        ordersCount: Number(body.ordersCount),
        kilometers: Number(body.kilometers),
        platformEarnings: Number(body.platformEarnings),
        tipsCard: Number(body.tipsCard ?? 0),
        tipsCash: Number(body.tipsCash ?? 0),
        bonus: Number(body.bonus ?? 0),
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ ok: true, shift });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to create shift" },
      { status: 500 }
    );
  }
}