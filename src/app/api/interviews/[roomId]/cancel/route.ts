import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required to cancel interview" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(roomId);
    const room = isObjectId
      ? await InterviewRoom.findOne({
          $or: [{ _id: roomId }, { roomCode: roomId.toLowerCase() }],
        })
      : await InterviewRoom.findOne({ roomCode: roomId.toLowerCase() });

    if (!room) {
      return NextResponse.json(
        { error: "Interview room not found" },
        { status: 404 }
      );
    }

    // Role check: Only creator / interviewer can cancel
    const userIdStr = auth.user.id;
    const isCreator = room.creatorId.toString() === userIdStr;
    const participant = room.participants.find(
      (p) => p.userId.toString() === userIdStr
    );
    const isInterviewer = isCreator || participant?.role === "interviewer";

    if (!isInterviewer) {
      return NextResponse.json(
        { error: "Forbidden: Only an interviewer can cancel the session." },
        { status: 403 }
      );
    }

    // Lifecycle check: Only waiting rooms can be cancelled
    if (room.status === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "Interview is already cancelled",
        room: room.toSafeObject(userIdStr),
      });
    }

    if (room.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel an interview that has already been completed." },
        { status: 400 }
      );
    }

    room.status = "cancelled";
    await room.save();

    return NextResponse.json({
      success: true,
      room: room.toSafeObject(userIdStr),
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }

    console.error("POST /api/interviews/[roomId]/cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel interview" },
      { status: 500 }
    );
  }
}
