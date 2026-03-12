import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { roundCurrency, toSafeNumber } from "@/lib/utils";
import { costProfileSchema } from "@/lib/validators/settings";

function calculateDailyFixedCost(payload: {
  insuranceMonthly: number;
  phoneMonthly: number;
  accountantMonthly: number;
  roadTaxMonthly: number;
  kteoMonthly: number;
  otherMonthly: number;
  dailyFixedCost?: number;
}) {
  return roundCurrency(
    payload.dailyFixedCost ??
      (payload.insuranceMonthly +
        payload.phoneMonthly +
        payload.accountantMonthly +
        payload.roadTaxMonthly +
        payload.kteoMonthly +
        payload.otherMonthly) /
        30
  );
}

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let canonicalProfile = null;

  try {
    canonicalProfile = await prisma.costProfile.findFirst({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const fixedCosts =
    canonicalProfile ??
    (await prisma.fixedCost.findFirst({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
    }));

  if (!fixedCosts) {
    return NextResponse.json({ ok: true, data: null });
  }

  return NextResponse.json({
    ok: true,
    data: {
      insuranceMonthly: toSafeNumber(fixedCosts.insuranceMonthly),
      phoneMonthly: toSafeNumber(fixedCosts.phoneMonthly),
      accountantMonthly: toSafeNumber(fixedCosts.accountantMonthly),
      roadTaxMonthly: toSafeNumber(fixedCosts.roadTaxMonthly),
      kteoMonthly: toSafeNumber(fixedCosts.kteoMonthly),
      otherMonthly: toSafeNumber(fixedCosts.otherMonthly),
      dailyFixedCost:
        "dailyFixedCost" in fixedCosts ? toSafeNumber(fixedCosts.dailyFixedCost) : 0,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = costProfileSchema.parse(await req.json());
    const dailyFixedCost = calculateDailyFixedCost(payload);

    const existingLegacy = await prisma.fixedCost.findFirst({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
    });

    let existingCanonical = null;
    let hasCanonicalTable = true;

    try {
      existingCanonical = await prisma.costProfile.findFirst({
        where: { userId: currentUser.userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      if (!isPrismaSchemaMismatchError(error)) {
        throw error;
      }

      hasCanonicalTable = false;
    }

    const operations = [];

    if (hasCanonicalTable && existingCanonical) {
      operations.push(
        prisma.costProfile.update({
          where: { id: existingCanonical.id },
          data: {
            insuranceMonthly: roundCurrency(payload.insuranceMonthly),
            phoneMonthly: roundCurrency(payload.phoneMonthly),
            accountantMonthly: roundCurrency(payload.accountantMonthly),
            roadTaxMonthly: roundCurrency(payload.roadTaxMonthly),
            kteoMonthly: roundCurrency(payload.kteoMonthly),
            otherMonthly: roundCurrency(payload.otherMonthly),
            dailyFixedCost,
          },
        })
      );
    } else if (hasCanonicalTable) {
      operations.push(
        prisma.costProfile.create({
          data: {
            userId: currentUser.userId,
            insuranceMonthly: roundCurrency(payload.insuranceMonthly),
            phoneMonthly: roundCurrency(payload.phoneMonthly),
            accountantMonthly: roundCurrency(payload.accountantMonthly),
            roadTaxMonthly: roundCurrency(payload.roadTaxMonthly),
            kteoMonthly: roundCurrency(payload.kteoMonthly),
            otherMonthly: roundCurrency(payload.otherMonthly),
            dailyFixedCost,
          },
        })
      );
    }

    operations.push(
      existingLegacy
        ? prisma.fixedCost.update({
            where: { id: existingLegacy.id },
            data: {
              insuranceMonthly: payload.insuranceMonthly,
              phoneMonthly: payload.phoneMonthly,
              accountantMonthly: payload.accountantMonthly,
              roadTaxMonthly: payload.roadTaxMonthly,
              kteoMonthly: payload.kteoMonthly,
              otherMonthly: payload.otherMonthly,
            },
          })
        : prisma.fixedCost.create({
            data: {
              userId: currentUser.userId,
              insuranceMonthly: payload.insuranceMonthly,
              phoneMonthly: payload.phoneMonthly,
              accountantMonthly: payload.accountantMonthly,
              roadTaxMonthly: payload.roadTaxMonthly,
              kteoMonthly: payload.kteoMonthly,
              otherMonthly: payload.otherMonthly,
            },
          })
    );

    const results = await prisma.$transaction(operations);
    const costProfile = results[0];

    return NextResponse.json({ ok: true, data: costProfile });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid cost profile payload" },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to save cost profile" },
      { status: 500 }
    );
  }
}
