import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/auth/session";
import {
  handleGenerateFeedbackReport,
  handleGetFeedbackReport,
  handleUpdateFeedbackNotes,
} from "@/lib/ai/service";
import { UpdateFeedbackNotesSchema } from "@/lib/ai/types";

interface RouteContext {
  params: Promise<{ roomId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
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

    const feedback = await handleGetFeedbackReport(auth.user.id, roomId);

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve feedback report";
    const status = msg.includes("not an authorized participant") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: msg },
      { status }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
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

    const body = await req.json().catch(() => ({}));
    const feedback = await handleGenerateFeedbackReport(auth.user.id, {
      roomId,
      interviewerNotes: body.interviewerNotes,
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate feedback report";
    const status = msg.includes("Only an interviewer") || msg.includes("not an authorized participant") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: msg },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

    const body = await req.json();
    const parseResult = UpdateFeedbackNotesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const feedback = await handleUpdateFeedbackNotes(
      auth.user.id,
      roomId,
      parseResult.data.interviewerNotes
    );

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update feedback notes";
    const status = msg.includes("Only an interviewer") || msg.includes("not an authorized participant") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: msg },
      { status }
    );
  }
}
