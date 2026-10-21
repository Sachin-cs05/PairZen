import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // 2. Rate limiting by IP (max 5 registration attempts per 15 mins)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rate = checkRateLimit(`register:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rate.success) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
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

    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Validation failed";
      return NextResponse.json(
        {
          error: firstError,
          details: parseResult.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parseResult.data;

    // 4. Connect to database
    await connectToDatabase();

    // 5. Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      // Safe, generic message to prevent leaking existing account details or enumeration
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // 6. Securely hash password with bcrypt (cost 12)
    const passwordHash = await hashPassword(password);

    // 7. Enforce non-privileged role: only 'user' or 'interviewer', never 'admin'
    const assignedRole = role === "interviewer" ? "interviewer" : "user";

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole,
      status: "active",
    });

    // 8. Create session and set HTTP-only cookie
    const userAgent = request.headers.get("user-agent") || "unknown";
    const { rawToken, expiresAt } = await createSession(user._id.toString(), {
      rememberMe: false,
      userAgent,
      ip,
    });

    await setSessionCookie(rawToken, expiresAt);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: user.toSafeObject(),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    // Handle concurrent duplicate key race condition
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
