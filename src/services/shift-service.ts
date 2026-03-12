import type { Shift } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canonicalShiftSchema, historyQuerySchema, shiftPayloadSchema } from "@/lib/validators/shift";
import { asNullableString, roundCurrency, toSafeNumber } from "@/lib/utils";
import type { CanonicalShift, PlatformKey } from "@/types/domain";
import { nowIsoDate } from "@/lib/dates";

function normalizePlatform(value: string | null | undefined): PlatformKey {
  if (value === "efood" || value === "wolt" || value === "freelance") {
    return value;
  }

  return "other";
}

export function mapShiftRecordToCanonical(shift: Shift): CanonicalShift {
  return {
    id: shift.id,
    userId: shift.userId,
    date:
      shift.shiftDate?.toISOString().slice(0, 10) ??
      shift.date.toISOString().slice(0, 10),
    startTime: shift.startTime ?? null,
    endTime: shift.endTime ?? null,
    hoursWorked: toSafeNumber(shift.hoursWorked ?? shift.hours),
    ordersCompleted: toSafeNumber(shift.ordersCompleted ?? shift.ordersCount),
    kilometersDriven: toSafeNumber(shift.kilometersDriven ?? shift.kilometers),
    baseEarnings: roundCurrency(
      toSafeNumber(shift.baseEarnings ?? shift.platformEarnings)
    ),
    tipsAmount: roundCurrency(
      toSafeNumber(shift.tipsAmount) ||
        roundCurrency(toSafeNumber(shift.tipsCard) + toSafeNumber(shift.tipsCash))
    ),
    bonusAmount: roundCurrency(toSafeNumber(shift.bonusAmount ?? shift.bonus)),
    fuelExpenseDirect:
      shift.fuelExpenseDirect == null ? null : roundCurrency(toSafeNumber(shift.fuelExpenseDirect)),
    tollsOrParking: roundCurrency(toSafeNumber(shift.tollsOrParking)),
    platform: normalizePlatform(shift.platform),
    area: shift.area,
    notes: shift.notes ?? null,
    createdAt: shift.createdAt.toISOString(),
    updatedAt: shift.updatedAt?.toISOString() ?? null,
  };
}

export async function listUserShifts(userId: number, query?: unknown) {
  const parsedQuery = historyQuerySchema.safeParse(query ?? {});
  const filters = parsedQuery.success ? parsedQuery.data : {};

  const shifts = await prisma.shift.findMany({
    where: {
      userId,
      platform: filters.platform ? filters.platform : undefined,
      date: filters.from || filters.to
        ? {
            gte: filters.from ? new Date(`${filters.from}T00:00:00.000Z`) : undefined,
            lte: filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : undefined,
          }
        : undefined,
    },
    orderBy: {
      date: "desc",
    },
  });

  return shifts.map(mapShiftRecordToCanonical);
}

export function normalizeShiftPayload(input: unknown) {
  const parsed = shiftPayloadSchema.parse(input);

  if ("hoursWorked" in parsed) {
    return canonicalShiftSchema.parse(parsed);
  }

  return canonicalShiftSchema.parse({
    date: parsed.date,
    platform:
      parsed.platform === "efood" || parsed.platform === "wolt"
        ? parsed.platform
        : "other",
    area: parsed.area,
    hoursWorked: "hours" in parsed ? parsed.hours : 0,
    ordersCompleted: "ordersCount" in parsed ? parsed.ordersCount : 0,
    kilometersDriven: "kilometers" in parsed ? parsed.kilometers : 0,
    baseEarnings: "platformEarnings" in parsed ? parsed.platformEarnings : 0,
    tipsAmount:
      ("tipsCard" in parsed ? toSafeNumber(parsed.tipsCard) : 0) +
      ("tipsCash" in parsed ? toSafeNumber(parsed.tipsCash) : 0),
    bonusAmount: "bonus" in parsed ? parsed.bonus : 0,
    notes: "notes" in parsed ? parsed.notes : null,
    startTime: null,
    endTime: null,
    fuelExpenseDirect: null,
    tollsOrParking: 0,
  });
}

export async function createShift(userId: number, input: unknown) {
  const payload = normalizeShiftPayload(input);
  const shiftDate = payload.date || nowIsoDate();

  const created = await prisma.shift.create({
    data: {
      userId,
      date: new Date(`${shiftDate}T00:00:00.000Z`),
      shiftDate: new Date(`${shiftDate}T00:00:00.000Z`),
      startTime: asNullableString(payload.startTime),
      endTime: asNullableString(payload.endTime),
      platform: payload.platform ?? "other",
      area: payload.area,
      hours: toSafeNumber(payload.hoursWorked),
      hoursWorked: toSafeNumber(payload.hoursWorked),
      ordersCount: Math.round(toSafeNumber(payload.ordersCompleted)),
      ordersCompleted: Math.round(toSafeNumber(payload.ordersCompleted)),
      kilometers: toSafeNumber(payload.kilometersDriven),
      kilometersDriven: toSafeNumber(payload.kilometersDriven),
      platformEarnings: roundCurrency(toSafeNumber(payload.baseEarnings)),
      baseEarnings: roundCurrency(toSafeNumber(payload.baseEarnings)),
      tipsCard: roundCurrency(toSafeNumber(payload.tipsAmount)),
      tipsCash: 0,
      tipsAmount: roundCurrency(toSafeNumber(payload.tipsAmount)),
      bonus: roundCurrency(toSafeNumber(payload.bonusAmount)),
      bonusAmount: roundCurrency(toSafeNumber(payload.bonusAmount)),
      fuelExpenseDirect:
        payload.fuelExpenseDirect == null
          ? null
          : roundCurrency(toSafeNumber(payload.fuelExpenseDirect)),
      tollsOrParking: roundCurrency(toSafeNumber(payload.tollsOrParking)),
      notes: asNullableString(payload.notes),
    },
  });

  return mapShiftRecordToCanonical(created);
}
