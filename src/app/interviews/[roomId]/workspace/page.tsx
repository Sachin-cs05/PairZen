"use client";

import React, { useState, useEffect, use, Suspense, useCallback } from "react";
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
import { SafeProblem } from "@/lib/db/models/problem";
import { SafeSubmission } from "@/lib/db/models/submission";
import { useCollabRoom } from "@/lib/collab/use-collab-room";
import {
  WorkspaceToolbar,
  WorkspaceExecutionBadgeStatus,
} from "@/components/workspace/workspace-toolbar";
import { CodeEditor } from "@/components/workspace/code-editor";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceBottomPanel } from "@/components/workspace/workspace-bottom-panel";
import { SupportedLanguage, isSupportedLanguage } from "@/lib/execution/languages";
import { ExecutionResult } from "@/lib/execution/adapter";
import { EvaluationSummary } from "@/lib/execution/evaluator";

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

function WorkspaceContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [room, setRoom] = useState<SafeInterviewRoom | null>(null);
  const [problem, setProblem] = useState<SafeProblem | null>(null);
  const [submissions, setSubmissions] = useState<SafeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Execution & Evaluation States
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("javascript");
  const [stdin, setStdin] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary | null>(null);
  const [bottomPanelTab, setBottomPanelTab] = useState<"console" | "tests" | "diagnostics">("console");
  const [executionBadgeStatus, setExecutionBadgeStatus] = useState<WorkspaceExecutionBadgeStatus>("idle");

  // Load Room Details
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
            const initialLang = data.room.language;
            if (isSupportedLanguage(initialLang)) {
              setSelectedLanguage(initialLang);
            }
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

  // Load Problem Details (once room is loaded)
  useEffect(() => {
    if (!room) return;
    let isMounted = true;
    const problemKey = room.problemId || "two-sum";

    fetch(`/api/problems/${problemKey}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.problem) {
          setProblem(data.problem);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch problem", err);
      });

    return () => {
      isMounted = false;
    };
  }, [room]);

  // Load Room Submissions History
  const fetchSubmissions = useCallback(() => {
    fetch(`/api/interviews/${roomId}/submissions`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.submissions) {
          setSubmissions(data.submissions);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch submissions", err);
      });
  }, [roomId]);

  useEffect(() => {
    if (room) {
      fetchSubmissions();
    }
  }, [room, fetchSubmissions]);

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

  // Action: Run Code
  const handleRunCode = async () => {
    if (isExecuting || isTesting || isSubmitting) return;

    setIsExecuting(true);
    setExecutionBadgeStatus("running");
    setBottomPanelTab("console");

    try {
      const codeSnapshot = collab.getCurrentCode();

      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          language: selectedLanguage,
          sourceCode: codeSnapshot,
          stdin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Execution failed");
      }

      setExecutionResult(data.result);
      if (data.result.status === "completed" && data.result.exitCode === 0) {
        setExecutionBadgeStatus("idle");
      } else if (data.result.status === "compilation_error") {
        setExecutionBadgeStatus("compilation_error");
      } else if (data.result.status === "time_limit_exceeded") {
        setExecutionBadgeStatus("time_limit_exceeded");
      } else {
        setExecutionBadgeStatus("runtime_error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        stdout: "",
        stderr: msg,
        status: "service_unavailable",
        exitCode: 1,
        errorMessage: msg,
      });
      setExecutionBadgeStatus("runtime_error");
    } finally {
      setIsExecuting(false);
    }
  };

  // Action: Run Tests
  const handleRunTests = async () => {
    if (isExecuting || isTesting || isSubmitting) return;

    setIsTesting(true);
    setExecutionBadgeStatus("running");
    setBottomPanelTab("tests");

    try {
      const codeSnapshot = collab.getCurrentCode();

      const res = await fetch(`/api/interviews/${roomId}/run-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem?.id,
          language: selectedLanguage,
          sourceCode: codeSnapshot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Test evaluation failed");
      }

      setEvaluationSummary(data.evaluation);
      if (data.evaluation.status === "accepted") {
        setExecutionBadgeStatus("accepted");
      } else if (data.evaluation.status === "wrong_answer") {
        setExecutionBadgeStatus("wrong_answer");
      } else if (data.evaluation.status === "compilation_error") {
        setExecutionBadgeStatus("compilation_error");
      } else if (data.evaluation.status === "time_limit_exceeded") {
        setExecutionBadgeStatus("time_limit_exceeded");
      } else {
        setExecutionBadgeStatus("runtime_error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEvaluationSummary({
        status: "service_unavailable",
        passedTests: 0,
        totalTests: 0,
        results: [],
        errorMessage: msg,
      });
      setExecutionBadgeStatus("runtime_error");
    } finally {
      setIsTesting(false);
    }
  };

  // Action: Submit Solution
  const handleSubmitSolution = async () => {
    if (isExecuting || isTesting || isSubmitting) return;

    setIsSubmitting(true);
    setExecutionBadgeStatus("running");
    setBottomPanelTab("tests");

    try {
      const codeSnapshot = collab.getCurrentCode();

      const res = await fetch(`/api/interviews/${roomId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem?.id,
          language: selectedLanguage,
          sourceCode: codeSnapshot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      const sub: SafeSubmission = data.submission;
      setEvaluationSummary({
        status: sub.status,
        passedTests: sub.passedTests,
        totalTests: sub.totalTests,
        runtimeMs: sub.runtimeMs,
        memoryKb: sub.memoryKb,
        results: sub.testResults,
      });

      if (sub.status === "accepted") {
        setExecutionBadgeStatus("accepted");
      } else if (sub.status === "wrong_answer") {
        setExecutionBadgeStatus("wrong_answer");
      } else if (sub.status === "compilation_error") {
        setExecutionBadgeStatus("compilation_error");
      } else if (sub.status === "time_limit_exceeded") {
        setExecutionBadgeStatus("time_limit_exceeded");
      } else {
        setExecutionBadgeStatus("runtime_error");
      }

      // Refresh submissions history
      fetchSubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEvaluationSummary({
        status: "service_unavailable",
        passedTests: 0,
        totalTests: 0,
        results: [],
        errorMessage: msg,
      });
      setExecutionBadgeStatus("runtime_error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSubmission = (sub: SafeSubmission) => {
    setEvaluationSummary({
      status: sub.status,
      passedTests: sub.passedTests,
      totalTests: sub.totalTests,
      runtimeMs: sub.runtimeMs,
      memoryKb: sub.memoryKb,
      results: sub.testResults,
    });
    setBottomPanelTab("tests");
  };

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
        language={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        connectionStatus={collab.connectionStatus}
        saveStatus={collab.saveStatus}
        lastSavedAt={collab.lastSavedAt}
        activeParticipants={collab.activeParticipants}
        isReadOnly={isReadOnly}
        onForceSave={collab.forceSave}
        onRunCode={handleRunCode}
        isExecuting={isExecuting}
        onRunTests={handleRunTests}
        isTesting={isTesting}
        onSubmitSolution={handleSubmitSolution}
        isSubmitting={isSubmitting}
        executionBadgeStatus={executionBadgeStatus}
      />

      {/* Main Collaborative Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Monaco Editor Container */}
        <div className="flex-1 h-full overflow-hidden relative">
          <CodeEditor
            language={selectedLanguage}
            isReadOnly={isReadOnly}
            onMountBinding={collab.bindMonacoEditor}
          />
        </div>

        {/* Right Sidebar */}
        <WorkspaceSidebar
          room={room}
          problem={problem}
          submissions={submissions}
          activeParticipants={collab.activeParticipants}
          currentUserId={user?.id}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectSubmission={handleSelectSubmission}
        />
      </div>

      {/* Bottom Console / Test Results / Diagnostics Panel */}
      <WorkspaceBottomPanel
        connectionStatus={collab.connectionStatus}
        saveStatus={collab.saveStatus}
        lastSavedAt={collab.lastSavedAt}
        activeParticipantCount={collab.activeParticipants.length}
        language={selectedLanguage}
        stdin={stdin}
        onStdinChange={setStdin}
        isExecuting={isExecuting}
        executionResult={executionResult}
        onClearOutput={() => setExecutionResult(null)}
        isTesting={isTesting || isSubmitting}
        evaluationSummary={evaluationSummary}
        activeTab={bottomPanelTab}
        onTabChange={setBottomPanelTab}
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
