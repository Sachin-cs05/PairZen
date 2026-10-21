"use client";

import React, { useState } from "react";
import {
  Search,
  Clock,
  Code2,
  Check,
  Copy,
  AlertCircle,
} from "lucide-react";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabItem } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { InterviewSession } from "@/types/interview";
import { formatDate } from "@/lib/utils";

interface InterviewTableProps {
  interviews: InterviewSession[];
  searchQuery?: string;
}

export function InterviewTable({ interviews, searchQuery = "" }: InterviewTableProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const query = (searchQuery || localSearch).toLowerCase().trim();

  // Tab definitions with counts
  const tabs: TabItem[] = [
    { id: "all", label: "All Sessions", count: interviews.length },
    {
      id: "in_progress",
      label: "Live Now",
      count: interviews.filter((i) => i.status === "in_progress").length,
    },
    {
      id: "scheduled",
      label: "Scheduled",
      count: interviews.filter((i) => i.status === "scheduled").length,
    },
    {
      id: "completed",
      label: "Completed",
      count: interviews.filter((i) => i.status === "completed").length,
    },
  ];

  // Filtering logic
  const filteredInterviews = interviews.filter((session) => {
    // Tab filter
    if (activeTab !== "all" && session.status !== activeTab) {
      return false;
    }

    // Search query filter
    if (query) {
      const matchCandidate = session.candidate.name.toLowerCase().includes(query);
      const matchRole = session.candidate.targetRole.toLowerCase().includes(query);
      const matchRoom = session.roomCode.toLowerCase().includes(query);
      const matchProblem = session.problemTitle.toLowerCase().includes(query);
      const matchTag = session.tags.some((t) => t.toLowerCase().includes(query));
      return matchCandidate || matchRole || matchRoom || matchProblem || matchTag;
    }

    return true;
  });

  const handleCopyRoom = (roomCode: string) => {
    navigator.clipboard?.writeText(roomCode);
    setCopiedId(roomCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id)}
          className="w-full sm:w-auto"
        />

        {/* Local Table Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter table..."
            className="w-full rounded-lg bg-[#0B1020] border border-[#1E293B] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table / Responsive Cards Container */}
      <div className="rounded-xl border border-[#1E293B] bg-[#121A2B] overflow-hidden">
        {filteredInterviews.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="w-6 h-6 text-slate-400" />}
            title="No sessions found"
            description="Try modifying your active filter or search keywords to view matching interview sessions."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("all");
                  setLocalSearch("");
                }}
              >
                Reset Filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0E1524] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Candidate &amp; Role</th>
                  <th className="py-3 px-4">Problem / Focus</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-xs text-slate-300">
                {filteredInterviews.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-[#18233A]/50 transition-colors group"
                  >
                    {/* Candidate */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                          {session.candidate.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {session.candidate.targetRole}
                        </span>
                      </div>
                    </td>

                    {/* Problem */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 truncate">
                          {session.problemTitle}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {session.tags.slice(0, 2).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-[#0B1020] border border-[#1E293B] text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Scheduled Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(session.scheduledAt)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {session.durationMinutes} min session
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={session.status} />
                      {session.score !== undefined && (
                        <div className="mt-1 text-[11px] font-semibold text-emerald-400">
                          Score: {session.score}%
                        </div>
                      )}
                    </td>

                    {/* Language */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <Code2 className="w-3.5 h-3.5 text-sky-400" />
                        <span className="capitalize">{session.primaryLanguage}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyRoom(session.roomCode)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#0B1020] transition-colors"
                          title="Copy Room Code"
                          aria-label="Copy Room Code"
                        >
                          {copiedId === session.roomCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Button
                          variant={session.status === "in_progress" ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                          className="text-xs h-7 px-2.5"
                        >
                          {session.status === "in_progress" ? "Join Live" : "Inspect"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Session Modal */}
      {selectedSession && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedSession(null)}
          title={`Interview Session: ${selectedSession.candidate.name}`}
          description={`Room Code: ${selectedSession.roomCode} • Track: ${selectedSession.candidate.targetRole}`}
        >
          <div className="space-y-4 text-xs">
            {/* Notice */}
            <div className="rounded-lg bg-violet-950/40 border border-violet-800/40 p-3 text-violet-300">
              <span className="font-semibold block mb-0.5">Phase 1 Foundation Preview:</span>
              This session is rendered using typed mock data. In Phase 2, clicking &quot;Join Live&quot; will establish a real-time WebSocket connection to the code collaboration room with Monaco Editor.
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg bg-[#0B1020] p-3 border border-[#1E293B]">
                <span className="text-slate-400 block mb-1">Interviewer</span>
                <span className="font-semibold text-slate-200">
                  {selectedSession.interviewer.name}
                </span>
                <span className="text-slate-400 block text-[11px]">
                  {selectedSession.interviewer.email}
                </span>
              </div>

              <div className="rounded-lg bg-[#0B1020] p-3 border border-[#1E293B]">
                <span className="text-slate-400 block mb-1">Target Language</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {selectedSession.primaryLanguage}
                </span>
                <span className="text-slate-400 block text-[11px]">
                  Sandboxed isolated container
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-[#0B1020] p-3 border border-[#1E293B]">
              <span className="text-slate-400 block mb-1">Assigned Technical Challenge</span>
              <p className="font-medium text-slate-200">{selectedSession.problemTitle}</p>
              <div className="flex gap-1.5 mt-2">
                {selectedSession.tags.map((t, i) => (
                  <Badge key={i} variant="neutral" size="sm">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#1E293B]">
              <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert(
                    `Joining room ${selectedSession.roomCode} is primed for Phase 2 real-time integration.`
                  );
                }}
              >
                Launch Workspace (Phase 2 Preview)
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
