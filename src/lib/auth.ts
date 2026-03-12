import bcrypt from "bcryptjs";
// Authentication utility functions for RiderMeter
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set and strong.");
}

export async function hashPassword(password: string) {
  // Hashes a password using bcrypt with 10 salt rounds
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  // Compares a plain password with a hashed password
  return bcrypt.compare(password, hash);
}

export function createToken(payload: { userId: number; email: string }) {
  // Creates a JWT token for authentication
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  // Verifies a JWT token and returns the payload
  return jwt.verify(token, JWT_SECRET) as {
    userId: number;
    email: string;
  };
}

export async function getCurrentUserFromCookie() {
  // Retrieves the current user from the authentication cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = verifyToken(token);

    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}