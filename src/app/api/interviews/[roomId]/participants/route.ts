import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required to view participants" },
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

    const userIdStr = auth.user.id;
    const isCreator = room.creatorId.toString() === userIdStr;
    const isParticipant = room.participants.some(
      (p) => p.userId.toString() === userIdStr
    );

    if (!isCreator && !isParticipant && room.accessPolicy !== "discoverable") {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to view participants of this room." },
        { status: 403 }
      );
    }

    const safeRoom = room.toSafeObject(userIdStr);
    return NextResponse.json({
      participants: safeRoom.participants,
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

    console.error("GET /api/interviews/[roomId]/participants error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve participants" },
      { status: 500 }
    );
  }
}
