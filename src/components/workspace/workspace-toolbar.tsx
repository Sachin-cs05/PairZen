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
} from "lucide-react";
import {
  CollabConnectionStatus,
  CollabSaveStatus,
  ActiveParticipantPresence,
} from "@/lib/collab/use-collab-room";

interface WorkspaceToolbarProps {
  roomId: string;
  roomCode: string;
  title: string;
  language: string;
  connectionStatus: CollabConnectionStatus;
  saveStatus: CollabSaveStatus;
  lastSavedAt: string | null;
  activeParticipants: ActiveParticipantPresence[];
  isReadOnly?: boolean;
  onForceSave?: () => void;
}

export function WorkspaceToolbar({
  roomId,
  roomCode,
  title,
  language,
  connectionStatus,
  saveStatus,
  lastSavedAt,
  activeParticipants,
  isReadOnly,
  onForceSave,
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        );
      case "read_only":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 border border-sky-500/20">
            <Lock className="h-3 w-3" />
            Read Only
          </span>
        );
      case "reconnecting":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Reconnecting
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 border border-sky-500/20">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Connecting
          </span>
        );
      case "access_denied":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
            <WifiOff className="h-3 w-3" />
            Access Denied
          </span>
        );
      case "offline":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
            <WifiOff className="h-3 w-3" />
            Offline
          </span>
        );
    }
  };

  const renderSaveBadge = () => {
    if (saveStatus === "saving") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Autosaving...
        </span>
      );
    }
    if (saveStatus === "saved") {
      return (
        <button
          onClick={onForceSave}
          title={lastSavedAt ? `Saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : "Saved to cloud"}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition"
        >
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>Saved</span>
        </button>
      );
    }
    if (saveStatus === "error") {
      return (
        <button
          onClick={onForceSave}
          title="Persistence failed. Click to retry"
          className="inline-flex items-center gap-1 text-xs text-rose-400 hover:underline"
        >
          <CloudOff className="h-3.5 w-3.5" />
          <span>Save failed</span>
        </button>
      );
    }
    return null;
  };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-[#0c121e] px-4 select-none">
      {/* Left: Back Link & Room Info */}
      <div className="flex items-center gap-3">
        <Link
          href={`/interviews/${roomId}`}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Details</span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 max-w-[240px] md:max-w-md truncate">
              {title || "Pairzen Workspace"}
            </h1>
          </div>
        </div>

        {/* Room Code Badge */}
        <button
          onClick={handleCopyCode}
          className="hidden sm:inline-flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-0.5 text-xs font-mono text-slate-300 hover:bg-slate-700/80 transition"
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

      {/* Center: Language & Sync Status */}
      <div className="hidden md:flex items-center gap-3">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold border border-slate-700">
          {language}
        </span>
        {isReadOnly && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Read-Only</span>
          </span>
        )}
        {renderSaveBadge()}
        {renderConnectionBadge()}
      </div>

      {/* Right: Active Participants Avatars */}
      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-2 overflow-hidden">
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
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-1 ring-[#0c121e]"
                />
              )}
            </div>
          ))}
        </div>

        <div className="md:hidden">{renderConnectionBadge()}</div>
      </div>
    </header>
  );
}
