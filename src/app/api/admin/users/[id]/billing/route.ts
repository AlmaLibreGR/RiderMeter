import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdminFromCookie } from "@/lib/auth";
import { adminBillingUpdateSchema } from "@/lib/validators/admin";
import { updateUserBillingProfile } from "@/services/admin-service";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireAdminFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const params = await context.params;
    const userId = Number(params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid user id." }, { status: 400 });
    }

    const payload = adminBillingUpdateSchema.parse(await req.json());
    const data = await updateUserBillingProfile({
      userId,
      ...payload,
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid billing payload." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to update billing profile." },
      { status: 500 }
    );
  }
}
