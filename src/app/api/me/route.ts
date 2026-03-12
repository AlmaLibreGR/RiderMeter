import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ ok: false, data: null }, { status: 401 });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      include: {
        appSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, data: null }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        roleType: user.roleType,
        locale: user.appSettings?.locale ?? user.locale,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, data: null }, { status: 401 });
  }
}
