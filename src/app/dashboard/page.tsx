"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogIn } from "lucide-react";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { InterviewTable } from "@/components/dashboard/interview-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CreateInterviewModal } from "@/components/dashboard/create-interview-modal";
import { JoinInterviewModal } from "@/components/dashboard/join-interview-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { MOCK_DASHBOARD_STATS, MOCK_INTERVIEWS } from "@/lib/mock-data";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [interviews, setInterviews] = useState(MOCK_INTERVIEWS);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-300">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-medium">Validating Pairzen session...</p>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

  const displayName = user?.name || "Developer";
  const displayRoleBadge =
    user?.role === "admin"
      ? "Administrator"
      : user?.role === "interviewer"
      ? "Technical Interviewer"
      : "Candidate Track";

  const handleRoomCreated = (roomCode: string) => {
    // Proactively show newly created room in mock table
    const newSession = {
      id: `int_${Date.now()}`,
      title: "Custom Technical Screen Session",
      roomCode: roomCode,
      candidate: {
        name: "New Candidate",
        email: "candidate@example.com",
        targetRole: "Full-Stack Engineer",
        seniority: "senior" as const,
      },
      interviewer: {
        name: displayName,
        email: user?.email || "interviewer@pairzen.io",
      },
      scheduledAt: new Date().toISOString(),
      durationMinutes: 60,
      status: "scheduled" as const,
      primaryLanguage: "typescript" as const,
      problemTitle: "Dynamic Programming & Array Optimization",
      tags: ["TypeScript", "Live Session"],
    };
    setInterviews([newSession, ...interviews]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome & Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 sm:p-8">
        {/* Ambient background glow */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="violet" size="sm">
                {displayRoleBadge}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {user?.email || "Pairzen Cloud Workspace"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {displayName}
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              You have <span className="text-violet-300 font-semibold">2 interviews</span> scheduled today. Your engineering track has completed 39 sessions with an average 92.8% positive evaluation index.
            </p>
          </div>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => setJoinModalOpen(true)}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Join Interview
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateModalOpen(true)}
              className="font-semibold shadow-lg shadow-violet-900/30"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Interview
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Statistics Cards */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Platform Statistics
        </h2>
        <StatsGrid stats={MOCK_DASHBOARD_STATS} />
      </section>

      {/* Quick Actions Panel */}
      <section className="space-y-3" aria-labelledby="quick-actions-heading">
        <div className="flex items-center justify-between">
          <h3 id="quick-actions-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions &amp; Workflows
          </h3>
          <span className="text-xs text-slate-400">
            Phase 2 Authenticated
          </span>
        </div>
        <QuickActions
          onCreateInterview={() => setCreateModalOpen(true)}
        />
      </section>

      {/* Recent Interviews Table Section */}
      <section id="interviews" className="space-y-3" aria-labelledby="recent-sessions-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 id="recent-sessions-heading" className="text-base font-bold text-slate-100">
              Recent Interview Sessions
            </h3>
            <p className="text-xs text-slate-400">
              Live, upcoming, and archived collaborative coding assessments.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Showing {interviews.length} sessions
          </div>
        </div>

        <InterviewTable interviews={interviews} />
      </section>

      {/* Modal Dialogs */}
      <CreateInterviewModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleRoomCreated}
      />
      <JoinInterviewModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  );
}
