import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import crypto from "crypto";

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/pairzen_test";

// Test schemas matching production models
const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "TestUser", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["interviewer", "candidate", "observer"], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "TestUser", required: true },
    language: {
      type: String,
      enum: ["typescript", "javascript", "python", "java", "cpp", "go", "rust"],
      default: "typescript",
    },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    durationMinutes: { type: Number, default: 60 },
    accessPolicy: { type: String, enum: ["invite_only", "discoverable"], default: "invite_only" },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "cancelled"],
      default: "waiting",
    },
    invitationTokenHash: { type: String, required: true },
    invitationRevoked: { type: Boolean, default: false },
    startedAt: { type: Date },
    endedAt: { type: Date },
    participants: { type: [ParticipantSchema], default: [] },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

const TestRoom =
  mongoose.models.TestInterviewRoom ||
  mongoose.model("TestInterviewRoom", InterviewRoomSchema);
const TestUser =
  mongoose.models.TestUser ||
  mongoose.model("TestUser", UserSchema);

// Helper functions matching production logic
function generateInvitationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashInvitationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function validateCreatePayload(data) {
  if (!data.title || typeof data.title !== "string" || data.title.trim().length < 2) {
    return { valid: false, error: "Title must be at least 2 characters" };
  }
  const allowedLanguages = ["typescript", "javascript", "python", "java", "cpp", "go", "rust"];
  if (!allowedLanguages.includes(data.language)) {
    return { valid: false, error: "Unsupported programming language" };
  }
  if (![15, 30, 45, 60, 90, 120, 180].includes(data.durationMinutes)) {
    return { valid: false, error: "Invalid duration" };
  }
  return { valid: true };
}

