import { NextResponse } from "next/server";
import { invalidateSession, clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  try {
    await invalidateSession();
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
