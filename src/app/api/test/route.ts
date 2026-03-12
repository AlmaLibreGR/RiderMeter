import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const usersCount = await prisma.user.count();

  return NextResponse.json({
    ok: true,
    message: "API works",
    usersCount,
  });
}