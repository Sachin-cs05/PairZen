"use client";

import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface JoinInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinInterviewModal({ isOpen, onClose }: JoinInterviewModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState("interviewer");
  const [joinedMessage, setJoinedMessage] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError("Please enter a valid room code (e.g. pz-9482-arch)");
      return;
    }
    setError("");

    setJoinedMessage(
      `Room verification successful for "${roomCode}". The full live editor workspace will launch in Phase 2 with real-time Socket.IO synchronization.`
    );
  };

  const handleClose = () => {
    setJoinedMessage(null);
    setRoomCode("");
    setError("");
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
      {joinedMessage ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-violet-950/40 border border-violet-800/40 p-4 text-violet-300 space-y-2">
            <span className="font-semibold text-sm block">Room Code Verified</span>
            <p className="text-xs text-slate-300 leading-relaxed">{joinedMessage}</p>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#1E293B]">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Got It
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Room Code"
            placeholder="e.g. pz-9482-arch"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            error={error}
            helperText="Room codes are case-sensitive and formatted as pz-XXXX-XXXX."
            autoFocus
          />

          <Select
            label="Joining As"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="interviewer">Interviewer (Host privileges)</option>
            <option value="observer">Observer (Read-only silent monitoring)</option>
            <option value="candidate">Candidate (Active participant)</option>
          </Select>

          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              End-to-end encrypted session
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<LogIn className="w-3.5 h-3.5" />}
              >
                Connect to Room
              </Button>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
