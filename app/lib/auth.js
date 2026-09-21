import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "moonstar_session";

const secret = () => {
  const value = process.env.JWT_SECRET;
  
  if (!value) {
    throw new Error(
      "JWT_SECRET environment variable is not defined. Set it in Vercel Environment Variables."
    );
  }
  
  if (value.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  
  return new TextEncoder().encode(value);
};

export async function createSession(user) {
  const token = await new SignJWT({
    sub: String(user._id),
    role: user.role,
    email: user.email
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SAME_SITE || "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}
