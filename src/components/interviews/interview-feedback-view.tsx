"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Award,
  BookOpen,
  Edit3,
  Save,
  Loader2,
  FileCheck,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { SafeInterviewFeedback } from "@/lib/db/models/interview-feedback";
import { Button } from "@/components/ui/button";

interface InterviewFeedbackViewProps {
  roomId: string;
  isInterviewer: boolean;
  roomStatus: string;
}

export function InterviewFeedbackView({
  roomId,
  isInterviewer,
  roomStatus,
}: InterviewFeedbackViewProps) {
  const [feedback, setFeedback] = useState<SafeInterviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interviews/${roomId}/feedback`);
      const data = await res.json();
      if (res.ok && data.feedback) {
        setFeedback(data.feedback);
        setNotesInput(data.feedback.interviewerNotes || "");
      }
    } catch (err: unknown) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${roomId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerNotes: notesInput || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate feedback report");
      }

      setFeedback(data.feedback);
      setNotesInput(data.feedback.interviewerNotes || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/interviews/${roomId}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerNotes: notesInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save notes");
      }

      setFeedback(data.feedback);
      setIsEditingNotes(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update notes";
      setError(msg);
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 rounded-2xl bg-[#121A2B] border border-[#1E293B] text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-violet-400 mr-2" />
        <span className="text-xs">Checking interview feedback reports...</span>
      </div>
    );
  }

  // Not generated yet view
  if (!feedback) {
    return (
      <div className="rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Post-Interview Evaluation & AI Feedback</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Generate an objective, evidence-grounded performance report based on the candidate&apos;s authoritative code submissions, test case pass counts, algorithmic complexity, and structure.
            </p>
          </div>

          {isInterviewer && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4 text-violet-200" />}
            >
              Generate Feedback Report
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-[#0B1020] p-3 text-[11px] text-slate-400 border border-[#1E293B]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Fairness Guarantee:</strong> Reports strictly avoid speculative personality claims or automated hiring decisions. Evaluations are based entirely on observable engineering artifacts.
          </span>
        </div>
      </div>
    );
  }

  // Full Generated Feedback Report View
  return (
    <div className="rounded-2xl bg-[#121A2B] border border-[#1E293B] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-violet-400" />
              <span>Post-Interview Assessment Report</span>
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                feedback.status === "reviewed"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-sky-500/10 text-sky-400 border-sky-500/20"
              }`}
            >
              {feedback.status === "reviewed" ? "Reviewed by Interviewer" : "AI Generated"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Generated on {new Date(feedback.generatedAt).toLocaleString()}
          </p>
        </div>

        {isInterviewer && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            isLoading={isGenerating}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-violet-400" />}
          >
            Regenerate Report
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Executive Summary */}
      <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Executive Summary
        </h4>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {feedback.summary}
        </p>
      </div>

      {/* Grid: Code Correctness & Code Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Verified Code Correctness */}
        <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Code Correctness
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {feedback.codeCorrectness.passPercentage}% Pass Rate
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tests Passed:</span>
              <span className="text-slate-200 font-semibold font-mono">
                {feedback.codeCorrectness.passedTests} / {feedback.codeCorrectness.totalTests}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 pt-1">
              {feedback.codeCorrectness.notes}
            </p>
          </div>
        </div>

        {/* Card 2: Code Quality Scores */}
        <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Code Quality Rubric
            </span>
            <span className="text-xs text-slate-400">Scale 1-10</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-[#121A2B] p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block">Readability</span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {feedback.codeQuality.readabilityScore} / 10
              </span>
            </div>
            <div className="rounded-lg bg-[#121A2B] p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block">Maintainability</span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {feedback.codeQuality.maintainabilityScore} / 10
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Algorithmic Approach & Complexity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Approach Evaluation */}
        <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-2.5 text-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-sky-400" />
            Algorithmic Approach
          </span>
          <p className="text-slate-300 leading-relaxed">
            {feedback.approachEvaluation.summary}
          </p>

          {feedback.approachEvaluation.strengths?.length > 0 && (
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                Demonstrated Strengths:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                {feedback.approachEvaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Complexity Analysis */}
        <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-2.5 text-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-violet-400" />
            Asymptotic Complexity
          </span>

          <div className="grid grid-cols-2 gap-2 text-center py-1">
            <div className="rounded bg-[#121A2B] p-2">
              <span className="text-[10px] text-slate-500 block">Time Complexity</span>
              <span className="text-sm font-bold font-mono text-violet-300">
                {feedback.complexityAnalysis.timeComplexity}
              </span>
            </div>
            <div className="rounded bg-[#121A2B] p-2">
              <span className="text-[10px] text-slate-500 block">Space Complexity</span>
              <span className="text-sm font-bold font-mono text-violet-300">
                {feedback.complexityAnalysis.spaceComplexity}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {feedback.complexityAnalysis.notes}
          </p>
        </div>
      </div>

      {/* Edge-Case Awareness & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Edge Cases */}
        <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Edge-Case Awareness
          </span>
          <p className="text-slate-300 leading-relaxed font-sans">
            {feedback.edgeCaseAwareness}
          </p>
        </div>

        {/* Recommendations */}
        <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-sky-400" />
            Development Recommendations
          </span>
          <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
            {feedback.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Qualitative Interviewer Notes Section */}
      <div className="rounded-xl bg-[#0B1020] border border-[#1E293B] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-violet-400" />
            Interviewer Observations & Notes
          </span>
          {isInterviewer && !isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              Edit Notes
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Add qualitative interviewer notes, verbal reasoning observations, or team fit notes..."
              rows={4}
              maxLength={4096}
              className="w-full rounded-lg border border-[#1E293B] bg-[#121A2B] p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNotes(false)}
                disabled={isSavingNotes}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                isLoading={isSavingNotes}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Notes
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-300 italic whitespace-pre-line leading-relaxed">
            {feedback.interviewerNotes || "No manual interviewer notes recorded yet."}
          </p>
        )}
      </div>

      {/* Verified Artifact References Footer */}
      {feedback.evidenceReferences && (
        <div className="pt-2 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            Verified Evidence: Submission ID {feedback.evidenceReferences.submissionId || "N/A"}
          </span>
          <span>{feedback.evidenceReferences.testSummary}</span>
        </div>
      )}
    </div>
  );
}
