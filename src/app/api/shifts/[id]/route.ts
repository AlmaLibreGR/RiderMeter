import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { deleteShift, updateShift } from "@/services/shift-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const shiftId = Number(id);

    if (!Number.isInteger(shiftId) || shiftId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid shift id" }, { status: 400 });
    }

    const body = await req.json();
    const shift = await updateShift(currentUser.userId, shiftId, body);
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

    if (error instanceof Error && error.message === "SHIFT_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Shift not found" }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to update shift" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const shiftId = Number(id);

    if (!Number.isInteger(shiftId) || shiftId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid shift id" }, { status: 400 });
    }

    await deleteShift(currentUser.userId, shiftId);
    revalidatePath("/");
    revalidatePath("/history");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "SHIFT_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Shift not found" }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to delete shift" }, { status: 500 });
  }
}
