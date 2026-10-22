import crypto from "crypto";

/**
 * Creates a cryptographically secure random invitation token (64 hex characters).
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Produces a SHA-256 hash of the invitation token to safely store in the database.
 */
export function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a clean, human-readable room code like 'pz-8492-xk9w'.
 */
export function generateRoomCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  const randomChars = crypto.randomBytes(3).toString("hex").slice(0, 4).toLowerCase();
  return `pz-${digits}-${randomChars}`;
}

/**
 * Resolves the application origin safely without risk of open redirects.
 */
export function getAppOrigin(reqOrigin?: string | null): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (reqOrigin && (reqOrigin.startsWith("http://localhost") || reqOrigin.startsWith("http://127.0.0.1") || reqOrigin.startsWith("https://"))) {
    return reqOrigin.replace(/\/+$/, "");
  }
  return "";
}

/**
 * Generates an invitation link for a room.
 */
export function buildInvitationUrl(origin: string, token: string, roomCode: string): string {
  const base = origin ? `${origin}/join` : "/join";
  return `${base}?token=${encodeURIComponent(token)}&code=${encodeURIComponent(roomCode)}`;
}
