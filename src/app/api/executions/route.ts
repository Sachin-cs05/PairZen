import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";
import { isSupportedLanguage } from "@/lib/execution/languages";
import { getExecutionAdapter } from "@/lib/execution/adapter";

const ExecutionSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  sourceCode: z.string().max(65536, "Source code cannot exceed 64KB"),
  language: z.string().refine(isSupportedLanguage, {
    message: "Unsupported programming language",
  }),
  stdin: z.string().max(16384, "Standard input cannot exceed 16KB").optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await validateSession();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parseResult = ExecutionSchema.safeParse(body);
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

    const { roomId, sourceCode, language, stdin } = parseResult.data;

    await connectToDatabase();

    // Verify room access and user membership
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
        { success: false, error: "You are not authorized to execute code in this room" },
        { status: 403 }
      );
    }

    // Execute code via sandboxed adapter
    const adapter = getExecutionAdapter();
    const result = await adapter.execute({
      sourceCode,
      language,
      stdin,
      timeoutMs: 5000,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[ExecutionAPI] Execution failed:", msg);
    return NextResponse.json(
      { success: false, error: "Failed to process code execution" },
      { status: 500 }
    );
  }
}
