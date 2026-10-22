import { z } from "zod";

export const createRoomSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Interview title must be at least 2 characters")
    .max(120, "Interview title cannot exceed 120 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  language: z.enum([
    "typescript",
    "javascript",
    "python",
    "java",
    "cpp",
    "go",
    "rust",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  durationMinutes: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(180, "Duration cannot exceed 180 minutes")
    .default(60),
  accessPolicy: z.enum(["invite_only", "discoverable"]).default("invite_only"),
  scheduledAt: z
    .string()
    .datetime({ message: "Scheduled time must be a valid ISO datetime" })
    .optional()
    .or(z.literal("")),
});

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .trim()
    .min(3, "Room code is required")
    .max(30, "Room code cannot exceed 30 characters")
    .toLowerCase(),
  invitationToken: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  role: z
    .enum(["candidate", "observer"])
    .optional()
    .default("candidate"), // Prevents self-escalating to interviewer
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
