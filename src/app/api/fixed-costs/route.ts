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

  const fixedCosts = await prisma.fixedCost.findFirst({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(fixedCosts);
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

    const existingFixedCosts = await prisma.fixedCost.findFirst({
      where: {
        userId: currentUser.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let fixedCosts;

    if (existingFixedCosts) {
      fixedCosts = await prisma.fixedCost.update({
        where: {
          id: existingFixedCosts.id,
        },
        data: {
          insuranceMonthly: Number(body.insuranceMonthly ?? 0),
          phoneMonthly: Number(body.phoneMonthly ?? 0),
          accountantMonthly: Number(body.accountantMonthly ?? 0),
          roadTaxMonthly: Number(body.roadTaxMonthly ?? 0),
          kteoMonthly: Number(body.kteoMonthly ?? 0),
          otherMonthly: Number(body.otherMonthly ?? 0),
        },
      });
    } else {
      fixedCosts = await prisma.fixedCost.create({
        data: {
          userId: currentUser.userId,
          insuranceMonthly: Number(body.insuranceMonthly ?? 0),
          phoneMonthly: Number(body.phoneMonthly ?? 0),
          accountantMonthly: Number(body.accountantMonthly ?? 0),
          roadTaxMonthly: Number(body.roadTaxMonthly ?? 0),
          kteoMonthly: Number(body.kteoMonthly ?? 0),
          otherMonthly: Number(body.otherMonthly ?? 0),
        },
      });
    }

    return NextResponse.json({ ok: true, fixedCosts });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to save fixed costs" },
      { status: 500 }
    );
  }
}