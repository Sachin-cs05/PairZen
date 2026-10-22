import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";
import { Problem } from "@/lib/db/models/problem";
import { isSupportedLanguage } from "@/lib/execution/languages";
import { getExecutionAdapter } from "@/lib/execution/adapter";
import { evaluateSolution } from "@/lib/execution/evaluator";
import { ensureSeedProblems } from "@/lib/execution/seed-problems";

const RunTestsSchema = z.object({
  sourceCode: z.string().max(65536, "Source code cannot exceed 64KB"),
  language: z.string().refine(isSupportedLanguage, {
    message: "Unsupported programming language",
  }),
  problemId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await validateSession();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { roomId } = await context.params;
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parseResult = RunTestsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { sourceCode, language, problemId } = parseResult.data;

    await connectToDatabase();
    await ensureSeedProblems();

    // Verify interview room access
    const room = await InterviewRoom.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Interview room not found" },
        { status: 404 }
      );
    }

    const isCreator = room.creatorId.toString() === auth.user.id;
    const isParticipant = room.participants.some(
      (p) => p.userId.toString() === auth.user.id
    );

    if (!isCreator && !isParticipant) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to run tests in this room" },
        { status: 403 }
      );
    }

    // Resolve problem to test against
    let problem;
    if (problemId) {
      if (mongoose.Types.ObjectId.isValid(problemId)) {
        problem = await Problem.findById(problemId);
      } else {
        problem = await Problem.findOne({ slug: problemId.toLowerCase() });
      }
    } else if (room.problemId) {
      problem = await Problem.findById(room.problemId);
    } else {
      problem = await Problem.findOne({ slug: "two-sum" });
    }

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Evaluation problem not found" },
        { status: 404 }
      );
    }

    // Run evaluation against all test cases (both sample and hidden)
    const adapter = getExecutionAdapter();
    const evaluation = await evaluateSolution({
      sourceCode,
      language,
      testCases: problem.testCases,
      adapter,
      timeoutMs: 5000,
    });

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[RunTestsAPI] Error:", msg);
    return NextResponse.json(
      { success: false, error: "Failed to evaluate test cases" },
      { status: 500 }
    );
  }
}
