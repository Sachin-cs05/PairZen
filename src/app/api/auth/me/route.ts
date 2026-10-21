import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await validateSession();

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthenticated", user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: auth.user,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user session" },
      { status: 500 }
    );
  }
}