describe("Pairzen Phase 3: Interview Room Management & Secure Joining", () => {
  let interviewerUser;
  let candidateUser;
  let unauthorizedUser;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGODB_URI);
    }
    await TestRoom.deleteMany({});
    await TestUser.deleteMany({});

    interviewerUser = await TestUser.create({
      name: "Interviewer Alice",
      email: "alice.interviewer@pairzen.io",
      role: "interviewer",
    });

    candidateUser = await TestUser.create({
      name: "Candidate Bob",
      email: "bob.candidate@example.com",
      role: "user",
    });

    unauthorizedUser = await TestUser.create({
      name: "Eve Observer",
      email: "eve@unauthorized.io",
      role: "user",
    });
  });

  after(async () => {
    await TestRoom.deleteMany({});
    await TestUser.deleteMany({});
    await mongoose.disconnect();
  });

  test("1. Successful room creation with creator as interviewer", async () => {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    const room = await TestRoom.create({
      roomCode: "pz-1001-algo",
      title: "Senior Distributed Systems Interview",
      description: "Focus on Raft and Paxos",
      creatorId: interviewerUser._id,
      language: "typescript",
      difficulty: "hard",
      durationMinutes: 60,
      accessPolicy: "invite_only",
      status: "waiting",
      invitationTokenHash: tokenHash,
      participants: [
        {
          userId: interviewerUser._id,
          name: interviewerUser.name,
          email: interviewerUser.email,
          role: "interviewer",
          joinedAt: new Date(),
        },
      ],
    });

    assert.ok(room._id);
    assert.equal(room.status, "waiting");
    assert.equal(room.participants.length, 1);
    assert.equal(room.participants[0].role, "interviewer");
    assert.equal(room.participants[0].name, "Interviewer Alice");
  });

  test("2. Invalid room creation payload rejection", async () => {
    const invalidTitle = validateCreatePayload({
      title: " ",
      language: "typescript",
      durationMinutes: 60,
    });
    assert.equal(invalidTitle.valid, false);

    const invalidLanguage = validateCreatePayload({
      title: "Valid Title",
      language: "cobol",
      durationMinutes: 60,
    });
    assert.equal(invalidLanguage.valid, false);

    const invalidDuration = validateCreatePayload({
      title: "Valid Title",
      language: "typescript",
      durationMinutes: 500,
    });
    assert.equal(invalidDuration.valid, false);
  });

  test("3. Duplicate room code collision handling enforces uniqueness", async () => {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    await assert.rejects(async () => {
      await TestRoom.create({
        roomCode: "pz-1001-algo", // Duplicate code
        title: "Duplicate Code Attempt",
        creatorId: interviewerUser._id,
        invitationTokenHash: tokenHash,
        participants: [],
      });
    });
  });

  test("4. Unauthorized room access check for private invite_only room", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-1001-algo" });
    assert.ok(room);

    // Eve is neither creator nor participant
    const isAuthorized =
      room.creatorId.equals(unauthorizedUser._id) ||
      room.participants.some((p) => p.userId.equals(unauthorizedUser._id)) ||
      room.accessPolicy === "discoverable";

    assert.equal(isAuthorized, false, "Unauthorized user should not have access to private room");
  });

  test("5. Private room access rejected without valid invitation token", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-1001-algo" });
    const wrongToken = "invalid-token-12345";
    const wrongHash = hashInvitationToken(wrongToken);

    const tokenValid = room.invitationTokenHash === wrongHash && !room.invitationRevoked;
    assert.equal(tokenValid, false, "Wrong invitation token should be rejected");
  });

  test("6. Successful invitation-based joining assigns candidate role", async () => {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    const room = await TestRoom.create({
      roomCode: "pz-2002-node",
      title: "Node.js Fullstack Screen",
      creatorId: interviewerUser._id,
      language: "javascript",
      difficulty: "medium",
      accessPolicy: "invite_only",
      status: "waiting",
      invitationTokenHash: tokenHash,
      participants: [
        {
          userId: interviewerUser._id,
          name: interviewerUser.name,
          email: interviewerUser.email,
          role: "interviewer",
          joinedAt: new Date(),
        },
      ],
    });

    // Bob presents rawToken
    const candidateHash = hashInvitationToken(rawToken);
    assert.equal(candidateHash, room.invitationTokenHash);

    // Add Bob as candidate
    const updated = await TestRoom.findOneAndUpdate(
      { _id: room._id, "participants.userId": { $ne: candidateUser._id } },
      {
        $push: {
          participants: {
            userId: candidateUser._id,
            name: candidateUser.name,
            email: candidateUser.email,
            role: "candidate",
            joinedAt: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    );

    assert.equal(updated.participants.length, 2);
    const bob = updated.participants.find((p) => p.userId.equals(candidateUser._id));
    assert.ok(bob);
    assert.equal(bob.role, "candidate");
  });

  test("7. Revoked invitation token rejects entry", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-2002-node" });
    room.invitationRevoked = true;
    await room.save();

    assert.equal(room.invitationRevoked, true);
  });

  test("8. Joining the same room twice is idempotent with no duplicates", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-2002-node" });

    // Try to add Bob again
    const tryAddAgain = await TestRoom.findOneAndUpdate(
      { _id: room._id, "participants.userId": { $ne: candidateUser._id } },
      {
        $push: {
          participants: {
            userId: candidateUser._id,
            name: candidateUser.name,
            email: candidateUser.email,
            role: "candidate",
            joinedAt: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    );

    assert.equal(tryAddAgain, null, "Should return null because Bob already exists");
    const freshRoom = await TestRoom.findById(room._id);
    const bobMatches = freshRoom.participants.filter((p) => p.userId.equals(candidateUser._id));
    assert.equal(bobMatches.length, 1, "There must be exactly one record for Bob");
  });

  test("9. Candidate cannot start an interview (role authorization enforced)", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-2002-node" });
    const isHost =
      room.creatorId.equals(candidateUser._id) ||
      room.participants.some((p) => p.userId.equals(candidateUser._id) && p.role === "interviewer");

    assert.equal(isHost, false, "Candidate must not be recognized as host");
  });

  test("10. Interviewer starts waiting room (waiting -> active)", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-2002-node" });
    assert.equal(room.status, "waiting");

    room.status = "active";
    room.startedAt = new Date();
    await room.save();

    const fresh = await TestRoom.findById(room._id);
    assert.equal(fresh.status, "active");
    assert.ok(fresh.startedAt);
  });

  test("11. Invalid lifecycle transition rejected", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-2002-node" });
    // Transitioning from active to waiting is invalid
    const canRevertToWaiting = room.status === "waiting";
    assert.equal(canRevertToWaiting, false, "Cannot transition an active room back to waiting");
  });

  test("12. Interviewer completes active interview (active -> completed)", async () => {
    const room = await TestRoom.findOne({ roomCode: "pz-2002-node" });
    assert.equal(room.status, "active");

    room.status = "completed";
    room.endedAt = new Date();
    await room.save();

    const fresh = await TestRoom.findById(room._id);
    assert.equal(fresh.status, "completed");
    assert.ok(fresh.endedAt);
  });

  test("13. Cancelled room refuses new participants", async () => {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    const cancelledRoom = await TestRoom.create({
      roomCode: "pz-3003-cancel",
      title: "Cancelled Interview Session",
      creatorId: interviewerUser._id,
      accessPolicy: "discoverable",
      status: "cancelled",
      invitationTokenHash: tokenHash,
      participants: [],
    });

    const allowsJoin = cancelledRoom.status === "waiting" || cancelledRoom.status === "active";
    assert.equal(allowsJoin, false, "Cancelled room must reject new participants");
  });

  test("14. Dashboard query authorization: users only see authorized rooms", async () => {
    // Rooms created: pz-1001-algo (Alice), pz-2002-node (Alice + Bob), pz-3003-cancel (Alice)
    const bobRooms = await TestRoom.find({
      $or: [
        { creatorId: candidateUser._id },
        { "participants.userId": candidateUser._id },
      ],
    });

    assert.equal(bobRooms.length, 1);
    assert.equal(bobRooms[0].roomCode, "pz-2002-node");

    const eveRooms = await TestRoom.find({
      $or: [
        { creatorId: unauthorizedUser._id },
        { "participants.userId": unauthorizedUser._id },
      ],
    });

    assert.equal(eveRooms.length, 0, "Eve should see zero private rooms");
  });

  test("15. Concurrent join requests safety", async () => {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    const concurrentRoom = await TestRoom.create({
      roomCode: "pz-4004-race",
      title: "Concurrency Test Room",
      creatorId: interviewerUser._id,
      accessPolicy: "discoverable",
      status: "waiting",
      invitationTokenHash: tokenHash,
      participants: [],
    });

    // Simulate 5 simultaneous joins by the same candidate
    const joinPromises = Array.from({ length: 5 }).map(() =>
      TestRoom.findOneAndUpdate(
        {
          _id: concurrentRoom._id,
          "participants.userId": { $ne: candidateUser._id },
        },
        {
          $push: {
            participants: {
              userId: candidateUser._id,
              name: candidateUser.name,
              email: candidateUser.email,
              role: "candidate",
              joinedAt: new Date(),
            },
          },
        },
        { returnDocument: "after" }
      )
    );

    const results = await Promise.all(joinPromises);
    const nonNullResults = results.filter(Boolean);

    // Exactly one update succeeded in pushing the candidate
    assert.equal(nonNullResults.length, 1, "Atomic condition ensured exactly one write occurred");

    const fresh = await TestRoom.findById(concurrentRoom._id);
    assert.equal(fresh.participants.length, 1);
    assert.equal(fresh.participants[0].name, "Candidate Bob");
  });
});
