import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession } from "@/lib/auth/session";
import { Problem } from "@/lib/db/models/problem";
import { ensureSeedProblems } from "@/lib/execution/seed-problems";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ problemId: string }> }
) {
  try {
    const auth = await validateSession();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { problemId } = await context.params;
    if (!problemId) {
      return NextResponse.json(
        { success: false, error: "Problem ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await ensureSeedProblems();

    let problem;
    if (mongoose.Types.ObjectId.isValid(problemId)) {
      problem = await Problem.findById(problemId);
    } else {
      problem = await Problem.findOne({ slug: problemId.toLowerCase() });
    }

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      problem: problem.toSafeObject(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[ProblemDetailsAPI] Error:", msg);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve problem details" },
      { status: 500 }
    );
  }
}
