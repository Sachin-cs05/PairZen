import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "user" | "interviewer" | "admin";
export type UserStatus = "active" | "suspended";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeUser;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Prevents accidental exposure in queries
    },
    role: {
      type: String,
      enum: ["user", "interviewer", "admin"],
      default: "user",
      required: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to convert mongoose document to safe JSON for client
UserSchema.methods.toSafeObject = function (): SafeUser {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role,
    avatarUrl: this.avatarUrl,
    status: this.status,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
