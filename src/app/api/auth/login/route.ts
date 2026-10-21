import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Content-type check
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // 2. Rate limiting by IP (max 5 login attempts per 10 mins)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rate = checkRateLimit(`login:${ip}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });

    if (!rate.success) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter: rate.resetInSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": rate.resetInSeconds.toString() },
        }
      );
    }

    // 3. Parse and validate payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password, rememberMe } = parseResult.data;

    // 4. Connect to database
    await connectToDatabase();

    // 5. Query user with passwordHash
    const user = await User.findOne({ email }).select("+passwordHash");

    // Generic failure error prevents account enumeration
    const genericAuthError = "Invalid email or password";

    if (!user) {
      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // 6. Constant-time password verification
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // 7. Create new session (session fixation prevention: brand new token on login)
    const userAgent = request.headers.get("user-agent") || "unknown";
    const { rawToken, expiresAt } = await createSession(user._id.toString(), {
      rememberMe,
      userAgent,
      ip,
    });

    await setSessionCookie(rawToken, expiresAt);

    return NextResponse.json(
      {
        success: true,
        message: "Signed in successfully",
        user: user.toSafeObject(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in. Please try again." },
      { status: 500 }
    );
  }
}
