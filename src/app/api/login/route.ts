import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { comparePassword, createToken, resolveRoleTypeForEmail } from "@/lib/auth";
import { localeCookieName } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = loginSchema.parse(await req.json());
    const email = payload.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { appSettings: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const isValid = await comparePassword(payload.password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const resolvedRoleType = resolveRoleTypeForEmail(user.email);
    if (resolvedRoleType !== user.roleType) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleType: resolvedRoleType },
      });
    }

    if (!user.appSettings) {
      await prisma.appSettings.create({
        data: {
          userId: user.id,
          locale: user.locale === "en" ? "en" : "el",
          onboardingCompleted: false,
        },
      });
    }

    await prisma.billingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planType: "free",
        status: "inactive",
        currency: "EUR",
      },
      update: {},
    });

    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    const locale = (user.appSettings?.locale ?? user.locale ?? "el") as "en" | "el";
    const response = NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        roleType: resolvedRoleType,
        locale,
        onboardingRequired: !(user.appSettings?.onboardingCompleted ?? false),
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
        { ok: false, error: error.issues[0]?.message ?? "Invalid login payload." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json({ ok: false, error: "Failed to login" }, { status: 500 });
  }
}
