"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Code2,
  Check,
  Copy,
  ChevronLeft,
  WifiOff,
  RefreshCw,
  CloudOff,
  Lock,
  Play,
  CheckCircle2,
  Send,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  CollabConnectionStatus,
  CollabSaveStatus,
  ActiveParticipantPresence,
} from "@/lib/collab/use-collab-room";
import { LANGUAGE_LIST, SupportedLanguage } from "@/lib/execution/languages";

export type WorkspaceExecutionBadgeStatus =
  | "idle"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "service_unavailable";

interface WorkspaceToolbarProps {
  roomId: string;
  roomCode: string;
  title: string;
  language: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  connectionStatus: CollabConnectionStatus;
  saveStatus: CollabSaveStatus;
  lastSavedAt: string | null;
  activeParticipants: ActiveParticipantPresence[];
  isReadOnly?: boolean;
  onForceSave?: () => void;
  // Execution Actions & States
  onRunCode?: () => void;
  isExecuting?: boolean;
  onRunTests?: () => void;
  isTesting?: boolean;
  onSubmitSolution?: () => void;
  isSubmitting?: boolean;
  executionBadgeStatus?: WorkspaceExecutionBadgeStatus;
}

export function WorkspaceToolbar({
  roomId,
  roomCode,
  title,
  language,
  onLanguageChange,
  connectionStatus,
  saveStatus,
  lastSavedAt,
  activeParticipants,
  isReadOnly,
  onForceSave,
  onRunCode,
  isExecuting,
  onRunTests,
  isTesting,
  onSubmitSolution,
  isSubmitting,
  executionBadgeStatus = "idle",
}: WorkspaceToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy room code", e);
    }
  };

  const renderConnectionBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        );
      case "read_only":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 border border-sky-500/20">
            <Lock className="h-3 w-3" />
            Read Only
          </span>
        );
      case "reconnecting":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Reconnecting
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 border border-sky-500/20">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Connecting
          </span>
        );
      case "access_denied":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
            <WifiOff className="h-3 w-3" />
            Access Denied
          </span>
        );
      case "offline":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
            <WifiOff className="h-3 w-3" />
            Offline
          </span>
        );
    }
  };

  const renderSaveBadge = () => {
    if (saveStatus === "saving") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Saving...
        </span>
      );
    }
    if (saveStatus === "saved") {
      return (
        <button
          onClick={onForceSave}
          title={lastSavedAt ? `Saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : "Saved to cloud"}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition"
        >
          <Check className="h-3 w-3 text-emerald-400" />
          <span>Saved</span>
        </button>
      );
    }
    if (saveStatus === "error") {
      return (
        <button
          onClick={onForceSave}
          title="Persistence failed. Click to retry"
          className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:underline"
        >
          <CloudOff className="h-3 w-3" />
          <span>Save failed</span>
        </button>
      );
    }
    return null;
  };

  const renderExecutionBadge = () => {
    if (executionBadgeStatus === "idle") return null;

    if (executionBadgeStatus === "running") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400 border border-sky-500/20">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running...
        </span>
      );
    }

    if (executionBadgeStatus === "accepted") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Accepted
        </span>
      );
    }

    if (executionBadgeStatus === "wrong_answer") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
          <XCircle className="h-3 w-3" />
          Wrong Answer
        </span>
      );
    }

    if (executionBadgeStatus === "compilation_error") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
          <AlertTriangle className="h-3 w-3" />
          Compile Error
        </span>
      );
    }

    if (executionBadgeStatus === "time_limit_exceeded") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          Time Limit Exceeded
        </span>
      );
    }

    if (executionBadgeStatus === "runtime_error") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
          <AlertTriangle className="h-3 w-3" />
          Runtime Error
        </span>
      );
    }

    return null;
  };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-[#0c121e] px-3 select-none gap-2">
      {/* Left: Back Link & Room Info */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href={`/interviews/${roomId}`}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Details</span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 max-w-[140px] sm:max-w-[200px] md:max-w-xs truncate">
              {title || "Pairzen Workspace"}
            </h1>
          </div>
        </div>

        {/* Room Code Badge */}
        <button
          onClick={handleCopyCode}
          className="hidden lg:inline-flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-0.5 text-xs font-mono text-slate-300 hover:bg-slate-700/80 transition"
          title="Click to copy room code"
        >
          <span>{roomCode}</span>
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3 text-slate-400" />
          )}
        </button>
      </div>

      {/* Center: Language Selector, Run & Submit Controls */}
      <div className="flex items-center gap-2">
        {/* Language Selector Dropdown */}
        <div className="relative">
          <select
            value={language}
            disabled={isReadOnly || isExecuting || isTesting || isSubmitting}
            onChange={(e) => onLanguageChange?.(e.target.value as SupportedLanguage)}
            className="rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-sky-300 hover:border-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {LANGUAGE_LIST.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Run Code Button */}
        <button
          onClick={onRunCode}
          disabled={isReadOnly || isExecuting || isTesting || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          title="Execute current source code with optional standard input"
        >
          {isExecuting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
          ) : (
            <Play className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20" />
          )}
          <span className="hidden sm:inline">Run Code</span>
        </button>

        {/* Run Tests Button */}
        <button
          onClick={onRunTests}
          disabled={isReadOnly || isExecuting || isTesting || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          title="Evaluate solution against authoritative test cases"
        >
          {isTesting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
          <span className="hidden sm:inline">Run Tests</span>
        </button>

        {/* Submit Solution Button */}
        <button
          onClick={onSubmitSolution}
          disabled={isReadOnly || isExecuting || isTesting || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          title="Submit solution for authoritative interview evaluation"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
          ) : (
            <Send className="h-3.5 w-3.5 text-white" />
          )}
          <span>Submit</span>
        </button>

        {/* Status Badge */}
        <div className="hidden xl:flex items-center">{renderExecutionBadge()}</div>
      </div>

      {/* Right: Sync Status & Active Participants */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden md:flex items-center gap-2">
          {renderSaveBadge()}
          {renderConnectionBadge()}
        </div>

        {/* Active Participants Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {activeParticipants.map((p) => (
            <div
              key={p.socketId}
              title={`${p.name} (${p.role})`}
              className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow ring-2 ring-[#0c121e]"
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
              {p.role === "interviewer" && (
                <span
                  title="Interviewer"
                  className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 ring-1 ring-[#0c121e]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
