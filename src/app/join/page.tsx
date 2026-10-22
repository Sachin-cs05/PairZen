"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LogIn,
  Shield,
  ArrowLeft,
  AlertCircle,
  Lock,
} from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const tokenParam = searchParams.get("token") || "";
  const codeParam = searchParams.get("code") || "";

  const [roomCode, setRoomCode] = useState(codeParam);
  const [invitationToken, setInvitationToken] = useState(tokenParam);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresInvitation, setRequiresInvitation] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const fullPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(fullPath)}`);
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Validating Pairzen session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setRequiresInvitation(false);

    const cleanCode = roomCode.trim().toLowerCase();
    if (!cleanCode) {
      setError("Please provide a valid room code (e.g. pz-1234-abcd).");
      return;
    }

    setIsJoining(true);

    try {
      const res = await fetch("/api/interviews/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: cleanCode,
          invitationToken: invitationToken.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsJoining(false);
        setError(data.error || "Unable to join interview room.");
        if (data.requiresInvitation) {
          setRequiresInvitation(true);
        }
        return;
      }

      // Successfully joined or already enrolled: navigate to room details
      router.push(`/interviews/${data.room.id}`);
    } catch (err: unknown) {
      console.error("Join error:", err);
      setIsJoining(false);
      setError("A connection error occurred. Please try again.");
    }
  };

  const hasInvitationInUrl = Boolean(tokenParam && codeParam);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-[#1E293B] bg-[#0E1526]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1E293B] transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-[#1E293B]" />
            <PairzenLogo size="sm" />
          </div>

          <Badge variant="violet" size="sm">
            Phase 3 Secure Gateway
          </Badge>
        </div>
      </header>

      {/* Main Join Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-2">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {hasInvitationInUrl ? "Interview Invitation" : "Join Interview Session"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {hasInvitationInUrl
                ? "You have been invited to participate in a collaborative coding interview."
                : "Enter the room identifier to connect to a scheduled or active assessment."}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-4 text-rose-300 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Access Denied</p>
                <p className="text-xs text-rose-200/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {requiresInvitation && !invitationToken && (
            <div className="rounded-xl bg-amber-950/40 border border-amber-800/40 p-4 text-amber-300 flex items-start gap-3 text-xs leading-relaxed animate-in fade-in">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-amber-200">Invitation Link Required</p>
                <p className="mt-0.5">
                  This room is set to <strong>Invite Only</strong>. Please use the complete invitation link provided by your interviewer. If you have the secret token, you may paste it below.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Room Code"
                placeholder="e.g. pz-4829-x9w2"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                helperText="Formatted as pz-XXXX-YYYY."
                required
                autoFocus={!roomCode}
              />

              {(requiresInvitation || Boolean(invitationToken)) && (
                <Input
                  label="Invitation Token"
                  placeholder="Paste invitation token if joining a private room"
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value)}
                  type="password"
                  helperText="Included automatically when clicking an invitation link."
                />
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isJoining}
                  className="w-full font-semibold shadow-lg shadow-violet-900/30"
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  {hasInvitationInUrl ? "Accept Invitation & Enter Room" : "Connect to Room"}
                </Button>
              </div>
            </form>

            <div className="border-t border-[#1E293B] pt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                Authenticated as:
              </span>
              <span className="font-mono text-slate-200 truncate max-w-[180px]">
                {user?.email || "Authenticated User"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B1020] text-slate-300">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
