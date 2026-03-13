import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { comparePassword, getCurrentUserFromCookie, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = passwordChangeSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const matches = await comparePassword(payload.currentPassword, user.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { ok: false, error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid password payload." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to update password." },
      { status: 500 }
    );
  }
}
