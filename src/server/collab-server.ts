import http from "http";
import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import * as cookie from "cookie";
import { connectToDatabase } from "../lib/db/connect";
import { validateSession } from "../lib/auth/session";
import { InterviewRoom, RoomStatus } from "../lib/db/models/interview-room";
import { getStarterCode } from "../lib/collab/starter-templates";

export interface ConnectedUserPresence {
  userId: string;
  name: string;
  email: string;
  role: "interviewer" | "candidate" | "observer";
  avatarUrl?: string;
  color: string;
  socketId: string;
  joinedAt: string;
}

export interface RoomSession {
  roomCode: string;
  doc: Y.Doc;
  language: string;
  status: RoomStatus;
  isReadOnly: boolean;
  saveTimer: NodeJS.Timeout | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  connectedSockets: Set<string>;
  presenceMap: Map<string, ConnectedUserPresence>; // socketId -> presence
}

// User color palette for remote cursors & selections
const USER_COLORS = [
  "#38bdf8", // Sky blue
  "#34d399", // Emerald
  "#a78bfa", // Purple
  "#f472b6", // Pink
  "#fb923c", // Orange
  "#facc15", // Amber
  "#60a5fa", // Blue
  "#4ade80", // Green
  "#e879f9", // Fuchsia
  "#2dd4bf", // Teal
];

function pickUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

