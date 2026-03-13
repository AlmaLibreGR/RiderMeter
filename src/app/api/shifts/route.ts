import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { createShift, listUserShifts } from "@/services/shift-service";

export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await listUserShifts(currentUser.userId, {
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
    platform: req.nextUrl.searchParams.get("platform") ?? undefined,
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const shift = await createShift(currentUser.userId, body);
    revalidatePath("/");
    revalidatePath("/history");

    return NextResponse.json({ ok: true, data: shift });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid shift payload" },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
