import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { setupPayloadSchema } from "@/lib/validators/settings";
import { getSetupSnapshot, saveSetupSnapshot } from "@/services/setup-service";

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await getSetupSnapshot(currentUser.userId);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = setupPayloadSchema.parse(await req.json());
    const data = await saveSetupSnapshot(currentUser.userId, payload);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid setup payload" },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to save setup" },
      { status: 500 }
    );
  }
}
