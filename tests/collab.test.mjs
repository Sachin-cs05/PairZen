import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import crypto from "crypto";
import { io as ClientSocket } from "socket.io-client";
import * as Y from "yjs";
import { CollabServer } from "../src/server/collab-server.ts";

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/pairzen_test";

// Helpers to create test users, sessions, and interview rooms
async function createTestUser(email, name) {
  const User = mongoose.model("User");
  return await User.create({
    email: email.toLowerCase(),
    name,
    passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyzaBCDEFGHIJKLMNOPQRSTUVW",
    role: "user",
    status: "active",
  });
}

async function createTestSession(userId) {
  const Session = mongoose.model("Session");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await Session.create({
    tokenHash,
    userId,
    userAgent: "test-client",
    ip: "127.0.0.1",
    expiresAt,
  });

  return { rawToken, session };
}

async function createTestRoom(creatorId, title, options = {}) {
  const InterviewRoom = mongoose.model("InterviewRoom");
  const roomCode = `pz-${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`;
  const invitationSecret = crypto.randomBytes(32).toString("hex");
  const invitationTokenHash = crypto.createHash("sha256").update(invitationSecret).digest("hex");

  return await InterviewRoom.create({
    roomCode,
    title,
    creatorId,
    language: options.language || "typescript",
    difficulty: options.difficulty || "medium",
    durationMinutes: options.durationMinutes || 60,
    accessPolicy: options.accessPolicy || "invite_only",
    status: options.status || "active",
    invitationTokenHash,
    participants: options.participants || [],
  });
}

function createClient(port, auth = {}) {
  return ClientSocket(`http://127.0.0.1:${port}`, {
    auth,
    transports: ["websocket"],
    reconnection: false,
    forceNew: true,
    autoConnect: false,
  });
}

function connect(client) {
  return new Promise((resolve, reject) => {
    if (client.connected) return resolve(client);
    client.once("connect", () => resolve(client));
    client.once("connect_error", reject);
    client.connect();
  });
}

function joinRoom(client, roomCode) {
  return new Promise((resolve) => {
    client.emit("collab:join", { roomCode }, (res) => resolve(res));
  });
}

