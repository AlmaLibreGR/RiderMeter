import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { calculateShiftMetrics } from "@/lib/calculations";

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

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const todayShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.date).toISOString().slice(0, 10);
    return shiftDate === todayStr;
  });

  const totals = shifts.reduce(
    (acc, shift) => {
      const metrics = calculateShiftMetrics({
        platformEarnings: shift.platformEarnings,
        tipsCard: shift.tipsCard,
        tipsCash: shift.tipsCash,
        bonus: shift.bonus,
        hours: shift.hours,
        ordersCount: shift.ordersCount,
        kilometers: shift.kilometers,
      });

      acc.totalRevenue += metrics.totalRevenue;
      acc.totalTips += metrics.tipsTotal;
      acc.totalHours += Number(shift.hours);
      acc.totalOrders += Number(shift.ordersCount);
      acc.totalKilometers += Number(shift.kilometers);

      return acc;
    },
    {
      totalRevenue: 0,
      totalTips: 0,
      totalHours: 0,
      totalOrders: 0,
      totalKilometers: 0,
    }
  );

  const todayTotals = todayShifts.reduce(
    (acc, shift) => {
      const metrics = calculateShiftMetrics({
        platformEarnings: shift.platformEarnings,
        tipsCard: shift.tipsCard,
        tipsCash: shift.tipsCash,
        bonus: shift.bonus,
        hours: shift.hours,
        ordersCount: shift.ordersCount,
        kilometers: shift.kilometers,
      });

      acc.revenue += metrics.totalRevenue;
      acc.hours += Number(shift.hours);
      acc.orders += Number(shift.ordersCount);
      acc.kilometers += Number(shift.kilometers);
      acc.tips += metrics.tipsTotal;

      return acc;
    },
    {
      revenue: 0,
      hours: 0,
      orders: 0,
      kilometers: 0,
      tips: 0,
    }
  );

  const grossPerHour =
    todayTotals.hours > 0 ? todayTotals.revenue / todayTotals.hours : 0;

  const revenuePerOrder =
    todayTotals.orders > 0 ? todayTotals.revenue / todayTotals.orders : 0;

  return NextResponse.json({
    ok: true,
    today: {
      revenue: todayTotals.revenue,
      hours: todayTotals.hours,
      orders: todayTotals.orders,
      kilometers: todayTotals.kilometers,
      tips: todayTotals.tips,
      grossPerHour,
      revenuePerOrder,
    },
    overall: totals,
    shiftsCount: shifts.length,
  });
}