function extractSessionCookie(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;
  try {
    const cookieLib = cookie as unknown as {
      parseCookie?: (s: string) => Record<string, string>;
      parse?: (s: string) => Record<string, string>;
    };
    if (typeof cookieLib.parseCookie === "function") {
      return cookieLib.parseCookie(cookieHeader)["pz_session"];
    }
    if (typeof cookieLib.parse === "function") {
      return cookieLib.parse(cookieHeader)["pz_session"];
    }
  } catch {
    // fallback regex below
  }
  const match = cookieHeader.match(/(?:^|;\s*)pz_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export class CollabServer {
  private httpServer: http.Server;
  private io: Server;
  private roomSessions = new Map<string, RoomSession>();
  private isShuttingDown = false;

  constructor(server?: http.Server) {
    this.httpServer =
      server ||
      http.createServer((req, res) => {
        // Health check endpoint
        if (req.url === "/health" || req.url === "/") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "ok",
              service: "pairzen-collab-service",
              uptime: process.uptime(),
              activeRooms: this.roomSessions.size,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }
        res.writeHead(404);
        res.end("Not Found");
      });

    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    this.io = new Server(this.httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(null, true);
        },
        credentials: true,
      },
      maxHttpBufferSize: 2 * 1024 * 1024, // 2MB max payload
      pingTimeout: 20000,
      pingInterval: 10000,
    });

    this.setupAuthMiddleware();
    this.setupSocketHandlers();
  }

  private setupAuthMiddleware() {
    this.io.use(async (socket: Socket, next) => {
      try {
        let token: string | undefined;

        // 1. Try handshake auth token
        if (socket.handshake.auth && typeof socket.handshake.auth.token === "string") {
          token = socket.handshake.auth.token;
        }

        // 2. Try cookie header
        if (!token && socket.handshake.headers.cookie) {
          token = extractSessionCookie(socket.handshake.headers.cookie);
        }

        if (!token) {
          return next(new Error("UNAUTHENTICATED: No session token provided"));
        }

        await connectToDatabase();
        const authResult = await validateSession(token);

        if (!authResult) {
          return next(new Error("UNAUTHORIZED: Invalid or expired session"));
        }

        socket.data.user = {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
          role: authResult.user.role,
          avatarUrl: authResult.user.avatarUrl,
        };

        next();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[CollabServer] Auth middleware error:", msg);
        next(new Error("INTERNAL_AUTH_ERROR"));
      }
    });
  }

  private async getOrCreateRoomSession(roomCode: string): Promise<RoomSession | null> {
    const existing = this.roomSessions.get(roomCode);
    if (existing) {
      return existing;
    }

    await connectToDatabase();
    const room = await InterviewRoom.findOne({ roomCode });
    if (!room) {
      return null;
    }

    const doc = new Y.Doc();
    const yText = doc.getText("monaco");

    // Restore persisted state
    if (room.yjsState && room.yjsState.length > 0) {
      try {
        Y.applyUpdate(doc, new Uint8Array(room.yjsState), "init_db");
      } catch {
        console.warn(`[CollabServer] Failed applying yjsState for ${roomCode}, fallback to codeState`);
        yText.insert(0, room.codeState || getStarterCode(room.language));
      }
    } else if (room.codeState && room.codeState.length > 0) {
      yText.insert(0, room.codeState);
    } else {
      yText.insert(0, getStarterCode(room.language));
    }

    const isReadOnly = room.status === "completed" || room.status === "cancelled";

    const session: RoomSession = {
      roomCode,
      doc,
      language: room.language,
      status: room.status,
      isReadOnly,
      saveTimer: null,
      isSaving: false,
      lastSavedAt: room.codeLastSavedAt || null,
      connectedSockets: new Set<string>(),
      presenceMap: new Map<string, ConnectedUserPresence>(),
    };

    this.roomSessions.set(roomCode, session);
    return session;
  }

  private schedulePersistence(session: RoomSession) {
    if (session.isReadOnly) return;

    if (session.saveTimer) {
      clearTimeout(session.saveTimer);
    }

    // Notify clients that autosave is pending
    this.io.to(`pz_room:${session.roomCode}`).emit("collab:save_status", {
      status: "saving",
    });

    session.saveTimer = setTimeout(async () => {
      await this.persistRoomDocument(session);
    }, 1500); // 1.5 second debounce
  }

  public async persistRoomDocument(session: RoomSession): Promise<boolean> {
    if (session.isSaving) return false;
    session.isSaving = true;

    try {
      await connectToDatabase();
      const encodedUpdate = Buffer.from(Y.encodeStateAsUpdate(session.doc));
      const codeText = session.doc.getText("monaco").toString();
      const now = new Date();

      await InterviewRoom.updateOne(
        { roomCode: session.roomCode },
        {
          $set: {
            yjsState: encodedUpdate,
            codeState: codeText,
            codeLastSavedAt: now,
          },
        }
      );

      session.lastSavedAt = now;
      session.isSaving = false;

      this.io.to(`pz_room:${session.roomCode}`).emit("collab:save_status", {
        status: "saved",
        lastSavedAt: now.toISOString(),
      });

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[CollabServer] Error persisting room ${session.roomCode}:`, msg);
      session.isSaving = false;

      this.io.to(`pz_room:${session.roomCode}`).emit("collab:save_status", {
        status: "error",
        error: "Failed to persist code to database",
      });

      return false;
    }
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket: Socket) => {
      const user = socket.data.user;

      // Handle Room Join Request
      socket.on(
        "collab:join",
        async (
          data: { roomCode: string },
          callback?: (res: {
            success: boolean;
            error?: string;
            room?: {
              roomCode: string;
              title: string;
              language: string;
              role: string;
              status: RoomStatus;
              isReadOnly: boolean;
              lastSavedAt?: string;
            };
            currentUserPresence?: ConnectedUserPresence;
          }) => void
        ) => {
          try {
            const roomCode = data?.roomCode?.trim().toLowerCase();
            if (!roomCode) {
              callback?.({ success: false, error: "ROOM_CODE_REQUIRED" });
              return;
            }

            await connectToDatabase();
            const room = await InterviewRoom.findOne({ roomCode });

            if (!room) {
              callback?.({ success: false, error: "ROOM_NOT_FOUND" });
              return;
            }

            // Authorize user: must be creator or participant
            const isCreator = room.creatorId.toString() === user.id;
            const participantRecord = room.participants.find(
              (p) => p.userId.toString() === user.id
            );

            if (!isCreator && !participantRecord) {
              callback?.({
                success: false,
                error: "FORBIDDEN: User not authorized for this room",
              });
              return;
            }

            const userRole = isCreator
              ? "interviewer"
              : participantRecord?.role || "candidate";

            const session = await this.getOrCreateRoomSession(roomCode);
            if (!session) {
              callback?.({ success: false, error: "FAILED_INITIALIZING_SESSION" });
              return;
            }

            // Attach room info to socket
            socket.data.roomCode = roomCode;
            socket.data.role = userRole;
            socket.data.isReadOnly = session.isReadOnly;

            const roomChannel = `pz_room:${roomCode}`;
            await socket.join(roomChannel);
            session.connectedSockets.add(socket.id);

            const presence: ConnectedUserPresence = {
              userId: user.id,
              name: user.name,
              email: user.email,
              role: userRole,
              avatarUrl: user.avatarUrl,
              color: pickUserColor(user.id),
              socketId: socket.id,
              joinedAt: new Date().toISOString(),
            };

            session.presenceMap.set(socket.id, presence);

            // Acknowledge join success
            callback?.({
              success: true,
              room: {
                roomCode: room.roomCode,
                title: room.title,
                language: room.language,
                role: userRole,
                status: room.status,
                isReadOnly: session.isReadOnly,
                lastSavedAt: session.lastSavedAt
                  ? session.lastSavedAt.toISOString()
                  : undefined,
              },
              currentUserPresence: presence,
            });

            // Send current document state as a full update to the newly joined client
            const fullDocState = Y.encodeStateAsUpdate(session.doc);
            socket.emit("collab:sync_full", {
              roomCode,
              update: Buffer.from(fullDocState),
            });

            // Broadcast updated presence list to all participants in this room
            const presences = Array.from(session.presenceMap.values());
            this.io.to(roomChannel).emit("collab:presence_list", {
              roomCode,
              participants: presences,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[CollabServer] Join error:", msg);
            callback?.({ success: false, error: "INTERNAL_ERROR" });
          }
        }
      );

      // Handle Yjs document updates from client
      socket.on(
        "collab:update",
        (data: { roomCode: string; update: Buffer | Uint8Array }) => {
          try {
            const roomCode = socket.data.roomCode;
            if (!roomCode || roomCode !== data.roomCode) {
              socket.emit("collab:error", { message: "NOT_JOINED_TO_ROOM" });
              return;
            }

            const session = this.roomSessions.get(roomCode);
            if (!session) {
              socket.emit("collab:error", { message: "SESSION_NOT_FOUND" });
              return;
            }

            // Enforce read-only state for completed or cancelled rooms
            if (session.isReadOnly) {
              socket.emit("collab:error", { message: "ROOM_IS_READ_ONLY" });
              return;
            }

            const rawUpdate = data.update;
            if (
              !rawUpdate ||
              !(rawUpdate instanceof Uint8Array || Buffer.isBuffer(rawUpdate))
            ) {
              socket.emit("collab:error", { message: "INVALID_UPDATE_PAYLOAD" });
              return;
            }

            const uint8Update = new Uint8Array(rawUpdate);
            if (uint8Update.byteLength > 1024 * 1024) {
              socket.emit("collab:error", { message: "UPDATE_PAYLOAD_TOO_LARGE" });
              return;
            }

            // Apply update to server doc
            Y.applyUpdate(session.doc, uint8Update, socket.id);

            // Broadcast update to all OTHER sockets in the room
            socket.to(`pz_room:${roomCode}`).emit("collab:update", {
              roomCode,
              update: Buffer.from(uint8Update),
            });

            // Trigger debounced persistence
            this.schedulePersistence(session);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[CollabServer] Update error:", msg);
            socket.emit("collab:error", { message: "MALFORMED_YJS_UPDATE" });
          }
        }
      );

      // Handle Ephemeral Awareness / Cursor updates
      socket.on(
        "collab:awareness",
        (data: { roomCode: string; update: Buffer | Uint8Array }) => {
          const roomCode = socket.data.roomCode;
          if (!roomCode || roomCode !== data?.roomCode) return;

          socket.to(`pz_room:${roomCode}`).emit("collab:awareness", {
            roomCode,
            update: data.update,
          });
        }
      );

      // Handle Force Save trigger
      socket.on(
        "collab:force_save",
        async (
          callback?: (res: {
            success: boolean;
            error?: string;
            lastSavedAt?: Date | null;
          }) => void
        ) => {
          const roomCode = socket.data.roomCode;
          if (!roomCode) {
            callback?.({ success: false, error: "NOT_IN_ROOM" });
            return;
          }

          const session = this.roomSessions.get(roomCode);
          if (!session) {
            callback?.({ success: false, error: "SESSION_NOT_FOUND" });
            return;
          }

          const success = await this.persistRoomDocument(session);
          callback?.({ success, lastSavedAt: session.lastSavedAt });
        }
      );

      // Handle Socket Disconnect
      socket.on("disconnect", async () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        const session = this.roomSessions.get(roomCode);
        if (session) {
          session.connectedSockets.delete(socket.id);
          session.presenceMap.delete(socket.id);

          // Broadcast updated presence to remaining clients
          const remainingPresences = Array.from(session.presenceMap.values());
          this.io.to(`pz_room:${roomCode}`).emit("collab:presence_list", {
            roomCode,
            participants: remainingPresences,
          });

          // If room is now empty, immediately persist document
          if (session.connectedSockets.size === 0) {
            if (session.saveTimer) {
              clearTimeout(session.saveTimer);
              session.saveTimer = null;
            }
            await this.persistRoomDocument(session);
          }
        }
      });
    });
  }

  public getHttpServer(): http.Server {
    return this.httpServer;
  }

  public getIo(): Server {
    return this.io;
  }

  public getRoomSession(roomCode: string): RoomSession | undefined {
    return this.roomSessions.get(roomCode);
  }

  public async start(port = Number(process.env.COLLAB_PORT) || 3001): Promise<number> {
    return new Promise((resolve) => {
      this.httpServer.listen(port, () => {
        const address = this.httpServer.address();
        const actualPort = typeof address === "object" && address ? address.port : port;
        console.log(`[CollabServer] Pairzen Collaboration Service running on port ${actualPort}`);
        resolve(actualPort);
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    // Flush all pending persistence timers before stopping
    for (const session of this.roomSessions.values()) {
      if (session.saveTimer) {
        clearTimeout(session.saveTimer);
        session.saveTimer = null;
      }
      try {
        await this.persistRoomDocument(session);
      } catch (e) {
        console.error(`Error saving room ${session.roomCode} during shutdown:`, e);
      }
    }

    return new Promise((resolve) => {
      this.io.close(() => {
        this.httpServer.close(() => {
          resolve();
        });
      });
    });
  }
}

// Standalone runner when executed directly via tsx / node
if (process.env.RUN_STANDALONE === "true" || process.argv[1]?.includes("collab-server")) {
  const server = new CollabServer();
  const port = Number(process.env.COLLAB_PORT) || 3001;
  server.start(port).then(() => {
    console.log(`[CollabServer] Real-time collaboration engine ready at http://localhost:${port}`);
  });

  process.on("SIGINT", async () => {
    console.log("[CollabServer] Shutting down gracefully...");
    await server.stop();
    process.exit(0);
  });
}
