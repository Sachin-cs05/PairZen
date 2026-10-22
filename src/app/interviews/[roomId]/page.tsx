"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Clock,
  Shield,
  ArrowLeft,
  Users,
  Copy,
  Check,
  Play,
  Square,
  XCircle,
  RefreshCw,
  AlertCircle,
  Lock,
  Laptop,
} from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { SafeInterviewRoom, SafeParticipant } from "@/lib/db/models/interview-room";
import { formatDate } from "@/lib/utils";
import { InterviewFeedbackView } from "@/components/interviews/interview-feedback-view";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

function InterviewRoomDetailsContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const [room, setRoom] = useState<SafeInterviewRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invitation link states
  const [invitationUrl, setInvitationUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRotatingToken, setIsRotatingToken] = useState(false);

  // Lifecycle action dialog states
  const [actionType, setActionType] = useState<"start" | "end" | "cancel" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/interviews/${roomId}`);
      return;
    }

    if (isAuthenticated) {
      let isMounted = true;
      fetch(`/api/interviews/${roomId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.room) {
            setRoom(data.room);
            if (typeof window !== "undefined") {
              setInvitationUrl(
                `${window.location.origin}/join?code=${data.room.roomCode}`
              );
            }
          } else {
            setError(data.error || "Failed to load room details.");
          }
        })
        .catch((err: unknown) => {
          console.error("Fetch room error:", err);
          if (isMounted) {
            setError("Network error while connecting to room.");
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [authLoading, isAuthenticated, roomId, router]);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard?.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!invitationUrl) return;
    navigator.clipboard?.writeText(invitationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRotateInvitation = async () => {
    if (!room) return;
    setIsRotatingToken(true);
    try {
      const res = await fetch(`/api/interviews/${room.id}/invitation`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.invitationUrl) {
        setInvitationUrl(data.invitationUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } else {
        alert(data.error || "Failed to rotate invitation token.");
      }
    } catch (err) {
      console.error("Rotate invitation error:", err);
    } finally {
      setIsRotatingToken(false);
    }
  };

  const handleLifecycleAction = async () => {
    if (!room || !actionType) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/interviews/${room.id}/${actionType}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || `Failed to ${actionType} interview.`);
        setActionLoading(false);
        return;
      }

      setRoom(data.room);
      setActionType(null);
    } catch (err) {
      console.error("Lifecycle action error:", err);
      setActionError("A network error occurred while performing this action.");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Loading interview room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100">
        <header className="border-b border-[#1E293B] bg-[#0E1526] h-16 flex items-center px-6">
          <PairzenLogo size="sm" />
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#121A2B] border border-[#1E293B] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Room Unavailable</h1>
            <p className="text-sm text-slate-400">{error || "Could not access room."}</p>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button variant="primary" size="md">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isInterviewer = room.isCreator || room.userRole === "interviewer";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" size="md">Live Session Active</Badge>;
      case "waiting":
        return <Badge variant="warning" size="md">Waiting to Start</Badge>;
      case "completed":
        return <Badge variant="neutral" size="md">Session Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger" size="md">Session Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-[#1E293B] bg-[#0E1526]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1E293B] transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-[#1E293B]" />
            <PairzenLogo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(room.status)}
            <Badge variant="violet" size="sm">
              {room.userRole === "interviewer" ? "Host / Interviewer" : "Candidate"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner: Room Title & Room Code Header */}
        <div className="relative overflow-hidden rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 sm:p-8 space-y-6">
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-violet-400">
                  Room Identifier
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B1020] border border-[#1E293B] text-slate-200 font-mono text-xs hover:border-violet-500 transition-colors"
                  title="Click to copy room code"
                >
                  <span>{room.roomCode}</span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {room.title}
              </h1>

              {room.description && (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {room.description}
                </p>
              )}
            </div>

            {/* Host Lifecycle Controls */}
            {isInterviewer && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {room.status === "waiting" && (
                  <>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setActionType("cancel")}
                      className="text-rose-400 border-rose-900/40 hover:bg-rose-950/20"
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Cancel Interview
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setActionType("start")}
                      className="font-semibold shadow-lg shadow-violet-900/40"
                      leftIcon={<Play className="w-4 h-4" />}
                    >
                      Start Interview
                    </Button>
                  </>
                )}

                {room.status === "active" && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setActionType("end")}
                    className="font-semibold shadow-lg shadow-rose-900/40"
                    leftIcon={<Square className="w-4 h-4" />}
                  >
                    End Interview Session
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Phase 4 Live Collaborative Coding Workspace Launcher */}
        <div className="rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#121A2B] to-[#121A2B] border border-sky-800/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-sky-950/20">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">
                  Live Collaborative Coding Workspace
                </span>
                <Badge variant="success" size="sm">Active (Phase 4)</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Real-time Monaco editor synchronization with Yjs CRDTs, participant awareness, live cursors, and continuous database autosave.
              </p>
            </div>
          </div>

          <Link
            href={`/interviews/${roomId}/workspace`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/40 transition shrink-0"
          >
            <Code2 className="w-4 h-4" />
            <span>Launch Workspace</span>
          </Link>
        </div>

        {/* Room Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#121A2B] border border-[#1E293B] p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-violet-400" />
              Programming Language
            </span>
            <p className="text-base font-bold text-slate-100 capitalize">
              {room.language}
            </p>
          </div>

          <div className="rounded-xl bg-[#121A2B] border border-[#1E293B] p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              Target Difficulty
            </span>
            <p className="text-base font-bold text-slate-100 capitalize">
              {room.difficulty}
            </p>
          </div>

          <div className="rounded-xl bg-[#121A2B] border border-[#1E293B] p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              Duration
            </span>
            <p className="text-base font-bold text-slate-100">
              {room.durationMinutes} minutes
            </p>
          </div>

          <div className="rounded-xl bg-[#121A2B] border border-[#1E293B] p-4 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-violet-400" />
              Access Policy
            </span>
            <p className="text-base font-bold text-slate-100">
              {room.accessPolicy === "invite_only" ? "Invite Only (Private)" : "Discoverable"}
            </p>
          </div>
        </div>

        {/* Two-Column Section: Invitation Management + Authorized Participants */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invitation Management (Column 1) */}
          <div className="lg:col-span-1 rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" />
                Invitation Link
              </h2>
              {isInterviewer && room.status === "waiting" && (
                <button
                  onClick={handleRotateInvitation}
                  disabled={isRotatingToken}
                  className="text-xs text-slate-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                  title="Rotate invitation secret"
                >
                  <RefreshCw className={`w-3 h-3 ${isRotatingToken ? "animate-spin" : ""}`} />
                  <span>Rotate</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Share this secure invitation link with candidates. It encodes a secret token granting candidate permissions.
            </p>

            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-[#0B1020] border border-[#1E293B] flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-300 truncate">
                  {invitationUrl || `https://pairzen.dev/join?code=${room.roomCode}`}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="w-full text-xs font-medium"
                leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedLink ? "Link Copied to Clipboard!" : "Copy Invitation Link"}
              </Button>
            </div>
          </div>

          {/* Authorized Participants (Column 2) */}
          <div className="lg:col-span-2 rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Authorized Participants ({room.participants.length})
              </h2>
              <span className="text-xs text-slate-400">
                Created {formatDate(room.createdAt)}
              </span>
            </div>

            <div className="divide-y divide-[#1E293B]">
              {room.participants.map((participant: SafeParticipant) => (
                <div
                  key={participant.userId}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-semibold text-xs flex items-center justify-center shrink-0">
                      {participant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {participant.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {participant.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Joined {formatDate(participant.joinedAt)}
                    </span>
                    <Badge
                      variant={participant.role === "interviewer" ? "violet" : "neutral"}
                      size="sm"
                    >
                      {participant.role === "interviewer" ? "Host" : "Candidate"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post-Interview AI Evaluation & Feedback Report */}
        <InterviewFeedbackView
          roomId={roomId}
          isInterviewer={isInterviewer}
          roomStatus={room.status}
        />
      </main>

      {/* Lifecycle Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(actionType)}
        onClose={() => setActionType(null)}
        title={
          actionType === "start"
            ? "Start Interview Session?"
            : actionType === "end"
            ? "End Interview Session?"
            : "Cancel Interview Session?"
        }
        description={
          actionType === "start"
            ? "This will transition the room to Active. Candidates will be notified to begin the assessment."
            : actionType === "end"
            ? "This will complete the interview session and lock the room against further edits."
            : "This will cancel the interview session. Cancelled rooms will permanently reject new participants."
        }
        maxWidth="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
              {actionError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E293B]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionType(null)}
              disabled={actionLoading}
            >
              Back
            </Button>
            <Button
              variant={actionType === "start" ? "primary" : "danger"}
              size="sm"
              onClick={handleLifecycleAction}
              isLoading={actionLoading}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function RoomDetailsResolver({ params }: PageProps) {
  const { roomId } = use(params);
  return <InterviewRoomDetailsContent roomId={roomId} />;
}

export default function InterviewRoomDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-slate-300">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RoomDetailsResolver params={params} />
    </Suspense>
  );
}

