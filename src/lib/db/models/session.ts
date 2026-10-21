import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  tokenHash: string; // SHA-256 hash of the opaque session token
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "unknown",
    },
    ip: {
      type: String,
      default: "unknown",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL deletion
    },
  },
  {
    timestamps: true,
  }
);

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
