import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createToken, hashPassword, resolveRoleTypeForEmail } from "@/lib/auth";
import { localeCookieName } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = registerSchema.parse(await req.json());
    const email = payload.email.trim().toLowerCase();
    const locale = payload.locale === "en" ? "en" : "el";

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(payload.password);
    const roleType = resolveRoleTypeForEmail(email);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        roleType,
        locale,
        appSettings: {
          create: {
            locale,
          },
        },
        billingProfile: {
          create: {
            planType: "free",
            status: "inactive",
            currency: "EUR",
          },
        },
      },
      include: {
        appSettings: true,
      },
    });

    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        roleType,
        locale,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set(localeCookieName, locale, {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: error.issues[0]?.message ?? "Invalid registration payload." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to register user" },
      { status: 500 }
    );
  }
}
