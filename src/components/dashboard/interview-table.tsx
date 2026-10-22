"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  Code2,
  Check,
  Copy,
  AlertCircle,
  ArrowRight,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabItem } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { SafeInterviewRoom } from "@/lib/db/models/interview-room";

export interface UnifiedInterviewItem {
  id: string;
  title: string;
  roomCode: string;
  language: string;
  durationMinutes: number;
  status: "waiting" | "active" | "completed" | "cancelled" | "scheduled" | "in_progress";
  accessPolicy?: string;
  difficulty?: string;
  participantCount?: number;
  candidateName?: string;
  candidateRole?: string;
  createdAt?: string;
  scheduledAt?: string;
}

interface InterviewTableProps {
  rooms: SafeInterviewRoom[];
  searchQuery?: string;
  onRefresh?: () => void;
}

export function InterviewTable({
  rooms,
  searchQuery = "",
  onRefresh,
}: InterviewTableProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const query = (searchQuery || localSearch).toLowerCase().trim();

  // Normalize room statuses
  const normalizedRooms: UnifiedInterviewItem[] = rooms.map((r) => ({
    id: r.id,
    title: r.title,
    roomCode: r.roomCode,
    language: r.language,
    durationMinutes: r.durationMinutes,
    status: r.status,
    accessPolicy: r.accessPolicy,
    difficulty: r.difficulty,
    participantCount: r.participantCount || r.participants?.length || 1,
    candidateName: r.participants?.find((p) => p.role === "candidate")?.name,
    candidateRole: r.difficulty,
    createdAt: r.createdAt,
    scheduledAt: r.scheduledAt || r.createdAt,
  }));

  // Tab definitions with counts
  const tabs: TabItem[] = [
    { id: "all", label: "All Sessions", count: normalizedRooms.length },
    {
      id: "active",
      label: "Live Now",
      count: normalizedRooms.filter((i) => i.status === "active" || i.status === "in_progress").length,
    },
    {
      id: "waiting",
      label: "Waiting / Upcoming",
      count: normalizedRooms.filter((i) => i.status === "waiting" || i.status === "scheduled").length,
    },
    {
      id: "completed",
      label: "Completed",
      count: normalizedRooms.filter((i) => i.status === "completed").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: normalizedRooms.filter((i) => i.status === "cancelled").length,
    },
  ];

  // Filtering logic
  const filteredRooms = normalizedRooms.filter((session) => {
    // Tab filter
    if (activeTab === "active" && session.status !== "active" && session.status !== "in_progress") {
      return false;
    }
    if (activeTab === "waiting" && session.status !== "waiting" && session.status !== "scheduled") {
      return false;
    }
    if (activeTab === "completed" && session.status !== "completed") {
      return false;
    }
    if (activeTab === "cancelled" && session.status !== "cancelled") {
      return false;
    }

    // Search query filter
    if (query) {
      const matchTitle = session.title.toLowerCase().includes(query);
      const matchRoom = session.roomCode.toLowerCase().includes(query);
      const matchLang = session.language.toLowerCase().includes(query);
      const matchCandidate = session.candidateName?.toLowerCase().includes(query) || false;
      return matchTitle || matchRoom || matchLang || matchCandidate;
    }

    return true;
  });

  const handleCopyRoom = (roomCode: string) => {
    navigator.clipboard?.writeText(roomCode);
    setCopiedId(roomCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "in_progress":
        return <Badge variant="success" size="sm">Active Live</Badge>;
      case "waiting":
      case "scheduled":
        return <Badge variant="warning" size="sm">Waiting</Badge>;
      case "completed":
        return <Badge variant="neutral" size="sm">Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
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
            placeholder="Filter sessions..."
            className="w-full rounded-lg bg-[#0B1020] border border-[#1E293B] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-[#1E293B] bg-[#121A2B] overflow-hidden">
        {filteredRooms.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="w-6 h-6 text-slate-400" />}
            title="No interview sessions found"
            description="You don't have any sessions in this category yet. Create a new interview or join with a room code."
            action={
              <div className="flex items-center gap-2">
                <Link href="/interviews/new">
                  <Button variant="primary" size="sm">
                    Create Interview
                  </Button>
                </Link>
                {(activeTab !== "all" || localSearch) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab("all");
                      setLocalSearch("");
                      onRefresh?.();
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0E1524] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Session Title &amp; Code</th>
                  <th className="py-3 px-4">Technical Track</th>
                  <th className="py-3 px-4">Duration &amp; Access</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-xs text-slate-300">
                {filteredRooms.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-[#18233A]/50 transition-colors group"
                  >
                    {/* Session Title & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <Link
                          href={`/interviews/${session.id}`}
                          className="font-semibold text-slate-100 group-hover:text-violet-300 transition-colors"
                        >
                          {session.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] text-slate-400">
                            {session.roomCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRoom(session.roomCode)}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                            title="Copy Room Code"
                            aria-label="Copy Room Code"
                          >
                            {copiedId === session.roomCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Technical Track & Language */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                        <Code2 className="w-3.5 h-3.5 text-sky-400" />
                        <span className="capitalize">{session.language}</span>
                      </div>
                      {session.difficulty && (
                        <span className="text-[10px] text-slate-400 capitalize block mt-0.5">
                          {session.difficulty} difficulty
                        </span>
                      )}
                    </td>

                    {/* Duration & Access Policy */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{session.durationMinutes} mins</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {session.accessPolicy === "discoverable"
                          ? "Discoverable"
                          : "Invite Only"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                      {session.scheduledAt && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDate(session.scheduledAt)}
                        </div>
                      )}
                    </td>

                    {/* Participants */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-violet-400" />
                        <span>{session.participantCount || 1} participant{(session.participantCount || 1) > 1 ? "s" : ""}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link href={`/interviews/${session.id}`}>
                        <Button
                          variant={session.status === "active" ? "primary" : "outline"}
                          size="sm"
                          className="text-xs h-7 px-2.5"
                          rightIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          {session.status === "active" ? "Enter Live" : "Manage"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
