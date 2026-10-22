import { NextRequest, NextResponse } from "next/server";
import { invalidateSession, clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    await invalidateSession(token);
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear the cookie even if database deletion experienced an issue
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      message: "Session cleared",
    });
  }
}
