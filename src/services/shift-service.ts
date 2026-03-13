import type { Shift } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDurationHoursFromTimes } from "@/lib/dates";
import { canonicalShiftSchema, historyQuerySchema, shiftPayloadSchema } from "@/lib/validators/shift";
import { asNullableString, roundCurrency, toSafeNumber } from "@/lib/utils";
import type {
  CanonicalShift,
  PlatformKey,
  ShiftDraft,
  ShiftDraftMode,
  WeatherCondition,
} from "@/types/domain";
import { nowIsoDate } from "@/lib/dates";

function normalizePlatform(value: string | null | undefined): PlatformKey {
  if (value === "efood" || value === "wolt" || value === "freelance") {
    return value;
  }

  return "other";
}

function normalizeWeatherCondition(value: string | null | undefined): WeatherCondition {
  if (
    value === "sunny" ||
    value === "cloudy" ||
    value === "rain" ||
    value === "heatwave" ||
    value === "cold" ||
    value === "windy"
  ) {
    return value;
  }

  return "unknown";
}

export function mapShiftRecordToCanonical(shift: Shift): CanonicalShift {
  const derivedHoursWorked = getDurationHoursFromTimes(shift.startTime, shift.endTime);

  return {
    id: shift.id,
    userId: shift.userId,
    date:
      shift.shiftDate?.toISOString().slice(0, 10) ??
      shift.date.toISOString().slice(0, 10),
    startTime: shift.startTime ?? null,
    endTime: shift.endTime ?? null,
    hoursWorked: toSafeNumber(derivedHoursWorked ?? shift.hoursWorked ?? shift.hours),
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
    weatherCondition: normalizeWeatherCondition(shift.weatherCondition),
    area: shift.area ?? null,
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

  if (
    "hoursWorked" in parsed ||
    "startTime" in parsed ||
    "endTime" in parsed ||
    "ordersCompleted" in parsed
  ) {
    const derivedHoursWorked =
      parsed.startTime && parsed.endTime
        ? getDurationHoursFromTimes(parsed.startTime, parsed.endTime)
        : null;

    return canonicalShiftSchema.parse({
      ...parsed,
      fuelExpenseDirect: parsed.fuelExpenseDirect ?? parsed.fuelExpenseOverride ?? null,
      hoursWorked: derivedHoursWorked ?? parsed.hoursWorked,
      area: parsed.area ?? null,
      weatherCondition: parsed.weatherCondition ?? "unknown",
    });
  }

  return canonicalShiftSchema.parse({
    date: parsed.date,
    platform:
      parsed.platform === "efood" || parsed.platform === "wolt"
        ? parsed.platform
        : "other",
    hoursWorked: "hours" in parsed ? parsed.hours : 0,
    ordersCompleted: "ordersCount" in parsed ? parsed.ordersCount : 0,
    kilometersDriven: "kilometers" in parsed ? parsed.kilometers : 0,
    baseEarnings: "platformEarnings" in parsed ? parsed.platformEarnings : 0,
    tipsAmount:
      ("tipsCard" in parsed ? toSafeNumber(parsed.tipsCard) : 0) +
      ("tipsCash" in parsed ? toSafeNumber(parsed.tipsCash) : 0),
    bonusAmount: "bonus" in parsed ? parsed.bonus : 0,
    weatherCondition:
      "weatherCondition" in parsed ? parsed.weatherCondition ?? "unknown" : "unknown",
    notes: "notes" in parsed ? parsed.notes : null,
    startTime: null,
    endTime: null,
    fuelExpenseDirect: null,
    tollsOrParking: 0,
    area: "area" in parsed ? parsed.area ?? null : null,
  });
}

export async function getLatestShiftDraft(userId: number): Promise<ShiftDraft | null> {
  const latestShift = await prisma.shift.findFirst({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  if (!latestShift) {
    return null;
  }

  const shift = mapShiftRecordToCanonical(latestShift);
  const mode: ShiftDraftMode = shift.startTime && shift.endTime ? "timer" : "quick";

  return {
    mode,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    hoursWorked: shift.hoursWorked || null,
    ordersCompleted: shift.ordersCompleted,
    kilometersDriven: shift.kilometersDriven,
    baseEarnings: shift.baseEarnings,
    tipsAmount: shift.tipsAmount,
    bonusAmount: shift.bonusAmount,
    fuelExpenseDirect: shift.fuelExpenseDirect,
    tollsOrParking: shift.tollsOrParking,
    platform: shift.platform,
    weatherCondition: shift.weatherCondition,
    notes: shift.notes,
  };
}

export async function createShift(userId: number, input: unknown) {
  const payload = normalizeShiftPayload(input);
  const shiftDate = payload.date || nowIsoDate();
  const derivedHoursWorked = getDurationHoursFromTimes(payload.startTime, payload.endTime);
  const hoursWorked = toSafeNumber(derivedHoursWorked ?? payload.hoursWorked);

  const created = await prisma.shift.create({
    data: {
      userId,
      date: new Date(`${shiftDate}T00:00:00.000Z`),
      shiftDate: new Date(`${shiftDate}T00:00:00.000Z`),
      startTime: asNullableString(payload.startTime),
      endTime: asNullableString(payload.endTime),
      platform: payload.platform ?? "other",
      weatherCondition: payload.weatherCondition ?? "unknown",
      area: asNullableString(payload.area),
      hours: hoursWorked,
      hoursWorked,
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

export async function updateShift(userId: number, shiftId: number, input: unknown) {
  const payload = normalizeShiftPayload(input);
  const existingShift = await prisma.shift.findFirst({
    where: {
      id: shiftId,
      userId,
    },
  });

  if (!existingShift) {
    throw new Error("SHIFT_NOT_FOUND");
  }

  const shiftDate = payload.date || nowIsoDate();
  const derivedHoursWorked = getDurationHoursFromTimes(payload.startTime, payload.endTime);
  const hoursWorked = toSafeNumber(derivedHoursWorked ?? payload.hoursWorked);
  const updated = await prisma.shift.update({
    where: {
      id: shiftId,
    },
    data: {
      date: new Date(`${shiftDate}T00:00:00.000Z`),
      shiftDate: new Date(`${shiftDate}T00:00:00.000Z`),
      startTime: asNullableString(payload.startTime),
      endTime: asNullableString(payload.endTime),
      platform: payload.platform ?? "other",
      weatherCondition: payload.weatherCondition ?? "unknown",
      area: asNullableString(payload.area),
      hours: hoursWorked,
      hoursWorked,
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

  return mapShiftRecordToCanonical(updated);
}

export async function deleteShift(userId: number, shiftId: number) {
  const existingShift = await prisma.shift.findFirst({
    where: {
      id: shiftId,
      userId,
    },
  });

  if (!existingShift) {
    throw new Error("SHIFT_NOT_FOUND");
  }

  await prisma.shift.delete({
    where: {
      id: shiftId,
    },
  });
}
