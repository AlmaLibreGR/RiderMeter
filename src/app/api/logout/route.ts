import { NextResponse } from "next/server";

export async function POST() {
  // Handles user logout by clearing the authentication cookie
  const response = NextResponse.json({ ok: true });

  response.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}