describe("Pairzen Phase 4: Real-Time Collaborative Workspace Engine", () => {
  let server;
  let serverPort;
  let userInterviewer;
  let userCandidate;
  let userUnauthorized;
  let sessionInterviewer;
  let sessionCandidate;
  let sessionUnauthorized;
  let testRoom;

  before(async () => {
    process.env.MONGODB_URI = TEST_MONGODB_URI;
    await mongoose.connect(TEST_MONGODB_URI);

    // Clean test collections
    if (mongoose.models.User) await mongoose.models.User.deleteMany({});
    if (mongoose.models.Session) await mongoose.models.Session.deleteMany({});
    if (mongoose.models.InterviewRoom) await mongoose.models.InterviewRoom.deleteMany({});

    // Create users & sessions
    userInterviewer = await createTestUser("host@pairzen.test", "Sarah Host");
    userCandidate = await createTestUser("candidate@pairzen.test", "Alex Candidate");
    userUnauthorized = await createTestUser("intruder@pairzen.test", "Intruder User");

    sessionInterviewer = await createTestSession(userInterviewer._id);
    sessionCandidate = await createTestSession(userCandidate._id);
    sessionUnauthorized = await createTestSession(userUnauthorized._id);

    // Create test room with creator as interviewer and candidate enrolled in participants
    testRoom = await createTestRoom(userInterviewer._id, "Algorithms & Data Structures", {
      status: "active",
      participants: [
        {
          userId: userCandidate._id,
          name: userCandidate.name,
          email: userCandidate.email,
          role: "candidate",
          joinedAt: new Date(),
        },
      ],
    });

    // Start CollabServer on dynamic port
    server = new CollabServer();
    serverPort = await server.start(0);
  });

  after(async () => {
    if (server) {
      await server.stop();
    }
    await mongoose.disconnect();
  });

  test("1. Unauthenticated connection rejection", async () => {
    const client = createClient(serverPort, {});
    await new Promise((resolve) => {
      client.once("connect_error", (err) => {
        assert.ok(err.message.includes("UNAUTHENTICATED"));
        client.disconnect();
        resolve();
      });
      client.connect();
    });
  });

  test("2. Invalid session token rejection", async () => {
    const client = createClient(serverPort, { token: "invalid-token-12345" });
    await new Promise((resolve) => {
      client.once("connect_error", (err) => {
        assert.ok(err.message.includes("UNAUTHORIZED"));
        client.disconnect();
        resolve();
      });
      client.connect();
    });
  });

  test("3. Authorized connection succeeds with valid session", async () => {
    const client = createClient(serverPort, { token: sessionInterviewer.rawToken });
    await connect(client);
    assert.ok(client.id);
    client.disconnect();
  });

  test("4. Unauthorized room join rejection", async () => {
    const client = createClient(serverPort, { token: sessionUnauthorized.rawToken });
    await connect(client);

    const res = await joinRoom(client, testRoom.roomCode);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes("FORBIDDEN"));
    client.disconnect();
  });

  test("5. Authorized interviewer and candidate join with respective roles", async () => {
    const client1 = createClient(serverPort, { token: sessionInterviewer.rawToken });
    const client2 = createClient(serverPort, { token: sessionCandidate.rawToken });

    try {
      await connect(client1);
      const res1 = await joinRoom(client1, testRoom.roomCode);
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.room.role, "interviewer");
      assert.strictEqual(res1.room.roomCode, testRoom.roomCode);

      await connect(client2);
      const res2 = await joinRoom(client2, testRoom.roomCode);
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.room.role, "candidate");
    } finally {
      client1.disconnect();
      client2.disconnect();
    }
  });

  test("6. Room isolation prevents cross-room leakage", async () => {
    const otherRoom = await createTestRoom(userInterviewer._id, "Secondary Isolated Room", {
      status: "active",
      participants: [
        {
          userId: userCandidate._id,
          name: userCandidate.name,
          email: userCandidate.email,
          role: "candidate",
          joinedAt: new Date(),
        },
      ],
    });

    const clientRoom1 = createClient(serverPort, { token: sessionInterviewer.rawToken });
    const clientRoom2 = createClient(serverPort, { token: sessionCandidate.rawToken });

    let room2ReceivedUpdate = false;

    try {
      await connect(clientRoom1);
      await joinRoom(clientRoom1, testRoom.roomCode);

      await connect(clientRoom2);
      await joinRoom(clientRoom2, otherRoom.roomCode);

      clientRoom2.on("collab:update", () => {
        room2ReceivedUpdate = true;
      });

      // Client 1 sends edit update in Room 1
      const doc = new Y.Doc();
      const text = doc.getText("monaco");
      text.insert(0, "// Room 1 exclusive edit");
      const update = Y.encodeStateAsUpdate(doc);

      clientRoom1.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: Buffer.from(update),
      });

      await new Promise((resolve) => setTimeout(resolve, 150));
      assert.strictEqual(room2ReceivedUpdate, false, "Client in Room 2 must not receive updates from Room 1");
    } finally {
      clientRoom1.disconnect();
      clientRoom2.disconnect();
    }
  });

  test("7. Real-time document edit synchronization between two clients", async () => {
    const client1 = createClient(serverPort, { token: sessionInterviewer.rawToken });
    const client2 = createClient(serverPort, { token: sessionCandidate.rawToken });

    const doc2 = new Y.Doc();

    try {
      await connect(client1);
      await joinRoom(client1, testRoom.roomCode);

      await connect(client2);
      const syncFullPromise = new Promise((resolve) => {
        client2.once("collab:sync_full", (data) => {
          Y.applyUpdate(doc2, new Uint8Array(data.update));
          resolve();
        });
      });
      await joinRoom(client2, testRoom.roomCode);
      await syncFullPromise;

      // Client 2 listens for update from Client 1
      const updateReceivedPromise = new Promise((resolve) => {
        client2.once("collab:update", (data) => {
          Y.applyUpdate(doc2, new Uint8Array(data.update));
          resolve();
        });
      });

      // Client 1 sends edit
      const editDoc = new Y.Doc();
      const yText = editDoc.getText("monaco");
      yText.insert(0, "function solution() { return true; }\n");
      const update = Y.encodeStateAsUpdate(editDoc);

      client1.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: Buffer.from(update),
      });

      await updateReceivedPromise;

      assert.ok(
        doc2.getText("monaco").toString().includes("function solution()"),
        "Client 2 received and applied Client 1's edit in real time"
      );
    } finally {
      client1.disconnect();
      client2.disconnect();
    }
  });

  test("8. Concurrent edits converge deterministically via Yjs CRDTs", async () => {
    const client1 = createClient(serverPort, { token: sessionInterviewer.rawToken });
    const client2 = createClient(serverPort, { token: sessionCandidate.rawToken });

    const localDoc1 = new Y.Doc();
    const localDoc2 = new Y.Doc();

    try {
      await connect(client1);
      await connect(client2);

      const syncFull1 = new Promise((res) => client1.once("collab:sync_full", (d) => {
        Y.applyUpdate(localDoc1, new Uint8Array(d.update));
        res();
      }));
      const syncFull2 = new Promise((res) => client2.once("collab:sync_full", (d) => {
        Y.applyUpdate(localDoc2, new Uint8Array(d.update));
        res();
      }));

      await joinRoom(client1, testRoom.roomCode);
      await joinRoom(client2, testRoom.roomCode);
      await Promise.all([syncFull1, syncFull2]);

      // Wire incoming updates
      client1.on("collab:update", (data) => {
        Y.applyUpdate(localDoc1, new Uint8Array(data.update));
      });
      client2.on("collab:update", (data) => {
        Y.applyUpdate(localDoc2, new Uint8Array(data.update));
      });

      // Simultaneous edits
      const docA = new Y.Doc();
      docA.getText("monaco").insert(0, "// Edit A by Interviewer\n");
      const updateA = Y.encodeStateAsUpdate(docA);

      const docB = new Y.Doc();
      docB.getText("monaco").insert(0, "// Edit B by Candidate\n");
      const updateB = Y.encodeStateAsUpdate(docB);

      client1.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: Buffer.from(updateA),
      });
      client2.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: Buffer.from(updateB),
      });

      Y.applyUpdate(localDoc1, updateA);
      Y.applyUpdate(localDoc2, updateB);

      // Wait for convergence
      await new Promise((resolve) => setTimeout(resolve, 300));

      const text1 = localDoc1.getText("monaco").toString();
      const text2 = localDoc2.getText("monaco").toString();

      assert.strictEqual(
        text1,
        text2,
        "Concurrent edits must converge to identical document states on both clients"
      );
      assert.ok(text1.includes("Edit A") && text1.includes("Edit B"));
    } finally {
      client1.disconnect();
      client2.disconnect();
    }
  });

  test("9. Participant presence and disconnect cleanup", async () => {
    const client1 = createClient(serverPort, { token: sessionInterviewer.rawToken });
    let client2;

    try {
      await connect(client1);
      await joinRoom(client1, testRoom.roomCode);

      // Client 2 joins and triggers presence list update for Client 1
      const presenceJoinedPromise = new Promise((resolve) => {
        client1.on("collab:presence_list", (data) => {
          if (data.participants.length === 2) {
            resolve(data.participants);
          }
        });
      });

      client2 = createClient(serverPort, { token: sessionCandidate.rawToken });
      await connect(client2);
      await joinRoom(client2, testRoom.roomCode);

      const presenceWithTwo = await presenceJoinedPromise;
      assert.strictEqual(presenceWithTwo.length, 2);
      assert.ok(presenceWithTwo.some((p) => p.name === "Sarah Host"));
      assert.ok(presenceWithTwo.some((p) => p.name === "Alex Candidate"));

      // Disconnect Client 2 and verify presence list reduces to 1
      const presenceLeftPromise = new Promise((resolve) => {
        client1.on("collab:presence_list", (data) => {
          if (data.participants.length === 1) {
            resolve(data.participants);
          }
        });
      });

      client2.disconnect();
      const presenceWithOne = await presenceLeftPromise;
      assert.strictEqual(presenceWithOne.length, 1);
      assert.strictEqual(presenceWithOne[0].name, "Sarah Host");
    } finally {
      client1.disconnect();
      if (client2) client2.disconnect();
    }
  });

  test("10. State persistence to MongoDB and restoration after server restart", async () => {
    const client = createClient(serverPort, { token: sessionInterviewer.rawToken });
    const persistentMarker = `// RESTART_PERSISTENCE_TEST_${Date.now()}`;

    try {
      await connect(client);
      await joinRoom(client, testRoom.roomCode);

      // Client edits document
      const doc = new Y.Doc();
      doc.getText("monaco").insert(0, `${persistentMarker}\n`);
      const update = Y.encodeStateAsUpdate(doc);

      client.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: Buffer.from(update),
      });

      // Force save to database
      await new Promise((resolve) => {
        client.emit("collab:force_save", (res) => {
          assert.strictEqual(res.success, true);
          resolve();
        });
      });

      client.disconnect();

      // Verify state exists in MongoDB
      const roomInDb = await mongoose.model("InterviewRoom").findOne({ roomCode: testRoom.roomCode });
      assert.ok(roomInDb.codeState.includes(persistentMarker));
      assert.ok(roomInDb.yjsState && roomInDb.yjsState.length > 0);

      // Stop original server instance
      await server.stop();

      // Start fresh server instance on a new port
      server = new CollabServer();
      serverPort = await server.start(0);

      // Connect new client to fresh server
      const newClient = createClient(serverPort, { token: sessionInterviewer.rawToken });
      const restoredDoc = new Y.Doc();

      await connect(newClient);
      const syncFullPromise = new Promise((resolve) => {
        newClient.once("collab:sync_full", (data) => {
          Y.applyUpdate(restoredDoc, new Uint8Array(data.update));
          resolve();
        });
      });

      await joinRoom(newClient, testRoom.roomCode);
      await syncFullPromise;
      newClient.disconnect();

      // Verify restored document has the persistent marker
      assert.ok(
        restoredDoc.getText("monaco").toString().includes(persistentMarker),
        "Document state was recovered from MongoDB after server restart"
      );
    } finally {
      client.disconnect();
    }
  });

  test("11. Completed or cancelled room editing policy enforces read-only", async () => {
    const completedRoom = await createTestRoom(userInterviewer._id, "Finished Architecture Interview", {
      status: "completed",
      participants: [
        {
          userId: userCandidate._id,
          name: userCandidate.name,
          email: userCandidate.email,
          role: "candidate",
          joinedAt: new Date(),
        },
      ],
    });

    const client = createClient(serverPort, { token: sessionCandidate.rawToken });

    try {
      await connect(client);
      const res = await joinRoom(client, completedRoom.roomCode);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.room.isReadOnly, true, "Completed room must be marked read-only");

      // Attempt to submit an edit
      const editErrorPromise = new Promise((resolve) => {
        client.once("collab:error", (err) => {
          if (err.message === "ROOM_IS_READ_ONLY") {
            resolve(err.message);
          }
        });
      });

      const doc = new Y.Doc();
      doc.getText("monaco").insert(0, "// Illegal edit on completed room");
      const update = Y.encodeStateAsUpdate(doc);

      client.emit("collab:update", {
        roomCode: completedRoom.roomCode,
        update: Buffer.from(update),
      });

      const errMessage = await editErrorPromise;
      assert.strictEqual(errMessage, "ROOM_IS_READ_ONLY");
    } finally {
      client.disconnect();
    }
  });

  test("12. Malformed and oversized update rejection", async () => {
    const client = createClient(serverPort, { token: sessionInterviewer.rawToken });

    try {
      await connect(client);
      await joinRoom(client, testRoom.roomCode);

      // 1. Send malformed non-binary update
      const malformedPromise = new Promise((resolve) => {
        client.once("collab:error", (err) => {
          assert.strictEqual(err.message, "INVALID_UPDATE_PAYLOAD");
          resolve();
        });
      });

      client.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: "NOT_A_BUFFER_OR_UINT8ARRAY",
      });

      await malformedPromise;

      // 2. Send oversized update (> 1MB)
      const oversizedPromise = new Promise((resolve) => {
        client.once("collab:error", (err) => {
          assert.strictEqual(err.message, "UPDATE_PAYLOAD_TOO_LARGE");
          resolve();
        });
      });

      const hugeBuffer = Buffer.alloc(1024 * 1024 + 500); // 1MB + 500 bytes
      client.emit("collab:update", {
        roomCode: testRoom.roomCode,
        update: hugeBuffer,
      });

      await oversizedPromise;
    } finally {
      client.disconnect();
    }
  });
});
