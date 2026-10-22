"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Copy, Check, ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newRoomCode: string) => void;
}

export function CreateInterviewModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInterviewModalProps) {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [targetRole, setTargetRole] = useState("Senior Full-Stack Engineer");
  const [language, setLanguage] = useState("typescript");
  const [duration, setDuration] = useState("60");
  const [createdRoom, setCreatedRoom] = useState<{
    id: string;
    roomCode: string;
    invitationUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setError("Please enter the candidate's name");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${targetRole} — ${candidateName.trim()}`,
          description: candidateEmail ? `Candidate: ${candidateEmail}` : "",
          language,
          difficulty: "medium",
          durationMinutes: Number(duration),
          accessPolicy: "invite_only",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create room.");
        setIsSubmitting(false);
        return;
      }

      setCreatedRoom({
        id: data.room.id,
        roomCode: data.room.roomCode,
        invitationUrl: data.invitationUrl,
      });

      onSuccess?.(data.room.roomCode);
    } catch (err: unknown) {
      console.error("Create room error:", err);
      setError("Network error while creating interview room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdRoom) return;
    const url =
      createdRoom.invitationUrl ||
      `${window.location.origin}/join?code=${createdRoom.roomCode}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCreatedRoom(null);
    setCandidateName("");
    setCandidateEmail("");
    onClose();
  };

  const handleGoToRoom = () => {
    if (!createdRoom) return;
    const roomId = createdRoom.id;
    handleReset();
    router.push(`/interviews/${roomId}`);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleReset}
      title={createdRoom ? "Interview Room Initialized" : "Create Interview Session"}
      description={
        createdRoom
          ? "The room has been persisted in MongoDB and is ready for live coordination."
          : "Configure the interview workspace, candidate role, and primary programming language."
      }
      maxWidth="md"
    >
      {createdRoom ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-4 text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Room Created: {createdRoom.roomCode}</span>
            </div>
            <p className="text-xs text-emerald-400/90 leading-relaxed">
              Candidate: <strong className="text-white">{candidateName}</strong> ({targetRole}) • {language.toUpperCase()} • {duration}m
            </p>
          </div>

          <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-2">
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
              Secure Candidate Invitation Link
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={
                  createdRoom.invitationUrl ||
                  `https://pairzen.dev/join?code=${createdRoom.roomCode}`
                }
                className="w-full rounded-lg bg-[#121A2B] border border-[#1E293B] px-3 py-2 text-xs font-mono text-slate-200"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Done
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGoToRoom}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Room Details
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          <Input
            label="Candidate Full Name"
            placeholder="e.g. Maya Lin"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            error={error}
            autoFocus
            required
          />

          <Input
            label="Candidate Email (Optional)"
            type="email"
            placeholder="e.g. maya.lin@example.com"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Target Role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="Junior Full-Stack Engineer">Junior Full-Stack Engineer</option>
              <option value="Senior Full-Stack Engineer">Senior Full-Stack Engineer</option>
              <option value="Staff Backend Engineer">Staff Backend Engineer</option>
              <option value="Frontend Architecture Lead">Frontend Architecture Lead</option>
              <option value="DevOps / SRE Architect">DevOps / SRE Architect</option>
            </Select>

            <Select
              label="Primary Coding Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="typescript">TypeScript 5.6</option>
              <option value="javascript">JavaScript (ESNext)</option>
              <option value="python">Python 3.12</option>
              <option value="go">Go 1.22</option>
              <option value="rust">Rust 1.80</option>
              <option value="java">Java 21 LTS</option>
              <option value="cpp">C++ 20</option>
            </Select>
          </div>

          <Select
            label="Session Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="45">45 Minutes (Fast Screen)</option>
            <option value="60">60 Minutes (Standard Deep Dive)</option>
            <option value="90">90 Minutes (Full System Architecture)</option>
          </Select>

          <div className="pt-4 border-t border-[#1E293B] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Database-backed room creation
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Create Room
              </Button>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
