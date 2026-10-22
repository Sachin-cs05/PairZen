"use client";

import { Users, Info, Shield, Clock, Award, Lock, Globe } from "lucide-react";
import { ActiveParticipantPresence } from "@/lib/collab/use-collab-room";
import { SafeInterviewRoom } from "@/lib/db/models/interview-room";

interface WorkspaceSidebarProps {
  room: SafeInterviewRoom;
  activeParticipants: ActiveParticipantPresence[];
  currentUserId?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function WorkspaceSidebar({
  room,
  activeParticipants,
  currentUserId,
  isOpen,
  onToggle,
}: WorkspaceSidebarProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-3 top-16 z-30 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#0c121e] text-slate-400 hover:text-slate-100 shadow transition"
        title="Open workspace side panel"
      >
        <Users className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="flex h-full w-72 flex-col border-l border-slate-800 bg-[#0c121e] select-none">
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Users className="h-3.5 w-3.5 text-sky-400" />
          <span>Participants ({activeParticipants.length})</span>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-slate-400 hover:text-slate-200"
          title="Collapse panel"
        >
          ✕
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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

        {/* Room Info Section */}
        <div className="pt-4 border-t border-slate-800/80 mt-4">
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
    </aside>
  );
}
