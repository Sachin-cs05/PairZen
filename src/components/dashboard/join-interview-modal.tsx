"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface JoinInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinInterviewModal({ isOpen, onClose }: JoinInterviewModalProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [requiresInvitation, setRequiresInvitation] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toLowerCase();
    if (!cleanCode) {
      setError("Please enter a valid room code (e.g. pz-9482-arch)");
      return;
    }

    setError("");
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
        setError(data.error || "Failed to join room.");
        if (data.requiresInvitation) {
          setRequiresInvitation(true);
        }
        return;
      }

      // Successfully joined or already enrolled: navigate to room details
      onClose();
      router.push(`/interviews/${data.room.id}`);
    } catch (err: unknown) {
      console.error("Join modal error:", err);
      setIsJoining(false);
      setError("A network error occurred while connecting to room.");
    }
  };

  const handleClose = () => {
    setRoomCode("");
    setInvitationToken("");
    setError("");
    setRequiresInvitation(false);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Join Interview Workspace"
      description="Enter the unique room identifier to connect to an ongoing or scheduled interview."
      maxWidth="md"
    >
      <form onSubmit={handleJoin} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Room Code"
          placeholder="e.g. pz-9482-arch"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          error={error ? " " : undefined}
          helperText="Room codes are formatted as pz-XXXX-YYYY."
          autoFocus
          required
        />

        {(requiresInvitation || Boolean(invitationToken)) && (
          <Input
            label="Invitation Secret Token"
            placeholder="Paste secret token for private rooms"
            value={invitationToken}
            onChange={(e) => setInvitationToken(e.target.value)}
            type="password"
            helperText="Provided inside candidate invitation URLs."
          />
        )}

        <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            End-to-end authenticated session
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isJoining}
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              Connect to Room
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
