import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";
import {
  generateInvitationToken,
  hashInvitationToken,
  getAppOrigin,
  buildInvitationUrl,
} from "@/lib/interviews/token";

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
        { error: "Authentication required to rotate invitation" },
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

    // Role check: Only creator / interviewer can rotate the invitation token
    const userIdStr = auth.user.id;
    const isCreator = room.creatorId.toString() === userIdStr;
    const participant = room.participants.find(
      (p) => p.userId.toString() === userIdStr
    );
    const isInterviewer = isCreator || participant?.role === "interviewer";

    if (!isInterviewer) {
      return NextResponse.json(
        { error: "Forbidden: Only an interviewer can manage invitation links." },
        { status: 403 }
      );
    }

    if (room.status === "cancelled" || room.status === "completed") {
      return NextResponse.json(
        { error: `Cannot rotate invitation for an interview that is ${room.status}.` },
        { status: 400 }
      );
    }

    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    room.invitationTokenHash = tokenHash;
    room.invitationRevoked = false;
    await room.save();

    const origin = getAppOrigin(request.nextUrl.origin);
    const invitationUrl = buildInvitationUrl(origin, rawToken, room.roomCode);

    return NextResponse.json({
      success: true,
      invitationToken: rawToken,
      invitationUrl,
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

    console.error("POST /api/interviews/[roomId]/invitation error:", error);
    return NextResponse.json(
      { error: "Failed to rotate invitation link" },
      { status: 500 }
    );
  }
}
