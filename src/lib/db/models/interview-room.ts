import mongoose, { Schema, Document, Model } from "mongoose";

export type RoomStatus = "waiting" | "active" | "completed" | "cancelled";
export type RoomAccessPolicy = "invite_only" | "discoverable";
export type ProgrammingLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust";
export type RoomDifficulty = "easy" | "medium" | "hard";
export type ParticipantRole = "interviewer" | "candidate" | "observer";

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  avatarUrl?: string;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
}

export interface IInterviewRoom extends Document {
  _id: mongoose.Types.ObjectId;
  roomCode: string;
  title: string;
  description?: string;
  creatorId: mongoose.Types.ObjectId;
  language: ProgrammingLanguage;
  difficulty: RoomDifficulty;
  durationMinutes: number;
  accessPolicy: RoomAccessPolicy;
  status: RoomStatus;
  invitationTokenHash: string; // SHA-256 of the random invitation secret
  invitationRevoked: boolean;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  codeState?: string;
  yjsState?: Buffer;
  codeLastSavedAt?: Date;
  participants: IParticipant[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(requestingUserId?: string): SafeInterviewRoom;
}

export interface SafeParticipant {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
}

export interface SafeInterviewRoom {
  id: string;
  roomCode: string;
  title: string;
  description?: string;
  creatorId: string;
  language: ProgrammingLanguage;
  difficulty: RoomDifficulty;
  durationMinutes: number;
  accessPolicy: RoomAccessPolicy;
  status: RoomStatus;
  codeState?: string;
  codeLastSavedAt?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  participantCount: number;
  participants: SafeParticipant[];
  isCreator: boolean;
  userRole?: ParticipantRole;
  createdAt: string;
  updatedAt: string;
}

const ParticipantSubSchema = new Schema<IParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["interviewer", "candidate", "observer"],
      default: "candidate",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    leftAt: {
      type: Date,
    },
  },
  { _id: false }
);

const InterviewRoomSchema = new Schema<IInterviewRoom>(
  {
    roomCode: {
      type: String,
      required: [true, "Room code is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    language: {
      type: String,
      enum: ["typescript", "javascript", "python", "java", "cpp", "go", "rust"],
      default: "typescript",
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Duration must be at least 15 minutes"],
      max: [180, "Duration cannot exceed 180 minutes"],
      default: 60,
    },
    accessPolicy: {
      type: String,
      enum: ["invite_only", "discoverable"],
      default: "invite_only",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "cancelled"],
      default: "waiting",
      required: true,
      index: true,
    },
    invitationTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    invitationRevoked: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    codeState: {
      type: String,
      default: "",
    },
    yjsState: {
      type: Buffer,
    },
    codeLastSavedAt: {
      type: Date,
    },
    participants: {
      type: [ParticipantSubSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
InterviewRoomSchema.index({ creatorId: 1, status: 1 });
InterviewRoomSchema.index({ "participants.userId": 1 });
InterviewRoomSchema.index({ createdAt: -1 });

InterviewRoomSchema.methods.toSafeObject = function (
  requestingUserId?: string
): SafeInterviewRoom {
  const isCreator = requestingUserId
    ? this.creatorId.toString() === requestingUserId.toString()
    : false;

  const currentParticipant = requestingUserId
    ? this.participants.find(
        (p: IParticipant) => p.userId.toString() === requestingUserId.toString()
      )
    : undefined;

  return {
    id: this._id.toString(),
    roomCode: this.roomCode,
    title: this.title,
    description: this.description || "",
    creatorId: this.creatorId.toString(),
    language: this.language,
    difficulty: this.difficulty,
    durationMinutes: this.durationMinutes,
    accessPolicy: this.accessPolicy,
    status: this.status,
    codeState: this.codeState || "",
    codeLastSavedAt: this.codeLastSavedAt ? this.codeLastSavedAt.toISOString() : undefined,
    scheduledAt: this.scheduledAt ? this.scheduledAt.toISOString() : undefined,
    startedAt: this.startedAt ? this.startedAt.toISOString() : undefined,
    endedAt: this.endedAt ? this.endedAt.toISOString() : undefined,
    participantCount: this.participants.length,
    participants: this.participants.map((p: IParticipant) => ({
      userId: p.userId.toString(),
      name: p.name,
      email: p.email,
      avatarUrl: p.avatarUrl || "",
      role: p.role,
      joinedAt: p.joinedAt ? p.joinedAt.toISOString() : new Date().toISOString(),
      leftAt: p.leftAt ? p.leftAt.toISOString() : undefined,
    })),
    isCreator,
    userRole: currentParticipant ? currentParticipant.role : isCreator ? "interviewer" : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const InterviewRoom: Model<IInterviewRoom> =
  mongoose.models.InterviewRoom ||
  mongoose.model<IInterviewRoom>("InterviewRoom", InterviewRoomSchema);
