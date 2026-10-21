"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Copy, Check } from "lucide-react";
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
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [targetRole, setTargetRole] = useState("Senior Full-Stack Engineer");
  const [language, setLanguage] = useState("typescript");
  const [duration, setDuration] = useState("60");
  const [createdRoom, setCreatedRoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setError("Please enter the candidate's name");
      return;
    }
    setError("");

    // Generate realistic room code
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const room = `pz-${Math.floor(1000 + Math.random() * 9000)}-${randomSuffix}`;
    setCreatedRoom(room);
    onSuccess?.(room);
  };

  const handleCopyLink = () => {
    if (!createdRoom) return;
    navigator.clipboard?.writeText(`https://pairzen.dev/room/${createdRoom}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCreatedRoom(null);
    setCandidateName("");
    setCandidateEmail("");
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleReset}
      title={createdRoom ? "Interview Room Initialized" : "Create Interview Session"}
      description={
        createdRoom
          ? "The room has been configured for live collaborative coding."
          : "Configure the interview workspace, candidate role, and primary programming language."
      }
      maxWidth="md"
    >
      {createdRoom ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-4 text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Room Created: {createdRoom}</span>
            </div>
            <p className="text-xs text-emerald-400/90 leading-relaxed">
              Candidate: <strong className="text-white">{candidateName}</strong> ({targetRole}) • {language.toUpperCase()} • {duration}m
            </p>
          </div>

          <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-2">
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
              Shareable Candidate Access URL
            </span>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`https://pairzen.dev/room/${createdRoom}`}
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

          {/* Phase 1 Scope Clarification */}
          <div className="rounded-lg bg-violet-950/30 border border-violet-800/30 p-3 text-[11px] text-violet-300">
            <strong>Phase 1 Preview Note:</strong> In Phase 2, this action persists metadata to MongoDB and establishes a Socket.IO room with multi-user presence and Monaco Editor integration.
          </div>

          <div className="flex justify-end pt-3 border-t border-[#1E293B]">
            <Button variant="primary" size="sm" onClick={handleReset}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Candidate Full Name"
            placeholder="e.g. Maya Lin"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            error={error}
            autoFocus
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
              Safe ephemeral room generation
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Generate Room
              </Button>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
