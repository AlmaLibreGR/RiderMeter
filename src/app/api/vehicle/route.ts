import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { roundCurrency, toSafeNumber } from "@/lib/utils";
import { vehicleProfileSchema } from "@/lib/validators/settings";

export async function GET() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let canonicalVehicle = null;

  try {
    canonicalVehicle = await prisma.vehicleProfile.findFirst({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const vehicle =
    canonicalVehicle ??
    (await prisma.vehicle.findFirst({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
    }));

  if (!vehicle) {
    return NextResponse.json({ ok: true, data: null });
  }

  return NextResponse.json({
    ok: true,
    data: {
      vehicleType: vehicle.vehicleType,
      fuelType: vehicle.fuelType,
      fuelConsumptionPer100Km: toSafeNumber(
        "fuelConsumptionPer100Km" in vehicle
          ? vehicle.fuelConsumptionPer100Km
          : vehicle.consumptionPer100Km
      ),
      fuelPricePerLiter: toSafeNumber(
        "fuelPricePerLiter" in vehicle ? vehicle.fuelPricePerLiter : vehicle.fuelPrice
      ),
      maintenanceCostPerKm: toSafeNumber(
        "maintenanceCostPerKm" in vehicle
          ? vehicle.maintenanceCostPerKm
          : vehicle.maintenancePerKm
      ),
      tiresCostPerKm: toSafeNumber(
        "tiresCostPerKm" in vehicle ? vehicle.tiresCostPerKm : vehicle.tiresPerKm
      ),
      depreciationCostPerKm: toSafeNumber(
        "depreciationCostPerKm" in vehicle
          ? vehicle.depreciationCostPerKm
          : vehicle.depreciationPerKm
      ),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = vehicleProfileSchema.parse(await req.json());

    const existingLegacy = await prisma.vehicle.findFirst({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
    });

    let existingCanonical = null;
    let hasCanonicalTable = true;

    try {
      existingCanonical = await prisma.vehicleProfile.findFirst({
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
        prisma.vehicleProfile.update({
          where: { id: existingCanonical.id },
          data: {
            vehicleType: payload.vehicleType,
            fuelType: payload.fuelType,
            fuelConsumptionPer100Km: roundCurrency(payload.fuelConsumptionPer100Km),
            fuelPricePerLiter: roundCurrency(payload.fuelPricePerLiter),
            maintenanceCostPerKm: payload.maintenanceCostPerKm,
            tiresCostPerKm: payload.tiresCostPerKm,
            depreciationCostPerKm: payload.depreciationCostPerKm,
          },
        })
      );
    } else if (hasCanonicalTable) {
      operations.push(
        prisma.vehicleProfile.create({
          data: {
            userId: currentUser.userId,
            vehicleType: payload.vehicleType,
            fuelType: payload.fuelType,
            fuelConsumptionPer100Km: roundCurrency(payload.fuelConsumptionPer100Km),
            fuelPricePerLiter: roundCurrency(payload.fuelPricePerLiter),
            maintenanceCostPerKm: payload.maintenanceCostPerKm,
            tiresCostPerKm: payload.tiresCostPerKm,
            depreciationCostPerKm: payload.depreciationCostPerKm,
          },
        })
      );
    }

    operations.push(
      existingLegacy
        ? prisma.vehicle.update({
            where: { id: existingLegacy.id },
            data: {
              vehicleType: payload.vehicleType,
              fuelType: payload.fuelType,
              consumptionPer100Km: payload.fuelConsumptionPer100Km,
              fuelPrice: payload.fuelPricePerLiter,
              maintenancePerKm: payload.maintenanceCostPerKm,
              tiresPerKm: payload.tiresCostPerKm,
              depreciationPerKm: payload.depreciationCostPerKm,
            },
          })
        : prisma.vehicle.create({
            data: {
              userId: currentUser.userId,
              vehicleType: payload.vehicleType,
              fuelType: payload.fuelType,
              consumptionPer100Km: payload.fuelConsumptionPer100Km,
              fuelPrice: payload.fuelPricePerLiter,
              maintenancePerKm: payload.maintenanceCostPerKm,
              tiresPerKm: payload.tiresCostPerKm,
              depreciationPerKm: payload.depreciationCostPerKm,
            },
          })
    );

    const results = await prisma.$transaction(operations);
    const vehicleProfile = results[0];

    return NextResponse.json({ ok: true, data: vehicleProfile });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid vehicle payload" },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to save vehicle profile" },
      { status: 500 }
    );
  }
}
