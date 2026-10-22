"use client";

import { useState } from "react";
import {
  Users,
  Info,
  Shield,
  Clock,
  Award,
  Lock,
  Globe,
  BookOpen,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { ActiveParticipantPresence } from "@/lib/collab/use-collab-room";
import { SafeInterviewRoom } from "@/lib/db/models/interview-room";
import { SafeProblem } from "@/lib/db/models/problem";
import { SafeSubmission } from "@/lib/db/models/submission";

interface WorkspaceSidebarProps {
  room: SafeInterviewRoom;
  problem: SafeProblem | null;
  submissions: SafeSubmission[];
  activeParticipants: ActiveParticipantPresence[];
  currentUserId?: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSubmission?: (sub: SafeSubmission) => void;
}

export function WorkspaceSidebar({
  room,
  problem,
  submissions,
  activeParticipants,
  currentUserId,
  isOpen,
  onToggle,
  onSelectSubmission,
}: WorkspaceSidebarProps) {
  const [activeTab, setActiveTab] = useState<"problem" | "participants" | "submissions">("problem");

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-3 top-16 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#0c121e] text-slate-400 hover:text-slate-100 shadow transition"
        title="Open workspace side panel"
      >
        <BookOpen className="h-4 w-4" />
      </button>
    );
  }

  const renderDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case "easy":
        return (
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
            Easy
          </span>
        );
      case "hard":
        return (
          <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-400 border border-rose-500/20">
            Hard
          </span>
        );
      case "medium":
      default:
        return (
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
    }
  };

  const renderSubmissionStatus = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Accepted
          </span>
        );
      case "wrong_answer":
        return (
          <span className="flex items-center gap-1 text-rose-400 font-semibold">
            <XCircle className="h-3 w-3" /> Wrong Answer
          </span>
        );
      case "time_limit_exceeded":
        return (
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Clock className="h-3 w-3" /> TLE
          </span>
        );
      case "compilation_error":
        return (
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <AlertTriangle className="h-3 w-3" /> Compile Err
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-rose-400 font-semibold capitalize">
            {status.replace("_", " ")}
          </span>
        );
    }
  };

  return (
    <aside className="flex h-full w-80 sm:w-96 flex-col border-l border-slate-800 bg-[#0c121e] select-none">
      {/* Top Tabs */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 px-3">
        <div className="flex items-center gap-1">
          {/* Problem Tab */}
          <button
            onClick={() => setActiveTab("problem")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition rounded ${
              activeTab === "problem"
                ? "bg-slate-800/90 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Problem</span>
          </button>

          {/* Participants Tab */}
          <button
            onClick={() => setActiveTab("participants")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition rounded ${
              activeTab === "participants"
                ? "bg-slate-800/90 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Peers ({activeParticipants.length})</span>
          </button>

          {/* Submissions Tab */}
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition rounded ${
              activeTab === "submissions"
                ? "bg-slate-800/90 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submissions ({submissions.length})</span>
          </button>
        </div>

        <button
          onClick={onToggle}
          className="text-xs text-slate-400 hover:text-slate-200 p-1"
          title="Collapse panel"
        >
          ✕
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: PROBLEM DESCRIPTION */}
        {activeTab === "problem" && (
          <div className="space-y-4 select-text">
            {problem ? (
              <>
                {/* Title and Difficulty */}
                <div className="space-y-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-100">{problem.title}</h2>
                    {renderDifficultyBadge(problem.difficulty)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Total Test Cases: {problem.totalTestCases} ({problem.sampleCases.length} visible sample cases)
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </h3>
                  <div className="whitespace-pre-line text-slate-300 font-sans">
                    {problem.description}
                  </div>
                </div>

                {/* Sample Cases */}
                {problem.sampleCases && problem.sampleCases.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sample Examples
                    </h3>
                    {problem.sampleCases.map((sc, idx) => (
                      <div
                        key={sc.id || idx}
                        className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1.5 font-mono text-xs"
                      >
                        <div className="font-semibold text-sky-400 text-[11px]">
                          Example {idx + 1}:
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans">Input: </span>
                          <span className="text-slate-200">{sc.input}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-sans">Output: </span>
                          <span className="text-emerald-400">{sc.expectedOutput}</span>
                        </div>
                        {sc.explanation && (
                          <div className="text-slate-400 font-sans text-[11px] pt-0.5">
                            <span className="font-semibold text-slate-400">Explanation: </span>
                            {sc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Constraints
                    </h3>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                Loading problem details...
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PARTICIPANTS & ROOM SPEC */}
        {activeTab === "participants" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Participants ({activeParticipants.length})
              </div>

              {activeParticipants.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Connecting to session...</p>
              ) : (
                activeParticipants.map((p) => {
                  const isMe = p.userId === currentUserId;
                  return (
                    <div
                      key={p.socketId}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 transition hover:border-slate-700"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              p.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-[#0c121e]" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-medium text-slate-200">
                              {p.name}
                            </p>
                            {isMe && (
                              <span className="rounded bg-sky-500/10 px-1 py-0.2 text-[10px] text-sky-400 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-slate-500 capitalize">{p.role}</p>
                        </div>
                      </div>

                      <div
                        className="h-2 w-2 rounded-full shadow-sm"
                        style={{ backgroundColor: p.color }}
                        title="Cursor color"
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Room Specifications */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Info className="h-3 w-3 text-slate-400" />
                <span>Room Specifications</span>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/30 p-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    Difficulty
                  </span>
                  <span className="capitalize font-medium text-slate-200">{room.difficulty}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    Duration
                  </span>
                  <span className="font-medium text-slate-200">{room.durationMinutes} mins</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    {room.accessPolicy === "invite_only" ? (
                      <Lock className="h-3.5 w-3.5 text-indigo-400" />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    Policy
                  </span>
                  <span className="capitalize font-medium text-slate-200">
                    {room.accessPolicy.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    Status
                  </span>
                  <span className="capitalize font-medium text-slate-200">{room.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUBMISSIONS HISTORY */}
        {activeTab === "submissions" && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Evaluated Submissions ({submissions.length})
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No solutions submitted yet. Click <span className="text-violet-400 font-semibold">Submit</span> in the toolbar to submit and evaluate your code.
              </div>
            ) : (
              submissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  onClick={() => onSelectSubmission?.(sub)}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs space-y-2 hover:border-slate-700 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    {renderSubmissionStatus(sub.status)}
                    <span className="text-[11px] text-slate-500">
                      {new Date(sub.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-mono uppercase text-sky-400">{sub.language}</span>
                    <span className="font-semibold text-slate-300">
                      Passed: {sub.passedTests} / {sub.totalTests}
                    </span>
                  </div>

                  {typeof sub.runtimeMs === "number" && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>Runtime: {sub.runtimeMs}ms</span>
                      {typeof sub.memoryKb === "number" && (
                        <span>Memory: {(sub.memoryKb / 1024).toFixed(1)}MB</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
