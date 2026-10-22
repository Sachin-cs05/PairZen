import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";
import { joinRoomSchema } from "@/lib/interviews/schemas";
import { hashInvitationToken } from "@/lib/interviews/token";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Rate limit: 20 join attempts per minute per IP to prevent room-code enumeration
    const rateLimit = checkRateLimit(`join_${clientIp}`, {
      limit: 20,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many join attempts. Please try again in ${rateLimit.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required to join an interview room" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = joinRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid join parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { roomCode, invitationToken } = validation.data;
    const normalizedCode = roomCode.toLowerCase();

    const room = await InterviewRoom.findOne({ roomCode: normalizedCode });

    if (!room) {
      return NextResponse.json(
        { error: "Interview room not found. Please verify the room code." },
        { status: 404 }
      );
    }

    // Refuse cancelled or completed rooms
    if (room.status === "cancelled") {
      return NextResponse.json(
        { error: "This interview session has been cancelled and is no longer accepting participants." },
        { status: 400 }
      );
    }

    if (room.status === "completed") {
      return NextResponse.json(
        { error: "This interview session has already ended." },
        { status: 400 }
      );
    }

    const userIdStr = auth.user.id;
    const isCreator = room.creatorId.toString() === userIdStr;
    const existingParticipant = room.participants.find(
      (p) => p.userId.toString() === userIdStr
    );

    // If user is already the host or a participant, allow immediate entry without creating a duplicate record
    if (isCreator || existingParticipant) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        role: existingParticipant ? existingParticipant.role : "interviewer",
        room: room.toSafeObject(userIdStr),
      });
    }

    // If room is invite_only, enforce token verification
    if (room.accessPolicy === "invite_only") {
      if (!invitationToken) {
        return NextResponse.json(
          {
            error:
              "This room is private. A valid invitation link is required to join.",
            requiresInvitation: true,
          },
          { status: 403 }
        );
      }

      if (room.invitationRevoked) {
        return NextResponse.json(
          { error: "This invitation link has been revoked by the host." },
          { status: 403 }
        );
      }

      const candidateHash = hashInvitationToken(invitationToken);
      if (candidateHash !== room.invitationTokenHash) {
        return NextResponse.json(
          { error: "Invalid or expired invitation token." },
          { status: 403 }
        );
      }
    }

    // Safely add user as candidate using atomic update to avoid duplicate participants under concurrency
    const updatedRoom = await InterviewRoom.findOneAndUpdate(
      {
        _id: room._id,
        "participants.userId": { $ne: auth.rawUser._id },
      },
      {
        $push: {
          participants: {
            userId: auth.rawUser._id,
            name: auth.user.name,
            email: auth.user.email,
            avatarUrl: auth.user.avatarUrl || "",
            role: "candidate",
            joinedAt: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    );

    const finalRoom = updatedRoom || (await InterviewRoom.findById(room._id));

    if (!finalRoom) {
      return NextResponse.json(
        { error: "Failed to join room" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      role: "candidate",
      room: finalRoom.toSafeObject(userIdStr),
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

    console.error("POST /api/interviews/join error:", error);
    return NextResponse.json(
      { error: "Failed to join interview room" },
      { status: 500 }
    );
  }
}
