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

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(vehicle);
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

    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        userId: currentUser.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let vehicle;

    if (existingVehicle) {
      vehicle = await prisma.vehicle.update({
        where: {
          id: existingVehicle.id,
        },
        data: {
          vehicleType: body.vehicleType,
          fuelType: body.fuelType,
          consumptionPer100Km: Number(body.consumptionPer100Km),
          fuelPrice: Number(body.fuelPrice),
          maintenancePerKm: Number(body.maintenancePerKm),
          tiresPerKm: Number(body.tiresPerKm),
          depreciationPerKm: Number(body.depreciationPerKm),
        },
      });
    } else {
      vehicle = await prisma.vehicle.create({
        data: {
          userId: currentUser.userId,
          vehicleType: body.vehicleType,
          fuelType: body.fuelType,
          consumptionPer100Km: Number(body.consumptionPer100Km),
          fuelPrice: Number(body.fuelPrice),
          maintenancePerKm: Number(body.maintenancePerKm),
          tiresPerKm: Number(body.tiresPerKm),
          depreciationPerKm: Number(body.depreciationPerKm),
        },
      });
    }

    return NextResponse.json({ ok: true, vehicle });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to save vehicle" },
      { status: 500 }
    );
  }
}