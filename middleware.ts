import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = [
  "/",
  "/new-shift",
  "/history",
  "/vehicle",
  "/fixed-costs",
];

const guestOnlyPrefixes = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".");

  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  const isProtectedPath = protectedPrefixes.some((prefix) =>
    prefix === "/"
      ? pathname === "/"
      : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isGuestOnlyPath = guestOnlyPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isGuestOnlyPath && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};