"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Sparkles,
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PairzenLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [difficulty, setDifficulty] = useState("medium");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [accessPolicy, setAccessPolicy] = useState<"invite_only" | "discoverable">("invite_only");
  const [scheduledAt, setScheduledAt] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/interviews/new");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!title.trim()) {
      setError("Please provide an interview title.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        language,
        difficulty,
        durationMinutes: Number(durationMinutes),
        accessPolicy,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      };

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        setError(data.error || "Failed to create interview room.");
        setIsSubmitting(false);
        return;
      }

      // Navigate to the created room details page
      router.push(`/interviews/${data.room.id}`);
    } catch (err: unknown) {
      console.error("Failed to create room:", err);
      setError("Network or server error while creating room. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100">
      {/* Top Navigation */}
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

          <div className="flex items-center gap-2">
            <Badge variant="violet" size="sm">
              Phase 3 Room Engine
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Create Interview Session
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure room parameters, participant policies, and technical tracks. You will be assigned as the session host and interviewer.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-4 text-rose-300 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Creation Failed</p>
              <p className="text-xs text-rose-200/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              General Information
            </h2>

            <Input
              label="Interview Title"
              placeholder="e.g. Senior Full-Stack Architecture Screen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={fieldErrors.title?.[0]}
              helperText="Give this session a clear descriptive title for candidates and records."
              required
            />

            <Textarea
              label="Session Objectives & Notes (Optional)"
              placeholder="e.g. Focus on distributed systems concurrency, system design, and algorithms."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={fieldErrors.description?.[0]}
              rows={3}
            />
          </div>

          <div className="rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-400" />
              Technical Environment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Primary Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                error={fieldErrors.language?.[0]}
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python 3</option>
                <option value="java">Java 21</option>
                <option value="cpp">C++ 20</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </Select>

              <Select
                label="Difficulty Level"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                error={fieldErrors.difficulty?.[0]}
              >
                <option value="easy">Easy — Foundational</option>
                <option value="medium">Medium — Standard Industry</option>
                <option value="hard">Hard — Advanced / Staff</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Planned Duration"
                value={durationMinutes.toString()}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                error={fieldErrors.durationMinutes?.[0]}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes (Standard)</option>
                <option value="90">90 minutes (In-depth)</option>
                <option value="120">120 minutes (Comprehensive)</option>
              </Select>

              <Input
                label="Scheduled Start Time (Optional)"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                error={fieldErrors.scheduledAt?.[0]}
                helperText="For calendar alignment. Rooms do not auto-activate."
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Security &amp; Access Policy
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setAccessPolicy("invite_only")}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  accessPolicy === "invite_only"
                    ? "bg-violet-950/30 border-violet-500 shadow-md shadow-violet-950/30"
                    : "bg-[#0E1526] border-[#1E293B] hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-slate-100">
                    Invite Only (Recommended)
                  </span>
                  {accessPolicy === "invite_only" && (
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Requires a cryptographic invitation token or prior authorization. Room code alone cannot grant entry.
                </p>
              </div>

              <div
                onClick={() => setAccessPolicy("discoverable")}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  accessPolicy === "discoverable"
                    ? "bg-violet-950/30 border-violet-500 shadow-md shadow-violet-950/30"
                    : "bg-[#0E1526] border-[#1E293B] hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-slate-100">
                    Discoverable
                  </span>
                  {accessPolicy === "discoverable" && (
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Any authenticated candidate possessing the room code can connect as a participant.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="font-semibold shadow-lg shadow-violet-900/40"
            >
              Create Interview Room
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
