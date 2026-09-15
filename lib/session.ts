import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { SessionUser } from "./types";

const COOKIE = "ps_session";
const SECRET = process.env.SESSION_SECRET || "veridex-product-studio-dev-secret-change-me";

export const GUEST_USER: SessionUser = {
  userId: "USR-LOCAL",
  email: "studio@veridex.local",
  name: "Anika Sharma",
  role: "Product Manager",
  roleKind: "risk-carrier",
  org: "Veridex Insurance",
  orgId: "RC-VERIDEX",
  productId: "PRD-015",
  version: "2026.08",
};

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function encode(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(next, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getSession(): Promise<SessionUser> {
  const jar = await cookies();
  return decode(jar.get(COOKIE)?.value) || { ...GUEST_USER };
}

export async function setSession(user: SessionUser) {
  const jar = await cookies();
  jar.set(COOKIE, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function patchSession(patch: Partial<SessionUser>) {
  const current = await getSession();
  const next = { ...current, ...patch };
  await setSession(next);
  return next;
}

export function hasSessionCookie(value?: string) {
  return Boolean(decode(value));
}
