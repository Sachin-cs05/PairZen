import { DashboardStats, InterviewSession, UserNotification } from "@/types/interview";

/**
 * Mock data for Pairzen Phase 1 Foundation.
 * In Phase 2+, these will be loaded asynchronously via Node.js API and MongoDB endpoints.
 */

export const MOCK_CURRENT_USER = {
  id: "usr_alex_vance",
  name: "Alex Vance",
  email: "alex.vance@techcorp.io",
  role: "Lead Staff Engineer",
  company: "Apex Systems",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
};

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalInterviews: {
    value: 48,
    changePercentage: 14.2,
    trend: "up",
  },
  completedSessions: {
    value: 39,
    completionRatePercentage: 92.8,
    trend: "up",
  },
  upcomingInterviews: {
    value: 3,
    nextInMinutes: 45,
    trend: "neutral",
  },
  averageDuration: {
    valueMinutes: 52,
    targetMinutes: 60,
    trend: "neutral",
  },
};

export const MOCK_INTERVIEWS: InterviewSession[] = [
  {
    id: "int_01",
    title: "Senior Full-Stack Engineer Technical Screen",
    roomCode: "pz-9482-arch",
    candidate: {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      targetRole: "Senior Full-Stack Engineer",
      seniority: "senior",
    },
    interviewer: {
      name: "Alex Vance",
      email: "alex.vance@techcorp.io",
    },
    scheduledAt: "2026-10-22T10:00:00Z",
    durationMinutes: 60,
    status: "in_progress",
    primaryLanguage: "typescript",
    problemTitle: "Design a High-Throughput Realtime Event Cache",
    tags: ["Distributed Systems", "TypeScript", "Concurrency"],
  },
  {
    id: "int_02",
    title: "Staff Backend Infrastructure Round",
    roomCode: "pz-2194-node",
    candidate: {
      name: "Marcus Brody",
      email: "m.brody@devmail.org",
      targetRole: "Staff Distributed Systems Engineer",
      seniority: "staff",
    },
    interviewer: {
      name: "Alex Vance",
      email: "alex.vance@techcorp.io",
    },
    scheduledAt: "2026-10-22T14:30:00Z",
    durationMinutes: 60,
    status: "scheduled",
    primaryLanguage: "go",
    problemTitle: "Distributed Rate Limiter with Sliding Window",
    tags: ["Algorithms", "Go", "Rate Limiting"],
  },
  {
    id: "int_03",
    title: "Frontend Core Performance & Architecture",
    roomCode: "pz-7831-core",
    candidate: {
      name: "Elena Rostova",
      email: "elena.r@frontendlab.io",
      targetRole: "Senior Frontend Engineer",
      seniority: "senior",
    },
    interviewer: {
      name: "Liam O'Connor",
      email: "liam.oc@techcorp.io",
    },
    scheduledAt: "2026-10-23T09:00:00Z",
    durationMinutes: 45,
    status: "scheduled",
    primaryLanguage: "typescript",
    problemTitle: "Virtual DOM Reconciler & Diffing Algorithm",
    tags: ["React", "DOM", "Performance"],
  },
  {
    id: "int_04",
    title: "Platform Infrastructure & Cloud Scalability",
    roomCode: "pz-5510-scal",
    candidate: {
      name: "Devon Miller",
      email: "devon.m@cloudinfra.net",
      targetRole: "DevOps / SRE Architect",
      seniority: "staff",
    },
    interviewer: {
      name: "Alex Vance",
      email: "alex.vance@techcorp.io",
    },
    scheduledAt: "2026-10-21T16:00:00Z",
    durationMinutes: 60,
    status: "completed",
    primaryLanguage: "python",
    problemTitle: "Log Stream Aggregator with Backpressure",
    score: 94,
    notesCount: 6,
    tags: ["Systems", "Python", "Backpressure"],
  },
  {
    id: "int_05",
    title: "Full-Stack Security & API Gateway",
    roomCode: "pz-3301-gate",
    candidate: {
      name: "Priya Sharma",
      email: "priya.s@infosec.tech",
      targetRole: "Security Engineer",
      seniority: "senior",
    },
    interviewer: {
      name: "Sarah Lin",
      email: "s.lin@techcorp.io",
    },
    scheduledAt: "2026-10-20T11:00:00Z",
    durationMinutes: 45,
    status: "completed",
    primaryLanguage: "typescript",
    problemTitle: "Zero-Trust JWT Verification & Token Rotation",
    score: 88,
    notesCount: 4,
    tags: ["Security", "JWT", "TypeScript"],
  },
  {
    id: "int_06",
    title: "Core Data Engineering Pipeline",
    roomCode: "pz-1190-pipe",
    candidate: {
      name: "David Kim",
      email: "david.kim@datascience.io",
      targetRole: "Senior Data Platform Engineer",
      seniority: "senior",
    },
    interviewer: {
      name: "Alex Vance",
      email: "alex.vance@techcorp.io",
    },
    scheduledAt: "2026-10-19T13:30:00Z",
    durationMinutes: 60,
    status: "completed",
    primaryLanguage: "python",
    problemTitle: "Streaming Deduplication across Sharded Partitions",
    score: 91,
    notesCount: 5,
    tags: ["Data Pipelines", "Python", "Sharding"],
  },
  {
    id: "int_07",
    title: "Junior Software Engineer Generalist Screen",
    roomCode: "pz-8812-gen",
    candidate: {
      name: "Lucas Meyer",
      email: "lucas.m@alumni.edu",
      targetRole: "Junior Full-Stack Developer",
      seniority: "junior",
    },
    interviewer: {
      name: "Liam O'Connor",
      email: "liam.oc@techcorp.io",
    },
    scheduledAt: "2026-10-18T15:00:00Z",
    durationMinutes: 45,
    status: "cancelled",
    primaryLanguage: "javascript",
    problemTitle: "LRU Cache Implementation with Doubly Linked List",
    tags: ["Data Structures", "JavaScript"],
  },
];

export const MOCK_NOTIFICATIONS: UserNotification[] = [
  {
    id: "notif_01",
    title: "Interview Ready",
    message: "Candidate Sarah Chen has entered room pz-9482-arch.",
    timeAgo: "2m ago",
    type: "interview_starting",
    read: false,
  },
  {
    id: "notif_02",
    title: "Feedback Submitted",
    message: "Liam O'Connor added evaluation notes for Devon Miller.",
    timeAgo: "1h ago",
    type: "feedback_ready",
    read: false,
  },
  {
    id: "notif_03",
    title: "Upcoming Session",
    message: "Marcus Brody interview scheduled at 2:30 PM today.",
    timeAgo: "3h ago",
    type: "interview_starting",
    read: true,
  },
  {
    id: "notif_04",
    title: "Pairzen Engine v1.0",
    message: "Welcome to Pairzen Phase 1. Real-time editor engine is primed.",
    timeAgo: "1d ago",
    type: "system",
    read: true,
  },
];
