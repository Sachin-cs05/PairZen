import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession } from "@/lib/auth/session";
import { Problem } from "@/lib/db/models/problem";
import { ensureSeedProblems } from "@/lib/execution/seed-problems";

export async function GET() {
  try {
    const auth = await validateSession();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    await ensureSeedProblems();

    const problems = await Problem.find({}).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      problems: problems.map((p) => p.toSafeObject()),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[ProblemsAPI] Error listing problems:", msg);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve coding problems" },
      { status: 500 }
    );
  }
}
