"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Code2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { SafeInterviewRoom } from "@/lib/db/models/interview-room";
import { useCollabRoom } from "@/lib/collab/use-collab-room";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import { CodeEditor } from "@/components/workspace/code-editor";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceBottomPanel } from "@/components/workspace/workspace-bottom-panel";

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

function WorkspaceContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [room, setRoom] = useState<SafeInterviewRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Authenticate user & load room details
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/interviews/${roomId}/workspace`);
      return;
    }

    if (isAuthenticated) {
      let isMounted = true;

      fetch(`/api/interviews/${roomId}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Failed to load room (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setRoom(data.room);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [roomId, isAuthenticated, authLoading, router]);

  // Hook into real-time collaborative workspace engine
  const collab = useCollabRoom({
    roomCode: room?.roomCode || "",
    currentUser: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }
      : undefined,
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#090d16] text-slate-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Code2 className="h-6 w-6" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
          <p className="text-sm font-medium">Entering Pairzen Coding Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#090d16] p-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-rose-900/40 bg-[#0e1526] p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Workspace Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || "Room could not be loaded. Please verify your permissions or session."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isReadOnly =
    room.status === "completed" ||
    room.status === "cancelled" ||
    collab.connectionStatus === "read_only";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090d16] text-slate-100 select-none">
      {/* Top Navigation Toolbar */}
      <WorkspaceToolbar
        roomId={roomId}
        roomCode={room.roomCode}
        title={room.title}
        language={room.language}
        connectionStatus={collab.connectionStatus}
        saveStatus={collab.saveStatus}
        lastSavedAt={collab.lastSavedAt}
        activeParticipants={collab.activeParticipants}
        isReadOnly={isReadOnly}
        onForceSave={collab.forceSave}
      />

      {/* Main Collaborative Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Monaco Editor Container */}
        <div className="flex-1 h-full overflow-hidden relative">
          <CodeEditor
            language={room.language}
            isReadOnly={isReadOnly}
            onMountBinding={collab.bindMonacoEditor}
          />
        </div>

        {/* Right Sidebar */}
        <WorkspaceSidebar
          room={room}
          activeParticipants={collab.activeParticipants}
          currentUserId={user?.id}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Bottom Console / Diagnostics Panel */}
      <WorkspaceBottomPanel
        connectionStatus={collab.connectionStatus}
        saveStatus={collab.saveStatus}
        lastSavedAt={collab.lastSavedAt}
        activeParticipantCount={collab.activeParticipants.length}
        language={room.language}
      />
    </div>
  );
}

function WorkspaceResolver({ params }: WorkspacePageProps) {
  const { roomId } = use(params);
  return <WorkspaceContent roomId={roomId} />;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        </div>
      }
    >
      <WorkspaceResolver params={params} />
    </Suspense>
  );
}
