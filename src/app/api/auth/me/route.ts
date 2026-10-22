import { NextRequest, NextResponse } from "next/server";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthenticated", user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: auth.user,
    });
  } catch (error: unknown) {
    // Rethrow Next.js internal control-flow exceptions (such as prerender bailouts)
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }

    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user session" },
      { status: 500 }
    );
  }
}
