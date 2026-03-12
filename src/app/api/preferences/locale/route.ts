import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { localeCookieName } from "@/lib/i18n";
import { upsertUserLocale } from "@/services/settings-service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const locale = body?.locale === "en" ? "en" : "el";
  const currentUser = await getCurrentUserFromCookie();

  if (currentUser) {
    await upsertUserLocale(currentUser.userId, locale);
  }

  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(localeCookieName, locale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
