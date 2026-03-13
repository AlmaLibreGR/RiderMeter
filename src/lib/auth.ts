import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { RoleType } from "@/types/domain";

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable must be set and strong.");
  }

  return jwtSecret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: { userId: number; email: string }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as {
    userId: number;
    email: string;
  };
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveRoleTypeForEmail(email: string): RoleType {
  return getAdminEmails().includes(email.trim().toLowerCase()) ? "admin" : "simple";
}

export async function getCurrentUserFromCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        appSettings: true,
        billingProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      roleType: user.roleType as RoleType,
      locale: (user.appSettings?.locale ?? user.locale ?? "el") as "en" | "el",
    };
  } catch {
    return null;
  }
}

export async function requireAdminFromCookie() {
  const currentUser = await getCurrentUserFromCookie();
  if (!currentUser || currentUser.roleType !== "admin") {
    return null;
  }

  return currentUser;
}
