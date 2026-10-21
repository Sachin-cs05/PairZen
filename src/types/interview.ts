export type InterviewStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type CodingLanguage = "typescript" | "javascript" | "python" | "go" | "rust" | "java" | "cpp";

export type SeniorityLevel = "intern" | "junior" | "mid" | "senior" | "staff" | "principal";

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: "interviewer" | "candidate" | "observer";
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface InterviewSession {
  id: string;
  title: string;
  roomCode: string;
  candidate: {
    name: string;
    email: string;
    avatarUrl?: string;
    targetRole: string;
    seniority: SeniorityLevel;
  };
  interviewer: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  scheduledAt: string;
  durationMinutes: number;
  status: InterviewStatus;
  primaryLanguage: CodingLanguage;
  problemTitle: string;
  score?: number; // 0 - 100
  notesCount?: number;
  tags: string[];
}

export interface DashboardStats {
  totalInterviews: {
    value: number;
    changePercentage: number;
    trend: "up" | "down" | "neutral";
  };
  completedSessions: {
    value: number;
    completionRatePercentage: number;
    trend: "up" | "down" | "neutral";
  };
  upcomingInterviews: {
    value: number;
    nextInMinutes: number;
    trend: "neutral";
  };
  averageDuration: {
    valueMinutes: number;
    targetMinutes: number;
    trend: "up" | "down" | "neutral";
  };
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: "interview_starting" | "session_completed" | "feedback_ready" | "system";
  read: boolean;
}
