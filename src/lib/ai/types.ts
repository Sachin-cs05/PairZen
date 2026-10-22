import { z } from "zod";

// --- Chat Schemas ---
export const ChatRequestSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  message: z.string().min(1, "Message is required").max(4096, "Message exceeds 4KB limit"),
  codeSnapshot: z.string().max(32768, "Code snapshot cannot exceed 32KB").optional(),
  language: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// --- Hint Schemas ---
export const HintRequestSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  requestedLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  codeSnapshot: z.string().max(32768).optional(),
  language: z.string().optional(),
});

export type HintRequest = z.infer<typeof HintRequestSchema>;

export interface HintResponse {
  level: number;
  title: string;
  content: string;
  nextLevelAvailable: boolean;
}

// --- Code Review Schemas ---
export const CodeReviewRequestSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  codeSnapshot: z.string().min(1, "Source code cannot be empty").max(32768, "Source code exceeds 32KB limit"),
  language: z.string().default("javascript"),
});

export type CodeReviewRequest = z.infer<typeof CodeReviewRequestSchema>;

export interface CodeReviewIssue {
  line?: number;
  severity: "info" | "warning" | "error";
  description: string;
  suggestion: string;
}

export interface CodeReviewResult {
  summary: string;
  strengths: string[];
  issues: CodeReviewIssue[];
  improvements: string[];
  edgeCases: string[];
  complexity: {
    time: string;
    space: string;
  };
  confidenceNotes: string;
}

// --- Complexity Analysis Schemas ---
export const ComplexityRequestSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  codeSnapshot: z.string().min(1, "Source code cannot be empty").max(32768),
  language: z.string().default("javascript"),
});

export type ComplexityRequest = z.infer<typeof ComplexityRequestSchema>;

export interface ComplexityResult {
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
    explanation: string;
  };
  spaceComplexity: {
    auxiliary: string;
    total: string;
    explanation: string;
  };
  loopAndRecursionBreakdown: string[];
  dataStructureImpact: string[];
  assumptions: string[];
  uncertaintyNote?: string;
}

// --- Feedback Schemas ---
export const GenerateFeedbackRequestSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  interviewerNotes: z.string().max(4096).optional(),
});

export type GenerateFeedbackRequest = z.infer<typeof GenerateFeedbackRequestSchema>;

export const UpdateFeedbackNotesSchema = z.object({
  interviewerNotes: z.string().max(4096),
});

export type UpdateFeedbackNotes = z.infer<typeof UpdateFeedbackNotesSchema>;

// Generic prompt message for adapters
export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
