import crypto from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { Session, ISession } from "@/lib/db/models/session";
import { User, IUser, SafeUser } from "@/lib/db/models/user";

export const SESSION_COOKIE_NAME = "pz_session";

// 24 hours for default sessions, 30 days for remember-me
const DEFAULT_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const REMEMBER_ME_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Creates a SHA-256 hash of the plaintext session token to store in the database.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a cryptographically random session token and saves a hashed record in MongoDB.
 */
export async function createSession(
  userId: string,
  options: {
    rememberMe?: boolean;
    userAgent?: string;
    ip?: string;
  } = {}
): Promise<{ rawToken: string; expiresAt: Date; session: ISession }> {
  await connectToDatabase();

  // 32 cryptographically secure random bytes = 64 hex characters
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);

  const duration = options.rememberMe
    ? REMEMBER_ME_SESSION_DURATION_MS
    : DEFAULT_SESSION_DURATION_MS;

  const expiresAt = new Date(Date.now() + duration);

  const session = await Session.create({
    tokenHash,
    userId,
    userAgent: options.userAgent || "unknown",
    ip: options.ip || "unknown",
    expiresAt,
  });

  return { rawToken, expiresAt, session };
}

/**
 * Validates a session token from an HTTP-only cookie or raw string.
 * Returns the populated user and session if valid, or null.
 */
export async function validateSession(
  token?: string
): Promise<{ user: SafeUser; rawUser: IUser; session: ISession } | null> {
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!token || typeof token !== "string") {
    return null;
  }

  await connectToDatabase();

  const tokenHash = hashSessionToken(token);
  const session = await Session.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  const user = await User.findById(session.userId);
  if (!user || user.status !== "active") {
    // If user deleted or suspended, revoke session
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  return {
    user: user.toSafeObject(),
    rawUser: user,
    session,
  };
}

/**
 * Revokes a session given its raw token or cookie.
 */
export async function invalidateSession(token?: string): Promise<boolean> {
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!token) {
    return false;
  }

  await connectToDatabase();
  const tokenHash = hashSessionToken(token);
  const result = await Session.deleteOne({ tokenHash });
  return result.deletedCount > 0;
}

/**
 * Sets the secure HTTP-only session cookie in Next.js Server Components / Route Handlers.
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
