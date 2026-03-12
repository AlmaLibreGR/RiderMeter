import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { expenseEntrySchema } from "@/lib/validators/settings";
import { createExpenseEntry, listExpenseCategories, listRecentExpenses } from "@/services/expense-service";

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [categories, entries] = await Promise.all([
    listExpenseCategories(currentUser.userId),
    listRecentExpenses(currentUser.userId),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      categories,
      entries,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = expenseEntrySchema.parse(await req.json());
    const entry = await createExpenseEntry({
      userId: currentUser.userId,
      categoryId: payload.categoryId,
      category: payload.category,
      amount: payload.amount,
      date: payload.date,
      description: payload.description,
    });

    return NextResponse.json({ ok: true, data: entry });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid expense payload" },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to save expense entry" },
      { status: 500 }
    );
  }
}
