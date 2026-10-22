import mongoose, { Schema, Document, Model } from "mongoose";

export type AIMessageMode = "chat" | "hint" | "review" | "complexity";
export type AIMessageRole = "user" | "assistant" | "system";

export interface IAIMessage {
  id: string;
  role: AIMessageRole;
  mode: AIMessageMode;
  content: string;
  codeSnapshot?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IAIConversation extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  messages: IAIMessage[];
  currentHintLevel: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeAIConversation;
}

export interface SafeAIMessage {
  id: string;
  role: AIMessageRole;
  mode: AIMessageMode;
  content: string;
  codeSnapshot?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SafeAIConversation {
  id: string;
  roomId: string;
  userId: string;
  messages: SafeAIMessage[];
  currentHintLevel: number;
  lastActiveAt: string;
}

const AIMessageSchema = new Schema<IAIMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    mode: { type: String, enum: ["chat", "hint", "review", "complexity"], default: "chat" },
    content: { type: String, required: true, maxlength: 16384 },
    codeSnapshot: { type: String, maxlength: 32768 },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIConversationSchema = new Schema<IAIConversation>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewRoom",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: {
      type: [AIMessageSchema],
      default: [],
    },
    currentHintLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

AIConversationSchema.index({ roomId: 1, userId: 1 }, { unique: true });

AIConversationSchema.methods.toSafeObject = function (): SafeAIConversation {
  return {
    id: this._id.toString(),
    roomId: this.roomId.toString(),
    userId: this.userId.toString(),
    messages: (this.messages || []).map((m: IAIMessage) => ({
      id: m.id,
      role: m.role,
      mode: m.mode,
      content: m.content,
      codeSnapshot: m.codeSnapshot,
      metadata: m.metadata,
      createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
    })),
    currentHintLevel: this.currentHintLevel || 0,
    lastActiveAt: this.lastActiveAt ? this.lastActiveAt.toISOString() : new Date().toISOString(),
  };
};

export const AIConversation: Model<IAIConversation> =
  mongoose.models.AIConversation ||
  mongoose.model<IAIConversation>("AIConversation", AIConversationSchema);
