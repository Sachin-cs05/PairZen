"use client";

import { useState } from "react";
import { Terminal, Activity, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { CollabConnectionStatus, CollabSaveStatus } from "@/lib/collab/use-collab-room";

interface WorkspaceBottomPanelProps {
  connectionStatus: CollabConnectionStatus;
  saveStatus: CollabSaveStatus;
  lastSavedAt: string | null;
  activeParticipantCount: number;
  language: string;
}

export function WorkspaceBottomPanel({
  connectionStatus,
  saveStatus,
  lastSavedAt,
  activeParticipantCount,
  language,
}: WorkspaceBottomPanelProps) {
  const [activeTab, setActiveTab] = useState<"console" | "diagnostics">("console");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`border-t border-slate-800 bg-[#0c121e] transition-all duration-200 select-none ${
        isCollapsed ? "h-9" : "h-44"
      }`}
    >
      {/* Tab Navigation Header */}
      <div className="flex h-9 items-center justify-between border-b border-slate-800/80 px-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab("console");
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "console" && !isCollapsed
                ? "border-b-2 border-sky-400 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Console & Output</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("diagnostics");
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "diagnostics" && !isCollapsed
                ? "border-b-2 border-sky-400 text-sky-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Sync Diagnostics</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-400 hover:text-slate-200 transition"
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Tab Body */}
      {!isCollapsed && (
        <div className="h-[calc(100%-2.25rem)] overflow-y-auto p-3 font-mono text-xs">
          {activeTab === "console" ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-amber-300">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-400 shrink-0" />
                <div className="text-[12px] leading-relaxed">
                  <span className="font-semibold text-amber-200">Execution Offline: </span>
                  Code execution and sandboxed runner are scheduled for Phase 5.
                  The current workspace is fully equipped for real-time collaborative editing, CRDT convergence, and continuous state persistence.
                </div>
              </div>

              <div className="text-slate-400 select-text">
                <span className="text-emerald-400 font-semibold">[pairzen]</span> Ready. Collaborative room initialized for {language.toUpperCase()}.
                <br />
                <span className="text-slate-500">Edit code in the Monaco workspace above. All keystrokes, remote cursors, and selections are shared across participants without browser refresh.</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">CRDT Sync Engine</span>
                <span className="text-slate-200 font-semibold mt-1 inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Yjs Document Model
                </span>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">Transport Protocol</span>
                <span className="text-slate-200 font-semibold mt-1 block capitalize">
                  Socket.IO ({connectionStatus})
                </span>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">Active Room Peers</span>
                <span className="text-slate-200 font-semibold mt-1 block">
                  {activeParticipantCount} connected
                </span>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/50 p-2.5">
                <span className="text-slate-500 block text-[11px]">Durable Cloud Save</span>
                <span className="text-slate-200 font-semibold mt-1 block truncate">
                  {saveStatus === "saved" && lastSavedAt
                    ? new Date(lastSavedAt).toLocaleTimeString()
                    : saveStatus}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
