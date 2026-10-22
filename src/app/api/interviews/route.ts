import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { InterviewRoom } from "@/lib/db/models/interview-room";
import { createRoomSchema } from "@/lib/interviews/schemas";
import {
  generateRoomCode,
  generateInvitationToken,
  hashInvitationToken,
  getAppOrigin,
  buildInvitationUrl,
} from "@/lib/interviews/token";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required to create an interview room" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createRoomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid room configuration",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const data = validation.data;

    // Generate collision-resistant unique room code
    let roomCode = "";
    let attempts = 0;
    while (attempts < 5) {
      const candidateCode = generateRoomCode();
      const existing = await InterviewRoom.findOne({ roomCode: candidateCode }).lean();
      if (!existing) {
        roomCode = candidateCode;
        break;
      }
      attempts++;
    }

    if (!roomCode) {
      return NextResponse.json(
        { error: "Could not generate a unique room code. Please try again." },
        { status: 500 }
      );
    }

    // Generate cryptographic invitation token
    const rawInvitationToken = generateInvitationToken();
    const invitationTokenHash = hashInvitationToken(rawInvitationToken);

    // Creator is automatically registered as the interviewer
    const room = await InterviewRoom.create({
      roomCode,
      title: data.title,
      description: data.description || "",
      creatorId: auth.rawUser._id,
      language: data.language,
      difficulty: data.difficulty,
      durationMinutes: data.durationMinutes,
      accessPolicy: data.accessPolicy,
      status: "waiting",
      invitationTokenHash,
      invitationRevoked: false,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      participants: [
        {
          userId: auth.rawUser._id,
          name: auth.user.name,
          email: auth.user.email,
          avatarUrl: auth.user.avatarUrl || "",
          role: "interviewer",
          joinedAt: new Date(),
        },
      ],
    });

    const origin = getAppOrigin(request.nextUrl.origin);
    const invitationUrl = buildInvitationUrl(origin, rawInvitationToken, roomCode);

    return NextResponse.json(
      {
        success: true,
        room: room.toSafeObject(auth.user.id),
        invitationToken: rawInvitationToken,
        invitationUrl,
      },
      { status: 201 }
    );
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

    console.error("POST /api/interviews error:", error);
    return NextResponse.json(
      { error: "Failed to create interview room" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = await validateSession(token);

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required to view interview rooms" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10), 0);

    // Query rooms where user is creator OR participant
    const query: Record<string, unknown> = {
      $or: [
        { creatorId: auth.rawUser._id },
        { "participants.userId": auth.rawUser._id },
      ],
    };

    if (status && ["waiting", "active", "completed", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { roomCode: { $regex: search, $options: "i" } },
            { "participants.name": { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const [rooms, total] = await Promise.all([
      InterviewRoom.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InterviewRoom.countDocuments(query),
    ]);

    return NextResponse.json({
      rooms: rooms.map((r) => r.toSafeObject(auth.user.id)),
      total,
      limit,
      skip,
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

    console.error("GET /api/interviews error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve interview rooms" },
      { status: 500 }
    );
  }
}
